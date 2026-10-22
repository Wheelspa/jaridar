import json
import os
import sys
import pymongo

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "jaridar")

ALLOWED_PRODUCT_TYPES = [
    'saree', 'lehenga', 'kurta-set', 'salwar-suit', 'gown',
    'co-ord-set', 'dress', 'top-shirt', 'jumpsuit', 'dupatta', 'other'
]

def infer_product_type(name: str, subcategory: str = "") -> str:
    name_lower = (name or "").lower()
    sub_lower = (subcategory or "").lower()
    combined = f"{name_lower} {sub_lower}"

    # 1. Saree
    if "saree" in combined or "sari" in combined:
        return "saree"

    # 2. Lehenga
    if any(k in combined for k in ["lehenga", "lehnga", "ghagra", "lehnagas"]):
        return "lehenga"

    # 3. Gown
    if "gown" in combined:
        return "gown"

    # 4. Jumpsuit
    if "jumpsuit" in combined:
        return "jumpsuit"

    # 5. Kurta / Kurti
    if any(k in combined for k in ["kurta", "kurti"]):
        return "kurta-set"

    # 6. Salwar Suit / Sharara / Anarkali
    if any(k in combined for k in ["sharara", "anarkali", "salwar", "suit"]):
        return "salwar-suit"

    # 7. Co-ord Set / Palazzo set / Jacket set
    if any(k in combined for k in ["co-ord", "coord", "set", "palazzo"]):
        return "co-ord-set"

    # 8. Dress
    if "dress" in combined:
        return "dress"

    # 9. Top / Shirt / Jacket / Blazer
    if any(k in combined for k in ["top", "shirt", "blazer", "jacket"]):
        return "top-shirt"

    # 10. Dupatta / Stole
    if any(k in combined for k in ["dupatta", "stole"]):
        return "dupatta"

    return "other"

def run_migration(apply_changes=False):
    client = pymongo.MongoClient(MONGO_URL, serverSelectionTimeoutMS=3000)
    db = client[DB_NAME]
    products = list(db.products.find({}))
    
    mode_str = "APPLY MODE" if apply_changes else "DRY-RUN MODE"
    print(f"\n==================== MIGRATION TABLE ({mode_str}) ====================")
    header = f"{'#':<3} | {'Product Name':<38} | {'Subcategory':<20} | {'Inferred Product Type':<16}"
    print(header)
    print("-" * len(header))

    updated_count = 0
    results = []

    for idx, prod in enumerate(products, 1):
        name = prod.get("name", "")
        subcat = prod.get("subcategory") or ""
        ptype = infer_product_type(name, subcat)
        
        print(f"{idx:<3} | {name:<38} | {subcat:<20} | {ptype:<16}")
        results.append((name, subcat, ptype))

        if apply_changes:
            db.products.update_one({"id": prod["id"]}, {"$set": {"product_type": ptype}})
            updated_count += 1

    print("-" * len(header))
    if apply_changes:
        print(f"Successfully applied product_type to {updated_count} products in MongoDB.")
    else:
        print(f"Dry-run completed for {len(products)} products. No changes were written.")
    print("========================================================================\n")
    return results

if __name__ == "__main__":
    apply_mode = "--apply" in sys.argv
    run_migration(apply_changes=apply_mode)
