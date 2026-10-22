from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Union, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import razorpay
import hmac
import hashlib
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Razorpay setup
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
razorpay_client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'jaridar-fashion-secret-key-2025')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

app = FastAPI(title="Jaridar Fashion Couture API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    is_admin: bool = False
    isAdmin: bool = False
    created_at: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[dict] = None


class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    original_price: Optional[float] = None
    category: str
    subcategory: Optional[str] = None
    product_type: Optional[str] = None
    region: Optional[str] = None
    fabric: Optional[str] = None
    print_type: Optional[str] = None
    style: Optional[str] = None
    images: List[str]
    sizes: List[str]
    colors: List[str]
    stock: int = 0
    featured: bool = False
    is_new: bool = False

class ProductResponse(ProductBase):
    id: str
    rating: float = 0.0
    review_count: int = 0
    created_at: str

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    product_type: Optional[str] = None
    region: Optional[str] = None
    fabric: Optional[str] = None
    print_type: Optional[str] = None
    style: Optional[str] = None
    images: Optional[List[str]] = None
    sizes: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    stock: Optional[int] = None
    featured: Optional[bool] = None
    is_new: Optional[bool] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int
    size: str
    color: str

class CartItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    product_image: str
    product_price: float
    quantity: int
    size: str
    color: str

class WishlistItem(BaseModel):
    product_id: str

class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    comment: str

class ReviewResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    product_id: str
    rating: int
    comment: str
    created_at: str

class OrderCreate(BaseModel):
    shipping_address: dict
    payment_method: str = "razorpay"

class OrderResponse(BaseModel):
    id: str
    user_id: str
    items: List[dict]
    total_amount: float
    shipping_address: dict
    payment_status: str
    order_status: str
    razorpay_order_id: Optional[str] = None
    created_at: str

class NewsletterSubscribe(BaseModel):
    email: EmailStr

class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class OrderStatusUpdate(BaseModel):
    status: str

# ==================== ATTRIBUTE MODELS ====================

ALLOWED_ATTRIBUTE_TYPES = {'category', 'product_type', 'style', 'region', 'fabric', 'print_type'}
ATTRIBUTE_FIELDS = ['category', 'product_type', 'style', 'region', 'fabric', 'print_type']

class AttributeCreate(BaseModel):
    type: str
    value: str
    label: str
    display_order: Optional[int] = 0
    sort_order: Optional[int] = None
    is_active: Optional[bool] = True
    active: Optional[bool] = None

class AttributeUpdate(BaseModel):
    label: Optional[str] = None
    display_order: Optional[int] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    active: Optional[bool] = None

class AttributeResponse(BaseModel):
    id: str
    type: str
    value: str
    label: str
    display_order: int
    sort_order: Optional[int] = None
    is_active: bool
    active: Optional[bool] = None
    count: Optional[int] = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        user = await db.users.find_one({'id': user_id}, {'_id': 0, 'password': 0})
        if not user:
            raise HTTPException(status_code=401, detail='User not found')
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

async def get_current_admin(user: dict = Depends(get_current_user)):
    if not user.get('is_admin', False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
    return user

async def ensure_admin_user():
    admin = await db.users.find_one({'email': 'admin@jaridar.com'})
    if not admin:
        admin_doc = {
            'id': str(uuid.uuid4()),
            'name': 'Admin',
            'email': 'admin@jaridar.com',
            'password': hash_password('admin123'),
            'phone': None,
            'address': None,
            'is_admin': True,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        logger.info("Default admin account created: admin@jaridar.com")

async def ensure_seed_attributes():
    seed_attributes = [
        # Categories (without fusion)
        {"type": "category", "value": "ethnic", "label": "Ethnic Wear", "display_order": 1, "is_active": True},
        {"type": "category", "value": "traditional", "label": "Traditional Wear", "display_order": 2, "is_active": True},
        {"type": "category", "value": "western", "label": "Western Wear", "display_order": 3, "is_active": True},
        {"type": "category", "value": "bridal", "label": "Bridal Collection", "display_order": 4, "is_active": True},

        # Product Types
        {"type": "product_type", "value": "saree", "label": "Saree", "display_order": 1, "is_active": True},
        {"type": "product_type", "value": "lehenga", "label": "Lehenga / Ghagra", "display_order": 2, "is_active": True},
        {"type": "product_type", "value": "kurta-set", "label": "Kurta Set / Kurti", "display_order": 3, "is_active": True},
        {"type": "product_type", "value": "salwar-suit", "label": "Salwar Suit / Anarkali", "display_order": 4, "is_active": True},
        {"type": "product_type", "value": "gown", "label": "Gown", "display_order": 5, "is_active": True},
        {"type": "product_type", "value": "co-ord-set", "label": "Co-ord Set", "display_order": 6, "is_active": True},
        {"type": "product_type", "value": "dress", "label": "Dress", "display_order": 7, "is_active": True},
        {"type": "product_type", "value": "top-shirt", "label": "Top / Shirt", "display_order": 8, "is_active": True},
        {"type": "product_type", "value": "jumpsuit", "label": "Jumpsuit", "display_order": 9, "is_active": True},
        {"type": "product_type", "value": "dupatta", "label": "Dupatta / Stole", "display_order": 10, "is_active": True},
        {"type": "product_type", "value": "other", "label": "Other", "display_order": 11, "is_active": True},

        # Styles
        {"type": "style", "value": "new-collection", "label": "New Collection", "display_order": 1, "is_active": True},
        {"type": "style", "value": "western", "label": "Western Wear", "display_order": 2, "is_active": True},
        {"type": "style", "value": "casual", "label": "Casual", "display_order": 3, "is_active": True},
        {"type": "style", "value": "party-wear", "label": "Party Wear", "display_order": 4, "is_active": True},
        {"type": "style", "value": "formal", "label": "Formal", "display_order": 5, "is_active": True},
        {"type": "style", "value": "ethnic", "label": "Ethnic Wear", "display_order": 6, "is_active": True},
        {"type": "style", "value": "festive-wear", "label": "Festive Wear", "display_order": 7, "is_active": True},

        # Regions
        {"type": "region", "value": "banarasi", "label": "Banarasi", "display_order": 1, "is_active": True},
        {"type": "region", "value": "kanjivaram", "label": "Kanjivaram", "display_order": 2, "is_active": True},
        {"type": "region", "value": "rajasthani", "label": "Rajasthani", "display_order": 3, "is_active": True},
        {"type": "region", "value": "gujarati", "label": "Gujarati", "display_order": 4, "is_active": True},
        {"type": "region", "value": "bengali", "label": "Bengali", "display_order": 5, "is_active": True},

        # Fabrics
        {"type": "fabric", "value": "silk", "label": "Silk", "display_order": 1, "is_active": True},
        {"type": "fabric", "value": "cotton", "label": "Cotton", "display_order": 2, "is_active": True},
        {"type": "fabric", "value": "georgette", "label": "Georgette", "display_order": 3, "is_active": True},
        {"type": "fabric", "value": "velvet", "label": "Velvet", "display_order": 4, "is_active": True},
        {"type": "fabric", "value": "chiffon", "label": "Chiffon", "display_order": 5, "is_active": True},
        {"type": "fabric", "value": "net", "label": "Net", "display_order": 6, "is_active": True},

        # Print Types
        {"type": "print_type", "value": "printed", "label": "Printed", "display_order": 1, "is_active": True},
        {"type": "print_type", "value": "embroidered", "label": "Embroidered", "display_order": 2, "is_active": True},
        {"type": "print_type", "value": "plain", "label": "Plain / Solid", "display_order": 3, "is_active": True},
        {"type": "print_type", "value": "block_print", "label": "Block Print", "display_order": 4, "is_active": True},
        {"type": "print_type", "value": "zari_work", "label": "Zari Work", "display_order": 5, "is_active": True},
    ]

    # Group seed items by type
    types = []
    items_by_type = {}
    for item in seed_attributes:
        t = item["type"]
        if t not in items_by_type:
            types.append(t)
            items_by_type[t] = []
        items_by_type[t].append(item)

    inserted_count = 0
    for attr_type in types:
        count = await db.attributes.count_documents({"type": attr_type})
        if count == 0:
            for item in items_by_type[attr_type]:
                doc = {
                    "id": str(uuid.uuid4()),
                    "type": item["type"],
                    "value": item["value"],
                    "label": item["label"],
                    "display_order": item["display_order"],
                    "sort_order": item["display_order"],
                    "is_active": item.get("is_active", True),
                    "active": item.get("is_active", True)
                }
                await db.attributes.insert_one(doc)
                inserted_count += 1
            logger.info(f"Seeded {len(items_by_type[attr_type])} default attributes for empty type '{attr_type}'.")

    if inserted_count > 0:
        logger.info(f"Total seeded attributes: {inserted_count}.")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user: UserCreate):
    existing = await db.users.find_one({'email': user.email})
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')
    
    user_doc = {
        'id': str(uuid.uuid4()),
        'name': user.name,
        'email': user.email,
        'password': hash_password(user.password),
        'phone': user.phone,
        'address': None,
        'is_admin': False,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_doc['id'])
    return {
        'token': token,
        'user': {
            'id': user_doc['id'],
            'name': user_doc['name'],
            'email': user_doc['email'],
            'phone': user_doc['phone'],
            'is_admin': False,
            'isAdmin': False
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    
    token = create_token(user['id'])
    is_admin = user.get('is_admin', False)
    return {
        'token': token,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'phone': user.get('phone'),
            'is_admin': is_admin,
            'isAdmin': is_admin
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    is_admin = user.get('is_admin', False)
    return {
        **user,
        'is_admin': is_admin,
        'isAdmin': is_admin
    }

@api_router.put("/auth/profile")
async def update_profile(update: UserUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({'id': user['id']}, {'$set': update_data})
    updated_user = await db.users.find_one({'id': user['id']}, {'_id': 0, 'password': 0})
    if updated_user:
        is_admin = updated_user.get('is_admin', False)
        updated_user['is_admin'] = is_admin
        updated_user['isAdmin'] = is_admin
    return updated_user

# ==================== PRODUCTS ROUTES ====================

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    product_type: Optional[str] = None,
    region: Optional[str] = None,
    fabric: Optional[str] = None,
    print_type: Optional[str] = None,
    style: Optional[str] = None,
    featured: Optional[bool] = None,
    is_new: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    query = {}
    if category:
        cats = [c.strip() for c in category.split(',') if c.strip()]
        query['category'] = {'$in': cats} if len(cats) > 1 else cats[0]
    if subcategory:
        subs = [s.strip() for s in subcategory.split(',') if s.strip()]
        query['subcategory'] = {'$in': subs} if len(subs) > 1 else subs[0]
    if product_type:
        pts = [p.strip() for p in product_type.split(',') if p.strip()]
        query['product_type'] = {'$in': pts} if len(pts) > 1 else pts[0]
    if region:
        regs = [r.strip() for r in region.split(',') if r.strip()]
        query['region'] = {'$in': regs} if len(regs) > 1 else regs[0]
    if fabric:
        fabs = [f.strip() for f in fabric.split(',') if f.strip()]
        query['fabric'] = {'$in': fabs} if len(fabs) > 1 else fabs[0]
    if print_type:
        pts = [p.strip() for p in print_type.split(',') if p.strip()]
        query['print_type'] = {'$in': pts} if len(pts) > 1 else pts[0]
    if style:
        sts = [st.strip() for st in style.split(',') if st.strip()]
        or_conditions = []
        for s in sts:
            if s == 'new-collection':
                or_conditions.extend([{'style': 'new-collection'}, {'is_new': True}])
            elif s in ('party-wear', 'partywear'):
                or_conditions.extend([{'style': 'party-wear'}, {'style': 'partywear'}])
            elif s in ('festive-wear', 'festivalwear'):
                or_conditions.extend([{'style': 'festive-wear'}, {'style': 'festivalwear'}, {'category': 'festive-wear'}, {'category': 'festivalwear'}])
            elif s == 'ethnic':
                or_conditions.extend([{'style': 'ethnic'}, {'category': 'ethnic'}])
            elif s == 'western':
                or_conditions.extend([{'style': 'western'}, {'category': 'western'}])
            else:
                or_conditions.extend([{'style': s}, {'category': s}])
        if or_conditions:
            query['$or'] = or_conditions

    if featured is not None:
        query['featured'] = featured
    if is_new is not None:
        query['is_new'] = is_new
    if min_price is not None:
        query['price'] = {'$gte': min_price}
    if max_price is not None:
        query['price'] = {**query.get('price', {}), '$lte': max_price}
    if search:
        search_or = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}}
        ]
        if '$or' in query:
            existing_or = query.pop('$or')
            query['$and'] = [{'$or': existing_or}, {'$or': search_or}]
        else:
            query['$or'] = search_or
    
    products = await db.products.find(query, {'_id': 0}).skip(skip).limit(limit).to_list(limit)
    return products

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({'id': product_id}, {'_id': 0})
    if not product:
        raise HTTPException(status_code=404, detail='Product not found')
    return product

CATEGORY_EDITORIAL_IMAGES = {
    'ethnic': '/images/products/rust-ajrakh-shirt-kurta.jpg',
    'traditional': '/images/categories/category-traditional.jpg',
    'western': '/images/products/purple-floral-coord-set.jpg',
    'bridal': '/images/categories/category-bridal.jpg'
}

CATEGORY_DEFAULT_SUBCATS = {
    'ethnic': ['Sarees', 'Lehengas', 'Salwar Suits', 'Kurtis'],
    'traditional': ['Anarkalis', 'Sharara Sets', 'Palazzo Sets', 'Gharara Sets'],
    'western': ['Dresses', 'Tops', 'Jeans', 'Skirts', 'Jumpsuits'],
    'bridal': ['Bridal Lehengas', 'Reception Gowns', 'Sangeet Outfits', 'Mehendi Outfits']
}

@api_router.get("/categories")
async def get_categories():
    active_cats = await db.attributes.find(
        {"type": "category", "$or": [{"is_active": True}, {"active": True}]},
        {"_id": 0}
    ).sort([("display_order", 1), ("sort_order", 1)]).to_list(100)
    
    categories = []
    for cat in active_cats:
        val = cat.get("value")
        label = cat.get("label")
        subcats = await db.products.distinct("subcategory", {"category": val})
        clean_subcats = [s for s in subcats if s and str(s).strip()]
        if not clean_subcats:
            clean_subcats = CATEGORY_DEFAULT_SUBCATS.get(val, [])
        img = CATEGORY_EDITORIAL_IMAGES.get(val, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600')
        categories.append({
            'id': val,
            'name': label,
            'subcategories': clean_subcats,
            'image': img
        })
    return categories

async def validate_product_attributes(data: dict, existing_product: Optional[dict] = None, is_new: bool = False):
    if is_new:
        if not data.get('category') or not str(data['category']).strip():
            raise HTTPException(status_code=400, detail="Category is required")
        if not data.get('product_type') or not str(data['product_type']).strip():
            raise HTTPException(status_code=400, detail="Product Type is required")
    else:
        if 'category' in data and data['category'] is not None and not str(data['category']).strip():
            raise HTTPException(status_code=400, detail="Category cannot be empty")
        if 'product_type' in data and data['product_type'] is not None and not str(data['product_type']).strip():
            raise HTTPException(status_code=400, detail="Product Type cannot be empty")

    for field in ATTRIBUTE_FIELDS:
        if field in data and data[field] is not None:
            val = str(data[field]).strip()
            if not val:
                data[field] = None
                continue
            val_lower = val.lower()
            data[field] = val_lower
            
            # If editing and value has not changed, it is allowed even if inactive
            if existing_product and existing_product.get(field) == val_lower:
                continue
            
            # Otherwise, must be a known ACTIVE attribute of that type
            attr = await db.attributes.find_one({
                "type": field,
                "value": val_lower,
                "$or": [{"is_active": True}, {"active": True}]
            })
            if not attr:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid {field} '{val}'. Value must be an active {field} attribute."
                )

# ==================== ADMIN PRODUCTS ROUTES ====================

@api_router.get("/admin/products", response_model=List[ProductResponse])
async def admin_get_products(admin: dict = Depends(get_current_admin)):
    products = await db.products.find({}, {'_id': 0}).to_list(1000)
    return products

@api_router.post("/admin/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_product(product: ProductBase, admin: dict = Depends(get_current_admin)):
    product_doc = product.model_dump()
    await validate_product_attributes(product_doc, is_new=True)

    product_doc['id'] = str(uuid.uuid4())
    product_doc['rating'] = 0.0
    product_doc['review_count'] = 0
    product_doc['created_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.products.insert_one(product_doc)
    created_product = await db.products.find_one({'id': product_doc['id']}, {'_id': 0})
    return created_product

@api_router.put("/admin/products/{product_id}", response_model=ProductResponse)
async def admin_update_product(product_id: str, product_update: ProductUpdate, admin: dict = Depends(get_current_admin)):
    existing = await db.products.find_one({'id': product_id})
    if not existing:
        raise HTTPException(status_code=404, detail='Product not found')
    
    update_data = {k: v for k, v in product_update.model_dump().items() if v is not None}
    await validate_product_attributes(update_data, existing_product=existing, is_new=False)

    if update_data:
        await db.products.update_one({'id': product_id}, {'$set': update_data})
    
    updated_product = await db.products.find_one({'id': product_id}, {'_id': 0})
    return updated_product

@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, admin: dict = Depends(get_current_admin)):
    existing = await db.products.find_one({'id': product_id})
    if not existing:
        raise HTTPException(status_code=404, detail='Product not found')
    
    await db.products.delete_one({'id': product_id})
    return {'message': 'Product deleted successfully', 'id': product_id}

# ==================== ADMIN ORDERS ROUTES ====================

@api_router.get("/admin/orders")
async def admin_get_orders(status: Optional[str] = None, admin: dict = Depends(get_current_admin)):
    query = {}
    if status and status.strip().lower() != 'all':
        query['order_status'] = status.strip().lower()
    
    orders = await db.orders.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    
    enriched_orders = []
    for order in orders:
        user = await db.users.find_one({'id': order.get('user_id')}, {'_id': 0, 'password': 0})
        shipping = order.get('shipping_address', {})
        customer_name = (user.get('name') if user else None) or shipping.get('name') or 'Guest Customer'
        customer_email = (user.get('email') if user else None) or shipping.get('email') or 'N/A'
        customer_phone = (user.get('phone') if user else None) or shipping.get('phone') or 'N/A'
        
        enriched = {
            **order,
            'customer_name': customer_name,
            'customer_email': customer_email,
            'customer_phone': customer_phone
        }
        enriched_orders.append(enriched)
        
    return enriched_orders

@api_router.get("/admin/orders/{order_id}")
async def admin_get_order(order_id: str, admin: dict = Depends(get_current_admin)):
    order = await db.orders.find_one({'id': order_id}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    
    user = await db.users.find_one({'id': order.get('user_id')}, {'_id': 0, 'password': 0})
    shipping = order.get('shipping_address', {})
    order['customer_name'] = (user.get('name') if user else None) or shipping.get('name') or 'Guest Customer'
    order['customer_email'] = (user.get('email') if user else None) or shipping.get('email') or 'N/A'
    order['customer_phone'] = (user.get('phone') if user else None) or shipping.get('phone') or 'N/A'
    
    return order

@api_router.put("/admin/orders/{order_id}/status")
async def admin_update_order_status(order_id: str, update: OrderStatusUpdate, admin: dict = Depends(get_current_admin)):
    allowed_statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    new_status = update.status.strip().lower()
    
    if new_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed values: {', '.join(allowed_statuses)}")
    
    existing = await db.orders.find_one({'id': order_id})
    if not existing:
        raise HTTPException(status_code=404, detail='Order not found')
    
    await db.orders.update_one({'id': order_id}, {'$set': {'order_status': new_status}})
    
    updated_order = await db.orders.find_one({'id': order_id}, {'_id': 0})
    user = await db.users.find_one({'id': updated_order.get('user_id')}, {'_id': 0, 'password': 0})
    shipping = updated_order.get('shipping_address', {})
    updated_order['customer_name'] = (user.get('name') if user else None) or shipping.get('name') or 'Guest Customer'
    updated_order['customer_email'] = (user.get('email') if user else None) or shipping.get('email') or 'N/A'
    updated_order['customer_phone'] = (user.get('phone') if user else None) or shipping.get('phone') or 'N/A'
    
    return updated_order

# Helper to attach counts and normalize fields
async def attach_product_counts(attributes_list: List[dict]) -> List[dict]:
    for attr in attributes_list:
        attr_type = attr.get("type")
        attr_val = attr.get("value")
        if attr_type and attr_val:
            c = await db.products.count_documents({
                attr_type: {"$regex": f"^{re.escape(attr_val)}$", "$options": "i"}
            })
            attr["count"] = c
        else:
            attr["count"] = 0
        if "sort_order" not in attr or attr["sort_order"] is None:
            attr["sort_order"] = attr.get("display_order", 0)
        if "display_order" not in attr or attr["display_order"] is None:
            attr["display_order"] = attr.get("sort_order", 0)
        if "active" not in attr or attr["active"] is None:
            attr["active"] = attr.get("is_active", True)
        if "is_active" not in attr or attr["is_active"] is None:
            attr["is_active"] = attr.get("active", True)
    return attributes_list

def normalize_attribute_doc(attr: dict) -> dict:
    if "sort_order" not in attr or attr["sort_order"] is None:
        attr["sort_order"] = attr.get("display_order", 0)
    if "display_order" not in attr or attr["display_order"] is None:
        attr["display_order"] = attr.get("sort_order", 0)
    if "active" not in attr or attr["active"] is None:
        attr["active"] = attr.get("is_active", True)
    if "is_active" not in attr or attr["is_active"] is None:
        attr["is_active"] = attr.get("active", True)
    return attr

# ==================== ATTRIBUTES ROUTES ====================

@api_router.get("/attributes")
async def get_attributes(type: Optional[str] = None, with_counts: Optional[str] = None):
    want_counts = str(with_counts).lower() in ("true", "1", "yes") if with_counts is not None else False
    if type:
        clean_type = type.strip().lower()
        query = {"type": clean_type, "$or": [{"is_active": True}, {"active": True}]}
        attributes = await db.attributes.find(query, {"_id": 0}).sort([("display_order", 1), ("sort_order", 1), ("label", 1)]).to_list(1000)
        if want_counts:
            await attach_product_counts(attributes)
        else:
            for attr in attributes:
                normalize_attribute_doc(attr)
        return attributes
    else:
        # Grouped by type
        grouped = {t: [] for t in ["category", "product_type", "style", "region", "fabric", "print_type"]}
        all_active = await db.attributes.find({"$or": [{"is_active": True}, {"active": True}]}, {"_id": 0}).sort([("display_order", 1), ("sort_order", 1), ("label", 1)]).to_list(1000)
        if want_counts:
            await attach_product_counts(all_active)
        else:
            for attr in all_active:
                normalize_attribute_doc(attr)
        for attr in all_active:
            t = attr.get("type")
            if t in grouped:
                grouped[t].append(attr)
            else:
                grouped.setdefault(t, []).append(attr)
        return grouped

@api_router.get("/admin/attributes")
async def admin_get_attributes(type: Optional[str] = None, admin: dict = Depends(get_current_admin)):
    query = {}
    if type:
        query["type"] = type.strip().lower()
    attributes = await db.attributes.find(query, {"_id": 0}).sort([("display_order", 1), ("sort_order", 1), ("label", 1)]).to_list(1000)
    await attach_product_counts(attributes)
    return attributes

@api_router.post("/admin/attributes", response_model=AttributeResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_attribute(attr: AttributeCreate, admin: dict = Depends(get_current_admin)):
    clean_type = attr.type.strip().lower()
    if clean_type not in ALLOWED_ATTRIBUTE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid attribute type '{attr.type}'. Allowed types: {', '.join(sorted(ALLOWED_ATTRIBUTE_TYPES))}"
        )
    clean_value = attr.value.strip().lower()
    if not clean_value:
        raise HTTPException(status_code=400, detail="Attribute value cannot be empty")
    clean_label = attr.label.strip()
    if not clean_label:
        raise HTTPException(status_code=400, detail="Attribute label cannot be empty")
    
    existing = await db.attributes.find_one({"type": clean_type, "value": clean_value})
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Attribute of type '{clean_type}' with value '{clean_value}' already exists"
        )
    
    order = attr.sort_order if attr.sort_order is not None else (attr.display_order if attr.display_order is not None else 0)
    is_act = attr.active if attr.active is not None else (attr.is_active if attr.is_active is not None else True)

    doc = {
        "id": str(uuid.uuid4()),
        "type": clean_type,
        "value": clean_value,
        "label": clean_label,
        "display_order": order,
        "sort_order": order,
        "is_active": is_act,
        "active": is_act
    }
    await db.attributes.insert_one(doc)
    created = await db.attributes.find_one({"id": doc["id"]}, {"_id": 0})
    created["count"] = 0
    return created

@api_router.put("/admin/attributes/{id}", response_model=AttributeResponse)
async def admin_update_attribute(id: str, update: AttributeUpdate, admin: dict = Depends(get_current_admin)):
    existing = await db.attributes.find_one({"id": id})
    if not existing:
        raise HTTPException(status_code=404, detail="Attribute not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    # value cannot change after creation
    if "value" in update_data:
        del update_data["value"]

    if "label" in update_data:
        clean_label = str(update_data["label"]).strip()
        if not clean_label:
            raise HTTPException(status_code=400, detail="Label cannot be empty")
        update_data["label"] = clean_label
    
    if "display_order" in update_data and "sort_order" not in update_data:
        update_data["sort_order"] = update_data["display_order"]
    elif "sort_order" in update_data and "display_order" not in update_data:
        update_data["display_order"] = update_data["sort_order"]
        
    if "is_active" in update_data and "active" not in update_data:
        update_data["active"] = update_data["is_active"]
    elif "active" in update_data and "is_active" not in update_data:
        update_data["is_active"] = update_data["active"]

    if update_data:
        await db.attributes.update_one({"id": id}, {"$set": update_data})
    
    updated = await db.attributes.find_one({"id": id}, {"_id": 0})
    normalize_attribute_doc(updated)
    c = await db.products.count_documents({
        updated["type"]: {"$regex": f"^{re.escape(updated['value'])}$", "$options": "i"}
    })
    updated["count"] = c
    return updated

@api_router.post("/admin/attributes/reorder")
async def admin_reorder_attributes(data: dict, admin: dict = Depends(get_current_admin)):
    items = data.get("items", [])
    for item in items:
        attr_id = item.get("id")
        order = item.get("sort_order", item.get("display_order", 0))
        if attr_id:
            await db.attributes.update_one(
                {"id": attr_id},
                {"$set": {"display_order": order, "sort_order": order}}
            )
    return {"message": "Attributes reordered successfully"}

@api_router.delete("/admin/attributes/{id}")
async def admin_delete_attribute(id: str, admin: dict = Depends(get_current_admin)):
    existing = await db.attributes.find_one({"id": id})
    if not existing:
        raise HTTPException(status_code=404, detail="Attribute not found")
    
    attr_type = existing.get("type")
    attr_value = existing.get("value")
    
    # Check if any product currently uses that value
    count = await db.products.count_documents({
        attr_type: {"$regex": f"^{re.escape(attr_value)}$", "$options": "i"}
    })
    if count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete attribute '{existing.get('label', attr_value)}': It is currently used by {count} product(s)."
        )
    
    await db.attributes.delete_one({"id": id})
    return {"message": "Attribute deleted successfully", "id": id}

# ==================== CART ROUTES ====================

@api_router.get("/cart")
async def get_cart(user: dict = Depends(get_current_user)):
    cart_items = await db.cart.find({'user_id': user['id']}, {'_id': 0}).to_list(100)
    
    items_with_products = []
    total = 0
    for item in cart_items:
        product = await db.products.find_one({'id': item['product_id']}, {'_id': 0})
        if product:
            items_with_products.append({
                'id': item['id'],
                'product_id': item['product_id'],
                'product_name': product['name'],
                'product_image': product['images'][0] if product['images'] else '',
                'product_price': product['price'],
                'quantity': item['quantity'],
                'size': item['size'],
                'color': item['color']
            })
            total += product['price'] * item['quantity']
    
    return {'items': items_with_products, 'total': total}

@api_router.post("/cart")
async def add_to_cart(item: CartItem, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({'id': item.product_id})
    if not product:
        raise HTTPException(status_code=404, detail='Product not found')
    
    existing = await db.cart.find_one({
        'user_id': user['id'],
        'product_id': item.product_id,
        'size': item.size,
        'color': item.color
    })
    
    if existing:
        await db.cart.update_one(
            {'id': existing['id']},
            {'$inc': {'quantity': item.quantity}}
        )
    else:
        cart_item = {
            'id': str(uuid.uuid4()),
            'user_id': user['id'],
            'product_id': item.product_id,
            'quantity': item.quantity,
            'size': item.size,
            'color': item.color
        }
        await db.cart.insert_one(cart_item)
    
    return {'message': 'Item added to cart'}

@api_router.put("/cart/{item_id}")
async def update_cart_item(item_id: str, quantity: int, user: dict = Depends(get_current_user)):
    if quantity <= 0:
        await db.cart.delete_one({'id': item_id, 'user_id': user['id']})
    else:
        await db.cart.update_one(
            {'id': item_id, 'user_id': user['id']},
            {'$set': {'quantity': quantity}}
        )
    return {'message': 'Cart updated'}

@api_router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str, user: dict = Depends(get_current_user)):
    await db.cart.delete_one({'id': item_id, 'user_id': user['id']})
    return {'message': 'Item removed from cart'}

@api_router.delete("/cart")
async def clear_cart(user: dict = Depends(get_current_user)):
    await db.cart.delete_many({'user_id': user['id']})
    return {'message': 'Cart cleared'}

# ==================== WISHLIST ROUTES ====================

@api_router.get("/wishlist")
async def get_wishlist(user: dict = Depends(get_current_user)):
    wishlist_items = await db.wishlist.find({'user_id': user['id']}, {'_id': 0}).to_list(100)
    
    products = []
    for item in wishlist_items:
        product = await db.products.find_one({'id': item['product_id']}, {'_id': 0})
        if product:
            products.append(product)
    
    return products

@api_router.post("/wishlist")
async def add_to_wishlist(item: WishlistItem, user: dict = Depends(get_current_user)):
    existing = await db.wishlist.find_one({
        'user_id': user['id'],
        'product_id': item.product_id
    })
    
    if not existing:
        wishlist_item = {
            'id': str(uuid.uuid4()),
            'user_id': user['id'],
            'product_id': item.product_id,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await db.wishlist.insert_one(wishlist_item)
    
    return {'message': 'Item added to wishlist'}

@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    await db.wishlist.delete_one({'user_id': user['id'], 'product_id': product_id})
    return {'message': 'Item removed from wishlist'}

# ==================== REVIEWS ROUTES ====================

@api_router.get("/reviews/{product_id}", response_model=List[ReviewResponse])
async def get_reviews(product_id: str):
    reviews = await db.reviews.find({'product_id': product_id}, {'_id': 0}).to_list(100)
    return reviews

@api_router.post("/reviews")
async def create_review(review: ReviewCreate, user: dict = Depends(get_current_user)):
    existing = await db.reviews.find_one({
        'user_id': user['id'],
        'product_id': review.product_id
    })
    if existing:
        raise HTTPException(status_code=400, detail='You have already reviewed this product')
    
    review_doc = {
        'id': str(uuid.uuid4()),
        'user_id': user['id'],
        'user_name': user['name'],
        'product_id': review.product_id,
        'rating': review.rating,
        'comment': review.comment,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review_doc)
    
    # Update product rating
    all_reviews = await db.reviews.find({'product_id': review.product_id}).to_list(1000)
    avg_rating = sum(r['rating'] for r in all_reviews) / len(all_reviews)
    await db.products.update_one(
        {'id': review.product_id},
        {'$set': {'rating': round(avg_rating, 1), 'review_count': len(all_reviews)}}
    )
    
    return {'message': 'Review submitted', 'id': review_doc['id']}

# ==================== ORDERS ROUTES ====================

@api_router.get("/orders")
async def get_orders(user: dict = Depends(get_current_user)):
    orders = await db.orders.find({'user_id': user['id']}, {'_id': 0}).sort('created_at', -1).to_list(100)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({'id': order_id, 'user_id': user['id']}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    return order

@api_router.post("/orders")
async def create_order(order_data: OrderCreate, user: dict = Depends(get_current_user)):
    cart = await db.cart.find({'user_id': user['id']}, {'_id': 0}).to_list(100)
    if not cart:
        raise HTTPException(status_code=400, detail='Cart is empty')
    
    items = []
    total = 0
    for cart_item in cart:
        product = await db.products.find_one({'id': cart_item['product_id']}, {'_id': 0})
        if product:
            item_total = product['price'] * cart_item['quantity']
            items.append({
                'product_id': product['id'],
                'product_name': product['name'],
                'product_image': product['images'][0] if product['images'] else '',
                'price': product['price'],
                'quantity': cart_item['quantity'],
                'size': cart_item['size'],
                'color': cart_item['color'],
                'subtotal': item_total
            })
            total += item_total
    
    order_id = str(uuid.uuid4())
    razorpay_order_id = None
    
    if razorpay_client:
        try:
            razorpay_order = razorpay_client.order.create({
                'amount': int(total * 100),
                'currency': 'INR',
                'receipt': order_id,
                'payment_capture': 1
            })
            razorpay_order_id = razorpay_order['id']
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {e}")
    
    order_doc = {
        'id': order_id,
        'user_id': user['id'],
        'items': items,
        'total_amount': total,
        'shipping_address': order_data.shipping_address,
        'payment_method': order_data.payment_method,
        'payment_status': 'pending',
        'order_status': 'pending',
        'razorpay_order_id': razorpay_order_id,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    
    return {
        'order_id': order_id,
        'razorpay_order_id': razorpay_order_id,
        'amount': total,
        'key_id': RAZORPAY_KEY_ID
    }

@api_router.post("/orders/verify-payment")
async def verify_payment(payment: PaymentVerify, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({
        'razorpay_order_id': payment.razorpay_order_id,
        'user_id': user['id']
    })
    
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    
    # Verify signature
    if RAZORPAY_KEY_SECRET:
        message = f"{payment.razorpay_order_id}|{payment.razorpay_payment_id}"
        expected_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if payment.razorpay_signature != expected_signature:
            await db.orders.update_one(
                {'id': order['id']},
                {'$set': {'payment_status': 'failed'}}
            )
            raise HTTPException(status_code=400, detail='Payment verification failed')
    
    # Update order status
    await db.orders.update_one(
        {'id': order['id']},
        {'$set': {
            'payment_status': 'completed',
            'order_status': 'confirmed',
            'razorpay_payment_id': payment.razorpay_payment_id
        }}
    )
    
    # Clear cart
    await db.cart.delete_many({'user_id': user['id']})
    
    return {'message': 'Payment verified successfully', 'order_id': order['id']}

# ==================== NEWSLETTER ROUTES ====================

@api_router.post("/newsletter/subscribe")
async def subscribe_newsletter(data: NewsletterSubscribe):
    existing = await db.newsletter.find_one({'email': data.email})
    if existing:
        return {'message': 'Already subscribed'}
    
    await db.newsletter.insert_one({
        'id': str(uuid.uuid4()),
        'email': data.email,
        'subscribed_at': datetime.now(timezone.utc).isoformat()
    })
    return {'message': 'Successfully subscribed to newsletter'}

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data(admin: dict = Depends(get_current_admin)):
    """Seed initial product data and default admin account"""
    await ensure_admin_user()
    await ensure_seed_attributes()
    existing = await db.products.find_one()
    if existing:
        return {'message': 'Data already seeded'}
    
    products = [
        # Ethnic Wear
        {
            'id': str(uuid.uuid4()),
            'name': 'Pastel Pink Embroidered Saree',
            'description': 'Elegant pastel pink saree with intricate zari embroidery, perfect for festive occasions. Features a beautiful border with traditional motifs.',
            'price': 8999,
            'original_price': 12999,
            'category': 'ethnic',
            'subcategory': 'Sarees',
            'images': [
                '/images/products/pastel-pink-embroidered-saree.jpg'
            ],
            'sizes': ['Free Size'],
            'colors': ['Pink', 'Rose Gold'],
            'stock': 25,
            'featured': True,
            'is_new': True,
            'rating': 4.8,
            'review_count': 45,
            'created_at': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Royal Blue Banarasi Lehenga',
            'description': 'Stunning royal blue Banarasi silk lehenga with gold zari work. Includes matching blouse and dupatta with intricate weaving.',
            'price': 24999,
            'original_price': 34999,
            'category': 'ethnic',
            'subcategory': 'Lehengas',
            'images': [
                '/images/products/royal-blue-banarasi-lehenga.jpg'
            ],
            'sizes': ['XS', 'S', 'M', 'L', 'XL'],
            'colors': ['Royal Blue', 'Navy'],
            'stock': 15,
            'featured': True,
            'is_new': False,
            'rating': 4.9,
            'review_count': 78,
            'created_at': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Mint Green Anarkali Suit',
            'description': 'Flowy mint green Anarkali suit with delicate thread embroidery. Perfect for casual festive gatherings.',
            'price': 5999,
            'original_price': 7999,
            'category': 'ethnic',
            'subcategory': 'Salwar Suits',
            'images': [
                '/images/products/mint-green-anarkali-suit.jpg'
            ],
            'sizes': ['S', 'M', 'L', 'XL', 'XXL'],
            'colors': ['Mint Green', 'Sea Green'],
            'stock': 30,
            'featured': False,
            'is_new': True,
            'rating': 4.5,
            'review_count': 32,
            'created_at': datetime.now(timezone.utc).isoformat()
        },
        # Traditional Wear
        {
            'id': str(uuid.uuid4()),
            'name': 'Maroon Velvet Sharara Set',
            'description': 'Luxurious maroon velvet sharara set with gold embellishments. Includes kurta, sharara, and matching dupatta.',
            'price': 15999,
            'original_price': 19999,
            'category': 'traditional',
            'subcategory': 'Sharara Sets',
            'images': [
                '/images/products/maroon-velvet-sharara-set.jpg'
            ],
            'sizes': ['S', 'M', 'L', 'XL'],
            'colors': ['Maroon', 'Wine'],
            'stock': 18,
            'featured': True,
            'is_new': False,
            'rating': 4.7,
            'review_count': 56,
            'created_at': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Ivory Palazzo Set with Jacket',
            'description': 'Elegant ivory palazzo set with embroidered long jacket. Perfect for sangeet or mehendi ceremonies.',
            'price': 11999,
            'original_price': 15999,
            'category': 'traditional',
            'subcategory': 'Palazzo Sets',
            'images': [
                '/images/products/ivory-palazzo-set-with-jacket.jpg'
            ],
            'sizes': ['XS', 'S', 'M', 'L', 'XL'],
            'colors': ['Ivory', 'Off White'],
            'stock': 22,
            'featured': False,
            'is_new': True,
            'rating': 4.6,
            'review_count': 41,
            'created_at': datetime.now(timezone.utc).isoformat()
        },
        # Western Wear
        {
            'id': str(uuid.uuid4()),
            'name': 'Blush Pink Cocktail Dress',
            'description': 'Stunning blush pink cocktail dress with sequin detailing. Features a flattering A-line silhouette.',
            'price': 4999,
            'original_price': 6999,
            'category': 'western',
            'subcategory': 'Dresses',
            'images': [
                '/images/products/blush-pink-cocktail-dress.jpg'
            ],
            'sizes': ['XS', 'S', 'M', 'L'],
            'colors': ['Blush Pink', 'Dusty Rose'],
            'stock': 35,
            'featured': True,
            'is_new': True,
            'rating': 4.4,
            'review_count': 28,
            'created_at': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Navy Blue Jumpsuit',
            'description': 'Chic navy blue jumpsuit with wide leg pants and belt detail. Perfect for formal occasions.',
            'price': 3999,
            'original_price': 5499,
            'category': 'western',
            'subcategory': 'Jumpsuits',
            'images': [
                '/images/products/navy-blue-jumpsuit.jpg'
            ],
            'sizes': ['S', 'M', 'L', 'XL'],
            'colors': ['Navy Blue', 'Black'],
            'stock': 28,
            'featured': False,
            'is_new': False,
            'rating': 4.3,
            'review_count': 19,
            'created_at': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Floral Maxi Dress',
            'description': 'Beautiful floral print maxi dress with flowy silhouette. Ideal for summer occasions.',
            'price': 2999,
            'original_price': 4499,
            'category': 'western',
            'subcategory': 'Dresses',
            'images': [
                '/images/products/floral-maxi-dress.jpg'
            ],
            'sizes': ['XS', 'S', 'M', 'L', 'XL'],
            'colors': ['Floral Print', 'Multi'],
            'stock': 40,
            'featured': False,
            'is_new': True,
            'rating': 4.5,
            'review_count': 35,
            'created_at': datetime.now(timezone.utc).isoformat()
        },
        # Bridal Collection
        {
            'id': str(uuid.uuid4()),
            'name': 'Red Bridal Lehenga with Gold Work',
            'description': 'Exquisite red bridal lehenga with heavy gold zardozi work. Complete bridal ensemble with lehenga, blouse, and two dupattas.',
            'price': 89999,
            'original_price': 125000,
            'category': 'bridal',
            'subcategory': 'Bridal Lehengas',
            'images': [
                '/images/products/red-bridal-lehenga-with-gold-work.jpg'
            ],
            'sizes': ['S', 'M', 'L', 'XL'],
            'colors': ['Red', 'Maroon'],
            'stock': 8,
            'featured': True,
            'is_new': False,
            'rating': 5.0,
            'review_count': 124,
            'created_at': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Champagne Reception Gown',
            'description': 'Elegant champagne reception gown with crystal embellishments and cathedral train.',
            'price': 45999,
            'original_price': 65000,
            'category': 'bridal',
            'subcategory': 'Reception Gowns',
            'images': [
                '/images/products/champagne-reception-gown.jpg'
            ],
            'sizes': ['XS', 'S', 'M', 'L'],
            'colors': ['Champagne', 'Gold'],
            'stock': 5,
            'featured': True,
            'is_new': True,
            'rating': 4.9,
            'review_count': 67,
            'created_at': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Peach Sangeet Lehenga',
            'description': 'Light and vibrant peach lehenga perfect for sangeet night. Features mirror work and sequin embellishments.',
            'price': 35999,
            'original_price': 48000,
            'category': 'bridal',
            'subcategory': 'Sangeet Outfits',
            'images': [
                '/images/products/peach-sangeet-lehenga.jpg'
            ],
            'sizes': ['S', 'M', 'L', 'XL'],
            'colors': ['Peach', 'Coral'],
            'stock': 12,
            'featured': False,
            'is_new': True,
            'rating': 4.8,
            'review_count': 52,
            'created_at': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Yellow Mehendi Outfit',
            'description': 'Bright yellow mehendi outfit with gota patti work. Includes crop top, skirt, and dupatta.',
            'price': 18999,
            'original_price': 25000,
            'category': 'bridal',
            'subcategory': 'Mehendi Outfits',
            'images': [
                '/images/products/yellow-mehendi-outfit.jpg'
            ],
            'sizes': ['XS', 'S', 'M', 'L', 'XL'],
            'colors': ['Yellow', 'Mustard'],
            'stock': 20,
            'featured': False,
            'is_new': False,
            'rating': 4.6,
            'review_count': 38,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.products.insert_many(products)
    return {'message': f'Seeded {len(products)} products'}

@api_router.post("/update-product-images")
async def update_product_images(admin: dict = Depends(get_current_admin)):
    """Safely update existing products' image URLs in MongoDB by product name without wiping users, orders, or admin accounts."""
    mapping = {
        'Pastel Pink Embroidered Saree': ['/images/products/pastel-pink-embroidered-saree.jpg'],
        'Royal Blue Banarasi Lehenga': ['/images/products/royal-blue-banarasi-lehenga.jpg'],
        'Mint Green Anarkali Suit': ['/images/products/mint-green-anarkali-suit.jpg'],
        'Maroon Velvet Sharara Set': ['/images/products/maroon-velvet-sharara-set.jpg'],
        'Ivory Palazzo Set with Jacket': ['/images/products/ivory-palazzo-set-with-jacket.jpg'],
        'Blush Pink Cocktail Dress': ['/images/products/blush-pink-cocktail-dress.jpg'],
        'Navy Blue Jumpsuit': ['/images/products/navy-blue-jumpsuit.jpg'],
        'Floral Maxi Dress': ['/images/products/floral-maxi-dress.jpg'],
        'Red Bridal Lehenga with Gold Work': ['/images/products/red-bridal-lehenga-with-gold-work.jpg'],
        'Champagne Reception Gown': ['/images/products/champagne-reception-gown.jpg'],
        'Peach Sangeet Lehenga': ['/images/products/peach-sangeet-lehenga.jpg'],
        'Yellow Mehendi Outfit': ['/images/products/yellow-mehendi-outfit.jpg']
    }
    updated_count = 0
    for name, imgs in mapping.items():
        res = await db.products.update_many({'name': name}, {'$set': {'images': imgs}})
        updated_count += res.modified_count
    return {'message': f'Updated image paths for {updated_count} products safely'}

@api_router.get("/")
async def root():
    return {"message": "Jaridar Fashion Couture API"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await ensure_admin_user()
    await ensure_seed_attributes()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
