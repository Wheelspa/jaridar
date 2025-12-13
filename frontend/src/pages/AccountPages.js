import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Package, Heart, Settings, LogOut, ChevronRight, Truck, Check, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/common/ProductCard';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AccountLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/');
    };

    const navItems = [
        { path: '/account/orders', icon: Package, label: 'My Orders' },
        { path: '/account/wishlist', icon: Heart, label: 'Wishlist' },
        { path: '/account/profile', icon: Settings, label: 'Profile Settings' },
    ];

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-pearl" data-testid="account-page">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <aside className="lg:col-span-1">
                        <div className="bg-white rounded-lg p-6">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose to-serenity flex items-center justify-center">
                                    <span className="font-heading text-2xl text-white">{user?.name?.[0]?.toUpperCase()}</span>
                                </div>
                                <div>
                                    <p className="font-heading text-lg">{user?.name}</p>
                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                </div>
                            </div>

                            <nav className="space-y-2">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                                            location.pathname === item.path 
                                                ? 'bg-rose/10 text-rose' 
                                                : 'hover:bg-gray-50 text-gray-600'
                                        }`}
                                        style={{ transition: 'background-color 0.2s' }}
                                    >
                                        <item.icon size={20} />
                                        {item.label}
                                    </Link>
                                ))}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left hover:bg-red-50 text-red-600"
                                    style={{ transition: 'background-color 0.2s' }}
                                >
                                    <LogOut size={20} />
                                    Logout
                                </button>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-3">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get(`${API}/orders`);
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'status-pending';
            case 'confirmed': return 'status-confirmed';
            case 'shipped': return 'status-shipped';
            case 'delivered': return 'status-delivered';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg p-8">
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-gray-100 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg" data-testid="orders-page">
            <div className="p-6 border-b">
                <h1 className="font-heading text-2xl">My Orders</h1>
            </div>

            {orders.length === 0 ? (
                <div className="p-12 text-center">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">No orders yet</p>
                    <Link to="/shop" className="btn-primary">Start Shopping</Link>
                </div>
            ) : (
                <div className="divide-y">
                    {orders.map((order) => (
                        <div key={order.id} className="p-6">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(order.order_status)}`}>
                                        {order.order_status}
                                    </span>
                                    <Link 
                                        to={`/account/orders/${order.id}`}
                                        className="text-rose text-sm hover:underline flex items-center gap-1"
                                    >
                                        View Details <ChevronRight size={14} />
                                    </Link>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                {order.items.slice(0, 3).map((item, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-16 h-20 bg-gray-100">
                                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium truncate max-w-[150px]">{item.product_name}</p>
                                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                                {order.items.length > 3 && (
                                    <div className="flex items-center text-sm text-gray-500">
                                        +{order.items.length - 3} more
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t flex justify-between">
                                <span className="text-sm text-gray-500">Total Amount</span>
                                <span className="font-semibold">{formatPrice(order.total_amount)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const OrderDetailPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const response = await axios.get(`${API}/orders/${orderId}`);
            setOrder(response.data);
        } catch (error) {
            console.error('Failed to fetch order:', error);
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

    if (loading) {
        return <div className="bg-white rounded-lg p-8 text-center">Loading...</div>;
    }

    if (!order) {
        return <div className="bg-white rounded-lg p-8 text-center">Order not found</div>;
    }

    const statusSteps = ['pending', 'confirmed', 'shipped', 'delivered'];
    const currentStepIndex = statusSteps.indexOf(order.order_status);

    return (
        <div className="space-y-6" data-testid="order-detail-page">
            {/* Order Header */}
            <div className="bg-white rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="font-heading text-2xl">Order Details</h1>
                        <p className="text-gray-500 text-sm">Order #{order.id.slice(0, 8)}</p>
                    </div>
                    <Link to="/account/orders" className="text-rose hover:underline text-sm">
                        Back to Orders
                    </Link>
                </div>

                {/* Order Timeline */}
                <div className="flex items-center justify-between relative">
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200"></div>
                    {statusSteps.map((step, index) => (
                        <div key={step} className="relative z-10 flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                index <= currentStepIndex ? 'bg-rose text-white' : 'bg-gray-200 text-gray-400'
                            }`}>
                                {index < currentStepIndex ? <Check size={16} /> : 
                                 index === currentStepIndex ? <Clock size={16} /> : 
                                 <span className="text-xs">{index + 1}</span>}
                            </div>
                            <span className="text-xs mt-2 capitalize">{step}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg p-6">
                <h2 className="font-heading text-xl mb-4">Items</h2>
                <div className="divide-y">
                    {order.items.map((item, i) => (
                        <div key={i} className="py-4 flex gap-4">
                            <div className="w-20 h-24 bg-gray-100 flex-shrink-0">
                                <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-sm text-gray-500">Size: {item.size} | Color: {item.color}</p>
                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold">{formatPrice(item.subtotal)}</p>
                                <p className="text-xs text-gray-500">{formatPrice(item.price)} each</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t mt-4 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span>{formatPrice(order.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Shipping</span>
                        <span>Free</span>
                    </div>
                    <div className="flex justify-between font-heading text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>{formatPrice(order.total_amount)}</span>
                    </div>
                </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg p-6">
                <h2 className="font-heading text-xl mb-4">Shipping Address</h2>
                <div className="text-gray-600">
                    <p className="font-medium text-charcoal">{order.shipping_address.fullName}</p>
                    <p>{order.shipping_address.addressLine1}</p>
                    {order.shipping_address.addressLine2 && <p>{order.shipping_address.addressLine2}</p>}
                    <p>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</p>
                    <p>Phone: {order.shipping_address.phone}</p>
                </div>
            </div>
        </div>
    );
};

const WishlistPage = () => {
    const { wishlist, loading } = useWishlist();

    if (loading) {
        return (
            <div className="bg-white rounded-lg p-8">
                <div className="animate-pulse grid grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i}>
                            <div className="aspect-[3/4] bg-gray-200 mb-4"></div>
                            <div className="h-4 bg-gray-200 mb-2"></div>
                            <div className="h-4 bg-gray-200 w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg" data-testid="wishlist-page">
            <div className="p-6 border-b">
                <h1 className="font-heading text-2xl">My Wishlist</h1>
            </div>

            {wishlist.length === 0 ? (
                <div className="p-12 text-center">
                    <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                    <Link to="/shop" className="btn-primary">Explore Products</Link>
                </div>
            ) : (
                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {wishlist.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ProfilePage = () => {
    const { user, updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateProfile(formData);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg" data-testid="profile-page">
            <div className="p-6 border-b">
                <h1 className="font-heading text-2xl">Profile Settings</h1>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-md">
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="mt-1 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="10-digit number"
                        className="mt-1"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
};

export { AccountLayout, OrdersPage, OrderDetailPage, WishlistPage, ProfilePage };
