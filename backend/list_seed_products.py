import json

backup_path = r"c:\Users\User\Desktop\Jaridar\jaridar\backend\products_backup_before_images.json"

with open(backup_path, 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Total products: {len(products)}\n")
print(f"{'#':<3} | {'Product Name':<35} | {'Category':<15} | {'Current Image':<60}")
print("-" * 120)

for i, p in enumerate(products, 1):
    img = p.get('images', [''])[0] if p.get('images') else 'NO_IMAGE'
    print(f"{i:<3} | {p.get('name', 'N/A'):<35} | {p.get('category', 'N/A'):<15} | {img:<60}")
