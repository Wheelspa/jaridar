import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import io
import uuid
import time
import hmac
import hashlib
import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock, AsyncMock

# Configure test environment
os.environ['TRYON_ENABLED'] = 'true'
os.environ['TRYON_PROVIDER'] = 'mock'
os.environ['TRYON_PRICE_INR'] = '15'
os.environ['TRYON_RAZORPAY_KEY_ID'] = 'rzp_test_live_mock_123'
os.environ['TRYON_RAZORPAY_KEY_SECRET'] = 'secret_test_mock_456'
os.environ['TRYON_REFUND_DRY_RUN'] = 'true'
os.environ['TRYON_FASHN_MODE'] = 'balanced'
os.environ['FRONTEND_PUBLIC_URL'] = 'https://jaridar.com'

from PIL import Image
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

import server
from server import db
import tryon

TEST_USER_A = {"id": f"test_usr_a_{uuid.uuid4().hex[:6]}", "email": "usera@test.com", "role": "customer"}
TEST_USER_B = {"id": f"test_usr_b_{uuid.uuid4().hex[:6]}", "email": "userb@test.com", "role": "customer"}
TEST_PRODUCT_ID = f"test_prod_{uuid.uuid4().hex[:6]}"

test_results = {}

def log_test(name, passed, detail=""):
    test_results[name] = {"passed": passed, "detail": detail}
    status_str = "PASS" if passed else "FAIL"
    print(f"[{status_str}] {name}: {detail}")

def make_test_photo(color='purple'):
    buf = io.BytesIO()
    img = Image.new('RGB', (100, 100), color=color)
    img.save(buf, format='JPEG')
    return UploadFile(file=io.BytesIO(buf.getvalue()), filename="model.jpg", headers=Headers({"content-type": "image/jpeg"}))

def generate_signature(order_id, payment_id, secret):
    return hmac.new(
        secret.encode('utf-8'),
        f"{order_id}|{payment_id}".encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

async def setup_test_data():
    await db.products.insert_one({
        "id": TEST_PRODUCT_ID,
        "name": "Emerald Anarkali Kurta Set",
        "category": "ethnic",
        "subcategory": "Salwar Suits",
        "product_type": "kurta-set",
        "images": ["/images/products/emerald-anarkali.jpg"],
        "price": 5499,
        "is_active": True
    })

async def cleanup_test_data():
    await db.products.delete_many({"id": TEST_PRODUCT_ID})
    await db.tryon_payments.delete_many({"user_id": {"$in": [TEST_USER_A["id"], TEST_USER_B["id"]]}})

# 1. एका payment वर दोनदा /run नाकारले जाते
async def test_run_twice_rejected():
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    now_dt = datetime.now(timezone.utc)
    await db.tryon_payments.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_A["id"],
        "razorpay_order_id": order_id,
        "razorpay_payment_id": f"pay_{uuid.uuid4().hex[:10]}",
        "amount": 15,
        "amount_paise": 1500,
        "currency": "INR",
        "status": "paid",
        "created_at": now_dt.isoformat(),
        "paid_at": now_dt.isoformat(),
        "expires_at": (now_dt + timedelta(minutes=15)).isoformat()
    })

    # First run -> Success
    res1 = await tryon.run_tryon(
        file=make_test_photo(),
        product_id=TEST_PRODUCT_ID,
        order_id=order_id,
        consent="true",
        current_user=TEST_USER_A
    )

    # Second run on same order -> should raise HTTPException 400
    try:
        await tryon.run_tryon(
            file=make_test_photo(),
            product_id=TEST_PRODUCT_ID,
            order_id=order_id,
            consent="true",
            current_user=TEST_USER_A
        )
        log_test("Once payment is used for /run, a second /run on the same payment is rejected", False, "Second run should have been rejected")
    except HTTPException as e:
        passed = (res1.get("success") is True and e.status_code == 400 and "already been used" in e.detail)
        log_test("Once payment is used for /run, a second /run on the same payment is rejected", passed, f"HTTP {e.status_code}: {e.detail}")

