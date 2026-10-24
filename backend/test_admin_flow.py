import json
import sys
import os
from pathlib import Path
import pymongo
import requests

# Check ports
PORT_8001_URL = "http://localhost:8001/api"
PORT_8000_URL = "http://localhost:8000/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "jaridar")

def log(msg):
    print(msg, flush=True)

def http_request(method, url, headers=None, json_data=None, params=None):
    if headers is None:
        headers = {}
    try:
        resp = requests.request(method, url, headers=headers, json=json_data, params=params, timeout=10)
        try:
            body = resp.json()
        except Exception:
            body = resp.text
        return resp.status_code, body
    except Exception as e:
        log(f"HTTP Error {method} {url}: {e}")
        return 0, str(e)

results = {}

def log_step(step_name, passed, message=""):
    results[step_name] = {"passed": passed, "message": message}
    status_str = "PASS" if passed else "FAIL"
    log(f"[{status_str}] {step_name}: {message}")

def cleanup_db_direct(test_product_name="ZZ TEST PRODUCT 123", temp_email="testcustomer2@example.com"):
    try:
        client = pymongo.MongoClient(MONGO_URL, serverSelectionTimeoutMS=3000)
        db = client[DB_NAME]
        res_prod = db.products.delete_many({"name": test_product_name})
        res_user = db.users.delete_many({"email": temp_email})
        log(f"[CLEANUP] Deleted {res_prod.deleted_count} leftover test product(s), {res_user.deleted_count} temp user(s)")
    except Exception as e:
        log(f"[CLEANUP ERROR] {e}")

def get_product_count(base_url):
    status_code, body = http_request("GET", f"{base_url}/products", params={"limit": 1000})
    if status_code == 200 and isinstance(body, list):
        return len(body)
    return -1

