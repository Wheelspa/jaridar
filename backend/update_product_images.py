import os
import sys
from pymongo import MongoClient

mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.getenv('DB_NAME', 'jaridar')

product_image_mapping = {
    "Pastel Pink Embroidered Saree": ["/images/products/product-pastel-pink-embroidered-saree.jpg"],
    "Royal Blue Banarasi Lehenga": ["/images/products/product-royal-blue-banarasi-lehenga.jpg"],
    "Mint Green Anarkali Suit": ["/images/products/product-mint-green-anarkali-suit.jpg"],
    "Maroon Velvet Sharara Set": ["/images/products/product-maroon-velvet-sharara-set.jpg"],
    "Ivory Palazzo Set with Jacket": ["/images/products/product-ivory-palazzo-set-with-jacket.jpg"],
    "Blush Pink Cocktail Dress": ["/images/products/product-blush-pink-cocktail-dress.jpg"],
    "Navy Blue Jumpsuit": ["/images/products/product-navy-blue-jumpsuit.jpg"],
    "Floral Maxi Dress": ["/images/products/product-floral-maxi-dress.jpg"],
    "Red Bridal Lehenga with Gold Work": ["/images/products/product-red-bridal-lehenga-with-gold-work.jpg"],
    "Champagne Reception Gown": ["/images/products/product-champagne-reception-gown.jpg"],
    "Peach Sangeet Lehenga": ["/images/products/product-peach-sangeet-lehenga.jpg"],
    "Yellow Mehendi Outfit": ["/images/products/product-yellow-mehendi-outfit.jpg"],
    "ghagra": ["/images/products/product-ghagra.jpg"],
}

def main():
    execute = "--execute" in sys.argv
    print(f"=== UPDATE PRODUCT IMAGES (Mode: {'EXECUTE' if execute else 'DRY RUN'}) ===")
    
    client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
    db = client[db_name]
    
    updated_count = 0
    
    for name, new_images in product_image_mapping.items():
        doc = db.products.find_one({"name": name})
        if doc:
            old_images = doc.get('images', [])
            print(f"\nProduct: '{name}'")
            print(f"  Old images: {old_images}")
            print(f"  New images: {new_images}")
            
            if execute:
                res = db.products.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {"images": new_images}}
                )
                if res.modified_count > 0:
                    print("  Status: UPDATED SUCCESSFULLY IN DATABASE")
                    updated_count += 1
                else:
                    print("  Status: NO CHANGE (Already matched)")
            else:
                print("  Status: WOULD UPDATE (Dry-Run)")
                updated_count += 1
        else:
            print(f"\nWARNING: Product with name '{name}' not found in database")
            
    print(f"\nSummary: Total products {'updated' if execute else 'matched for update'}: {updated_count}/{len(product_image_mapping)}")

if __name__ == "__main__":
    main()