# 2. verify दोनदा = एकच credit (idempotent)
async def test_verify_twice_idempotent():
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    payment_id = f"pay_{uuid.uuid4().hex[:10]}"
    secret = os.environ['TRYON_RAZORPAY_KEY_SECRET']
    sig = generate_signature(order_id, payment_id, secret)

    await db.tryon_payments.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_A["id"],
        "razorpay_order_id": order_id,
        "amount": 15,
        "amount_paise": 1500,
        "currency": "INR",
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    req = tryon.TryOnVerifyRequest(
        razorpay_order_id=order_id,
        razorpay_payment_id=payment_id,
        razorpay_signature=sig
    )

    # Mock fetch payment
    mock_rz = MagicMock()
    mock_rz.payment.fetch.return_value = {"id": payment_id, "order_id": order_id, "status": "captured", "amount": 1500}
    with patch("tryon.razorpay.Client", return_value=mock_rz):
        v1 = await tryon.verify_tryon_payment(req, current_user=TEST_USER_A)
        doc1 = await db.tryon_payments.find_one({"razorpay_order_id": order_id})
        exp1 = doc1.get("expires_at")

        # Second verify
        v2 = await tryon.verify_tryon_payment(req, current_user=TEST_USER_A)
        doc2 = await db.tryon_payments.find_one({"razorpay_order_id": order_id})
        exp2 = doc2.get("expires_at")

    count = await db.tryon_payments.count_documents({"razorpay_order_id": order_id})
    passed = (
        v1.get("status") == "paid" and
        v2.get("status") == "paid" and
        v2.get("message") == "Payment already verified" and
        count == 1 and
        exp1 == exp2
    )
    log_test("Verify called twice is idempotent and does not create duplicate credits", passed, f"v1={v1.get('status')}, v2={v2.get('message')}")

# 3. दोन्ही attempts fail -> refund एकदाच आणि स्पष्ट संदेश
async def test_both_attempts_fail_refund_once():
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    now_dt = datetime.now(timezone.utc)
    await db.tryon_payments.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_A["id"],
        "razorpay_order_id": order_id,
        "razorpay_payment_id": f"pay_{uuid.uuid4().hex[:10]}",
        "amount": 15,
        "amount_paise": 1500,
        "currency": "INR",
        "status": "paid",
        "created_at": now_dt.isoformat(),
        "paid_at": now_dt.isoformat(),
        "expires_at": (now_dt + timedelta(minutes=15)).isoformat()
    })

    # Fail both attempts
    with patch("tryon.execute_tryon_provider", side_effect=HTTPException(status_code=502, detail="The try-on generation failed. Please try again.")):
        try:
            await tryon.run_tryon(
                file=make_test_photo(),
                product_id=TEST_PRODUCT_ID,
                order_id=order_id,
                consent="true",
                current_user=TEST_USER_A
            )
            log_test("Both attempts fail -> refund once with clean message", False, "Should have raised exception")
        except HTTPException as e:
            doc = await db.tryon_payments.find_one({"razorpay_order_id": order_id})
            passed = (
                e.status_code == 502 and
                "तुमचे ₹15 परत केले आहेत" in e.detail and
                doc.get("status") == "refunded" and
                doc.get("refund_id") is not None
            )
            log_test("Both attempts fail -> refund once with clean message", passed, f"detail={e.detail}, status={doc.get('status')}")

# 4. expired वर /run नाकारले
async def test_run_on_expired_payment_rejected():
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    past_dt = datetime.now(timezone.utc) - timedelta(minutes=20)
    await db.tryon_payments.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_A["id"],
        "razorpay_order_id": order_id,
        "razorpay_payment_id": f"pay_{uuid.uuid4().hex[:10]}",
        "amount": 15,
        "amount_paise": 1500,
        "currency": "INR",
        "status": "paid",
        "created_at": past_dt.isoformat(),
        "paid_at": past_dt.isoformat(),
        "expires_at": (past_dt + timedelta(minutes=15)).isoformat()  # Expired 5 minutes ago
    })

    try:
        await tryon.run_tryon(
            file=make_test_photo(),
            product_id=TEST_PRODUCT_ID,
            order_id=order_id,
            consent="true",
            current_user=TEST_USER_A
        )
        log_test("Expired payment on /run is rejected and refunded", False, "Should have been rejected as expired")
    except HTTPException as e:
        doc = await db.tryon_payments.find_one({"razorpay_order_id": order_id})
        passed = (e.status_code == 410 and "तुमचे ₹15 परत केले आहेत" in e.detail and doc.get("status") == "refunded")
        log_test("Expired payment on /run is rejected and refunded", passed, f"HTTP {e.status_code}: {e.detail}")

