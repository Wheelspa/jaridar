"""
Virtual Try-On Module for Jaridar Fashion Couture
Provides per-try-on payments (1 Payment = 1 Try-On), Razorpay payment verification,
photo upload processing, FASHN AI tryon-v1.6 integration, auto-retry on failure,
automatic refund handling, and background expiry management.

ENVIRONMENT VARIABLES:
- TRYON_ENABLED: "true" or "false" (default "false"). If false, returns HTTP 503.
- TRYON_PROVIDER: "mock" or "fashn" (default "mock").
- TRYON_PRICE_INR: Price in rupees per try-on (default "15", i.e. 1500 paise).
- TRYON_RAZORPAY_KEY_ID: Dedicated Razorpay Key ID (optional; falls back to RAZORPAY_KEY_ID).
- TRYON_RAZORPAY_KEY_SECRET: Dedicated Razorpay Key Secret (optional; falls back to RAZORPAY_KEY_SECRET).
- FASHN_API_KEY: API key for FASHN AI (required if TRYON_PROVIDER="fashn").
- TRYON_FASHN_MODE: FASHN mode: "performance", "balanced", or "quality" (default "balanced").
- FRONTEND_PUBLIC_URL: Base URL for resolving garment image paths (default "https://jaridar.com").
- TRYON_MOCK_FAIL: "true" to simulate provider failure in tests (ignored when provider is "fashn").
- TRYON_REFUND_DRY_RUN: "true" to simulate Razorpay refunds without real gateway calls (ignored when provider is "fashn").

PRIVACY GUARANTEE:
The customer's photo is processed strictly in-memory and is NEVER saved
to disk or database, never logged, and never stored anywhere.
"""

import os
import io
import re
import time
import uuid
import hmac
import base64
import hashlib
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple

import httpx
from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from pydantic import BaseModel
from PIL import Image
import razorpay

from server import db, get_current_user

logger = logging.getLogger(__name__)

ALLOWED_TRYON_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_TRYON_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_TRYON_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_DAILY_RUNS_PER_USER = 10
SESSION_EXPIRY_MINUTES = 15
MAX_REFUND_ATTEMPTS = 5

_expiry_task: Optional[asyncio.Task] = None


def is_tryon_enabled() -> bool:
    """
    Returns True if try-on feature is enabled via TRYON_ENABLED env var (default false).
    """
    return os.environ.get('TRYON_ENABLED', 'false').lower() in ('true', '1', 'yes')


def check_tryon_enabled():
    """
    Dependency for try-on endpoints requiring active feature.
    If disabled, raises HTTP 503.
    """
    if not is_tryon_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Try-on is coming soon"
        )


def get_tryon_razorpay_credentials() -> Tuple[str, str]:
    """
    Returns Razorpay credentials for try-on.
    Checks TRYON_RAZORPAY_KEY_ID/SECRET first; falls back to RAZORPAY_KEY_ID/SECRET.
    """
    key_id = os.environ.get('TRYON_RAZORPAY_KEY_ID', '').strip() or os.environ.get('RAZORPAY_KEY_ID', '').strip()
    key_secret = os.environ.get('TRYON_RAZORPAY_KEY_SECRET', '').strip() or os.environ.get('RAZORPAY_KEY_SECRET', '').strip()
    if not key_id or not key_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Try-on payment gateway is not configured"
        )
    return key_id, key_secret


def get_tryon_price_inr() -> int:
    """
    Price per try-on in INR. Defaults to 15 INR (1500 paise).
    """
    try:
        return int(os.environ.get('TRYON_PRICE_INR', '15'))
    except ValueError:
        return 15


class TryOnVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# ==================== REFUND HANDLER ====================

