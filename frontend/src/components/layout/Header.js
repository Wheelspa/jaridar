import { useState, useEffect, useRef } from 'react';
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
import { MENU_CONFIG } from '../../config/menuConfig';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_ANNOUNCEMENT = {
    enabled: true,
    messages: [
        { prefix: "BUY 1 GET ", highlight: "20% OFF", suffix: "" },
        { prefix: "BUY 2 GET EXTRA ", highlight: "₹500 OFF", suffix: "" },
        { prefix: "FREE SHIPPING ON ORDERS ABOVE ₹2999", highlight: "", suffix: "" }
    ]
};

// Under development notice configuration (marquee strip)
const DEV_MARQUEE_CONFIG = {
    enabled: true,
    message: "Our website is currently under development. Thank you for your support! For any help, call us: ",
    phone: "+91 91850 25980",
    tel: "+919185025980",
    separator: "✦"
};

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [expandedMobileCategory, setExpandedMobileCategory] = useState(null);
    const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
    const [announcement, setAnnouncement] = useState(DEFAULT_ANNOUNCEMENT);

    const timeoutRef = useRef(null);

    const { user, isAuthenticated, logout, isAdmin } = useAuth();
    const { cartCount } = useCart();
    const { wishlistCount } = useWishlist();
    const navigate = useNavigate();
    const location = useLocation();

    // Hover delay handling (180ms delay to prevent flicker)
    const handleMouseEnter = (menuId) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setActiveDropdown(menuId);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setActiveDropdown(null);
        }, 180);
    };

    // Close on ESC key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setActiveDropdown(null);
                setIsSearchOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Close dropdown on route change
    useEffect(() => {
        setActiveDropdown(null);
        setIsMenuOpen(false);
    }, [location.pathname, location.search]);

    // Fetch dynamic site content for announcement bar
    useEffect(() => {
        const fetchSiteContent = async () => {
            try {
                const res = await axios.get(`${API}/site-content`);
                if (res.data?.announcement) {
                    setAnnouncement(res.data.announcement);
                }
            } catch (err) {
                console.error('Failed to fetch site content in header:', err);
            }
        };
        fetchSiteContent();
    }, []);

    const announcementMessages = (announcement?.messages && announcement.messages.length > 0)
        ? announcement.messages
        : DEFAULT_ANNOUNCEMENT.messages;

    useEffect(() => {
        if (!announcementMessages.length) return;
        const timer = setInterval(() => {
            setCurrentMsgIndex((prev) => (prev + 1) % announcementMessages.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [announcementMessages.length]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
            setIsSearchOpen(false);
        }
    };

    const currentMsg = announcementMessages[currentMsgIndex % announcementMessages.length] || announcementMessages[0];

    // Determine whether a main menu item is currently active based on pathname / search params
    const isMenuItemActive = (item) => {
        if (activeDropdown === item.id) return true;
        if (item.id === 'home') return location.pathname === '/' && !location.search;
        if (item.id === 'about-us') return location.pathname === '/about';
        if (item.id === 'contact') return location.pathname === '/contact';
        if (item.id === 'new-arrivals') {
            return location.pathname === '/shop' && location.search.includes('filter=new');
        }
        if (item.id === 'by-region') {
            return location.pathname === '/shop' && location.search.includes('region=');
        }
        if (item.id === 'fabrics') {
            return location.pathname === '/shop' && location.search.includes('fabric=');
        }
        if (item.id === 'shop-by-occasion') {
            return location.pathname === '/shop' && location.search.includes('occasion=');
        }
        if (item.id === 'collections') {
            return location.pathname === '/shop' && (
                location.search.includes('category=') ||
                location.search.includes('product_type=') ||
                location.search.includes('style=')
            );
        }
        return false;
    };

    const activeMenu = MENU_CONFIG.find(m => m.id === activeDropdown && m.hasDropdown);

    return (
        <div className="w-full">
            {/* Announcement Bar */}
            {announcement?.enabled !== false && announcementMessages.length > 0 && (
                <div className="bg-[#C2255C] h-[42px] flex items-center justify-center" data-testid="announcement-bar">
                    <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px] text-center">
                        {/* Desktop: all three centered in one line separated by | */}
                        <div className="hidden md:flex items-center justify-center gap-4 text-sm uppercase tracking-wide">
                            {announcementMessages.map((msg, idx) => (
                                <span key={idx} className="flex items-center gap-4">
                                    {idx > 0 && <span className="text-white/40 font-normal">|</span>}
                                    <span>
                                        <span className="font-medium text-white">{msg.prefix || ''}</span>
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
                                    <span className="font-medium text-white">{currentMsg.prefix || ''}</span>
                                    {currentMsg.highlight && (
                                        <span className="font-bold text-[#F3D9A0]">{currentMsg.highlight}</span>
                                    )}
                                    {currentMsg.suffix && (
                                        <span className="font-medium text-white">{currentMsg.suffix}</span>
                                    )}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            )}

            {/* Development Marquee Strip */}
            {DEV_MARQUEE_CONFIG.enabled && (
                <div 
                    className="jaridar-marquee-container bg-[#FAF5F0] border-b border-[#EAE4D9] text-[#831843] h-[36px] flex items-center select-none"
                    data-testid="dev-marquee-strip"
                >
                    <div className="jaridar-marquee-track flex items-center">
                        {[0, 1].map((copyIndex) => (
                            <div key={copyIndex} className="flex items-center flex-shrink-0">
                                {[0, 1, 2, 3].map((itemIndex) => (
                                    <span key={itemIndex} className="inline-flex items-center mx-4 sm:mx-6 text-xs font-medium tracking-wide">
                                        <span>{DEV_MARQUEE_CONFIG.message}</span>
                                        <a
                                            href={`tel:${DEV_MARQUEE_CONFIG.tel}`}
                                            className="font-bold underline decoration-current underline-offset-2 hover:opacity-80 transition-opacity ml-1"
                                        >
                                            {DEV_MARQUEE_CONFIG.phone}
                                        </a>
                                        <span className="text-[#831843]/35 ml-4 sm:ml-6" aria-hidden="true">
                                            {DEV_MARQUEE_CONFIG.separator}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Sticky Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] w-full relative" data-testid="header">
                <div className="w-full max-w-full px-4 sm:px-6 xl:px-6 min-[1366px]:px-8 min-[1536px]:px-9 min-[1700px]:px-11 min-[1800px]:px-[65px] h-[72px] xl:h-[95px] flex items-center justify-between">
                    
                    {/* Left: Mobile Toggle (below 1280px) + Logo */}
                    <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 mr-4 xl:mr-5 min-[1536px]:mr-6 min-[1700px]:mr-8 min-[1800px]:mr-10">
                        {/* Mobile Toggle below 1280px (xl) */}
                        <button 
                            className="xl:hidden p-1.5 text-[#1F2937] hover:text-[#C2255C] transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            data-testid="mobile-menu-btn"
                            aria-label="Toggle Menu"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        <Link to="/" className="flex items-center gap-2 xl:gap-2.5 min-[1700px]:gap-3 flex-shrink-0" data-testid="logo">
                            <img 
                                src="/images/logo/jaridar-icon.png" 
                                alt="Jaridar Icon" 
                                className="h-10 sm:h-12 xl:h-[48px] min-[1366px]:h-[52px] min-[1536px]:h-[58px] min-[1700px]:h-[66px] min-[1800px]:h-[72px] w-auto object-contain flex-shrink-0" 
                            />
                            <div className="flex flex-col justify-center">
                                <span className="font-heading text-lg sm:text-xl xl:text-[21px] min-[1366px]:text-[22px] min-[1536px]:text-[24px] min-[1700px]:text-[26px] min-[1800px]:text-[28px] font-black text-[#C2255C] tracking-tight leading-none">
                                    JARIDAR
                                </span>
                                <span className="text-[9px] sm:text-[10px] xl:text-[9.5px] min-[1366px]:text-[10px] min-[1536px]:text-[11px] min-[1700px]:text-[11.5px] min-[1800px]:text-[12px] font-bold text-[#3B6FA0] uppercase tracking-[0.2em] xl:tracking-[0.21em] min-[1536px]:tracking-[0.22em] min-[1800px]:tracking-[0.22em] pt-0.5 leading-tight">
                                    Fashion Couture
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Middle: Desktop Navigation (flex-1, min-w-0, left-aligned, no wrapping, min 24px gap to icons via mr-6) */}
                    <nav 
                        className="hidden xl:flex flex-1 min-w-0 items-center justify-start h-full whitespace-nowrap mr-6"
                        role="navigation"
                        aria-label="Main Navigation"
                        style={{
                            gap: 'clamp(12px, 2.34vw - 18px, 27px)',
                            '--nav-font-size': 'clamp(12.5px, 0.8vw + 2.4px, 17px)',
                            '--nav-icon-size': 'clamp(12.5px, 0.8vw + 2.4px, 17px)'
                        }}
                    >
                        {MENU_CONFIG.map((item) => {
                            const isActive = isMenuItemActive(item);
                            const isDropdownOpen = activeDropdown === item.id;

                            return (
                                <div
                                    key={item.id}
                                    className="relative h-full flex items-center flex-shrink-0"
                                    onMouseEnter={item.hasDropdown ? () => handleMouseEnter(item.id) : undefined}
                                    onMouseLeave={item.hasDropdown ? handleMouseLeave : undefined}
                                >
                                    <Link 
                                        to={item.url} 
                                        onClick={() => setActiveDropdown(null)}
                                        onFocus={() => item.hasDropdown ? handleMouseEnter(item.id) : setActiveDropdown(null)}
                                        aria-expanded={item.hasDropdown ? isDropdownOpen : undefined}
                                        aria-haspopup={item.hasDropdown ? "true" : undefined}
                                        className={`uppercase tracking-[0.02em] font-bold h-full flex items-center border-b-2 transition-colors whitespace-nowrap ${
                                            item.hasDropdown ? 'gap-1 min-[1536px]:gap-1.5' : ''
                                        } ${
                                            isActive ? 'text-[#C2255C] border-[#C2255C]' : 'text-[#1F2937] border-transparent hover:text-[#C2255C]'
                                        }`}
                                        style={{ fontSize: 'var(--nav-font-size)' }}
                                    >
                                        <span>{item.label}</span>
                                        {item.hasDropdown && (
                                            <ChevronDown 
                                                size={17} 
                                                style={{ width: 'var(--nav-icon-size)', height: 'var(--nav-icon-size)' }}
                                                className={`transition-transform duration-200 shrink-0 inline-block align-middle ${
                                                    isDropdownOpen ? 'rotate-180 text-[#C2255C]' : 'text-[#6B7280]'
                                                }`} 
                                            />
                                        )}
                                    </Link>
                                </div>
                            );
                        })}
                    </nav>

                    {/* Right Unit: Icons at far right with equal spacing */}
                    <div className="flex items-center gap-2.5 xl:gap-3 min-[1536px]:gap-3.5 min-[1700px]:gap-4.5 min-[1800px]:gap-5 flex-shrink-0">
                        {/* 1. Search */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsSearchOpen(!isSearchOpen)} 
                                className="p-1.5 text-[#1F2937] hover:text-[#C2255C] transition-colors rounded-full hover:bg-[#E8F0F8] flex items-center justify-center"
                                aria-label="Toggle Search"
                                data-testid="search-toggle-btn"
                            >
                                <Search size={22} className="w-5 h-5 xl:w-[22px] xl:h-[22px] 2xl:w-6 2xl:h-6" />
                            </button>

                            {isSearchOpen && (
                                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white p-3 rounded-2xl shadow-xl border border-[#E5E7EB] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search sarees, lehengas..."
                                            className="w-full px-4 py-2 text-sm bg-white rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#C2255C] text-[#1F2937]"
                                            autoFocus
                                            data-testid="search-input"
                                        />
                                        <button 
                                            type="submit" 
                                            className="px-3.5 py-2 bg-[#C2255C] text-white text-xs font-semibold uppercase tracking-wide rounded-xl hover:bg-[#9C1D49] transition-colors flex-shrink-0"
                                        >
                                            Search
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* 2. Wishlist */}
                        <Link to="/account/wishlist" className="p-1.5 text-[#1F2937] hover:text-[#C2255C] transition-colors rounded-full hover:bg-[#E8F0F8] flex items-center justify-center relative" data-testid="wishlist-btn">
                            <Heart size={22} className="w-5 h-5 xl:w-[22px] xl:h-[22px] 2xl:w-6 2xl:h-6" />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[17px] min-h-[17px] xl:min-w-[18px] xl:min-h-[18px] bg-[#C2255C] text-white text-[10px] xl:text-[11px] font-bold rounded-full flex items-center justify-center p-0.5 leading-none">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>

                        {/* 3. Cart */}
                        <Link to="/cart" className="p-1.5 text-[#1F2937] hover:text-[#C2255C] transition-colors rounded-full hover:bg-[#E8F0F8] flex items-center justify-center relative" data-testid="cart-btn">
                            <ShoppingBag size={22} className="w-5 h-5 xl:w-[22px] xl:h-[22px] 2xl:w-6 2xl:h-6" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[17px] min-h-[17px] xl:min-w-[18px] xl:min-h-[18px] bg-[#C2255C] text-white text-[10px] xl:text-[11px] font-bold rounded-full flex items-center justify-center p-0.5 leading-none">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* 4. Account */}
                        {isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1.5 text-[#1F2937] hover:text-[#C2255C] transition-colors rounded-full hover:bg-[#E8F0F8] flex items-center justify-center" data-testid="user-menu-btn">
                                        <User size={22} className="w-5 h-5 xl:w-[22px] xl:h-[22px] 2xl:w-6 2xl:h-6" />
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
                            <Link to="/login" className="p-1.5 text-[#1F2937] hover:text-[#C2255C] transition-colors rounded-full hover:bg-[#E8F0F8] flex items-center justify-center" data-testid="login-btn">
                                <User size={22} className="w-5 h-5 xl:w-[22px] xl:h-[22px] 2xl:w-6 2xl:h-6" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Full-width white dropdown panel under header */}
                <AnimatePresence>
                    {activeMenu && activeMenu.hasDropdown && (
                        <motion.div
                            key={activeMenu.id}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.16, ease: "easeOut" }}
                            onMouseEnter={() => handleMouseEnter(activeMenu.id)}
                            onMouseLeave={handleMouseLeave}
                            className="hidden xl:block absolute top-full left-0 right-0 w-full bg-white border-b border-[#E5E7EB] shadow-[0_12px_24px_-4px_rgba(0,0,0,0.12)] z-50"
                            role="region"
                            aria-label={`${activeMenu.label} Submenu`}
                        >
                            <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 xl:px-12 py-7">
                                <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-[#E5E7EB]">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#C2255C]" />
                                        <h3 className="font-heading text-xs uppercase tracking-[0.2em] font-bold text-[#1F2937]">
                                            {activeMenu.label}
                                        </h3>
                                        <span className="text-xs text-[#6B7280]">
                                            ({activeMenu.items.length} items)
                                        </span>
                                    </div>
                                    <Link
                                        to={activeMenu.url}
                                        onClick={() => setActiveDropdown(null)}
                                        className="text-xs font-semibold text-[#C2255C] hover:underline flex items-center gap-1"
                                    >
                                        <span>View All {activeMenu.label}</span>
                                        <span>→</span>
                                    </Link>
                                </div>

                                <div
                                    className={`grid gap-x-8 gap-y-2.5 ${
                                        activeMenu.columns === 5
                                            ? 'grid-cols-5'
                                            : activeMenu.columns === 3
                                            ? 'grid-cols-3'
                                            : 'grid-cols-2'
                                    }`}
                                >
                                    {activeMenu.items.map((subItem, idx) => (
                                        <Link
                                            key={idx}
                                            to={subItem.url}
                                            onClick={() => setActiveDropdown(null)}
                                            className={`group py-1 px-2.5 rounded-md transition-colors text-xs xl:text-[13px] flex items-center justify-between ${
                                                subItem.highlight
                                                    ? 'text-[#C2255C] font-bold bg-[#FBF0EC]/60 hover:bg-[#FBF0EC]'
                                                    : 'text-[#374151] hover:text-[#C2255C] hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="truncate">{subItem.label}</span>
                                            <span className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity text-[#C2255C]">
                                                ›
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Mobile Drawer (used below 1280px) */}
            <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
                <div className="p-6 bg-white min-h-screen overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <Link to="/" onClick={() => setIsMenuOpen(false)}>
                            <h1 className="font-heading text-2xl text-[#1F2937] font-extrabold tracking-tight">JARIDAR</h1>
                        </Link>
                        <button 
                            onClick={() => setIsMenuOpen(false)} 
                            className="p-1 text-[#1F2937] hover:text-[#C2255C] transition-colors"
                            aria-label="Close Menu"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={(e) => { handleSearch(e); setIsMenuOpen(false); }} className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products, fabrics, styles..."
                                className="w-full pl-4 pr-10 py-2.5 bg-[#F9FAFB] rounded-full border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-none focus:border-[#C2255C]"
                            />
                            <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#C2255C]">
                                <Search size={18} />
                            </button>
                        </div>
                    </form>

                    <nav className="space-y-2 pb-10">
                        {MENU_CONFIG.map((menu) => {
                            if (!menu.hasDropdown) {
                                return (
                                    <Link
                                        key={menu.id}
                                        to={menu.url}
                                        className="block text-sm uppercase tracking-wider font-semibold py-3 border-b border-[#E5E7EB] text-[#1F2937] hover:text-[#C2255C] transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {menu.label}
                                    </Link>
                                );
                            }

                            const isExpanded = expandedMobileCategory === menu.id;

                            return (
                                <div key={menu.id} className="border-b border-[#E5E7EB] pb-2">
                                    <div
                                        className="flex items-center justify-between py-3 cursor-pointer select-none"
                                        onClick={() => setExpandedMobileCategory(isExpanded ? null : menu.id)}
                                    >
                                        <span className={`text-sm uppercase tracking-wider font-semibold transition-colors ${
                                            isExpanded ? 'text-[#C2255C]' : 'text-[#1F2937]'
                                        }`}>
                                            {menu.label}
                                        </span>
                                        <ChevronDown
                                            size={16}
                                            className={`transition-transform duration-200 ${
                                                isExpanded ? 'rotate-180 text-[#C2255C]' : 'text-[#6B7280]'
                                            }`}
                                        />
                                    </div>

                                    {isExpanded && (
                                        <div className="pt-1 pb-3 pl-2">
                                            {/* View all link */}
                                            <div className="mb-2 pb-1.5 border-b border-gray-100 flex items-center justify-between">
                                                <Link
                                                    to={menu.url}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="text-xs font-semibold text-[#C2255C] hover:underline"
                                                >
                                                    View All {menu.label} →
                                                </Link>
                                            </div>

                                            {/* Subitems: long lists scroll, fabrics in 2 columns */}
                                            <div
                                                className={`max-h-64 overflow-y-auto pr-1 ${
                                                    menu.id === 'fabrics'
                                                        ? 'grid grid-cols-2 gap-2'
                                                        : 'space-y-1'
                                                }`}
                                            >
                                                {menu.items.map((subItem, idx) => (
                                                    <Link
                                                        key={idx}
                                                        to={subItem.url}
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className={`text-xs py-1.5 px-2 rounded block transition-colors ${
                                                            subItem.highlight
                                                                ? 'text-[#C2255C] font-bold bg-[#FBF0EC]/60'
                                                                : 'text-[#4B5563] hover:text-[#C2255C] hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {subItem.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Admin Link if Admin */}
                        {isAdmin && (
                            <Link
                                to="/admin"
                                className="block text-sm uppercase tracking-wider font-semibold py-3 text-[#C2255C] border-b border-[#E5E7EB]"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Admin Dashboard
                            </Link>
                        )}
                    </nav>
                </div>
            </div>
        </div>
    );
};
