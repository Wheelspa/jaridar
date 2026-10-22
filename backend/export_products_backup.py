import os
import json
from pymongo import MongoClient
from bson.json_util import dumps

mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.getenv('DB_NAME', 'jaridar')

try:
    client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
    db = client[db_name]
    products = list(db.products.find({}))
    
    backup_path = r"c:\Users\User\Desktop\Jaridar\jaridar\backend\products_backup_before_images.json"
    
    with open(backup_path, "w", encoding="utf-8") as f:
        f.write(dumps(products, indent=2))
        
    print(f"SUCCESSFULLY EXPORTED {len(products)} PRODUCTS TO {backup_path}")
except Exception as e:
    print(f"ERROR EXPORTING PRODUCTS BACKUP: {e}")
    exit(1)