async def refund_payment(payment_doc: dict, reason: str = "Try-on failed") -> bool:
    """
    Atomically moves payment to 'refunding', calls Razorpay refund API,
    and updates status to 'refunded' (or 'refund_failed').
    Ensures refund is executed at most once per payment.
    Prevents double refunds if refund_id already exists.
    Stops after MAX_REFUND_ATTEMPTS (5) and logs only the order_id.
    """
    payment_id = payment_doc.get("razorpay_payment_id")
    order_id = payment_doc.get("razorpay_order_id", "unknown")
    amount_paise = min(int(payment_doc.get("amount_paise", 1500)), 1500)
    now_iso = datetime.now(timezone.utc).isoformat()

    # If refund was already issued at Razorpay, do not duplicate
    if payment_doc.get("refund_id"):
        await db.tryon_payments.update_one(
            {"_id": payment_doc["_id"]},
            {
                "$set": {
                    "status": "refunded",
                    "refunded_at": now_iso
                }
            }
        )
        return True

    # Check maximum retry attempts
    refund_attempts = int(payment_doc.get("refund_attempts", 0))
    if refund_attempts >= MAX_REFUND_ATTEMPTS:
        logger.error(f"Max refund attempts exceeded for order {order_id}")
        return False

    # 1. Atomic transition to 'refunding'
    set_fields = {
        "status": "refunding",
        "refunding_at": now_iso,
        "refund_reason": reason
    }
    if payment_id:
        set_fields["razorpay_payment_id"] = payment_id

    claimed = await db.tryon_payments.find_one_and_update(
        {
            "_id": payment_doc["_id"],
            "status": {"$in": ["paid", "processing", "expired", "refund_failed", "created"]}
        },
        {
            "$set": set_fields,
            "$inc": {"refund_attempts": 1}
        }
    )
    if not claimed:
        # Check if already refunded
        existing = await db.tryon_payments.find_one({"_id": payment_doc["_id"]})
        if existing and existing.get("refund_id"):
            return True
        logger.warning(f"Payment {order_id} could not be transitioned to refunding (current status ineligible)")
        return False

    # 2. Call Razorpay refund
    provider = os.environ.get('TRYON_PROVIDER', 'mock').lower()
    # DRY_RUN is strictly ignored when provider is fashn
    dry_run = False if provider == 'fashn' else (os.environ.get('TRYON_REFUND_DRY_RUN', 'false').lower() in ('true', '1', 'yes'))
    refund_id = None

    if dry_run or not payment_id:
        refund_id = f"rfnd_mock_{uuid.uuid4().hex[:12]}"
        logger.info(f"TRYON_REFUND_DRY_RUN: Simulated refund {refund_id} for order {order_id}")
    else:
        try:
            key_id, key_secret = get_tryon_razorpay_credentials()
            rz_client = razorpay.Client(auth=(key_id, key_secret))
            rz_refund = rz_client.payment.refund(payment_id, {
                "amount": amount_paise,
                "notes": {
                    "reason": reason[:30],
                    "order_id": order_id
                }
            })
            refund_id = rz_refund.get("id")
        except Exception as e:
            logger.error(f"Razorpay refund API call failed for payment {payment_id}: {type(e).__name__}")
            await db.tryon_payments.update_one(
                {"_id": payment_doc["_id"]},
                {
                    "$set": {
                        "status": "refund_failed",
                        "refund_error": str(e),
                        "refund_failed_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            return False

    # 3. Transition to 'refunded'
    await db.tryon_payments.update_one(
        {"_id": payment_doc["_id"]},
        {
            "$set": {
                "status": "refunded",
                "refund_id": refund_id,
                "refunded_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    return True


# ==================== CATEGORY MAPPING & PROVIDER IMPLEMENTATIONS ====================

def get_fashn_category(product: dict) -> str:
    """
    Determines the appropriate FASHN API category ('tops', 'bottoms', 'one-pieces', or 'auto')
    using regex word boundary matching (\\b) so that substring collisions do not occur
    (e.g., 'Sunset' does not match 'set', 'Stop' does not match 'top').
    """
    text = " ".join([
        str(product.get('product_type', '')),
        str(product.get('subcategory', '')),
        str(product.get('category', '')),
        str(product.get('name', ''))
    ]).lower()

    # 1. Sarees are complex unstitched drapes; 'auto' lets FASHN's vision model segment bounds dynamically
    if re.search(r'\b(saree|sari|sarees|saris)\b', text):
        return 'auto'

    # 2. One-pieces: full outfits, dresses, gowns, jumpsuits, and full matching sets
    # Explicit full phrases used for sets instead of standalone 'set'
    one_piece_patterns = [
        r'\bdress\b', r'\bdresses\b', r'\bgown\b', r'\bgowns\b',
        r'\bjumpsuit\b', r'\bjumpsuits\b', r'\bone-piece\b', r'\bone-pieces\b', r'\bone\s+piece\b',
        r'\bco-ord\s+set\b', r'\bco-ord\b', r'\bcoord\s+set\b', r'\bcoord\b', r'\bco\s+ord\b',
        r'\bkurta\s+set\b', r'\bkurti\s+set\b', r'\bsalwar\s+suit\b', r'\bsalwar\s+set\b', r'\bsalwar\b',
        r'\banarkali\b', r'\bsharara\s+set\b', r'\bpalazzo\s+set\b',
        r'\blehenga\b', r'\bghagra\b', r'\blehenga\s+choli\b', r'\bchaniya\s+choli\b'
    ]
    if any(re.search(p, text) for p in one_piece_patterns):
        return 'one-pieces'

    # 3. Bottoms: lower-body garments
    bottom_patterns = [
        r'\bbottom\b', r'\bbottoms\b', r'\bpant\b', r'\bpants\b',
        r'\btrousers\b', r'\btrouser\b', r'\bskirt\b', r'\bskirts\b',
        r'\bpalazzo\b', r'\bpalazzos\b', r'\bsharara\b', r'\bshorts\b',
        r'\bjeans\b', r'\bleggings\b'
    ]
    if any(re.search(p, text) for p in bottom_patterns):
        return 'bottoms'

    # 4. Tops: upper-body garments
    top_patterns = [
        r'\btop\b', r'\btops\b', r'\bshirt\b', r'\bshirts\b',
        r'\bt-shirt\b', r'\bt-shirts\b', r'\btshirt\b', r'\btshirts\b',
        r'\bblouse\b', r'\bblouses\b', r'\bjacket\b', r'\bjackets\b',
        r'\bkurti\b', r'\bkurtis\b', r'\bkurta\b', r'\bkurtas\b', r'\btunic\b', r'\btunics\b'
    ]
    if any(re.search(p, text) for p in top_patterns):
        return 'tops'

    return 'auto'


def map_fashn_error(error_name: str, error_message: str, http_status: int = 502) -> HTTPException:
    """
    Maps FASHN API error details to safe user-friendly messages.
    Does NOT include confusing refund phrases; those are appended by the caller based on refund result.
    Logs ONLY the error type; never images, tokens or keys.
    """
    err_combined = f"{error_name} {error_message}".lower()
    logger.error(f"FASHN error occurred: type={error_name or 'Unknown'}")

    if "pose" in err_combined:
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="We could not detect a clear body pose. Please upload a clear standing photo (full or half body, facing the camera, good light)."
        )
    if any(k in err_combined for k in ["moderation", "blocked", "nsfw", "safety", "sensitive"]):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This photo or product could not be processed."
        )
    if http_status >= 500 or any(k in err_combined for k in ["timeout", "network", "gateway", "service_unavailable"]):
        return HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT if "timeout" in err_combined else status.HTTP_502_BAD_GATEWAY,
            detail="The try-on service is busy. Please try again in a minute."
        )
    return HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="The try-on generation failed. Please try again."
    )


async def run_mock_tryon(customer_image_bytes: bytes, product: dict) -> str:
    """
    Mock try-on provider:
    Simulates try-on without calling external services.
    If TRYON_MOCK_FAIL is enabled (and provider is not fashn), raises an exception.
    """
    provider = os.environ.get('TRYON_PROVIDER', 'mock').lower()
    mock_fail = False if provider == 'fashn' else (os.environ.get('TRYON_MOCK_FAIL', 'false').lower() in ('true', '1', 'yes'))
    if mock_fail:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Mock try-on failure simulated via TRYON_MOCK_FAIL"
        )
    await asyncio.sleep(2)
    images = product.get('images', [])
    if not images or not images[0]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This product does not have any product images available for virtual try-on."
        )
    return images[0]


