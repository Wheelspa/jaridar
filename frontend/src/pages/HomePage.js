import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, Shield, RefreshCw, Sparkles } from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HomePage = () => {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newsletterEmail, setNewsletterEmail] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Seed data first
            await axios.post(`${API}/seed`);
            
            const [featuredRes, newRes, catRes] = await Promise.all([
                axios.get(`${API}/products?featured=true&limit=8`),
                axios.get(`${API}/products?is_new=true&limit=4`),
                axios.get(`${API}/categories`)
            ]);
            
            setFeaturedProducts(featuredRes.data);
            setNewArrivals(newRes.data);
            setCategories(catRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewsletterSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/newsletter/subscribe`, { email: newsletterEmail });
            toast.success('Successfully subscribed to newsletter!');
            setNewsletterEmail('');
        } catch (error) {
            toast.error('Failed to subscribe. Please try again.');
        }
    };

    const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const staggerContainer = {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-rose border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div data-testid="home-page">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] hero-gradient overflow-hidden" data-testid="hero-section">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 right-20 w-96 h-96 bg-rose rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 left-20 w-96 h-96 bg-serenity rounded-full blur-3xl"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32 relative">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div {...fadeInUp}>
                            <p className="text-xs uppercase tracking-[0.3em] text-rose mb-4 font-semibold">New Collection 2025</p>
                            <h1 className="font-heading text-5xl md:text-7xl text-charcoal leading-none mb-6">
                                Elegance <br />
                                <span className="text-rose">Redefined</span>
                            </h1>
                            <p className="text-lg text-gray-600 mb-8 max-w-md leading-relaxed">
                                Discover exquisite ethnic, traditional & western wear crafted with love. 
                                Where heritage meets contemporary fashion.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link to="/shop" className="btn-primary" data-testid="shop-now-btn">
                                    Shop Now
                                </Link>
                                <Link to="/shop?category=bridal" className="btn-secondary">
                                    Bridal Collection
                                </Link>
                            </div>
                        </motion.div>

                        <motion.div 
                            className="relative"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="aspect-[4/5] relative">
                                <img 
                                    src="https://images.unsplash.com/photo-1760613129745-418b15f91d56?w=800"
                                    alt="Bridal Collection"
                                    className="w-full h-full object-cover rounded-t-full"
                                />
                                <div className="absolute -bottom-6 -left-6 bg-white p-6 shadow-xl rounded-lg">
                                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Starting From</p>
                                    <p className="font-heading text-3xl text-rose">₹2,999</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Bar */}
            <section className="bg-charcoal py-6" data-testid="features-bar">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { icon: Truck, text: 'Free Shipping Above ₹2999' },
                            { icon: Shield, text: '100% Secure Payment' },
                            { icon: RefreshCw, text: 'Easy Returns' },
                            { icon: Sparkles, text: 'Premium Quality' }
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-white">
                                <feature.icon size={20} className="text-rose" />
                                <span className="text-sm">{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-20 md:py-32" data-testid="categories-section">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <motion.div 
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <p className="text-xs uppercase tracking-[0.3em] text-rose mb-3 font-semibold">Explore</p>
                        <h2 className="font-heading text-4xl md:text-5xl text-charcoal">Shop by Category</h2>
                    </motion.div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {categories.map((category, index) => (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link 
                                    to={`/shop?category=${category.id}`}
                                    className="category-card block relative aspect-[3/4] overflow-hidden group"
                                    data-testid={`category-${category.id}`}
                                >
                                    <img 
                                        src={category.image}
                                        alt={category.name}
                                        className="w-full h-full object-cover group-hover:scale-105"
                                        style={{ transition: 'transform 0.6s ease' }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent"></div>
                                    <div className="absolute bottom-6 left-6 right-6 text-white">
                                        <h3 className="font-heading text-2xl mb-2">{category.name}</h3>
                                        <p className="text-sm text-white/70">{category.subcategories.length} Collections</p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-20 bg-white" data-testid="featured-section">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-rose mb-3 font-semibold">Curated For You</p>
                            <h2 className="font-heading text-4xl md:text-5xl text-charcoal">Featured Collection</h2>
                        </div>
                        <Link to="/shop?featured=true" className="mt-4 md:mt-0 flex items-center gap-2 text-charcoal hover:text-rose" style={{ transition: 'color 0.2s' }}>
                            View All <ArrowRight size={18} />
                        </Link>
                    </div>

                    <motion.div 
                        className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                    >
                        {featuredProducts.slice(0, 8).map((product) => (
                            <motion.div key={product.id} variants={fadeInUp}>
                                <ProductCard product={product} />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Banner */}
            <section className="py-20" data-testid="banner-section">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-rose/20 to-serenity/20">
                        <div className="grid lg:grid-cols-2 items-center">
                            <div className="p-12 lg:p-20">
                                <p className="text-xs uppercase tracking-[0.3em] text-rose mb-4 font-semibold">Special Offer</p>
                                <h2 className="font-heading text-4xl md:text-5xl text-charcoal mb-4">
                                    Bridal Season <br />Sale
                                </h2>
                                <p className="text-gray-600 mb-8 max-w-md">
                                    Up to 30% off on exclusive bridal lehengas, reception gowns, and wedding accessories.
                                </p>
                                <Link to="/shop?category=bridal" className="btn-primary">
                                    Shop Bridal
                                </Link>
                            </div>
                            <div className="h-80 lg:h-auto">
                                <img 
                                    src="https://images.unsplash.com/photo-1759906766380-7a5849e6fb13?w=800"
                                    alt="Bridal Collection"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* New Arrivals */}
            <section className="py-20 bg-pearl" data-testid="new-arrivals-section">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-serenity-dark mb-3 font-semibold">Just Dropped</p>
                            <h2 className="font-heading text-4xl md:text-5xl text-charcoal">New Arrivals</h2>
                        </div>
                        <Link to="/shop?is_new=true" className="mt-4 md:mt-0 flex items-center gap-2 text-charcoal hover:text-rose" style={{ transition: 'color 0.2s' }}>
                            View All <ArrowRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        {newArrivals.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-white" data-testid="testimonials-section">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="text-center mb-16">
                        <p className="text-xs uppercase tracking-[0.3em] text-rose mb-3 font-semibold">What Our Customers Say</p>
                        <h2 className="font-heading text-4xl md:text-5xl text-charcoal">Love Notes</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                name: 'Priya Sharma',
                                text: 'Absolutely in love with my bridal lehenga! The craftsmanship is impeccable and the team was so helpful throughout.',
                                rating: 5
                            },
                            {
                                name: 'Ananya Gupta',
                                text: 'Found the perfect saree for my sister\'s wedding. The quality exceeded my expectations. Will definitely shop again!',
                                rating: 5
                            },
                            {
                                name: 'Meera Patel',
                                text: 'Great collection of western wear too! Love how they blend traditional and modern styles. Fast delivery as well.',
                                rating: 5
                            }
                        ].map((testimonial, i) => (
                            <div key={i} className="bg-pearl p-8 rounded-lg">
                                <div className="flex mb-4">
                                    {[...Array(testimonial.rating)].map((_, j) => (
                                        <span key={j} className="star-filled text-lg">★</span>
                                    ))}
                                </div>
                                <p className="text-gray-600 mb-6 leading-relaxed">"{testimonial.text}"</p>
                                <p className="font-heading text-lg text-charcoal">{testimonial.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Instagram Feed Placeholder */}
            <section className="py-20" data-testid="instagram-section">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="text-center mb-12">
                        <p className="text-xs uppercase tracking-[0.3em] text-rose mb-3 font-semibold">@jaridarfashion</p>
                        <h2 className="font-heading text-4xl md:text-5xl text-charcoal">Follow Our Journey</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400',
                            'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=400',
                            'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400',
                            'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'
                        ].map((img, i) => (
                            <div key={i} className="aspect-square overflow-hidden cursor-pointer group">
                                <img 
                                    src={img}
                                    alt={`Instagram ${i + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105"
                                    style={{ transition: 'transform 0.5s ease' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
