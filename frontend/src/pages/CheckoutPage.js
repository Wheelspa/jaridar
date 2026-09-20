import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ChevronRight, CreditCard, Smartphone, Building, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { cart, fetchCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    
    const [shippingAddress, setShippingAddress] = useState({
        fullName: user?.name || '',
        phone: user?.phone || '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        email: user?.email || ''
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login?redirect=/checkout');
            return;
        }
        if (cart.items.length === 0) {
            navigate('/cart');
        }
    }, [isAuthenticated, cart.items.length, navigate]);

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setShippingAddress(prev => ({ ...prev, [name]: value }));
    };

    const validateAddress = () => {
        const required = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode', 'email'];
        for (const field of required) {
            if (!shippingAddress[field]) {
                toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return false;
            }
        }
        if (!/^\d{10}$/.test(shippingAddress.phone)) {
            toast.error('Please enter a valid 10-digit phone number');
            return false;
        }
        if (!/^\d{6}$/.test(shippingAddress.pincode)) {
            toast.error('Please enter a valid 6-digit pincode');
            return false;
        }
        return true;
    };

    const handleProceedToPayment = () => {
        if (validateAddress()) {
            setStep(2);
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        setLoading(true);
        
        try {
            // Load Razorpay script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                toast.error('Failed to load payment gateway');
                setLoading(false);
                return;
            }

            // Create order
            const orderResponse = await axios.post(`${API}/orders`, {
                shipping_address: shippingAddress,
                payment_method: 'razorpay'
            });

            const { order_id, razorpay_order_id, amount, key_id } = orderResponse.data;

            if (!razorpay_order_id || !key_id) {
                // If Razorpay is not configured, simulate success
                toast.success('Order placed successfully!');
                await fetchCart();
                navigate(`/account/orders/${order_id}`);
                return;
            }

            // Open Razorpay checkout
            const options = {
                key: key_id,
                amount: amount * 100,
                currency: 'INR',
                name: 'Jaridar Fashion Couture',
                description: 'Order Payment',
                order_id: razorpay_order_id,
                handler: async (response) => {
                    try {
                        await axios.post(`${API}/orders/verify-payment`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        toast.success('Payment successful! Order confirmed.');
                        await fetchCart();
                        navigate(`/account/orders/${order_id}`);
                    } catch (error) {
                        toast.error('Payment verification failed');
                    }
                },
                prefill: {
                    name: shippingAddress.fullName,
                    email: shippingAddress.email,
                    contact: shippingAddress.phone
                },
                theme: {
                    color: '#E8A0BF'
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error('Payment error:', error);
            toast.error('Failed to process payment');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);
    };

    const shippingCost = cart.total >= 2999 ? 0 : 199;
    const grandTotal = cart.total + shippingCost;

    return (
        <div className="min-h-screen bg-[#FFFBF7]" data-testid="checkout-page">
            {/* Progress Bar */}
            <div className="bg-white border-b border-[#EADFD6]">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-center gap-4 text-xs font-semibold uppercase tracking-wider">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-rose' : 'text-[#6B5B55]'}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-rose text-white' : 'bg-[#FAF0EA] text-[#6B5B55] border border-[#EADFD6]'}`}>
                                {step > 1 ? <Check size={14} /> : '1'}
                            </div>
                            <span className="hidden sm:inline">Shipping</span>
                        </div>
                        <ChevronRight size={16} className="text-[#6B5B55]" />
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-rose' : 'text-[#6B5B55]'}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-rose text-white' : 'bg-[#FAF0EA] text-[#6B5B55] border border-[#EADFD6]'}`}>
                                2
                            </div>
                            <span className="hidden sm:inline">Payment</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white rounded-md border border-[#EADFD6] p-6 md:p-8 shadow-xs"
                            >
                                <h2 className="font-heading text-xl uppercase tracking-wider text-charcoal font-semibold mb-6 border-b border-[#EADFD6] pb-3">Shipping Address</h2>
                                
                                <div className="grid md:grid-cols-2 gap-5 text-xs">
                                    <div>
                                        <Label htmlFor="fullName" className="text-xs uppercase tracking-wider text-charcoal font-semibold mb-1 block">Full Name *</Label>
                                        <Input
                                            id="fullName"
                                            name="fullName"
                                            value={shippingAddress.fullName}
                                            onChange={handleAddressChange}
                                            className="mt-1 border-[#EADFD6] text-xs"
                                            data-testid="input-fullName"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-charcoal font-semibold mb-1 block">Phone Number *</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            value={shippingAddress.phone}
                                            onChange={handleAddressChange}
                                            className="mt-1 border-[#EADFD6] text-xs"
                                            placeholder="10-digit number"
                                            data-testid="input-phone"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email" className="text-xs uppercase tracking-wider text-charcoal font-semibold mb-1 block">Email *</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={shippingAddress.email}
                                            onChange={handleAddressChange}
                                            className="mt-1 border-[#EADFD6] text-xs"
                                            data-testid="input-email"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="addressLine1" className="text-xs uppercase tracking-wider text-charcoal font-semibold mb-1 block">Address Line 1 *</Label>
                                        <Input
                                            id="addressLine1"
                                            name="addressLine1"
                                            value={shippingAddress.addressLine1}
                                            onChange={handleAddressChange}
                                            className="mt-1 border-[#EADFD6] text-xs"
                                            placeholder="House No, Building, Street"
                                            data-testid="input-address1"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="addressLine2" className="text-xs uppercase tracking-wider text-charcoal font-semibold mb-1 block">Address Line 2</Label>
                                        <Input
                                            id="addressLine2"
                                            name="addressLine2"
                                            value={shippingAddress.addressLine2}
                                            onChange={handleAddressChange}
                                            className="mt-1 border-[#EADFD6] text-xs"
                                            placeholder="Landmark (Optional)"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="city" className="text-xs uppercase tracking-wider text-charcoal font-semibold mb-1 block">City *</Label>
                                        <Input
                                            id="city"
                                            name="city"
                                            value={shippingAddress.city}
                                            onChange={handleAddressChange}
                                            className="mt-1 border-[#EADFD6] text-xs"
                                            data-testid="input-city"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="state" className="text-xs uppercase tracking-wider text-charcoal font-semibold mb-1 block">State *</Label>
                                        <Input
                                            id="state"
                                            name="state"
                                            value={shippingAddress.state}
                                            onChange={handleAddressChange}
                                            className="mt-1 border-[#EADFD6] text-xs"
                                            data-testid="input-state"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="pincode" className="text-xs uppercase tracking-wider text-charcoal font-semibold mb-1 block">Pincode *</Label>
                                        <Input
                                            id="pincode"
                                            name="pincode"
                                            value={shippingAddress.pincode}
                                            onChange={handleAddressChange}
                                            className="mt-1 border-[#EADFD6] text-xs"
                                            placeholder="6-digit pincode"
                                            data-testid="input-pincode"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleProceedToPayment}
                                    className="btn-primary w-full mt-6"
                                    data-testid="proceed-payment-btn"
                                >
                                    Continue to Payment
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 15 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white rounded-md border border-[#EADFD6] p-6 md:p-8 shadow-xs"
                            >
                                <h2 className="font-heading text-xl uppercase tracking-wider text-charcoal font-semibold mb-6 border-b border-[#EADFD6] pb-3">Payment Method</h2>

                                {/* Shipping Address Summary */}
                                <div className="bg-[#FAF0EA] rounded-md p-4 mb-6 border border-[#EADFD6]">
                                    <div className="flex justify-between items-start text-xs">
                                        <div>
                                            <p className="font-semibold text-charcoal">{shippingAddress.fullName}</p>
                                            <p className="text-[#6B5B55] mt-1 leading-relaxed">
                                                {shippingAddress.addressLine1}<br />
                                                {shippingAddress.addressLine2 && <>{shippingAddress.addressLine2}<br /></>}
                                                {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                                            </p>
                                            <p className="text-[#6B5B55] mt-1 font-medium">{shippingAddress.phone}</p>
                                        </div>
                                        <button 
                                            onClick={() => setStep(1)}
                                            className="text-xs text-rose hover:underline font-semibold"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>

                                {/* Payment Options */}
                                <div className="space-y-4">
                                    <div className="border border-rose rounded-md p-4 flex items-center gap-4 bg-[#F6E4E6]/50">
                                        <div className="w-9 h-9 rounded-full bg-rose/15 flex items-center justify-center text-rose">
                                            <CreditCard size={18} />
                                        </div>
                                        <div className="flex-1 text-xs">
                                            <p className="font-semibold text-charcoal">Razorpay Secure Gateway</p>
                                            <p className="text-[#6B5B55]">Credit/Debit Cards, UPI, Net Banking, Wallets</p>
                                        </div>
                                        <div className="w-4 h-4 rounded-full border-2 border-rose flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-rose"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-8">
                                    <button 
                                        onClick={() => setStep(1)}
                                        className="btn-secondary flex-1"
                                    >
                                        Back
                                    </button>
                                    <button 
                                        onClick={handlePayment}
                                        disabled={loading}
                                        className="btn-primary flex-1"
                                        data-testid="pay-now-btn"
                                    >
                                        {loading ? 'Processing...' : `Pay ${formatPrice(grandTotal)}`}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-md border border-[#EADFD6] p-6 sticky top-24 shadow-xs">
                            <h3 className="font-heading text-lg uppercase tracking-wider text-charcoal font-semibold mb-4 border-b border-[#EADFD6] pb-3">Order Summary</h3>

                            {/* Items */}
                            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                                {cart.items.map((item) => (
                                    <div key={item.id} className="flex gap-3 text-xs">
                                        <div className="w-14 h-16 bg-[#FAF0EA] rounded-sm overflow-hidden border border-[#EADFD6] flex-shrink-0">
                                            <img 
                                                src={item.product_image}
                                                alt={item.product_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-charcoal truncate">{item.product_name}</p>
                                            <p className="text-[11px] text-[#6B5B55]">
                                                Size: {item.size} | Qty: {item.quantity}
                                            </p>
                                            <p className="text-xs font-semibold text-charcoal mt-0.5">
                                                {formatPrice(item.product_price * item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-[#EADFD6] pt-3 space-y-2 text-xs text-[#6B5B55]">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="text-charcoal font-medium">{formatPrice(cart.total)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span className="text-charcoal font-medium">{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
                                </div>
                                <div className="flex justify-between font-heading text-lg text-charcoal font-bold pt-3 border-t border-[#EADFD6]">
                                    <span>Total</span>
                                    <span>{formatPrice(grandTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
