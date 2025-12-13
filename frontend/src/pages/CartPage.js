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
            <div className="min-h-screen bg-pearl flex items-center justify-center px-6">
                <div className="text-center">
                    <ShoppingBag size={64} className="mx-auto text-gray-300 mb-6" />
                    <h2 className="font-heading text-3xl text-charcoal mb-4">Your Cart is Empty</h2>
                    <p className="text-gray-500 mb-8">Please login to view your cart</p>
                    <Link to="/login" className="btn-primary">Login to Continue</Link>
                </div>
            </div>
        );
    }

    if (cart.items.length === 0) {
        return (
            <div className="min-h-screen bg-pearl flex items-center justify-center px-6" data-testid="empty-cart">
                <div className="text-center">
                    <ShoppingBag size={64} className="mx-auto text-gray-300 mb-6" />
                    <h2 className="font-heading text-3xl text-charcoal mb-4">Your Cart is Empty</h2>
                    <p className="text-gray-500 mb-8">Looks like you haven't added anything yet</p>
                    <Link to="/shop" className="btn-primary">Start Shopping</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-pearl" data-testid="cart-page">
            {/* Breadcrumb */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
                    <div className="flex items-center text-sm text-gray-500">
                        <Link to="/" className="hover:text-rose">Home</Link>
                        <span className="mx-2">/</span>
                        <span className="text-charcoal">Shopping Cart</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
                <h1 className="font-heading text-4xl text-charcoal mb-8">Shopping Cart</h1>

                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Cart Items */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg overflow-hidden">
                            {/* Header */}
                            <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 text-sm font-medium text-gray-500">
                                <div className="col-span-6">Product</div>
                                <div className="col-span-2 text-center">Price</div>
                                <div className="col-span-2 text-center">Quantity</div>
                                <div className="col-span-2 text-right">Total</div>
                            </div>

                            {/* Items */}
                            {cart.items.map((item, index) => (
                                <motion.div 
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="grid grid-cols-12 gap-4 p-4 border-b items-center"
                                    data-testid={`cart-item-${item.id}`}
                                >
                                    {/* Product */}
                                    <div className="col-span-12 md:col-span-6 flex gap-4">
                                        <Link to={`/product/${item.product_id}`} className="w-20 h-24 flex-shrink-0">
                                            <img 
                                                src={item.product_image}
                                                alt={item.product_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <Link 
                                                to={`/product/${item.product_id}`}
                                                className="font-heading text-lg text-charcoal hover:text-rose block truncate"
                                            >
                                                {item.product_name}
                                            </Link>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Size: {item.size} | Color: {item.color}
                                            </p>
                                            <button 
                                                onClick={() => handleRemove(item.id)}
                                                className="text-sm text-red-500 hover:underline mt-2 flex items-center gap-1 md:hidden"
                                            >
                                                <X size={14} /> Remove
                                            </button>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="col-span-4 md:col-span-2 text-center">
                                        <span className="md:hidden text-sm text-gray-500">Price: </span>
                                        {formatPrice(item.product_price)}
                                    </div>

                                    {/* Quantity */}
                                    <div className="col-span-4 md:col-span-2 flex justify-center">
                                        <div className="flex items-center">
                                            <button 
                                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                className="qty-btn"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-10 text-center">{item.quantity}</span>
                                            <button 
                                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                className="qty-btn"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="col-span-4 md:col-span-2 text-right">
                                        <span className="md:hidden text-sm text-gray-500">Total: </span>
                                        <span className="font-semibold">{formatPrice(item.product_price * item.quantity)}</span>
                                        <button 
                                            onClick={() => handleRemove(item.id)}
                                            className="hidden md:block text-sm text-gray-400 hover:text-red-500 mt-1"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <Link to="/shop" className="inline-flex items-center gap-2 mt-6 text-charcoal hover:text-rose">
                            <ArrowRight size={18} className="rotate-180" /> Continue Shopping
                        </Link>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg p-6 sticky top-24">
                            <h2 className="font-heading text-2xl mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal ({cart.items.length} items)</span>
                                    <span>{formatPrice(cart.total)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
                                </div>
                                {cart.total < 2999 && (
                                    <p className="text-xs text-rose">
                                        Add {formatPrice(2999 - cart.total)} more for free shipping!
                                    </p>
                                )}
                            </div>

                            <div className="border-t pt-4 mb-6">
                                <div className="flex justify-between font-heading text-xl">
                                    <span>Total</span>
                                    <span data-testid="cart-total">{formatPrice(grandTotal)}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
                            </div>

                            <button 
                                onClick={handleCheckout}
                                className="btn-primary w-full"
                                data-testid="checkout-btn"
                            >
                                Proceed to Checkout
                            </button>

                            {/* Payment Methods */}
                            <div className="mt-6 text-center">
                                <p className="text-xs text-gray-500 mb-2">Secure Payments via</p>
                                <div className="flex justify-center gap-2 text-gray-400 text-xs">
                                    <span>Cards</span>
                                    <span>•</span>
                                    <span>UPI</span>
                                    <span>•</span>
                                    <span>Net Banking</span>
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
