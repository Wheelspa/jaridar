import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';

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
            toast.success(`${product.name} added to cart!`);
        } catch (error) {
            toast.error('Failed to add item to cart');
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
        <div className="bg-white rounded-md p-3 border border-[#EADFD6] hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full group" data-testid={`product-card-${product.id}`}>
            <Link to={`/product/${product.id}`} className="block flex-1">
                <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-[#FAF0EA] mb-3">
                    <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                    />
                    
                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        {product.is_new && (
                            <span className="bg-charcoal text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm">New</span>
                        )}
                        {discount > 0 && (
                            <span className="bg-rose text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm">{discount}% Off</span>
                        )}
                    </div>

                    {/* Wishlist Heart Top-Right */}
                    <button 
                        onClick={handleWishlist}
                        className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${
                            inWishlist ? 'bg-rose text-white' : 'bg-white/90 text-charcoal hover:bg-rose hover:text-white'
                        }`}
                        aria-label="Wishlist"
                        data-testid={`wishlist-btn-${product.id}`}
                    >
                        <Heart size={15} fill={inWishlist ? 'currentColor' : 'none'} />
                    </button>
                </div>

                <div className="space-y-1">
                    {/* Category */}
                    <p className="text-[10px] uppercase tracking-widest text-[#6B5B55] font-medium">
                        {product.category}
                    </p>
                    
                    {/* Name */}
                    <h3 className="font-heading text-sm text-charcoal font-medium line-clamp-1 group-hover:text-rose transition-colors">
                        {product.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center gap-2 pt-1">
                        <span className="font-semibold text-xs md:text-sm text-charcoal">{formatPrice(product.price)}</span>
                        {product.original_price && (
                            <span className="text-xs text-[#6B5B55] line-through font-normal">{formatPrice(product.original_price)}</span>
                        )}
                    </div>
                </div>
            </Link>

            {/* Full-width small ADD TO CART button */}
            <button
                onClick={handleAddToCart}
                className="w-full mt-3 py-2 bg-rose hover:bg-rose-dark text-white text-[11px] font-semibold uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                data-testid={`add-to-cart-btn-${product.id}`}
            >
                <ShoppingBag size={14} />
                <span>Add to Cart</span>
            </button>
        </div>
    );
};
