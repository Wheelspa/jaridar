from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
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
import json
import re
import io
import base64
import requests
from PIL import Image
from google import genai
from google.genai import types

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Razorpay setup
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')
APP_ENV = os.environ.get('APP_ENV', '').lower()

from payment_utils import (
    verify_razorpay_payment_signature,
    verify_razorpay_webhook_signature,
    calculate_cart_totals
)

razorpay_client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET:
    raise RuntimeError("Critical startup error: JWT_SECRET environment variable is missing or empty. Please set JWT_SECRET in backend/.env.")
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Try-On Config
GEMINI_IMAGE_MODEL = os.environ.get('GEMINI_IMAGE_MODEL', 'gemini-2.5-flash-image')
DAILY_TRYON_LIMIT = 5
ALLOWED_TRYON_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_TRYON_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_TRYON_FILE_SIZE = 5 * 1024 * 1024  # 5MB

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
    email: str

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
        initial_password = os.environ.get('ADMIN_INITIAL_PASSWORD')
        if not initial_password:
            logger.warning("No admin user exists and ADMIN_INITIAL_PASSWORD is not set. Skipping admin creation.")
            return
        admin_doc = {
            'id': str(uuid.uuid4()),
            'name': 'Admin',
            'email': 'admin@jaridar.com',
            'password': hash_password(initial_password),
            'phone': None,
            'address': None,
            'is_admin': True,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        logger.info("Admin account created: admin@jaridar.com")

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


# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    return {"ok": True}


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

# ==================== VIRTUAL TRY-ON ====================

@api_router.get("/tryon/quota")
async def get_tryon_quota(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get('id')
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    usage_record = await db.tryon_usage.find_one({'user_id': user_id, 'date': today_str})
    current_count = usage_record.get('count', 0) if usage_record else 0
    return {
        "daily_used": current_count,
        "daily_limit": DAILY_TRYON_LIMIT,
        "remaining": max(0, DAILY_TRYON_LIMIT - current_count)
    }

@api_router.post("/tryon")
async def try_on_product(
    file: UploadFile = File(...),
    product_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get('id')
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # 1. Check daily try-on limit per user
    usage_record = await db.tryon_usage.find_one({'user_id': user_id, 'date': today_str})
    current_count = usage_record.get('count', 0) if usage_record else 0
    if current_count >= DAILY_TRYON_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"You have reached your daily limit of {DAILY_TRYON_LIMIT} virtual try-ons. Please try again tomorrow!"
        )

    # 2. Validate customer photo extension & mime type
    filename = file.filename or "photo.jpg"
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_TRYON_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a JPG, PNG, or WebP photo."
        )

    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_TRYON_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image type. Please upload a valid JPG, PNG, or WebP image."
        )

    # 3. Read uploaded photo into memory only (DO NOT SAVE TO DISK OR DB)
    customer_bytes = await file.read()
    if len(customer_bytes) > MAX_TRYON_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Photo exceeds the maximum allowed limit of 5MB."
        )
    if len(customer_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded photo is empty. Please select a valid photo."
        )

    try:
        customer_img = Image.open(io.BytesIO(customer_bytes))
        customer_img.load()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to parse uploaded image. Please ensure it is a valid photo."
        )

    # 4. Load the product's first image
    product = await db.products.find_one({'id': product_id}, {'_id': 0})
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    images = product.get('images', [])
    if not images or not images[0]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This product does not have any product images available for virtual try-on."
        )

    product_img_src = images[0]
    product_img = None
    try:
        if product_img_src.startswith(('http://', 'https://')):
            resp = requests.get(product_img_src, timeout=15)
            resp.raise_for_status()
            product_img = Image.open(io.BytesIO(resp.content))
            product_img.load()
        else:
            clean_path = product_img_src.lstrip('/')
            candidate_paths = [
                ROOT_DIR.parent / "frontend" / "public" / clean_path,
                ROOT_DIR / clean_path,
                UPLOAD_PRODUCTS_DIR / Path(clean_path).name,
            ]
            found_path = next((p for p in candidate_paths if p.is_file()), None)
            if not found_path:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Product reference image file not found on server."
                )
            with open(found_path, "rb") as f:
                product_img = Image.open(io.BytesIO(f.read()))
                product_img.load()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to load product image for tryon: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to load product image for try-on."
        )

    # 5. Convert images to standard RGB if needed
    if customer_img.mode != "RGB":
        customer_img = customer_img.convert("RGB")
    if product_img.mode != "RGB":
        product_img = product_img.convert("RGB")

    # 6. Verify Gemini API Key exists
    gemini_key = os.environ.get('GEMINI_API_KEY')
    if not gemini_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Virtual Try-On AI service is not configured on the server."
        )

    # 7. Call Gemini API
    model_name = os.environ.get('GEMINI_IMAGE_MODEL', GEMINI_IMAGE_MODEL)
    prompt_text = (
        "Dress the person in the first photo in the garment shown in the second image. "
        "Keep the person's face, body shape, pose, skin tone and background unchanged. "
        "Only change the clothing."
    )

    try:
        genai_client = genai.Client(api_key=gemini_key)
        response = genai_client.models.generate_content(
            model=model_name,
            contents=[customer_img, product_img, prompt_text],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
            )
        )
    except HTTPException:
        raise
    except Exception as err:
        err_msg = str(err).lower()
        err_type = type(err).__name__
        logger.error(f"Gemini API tryon generation failed: {err_type}")

        if "resource_exhausted" in err_msg or "quota" in err_msg or "429" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="The AI virtual try-on service is experiencing high demand or rate limits. Please try again in a little while."
            )
        elif "timeout" in err_msg or "deadline" in err_msg or "timed out" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="The AI service took too long to generate your preview. Please try again."
            )
        elif "safety" in err_msg or "blocked" in err_msg or "harm" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The photo could not be processed due to safety guidelines. Please try with a different photo."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to generate virtual try-on preview at this time. Please try again later."
            )

    # 8. Check for safety blocks or extract generated image
    if hasattr(response, 'candidates') and response.candidates:
        for cand in response.candidates:
            finish_reason = getattr(cand, 'finish_reason', None)
            if finish_reason and str(finish_reason).upper() == "SAFETY":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The photo could not be processed due to safety guidelines. Please try with a different photo."
                )

    generated_bytes = None
    output_mime = "image/png"

    if hasattr(response, 'parts') and response.parts:
        for part in response.parts:
            if getattr(part, 'inline_data', None) is not None:
                generated_bytes = part.inline_data.data
                output_mime = getattr(part.inline_data, 'mime_type', None) or "image/png"
                break

    if not generated_bytes and hasattr(response, 'candidates') and response.candidates:
        for cand in response.candidates:
            if cand.content and cand.content.parts:
                for part in cand.content.parts:
                    if getattr(part, 'inline_data', None) is not None:
                        generated_bytes = part.inline_data.data
                        output_mime = getattr(part.inline_data, 'mime_type', None) or "image/png"
                        break
                if generated_bytes:
                    break

    if not generated_bytes:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI model did not produce an image output. Please try with a clearer photo."
        )

    # 9. Format base64 Data URL (in memory only!)
    b64_image = base64.b64encode(generated_bytes).decode('utf-8')
    data_url = f"data:{output_mime};base64,{b64_image}"

    # 10. Update daily usage count for user
    await db.tryon_usage.update_one(
        {'user_id': user_id, 'date': today_str},
        {
            '$inc': {'count': 1},
            '$set': {'updated_at': datetime.now(timezone.utc).isoformat()},
            '$setOnInsert': {'created_at': datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    new_count = current_count + 1
    remaining = max(0, DAILY_TRYON_LIMIT - new_count)

    return {
        "success": True,
        "image": data_url,
        "image_url": data_url,
        "daily_used": new_count,
        "daily_limit": DAILY_TRYON_LIMIT,
        "remaining": remaining
    }

# ==================== SITE CONTENT ====================

DEFAULT_SITE_CONTENT = {
    "key": "home",
    "announcement": {
        "enabled": True,
        "messages": [
            { "prefix": "BUY 1 GET ", "highlight": "20% OFF", "suffix": "" },
            { "prefix": "BUY 2 GET EXTRA ", "highlight": "₹500 OFF", "suffix": "" },
            { "prefix": "FREE SHIPPING ON ORDERS ABOVE ₹2999", "highlight": "", "suffix": "" }
        ]
    },
    "hero_slides": [
        {
            "id": 1,
            "tabName": "NEW SEASON",
            "label": "JUST IN",
            "title1": "NEW SEASON",
            "title2": "ARRIVALS",
            "description": "Fresh co-ords, kurtas and dresses, now in store.",
            "buttonText": "SHOP NEW ARRIVALS",
            "link": "/shop?filter=new",
            "video": "/videos/banner/banner-1-new-season.mp4",
            "poster": "/videos/banner/banner-1-new-season-poster.jpg",
            "image": "",
            "objectPosition": "center 35%"
        },
        {
            "id": 2,
            "tabName": "ELEGANCE",
            "label": "TIMELESS ELEGANCE",
            "title1": "EVERY OCCASION",
            "title2": "COVERED",
            "description": "Kurtas, dresses and co-ords crafted for every moment.",
            "buttonText": "SHOP COLLECTIONS",
            "link": "/shop",
            "video": "/videos/banner/banner-2-elegance.mp4",
            "poster": "/videos/banner/banner-2-elegance-poster.jpg",
            "image": "",
            "objectPosition": "center 25%"
        },
        {
            "id": 3,
            "tabName": "BOUTIQUE PICKS",
            "label": "HANDPICKED",
            "title1": "CURATED",
            "title2": "COLLECTIONS",
            "description": "Discover thoughtfully designed pieces crafted to elevate your style.",
            "buttonText": "EXPLORE SHOP",
            "link": "/shop",
            "video": "/videos/banner/banner-3-festive-wear.mp4",
            "poster": "/videos/banner/banner-3-festive-wear-poster.jpg",
            "image": "",
            "objectPosition": "center 35%"
        },
        {
            "id": 4,
            "tabName": "OUR COUTURE",
            "label": "BESPOKE CRAFT",
            "title1": "FASHION CRAFTED",
            "title2": "AROUND YOU",
            "description": "Where timeless Indian elegance meets contemporary design aesthetics.",
            "buttonText": "VISIT OUR STORE",
            "link": "/our-stores",
            "video": "/videos/banner/banner-4-crop-top-set.mp4",
            "poster": "/videos/banner/banner-4-crop-top-set-poster.jpg",
            "image": "",
            "objectPosition": "center 35%"
        }
    ]
}

@api_router.get("/site-content")
async def get_site_content():
    content = await db.site_content.find_one({"key": "home"}, {"_id": 0})
    if not content:
        return DEFAULT_SITE_CONTENT
    if "announcement" not in content:
        content["announcement"] = DEFAULT_SITE_CONTENT["announcement"]
    if "hero_slides" not in content or not content["hero_slides"] or len(content["hero_slides"]) < 4:
        content["hero_slides"] = DEFAULT_SITE_CONTENT["hero_slides"]
    return content

@api_router.put("/admin/site-content")
async def update_site_content(
    payload: Dict[str, Any],
    admin: dict = Depends(get_current_admin)
):
    update_data = {}
    if "announcement" in payload and isinstance(payload["announcement"], dict):
        ann = payload["announcement"]
        raw_msgs = ann.get("messages", [])
        clean_msgs = []
        for m in raw_msgs[:3]:
            if isinstance(m, str):
                clean_msgs.append({"prefix": m, "highlight": "", "suffix": ""})
            elif isinstance(m, dict):
                clean_msgs.append({
                    "prefix": str(m.get("prefix", "") or ""),
                    "highlight": str(m.get("highlight", "") or ""),
                    "suffix": str(m.get("suffix", "") or "")
                })
        update_data["announcement"] = {
            "enabled": bool(ann.get("enabled", True)),
            "messages": clean_msgs
        }

    if "hero_slides" in payload and isinstance(payload["hero_slides"], list):
        raw_slides = payload["hero_slides"][:6]
        clean_slides = []
        for i, slide_data in enumerate(raw_slides):
            if not isinstance(slide_data, dict):
                continue
            default_ref = DEFAULT_SITE_CONTENT["hero_slides"][i] if i < len(DEFAULT_SITE_CONTENT["hero_slides"]) else {}
            clean_slides.append({
                "id": slide_data.get("id", default_ref.get("id", i + 1)),
                "tabName": str(slide_data.get("tabName", default_ref.get("tabName", f"Slide {i+1}")) or f"Slide {i+1}"),
                "label": str(slide_data.get("label", default_ref.get("label", "EXCLUSIVE")) or "EXCLUSIVE"),
                "title1": str(slide_data.get("title1", default_ref.get("title1", "JARIDAR")) or "JARIDAR"),
                "title2": str(slide_data.get("title2", default_ref.get("title2", "COLLECTION")) or "COLLECTION"),
                "description": str(slide_data.get("description", default_ref.get("description", "")) or ""),
                "buttonText": str(slide_data.get("buttonText", default_ref.get("buttonText", "EXPLORE")) or "EXPLORE"),
                "link": str(slide_data.get("link", default_ref.get("link", "/shop")) or "/shop"),
                "video": str(slide_data.get("video", default_ref.get("video", "/videos/banner/banner-1-new-season.mp4")) or "/videos/banner/banner-1-new-season.mp4"),
                "poster": str(slide_data.get("poster", default_ref.get("poster", "/videos/banner/banner-1-new-season-poster.jpg")) or "/videos/banner/banner-1-new-season-poster.jpg"),
                "image": str(slide_data.get("image", "") or ""),
                "objectPosition": str(slide_data.get("objectPosition", default_ref.get("objectPosition", "center 35%")) or "center 35%")
            })
        if clean_slides:
            update_data["hero_slides"] = clean_slides

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.site_content.update_one(
        {"key": "home"},
        {"$set": update_data},
        upsert=True
    )

    updated_doc = await db.site_content.find_one({"key": "home"}, {"_id": 0})
    return updated_doc

async def ensure_seed_site_content():
    content = await db.site_content.find_one({"key": "home"})
    if not content:
        seed_data = DEFAULT_SITE_CONTENT.copy()
        seed_data["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.site_content.insert_one(seed_data)
        logger.info("Default site content seeded into db.site_content")

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

# ==================== ADMIN DASHBOARD ROUTES ====================

@api_router.get("/admin/dashboard-stats")
async def admin_get_dashboard_stats(admin: dict = Depends(get_current_admin)):
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    
    statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"]
    orders_by_status = {}
    for s in statuses:
        orders_by_status[s] = await db.orders.count_documents({"order_status": s})
        
    revenue_orders = await db.orders.find(
        {"order_status": {"$in": ["delivered", "confirmed"]}},
        {"total_amount": 1, "_id": 0}
    ).to_list(10000)
    total_revenue = round(sum(float(o.get("total_amount", 0)) for o in revenue_orders), 2)
    
    total_customers = await db.users.count_documents(
        {"$or": [{"is_admin": False}, {"is_admin": {"$exists": False}}, {"is_admin": None}]}
    )
    if total_customers == 0:
        total_customers = await db.users.count_documents({})
        
    low_stock_cursor = db.products.find(
        {"stock": {"$lt": 5}},
        {"_id": 0, "id": 1, "name": 1, "stock": 1, "price": 1, "images": 1, "category": 1, "product_type": 1}
    ).sort("stock", 1)
    low_stock_products = await low_stock_cursor.to_list(100)
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "orders_by_status": orders_by_status,
        "total_revenue": total_revenue,
        "total_customers": total_customers,
        "low_stock_products": low_stock_products
    }

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

UPLOAD_PRODUCTS_DIR = ROOT_DIR.parent / "frontend" / "public" / "images" / "products"
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@api_router.post("/admin/products/upload-image")
async def admin_upload_product_image(
    file: UploadFile = File(...),
    admin: dict = Depends(get_current_admin)
):
    original_filename = file.filename or "image.jpg"
    ext = Path(original_filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPG, PNG, and WebP images are allowed."
        )

    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type. Only JPG, PNG, and WebP images are allowed."
        )

    content = await file.read()
    if len(content) > MAX_IMAGE_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit of 5MB."
        )
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    base_stem = Path(original_filename).stem
    slug = re.sub(r'[^a-zA-Z0-9_-]', '-', base_stem).strip('-').lower()
    slug = re.sub(r'-+', '-', slug)
    if not slug:
        slug = "product"

    normalized_ext = ".jpg" if ext == ".jpeg" else ext
    timestamp = int(datetime.now(timezone.utc).timestamp())
    filename = f"{slug}-{timestamp}{normalized_ext}"

    UPLOAD_PRODUCTS_DIR.mkdir(parents=True, exist_ok=True)
    destination_path = UPLOAD_PRODUCTS_DIR / filename
    if destination_path.exists():
        filename = f"{slug}-{timestamp}-{uuid.uuid4().hex[:6]}{normalized_ext}"
        destination_path = UPLOAD_PRODUCTS_DIR / filename

    with open(destination_path, "wb") as f:
        f.write(content)

    public_path = f"/images/products/{filename}"
    logger.info(f"Product image uploaded: {destination_path} -> {public_path}")

    return {
        "url": public_path,
        "image_url": public_path,
        "path": public_path,
        "filename": filename
    }

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

# ==================== ADMIN CUSTOMERS ROUTES ====================

@api_router.get("/admin/customers")
async def admin_get_customers(admin: dict = Depends(get_current_admin)):
    users = await db.users.find({}, {"password": 0, "_id": 0}).sort("created_at", -1).to_list(1000)
    customers = []
    for u in users:
        u_id = u.get("id")
        u_email = u.get("email")
        query_conditions = []
        if u_id:
            query_conditions.append({"user_id": u_id})
        if u_email:
            query_conditions.append({"shipping_address.email": u_email})
        
        order_count = await db.orders.count_documents({"$or": query_conditions}) if query_conditions else 0
        
        customers.append({
            "id": u_id,
            "name": u.get("name") or "Unnamed User",
            "email": u_email or "",
            "phone": u.get("phone") or "",
            "created_at": u.get("created_at"),
            "is_admin": bool(u.get("is_admin", False)),
            "order_count": order_count,
            "total_orders": order_count
        })
    return customers

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

# ==================== ADMIN REVIEWS ROUTES ====================

@api_router.get("/admin/reviews")
async def admin_get_reviews(admin: dict = Depends(get_current_admin)):
    reviews = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    enriched_reviews = []
    
    for r in reviews:
        prod_id = r.get("product_id")
        user_id = r.get("user_id")
        
        product = await db.products.find_one({"id": prod_id}, {"_id": 0, "name": 1, "images": 1}) if prod_id else None
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1, "email": 1}) if user_id else None
        
        product_name = (product.get("name") if product else None) or "Unknown Product"
        product_images = product.get("images") if product else []
        product_image = product_images[0] if (product_images and len(product_images) > 0) else None
        
        customer_name = (user.get("name") if user else None) or r.get("user_name") or "Anonymous Customer"
        customer_email = user.get("email") if user else None
        
        enriched_reviews.append({
            "id": r.get("id"),
            "product_id": prod_id,
            "product_name": product_name,
            "product_image": product_image,
            "user_id": user_id,
            "user_name": customer_name,
            "customer_name": customer_name,
            "customer_email": customer_email,
            "rating": r.get("rating", 5),
            "comment": r.get("comment", ""),
            "created_at": r.get("created_at")
        })
        
    return enriched_reviews

