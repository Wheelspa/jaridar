import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Menu, X } from 'lucide-react';
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

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { user, isAuthenticated, logout } = useAuth();
    const { cartCount } = useCart();
    const { wishlistCount } = useWishlist();
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };

    const categories = [
        { name: 'Ethnic Wear', path: '/shop?category=ethnic' },
        { name: 'Traditional', path: '/shop?category=traditional' },
        { name: 'Western', path: '/shop?category=western' },
        { name: 'Bridal', path: '/shop?category=bridal' },
    ];

    return (
        <header className="header-glass sticky top-0 z-50 border-b border-gray-100" data-testid="header">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                {/* Top bar */}
                <div className="hidden md:flex justify-between items-center py-2 text-xs text-gray-500 border-b border-gray-100">
                    <span>Free shipping on orders above ₹2999</span>
                    <div className="flex gap-4">
                        <Link to="/about" className="hover:text-rose">About Us</Link>
                        <Link to="/contact" className="hover:text-rose">Contact</Link>
                    </div>
                </div>

                {/* Main header */}
                <div className="flex items-center justify-between py-4">
                    {/* Mobile menu button */}
                    <button 
                        className="md:hidden p-2"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        data-testid="mobile-menu-btn"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2" data-testid="logo">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose to-serenity flex items-center justify-center">
                            <span className="font-heading text-xl text-white font-semibold">J</span>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="font-heading text-xl md:text-2xl text-charcoal tracking-tight">JARIDAR</h1>
                            <p className="text-[10px] text-serenity-dark uppercase tracking-[0.2em]">Fashion Couture</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {categories.map((cat) => (
                            <Link 
                                key={cat.name} 
                                to={cat.path}
                                className="nav-link text-sm uppercase tracking-wider text-charcoal font-medium"
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Right actions */}
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="hidden md:flex items-center">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="w-40 lg:w-48 pl-4 pr-10 py-2 text-sm bg-gray-50 rounded-full border-0 focus:ring-1 focus:ring-rose outline-none"
                                    data-testid="search-input"
                                />
                                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose">
                                    <Search size={18} />
                                </button>
                            </div>
                        </form>

                        {/* User */}
                        {isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-2 hover:text-rose" data-testid="user-menu-btn">
                                        <User size={22} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <div className="px-3 py-2 text-sm">
                                        <p className="font-medium">{user?.name}</p>
                                        <p className="text-gray-500 text-xs">{user?.email}</p>
                                    </div>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link to="/account/orders">My Orders</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/account/wishlist">Wishlist</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/account/profile">Profile</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="text-red-600">
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link to="/login" className="p-2 hover:text-rose" data-testid="login-btn">
                                <User size={22} />
                            </Link>
                        )}

                        {/* Wishlist */}
                        <Link to="/account/wishlist" className="p-2 hover:text-rose relative" data-testid="wishlist-btn">
                            <Heart size={22} />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose text-white text-xs rounded-full flex items-center justify-center">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>

                        {/* Cart */}
                        <Link to="/cart" className="p-2 hover:text-rose relative" data-testid="cart-btn">
                            <ShoppingBag size={22} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose text-white text-xs rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
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

                    <form onSubmit={handleSearch} className="mb-8">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products..."
                                className="w-full pl-4 pr-10 py-3 bg-gray-50 rounded-full border-0"
                            />
                            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Search size={20} />
                            </button>
                        </div>
                    </form>

                    <nav className="space-y-4">
                        {categories.map((cat) => (
                            <Link 
                                key={cat.name}
                                to={cat.path}
                                className="block text-lg font-heading py-2 border-b border-gray-100"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {cat.name}
                            </Link>
                        ))}
                        <Link to="/about" className="block py-2" onClick={() => setIsMenuOpen(false)}>About Us</Link>
                        <Link to="/contact" className="block py-2" onClick={() => setIsMenuOpen(false)}>Contact</Link>
                    </nav>
                </div>
            </div>
        </header>
    );
};
