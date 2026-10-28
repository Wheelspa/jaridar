"""
Razorpay payment and webhook signature verification utilities.
Security principles:
- Constant-time HMAC comparison (hmac.compare_digest) to prevent timing attacks.
- Strict input validation on all arguments.
- Zero secret logging or printing.
"""

import hmac
import hashlib
from typing import Optional, Tuple, List, Dict, Any


def verify_razorpay_payment_signature(
    razorpay_order_id: Optional[str],
    razorpay_payment_id: Optional[str],
    signature: Optional[str],
    secret: Optional[str]
) -> bool:
    """
    Verifies Razorpay standard payment signature.
    Signature = HMAC-SHA256(order_id + "|" + payment_id, secret)
    Uses constant-time comparison to protect against timing attacks.
    """
    if not razorpay_order_id or not razorpay_payment_id or not signature or not secret:
        return False

    try:
        msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
        expected_signature = hmac.new(
            secret.encode("utf-8"),
            msg,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_signature, signature)
    except Exception:
        return False


def verify_razorpay_webhook_signature(
    body_bytes: Optional[bytes],
    signature: Optional[str],
    webhook_secret: Optional[str]
) -> bool:
    """
    Verifies Razorpay webhook signature over the raw request payload bytes.
    Signature = HMAC-SHA256(raw_request_body, webhook_secret)
    Uses constant-time comparison to protect against timing attacks.
    """
    if not body_bytes or not signature or not webhook_secret:
        return False

    try:
        expected_signature = hmac.new(
            webhook_secret.encode("utf-8"),
            body_bytes,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_signature, signature)
    except Exception:
        return False


def calculate_cart_totals(
    items: List[Dict[str, Any]],
    free_shipping_threshold: float = 2999.0,
    standard_shipping_fee: float = 199.0
) -> Tuple[float, float, float]:
    """
    Calculates subtotal, shipping fee, and grand total from validated item subtotals.
    Returns (subtotal, shipping_fee, grand_total).
    """
    subtotal = float(sum(float(item.get("subtotal", 0.0)) for item in items))
    shipping_fee = 0.0 if subtotal >= free_shipping_threshold else standard_shipping_fee
    grand_total = subtotal + shipping_fee
    return subtotal, shipping_fee, grand_total