@api_router.delete("/admin/reviews/{review_id}")
async def admin_delete_review(review_id: str, admin: dict = Depends(get_current_admin)):
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    product_id = review.get("product_id")
    await db.reviews.delete_one({"id": review_id})
    
    if product_id:
        remaining_reviews = await db.reviews.find({"product_id": product_id}).to_list(1000)
        if remaining_reviews:
            avg_rating = round(sum(r.get("rating", 0) for r in remaining_reviews) / len(remaining_reviews), 1)
            count = len(remaining_reviews)
        else:
            avg_rating = 0.0
            count = 0
        await db.products.update_one(
            {"id": product_id},
            {"$set": {"rating": avg_rating, "review_count": count}}
        )
        
    return {"message": "Review deleted successfully", "id": review_id}

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
    for cart_item in cart:
        product = await db.products.find_one({'id': cart_item['product_id']}, {'_id': 0})
        if not product:
            continue
        
        # Verify stock availability on the server
        requested_qty = int(cart_item.get('quantity', 1))
        available_stock = int(product.get('stock', 0))
        if available_stock < requested_qty:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.get('name', 'Product')}'. Available: {available_stock}"
            )

        item_price = float(product['price'])
        item_total = item_price * requested_qty
        items.append({
            'product_id': product['id'],
            'product_name': product['name'],
            'product_image': product['images'][0] if product.get('images') else '',
            'price': item_price,
            'quantity': requested_qty,
            'size': cart_item.get('size', ''),
            'color': cart_item.get('color', ''),
            'subtotal': item_total
        })

    if not items:
        raise HTTPException(status_code=400, detail='No valid items in cart')

    # Server-side amount calculation: never trust browser amounts
    subtotal, shipping_fee, total_amount = calculate_cart_totals(items)
    amount_in_paise = int(round(total_amount * 100))

    order_id = str(uuid.uuid4())
    razorpay_order_id = None
    public_key_id = None

    has_live_keys = bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)

    if has_live_keys:
        try:
            client_to_use = razorpay_client or razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
            rzp_order = client_to_use.order.create({
                'amount': amount_in_paise,
                'currency': 'INR',
                'receipt': order_id,
                'payment_capture': 1
            })
            razorpay_order_id = rzp_order.get('id')
            public_key_id = RAZORPAY_KEY_ID
        except Exception as e:
            logger.error(f"Razorpay order creation error: {type(e).__name__}: {str(e)}")
            raise HTTPException(
                status_code=502,
                detail="Payment gateway communication error. Please try again later."
            )
    else:
        # Live keys missing: check environment
        if APP_ENV == 'development':
            # Development fake-mode allowed only if APP_ENV=development
            razorpay_order_id = f"order_dev_{uuid.uuid4().hex[:12]}"
            public_key_id = "rzp_dev_mock_key"
            logger.info(f"[DEV MODE] Created mock Razorpay order {razorpay_order_id} for order {order_id}")
        else:
            # Production/Staging: Do not create a paid order or simulate success
            raise HTTPException(
                status_code=503,
                detail="Payments are not available right now. Please check back later."
            )

    order_doc = {
        'id': order_id,
        'user_id': user['id'],
        'items': items,
        'subtotal': subtotal,
        'shipping_fee': shipping_fee,
        'total_amount': total_amount,
        'shipping_address': order_data.shipping_address,
        'payment_method': order_data.payment_method,
        'payment_status': 'pending',
        'order_status': 'pending',
        'razorpay_order_id': razorpay_order_id,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)

    # Return only the public key id to frontend, never the secret
    return {
        'order_id': order_id,
        'razorpay_order_id': razorpay_order_id,
        'amount': total_amount,
        'currency': 'INR',
        'key_id': public_key_id
    }

