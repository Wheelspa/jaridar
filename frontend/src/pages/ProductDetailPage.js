import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Minus, Plus, Truck, RefreshCw, Shield, ChevronRight, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { StarRating } from '../components/common/StarRating';
import { ProductCard } from '../components/common/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const inWishlist = product ? isInWishlist(product.id) : false;

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const [productRes, reviewsRes] = await Promise.all([
                axios.get(`${API}/products/${id}`),
                axios.get(`${API}/reviews/${id}`)
            ]);
            
            setProduct(productRes.data);
            setReviews(reviewsRes.data);
            
            if (productRes.data.sizes?.length > 0) {
                setSelectedSize(productRes.data.sizes[0]);
            }
            if (productRes.data.colors?.length > 0) {
                setSelectedColor(productRes.data.colors[0]);
            }

            // Fetch related products
            const relatedRes = await axios.get(`${API}/products?category=${productRes.data.category}&limit=4`);
            setRelatedProducts(relatedRes.data.filter(p => p.id !== id));
        } catch (error) {
            console.error('Failed to fetch product:', error);
            toast.error('Product not found');
            navigate('/shop');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to add items to cart');
            navigate('/login');
            return;
        }

        if (!selectedSize) {
            toast.error('Please select a size');
            return;
        }

        try {
            await addToCart(product.id, quantity, selectedSize, selectedColor);
            toast.success('Added to cart!');
        } catch (error) {
            toast.error('Failed to add to cart');
        }
    };

    const handleWishlist = async () => {
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

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error('Please login to write a review');
            return;
        }

        setSubmittingReview(true);
        try {
            await axios.post(`${API}/reviews`, {
                product_id: id,
                rating: reviewRating,
                comment: reviewComment
            });
            toast.success('Review submitted!');
            setReviewComment('');
            setReviewRating(5);
            // Refresh reviews
            const reviewsRes = await axios.get(`${API}/reviews/${id}`);
            setReviews(reviewsRes.data);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
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
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-rose border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) return null;

    const discount = product.original_price 
        ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-pearl" data-testid="product-detail-page">
            {/* Breadcrumb */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
                    <div className="flex items-center text-sm text-gray-500">
                        <Link to="/" className="hover:text-rose">Home</Link>
                        <ChevronRight size={14} className="mx-2" />
                        <Link to="/shop" className="hover:text-rose">Shop</Link>
                        <ChevronRight size={14} className="mx-2" />
                        <Link to={`/shop?category=${product.category}`} className="hover:text-rose capitalize">
                            {product.category}
                        </Link>
                        <ChevronRight size={14} className="mx-2" />
                        <span className="text-charcoal truncate max-w-[200px]">{product.name}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Image Gallery */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="aspect-[3/4] bg-white mb-4 overflow-hidden">
                            <img 
                                src={product.images[activeImage]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                data-testid="product-main-image"
                            />
                        </div>
                        {product.images.length > 1 && (
                            <div className="flex gap-3">
                                {product.images.map((img, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setActiveImage(i)}
                                        className={`w-20 h-24 overflow-hidden border-2 ${activeImage === i ? 'border-rose' : 'border-transparent'}`}
                                    >
                                        <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Product Info */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:py-6"
                    >
                        {/* Category & Name */}
                        <p className="text-xs uppercase tracking-widest text-rose mb-2 font-semibold">{product.category}</p>
                        <h1 className="font-heading text-3xl md:text-4xl text-charcoal mb-4" data-testid="product-name">
                            {product.name}
                        </h1>

                        {/* Rating */}
                        {product.rating > 0 && (
                            <div className="flex items-center gap-3 mb-6">
                                <StarRating rating={product.rating} readonly />
                                <span className="text-sm text-gray-500">({product.review_count} reviews)</span>
                            </div>
                        )}

                        {/* Price */}
                        <div className="flex items-center gap-4 mb-8">
                            <span className="font-heading text-3xl text-charcoal" data-testid="product-price">
                                {formatPrice(product.price)}
                            </span>
                            {product.original_price && (
                                <>
                                    <span className="text-xl text-gray-400 line-through">
                                        {formatPrice(product.original_price)}
                                    </span>
                                    <span className="bg-rose/20 text-rose px-3 py-1 text-sm font-semibold">
                                        {discount}% OFF
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 leading-relaxed mb-8">
                            {product.description}
                        </p>

                        {/* Size Selector */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium">Size</span>
                                <Link to="/size-guide" className="text-sm text-rose hover:underline">Size Guide</Link>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                {product.sizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                                        data-testid={`size-${size}`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color Selector */}
                        {product.colors.length > 0 && (
                            <div className="mb-8">
                                <span className="font-medium block mb-3">Color: {selectedColor}</span>
                                <div className="flex gap-3">
                                    {product.colors.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={`px-4 py-2 border text-sm ${selectedColor === color ? 'border-charcoal bg-charcoal text-white' : 'border-gray-300 hover:border-rose'}`}
                                            data-testid={`color-${color}`}
                                        >
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className="mb-8">
                            <span className="font-medium block mb-3">Quantity</span>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="qty-btn"
                                    data-testid="qty-decrease"
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="w-12 text-center font-medium" data-testid="quantity-display">{quantity}</span>
                                <button 
                                    onClick={() => setQuantity(q => q + 1)}
                                    className="qty-btn"
                                    data-testid="qty-increase"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 mb-8">
                            <button 
                                onClick={handleAddToCart}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                                data-testid="add-to-cart-btn"
                            >
                                <ShoppingBag size={18} /> Add to Cart
                            </button>
                            <button 
                                onClick={handleWishlist}
                                className={`w-14 h-14 border flex items-center justify-center ${inWishlist ? 'bg-rose text-white border-rose' : 'border-gray-300 hover:border-rose'}`}
                                style={{ transition: 'background-color 0.2s, border-color 0.2s, color 0.2s' }}
                                data-testid="wishlist-btn"
                            >
                                <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
                            </button>
                        </div>

                        {/* Stock Status */}
                        <p className={`text-sm mb-6 ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                        </p>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-4 py-6 border-t border-gray-200">
                            {[
                                { icon: Truck, text: 'Free Shipping' },
                                { icon: RefreshCw, text: 'Easy Returns' },
                                { icon: Shield, text: 'Secure Payment' }
                            ].map((feature, i) => (
                                <div key={i} className="text-center">
                                    <feature.icon size={20} className="mx-auto text-rose mb-2" />
                                    <span className="text-xs text-gray-600">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Tabs */}
                <div className="mt-16">
                    <Tabs defaultValue="reviews" className="w-full">
                        <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0 space-x-8">
                            <TabsTrigger value="reviews" className="tab-underline pb-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none">
                                Reviews ({reviews.length})
                            </TabsTrigger>
                            <TabsTrigger value="size-guide" className="tab-underline pb-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none">
                                Size Guide
                            </TabsTrigger>
                            <TabsTrigger value="shipping" className="tab-underline pb-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none">
                                Shipping & Returns
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="reviews" className="pt-8">
                            <div className="grid lg:grid-cols-2 gap-12">
                                {/* Reviews List */}
                                <div>
                                    <h3 className="font-heading text-2xl mb-6">Customer Reviews</h3>
                                    {reviews.length > 0 ? (
                                        <div className="space-y-6">
                                            {reviews.map((review) => (
                                                <div key={review.id} className="border-b border-gray-100 pb-6">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium">{review.user_name}</span>
                                                        <StarRating rating={review.rating} readonly size={16} />
                                                    </div>
                                                    <p className="text-gray-600 text-sm">{review.comment}</p>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                                    )}
                                </div>

                                {/* Write Review */}
                                <div>
                                    <h3 className="font-heading text-2xl mb-6">Write a Review</h3>
                                    <form onSubmit={handleSubmitReview} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Rating</label>
                                            <StarRating rating={reviewRating} onChange={setReviewRating} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Your Review</label>
                                            <textarea
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                                placeholder="Share your experience with this product..."
                                                className="w-full p-4 border border-gray-200 rounded-lg focus:border-rose outline-none min-h-[120px]"
                                                required
                                                data-testid="review-textarea"
                                            />
                                        </div>
                                        <button 
                                            type="submit" 
                                            className="btn-primary"
                                            disabled={submittingReview}
                                            data-testid="submit-review-btn"
                                        >
                                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="size-guide" className="pt-8">
                            <h3 className="font-heading text-2xl mb-6">Size Guide</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="border p-3 text-left">Size</th>
                                            <th className="border p-3 text-left">Bust (inches)</th>
                                            <th className="border p-3 text-left">Waist (inches)</th>
                                            <th className="border p-3 text-left">Hip (inches)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { size: 'XS', bust: '32-33', waist: '24-25', hip: '34-35' },
                                            { size: 'S', bust: '34-35', waist: '26-27', hip: '36-37' },
                                            { size: 'M', bust: '36-37', waist: '28-29', hip: '38-39' },
                                            { size: 'L', bust: '38-39', waist: '30-31', hip: '40-41' },
                                            { size: 'XL', bust: '40-41', waist: '32-33', hip: '42-43' },
                                            { size: 'XXL', bust: '42-43', waist: '34-35', hip: '44-45' },
                                        ].map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="border p-3 font-medium">{row.size}</td>
                                                <td className="border p-3">{row.bust}</td>
                                                <td className="border p-3">{row.waist}</td>
                                                <td className="border p-3">{row.hip}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>

                        <TabsContent value="shipping" className="pt-8">
                            <h3 className="font-heading text-2xl mb-6">Shipping & Returns</h3>
                            <div className="space-y-6 max-w-2xl">
                                <div>
                                    <h4 className="font-medium mb-2">Shipping</h4>
                                    <ul className="text-gray-600 space-y-2 text-sm">
                                        <li>• Free shipping on orders above ₹2,999</li>
                                        <li>• Standard delivery: 5-7 business days</li>
                                        <li>• Express delivery: 2-3 business days (additional charges apply)</li>
                                        <li>• We ship across India</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2">Returns & Exchanges</h4>
                                    <ul className="text-gray-600 space-y-2 text-sm">
                                        <li>• Easy 7-day return policy</li>
                                        <li>• Items must be unused with original tags</li>
                                        <li>• Refund processed within 5-7 business days</li>
                                        <li>• Exchange available for different sizes</li>
                                    </ul>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-20">
                        <h2 className="font-heading text-3xl mb-8">You May Also Like</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.slice(0, 4).map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetailPage;