def main():
    log("=== STARTING ADMIN PRODUCT FLOW TEST ===")
    
    # Check port 8001 vs 8000
    code_8001, body_8001 = http_request("GET", f"{PORT_8001_URL}/")
    code_8000, body_8000 = http_request("GET", f"{PORT_8000_URL}/")
    
    log(f"Port 8001 response: {code_8001} -> {body_8001}")
    log(f"Port 8000 response: {code_8000} -> {body_8000}")
    
    if isinstance(body_8000, dict) and "Jaridar" in body_8000.get("message", ""):
        BASE_URL = PORT_8000_URL
        log(f"[PORT CHECK] Jaridar backend is active on http://localhost:8000/api (matches frontend REACT_APP_BACKEND_URL). Using port 8000.")
    elif isinstance(body_8001, dict) and "Jaridar" in body_8001.get("message", ""):
        BASE_URL = PORT_8001_URL
        log(f"[PORT CHECK] Jaridar backend is active on http://localhost:8001/api. Using port 8001.")
    else:
        # If neither has Jaridar message, fallback to 8001 as requested
        BASE_URL = PORT_8001_URL
        log(f"[PORT CHECK] Warning: Jaridar message not found on 8000 or 8001. Using {BASE_URL}.")

    # 0. Initial Clean State
    cleanup_db_direct()
    initial_count = get_product_count(BASE_URL)
    log(f"Initial product count in Jaridar database: {initial_count}")
    
    admin_token = None
    created_product_id = None
    test_product_name = "ZZ TEST PRODUCT 123"
    temp_customer_email = "testcustomer2@example.com"
    customer_token = None
    
    # Step a) Admin Login -> token works
    log("Running Step 3a: Admin Login...")
    try:
        status_code, body = http_request(
            "POST",
            f"{BASE_URL}/auth/login",
            json_data={"email": "admin@jaridar.com", "password": os.environ.get("ADMIN_PASSWORD", "")}
        )
        if status_code == 200 and isinstance(body, dict) and "token" in body:
            user_data = body.get("user", {})
            if user_data.get("is_admin") is True or user_data.get("isAdmin") is True:
                admin_token = body["token"]
                log_step("Step 3a: Admin Login", True, f"Token received successfully. User: {user_data.get('email')}, is_admin: True")
            else:
                log_step("Step 3a: Admin Login", False, f"Login succeeded but is_admin is not True: {user_data}")
        else:
            log_step("Step 3a: Admin Login", False, f"Expected 200 with admin token, got {status_code}: {body}")
    except Exception as e:
        log_step("Step 3a: Admin Login", False, f"Exception: {e}")

    admin_headers = {"Authorization": f"Bearer {admin_token}"} if admin_token else {}

    # Step b) CREATE product
    log("Running Step 3b: CREATE product...")
    product_payload = {
        "name": test_product_name,
        "description": "Exclusive test western dress in banarasi cotton fabric with printed patterns.",
        "category": "western",
        "style": "casual",
        "fabric": "cotton",
        "print_type": "printed",
        "region": "banarasi",
        "price": 999.0,
        "original_price": 1499.0,
        "is_new": True,
        "featured": True,
        "images": ["/images/products/pink-kurta-1.jpg"],
        "sizes": ["S", "M", "L", "XL"],
        "colors": ["Pink", "Rose"],
        "stock": 10
    }
    
    try:
        status_code, body = http_request(
            "POST",
            f"{BASE_URL}/admin/products",
            headers=admin_headers,
            json_data=product_payload
        )
        if status_code in (200, 201) and isinstance(body, dict) and body.get("name") == test_product_name:
            created_product_id = body.get("id")
            # Verify fields
            fields_match = (
                body.get("category") == "western" and
                body.get("style") == "casual" and
                body.get("fabric") == "cotton" and
                body.get("print_type") == "printed" and
                body.get("region") == "banarasi" and
                float(body.get("price", 0)) == 999.0 and
                float(body.get("original_price", 0)) == 1499.0 and
                body.get("is_new") is True and
                body.get("featured") is True and
                body.get("images") == ["/images/products/pink-kurta-1.jpg"] and
                body.get("sizes") == ["S", "M", "L", "XL"] and
                body.get("colors") == ["Pink", "Rose"]
            )
            if fields_match and created_product_id:
                log_step("Step 3b: Create Product", True, f"Product created with ID {created_product_id} and all fields verified.")
            else:
                log_step("Step 3b: Create Product", False, f"Product created but field mismatch: {body}")
        else:
            log_step("Step 3b: Create Product", False, f"HTTP {status_code}: {body}")
    except Exception as e:
        log_step("Step 3b: Create Product", False, f"Exception: {e}")

    # Step c) LIST products
    log("Running Step 3c: LIST products...")
    try:
        status_code, body = http_request("GET", f"{BASE_URL}/products", params={"limit": 1000})
        if status_code == 200 and isinstance(body, list):
            new_count = len(body)
            matching = [p for p in body if p.get("name") == test_product_name]
            count_increased = (new_count == initial_count + 1)
            appears_once = (len(matching) == 1)
            
            if count_increased and appears_once:
                p = matching[0]
                fields_ok = (
                    p.get("category") == "western" and
                    p.get("style") == "casual" and
                    p.get("fabric") == "cotton" and
                    p.get("print_type") == "printed" and
                    p.get("region") == "banarasi" and
                    float(p.get("price", 0)) == 999.0 and
                    float(p.get("original_price", 0)) == 1499.0 and
                    p.get("is_new") is True and
                    p.get("featured") is True
                )
                if fields_ok:
                    log_step("Step 3c: List Products", True, f"Appears exactly once, count increased from {initial_count} to {new_count}, all fields persisted.")
                else:
                    log_step("Step 3c: List Products", False, f"Field mismatch in listed product: {p}")
            else:
                log_step("Step 3c: List Products", False, f"Count increased: {count_increased} ({initial_count}->{new_count}), Occurrences: {len(matching)}")
        else:
            log_step("Step 3c: List Products", False, f"HTTP {status_code}: {body}")
    except Exception as e:
        log_step("Step 3c: List Products", False, f"Exception: {e}")

    # Step d) Shop Filters
    log("Running Step 3d: Shop Filters...")
    filters_to_test = [
        ("category=western", {"category": "western"}, True),
        ("fabric=cotton", {"fabric": "cotton"}, True),
        ("region=banarasi", {"region": "banarasi"}, True),
        ("print_type=printed", {"print_type": "printed"}, True),
        ("style=casual", {"style": "casual"}, True),
        ("is_new=true", {"is_new": "true"}, True),
        ("fabric=silk (Negative match)", {"fabric": "silk"}, False),
    ]

    all_filters_passed = True
    filter_details = []

    for name, params, should_match in filters_to_test:
        try:
            status_code, body = http_request("GET", f"{BASE_URL}/products", params=params)
            if status_code == 200 and isinstance(body, list):
                has_test_prod = any(p.get("name") == test_product_name for p in body)
                if has_test_prod == should_match:
                    filter_details.append(f"{name}: OK")
                else:
                    all_filters_passed = False
                    filter_details.append(f"{name}: FAILED (expected {should_match}, got {has_test_prod})")
            else:
                all_filters_passed = False
                filter_details.append(f"{name}: HTTP {status_code}")
        except Exception as e:
            all_filters_passed = False
            filter_details.append(f"{name}: Exception {e}")

    log_step("Step 3d: Shop Filters", all_filters_passed, "; ".join(filter_details))

    # Step e) EDIT Product
    log("Running Step 3e: EDIT Product...")
    try:
        if created_product_id:
            update_payload = {
                "price": 1199.0,
                "is_new": False
            }
            status_code, body = http_request(
                "PUT",
                f"{BASE_URL}/admin/products/{created_product_id}",
                headers=admin_headers,
                json_data=update_payload
            )
            if status_code == 200:
                get_code, get_body = http_request("GET", f"{BASE_URL}/products/{created_product_id}")
                if get_code == 200 and isinstance(get_body, dict):
                    price_ok = (float(get_body.get("price", 0)) == 1199.0)
                    is_new_ok = (get_body.get("is_new") is False)
                    if price_ok and is_new_ok:
                        log_step("Step 3e: Edit Product", True, f"Price updated to 1199 and is_new updated to False, verified in GET /products/{created_product_id}.")
                    else:
                        log_step("Step 3e: Edit Product", False, f"GET single product mismatch: price={get_body.get('price')}, is_new={get_body.get('is_new')}")
                else:
                    log_step("Step 3e: Edit Product", False, f"GET single product failed: HTTP {get_code}: {get_body}")
            else:
                log_step("Step 3e: Edit Product", False, f"PUT failed: HTTP {status_code}: {body}")
        else:
            log_step("Step 3e: Edit Product", False, "Skipped (product was not created)")
    except Exception as e:
        log_step("Step 3e: Edit Product", False, f"Exception: {e}")

    # Step f) Negative checks
    log("Running Step 3f: Negative Checks...")
    neg_passed = True
    neg_details = []

    try:
        dummy_prod = dict(product_payload)
        dummy_prod["name"] = "ZZ UNAUTHORIZED TEST PROD"

        # 1. No token
        code_no_auth, body_no_auth = http_request(
            "POST",
            f"{BASE_URL}/admin/products",
            json_data=dummy_prod
        )
        if code_no_auth in (401, 403):
            neg_details.append(f"Without token rejected (HTTP {code_no_auth})")
        else:
            neg_passed = False
            neg_details.append(f"Without token expected 401/403, got {code_no_auth}")

        # 2. Register temporary customer
        reg_code, reg_body = http_request(
            "POST",
            f"{BASE_URL}/auth/register",
            json_data={
                "name": "Test Customer",
                "email": temp_customer_email,
                "password": "Test@12345"
            }
        )
        if reg_code == 200 and isinstance(reg_body, dict) and "token" in reg_body:
            customer_token = reg_body["token"]
        else:
            login_code, login_body = http_request(
                "POST",
                f"{BASE_URL}/auth/login",
                json_data={
                    "email": temp_customer_email,
                    "password": "Test@12345"
                }
            )
            if login_code == 200 and isinstance(login_body, dict) and "token" in login_body:
                customer_token = login_body["token"]

        if customer_token:
            cust_headers = {"Authorization": f"Bearer {customer_token}"}
            code_cust, body_cust = http_request(
                "POST",
                f"{BASE_URL}/admin/products",
                headers=cust_headers,
                json_data=dummy_prod
            )
            if code_cust in (401, 403):
                neg_details.append(f"Customer token rejected (HTTP {code_cust})")
            else:
                neg_passed = False
                neg_details.append(f"Customer token expected 401/403, got {code_cust}")
        else:
            neg_passed = False
            neg_details.append("Could not obtain customer token")

        log_step("Step 3f: Negative Checks", neg_passed, "; ".join(neg_details))
    except Exception as e:
        log_step("Step 3f: Negative Checks", False, f"Exception: {e}")

    # Step g) DELETE Product
    log("Running Step 3g: DELETE Product...")
    try:
        if created_product_id:
            del_code, del_body = http_request(
                "DELETE",
                f"{BASE_URL}/admin/products/{created_product_id}",
                headers=admin_headers
            )
            if del_code == 200:
                get_code, _ = http_request("GET", f"{BASE_URL}/products/{created_product_id}")
                final_count = get_product_count(BASE_URL)
                
                is_gone = (get_code == 404)
                count_restored = (final_count == initial_count)
                
                if is_gone and count_restored:
                    log_step("Step 3g: Delete Product", True, f"Product deleted, GET returns 404, count restored to {final_count} (original: {initial_count}).")
                else:
                    log_step("Step 3g: Delete Product", False, f"is_gone={is_gone} (HTTP {get_code}), count_restored={count_restored} (count={final_count}, expected={initial_count})")
            else:
                log_step("Step 3g: Delete Product", False, f"DELETE failed: HTTP {del_code}: {del_body}")
        else:
            log_step("Step 3g: Delete Product", False, "Skipped (product was not created)")
    except Exception as e:
        log_step("Step 3g: Delete Product", False, f"Exception: {e}")

    # Step h) Delete temp customer account
    log("Running Step 3h: Delete Temp Customer Account...")
    try:
        client = pymongo.MongoClient(MONGO_URL, serverSelectionTimeoutMS=3000)
        db = client[DB_NAME]
        res_user = db.users.delete_many({"email": temp_customer_email})
        log_step("Step 3h: Delete Temp Customer", True, f"Deleted {res_user.deleted_count} temporary test customer account(s).")
    except Exception as e:
        log_step("Step 3h: Delete Temp Customer", False, f"Exception: {e}")

    # Final Verification
    final_count = get_product_count(BASE_URL)
    status_code, all_prods = http_request("GET", f"{BASE_URL}/products", params={"limit": 1000})
    remaining_zz = [p for p in all_prods if "ZZ TEST" in p.get("name", "")] if status_code == 200 else []

    log("\n=== FINAL TEST SUMMARY ===")
    log(f"Original product count: {initial_count}")
    log(f"Final product count: {final_count}")
    log(f"Remaining 'ZZ TEST' products: {len(remaining_zz)}")
    log(f"Overall result: {'ALL PASSED' if all(r['passed'] for r in results.values()) else 'SOME FAILED'}")

    summary_data = {
        "initial_count": initial_count,
        "final_count": final_count,
        "remaining_test_products": len(remaining_zz),
        "results": results
    }
    with open("test_results.json", "w") as f:
        json.dump(summary_data, f, indent=2)

if __name__ == "__main__":
    main()