@api_router.post("/orders/verify-payment")
async def verify_payment(payment: PaymentVerify, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({
        'razorpay_order_id': payment.razorpay_order_id,
        'user_id': user['id']
    })
    
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')

    # Idempotent check: if already completed, do not re-process stock or cart
    if order.get('payment_status') == 'completed':
        return {
            'message': 'Payment already verified',
            'order_id': order['id'],
            'status': 'completed'
        }

    # Verify signature
    is_valid = False
    if RAZORPAY_KEY_SECRET:
        is_valid = verify_razorpay_payment_signature(
            razorpay_order_id=payment.razorpay_order_id,
            razorpay_payment_id=payment.razorpay_payment_id,
            signature=payment.razorpay_signature,
            secret=RAZORPAY_KEY_SECRET
        )
    elif APP_ENV == 'development' and str(payment.razorpay_signature).startswith("mock_sig"):
        is_valid = True
    else:
        raise HTTPException(
            status_code=503,
            detail="Payments are not available right now. Verification cannot proceed."
        )

    if not is_valid:
        # If signature is invalid, return an error and leave the order pending
        logger.warning(f"Payment verification failed for order {order['id']}: Invalid signature")
        raise HTTPException(status_code=400, detail='Payment verification failed. Invalid signature.')

    # Atomic update to guarantee an order cannot be marked paid twice
    now_iso = datetime.now(timezone.utc).isoformat()
    update_result = await db.orders.update_one(
        {
            'id': order['id'],
            'payment_status': {'$ne': 'completed'}
        },
        {
            '$set': {
                'payment_status': 'completed',
                'order_status': 'confirmed',
                'razorpay_payment_id': payment.razorpay_payment_id,
                'razorpay_signature': payment.razorpay_signature,
                'paid_at': now_iso,
                'paid_via': 'client_verify'
            }
        }
    )

    # Only execute post-payment side effects if this invocation transitioned the status
    if update_result.modified_count == 1:
        # Reduce product stock
        for item in order.get('items', []):
            prod_id = item.get('product_id')
            qty = int(item.get('quantity', 1))
            if prod_id and qty > 0:
                await db.products.update_one(
                    {'id': prod_id},
                    {'$inc': {'stock': -qty}}
                )

        # Clear cart for user
        await db.cart.delete_many({'user_id': user['id']})

    return {
        'message': 'Payment verified successfully',
        'order_id': order['id'],
        'status': 'completed'
    }

@api_router.post("/webhooks/razorpay")
async def razorpay_webhook(request: Request):
    """
    Razorpay Webhook Handler.
    Verifies X-Razorpay-Signature using RAZORPAY_WEBHOOK_SECRET over raw request body.
    Handles payment.captured / order.paid (idempotent mark paid) and payment.failed.
    """
    if not RAZORPAY_WEBHOOK_SECRET:
        logger.error("Razorpay webhook rejected: RAZORPAY_WEBHOOK_SECRET is not configured.")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")

    signature = request.headers.get("X-Razorpay-Signature") or request.headers.get("x-razorpay-signature")
    if not signature:
        logger.warning("Razorpay webhook rejected: Missing X-Razorpay-Signature header.")
        raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header")

    raw_body = await request.body()
    if not verify_razorpay_webhook_signature(raw_body, signature, RAZORPAY_WEBHOOK_SECRET):
        logger.warning("Razorpay webhook rejected: Invalid signature.")
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        event_payload = json.loads(raw_body.decode("utf-8"))
    except Exception as e:
        logger.error(f"Razorpay webhook JSON parse failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event = event_payload.get("event")
    logger.info(f"Razorpay webhook validated: event={event}")

    if event in ("payment.captured", "order.paid"):
        payment_entity = event_payload.get("payload", {}).get("payment", {}).get("entity", {})
        order_entity = event_payload.get("payload", {}).get("order", {}).get("entity", {})

        razorpay_order_id = payment_entity.get("order_id") or order_entity.get("id")
        razorpay_payment_id = payment_entity.get("id")

        if not razorpay_order_id:
            logger.warning(f"Razorpay webhook {event} missing order_id.")
            return {"status": "ignored", "reason": "Missing razorpay order_id"}

        order = await db.orders.find_one({'razorpay_order_id': razorpay_order_id})
        if not order:
            logger.warning(f"Razorpay webhook {event}: Order not found for {razorpay_order_id}")
            return {"status": "ignored", "reason": "Order not found in database"}

        # Atomic idempotent mark paid
        now_iso = datetime.now(timezone.utc).isoformat()
        update_result = await db.orders.update_one(
            {
                'id': order['id'],
                'payment_status': {'$ne': 'completed'}
            },
            {
                '$set': {
                    'payment_status': 'completed',
                    'order_status': 'confirmed',
                    'razorpay_payment_id': razorpay_payment_id or order.get('razorpay_payment_id'),
                    'paid_at': now_iso,
                    'paid_via': 'webhook'
                }
            }
        )

        if update_result.modified_count == 1:
            logger.info(f"Order {order['id']} marked completed via webhook {event}")
            # Reduce product stock
            for item in order.get('items', []):
                prod_id = item.get('product_id')
                qty = int(item.get('quantity', 1))
                if prod_id and qty > 0:
                    await db.products.update_one(
                        {'id': prod_id},
                        {'$inc': {'stock': -qty}}
                    )

            # Clear cart for user
            await db.cart.delete_many({'user_id': order['user_id']})
        else:
            logger.info(f"Order {order['id']} was already marked completed; duplicate webhook {event} ignored.")

        return {"status": "ok", "order_id": order['id']}

    elif event == "payment.failed":
        payment_entity = event_payload.get("payload", {}).get("payment", {}).get("entity", {})
        razorpay_order_id = payment_entity.get("order_id")
        err_msg = payment_entity.get("error_description") or payment_entity.get("error_code") or "Payment failed"

        if razorpay_order_id:
            order = await db.orders.find_one({'razorpay_order_id': razorpay_order_id})
            if order and order.get('payment_status') != 'completed':
                # Leave order pending so the user can retry
                await db.orders.update_one(
                    {'id': order['id'], 'payment_status': 'pending'},
                    {
                        '$set': {
                            'last_payment_error': err_msg,
                            'updated_at': datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                logger.info(f"Recorded payment failure on order {order['id']}: {err_msg}")

        return {"status": "ok", "message": "Payment failure recorded"}

    return {"status": "ignored", "event": event}

# ==================== NEWSLETTER ROUTES ====================

@api_router.post("/newsletter/subscribe")
async def subscribe_newsletter(data: NewsletterSubscribe):
    email = (data.email or "").strip().lower()
    email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not email or not re.match(email_regex, email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    existing = await db.newsletter.find_one({'email': email})
    if existing:
        raise HTTPException(status_code=400, detail="You are already subscribed")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.newsletter.insert_one({
        'id': str(uuid.uuid4()),
        'email': email,
        'subscribed_at': now,
        'created_at': now
    })
    return {'message': 'Successfully subscribed to newsletter'}

@api_router.get("/admin/newsletter")
async def admin_get_newsletter(admin: dict = Depends(get_current_admin)):
    subscribers = await db.newsletter.find({}, {"_id": 0}).sort("subscribed_at", -1).to_list(10000)
    result = []
    for s in subscribers:
        sub_date = s.get("subscribed_at") or s.get("created_at") or ""
        result.append({
            "id": s.get("id"),
            "email": s.get("email", ""),
            "subscribed_at": sub_date,
            "created_at": sub_date
        })
    return result

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

# Mount public images directory for static serving
images_dir = ROOT_DIR.parent / "frontend" / "public" / "images"
if images_dir.exists():
    app.mount("/images", StaticFiles(directory=str(images_dir)), name="images")

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
    await ensure_seed_site_content()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