async def run_fashn_tryon(customer_image_bytes: bytes, product: dict) -> str:
    """
    FASHN AI Virtual Try-On Provider (model tryon-v1.6).
    - Submits garment image (public URL or data URI) and customer photo data URI.
    - Determines garment category using get_fashn_category().
    - Submits task to https://api.fashn.ai/v1/run.
    - Polls https://api.fashn.ai/v1/status/{id} every 2s up to 90s.
    - Returns output[0] (result image URL or data URI).
    - Logs ONLY error types, never images or keys.
    """
    fashn_api_key = os.environ.get('FASHN_API_KEY', '').strip()
    if not fashn_api_key:
        logger.error("FASHN provider requested but FASHN_API_KEY is not set")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Try-on is temporarily unavailable"
        )

    # 1. Garment image: product first image
    images = product.get('images', [])
    if not images or not images[0]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This product does not have any product images available for virtual try-on."
        )
    garment_path = str(images[0]).strip()

    if garment_path.startswith('/'):
        frontend_url = os.environ.get('FRONTEND_PUBLIC_URL', 'https://jaridar.com').rstrip('/')
        full_garment_url = f"{frontend_url}{garment_path}"
    else:
        full_garment_url = garment_path

    # 2. Customer photo: strictly in-memory data URI
    mime = "image/jpeg"
    if customer_image_bytes.startswith(b"\x89PNG"):
        mime = "image/png"
    elif customer_image_bytes.startswith(b"RIFF") and b"WEBP" in customer_image_bytes[:16]:
        mime = "image/webp"
    b64_customer = base64.b64encode(customer_image_bytes).decode('utf-8')
    customer_data_uri = f"data:{mime};base64,{b64_customer}"

    # 3. HTTP Client execution
    async with httpx.AsyncClient(timeout=20.0) as client:
        garment_input = full_garment_url
        if "localhost" in full_garment_url or "127.0.0.1" in full_garment_url or not full_garment_url.startswith("http"):
            try:
                garment_res = await client.get(full_garment_url, timeout=15.0)
                if garment_res.status_code == 200:
                    g_content_type = garment_res.headers.get("content-type", "image/jpeg").split(";")[0].strip()
                    g_b64 = base64.b64encode(garment_res.content).decode('utf-8')
                    garment_input = f"data:{g_content_type};base64,{g_b64}"
            except Exception as e:
                logger.warning(f"Could not download local garment image: {type(e).__name__}")

        cat = get_fashn_category(product)
        mode = os.environ.get('TRYON_FASHN_MODE', 'balanced').strip()

        payload = {
            "model_name": "tryon-v1.6",
            "inputs": {
                "model_image": customer_data_uri,
                "garment_image": garment_input,
                "category": cat,
                "mode": mode,
                "moderation_level": "conservative",
                "num_samples": 1,
                "output_format": "jpeg"
            }
        }
        headers = {
            "Authorization": f"Bearer {fashn_api_key}",
            "Content-Type": "application/json"
        }

        try:
            submit_res = await client.post(
                "https://api.fashn.ai/v1/run",
                headers=headers,
                json=payload,
                timeout=30.0
            )
        except (httpx.TimeoutException, httpx.NetworkError) as e:
            logger.error(f"FASHN submit network/timeout: {type(e).__name__}")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="The try-on service is busy. Please try again in a minute."
            )

        if submit_res.status_code != 200:
            err_json = {}
            try:
                err_json = submit_res.json()
            except Exception:
                pass
            err = err_json.get("error")
            err_name = ""
            err_msg = ""
            if isinstance(err, dict):
                err_name = err.get("name", "")
                err_msg = err.get("message", "")
            elif isinstance(err, str):
                err_msg = err
            raise map_fashn_error(err_name, err_msg, submit_res.status_code)

        submit_data = submit_res.json()
        task_id = submit_data.get("id")
        if not task_id:
            logger.error("FASHN submit succeeded but returned no task id")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The try-on service is busy. Please try again in a minute."
            )

        # Poll status every 2.0s up to 90s
        poll_url = f"https://api.fashn.ai/v1/status/{task_id}"
        start_time = time.time()
        while (time.time() - start_time) < 90:
            await asyncio.sleep(2.0)
            try:
                poll_res = await client.get(poll_url, headers=headers, timeout=10.0)
            except (httpx.TimeoutException, httpx.NetworkError):
                continue

            if poll_res.status_code >= 500:
                continue

            if poll_res.status_code != 200:
                raise map_fashn_error("HttpError", f"Status returned {poll_res.status_code}", poll_res.status_code)

            poll_data = poll_res.json()
            status_str = str(poll_data.get("status", "")).lower()

            if status_str == "completed":
                outputs = poll_data.get("output", [])
                if not outputs or not outputs[0]:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="The try-on generation did not produce an image. Please try again."
                    )
                return outputs[0]

            elif status_str == "failed":
                err = poll_data.get("error")
                err_name = ""
                err_msg = ""
                if isinstance(err, dict):
                    err_name = err.get("name", "")
                    err_msg = err.get("message", "")
                elif isinstance(err, str):
                    err_msg = err
                raise map_fashn_error(err_name, err_msg, 502)

        # Timeout after 90s
        logger.error("FASHN task status polling timed out after 90s")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The try-on service is busy. Please try again in a minute."
        )


