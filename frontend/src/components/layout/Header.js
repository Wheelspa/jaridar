import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ANNOUNCEMENT_MESSAGES = [
    { prefix: "BUY 1 GET ", highlight: "20% OFF", suffix: "" },
    { prefix: "BUY 2 GET EXTRA ", highlight: "₹500 OFF", suffix: "" },
    { prefix: "FREE SHIPPING ON ORDERS ABOVE ₹2999", highlight: "", suffix: "" }
];

const ATTRIBUTE_THUMBNAILS = {
    // Product types
    'saree': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300',
    'lehenga': 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=300',
    'salwar-suit': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300',
    'kurta-set': 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=300',
    'gown': 'https://images.unsplash.com/photo-1519657337289-077653f724ed?w=300',
    'dress': 'https://images.unsplash.com/photo-1612364557094-98a4b47200f6?w=300',
    'top-shirt': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300',
    'jumpsuit': 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300',
    'co-ord-set': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300',
    'dupatta': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300',

    // Regions
    'banarasi': '/images/categories/category-traditional.jpg',
    'kanjivaram': '/images/categories/category-ethnic.jpg',
    'rajasthani': '/images/categories/category-bridal.jpg',
    'gujarati': '/images/categories/category-western.jpg',
    'bengali': '/images/categories/category-traditional.jpg',

    // Fabrics
    'silk': '/images/fabrics/fabric-silk.jpg',
    'cotton': '/images/fabrics/fabric-cotton.jpg',
    'georgette': '/images/fabrics/fabric-georgette.jpg',
    'velvet': '/images/fabrics/fabric-velvet.jpg',
    'chiffon': '/images/fabrics/fabric-chiffon.jpg',
    'net': '/images/fabrics/fabric-net.jpg',
};

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
    const [isRegionOpen, setIsRegionOpen] = useState(false);
    const [isFabricsOpen, setIsFabricsOpen] = useState(false);
    const [expandedMobileCategory, setExpandedMobileCategory] = useState(null);
    const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
    const [headerAttributes, setHeaderAttributes] = useState({
        product_type: [],
        region: [],
        fabric: []
    });

    const { user, isAuthenticated, logout, isAdmin } = useAuth();
    const { cartCount } = useCart();
    const { wishlistCount } = useWishlist();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchHeaderAttributes = async () => {
            try {
                const res = await axios.get(`${API}/attributes?with_counts=true`);
                if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
                    setHeaderAttributes({
                        product_type: (res.data.product_type || []).filter(item => (item.count !== undefined ? item.count : 0) >= 1),
                        region: (res.data.region || []).filter(item => (item.count !== undefined ? item.count : 0) >= 1),
                        fabric: (res.data.fabric || []).filter(item => (item.count !== undefined ? item.count : 0) >= 1),
                    });
                }
            } catch (err) {
                console.error('Failed to fetch header attributes:', err);
            }
        };
        fetchHeaderAttributes();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentMsgIndex((prev) => (prev + 1) % ANNOUNCEMENT_MESSAGES.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
            setIsSearchOpen(false);
        }
    };

    return (
        <div className="w-full">
            {/* Announcement Bar */}
            <div className="bg-[#C2255C] h-[42px] flex items-center justify-center">
                <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px] text-center">
                    {/* Desktop: all three centered in one line separated by | */}
                    <div className="hidden md:flex items-center justify-center gap-4 text-sm uppercase tracking-wide">
                        {ANNOUNCEMENT_MESSAGES.map((msg, idx) => (
                            <span key={idx} className="flex items-center gap-4">
                                {idx > 0 && <span className="text-white/40 font-normal">|</span>}
                                <span>
                                    <span className="font-medium text-white">{msg.prefix}</span>
                                    {msg.highlight && <span className="font-bold text-[#F3D9A0]">{msg.highlight}</span>}
                                    {msg.suffix && <span className="font-medium text-white">{msg.suffix}</span>}
                                </span>
                            </span>
                        ))}
                    </div>

                    {/* Mobile: rotate 1 at a time every 3s */}
                    <div className="md:hidden relative h-5 flex items-center justify-center overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={currentMsgIndex}
                                initial={{ opacity: 0, y: 3 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -3 }}
                                transition={{ duration: 0.35, ease: "easeInOut" }}
                                className="text-sm uppercase tracking-wide whitespace-nowrap"
                            >
                                <span className="font-medium text-white">{ANNOUNCEMENT_MESSAGES[currentMsgIndex].prefix}</span>
                                {ANNOUNCEMENT_MESSAGES[currentMsgIndex].highlight && (
                                    <span className="font-bold text-[#F3D9A0]">{ANNOUNCEMENT_MESSAGES[currentMsgIndex].highlight}</span>
                                )}
                                {ANNOUNCEMENT_MESSAGES[currentMsgIndex].suffix && (
                                    <span className="font-medium text-white">{ANNOUNCEMENT_MESSAGES[currentMsgIndex].suffix}</span>
                                )}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Main Sticky Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] w-full" data-testid="header">
                <div className="w-full max-w-full px-4 sm:px-6 md:px-8 xl:px-[50px] h-[72px] xl:h-[110px] flex items-center justify-between gap-2 sm:gap-4">
                    
                    {/* Left Unit: Mobile Toggle (below lg) + Logo */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                        <button 
                            className="lg:hidden p-1.5 text-[#1F2937] hover:text-[#C2255C] transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            data-testid="mobile-menu-btn"
                            aria-label="Toggle Menu"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0" data-testid="logo">
                            <img 
                                src="/images/logo/jaridar-icon.png" 
                                alt="Jaridar Icon" 
                                className="h-12 sm:h-14 xl:h-16 w-auto object-contain flex-shrink-0" 
                            />
                            <div className="flex flex-col justify-center">
                                <span className="font-heading text-xl sm:text-2xl xl:text-3xl font-black text-[#C2255C] tracking-tight leading-none">
                                    JARIDAR
                                </span>
                                <span className="text-xs font-bold text-[#3B6FA0] uppercase tracking-[0.26em] pt-0.5 leading-tight">
                                    Fashion Couture
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Center Unit: Desktop Nav */}
                    <nav className="hidden lg:flex items-center justify-center gap-3 lg:gap-3.5 xl:gap-5 2xl:gap-8 h-full min-w-0 flex-1 px-1 lg:px-2">
                        {/* 1. HOME */}
                        <Link 
                            to="/" 
                            className={`text-sm xl:text-[15px] uppercase tracking-normal font-semibold h-full flex items-center border-b-2 transition-colors whitespace-nowrap ${
                                location.pathname === '/' ? 'text-[#C2255C] border-[#C2255C] font-semibold' : 'text-[#1F2937] border-transparent hover:text-[#C2255C]'
                            }`}
                        >
                            HOME
                        </Link>

                        {/* 2. COLLECTIONS Mega Menu Trigger */}
                        <div 
                            className="relative h-full flex items-center"
                            onMouseEnter={() => setIsCollectionsOpen(true)}
                            onMouseLeave={() => setIsCollectionsOpen(false)}
                        >
                            <Link 
                                to="/shop" 
                                className={`text-sm xl:text-[15px] uppercase tracking-normal font-semibold h-full flex items-center gap-1 border-b-2 transition-colors whitespace-nowrap ${
                                    isCollectionsOpen || location.search.includes('category=') || location.search.includes('product_type=') ? 'text-[#C2255C] border-[#C2255C] font-semibold' : 'text-[#1F2937] border-transparent hover:text-[#C2255C]'
                                }`}
                            >
                                COLLECTIONS
                                <ChevronDown size={14} className={`transition-transform duration-200 ${isCollectionsOpen ? 'rotate-180 text-[#C2255C]' : 'text-[#4B5563]'}`} />
                            </Link>

                            {/* Dropdown Mega Panel */}
                            {isCollectionsOpen && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[840px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] p-6 lg:p-8 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="border-b border-[#E5E7EB] pb-3 mb-5 flex items-center justify-between">
                                        <h3 className="font-heading text-sm uppercase tracking-wider font-bold text-charcoal">
                                            Product Types
                                        </h3>
                                        <Link 
                                            to="/shop" 
                                            onClick={() => setIsCollectionsOpen(false)}
                                            className="text-xs font-semibold text-[#C2255C] hover:underline"
                                        >
                                            View All Products →
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {headerAttributes.product_type.map((pt) => {
                                            const imgUrl = ATTRIBUTE_THUMBNAILS[pt.value];
                                            return (
                                                <Link 
                                                    key={pt.value}
                                                    to={`/shop?product_type=${pt.value}`} 
                                                    onClick={() => setIsCollectionsOpen(false)}
                                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all group"
                                                >
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-[#E5E7EB] bg-[#F7F9FC]">
                                                        {imgUrl ? (
                                                            <img 
                                                                src={imgUrl} 
                                                                alt={pt.label} 
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-[#F7F9FC] flex items-center justify-center text-[#4B5563] font-bold text-xs uppercase">
                                                                {pt.label ? pt.label.slice(0, 2) : '•'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-sm font-semibold text-[#1F2937] group-hover:text-[#C2255C] transition-colors truncate">{pt.label}</h4>
                                                        <span className="text-xs text-[#4B5563] font-normal">{pt.count !== undefined ? `${pt.count} Items` : 'Explore'}</span>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. BY REGION Mega Menu Trigger */}
                        <div 
                            className="relative h-full flex items-center"
                            onMouseEnter={() => setIsRegionOpen(true)}
                            onMouseLeave={() => setIsRegionOpen(false)}
                        >
                            <Link 
                                to="/shop" 
                                className={`text-sm xl:text-[15px] uppercase tracking-normal font-semibold h-full flex items-center gap-1 border-b-2 transition-colors whitespace-nowrap ${
                                    isRegionOpen || location.search.includes('region=') ? 'text-[#C2255C] border-[#C2255C] font-semibold' : 'text-[#1F2937] border-transparent hover:text-[#C2255C]'
                                }`}
                            >
                                BY REGION
                                <ChevronDown size={14} className={`transition-transform duration-200 ${isRegionOpen ? 'rotate-180 text-[#C2255C]' : 'text-[#4B5563]'}`} />
                            </Link>

                            {/* Dropdown Mega Panel */}
                            {isRegionOpen && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[720px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] p-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-5 gap-4">
                                        {headerAttributes.region.map((reg) => {
                                            const imgUrl = ATTRIBUTE_THUMBNAILS[reg.value];
                                            return (
                                                <Link 
                                                    key={reg.value}
                                                    to={`/shop?region=${reg.value}`} 
                                                    onClick={() => setIsRegionOpen(false)}
                                                    className="flex flex-col items-center text-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-all group"
                                                >
                                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-[#E5E7EB] bg-[#F7F9FC]">
                                                        {imgUrl ? (
                                                            <img 
                                                                src={imgUrl} 
                                                                alt={reg.label} 
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-[#F7F9FC] flex items-center justify-center text-[#4B5563] font-bold text-xs uppercase">
                                                                {reg.label ? reg.label.slice(0, 2) : '•'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-[#1F2937] group-hover:text-[#C2255C] transition-colors leading-tight">{reg.label}</h4>
                                                        <span className="text-xs text-[#4B5563]">{reg.count !== undefined ? `${reg.count} Items` : 'Explore'}</span>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. NEW ARRIVALS */}
                        <Link 
                            to="/shop?filter=new" 
                            className={`text-sm xl:text-[15px] uppercase tracking-normal font-semibold h-full flex items-center border-b-2 transition-colors whitespace-nowrap ${
                                location.search.includes('filter=new') ? 'text-[#C2255C] border-[#C2255C] font-semibold' : 'text-[#1F2937] border-transparent hover:text-[#C2255C]'
                            }`}
                        >
                            NEW ARRIVALS
                        </Link>

                        {/* 5. FESTIVE */}
                        <Link 
                            to="/shop?style=festive-wear" 
                            className={`text-sm xl:text-[15px] uppercase tracking-normal font-semibold h-full flex items-center border-b-2 transition-colors whitespace-nowrap ${
                                location.search.includes('style=festive-wear') ? 'text-[#C2255C] border-[#C2255C] font-semibold' : 'text-[#1F2937] border-transparent hover:text-[#C2255C]'
                            }`}
                        >
                            FESTIVE
                        </Link>

                        {/* 6. FABRICS Mega Menu Trigger */}
                        <div 
                            className="relative h-full flex items-center"
                            onMouseEnter={() => setIsFabricsOpen(true)}
                            onMouseLeave={() => setIsFabricsOpen(false)}
                        >
                            <button 
                                className={`text-sm xl:text-[15px] uppercase tracking-normal font-semibold h-full flex items-center gap-1 border-b-2 transition-colors whitespace-nowrap ${
                                    isFabricsOpen || location.search.includes('fabric=') ? 'text-[#C2255C] border-[#C2255C] font-semibold' : 'text-[#1F2937] border-transparent hover:text-[#C2255C]'
                                }`}
                            >
                                FABRICS
                                <ChevronDown size={14} className={`transition-transform duration-200 ${isFabricsOpen ? 'rotate-180 text-[#C2255C]' : 'text-[#4B5563]'}`} />
                            </button>

                            {/* Dropdown Mega Panel */}
                            {isFabricsOpen && (
                                <div className="absolute top-full right-0 xl:left-1/2 xl:-translate-x-1/2 w-[780px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] p-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-6 gap-4">
                                        {headerAttributes.fabric.map((fab) => {
                                            const imgUrl = ATTRIBUTE_THUMBNAILS[fab.value];
                                            return (
                                                <Link 
                                                    key={fab.value}
                                                    to={`/shop?fabric=${fab.value}`} 
                                                    onClick={() => setIsFabricsOpen(false)}
                                                    className="flex flex-col items-center text-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-all group"
                                                >
                                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-[#E5E7EB] bg-[#F7F9FC]">
                                                        {imgUrl ? (
                                                            <img 
                                                                src={imgUrl} 
                                                                alt={fab.label} 
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-[#F7F9FC] flex items-center justify-center text-[#4B5563] font-bold text-xs uppercase">
                                                                {fab.label ? fab.label.slice(0, 2) : '•'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-[#1F2937] group-hover:text-[#C2255C] transition-colors leading-tight">{fab.label}</h4>
                                                        <span className="text-xs text-[#4B5563]">{fab.count !== undefined ? `${fab.count} Items` : 'Explore'}</span>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 7. ABOUT US */}
                        <Link 
                            to="/about" 
                            className={`text-sm xl:text-[15px] uppercase tracking-normal font-semibold h-full flex items-center border-b-2 transition-colors whitespace-nowrap ${
                                location.pathname === '/about' ? 'text-[#C2255C] border-[#C2255C] font-semibold' : 'text-[#1F2937] border-transparent hover:text-[#C2255C]'
                            }`}
                        >
                            ABOUT US
                        </Link>

                        {/* 8. CONTACT */}
                        <Link 
                            to="/contact" 
                            className={`text-sm xl:text-[15px] uppercase tracking-normal font-semibold h-full flex items-center border-b-2 transition-colors whitespace-nowrap ${
                                location.pathname === '/contact' ? 'text-[#C2255C] border-[#C2255C] font-semibold' : 'text-[#1F2937] border-transparent hover:text-[#C2255C]'
                            }`}
                        >
                            CONTACT
                        </Link>
                    </nav>

                    {/* Right Unit: Icons */}
                    <div className="flex items-center gap-2 lg:gap-3.5 xl:gap-[22px] flex-shrink-0 pr-1 sm:pr-2">
                        {/* 1. Search */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsSearchOpen(!isSearchOpen)} 
                                className="p-1 text-[#1F2937] hover:text-[#C2255C] transition-colors rounded-full hover:bg-[#E8F0F8]"
                                aria-label="Toggle Search"
                                data-testid="search-toggle-btn"
                            >
                                <Search size={24} />
                            </button>

                            {isSearchOpen && (
                                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white p-3 rounded-2xl shadow-xl border border-[#E5E7EB] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search sarees, lehengas..."
                                            className="w-full px-4 py-2 text-base bg-white rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#C2255C] text-[#1F2937]"
                                            autoFocus
                                            data-testid="search-input"
                                        />
                                        <button 
                                            type="submit" 
                                            className="px-3.5 py-2 bg-[#C2255C] text-white text-sm font-semibold uppercase tracking-wide rounded-xl hover:bg-[#9C1D49] transition-colors flex-shrink-0"
                                        >
                                            Search
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* 2. Wishlist */}
                        <Link to="/account/wishlist" className="p-1 text-[#1F2937] hover:text-[#C2255C] transition-colors rounded-full hover:bg-[#E8F0F8] relative" data-testid="wishlist-btn">
                            <Heart size={24} />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] min-h-[18px] bg-[#C2255C] text-white text-xs font-bold rounded-full flex items-center justify-center p-0.5">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>

                        {/* 3. Cart */}
                        <Link to="/cart" className="p-1 text-[#1F2937] hover:text-[#C2255C] transition-colors rounded-full hover:bg-[#E8F0F8] relative" data-testid="cart-btn">
                            <ShoppingBag size={24} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] min-h-[18px] bg-[#C2255C] text-white text-xs font-bold rounded-full flex items-center justify-center p-0.5">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* 4. Account */}
                        {isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1 text-[#1F2937] hover:text-[#C2255C] transition-colors rounded-full hover:bg-[#E8F0F8]" data-testid="user-menu-btn">
                                        <User size={24} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white border border-[#E5E7EB]">
                                    <div className="px-3 py-2 text-sm">
                                        <p className="font-medium text-[#1F2937]">{user?.name}</p>
                                        <p className="text-[#4B5563] text-xs">{user?.email}</p>
                                    </div>
                                    <DropdownMenuSeparator className="bg-[#E5E7EB]" />
                                    {isAdmin && (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link to="/admin" className="font-semibold text-[#C2255C]" data-testid="admin-dashboard-link">Admin Dashboard</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-[#E5E7EB]" />
                                        </>
                                    )}
                                    <DropdownMenuItem asChild>
                                        <Link to="/account/orders" className="text-[#1F2937] hover:text-[#C2255C]">My Orders</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/account/wishlist" className="text-[#1F2937] hover:text-[#C2255C]">Wishlist</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/account/profile" className="text-[#1F2937] hover:text-[#C2255C]">Profile</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-[#E5E7EB]" />
                                    <DropdownMenuItem onClick={logout} className="text-[#C2255C] font-medium cursor-pointer">
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link to="/login" className="p-1 text-[#1F2937] hover:text-[#C2255C] transition-colors rounded-full hover:bg-[#E8F0F8]" data-testid="login-btn">
                                <User size={24} />
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Drawer */}
            <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
                <div className="p-6 bg-white min-h-screen">
                    <div className="flex justify-between items-center mb-8">
                        <Link to="/" onClick={() => setIsMenuOpen(false)}>
                            <h1 className="font-heading text-2xl text-[#1F2937] font-extrabold">JARIDAR</h1>
                        </Link>
                        <button onClick={() => setIsMenuOpen(false)}>
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={(e) => { handleSearch(e); setIsMenuOpen(false); }} className="mb-8">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products..."
                                className="w-full pl-4 pr-10 py-3 bg-white rounded-full border border-[#E5E7EB] text-base text-[#1F2937]"
                            />
                            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#C2255C]">
                                <Search size={20} />
                            </button>
                        </div>
                    </form>

                    <nav className="space-y-3">
                        {/* 1. Home */}
                        <Link 
                            to="/" 
                            className="block text-base uppercase tracking-wider font-heading py-2 border-b border-[#E5E7EB] text-[#1F2937] font-medium" 
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Home
                        </Link>
                        
                        {/* 2. Collections Accordion */}
                        <div className="border-b border-[#E5E7EB] pb-2">
                            <div 
                                className="flex items-center justify-between py-2 cursor-pointer"
                                onClick={() => setExpandedMobileCategory(expandedMobileCategory === 'collections' ? null : 'collections')}
                            >
                                <span className="text-base uppercase tracking-wider font-heading text-[#1F2937] font-medium">Collections</span>
                                <ChevronDown size={18} className={`transition-transform duration-200 ${expandedMobileCategory === 'collections' ? 'rotate-180 text-[#C2255C]' : 'text-[#4B5563]'}`} />
                            </div>

                            {expandedMobileCategory === 'collections' && (
                                <div className="grid grid-cols-2 gap-2 pt-2 pl-3">
                                    {headerAttributes.product_type.map((pt) => {
                                        const imgUrl = ATTRIBUTE_THUMBNAILS[pt.value];
                                        return (
                                            <Link
                                                key={pt.value}
                                                to={`/shop?product_type=${pt.value}`}
                                                onClick={() => setIsMenuOpen(false)}
                                                className="text-xs text-[#4B5563] hover:text-[#C2255C] py-1.5 flex items-center gap-2"
                                            >
                                                <div className="w-6 h-6 rounded overflow-hidden border border-[#E5E7EB] flex-shrink-0 bg-[#F7F9FC]">
                                                    {imgUrl ? (
                                                        <img src={imgUrl} alt={pt.label} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-[#F7F9FC] flex items-center justify-center text-[#4B5563] text-[9px] font-bold">
                                                            {pt.label?.slice(0, 2)}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="truncate">{pt.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 3. By Region Accordion */}
                        <div className="border-b border-[#E5E7EB] pb-2">
                            <div 
                                className="flex items-center justify-between py-2 cursor-pointer"
                                onClick={() => setExpandedMobileCategory(expandedMobileCategory === 'region' ? null : 'region')}
                            >
                                <span className="text-base uppercase tracking-wider font-heading text-[#1F2937] font-medium">By Region</span>
                                <ChevronDown size={18} className={`transition-transform duration-200 ${expandedMobileCategory === 'region' ? 'rotate-180 text-[#C2255C]' : 'text-[#4B5563]'}`} />
                            </div>

                            {expandedMobileCategory === 'region' && (
                                <div className="grid grid-cols-2 gap-2 pt-2 pl-3">
                                    {headerAttributes.region.map((reg) => {
                                        const imgUrl = ATTRIBUTE_THUMBNAILS[reg.value];
                                        return (
                                            <Link
                                                key={reg.value}
                                                to={`/shop?region=${reg.value}`}
                                                onClick={() => setIsMenuOpen(false)}
                                                className="text-xs text-[#4B5563] hover:text-[#C2255C] py-1.5 flex items-center gap-2"
                                            >
                                                <div className="w-6 h-6 rounded overflow-hidden border border-[#E5E7EB] flex-shrink-0 bg-[#F7F9FC]">
                                                    {imgUrl ? (
                                                        <img src={imgUrl} alt={reg.label} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-[#F7F9FC] flex items-center justify-center text-[#4B5563] text-[9px] font-bold">
                                                            {reg.label?.slice(0, 2)}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="truncate">{reg.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 4. New Arrivals */}
                        <Link 
                            to="/shop?filter=new" 
                            className="block text-base uppercase tracking-wider font-heading py-2 border-b border-[#E5E7EB] text-[#1F2937] font-medium" 
                            onClick={() => setIsMenuOpen(false)}
                        >
                            New Arrivals
                        </Link>

                        {/* 5. Festive */}
                        <Link 
                            to="/shop?style=festive-wear" 
                            className="block text-base uppercase tracking-wider font-heading py-2 border-b border-[#E5E7EB] text-[#1F2937] font-medium" 
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Festive
                        </Link>

                        {/* 6. Fabrics Accordion */}
                        <div className="border-b border-[#E5E7EB] pb-2">
                            <div 
                                className="flex items-center justify-between py-2 cursor-pointer"
                                onClick={() => setExpandedMobileCategory(expandedMobileCategory === 'fabrics' ? null : 'fabrics')}
                            >
                                <span className="text-base uppercase tracking-wider font-heading text-[#1F2937] font-medium">Fabrics</span>
                                <ChevronDown size={18} className={`transition-transform duration-200 ${expandedMobileCategory === 'fabrics' ? 'rotate-180 text-[#C2255C]' : 'text-[#4B5563]'}`} />
                            </div>

                            {expandedMobileCategory === 'fabrics' && (
                                <div className="grid grid-cols-2 gap-2 pt-2 pl-3">
                                    {headerAttributes.fabric.map((fab) => {
                                        const imgUrl = ATTRIBUTE_THUMBNAILS[fab.value];
                                        return (
                                            <Link
                                                key={fab.value}
                                                to={`/shop?fabric=${fab.value}`}
                                                onClick={() => setIsMenuOpen(false)}
                                                className="text-xs text-[#4B5563] hover:text-[#C2255C] py-1.5 flex items-center gap-2"
                                            >
                                                <div className="w-6 h-6 rounded overflow-hidden border border-[#E5E7EB] flex-shrink-0 bg-[#F7F9FC]">
                                                    {imgUrl ? (
                                                        <img src={imgUrl} alt={fab.label} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-[#F7F9FC] flex items-center justify-center text-[#4B5563] text-[9px] font-bold">
                                                            {fab.label?.slice(0, 2)}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="truncate">{fab.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 7. About Us */}
                        <Link 
                            to="/about" 
                            className="block text-base uppercase tracking-wider font-heading py-2 border-b border-[#E5E7EB] text-[#1F2937] font-medium" 
                            onClick={() => setIsMenuOpen(false)}
                        >
                            About Us
                        </Link>

                        {/* Admin Dashboard if Admin */}
                        {isAdmin && (
                            <Link 
                                to="/admin" 
                                className="block text-base uppercase tracking-wider font-heading py-2 text-[#C2255C] border-b border-[#E5E7EB] font-semibold"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Admin Dashboard
                            </Link>
                        )}

                        {/* 8. Contact at the bottom */}
                        <Link 
                            to="/contact" 
                            className="block text-base uppercase tracking-wider font-heading py-2 text-[#1F2937] font-medium" 
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Contact
                        </Link>
                    </nav>
                </div>
            </div>
        </div>
    );
};
