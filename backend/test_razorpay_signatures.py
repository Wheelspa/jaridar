"""
Automated unit tests for Razorpay signature verification logic using fake values.
Security: No real keys or secrets are used, logged, or printed.
"""

import hmac
import hashlib
import json
import unittest
from payment_utils import (
    verify_razorpay_payment_signature,
    verify_razorpay_webhook_signature,
    calculate_cart_totals
)


class TestRazorpaySignatures(unittest.TestCase):

    def setUp(self):
        # Fake test values (never real keys)
        self.fake_secret = "fake_test_key_secret_1234567890abcdef"
        self.fake_webhook_secret = "fake_test_whsec_9876543210fedcba"
        self.fake_order_id = "order_fake_001"
        self.fake_payment_id = "pay_fake_001"

    def test_payment_signature_valid(self):
        msg = f"{self.fake_order_id}|{self.fake_payment_id}".encode("utf-8")
        valid_sig = hmac.new(self.fake_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

        self.assertTrue(
            verify_razorpay_payment_signature(
                self.fake_order_id,
                self.fake_payment_id,
                valid_sig,
                self.fake_secret
            )
        )

    def test_payment_signature_invalid_tampered_sig(self):
        msg = f"{self.fake_order_id}|{self.fake_payment_id}".encode("utf-8")
        valid_sig = hmac.new(self.fake_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()
        tampered_sig = ("0" if valid_sig[0] != "0" else "1") + valid_sig[1:]

        self.assertFalse(
            verify_razorpay_payment_signature(
                self.fake_order_id,
                self.fake_payment_id,
                tampered_sig,
                self.fake_secret
            )
        )

    def test_payment_signature_wrong_secret(self):
        msg = f"{self.fake_order_id}|{self.fake_payment_id}".encode("utf-8")
        valid_sig = hmac.new(self.fake_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

        self.assertFalse(
            verify_razorpay_payment_signature(
                self.fake_order_id,
                self.fake_payment_id,
                valid_sig,
                "wrong_fake_secret_xyz"
            )
        )

    def test_payment_signature_wrong_order_id(self):
        msg = f"{self.fake_order_id}|{self.fake_payment_id}".encode("utf-8")
        valid_sig = hmac.new(self.fake_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

        self.assertFalse(
            verify_razorpay_payment_signature(
                "order_tampered_999",
                self.fake_payment_id,
                valid_sig,
                self.fake_secret
            )
        )

    def test_payment_signature_empty_parameters(self):
        self.assertFalse(verify_razorpay_payment_signature("", "pay_1", "sig", "sec"))
        self.assertFalse(verify_razorpay_payment_signature("order_1", "", "sig", "sec"))
        self.assertFalse(verify_razorpay_payment_signature("order_1", "pay_1", "", "sec"))
        self.assertFalse(verify_razorpay_payment_signature("order_1", "pay_1", "sig", ""))
        self.assertFalse(verify_razorpay_payment_signature(None, None, None, None))

    def test_webhook_signature_valid(self):
        payload = json.dumps({
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_fake_wh_123",
                        "order_id": "order_fake_wh_456",
                        "amount": 350000
                    }
                }
            }
        }).encode("utf-8")

        valid_wh_sig = hmac.new(
            self.fake_webhook_secret.encode("utf-8"),
            payload,
            hashlib.sha256
        ).hexdigest()

        self.assertTrue(
            verify_razorpay_webhook_signature(
                payload,
                valid_wh_sig,
                self.fake_webhook_secret
            )
        )

    def test_webhook_signature_tampered_payload(self):
        payload = b'{"event": "payment.captured", "amount": 1000}'
        tampered = b'{"event": "payment.captured", "amount": 9999}'

        valid_sig = hmac.new(
            self.fake_webhook_secret.encode("utf-8"),
            payload,
            hashlib.sha256
        ).hexdigest()

        self.assertFalse(
            verify_razorpay_webhook_signature(
                tampered,
                valid_sig,
                self.fake_webhook_secret
            )
        )

    def test_webhook_signature_wrong_secret(self):
        payload = b'{"event": "order.paid"}'
        valid_sig = hmac.new(
            self.fake_webhook_secret.encode("utf-8"),
            payload,
            hashlib.sha256
        ).hexdigest()

        self.assertFalse(
            verify_razorpay_webhook_signature(
                payload,
                valid_sig,
                "wrong_fake_wh_secret"
            )
        )

    def test_webhook_signature_empty_parameters(self):
        self.assertFalse(verify_razorpay_webhook_signature(b"", "sig", "sec"))
        self.assertFalse(verify_razorpay_webhook_signature(b"data", "", "sec"))
        self.assertFalse(verify_razorpay_webhook_signature(b"data", "sig", ""))
        self.assertFalse(verify_razorpay_webhook_signature(None, None, None))

    def test_cart_totals_calculation(self):
        # Above 2999 -> Free shipping
        items_free = [{"subtotal": 1500.0}, {"subtotal": 1600.0}]
        subtotal, shipping, total = calculate_cart_totals(items_free)
        self.assertEqual(subtotal, 3100.0)
        self.assertEqual(shipping, 0.0)
        self.assertEqual(total, 3100.0)

        # Below 2999 -> 199 shipping
        items_paid = [{"subtotal": 1200.0}]
        subtotal, shipping, total = calculate_cart_totals(items_paid)
        self.assertEqual(subtotal, 1200.0)
        self.assertEqual(shipping, 199.0)
        self.assertEqual(total, 1399.0)

    def test_idempotent_order_state_transition(self):
        # Simulates state machine: only transition 'pending' -> 'completed'
        order_state = {"id": "ord_1", "status": "pending", "stock_deducted": False}

        def process_payment(order, is_valid_sig):
            if not is_valid_sig:
                return False, "invalid_signature"
            if order["status"] == "completed":
                return True, "already_completed"
            order["status"] = "completed"
            order["stock_deducted"] = True
            return True, "newly_completed"

        # First transition with valid sig
        ok, res = process_payment(order_state, is_valid_sig=True)
        self.assertTrue(ok)
        self.assertEqual(res, "newly_completed")
        self.assertTrue(order_state["stock_deducted"])

        # Duplicate transition (retry or webhook)
        order_state["stock_deducted"] = False  # If it were re-deducted
        ok2, res2 = process_payment(order_state, is_valid_sig=True)
        self.assertTrue(ok2)
        self.assertEqual(res2, "already_completed")
        # stock_deducted remains False because it wasn't re-run
        self.assertFalse(order_state["stock_deducted"])


if __name__ == "__main__":
    unittest.main()