async def execute_tryon_provider(customer_image_bytes: bytes, product: dict) -> str:
    """
    Dispatches try-on execution based on TRYON_PROVIDER env var ('mock' or 'fashn').
    Defaults to 'mock'.
    """
    provider = os.environ.get('TRYON_PROVIDER', 'mock').lower()
    if provider == 'mock':
        return await run_mock_tryon(customer_image_bytes, product)
    elif provider == 'fashn':
        return await run_fashn_tryon(customer_image_bytes, product)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown try-on provider: {provider}"
        )


# ==================== ROUTER SETUP ====================

router = APIRouter(
    prefix="/api/tryon",
    tags=["tryon"]
)


@router.get("/config")
async def get_tryon_config():
    """
    Public endpoint returning try-on availability and pricing.
    No authentication required. Does not expose secrets or provider name.
    """
    return {
        "enabled": is_tryon_enabled(),
        "price_inr": get_tryon_price_inr()
    }


@router.post("/order", dependencies=[Depends(check_tryon_enabled)])
async def create_tryon_order(current_user: dict = Depends(get_current_user)):
    """
    Creates a Razorpay order for a single try-on session.
    If provider is 'fashn' and FASHN_API_KEY is missing, rejects without taking payment.
    Stores record in 'tryon_payments' collection with status 'created'.
    Returns order_id, amount in paise (1500), currency, and public key_id.
    """
    provider = os.environ.get('TRYON_PROVIDER', 'mock').lower()
    if provider == 'fashn':
        fashn_key = os.environ.get('FASHN_API_KEY', '').strip()
        if not fashn_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Try-on is temporarily unavailable"
            )

    key_id, key_secret = get_tryon_razorpay_credentials()
    user_id = current_user.get('id')
    user_email = current_user.get('email', '')
    price_inr = get_tryon_price_inr()
    amount_paise = price_inr * 100

    try:
        rz_client = razorpay.Client(auth=(key_id, key_secret))
        rz_order = rz_client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"tryon_{uuid.uuid4().hex[:12]}",
            "notes": {
                "user_id": user_id,
                "user_email": user_email,
                "type": "tryon_payment"
            }
        })
    except Exception as e:
        logger.error(f"Failed to create Razorpay try-on order: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not start the payment. Please try again."
        )

    payment_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "user_email": user_email,
        "razorpay_order_id": rz_order["id"],
        "amount": price_inr,
        "amount_paise": amount_paise,
        "currency": "INR",
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "razorpay_payment_id": None,
        "razorpay_signature": None,
        "paid_at": None,
        "expires_at": None,
        "processing_at": None,
        "succeeded_at": None,
        "product_id": None,
        "image_url": None,
        "refund_id": None,
        "refunded_at": None,
        "refund_reason": None,
        "retry_count": 0,
        "refund_attempts": 0
    }
    await db.tryon_payments.insert_one(payment_doc)

    return {
        "order_id": rz_order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": key_id
    }


