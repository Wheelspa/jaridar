import asyncio
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "jaridar")

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    products_col = db["products"]

    new_products = [
        {
            "id": str(uuid.uuid4()),
            "name": "Purple Floral Co-ord Set",
            "description": "Chic and comfortable purple floral printed co-ord set in georgette, ideal for casual and party outings.",
            "price": 3499,
            "original_price": 4999,
            "category": "western",
            "style": "party-wear",
            "fabric": "georgette",
            "print_type": "printed",
            "images": [
                "/images/products/purple-floral-coord-set.jpg"
            ],
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["Purple"],
            "stock": 20,
            "featured": True,
            "is_new": True,
            "rating": 5.0,
            "review_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Blue Plaid Co-ord Set",
            "description": "Stylish blue plaid co-ord set with fine embroidered details on premium cotton fabric.",
            "price": 3299,
            "original_price": 4499,
            "category": "western",
            "style": "casual",
            "fabric": "cotton",
            "print_type": "embroidered",
            "images": [
                "/images/products/blue-plaid-coord-set.jpg"
            ],
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["Blue"],
            "stock": 20,
            "featured": True,
            "is_new": True,
            "rating": 5.0,
            "review_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Blue Block Print Dress",
            "description": "Elegant blue block print cotton dress, combining traditional craftsmanship with a contemporary silhouette.",
            "price": 2499,
            "original_price": 3499,
            "category": "ethnic",
            "style": "casual",
            "fabric": "cotton",
            "print_type": "block_print",
            "images": [
                "/images/products/blue-blockprint-dress.jpg"
            ],
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["Blue"],
            "stock": 20,
            "featured": True,
            "is_new": True,
            "rating": 5.0,
            "review_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Pink Kurta",
            "description": "Graceful pink cotton kurta with subtle accents, suitable for festive and daily wear.",
            "price": 1999,
            "original_price": 2799,
            "category": "ethnic",
            "style": "festive-wear",
            "fabric": "cotton",
            "print_type": "plain",
            "images": [
                "/images/products/pink-kurta-1.jpg",
                "/images/products/pink-kurta-2.jpg"
            ],
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["Pink"],
            "stock": 20,
            "featured": True,
            "is_new": True,
            "rating": 5.0,
            "review_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Rust Ajrakh Shirt Kurta",
            "description": "Handcrafted rust Ajrakh block printed shirt kurta from Rajasthan on fine breathable cotton.",
            "price": 2799,
            "original_price": 3799,
            "category": "ethnic",
            "style": "casual",
            "fabric": "cotton",
            "print_type": "block_print",
            "region": "rajasthani",
            "images": [
                "/images/products/rust-ajrakh-shirt-kurta.jpg"
            ],
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["Rust"],
            "stock": 20,
            "featured": True,
            "is_new": True,
            "rating": 5.0,
            "review_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]

    # Check if products with these names already exist to prevent duplicate insertion
    inserted_count = 0
    for prod in new_products:
        existing = await products_col.find_one({"name": prod["name"]})
        if not existing:
            await products_col.insert_one(prod)
            inserted_count += 1
            print(f"Inserted: {prod['name']}")
        else:
            print(f"Already exists: {prod['name']}")

    print(f"Finished inserting {inserted_count} new products.")

    print("\n--- ALL PRODUCTS IN DATABASE ---")
    cursor = products_col.find({})
    all_prods = await cursor.to_list(length=100)
    for p in all_prods:
        first_img = p.get('images', [''])[0] if p.get('images') else 'No image'
        print(f"Name: {p.get('name'):<35} | Images: {first_img:<50} | Is New: {p.get('is_new')}")

    print(f"\nTotal products count in DB: {len(all_prods)}")

if __name__ == "__main__":
    asyncio.run(main())
