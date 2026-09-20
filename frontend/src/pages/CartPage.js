import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

const CartPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { cart, updateQuantity, removeFromCart, loading } = useCart();

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);
    };

    const handleQuantityChange = async (itemId, newQty) => {
        if (newQty < 1) {
            await removeFromCart(itemId);
            toast.success('Item removed from cart');
        } else {
            await updateQuantity(itemId, newQty);
        }
    };

    const handleRemove = async (itemId) => {
        await removeFromCart(itemId);
        toast.success('Item removed from cart');
    };

    const handleCheckout = () => {
        if (!isAuthenticated) {
            toast.error('Please login to checkout');
            navigate('/login?redirect=/cart');
            return;
        }
        navigate('/checkout');
    };

    const shippingCost = cart.total >= 2999 ? 0 : 199;
    const grandTotal = cart.total + shippingCost;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#FFFBF7] flex items-center justify-center px-6">
                <div className="text-center bg-white p-8 rounded-md border border-[#EADFD6] max-w-md w-full shadow-xs">
                    <ShoppingBag size={56} className="mx-auto text-rose/50 mb-4" />
                    <h2 className="font-heading text-2xl text-charcoal mb-2 uppercase tracking-wider font-semibold">Your Cart is Empty</h2>
                    <p className="text-xs text-[#6B5B55] mb-6">Please login to view your shopping cart</p>
                    <Link to="/login" className="btn-primary inline-block">Login to Continue</Link>
                </div>
            </div>
        );
    }

    if (cart.items.length === 0) {
        return (
            <div className="min-h-screen bg-[#FFFBF7] flex items-center justify-center px-6" data-testid="empty-cart">
                <div className="text-center bg-white p-8 rounded-md border border-[#EADFD6] max-w-md w-full shadow-xs">
                    <ShoppingBag size={56} className="mx-auto text-rose/50 mb-4" />
                    <h2 className="font-heading text-2xl text-charcoal mb-2 uppercase tracking-wider font-semibold">Your Cart is Empty</h2>
                    <p className="text-xs text-[#6B5B55] mb-6">Looks like you haven't added any items yet</p>
                    <Link to="/shop" className="btn-primary inline-block">Start Shopping</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFBF7]" data-testid="cart-page">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-[#EADFD6]">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5">
                    <div className="flex items-center text-xs text-[#6B5B55]">
                        <Link to="/" className="hover:text-rose">Home</Link>
                        <span className="breadcrumb-separator">/</span>
                        <span className="text-charcoal font-medium">Shopping Cart</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
                <h1 className="font-heading text-3xl uppercase tracking-widest text-charcoal mb-8">Shopping Cart</h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-md border border-[#EADFD6] overflow-hidden shadow-xs">
                            {/* Header */}
                            <div className="hidden md:grid grid-cols-12 gap-4 p-3.5 border-b border-[#EADFD6] bg-[#FAF0EA] text-xs font-semibold text-charcoal uppercase tracking-wider">
                                <div className="col-span-6">Product</div>
                                <div className="col-span-2 text-center">Price</div>
                                <div className="col-span-2 text-center">Quantity</div>
                                <div className="col-span-2 text-right">Total</div>
                            </div>

                            {/* Items */}
                            {cart.items.map((item, index) => (
                                <motion.div 
                                    key={item.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="grid grid-cols-12 gap-4 p-4 border-b border-[#EADFD6] items-center text-xs"
                                    data-testid={`cart-item-${item.id}`}
                                >
                                    {/* Product */}
                                    <div className="col-span-12 md:col-span-6 flex gap-3">
                                        <Link to={`/product/${item.product_id}`} className="w-16 h-20 flex-shrink-0 rounded-sm overflow-hidden border border-[#EADFD6]">
                                            <img 
                                                src={item.product_image}
                                                alt={item.product_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <Link 
                                                to={`/product/${item.product_id}`}
                                                className="font-heading text-sm text-charcoal hover:text-rose font-medium block truncate"
                                            >
                                                {item.product_name}
                                            </Link>
                                            <p className="text-[11px] text-[#6B5B55] mt-0.5">
                                                Size: {item.size} | Color: {item.color}
                                            </p>
                                            <button 
                                                onClick={() => handleRemove(item.id)}
                                                className="text-[11px] text-rose hover:underline mt-1.5 flex items-center gap-1 md:hidden"
                                            >
                                                <X size={12} /> Remove
                                            </button>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="col-span-4 md:col-span-2 text-center text-charcoal font-medium">
                                        <span className="md:hidden text-[11px] text-[#6B5B55]">Price: </span>
                                        {formatPrice(item.product_price)}
                                    </div>

                                    {/* Quantity */}
                                    <div className="col-span-4 md:col-span-2 flex justify-center">
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                className="qty-btn"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="w-8 text-center text-xs font-semibold text-charcoal">{item.quantity}</span>
                                            <button 
                                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                className="qty-btn"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="col-span-4 md:col-span-2 text-right">
                                        <span className="md:hidden text-[11px] text-[#6B5B55]">Total: </span>
                                        <span className="font-semibold text-charcoal">{formatPrice(item.product_price * item.quantity)}</span>
                                        <button 
                                            onClick={() => handleRemove(item.id)}
                                            className="hidden md:block text-[11px] text-[#6B5B55] hover:text-rose mt-1 ml-auto"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <Link to="/shop" className="inline-flex items-center gap-2 mt-6 text-xs uppercase tracking-wider font-semibold text-charcoal hover:text-rose transition-colors">
                            <ArrowRight size={16} className="rotate-180" /> Continue Shopping
                        </Link>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-md border border-[#EADFD6] p-6 sticky top-24 shadow-xs">
                            <h2 className="font-heading text-lg uppercase tracking-wider text-charcoal font-semibold mb-4 border-b border-[#EADFD6] pb-3">Order Summary</h2>

                            <div className="space-y-3 mb-6 text-xs text-[#6B5B55]">
                                <div className="flex justify-between">
                                    <span>Subtotal ({cart.items.length} items)</span>
                                    <span className="text-charcoal font-medium">{formatPrice(cart.total)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span className="text-charcoal font-medium">{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
                                </div>
                                {cart.total < 2999 && (
                                    <p className="text-[11px] text-rose font-medium pt-1">
                                        Add {formatPrice(2999 - cart.total)} more for free shipping!
                                    </p>
                                )}
                            </div>

                            <div className="border-t border-[#EADFD6] pt-4 mb-6">
                                <div className="flex justify-between font-heading text-lg text-charcoal font-bold">
                                    <span>Total</span>
                                    <span data-testid="cart-total">{formatPrice(grandTotal)}</span>
                                </div>
                                <p className="text-[10px] text-[#6B5B55] mt-0.5">Inclusive of all taxes</p>
                            </div>

                            <button 
                                onClick={handleCheckout}
                                className="btn-primary w-full"
                                data-testid="checkout-btn"
                            >
                                Proceed to Checkout
                            </button>

                            {/* Payment Methods */}
                            <div className="mt-5 text-center">
                                <p className="text-[10px] uppercase tracking-widest text-[#6B5B55] mb-2">Secure Payments via</p>
                                <div className="flex justify-center gap-2 text-[10px] font-bold text-[#6B5B55]">
                                    <span>VISA</span>
                                    <span>•</span>
                                    <span>MASTERCARD</span>
                                    <span>•</span>
                                    <span>UPI</span>
                                    <span>•</span>
                                    <span>RAZORPAY</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