# 5. चुकीचा signature नाकारला
async def test_invalid_signature_rejected():
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    payment_id = f"pay_{uuid.uuid4().hex[:10]}"
    await db.tryon_payments.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_A["id"],
        "razorpay_order_id": order_id,
        "amount": 15,
        "amount_paise": 1500,
        "currency": "INR",
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    req = tryon.TryOnVerifyRequest(
        razorpay_order_id=order_id,
        razorpay_payment_id=payment_id,
        razorpay_signature="totally_bogus_signature"
    )

    try:
        await tryon.verify_tryon_payment(req, current_user=TEST_USER_A)
        log_test("Invalid HMAC signature in /verify is rejected", False, "Should have raised 400")
    except HTTPException as e:
        passed = (e.status_code == 400 and "Invalid payment signature" in e.detail)
        log_test("Invalid HMAC signature in /verify is rejected", passed, f"HTTP {e.status_code}: {e.detail}")

# 6. दुसऱ्या user चा order नाकारला
async def test_cross_user_order_rejected():
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    payment_id = f"pay_{uuid.uuid4().hex[:10]}"
    secret = os.environ['TRYON_RAZORPAY_KEY_SECRET']
    sig = generate_signature(order_id, payment_id, secret)

    await db.tryon_payments.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_A["id"],
        "razorpay_order_id": order_id,
        "amount": 15,
        "amount_paise": 1500,
        "currency": "INR",
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    req = tryon.TryOnVerifyRequest(
        razorpay_order_id=order_id,
        razorpay_payment_id=payment_id,
        razorpay_signature=sig
    )

    try:
        await tryon.verify_tryon_payment(req, current_user=TEST_USER_B)
        log_test("Order belonging to another user cannot be verified", False, "User B should not verify User A's order")
    except HTTPException as e:
        passed = (e.status_code == 404 and "not found" in e.detail.lower())
        log_test("Order belonging to another user cannot be verified", passed, f"HTTP {e.status_code}: {e.detail}")

# 7. captured नसलेले / चुकीच्या रकमेचे payment नाकारले (आणि authorized capture होते)
async def test_authorized_and_invalid_statuses_in_verify():
    secret = os.environ['TRYON_RAZORPAY_KEY_SECRET']

    # 7a. Authorized payment gets captured!
    order_id_auth = f"order_{uuid.uuid4().hex[:10]}"
    pay_id_auth = f"pay_{uuid.uuid4().hex[:10]}"
    sig_auth = generate_signature(order_id_auth, pay_id_auth, secret)

    await db.tryon_payments.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_A["id"],
        "razorpay_order_id": order_id_auth,
        "amount": 15,
        "amount_paise": 1500,
        "currency": "INR",
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    mock_rz = MagicMock()
    mock_rz.payment.fetch.return_value = {"id": pay_id_auth, "order_id": order_id_auth, "status": "authorized", "amount": 1500}
    mock_rz.payment.capture.return_value = {"id": pay_id_auth, "status": "captured", "amount": 1500}

    with patch("tryon.razorpay.Client", return_value=mock_rz):
        v_res = await tryon.verify_tryon_payment(
            tryon.TryOnVerifyRequest(razorpay_order_id=order_id_auth, razorpay_payment_id=pay_id_auth, razorpay_signature=sig_auth),
            current_user=TEST_USER_A
        )
        mock_rz.payment.capture.assert_called_once_with(pay_id_auth, 1500)
        passed_capture = (v_res.get("status") == "paid")
        log_test("Authorized payment is automatically captured via rz_client.payment.capture", passed_capture, f"v_res={v_res.get('status')}")

    # 7b. Status other than captured/authorized (e.g. failed) is rejected
    order_id_fail = f"order_{uuid.uuid4().hex[:10]}"
    pay_id_fail = f"pay_{uuid.uuid4().hex[:10]}"
    sig_fail = generate_signature(order_id_fail, pay_id_fail, secret)

    await db.tryon_payments.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_A["id"],
        "razorpay_order_id": order_id_fail,
        "amount": 15,
        "amount_paise": 1500,
        "currency": "INR",
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    mock_rz.payment.fetch.return_value = {"id": pay_id_fail, "order_id": order_id_fail, "status": "failed", "amount": 1500}
    with patch("tryon.razorpay.Client", return_value=mock_rz):
        try:
            await tryon.verify_tryon_payment(
                tryon.TryOnVerifyRequest(razorpay_order_id=order_id_fail, razorpay_payment_id=pay_id_fail, razorpay_signature=sig_fail),
                current_user=TEST_USER_A
            )
            log_test("Payment with status other than captured/authorized is rejected", False, "Should have rejected failed payment")
        except HTTPException as e:
            passed = (e.status_code == 400 and "invalid" in e.detail.lower())
            log_test("Payment with status other than captured/authorized is rejected", passed, f"HTTP {e.status_code}: {e.detail}")