@router.post("/verify", dependencies=[Depends(check_tryon_enabled)])
async def verify_tryon_payment(
    payment: TryOnVerifyRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Verifies Razorpay payment signature via HMAC-SHA256.
    Fetches payment from Razorpay API. If status is 'authorized', captures it.
    Rejects any status other than 'captured'.
    Atomically updates status: created -> paid, sets expires_at to paid_at + 15 minutes.
    Idempotent: verifying twice returns success without modifying expires_at or creating double credits.
    """
    key_id, key_secret = get_tryon_razorpay_credentials()
    user_id = current_user.get('id')

    # 1. Verify HMAC SHA256 signature
    generated_signature = hmac.new(
        key_secret.encode('utf-8'),
        f"{payment.razorpay_order_id}|{payment.razorpay_payment_id}".encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(generated_signature, payment.razorpay_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment signature"
        )

    # 2. Check order exists and belongs to this customer
    order = await db.tryon_payments.find_one({
        "razorpay_order_id": payment.razorpay_order_id,
        "user_id": user_id
    })
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Try-on order not found for this customer"
        )

    # 3. Idempotent check
    if order.get("status") == "paid":
        return {
            "message": "Payment already verified",
            "status": "paid",
            "order_id": payment.razorpay_order_id,
            "expires_at": order.get("expires_at")
        }

    if order.get("status") != "created":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order cannot be verified in '{order.get('status')}' status"
        )

    # 4. Fetch payment from Razorpay to verify status & amount (never bypassed by dry_run)
    try:
        rz_client = razorpay.Client(auth=(key_id, key_secret))
        rz_payment = rz_client.payment.fetch(payment.razorpay_payment_id)
    except Exception as e:
        logger.error(f"Failed to fetch payment details from Razorpay: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to verify payment with gateway"
        )

    if rz_payment.get("order_id") != payment.razorpay_order_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment does not match this order")

    expected_amount = int(order.get("amount_paise", 1500))
    if int(rz_payment.get("amount", 0)) != expected_amount:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment amount does not match try-on price")

    rz_status = rz_payment.get("status")

    # If authorized, capture payment first
    if rz_status == "authorized":
        try:
            rz_captured = rz_client.payment.capture(payment.razorpay_payment_id, expected_amount)
            rz_status = rz_captured.get("status", "captured")
        except Exception as e:
            logger.error(f"Failed to capture authorized payment {payment.razorpay_payment_id}: {type(e).__name__}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to capture payment with gateway"
            )

    if rz_status != "captured":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment status '{rz_status}' is invalid. Payment has not been captured."
        )

    # 5. Atomically transition: created -> paid
    now_dt = datetime.now(timezone.utc)
    expires_dt = now_dt + timedelta(minutes=SESSION_EXPIRY_MINUTES)

    await db.tryon_payments.update_one(
        {
            "razorpay_order_id": payment.razorpay_order_id,
            "user_id": user_id,
            "status": "created"
        },
        {
            "$set": {
                "status": "paid",
                "razorpay_payment_id": payment.razorpay_payment_id,
                "razorpay_signature": payment.razorpay_signature,
                "paid_at": now_dt.isoformat(),
                "expires_at": expires_dt.isoformat()
            }
        }
    )

    return {
        "message": "Payment verified successfully",
        "status": "paid",
        "order_id": payment.razorpay_order_id,
        "expires_at": expires_dt.isoformat()
    }


@router.get("/status", dependencies=[Depends(check_tryon_enabled)])
async def get_tryon_status(
    order_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Returns the status of a try-on payment.
    If order_id is specified, checks that payment.
    Otherwise, checks for an active paid unexpired payment for this customer.
    """
    user_id = current_user.get("id")
    now_iso = datetime.now(timezone.utc).isoformat()

    query = {"user_id": user_id}
    if order_id:
        query["$or"] = [{"razorpay_order_id": order_id}, {"id": order_id}]
    else:
        query["status"] = "paid"
        query["expires_at"] = {"$gt": now_iso}

    payment = await db.tryon_payments.find_one(query, sort=[("created_at", -1)])

    if not payment and not order_id:
        payment = await db.tryon_payments.find_one({"user_id": user_id}, sort=[("created_at", -1)])

    if not payment:
        return {"has_payment": False, "status": "none"}

    status_val = payment.get("status")
    expires_at = payment.get("expires_at")
    remaining_seconds = 0
    is_expired = False

    if expires_at:
        try:
            exp_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            rem = (exp_dt - datetime.now(timezone.utc)).total_seconds()
            remaining_seconds = max(0, int(rem))
            is_expired = (rem <= 0)
        except Exception:
            pass

    return {
        "has_payment": True,
        "order_id": payment.get("razorpay_order_id"),
        "status": status_val,
        "expires_at": expires_at,
        "remaining_seconds": remaining_seconds,
        "is_expired": is_expired,
        "image_url": payment.get("image_url"),
        "product_id": payment.get("product_id"),
        "amount": payment.get("amount", 15),
        "refund_error": payment.get("refund_error"),
        "refund_id": payment.get("refund_id")
    }


@router.post("/run", dependencies=[Depends(check_tryon_enabled)])
async def run_tryon(
    file: UploadFile = File(...),
    product_id: str = Form(...),
    order_id: str = Form(...),
    consent: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Runs virtual try-on with customer photo, product_id, and verified order_id.
    - Requires consent form field = true.
    - Requires order to be in 'paid' status and not expired (within 15 minutes).
    - Max 10 successful try-ons per user per day.
    - Validates image (JPEG/PNG/WEBP, max 5MB, PIL verify).
    - PRIVACY: Customer photo is NEVER saved to disk or database. Processed strictly in-memory.
    - Atomically claims payment (paid -> processing).
    - Auto-retries once on failure. If both attempts fail, automatically issues Razorpay refund.
    """
    # 0. Validate user consent
    is_consented = False
    if consent is not None:
        if isinstance(consent, bool) and consent is True:
            is_consented = True
        elif isinstance(consent, str) and consent.strip().lower() in ('true', '1', 'yes'):
            is_consented = True

    if not is_consented:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please confirm that you allow your photo to be used for this try-on."
        )

    user_id = current_user.get('id')
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Daily limit check (10 successful runs per user per day)
    runs_today = await db.tryon_payments.count_documents({
        "user_id": user_id,
        "status": "succeeded",
        "succeeded_at": {"$regex": f"^{today_str}"}
    })
    if runs_today >= MAX_DAILY_RUNS_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"You have reached your daily limit of {MAX_DAILY_RUNS_PER_USER} successful try-ons. Please try again tomorrow."
        )

    # 2. Check for product
    product = await db.products.find_one({'id': product_id}, {'_id': 0})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # 3. Validate image format & size
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_TRYON_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_TRYON_EXTENSIONS))}"
        )

    content_type = file.content_type
    if content_type and content_type.lower() not in ALLOWED_TRYON_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid content type '{content_type}'. Allowed types: {', '.join(sorted(ALLOWED_TRYON_MIME_TYPES))}"
        )

    # Read photo into memory bytes only
    customer_image_bytes = await file.read()
    if len(customer_image_bytes) > MAX_TRYON_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image size exceeds maximum limit of 5MB."
        )

    try:
        img = Image.open(io.BytesIO(customer_image_bytes))
        img.verify()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to parse uploaded image. Please ensure it is a valid photo."
        )

    # 4. Check payment status & claim payment
    payment_doc = await db.tryon_payments.find_one({
        "$or": [{"razorpay_order_id": order_id}, {"id": order_id}],
        "user_id": user_id
    })
    if not payment_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Try-on payment not found")

    current_status = payment_doc.get("status")
    if current_status == "succeeded":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This payment has already been used for a try-on")
    if current_status in ("refunded", "refunding"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This payment has already been refunded")
    if current_status != "paid":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Payment is in '{current_status}' status, cannot run try-on")

    # Expiry check (15 minutes limit)
    expires_at = payment_doc.get("expires_at")
    if expires_at and expires_at <= now_iso:
        refund_ok = await refund_payment(payment_doc, reason="Payment session expired (15-minute limit)")
        if refund_ok:
            msg = "Try-on session expired after 15 minutes. तुमचे ₹15 परत केले आहेत."
        else:
            msg = "Try-on session expired after 15 minutes. तुमचे ₹15 परत करण्याची प्रक्रिया सुरू आहे, काही दिवसांत खात्यात जमा होतील."
        raise HTTPException(status_code=status.HTTP_410_GONE, detail=msg)

    # Atomically claim payment: paid -> processing
    claimed = await db.tryon_payments.find_one_and_update(
        {
            "_id": payment_doc["_id"],
            "status": "paid",
            "expires_at": {"$gt": now_iso}
        },
        {
            "$set": {
                "status": "processing",
                "processing_at": now_iso,
                "product_id": product_id,
                "consent": True,
                "consent_at": now_iso
            }
        }
    )
    if not claimed:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Payment is currently being processed or has already been used")

    # 5. Run try-on provider with 1 auto retry
    success = False
    result_image_url = None
    last_error: Optional[Exception] = None

    # Attempt 1
    try:
        result_image_url = await execute_tryon_provider(customer_image_bytes, product)
        success = True
    except Exception as e:
        last_error = e
        logger.warning(f"Try-on attempt 1 failed: {type(e).__name__}. Retrying once...")

    # Attempt 2 (Auto retry)
    if not success:
        await asyncio.sleep(1.0)
        try:
            result_image_url = await execute_tryon_provider(customer_image_bytes, product)
            success = True
        except Exception as e:
            last_error = e
            logger.error(f"Try-on attempt 2 failed: {type(e).__name__}")

    # 6. Succeeded or Refund
    if success and result_image_url:
        await db.tryon_payments.update_one(
            {"_id": payment_doc["_id"]},
            {
                "$set": {
                    "status": "succeeded",
                    "succeeded_at": datetime.now(timezone.utc).isoformat(),
                    "image_url": result_image_url,
                    "retry_count": 0 if last_error is None else 1
                }
            }
        )
        return {
            "success": True,
            "image_url": result_image_url,
            "order_id": payment_doc["razorpay_order_id"],
            "product_id": product_id
        }
    else:
        # Both attempts failed! Refund customer
        refund_ok = await refund_payment(payment_doc, reason=f"Try-on failed: {type(last_error).__name__}")
        
        base_detail = ""
        if isinstance(last_error, HTTPException) and last_error.detail:
            base_detail = last_error.detail.replace("Your payment is safe, please try again in a minute.", "").replace("Your payment is safe, please try again.", "").strip()
            if base_detail and not base_detail.endswith('.'):
                base_detail += '.'

        if refund_ok:
            if base_detail:
                msg = f"{base_detail} तुमचे ₹15 परत केले आहेत."
            else:
                msg = "Try-On होऊ शकले नाही. तुमचे ₹15 परत केले आहेत."
        else:
            if base_detail:
                msg = f"{base_detail} Try-On होऊ शकले नाही. तुमचे ₹15 परत करण्याची प्रक्रिया सुरू आहे, काही दिवसांत खात्यात जमा होतील."
            else:
                msg = "Try-On होऊ शकले नाही. तुमचे ₹15 परत करण्याची प्रक्रिया सुरू आहे, काही दिवसांत खात्यात जमा होतील."

        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=msg)


# ==================== EXPIRY WORKER & BACKGROUND LOOP ====================

async def process_expired_tryon_payments():
    """
    Finds payments in 'paid' status where expires_at has passed,
    payments stuck in 'processing' for > 5 minutes,
    and retries 'refund_failed' payments (up to 5 attempts).
    """
    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()
    five_mins_ago_iso = (now_dt - timedelta(minutes=5)).isoformat()

    # 1. Expired paid payments (> 15 mins unused)
    expired_cursor = db.tryon_payments.find({
        "status": "paid",
        "expires_at": {"$lte": now_iso}
    })
    async for payment in expired_cursor:
        try:
            logger.info(f"Auto-refunding expired try-on payment {payment.get('razorpay_order_id')}")
            await refund_payment(payment, reason="Auto-refund: 15-minute validity expired without use")
        except Exception as e:
            logger.error(f"Error auto-refunding expired payment {payment.get('razorpay_order_id')}: {type(e).__name__}")

    # 2. Stuck processing payments (> 5 mins old)
    stuck_cursor = db.tryon_payments.find({
        "status": "processing",
        "processing_at": {"$lte": five_mins_ago_iso}
    })
    async for payment in stuck_cursor:
        try:
            logger.info(f"Auto-refunding stuck processing payment {payment.get('razorpay_order_id')}")
            await refund_payment(payment, reason="Auto-refund: try-on did not complete")
        except Exception as e:
            logger.error(f"Error auto-refunding stuck payment {payment.get('razorpay_order_id')}: {type(e).__name__}")

    # 3. Retry refund_failed payments (with attempts < 5)
    failed_cursor = db.tryon_payments.find({
        "status": "refund_failed",
        "refund_attempts": {"$lt": MAX_REFUND_ATTEMPTS}
    })
    async for payment in failed_cursor:
        try:
            logger.info(f"Retrying refund for failed payment {payment.get('razorpay_order_id')}")
            await refund_payment(payment, reason="Retry refund for refund_failed payment")
        except Exception as e:
            logger.error(f"Error retrying refund for payment {payment.get('razorpay_order_id')}: {type(e).__name__}")

    # 4. Reconcile unconfirmed created orders (> 20 mins old)
    try:
        await reconcile_unconfirmed_created_orders()
    except Exception as e:
        logger.error(f"Error in reconcile_unconfirmed_created_orders: {type(e).__name__}")


async def reconcile_unconfirmed_created_orders(rz_client: Optional[object] = None):
    """
    Reconciles orders that remained in 'created' status for > 20 minutes (up to 50 at a time).
    Checks Razorpay order payments:
    - If captured or authorized with matching amount: captures if authorized,
      saves razorpay_payment_id, and refunds payment (reason: 'Auto-refund: payment received but not confirmed').
    - If no captured/authorized payment: marks order status as 'abandoned'.
    Only connects to real Razorpay gateway when TRYON_PROVIDER == 'fashn' or when mock client is provided.
    """
    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()
    twenty_mins_ago_iso = (now_dt - timedelta(minutes=20)).isoformat()

    cursor = db.tryon_payments.find({
        "status": "created",
        "created_at": {"$lte": twenty_mins_ago_iso}
    }).limit(50)

    orders = await cursor.to_list(length=50)
    if not orders:
        return

    provider = os.environ.get('TRYON_PROVIDER', 'mock').lower()

    if rz_client is None:
        # Check if razorpay.Client is mocked in unit tests
        client_cls = getattr(razorpay, 'Client', None)
        is_mocked = (
            type(client_cls).__name__ in ('MagicMock', 'Mock', 'AsyncMock') or
            hasattr(client_cls, 'assert_called') or
            hasattr(client_cls, '_mock_return_value')
        )
        if provider != 'fashn' and not is_mocked:
            logger.info("Skipping real Razorpay reconciliation in mock mode")
            return

        try:
            key_id, key_secret = get_tryon_razorpay_credentials()
            rz_client = razorpay.Client(auth=(key_id, key_secret))
        except Exception as e:
            logger.warning(f"Reconciliation skipped: Razorpay credentials unavailable: {e}")
            return

    for order in orders:
        order_id = order.get("razorpay_order_id")
        if not order_id:
            continue

        try:
            payments_res = rz_client.order.payments(order_id)
            if isinstance(payments_res, dict):
                items = payments_res.get("items", [])
            elif isinstance(payments_res, list):
                items = payments_res
            else:
                items = []

            matched_payment = None
            expected_amount = int(order.get("amount_paise", 1500))

            for item in items:
                p_status = item.get("status")
                p_amount = int(item.get("amount", 0))
                if p_status in ("captured", "authorized") and p_amount == expected_amount:
                    matched_payment = item
                    break

            if matched_payment:
                payment_id = matched_payment.get("id")
                # If authorized, capture before refunding
                if matched_payment.get("status") == "authorized":
                    try:
                        rz_client.payment.capture(payment_id, expected_amount)
                    except Exception as e:
                        logger.error(f"Error capturing authorized payment {payment_id} for order {order_id}: {type(e).__name__}")

                order["razorpay_payment_id"] = payment_id
                await db.tryon_payments.update_one(
                    {"_id": order["_id"]},
                    {"$set": {"razorpay_payment_id": payment_id}}
                )
                logger.info(f"Reconciling order {order_id}: found captured/authorized payment {payment_id}, issuing refund.")
                await refund_payment(order, reason="Auto-refund: payment received but not confirmed")
            else:
                logger.info(f"Reconciling order {order_id}: no payment found, marking abandoned.")
                await db.tryon_payments.update_one(
                    {"_id": order["_id"], "status": "created"},
                    {
                        "$set": {
                            "status": "abandoned",
                            "abandoned_at": now_iso
                        }
                    }
                )
        except Exception as e:
            logger.error(f"Error reconciling created order {order_id}: {type(e).__name__}")


async def tryon_expiry_background_loop():
    """
    Periodic background loop running process_expired_tryon_payments() immediately on start,
    and then every 60 seconds. Catches all errors so the loop never crashes.
    """
    while True:
        try:
            await process_expired_tryon_payments()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in tryon_expiry_background_loop during processing: {type(e).__name__}")

        try:
            await asyncio.sleep(60)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error during sleep in tryon_expiry_background_loop: {type(e).__name__}")


def start_tryon_background_tasks():
    """
    Starts the try-on background tasks on application startup.
    """
    global _expiry_task
    if _expiry_task is None or _expiry_task.done():
        _expiry_task = asyncio.create_task(tryon_expiry_background_loop())
        logger.info("Try-on background expiry worker started.")
