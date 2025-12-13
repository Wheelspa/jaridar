import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { toast } from 'sonner';

export const ProductCard = ({ product }) => {
    const { isAuthenticated } = useAuth();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    
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

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);
    };

    return (
        <div className="product-card group" data-testid={`product-card-${product.id}`}>
            <Link to={`/product/${product.id}`}>
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
                    <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="product-card-image w-full h-full object-cover"
                        loading="lazy"
                    />
                    
                    {/* Badges */}
                    {product.is_new && (
                        <span className="badge-new">New</span>
                    )}
                    {discount > 0 && (
                        <span className="badge-sale">{discount}% Off</span>
                    )}

                    {/* Quick actions */}
                    <div className="quick-actions flex gap-2">
                        <button 
                            onClick={handleWishlist}
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                                inWishlist ? 'bg-rose text-white' : 'bg-white text-charcoal hover:bg-rose hover:text-white'
                            }`}
                            style={{ transition: 'background-color 0.2s, color 0.2s' }}
                            data-testid={`wishlist-btn-${product.id}`}
                        >
                            <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'} />
                        </button>
                        <Link 
                            to={`/product/${product.id}`}
                            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-charcoal hover:text-white"
                            style={{ transition: 'background-color 0.2s, color 0.2s' }}
                        >
                            <Eye size={18} />
                        </Link>
                    </div>
                </div>

                <div className="space-y-2">
                    {/* Category */}
                    <p className="text-xs uppercase tracking-wider text-gray-400">
                        {product.category}
                    </p>
                    
                    {/* Name */}
                    <h3 className="font-heading text-lg text-charcoal group-hover:text-rose" style={{ transition: 'color 0.2s' }}>
                        {product.name}
                    </h3>

                    {/* Rating */}
                    {product.rating > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className={i < Math.floor(product.rating) ? 'star-filled' : 'star-empty'}>
                                        ★
                                    </span>
                                ))}
                            </div>
                            <span className="text-xs text-gray-400">({product.review_count})</span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-charcoal">{formatPrice(product.price)}</span>
                        {product.original_price && (
                            <span className="price-original">{formatPrice(product.original_price)}</span>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
};
