from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import razorpay
import hmac
import hashlib

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
            'phone': user_doc['phone']
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    
    token = create_token(user['id'])
    return {
        'token': token,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'phone': user.get('phone')
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.put("/auth/profile")
async def update_profile(update: UserUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({'id': user['id']}, {'$set': update_data})
    updated_user = await db.users.find_one({'id': user['id']}, {'_id': 0, 'password': 0})
    return updated_user

# ==================== PRODUCTS ROUTES ====================

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
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
        query['category'] = category
    if subcategory:
        query['subcategory'] = subcategory
    if featured is not None:
        query['featured'] = featured
    if is_new is not None:
        query['is_new'] = is_new
    if min_price is not None:
        query['price'] = {'$gte': min_price}
    if max_price is not None:
        query['price'] = {**query.get('price', {}), '$lte': max_price}
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}}
        ]
    
    products = await db.products.find(query, {'_id': 0}).skip(skip).limit(limit).to_list(limit)
    return products

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({'id': product_id}, {'_id': 0})
    if not product:
        raise HTTPException(status_code=404, detail='Product not found')
    return product

@api_router.get("/categories")
async def get_categories():
    categories = [
        {
            'id': 'ethnic',
            'name': 'Ethnic Wear',
            'subcategories': ['Sarees', 'Lehengas', 'Salwar Suits', 'Kurtis'],
            'image': 'https://images.unsplash.com/photo-1763971922538-5802acdd48b8?w=600'
        },
        {
            'id': 'traditional',
            'name': 'Traditional Wear',
            'subcategories': ['Anarkalis', 'Sharara Sets', 'Palazzo Sets', 'Gharara Sets'],
            'image': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600'
        },
        {
            'id': 'western',
            'name': 'Western Wear',
            'subcategories': ['Dresses', 'Tops', 'Jeans', 'Skirts', 'Jumpsuits'],
            'image': 'https://images.unsplash.com/photo-1612364557094-98a4b47200f6?w=600'
        },
        {
            'id': 'bridal',
            'name': 'Bridal Collection',
            'subcategories': ['Bridal Lehengas', 'Reception Gowns', 'Sangeet Outfits', 'Mehendi Outfits'],
            'image': 'https://images.unsplash.com/photo-1759906766380-7a5849e6fb13?w=600'
        }
    ]
    return categories

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
async def seed_data():
    """Seed initial product data"""
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
                'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
                'https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg?w=600'
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
                'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
                'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?w=600'
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
                'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=600',
                'https://images.pexels.com/photos/8285167/pexels-photo-8285167.jpeg?w=600'
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
                'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600',
                'https://images.pexels.com/photos/7679863/pexels-photo-7679863.jpeg?w=600'
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
                'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
                'https://images.pexels.com/photos/6069185/pexels-photo-6069185.jpeg?w=600'
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
                'https://images.unsplash.com/photo-1612364557094-98a4b47200f6?w=600',
                'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?w=600'
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
                'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600',
                'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?w=600'
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
                'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600',
                'https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg?w=600'
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
                'https://images.unsplash.com/photo-1760613129745-418b15f91d56?w=600',
                'https://images.unsplash.com/photo-1759906766380-7a5849e6fb13?w=600'
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
                'https://images.unsplash.com/photo-1519657337289-077653f724ed?w=600',
                'https://images.pexels.com/photos/291759/pexels-photo-291759.jpeg?w=600'
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
                'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=600',
                'https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg?w=600'
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
                'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
                'https://images.pexels.com/photos/6069185/pexels-photo-6069185.jpeg?w=600'
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