# 8. Stuck processing (> 5 mins) is automatically refunded
async def test_stuck_processing_refunded():
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    stuck_time = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
    await db.tryon_payments.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_A["id"],
        "razorpay_order_id": order_id,
        "razorpay_payment_id": f"pay_{uuid.uuid4().hex[:10]}",
        "amount": 15,
        "amount_paise": 1500,
        "currency": "INR",
        "status": "processing",
        "processing_at": stuck_time,
        "created_at": stuck_time
    })

    await tryon.process_expired_tryon_payments()
    doc = await db.tryon_payments.find_one({"razorpay_order_id": order_id})
    passed = (doc.get("status") == "refunded" and "Auto-refund: try-on did not complete" in doc.get("refund_reason", ""))
    log_test("Stuck processing payments (> 5 mins) are automatically refunded", passed, f"status={doc.get('status')}, reason={doc.get('refund_reason')}")

# 9. refund_failed retry up to 5 attempts then stops
async def test_refund_failed_retry_and_max_attempts():
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    await db.tryon_payments.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_A["id"],
        "razorpay_order_id": order_id,
        "razorpay_payment_id": f"pay_{uuid.uuid4().hex[:10]}",
        "amount": 15,
        "amount_paise": 1500,
        "currency": "INR",
        "status": "refund_failed",
        "refund_attempts": 1,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    # Worker pass 1 -> retries and succeeds (dry run active)
    await tryon.process_expired_tryon_payments()
    doc1 = await db.tryon_payments.find_one({"razorpay_order_id": order_id})
    passed_retry = (doc1.get("status") == "refunded" and doc1.get("refund_attempts") == 2)
    log_test("Worker retries refund_failed payments to refunded", passed_retry, f"status={doc1.get('status')}, attempts={doc1.get('refund_attempts')}")

    # Now test max attempts cutoff:
    order_id_max = f"order_{uuid.uuid4().hex[:10]}"
    doc_max = {
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_A["id"],
        "razorpay_order_id": order_id_max,
        "razorpay_payment_id": f"pay_{uuid.uuid4().hex[:10]}",
        "amount": 15,
        "amount_paise": 1500,
        "currency": "INR",
        "status": "refund_failed",
        "refund_attempts": 5,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tryon_payments.insert_one(doc_max)

    res_ref = await tryon.refund_payment(doc_max)
    passed_max = (res_ref is False)
    log_test("Refund stops after MAX_REFUND_ATTEMPTS (5) without loop", passed_max, f"refund_payment return={res_ref}")

# 10. दुहेरी refund होत नाही (Double refund prevented if refund_id exists)
async def test_no_double_refund_if_refund_id_exists():
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    pay_id = f"pay_{uuid.uuid4().hex[:10]}"
    existing_refund_id = f"rfnd_{uuid.uuid4().hex[:10]}"
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_A["id"],
        "razorpay_order_id": order_id,
        "razorpay_payment_id": pay_id,
        "amount": 15,
        "amount_paise": 1500,
        "currency": "INR",
        "status": "refund_failed",
        "refund_id": existing_refund_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tryon_payments.insert_one(doc)

    mock_rz = MagicMock()
    with patch("tryon.razorpay.Client", return_value=mock_rz):
        res = await tryon.refund_payment(doc)
        mock_rz.payment.refund.assert_not_called()
        doc_updated = await db.tryon_payments.find_one({"razorpay_order_id": order_id})
        passed = (res is True and doc_updated.get("status") == "refunded" and doc_updated.get("refund_id") == existing_refund_id)
        log_test("Double refund is strictly prevented if refund_id already exists", passed, f"status={doc_updated.get('status')}")

# 11. Category mapping regex word boundary tests
def test_get_fashn_category_regex():
    t1 = tryon.get_fashn_category({"name": "Sunset Orange Top"})
    t2 = tryon.get_fashn_category({"name": "Co-ord Set"})
    t3 = tryon.get_fashn_category({"name": "Floral Dress"})
    t4 = tryon.get_fashn_category({"name": "Palazzo"})
    t5 = tryon.get_fashn_category({"name": "Saree"})

    passed = (t1 == "tops" and t2 == "one-pieces" and t3 == "one-pieces" and t4 == "bottoms" and t5 == "auto")
    log_test("Category mapping with word boundaries matches correctly", passed, f"t1={t1}, t2={t2}, t3={t3}, t4={t4}, t5={t5}")

# 12. provider=fashn ignores dry-run and mock-fail flags
async def test_fashn_ignores_dry_run_and_mock_fail():
    with patch.dict(os.environ, {"TRYON_PROVIDER": "fashn", "TRYON_MOCK_FAIL": "true", "TRYON_REFUND_DRY_RUN": "true"}):
        prod = {"images": ["/images/test.jpg"]}
        
        # Test mock_fail is ignored in run_mock_tryon
        mock_img = Image.new('RGB', (10, 10))
        buf = io.BytesIO()
        mock_img.save(buf, format='JPEG')
        with patch("tryon.asyncio.sleep", return_value=None):
            res = await tryon.run_mock_tryon(buf.getvalue(), prod)
            passed_mock = (res == "/images/test.jpg")

        # Test dry_run is ignored in refund_payment (calls real/mock client refund)
        order_id = f"order_{uuid.uuid4().hex[:10]}"
        pay_id = f"pay_{uuid.uuid4().hex[:10]}"
        oid = str(uuid.uuid4())
        doc = {
            "id": oid,
            "user_id": TEST_USER_A["id"],
            "razorpay_order_id": order_id,
            "razorpay_payment_id": pay_id,
            "amount": 15,
            "amount_paise": 1500,
            "currency": "INR",
            "status": "processing",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.tryon_payments.insert_one(doc)
        doc_in_db = await db.tryon_payments.find_one({"id": oid})

        mock_rz = MagicMock()
        mock_rz.payment.refund.return_value = {"id": "rfnd_real_gateway_123"}
        with patch("tryon.razorpay.Client", return_value=mock_rz):
            ref_ok = await tryon.refund_payment(doc_in_db)
            mock_rz.payment.refund.assert_called_once()
            passed_dry_run = (ref_ok is True)

    passed = (passed_mock and passed_dry_run)
    log_test("provider=fashn ignores TRYON_MOCK_FAIL and TRYON_REFUND_DRY_RUN", passed, f"mock={passed_mock}, dry_run={passed_dry_run}")

# 13. Order exception does not leak str(e)
async def test_order_exception_safe_message():
    with patch("tryon.razorpay.Client", side_effect=Exception("Internal database password leaked")):
        try:
            await tryon.create_tryon_order(current_user=TEST_USER_A)
            log_test("/order exception hides internal error message", False, "Should have raised 502")
        except HTTPException as e:
            passed = (e.status_code == 502 and e.detail == "Could not start the payment. Please try again.")
            log_test("/order exception hides internal error message", passed, f"HTTP {e.status_code}: {e.detail}")

# 14. Old created order with captured payment -> auto refunded
async def test_reconcile_old_created_order_captured():
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    pay_id = f"pay_{uuid.uuid4().hex[:10]}"
    old_time = (datetime.now(timezone.utc) - timedelta(minutes=25)).isoformat()

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_A["id"],
        "razorpay_order_id": order_id,
        "amount": 15,
        "amount_paise": 1500,
        "currency": "INR",
        "status": "created",
        "created_at": old_time
    }
    await db.tryon_payments.insert_one(doc)

    mock_rz = MagicMock()
    mock_rz.order.payments.return_value = {
        "items": [{"id": pay_id, "status": "captured", "amount": 1500}]
    }
    mock_rz.payment.refund.return_value = {"id": f"rfnd_{uuid.uuid4().hex[:8]}"}

    with patch("tryon.razorpay.Client", return_value=mock_rz):
        await tryon.reconcile_unconfirmed_created_orders(rz_client=mock_rz)

    updated = await db.tryon_payments.find_one({"razorpay_order_id": order_id})
    passed = (
        updated.get("status") == "refunded" and
        updated.get("razorpay_payment_id") == pay_id and
        updated.get("refund_reason") == "Auto-refund: payment received but not confirmed"
    )
    log_test("Old created order (>20m) with captured payment is refunded", passed, f"status={updated.get('status')}, pay_id={updated.get('razorpay_payment_id')}")

# 15. Old created order without payment -> marked abandoned
async def test_reconcile_old_created_order_abandoned():
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    old_time = (datetime.now(timezone.utc) - timedelta(minutes=25)).isoformat()

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_A["id"],
        "razorpay_order_id": order_id,
        "amount": 15,
        "amount_paise": 1500,
        "currency": "INR",
        "status": "created",
        "created_at": old_time
    }
    await db.tryon_payments.insert_one(doc)

    mock_rz = MagicMock()
    mock_rz.order.payments.return_value = {"items": []}

    with patch("tryon.razorpay.Client", return_value=mock_rz):
        await tryon.reconcile_unconfirmed_created_orders(rz_client=mock_rz)

    updated = await db.tryon_payments.find_one({"razorpay_order_id": order_id})
    passed = (updated.get("status") == "abandoned" and updated.get("abandoned_at") is not None)
    log_test("Old created order (>20m) without payment is marked abandoned", passed, f"status={updated.get('status')}")

