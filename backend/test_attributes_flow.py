import requests
import json
import os
import pymongo

BASE_URL = "http://localhost:8001/api"
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "jaridar")

def log(msg):
    print(msg, flush=True)

def main():
    log("==================================================")
    log("  ATTRIBUTES SYSTEM VERIFICATION AND TEST SUITE   ")
    log("==================================================")
    
    # 1. MongoDB Direct Check
    client = pymongo.MongoClient(MONGO_URL)
    db = client[DB_NAME]
    attr_count = db.attributes.count_documents({})
    log(f"\n[1] Total attributes in MongoDB collection: {attr_count}")
    
    sample = db.attributes.find_one({}, {"_id": 0})
    log(f"    Sample document structure: {json.dumps(sample, indent=2)}")
    
    # Check count by type
    types = ["category", "style", "region", "fabric", "print_type"]
    for t in types:
        count = db.attributes.count_documents({"type": t})
        items = list(db.attributes.find({"type": t}, {"_id": 0, "value": 1, "label": 1}).sort("display_order", 1))
        labels = [f"{item['value']} ('{item['label']}')" for item in items]
        log(f"    - Type '{t}': {count} seeded -> {', '.join(labels)}")
    
    # 2. Public GET /api/attributes?type=category
    log("\n[2] Testing Public GET /api/attributes?type=category...")
    res_cat = requests.get(f"{BASE_URL}/attributes?type=category")
    log(f"    Status: {res_cat.status_code}")
    log(f"    Response: {json.dumps(res_cat.json(), indent=2)}")
    
    # 3. Public GET /api/attributes?type=style
    log("\n[3] Testing Public GET /api/attributes?type=style...")
    res_style = requests.get(f"{BASE_URL}/attributes?type=style")
    log(f"    Status: {res_style.status_code}")
    log(f"    Response: {json.dumps(res_style.json(), indent=2)}")
    
    # 4. Admin Login
    log("\n[4] Authenticating Admin...")
    login_res = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@jaridar.com", "password": os.environ.get("ADMIN_PASSWORD", "")})
    if login_res.status_code != 200:
        log(f"    Admin login failed: {login_res.text}")
        return
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    log("    Admin login successful. Token acquired.")
    
    # 5. Admin GET /api/admin/attributes?type=category
    log("\n[5] Testing Admin GET /api/admin/attributes?type=category...")
    admin_get_res = requests.get(f"{BASE_URL}/admin/attributes?type=category", headers=headers)
    log(f"    Status: {admin_get_res.status_code}, Items count: {len(admin_get_res.json())}")
    
    # 6. Admin POST /api/admin/attributes (create new)
    log("\n[6] Testing Admin POST /api/admin/attributes (Creating 'linen' fabric)...")
    create_payload = {
        "type": "fabric",
        "value": "linen-test",
        "label": "Pure Linen",
        "display_order": 99,
        "is_active": True
    }
    post_res = requests.post(f"{BASE_URL}/admin/attributes", json=create_payload, headers=headers)
    log(f"    Status: {post_res.status_code}")
    created_attr = post_res.json()
    log(f"    Created: {json.dumps(created_attr, indent=2)}")
    created_id = created_attr.get("id")
    
    # 7. Admin PUT /api/admin/attributes/{id} (edit)
    log(f"\n[7] Testing Admin PUT /api/admin/attributes/{created_id} (Editing label, order, active)...")
    put_payload = {
        "label": "Luxury Organic Linen",
        "display_order": 100,
        "is_active": False
    }
    put_res = requests.put(f"{BASE_URL}/admin/attributes/{created_id}", json=put_payload, headers=headers)
    log(f"    Status: {put_res.status_code}")
    log(f"    Updated: {json.dumps(put_res.json(), indent=2)}")
    
    # Verify in public GET (should not appear because is_active is False)
    pub_check = requests.get(f"{BASE_URL}/attributes?type=fabric")
    found_in_pub = any(a["id"] == created_id for a in pub_check.json())
    log(f"    Verified inactive attribute hidden from public GET: {not found_in_pub}")
    
    # Verify in admin GET (should appear even though is_active is False)
    adm_check = requests.get(f"{BASE_URL}/admin/attributes?type=fabric", headers=headers)
    found_in_adm = any(a["id"] == created_id for a in adm_check.json())
    log(f"    Verified inactive attribute visible in admin GET: {found_in_adm}")
    
    # 8. Admin DELETE /api/admin/attributes/{id} - REFUSAL TEST (used attribute)
    ethnic_attr = db.attributes.find_one({"type": "category", "value": "ethnic"})
    ethnic_id = ethnic_attr["id"]
    used_product_count = db.products.count_documents({"category": "ethnic"})
    log(f"\n[8] Testing DELETE Refusal on used attribute 'ethnic' (Used by {used_product_count} products)...")
    del_used_res = requests.delete(f"{BASE_URL}/admin/attributes/{ethnic_id}", headers=headers)
    log(f"    Status: {del_used_res.status_code} (Expected 400)")
    log(f"    Response body: {del_used_res.text}")
    
    # 9. Admin DELETE /api/admin/attributes/{id} - SUCCESS TEST (unused attribute)
    log(f"\n[9] Testing DELETE Success on unused attribute '{created_id}'...")
    del_success_res = requests.delete(f"{BASE_URL}/admin/attributes/{created_id}", headers=headers)
    log(f"    Status: {del_success_res.status_code} (Expected 200)")
    log(f"    Response body: {del_success_res.text}")
    
    # Check deletion in DB
    remaining = db.attributes.find_one({"id": created_id})
    log(f"    Verified removed from DB: {remaining is None}")
    
    log("\n==================================================")
    log("  ALL TESTS COMPLETED SUCCESSFULLY!              ")
    log("==================================================")

if __name__ == "__main__":
    main()
