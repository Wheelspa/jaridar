import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import { formatAttributeLabel } from '../../lib/utils';

export const ProductCard = ({ product }) => {
    const { isAuthenticated } = useAuth();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { addToCart } = useCart();
    
    const inWishlist = isInWishlist(product.id);
    const discount = product.original_price 
        ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
        : 0;

    const handleWishlist = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!isAuthenticated) {
            toast.error('Please login to add items to wishlist');
            return;
        }

        try {
            if (inWishlist) {
                await removeFromWishlist(product.id);
                toast.success('Removed from wishlist');
            } else {
                await addToWishlist(product.id);
                toast.success('Added to wishlist');
            }
        } catch (error) {
            toast.error('Something went wrong');
        }
    };

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.error('Please login to add items to cart');
            return;
        }

        try {
            await addToCart(
                product.id,
                1,
                product.sizes?.[0] || 'M',
                product.colors?.[0] || 'Default'
            );
            toast.success(`${product.name} added to bag!`);
        } catch (error) {
            toast.error('Failed to add item to bag');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);
    };

    return (
        <div className="bg-white rounded-sm border border-[#E5E7EB] hover:border-[#C2255C] hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full group overflow-hidden" data-testid={`product-card-${product.id}`}>
            <Link to={`/product/${product.id}`} className="block flex-1">
                {/* Edge-to-edge Image at top */}
                <div className="relative aspect-[3/4] overflow-hidden bg-white">
                    <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                    />
                    
                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        {product.is_new && (
                            <span className="bg-[#3B6FA0] text-white text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm">New</span>
                        )}
                        {discount > 0 && (
                            <span className="bg-[#C2255C] text-white text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm">{discount}% Off</span>
                        )}
                    </div>

                    {/* Wishlist Heart Top-Right */}
                    <button 
                        onClick={handleWishlist}
                        className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${
                            inWishlist ? 'bg-[#C2255C] text-white' : 'bg-white/90 text-[#1F2937] hover:bg-[#C2255C] hover:text-white'
                        }`}
                        aria-label="Wishlist"
                        data-testid={`wishlist-btn-${product.id}`}
                    >
                        <Heart size={15} fill={inWishlist ? 'currentColor' : 'none'} />
                    </button>
                </div>

                {/* Padded Area Below Image */}
                <div className="p-3 space-y-1">
                    {/* Category */}
                    <p className="text-xs uppercase tracking-widest text-[#4B5563] font-medium">
                        {formatAttributeLabel(product.category)}
                    </p>
                    
                    {/* Name */}
                    <h3 className="font-heading text-sm md:text-base text-[#1F2937] font-medium line-clamp-1 group-hover:text-[#C2255C] transition-colors">
                        {product.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center gap-2 pt-1">
                        <span className="font-bold text-base text-[#1F2937]">{formatPrice(product.price)}</span>
                        {product.original_price && (
                            <span className="text-sm text-[#9CA3AF] line-through font-normal">{formatPrice(product.original_price)}</span>
                        )}
                    </div>
                </div>
            </Link>

            {/* Full-width outlined ADD TO BAG button */}
            <div className="px-3 pb-3">
                <button
                    onClick={handleAddToCart}
                    className="w-full h-9 bg-transparent border border-[#C2255C] text-[#C2255C] hover:bg-[#C2255C] hover:text-white text-sm font-semibold uppercase tracking-wide rounded-sm transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    data-testid={`add-to-cart-btn-${product.id}`}
                >
                    <ShoppingBag size={14} />
                    <span>Add to Bag</span>
                </button>
            </div>
        </div>
    );
};
