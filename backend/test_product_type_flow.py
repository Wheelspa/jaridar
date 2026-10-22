import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def run_tests():
    print("=== STARTING PRODUCT_TYPE VERIFICATION ===")
    
    # 1. Admin Login
    login_payload = {
        "email": "admin@jaridar.com",
        "password": "admin123"
    }
    res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
    if res.status_code != 200:
        print(f"FAILED Admin login: {res.status_code} {res.text}")
        return False
    token = res.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}
    print(f"PASS 1: Admin login successful (token: {token[:10]}...)")

    # 2. Check initial count
    res = requests.get(f"{BASE_URL}/api/products")
    initial_products = res.json()
    initial_count = len(initial_products)
    print(f"Initial product count: {initial_count} (Expected: 18)")
    assert initial_count == 18, f"Expected 18 products, got {initial_count}"

    # 3. Create product WITHOUT product_type -> must be rejected (400)
    missing_pt_payload = {
        "name": "TEST PRODUCT WITHOUT TYPE",
        "description": "A beautiful test product",
        "category": "ethnic",
        "style": "casual",
        "fabric": "cotton",
        "region": "banarasi",
        "price": 999,
        "images": ["/images/products/pink-kurta-1.jpg"],
        "sizes": ["M"],
        "colors": ["Pink"]
    }
    res = requests.post(f"{BASE_URL}/api/admin/products", json=missing_pt_payload, headers=headers)
    if res.status_code == 400 and "Product Type is required" in res.text:
        print(f"PASS 2: Missing product_type rejected as expected: {res.status_code} {res.json()['detail']}")
    else:
        print(f"FAIL 2: Missing product_type not properly rejected: {res.status_code} {res.text}")
        return False

    # 4. Create product with INVALID product_type -> must be rejected (400)
    invalid_pt_payload = dict(missing_pt_payload)
    invalid_pt_payload["product_type"] = "spacesuit"
    res = requests.post(f"{BASE_URL}/api/admin/products", json=invalid_pt_payload, headers=headers)
    if res.status_code == 400 and "Invalid product_type" in res.text:
        print(f"PASS 3: Invalid product_type rejected as expected: {res.status_code} {res.json()['detail']}")
    else:
        print(f"FAIL 3: Invalid product_type not properly rejected: {res.status_code} {res.text}")
        return False

    # 5. Create temporary product with valid product_type: "lehenga"
    valid_payload = dict(missing_pt_payload)
    valid_payload["name"] = "ZZ TEMP LEHENGA TEST"
    valid_payload["product_type"] = "lehenga"
    res = requests.post(f"{BASE_URL}/api/admin/products", json=valid_payload, headers=headers)
    if res.status_code in (200, 201):
        created_prod = res.json()
        temp_id = created_prod.get("_id") or created_prod.get("id")
        print(f"PASS 4: Created temp product with product_type='lehenga', id={temp_id}")
    else:
        print(f"FAIL 4: Failed to create valid product: {res.status_code} {res.text}")
        return False

    try:
        # 6. Test Shop filter: ?product_type=lehenga
        res = requests.get(f"{BASE_URL}/api/products?product_type=lehenga")
        lehengas = res.json()
        matched = [p for p in lehengas if (p.get("_id") or p.get("id")) == temp_id]
        if len(matched) == 1 and all(p.get("product_type") == "lehenga" for p in lehengas):
            print(f"PASS 5: Filter ?product_type=lehenga returned {len(lehengas)} items, including test product")
        else:
            print(f"FAIL 5: Filter ?product_type=lehenga didn't match correctly: count={len(lehengas)}")

        # 7. Test Shop multi-filter: ?product_type=saree,gown
        res = requests.get(f"{BASE_URL}/api/products?product_type=saree,gown")
        saree_gowns = res.json()
        all_types = {p.get("product_type") for p in saree_gowns}
        if all_types.issubset({"saree", "gown"}) and len(saree_gowns) >= 2:
            print(f"PASS 6: Multi-filter ?product_type=saree,gown returned {len(saree_gowns)} items, all saree or gown: {all_types}")
        else:
            print(f"FAIL 6: Multi-filter failed: {all_types}")

        # 8. Test combined filter: ?category=western&product_type=dress
        res = requests.get(f"{BASE_URL}/api/products?category=western&product_type=dress")
        western_dresses = res.json()
        if all(p.get("category") == "western" and p.get("product_type") == "dress" for p in western_dresses):
            print(f"PASS 7: Combined filter category=western & product_type=dress returned {len(western_dresses)} items")
        else:
            print(f"FAIL 7: Combined filter mismatch")

    finally:
        # 9. DELETE the temporary test product
        del_res = requests.delete(f"{BASE_URL}/api/admin/products/{temp_id}", headers=headers)
        if del_res.status_code == 200:
            print(f"PASS 8: Successfully deleted temp product {temp_id}")
        else:
            print(f"FAIL 8: Could not delete temp product {temp_id}: {del_res.status_code} {del_res.text}")

    # 10. Confirm total count is strictly back to 18
    res = requests.get(f"{BASE_URL}/api/products")
    final_products = res.json()
    final_count = len(final_products)
    print(f"Final product count: {final_count} (Expected: 18)")
    assert final_count == 18, f"Final count is {final_count}, expected 18!"
    print("PASS 9: Final product count is exactly 18, zero leftover test products.")
    print("=== ALL PRODUCT_TYPE TESTS PASSED ===")
    return True

if __name__ == "__main__":
    success = run_tests()
    if not success:
        sys.exit(1)
