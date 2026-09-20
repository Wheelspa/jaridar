import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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

const megaMenuData = [
    {
        id: 'ethnic',
        name: 'Ethnic Wear',
        path: '/shop?category=ethnic',
        subcategories: [
            { name: 'Sarees', path: '/shop?category=ethnic&subcategory=Sarees', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300' },
            { name: 'Salwar Suits', path: '/shop?category=ethnic&subcategory=Salwar%20Suits', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300' },
            { name: 'Anarkalis', path: '/shop?category=ethnic&subcategory=Anarkalis', image: 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=300' },
            { name: 'Kurtis', path: '/shop?category=ethnic&subcategory=Kurtis', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=300' },
        ]
    },
    {
        id: 'traditional',
        name: 'Traditional',
        path: '/shop?category=traditional',
        subcategories: [
            { name: 'Sarees', path: '/shop?category=traditional&subcategory=Sarees', image: 'https://images.unsplash.com/photo-1763971922538-5802acdd48b8?w=300' },
            { name: 'Lehengas', path: '/shop?category=traditional&subcategory=Lehengas', image: 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=300' },
            { name: 'Dupattas', path: '/shop?category=traditional&subcategory=Dupattas', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300' },
        ]
    },
    {
        id: 'western',
        name: 'Western',
        path: '/shop?category=western',
        subcategories: [
            { name: 'Dresses', path: '/shop?category=western&subcategory=Dresses', image: 'https://images.unsplash.com/photo-1612364557094-98a4b47200f6?w=300' },
            { name: 'Tops', path: '/shop?category=western&subcategory=Tops', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300' },
            { name: 'Jumpsuits', path: '/shop?category=western&subcategory=Jumpsuits', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300' },
            { name: 'Co-ord Sets', path: '/shop?category=western&subcategory=Co-ord%20Sets', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300' },
        ]
    },
    {
        id: 'bridal',
        name: 'Bridal',
        path: '/shop?category=bridal',
        subcategories: [
            { name: 'Bridal Lehengas', path: '/shop?category=bridal&subcategory=Bridal%20Lehengas', image: 'https://images.unsplash.com/photo-1759906766380-7a5849e6fb13?w=300' },
            { name: 'Wedding Sarees', path: '/shop?category=bridal&subcategory=Wedding%20Sarees', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300' },
            { name: 'Reception Gowns', path: '/shop?category=bridal&subcategory=Reception%20Gowns', image: 'https://images.unsplash.com/photo-1519657337289-077653f724ed?w=300' },
        ]
    }
];

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
    const [expandedMobileCategory, setExpandedMobileCategory] = useState(null);

    const { user, isAuthenticated, logout, isAdmin } = useAuth();
    const { cartCount } = useCart();
    const { wishlistCount } = useWishlist();
    const navigate = useNavigate();
    const location = useLocation();

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
            <div className="bg-rose-50/80 border-b border-rose-100/60 py-2 px-4 text-center">
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-rose">
                    FREE SHIPPING ON ORDERS ABOVE ₹2999 <span className="text-rose inline-block ml-1">♥</span>
                </p>
            </div>

            {/* Main Sticky Header */}
            <header className="sticky top-0 z-50 bg-[#FFFBF7]/95 backdrop-blur-md border-b border-[#EADFD6]" data-testid="header">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 h-[72px] flex items-center justify-between">
                    {/* Left: Mobile menu toggle + Logo */}
                    <div className="flex items-center gap-4">
                        <button 
                            className="md:hidden p-2 text-charcoal hover:text-rose transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            data-testid="mobile-menu-btn"
                            aria-label="Toggle Menu"
                        >
                            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>

                        <Link to="/" className="flex items-center gap-2.5" data-testid="logo">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose via-rose-dark to-gold flex items-center justify-center shadow-sm">
                                <span className="font-heading text-lg text-white font-semibold">J</span>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="font-heading text-xl md:text-2xl text-charcoal tracking-tight font-bold leading-none">JARIDAR</h1>
                                <span className="text-[9px] text-[#8E6F2C] uppercase tracking-[0.25em] font-medium pt-0.5">Couture</span>
                            </div>
                        </Link>
                    </div>

                    {/* Center: Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8 h-full">
                        <Link 
                            to="/" 
                            className={`text-xs uppercase tracking-[0.18em] font-medium h-full flex items-center border-b-2 transition-colors ${
                                location.pathname === '/' ? 'text-rose border-rose font-semibold' : 'text-charcoal border-transparent hover:text-rose'
                            }`}
                        >
                            HOME
                        </Link>

                        <Link 
                            to="/shop" 
                            className={`text-xs uppercase tracking-[0.18em] font-medium h-full flex items-center border-b-2 transition-colors ${
                                location.pathname === '/shop' && !location.search ? 'text-rose border-rose font-semibold' : 'text-charcoal border-transparent hover:text-rose'
                            }`}
                        >
                            SHOP
                        </Link>

                        {/* COLLECTIONS Mega Menu Trigger */}
                        <div 
                            className="relative h-full flex items-center"
                            onMouseEnter={() => setIsCollectionsOpen(true)}
                            onMouseLeave={() => setIsCollectionsOpen(false)}
                        >
                            <Link 
                                to="/shop" 
                                className={`text-xs uppercase tracking-[0.18em] font-medium h-full flex items-center gap-1 border-b-2 transition-colors ${
                                    isCollectionsOpen || location.search.includes('category=') ? 'text-rose border-rose font-semibold' : 'text-charcoal border-transparent hover:text-rose'
                                }`}
                            >
                                COLLECTIONS
                                <ChevronDown size={14} className={`transition-transform duration-200 ${isCollectionsOpen ? 'rotate-180 text-rose' : 'text-[#6B5B55]'}`} />
                            </Link>

                            {/* Dropdown Mega Panel */}
                            {isCollectionsOpen && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[840px] bg-white rounded-2xl shadow-2xl border border-[#F6E4E6] p-8 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-4 gap-6">
                                        {megaMenuData.map((cat) => (
                                            <div key={cat.id} className="space-y-3">
                                                <Link 
                                                    to={cat.path} 
                                                    onClick={() => setIsCollectionsOpen(false)}
                                                    className="font-heading text-base font-semibold text-charcoal hover:text-rose border-b border-[#EADFD6] pb-2 flex items-center justify-between"
                                                >
                                                    <span>{cat.name}</span>
                                                    <span className="text-xs text-rose">→</span>
                                                </Link>
                                                <div className="space-y-2">
                                                    {cat.subcategories.map((sub) => (
                                                        <Link
                                                            key={sub.name}
                                                            to={sub.path}
                                                            onClick={() => setIsCollectionsOpen(false)}
                                                            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-[#F6E4E6]/50 transition-all group/item"
                                                        >
                                                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[#EADFD6] bg-[#FAF0EA]">
                                                                <img 
                                                                    src={sub.image} 
                                                                    alt={sub.name} 
                                                                    className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                                                                />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-medium text-charcoal group-hover/item:text-rose transition-colors">{sub.name}</h4>
                                                                <span className="text-[10px] text-[#6B5B55] font-normal">Explore</span>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Link 
                            to="/about" 
                            className={`text-xs uppercase tracking-[0.18em] font-medium h-full flex items-center border-b-2 transition-colors ${
                                location.pathname === '/about' ? 'text-rose border-rose font-semibold' : 'text-charcoal border-transparent hover:text-rose'
                            }`}
                        >
                            ABOUT US
                        </Link>

                        <Link 
                            to="/contact" 
                            className={`text-xs uppercase tracking-[0.18em] font-medium h-full flex items-center border-b-2 transition-colors ${
                                location.pathname === '/contact' ? 'text-rose border-rose font-semibold' : 'text-charcoal border-transparent hover:text-rose'
                            }`}
                        >
                            CONTACT
                        </Link>
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Search Button & Expandable Overlay */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsSearchOpen(!isSearchOpen)} 
                                className="p-2 text-charcoal hover:text-rose transition-colors rounded-full hover:bg-[#F6E4E6]/50"
                                aria-label="Toggle Search"
                                data-testid="search-toggle-btn"
                            >
                                <Search size={20} />
                            </button>

                            {isSearchOpen && (
                                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white p-3 rounded-2xl shadow-xl border border-[#EADFD6] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search sarees, lehengas..."
                                            className="w-full px-4 py-2 text-xs bg-[#FAF0EA] rounded-xl border border-[#EADFD6] focus:outline-none focus:border-rose text-charcoal"
                                            autoFocus
                                            data-testid="search-input"
                                        />
                                        <button 
                                            type="submit" 
                                            className="px-3.5 py-2 bg-rose text-white text-xs font-medium rounded-xl hover:bg-rose-dark transition-colors flex-shrink-0"
                                        >
                                            Search
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* User */}
                        {isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-2 text-charcoal hover:text-rose transition-colors rounded-full hover:bg-[#F6E4E6]/50" data-testid="user-menu-btn">
                                        <User size={20} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white border border-[#EADFD6]">
                                    <div className="px-3 py-2 text-sm">
                                        <p className="font-medium text-charcoal">{user?.name}</p>
                                        <p className="text-[#6B5B55] text-xs">{user?.email}</p>
                                    </div>
                                    <DropdownMenuSeparator className="bg-[#EADFD6]" />
                                    {isAdmin && (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link to="/admin" className="font-semibold text-rose" data-testid="admin-dashboard-link">Admin Dashboard</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-[#EADFD6]" />
                                        </>
                                    )}
                                    <DropdownMenuItem asChild>
                                        <Link to="/account/orders" className="text-charcoal hover:text-rose">My Orders</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/account/wishlist" className="text-charcoal hover:text-rose">Wishlist</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/account/profile" className="text-charcoal hover:text-rose">Profile</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-[#EADFD6]" />
                                    <DropdownMenuItem onClick={logout} className="text-rose font-medium">
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link to="/login" className="p-2 text-charcoal hover:text-rose transition-colors rounded-full hover:bg-[#F6E4E6]/50" data-testid="login-btn">
                                <User size={20} />
                            </Link>
                        )}

                        {/* Wishlist */}
                        <Link to="/account/wishlist" className="p-2 text-charcoal hover:text-rose transition-colors rounded-full hover:bg-[#F6E4E6]/50 relative" data-testid="wishlist-btn">
                            <Heart size={20} />
                            {wishlistCount > 0 && (
                                <span className="absolute top-0 right-0 w-4 h-4 bg-rose text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>

                        {/* Cart */}
                        <Link to="/cart" className="p-2 text-charcoal hover:text-rose transition-colors rounded-full hover:bg-[#F6E4E6]/50 relative" data-testid="cart-btn">
                            <ShoppingBag size={20} />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 w-4 h-4 bg-rose text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-8">
                        <Link to="/" onClick={() => setIsMenuOpen(false)}>
                            <h1 className="font-heading text-2xl text-charcoal">JARIDAR</h1>
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
                                className="w-full pl-4 pr-10 py-3 bg-[#FAF0EA] rounded-full border border-[#EADFD6] text-sm text-charcoal"
                            />
                            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B5B55] hover:text-rose">
                                <Search size={20} />
                            </button>
                        </div>
                    </form>

                    <nav className="space-y-3">
                        <Link 
                            to="/" 
                            className="block text-base uppercase tracking-wider font-heading py-2 border-b border-[#EADFD6] text-charcoal" 
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Home
                        </Link>
                        
                        <Link 
                            to="/shop" 
                            className="block text-base uppercase tracking-wider font-heading py-2 border-b border-[#EADFD6] text-charcoal" 
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Shop All
                        </Link>

                        {/* Collections Accordion */}
                        <div className="border-b border-[#EADFD6] pb-2">
                            <div 
                                className="flex items-center justify-between py-2 cursor-pointer"
                                onClick={() => setExpandedMobileCategory(expandedMobileCategory === 'collections' ? null : 'collections')}
                            >
                                <span className="text-base uppercase tracking-wider font-heading text-charcoal">Collections</span>
                                <ChevronDown size={18} className={`transition-transform duration-200 ${expandedMobileCategory === 'collections' ? 'rotate-180 text-rose' : 'text-[#6B5B55]'}`} />
                            </div>

                            {expandedMobileCategory === 'collections' && (
                                <div className="space-y-3 pt-2 pl-3">
                                    {megaMenuData.map((cat) => (
                                        <div key={cat.id} className="space-y-1">
                                            <Link 
                                                to={cat.path}
                                                className="text-sm font-medium text-rose block"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                {cat.name}
                                            </Link>
                                            <div className="grid grid-cols-2 gap-2 pt-1 pl-2">
                                                {cat.subcategories.map((sub) => (
                                                    <Link
                                                        key={sub.name}
                                                        to={sub.path}
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className="text-xs text-[#6B5B55] hover:text-rose py-1"
                                                    >
                                                        • {sub.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {isAdmin && (
                            <Link 
                                to="/admin" 
                                className="block text-base uppercase tracking-wider font-heading py-2 text-rose border-b border-[#EADFD6]"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Admin Dashboard
                            </Link>
                        )}
                        <Link to="/about" className="block text-base uppercase tracking-wider font-heading py-2 border-b border-[#EADFD6] text-charcoal" onClick={() => setIsMenuOpen(false)}>About Us</Link>
                        <Link to="/contact" className="block text-base uppercase tracking-wider font-heading py-2 text-charcoal" onClick={() => setIsMenuOpen(false)}>Contact</Link>
                    </nav>
                </div>
            </div>
        </div>
    );
};