# 16. New created order (<20m) -> untouched
async def test_reconcile_new_created_order_untouched():
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    recent_time = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_A["id"],
        "razorpay_order_id": order_id,
        "amount": 15,
        "amount_paise": 1500,
        "currency": "INR",
        "status": "created",
        "created_at": recent_time
    }
    await db.tryon_payments.insert_one(doc)

    mock_rz = MagicMock()
    with patch("tryon.razorpay.Client", return_value=mock_rz):
        await tryon.reconcile_unconfirmed_created_orders(rz_client=mock_rz)

    updated = await db.tryon_payments.find_one({"razorpay_order_id": order_id})
    passed = (updated.get("status") == "created")
    mock_rz.order.payments.assert_not_called()
    log_test("New created order (<20m) is left untouched", passed, f"status={updated.get('status')}")

# 17. Status endpoint returns refund_failed and refund_error
async def test_status_endpoint_returns_refund_failed_and_error():
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_A["id"],
        "razorpay_order_id": order_id,
        "amount": 15,
        "amount_paise": 1500,
        "currency": "INR",
        "status": "refund_failed",
        "refund_error": "Gateway timeout from bank",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tryon_payments.insert_one(doc)

    res = await tryon.get_tryon_status(order_id=order_id, current_user=TEST_USER_A)
    passed = (
        res.get("status") == "refund_failed" and
        res.get("refund_error") == "Gateway timeout from bank"
    )
    log_test("Status endpoint returns refund_failed and refund_error", passed, f"res={res}")

async def main():
    try:
        await setup_test_data()
        test_get_fashn_category_regex()
        await test_run_twice_rejected()
        await test_verify_twice_idempotent()
        await test_both_attempts_fail_refund_once()
        await test_run_on_expired_payment_rejected()
        await test_invalid_signature_rejected()
        await test_cross_user_order_rejected()
        await test_authorized_and_invalid_statuses_in_verify()
        await test_stuck_processing_refunded()
        await test_refund_failed_retry_and_max_attempts()
        await test_no_double_refund_if_refund_id_exists()
        await test_fashn_ignores_dry_run_and_mock_fail()
        await test_order_exception_safe_message()
        await test_reconcile_old_created_order_captured()
        await test_reconcile_old_created_order_abandoned()
        await test_reconcile_new_created_order_untouched()
        await test_status_endpoint_returns_refund_failed_and_error()
    finally:
        await cleanup_test_data()

    all_passed = all(t["passed"] for t in test_results.values())
    print("\n" + "="*60)
    print(f"FINAL RESULT: {'ALL 17 UNIT TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
    print("="*60)
    sys.exit(0 if all_passed else 1)

if __name__ == '__main__':
    asyncio.run(main())
