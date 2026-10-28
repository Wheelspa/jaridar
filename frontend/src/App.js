import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import HomePage from "@/pages/HomePage";
import ShopPage from "@/pages/ShopPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import { LoginPage, RegisterPage } from "@/pages/AuthPages";
import {
  AccountLayout,
  OrdersPage,
  OrderDetailPage,
  WishlistPage,
  ProfilePage,
} from "@/pages/AccountPages";

import AdminPage from "@/pages/AdminPage";
import AboutPage from "@/pages/AboutPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsPage from "@/pages/TermsPage";
import FaqPage from "@/pages/FaqPage";
import ExchangePolicyPage from "@/pages/ExchangePolicyPage";
import ShippingPolicyPage from "@/pages/ShippingPolicyPage";
import PaymentOptionsPage from "@/pages/PaymentOptionsPage";
import ContactPage from "@/pages/ContactPage";
import OurStoresPage from "@/pages/OurStoresPage";
import BlogPage from "@/pages/BlogPage";
import BulkOrdersPage from "@/pages/BulkOrdersPage";
import OffersPage from "@/pages/OffersPage";

function App() {
  return (
    <div className="App flex flex-col min-h-screen">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Toaster position="top-right" />
              <Header />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/terms-and-conditions" element={<TermsPage />} />
                  <Route path="/faqs" element={<FaqPage />} />
                  <Route path="/returns" element={<Navigate to="/exchange-policy" replace />} />
                  <Route path="/exchange-policy" element={<ExchangePolicyPage />} />
                  <Route path="/international-orders" element={<Navigate to="/shipping-policy" replace />} />
                  <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
                  <Route path="/payment-options" element={<PaymentOptionsPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/our-stores" element={<OurStoresPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/bulk-orders" element={<BulkOrdersPage />} />
                  <Route path="/offers" element={<OffersPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/account" element={<AccountLayout />}>
                    <Route index element={<ProfilePage />} />
                    <Route path="orders" element={<OrdersPage />} />
                    <Route path="orders/:id" element={<OrderDetailPage />} />
                    <Route path="wishlist" element={<WishlistPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                  </Route>
                </Routes>
              </main>
              <Footer />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
