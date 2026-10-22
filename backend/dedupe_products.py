import asyncio
import os
import json
import argparse
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

BACKUP_FILE = ROOT_DIR / 'products_backup_before_dedupe.json'

def score_product_image(doc):
    """
    Returns a score for the product's image quality/validity:
    - 2 if images contain local '/images/products/' paths
    - 1 if images contain any non-empty image list (e.g. http/external)
    - 0 if images is empty or missing
    """
    images = doc.get('images', [])
    if not images:
        return 0
    
    # Check if any image is a local /images/products/ path
    for img in images:
        if isinstance(img, str) and img.startswith('/images/products/'):
            return 2
    
    return 1

async def backup_products(db):
    """Export all products from MongoDB to a JSON backup file"""
    products_cursor = db.products.find({})
    raw_products = await products_cursor.to_list(10000)
    
    # Custom JSON serializer for BSON ObjectIds & Datetime
    def json_serializer(obj):
        return str(obj)
    
    with open(BACKUP_FILE, 'w', encoding='utf-8') as f:
        json.dump(raw_products, f, default=json_serializer, indent=2)
    
    print(f"[BACKUP OK] Successfully exported {len(raw_products)} products to backup: {BACKUP_FILE}")

async def run_dedupe(execute=False):
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'jaridar')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Step 1: Backup current products collection
    await backup_products(db)
    
    # Step 2: Find all products grouped by name
    all_products = await db.products.find({}).to_list(10000)
    
    grouped_products = {}
    for p in all_products:
        name = p.get('name', 'UNKNOWN')
        grouped_products.setdefault(name, []).append(p)
    
    # Filter only groups with duplicates (count > 1)
    duplicate_groups = {name: items for name, items in grouped_products.items() if len(items) > 1}
    
    print("\n" + "=" * 80)
    if execute:
        print("[EXECUTE MODE] Duplicates WILL BE DELETED from MongoDB")
    else:
        print("[DRY-RUN MODE] Showing what WOULD be kept and deleted (No DB changes made)")
    print("=" * 80 + "\n")
    
    total_kept = 0
    total_to_delete = 0
    ids_to_delete = []

    for name, items in duplicate_groups.items():
        # Sort items by:
        # 1. Image score (2: local /images/products/, 1: other images, 0: no images)
        # 2. Created_at date (most recent first)
        # 3. Product ID string for determinism
        sorted_items = sorted(
            items,
            key=lambda doc: (
                score_product_image(doc),
                doc.get('created_at', ''),
                str(doc.get('_id'))
            ),
            reverse=True
        )
        
        kept = sorted_items[0]
        deleted_list = sorted_items[1:]
        
        total_kept += 1
        total_to_delete += len(deleted_list)
        
        print(f"Product Name: '{name}' (Found {len(items)} duplicates)")
        print(f"   [KEEP]   _id={kept['_id']} | ID={kept.get('id')} | Image Score={score_product_image(kept)} | Images={kept.get('images')} | Created={kept.get('created_at')}")
        
        for d in deleted_list:
            ids_to_delete.append(d['_id'])
            print(f"   [DELETE] _id={d['_id']} | ID={d.get('id')} | Image Score={score_product_image(d)} | Images={d.get('images')} | Created={d.get('created_at')}")
        print("-" * 80)

    print("\n" + "=" * 80)
    print(f"SUMMARY REPORT:")
    print(f"  * Total duplicate groups found: {len(duplicate_groups)}")
    print(f"  * Total products to KEEP:      {total_kept}")
    print(f"  * Total products to DELETE:    {total_to_delete}")
    print("=" * 80)

    if execute:
        if ids_to_delete:
            result = await db.products.delete_many({'_id': {'$in': ids_to_delete}})
            print(f"\n[DELETION COMPLETE] Deleted {result.deleted_count} duplicate product documents from MongoDB.")
        else:
            print("\n[INFO] No duplicates to delete.")
    else:
        print("\n[INFO] DRY-RUN complete. No data was deleted. Pass '--execute' to perform deletion.")

    client.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Deduplicate product documents in MongoDB.")
    parser.add_argument(
        '--execute',
        action='store_true',
        default=False,
        help="Perform actual deletion. Default is DRY-RUN mode."
    )
    args = parser.parse_args()
    asyncio.run(run_dedupe(execute=args.execute))
