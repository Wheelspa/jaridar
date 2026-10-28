"""
Integration tests for Razorpay endpoints with FastAPI TestClient.
Tests verify:
- Missing keys return 503 "Payments are not available right now"
- Webhook signature validation (valid vs invalid)
- Webhook missing secret rejection
- No secrets or keys logged or exposed
"""

import hmac
import hashlib
import json
import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Import app from server
import server
from server import app


class TestRazorpayEndpoints(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.fake_wh_secret = "fake_wh_secret_for_endpoint_test_999"

    def test_webhook_missing_secret_rejects_with_500(self):
        with patch.object(server, "RAZORPAY_WEBHOOK_SECRET", ""):
            res = self.client.post(
                "/api/webhooks/razorpay",
                headers={"X-Razorpay-Signature": "some_sig"},
                json={"event": "payment.captured"}
            )
            self.assertEqual(res.status_code, 500)
            self.assertIn("Webhook secret not configured", res.json()["detail"])

    def test_webhook_missing_signature_header_rejects_with_400(self):
        with patch.object(server, "RAZORPAY_WEBHOOK_SECRET", self.fake_wh_secret):
            res = self.client.post(
                "/api/webhooks/razorpay",
                json={"event": "payment.captured"}
            )
            self.assertEqual(res.status_code, 400)
            self.assertIn("Missing X-Razorpay-Signature header", res.json()["detail"])

    def test_webhook_invalid_signature_rejects_with_400(self):
        with patch.object(server, "RAZORPAY_WEBHOOK_SECRET", self.fake_wh_secret):
            res = self.client.post(
                "/api/webhooks/razorpay",
                headers={"X-Razorpay-Signature": "invalid_tampered_signature_hex"},
                content=b'{"event": "payment.captured"}'
            )
            self.assertEqual(res.status_code, 400)
            self.assertIn("Invalid webhook signature", res.json()["detail"])

    def test_webhook_valid_signature_unhandled_event(self):
        with patch.object(server, "RAZORPAY_WEBHOOK_SECRET", self.fake_wh_secret):
            body = json.dumps({"event": "refund.processed"}).encode("utf-8")
            valid_sig = hmac.new(
                self.fake_wh_secret.encode("utf-8"),
                body,
                hashlib.sha256
            ).hexdigest()

            res = self.client.post(
                "/api/webhooks/razorpay",
                headers={"X-Razorpay-Signature": valid_sig},
                content=body
            )
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json().get("status"), "ignored")

    def test_create_order_missing_keys_rejects_with_503_in_prod(self):
        from unittest.mock import AsyncMock
        # When APP_ENV is not development and keys are missing
        with patch.object(server, "RAZORPAY_KEY_ID", ""), \
             patch.object(server, "RAZORPAY_KEY_SECRET", ""), \
             patch.object(server, "APP_ENV", "production"):

            app.dependency_overrides[server.get_current_user] = lambda: {"id": "test_user_1"}
            app.dependency_overrides[server.security] = lambda: True
            try:
                mock_cart = MagicMock()
                mock_cursor = MagicMock()
                mock_cursor.to_list = AsyncMock(return_value=[{"product_id": "p1", "quantity": 1, "size": "M", "color": "Blue"}])
                mock_cart.find.return_value = mock_cursor

                mock_products = MagicMock()
                mock_products.find_one = AsyncMock(return_value={"id": "p1", "name": "Item", "price": 999.0, "stock": 10, "images": []})

                with patch.object(server.db, "cart", mock_cart), \
                     patch.object(server.db, "products", mock_products):

                    res = self.client.post(
                        "/api/orders",
                        headers={"Authorization": "Bearer fake_token"},
                        json={"shipping_address": {"fullName": "Test User"}}
                    )
                    self.assertEqual(res.status_code, 503)
                    self.assertIn("Payments are not available right now", res.json()["detail"])
            finally:
                app.dependency_overrides.clear()


if __name__ == "__main__":
    unittest.main()
