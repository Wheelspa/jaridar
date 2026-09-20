import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Truck, Award, RotateCcw, Lock, Star, ChevronLeft, ChevronRight, Instagram } from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const heroSlides = [
    {
        id: 1,
        subtitle: 'New Collection 2026',
        titlePart1: 'Elegance',
        titleHighlight: 'Redefined',
        description: 'Discover exquisite ethnic, traditional & western wear crafted with love. Where heritage meets contemporary fashion.',
        primaryBtnText: 'Shop Now',
        primaryBtnLink: '/shop',
        secondaryBtnText: 'Bridal Collection',
        secondaryBtnLink: '/shop?category=bridal',
        image: '/images/hero/hero-1.jpg',
        badgeLabel: 'Starting From',
        badgeValue: '₹2,999'
    },
    {
        id: 2,
        subtitle: 'Festive Collection 2026',
        titlePart1: 'Royal',
        titleHighlight: 'Celebrations',
        description: 'Immerse in pure luxury with handcrafted silk sarees, kurtis & Anarkalis tailored for festive perfection.',
        primaryBtnText: 'Shop Ethnic Wear',
        primaryBtnLink: '/shop?category=ethnic',
        secondaryBtnText: 'Explore Traditional',
        secondaryBtnLink: '/shop?category=traditional',
        image: '/images/hero/hero-2.jpg',
        badgeLabel: 'Artisan Craft',
        badgeValue: 'Hand-woven Zari'
    },
    {
        id: 3,
        subtitle: 'Bridal Season Sale',
        titlePart1: 'Special Wedding',
        titleHighlight: 'Edition',
        description: 'Up to 30% off on exclusive bridal lehengas, reception gowns & handcrafted wedding accessories.',
        primaryBtnText: 'Shop Bridal Sale',
        primaryBtnLink: '/shop?category=bridal',
        secondaryBtnText: 'View Offers',
        secondaryBtnLink: '/shop?category=bridal',
        image: '/images/hero/hero-3.jpg',
        badgeLabel: 'Special Offer',
        badgeValue: 'Flat 30% Off'
    }
];

const brandStoryImage = '/images/story/story-1.jpg';

const categoryEditorialImages = {
    ethnic: '/images/categories/ethnic.jpg',
    traditional: '/images/categories/traditional.jpg',
    western: '/images/categories/western.jpg',
    bridal: '/images/categories/bridal.jpg'
};

const SectionDivider = ({ align = "center" }) => (
    <div className={`flex items-center gap-2 my-3 ${align === "left" ? "justify-center md:justify-start" : "justify-center"}`}>
        <div className="w-8 h-[1px] bg-rose/40"></div>
        <span className="text-rose text-xs">♥</span>
        <div className="w-8 h-[1px] bg-rose/40"></div>
    </div>
);

const HomePage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Hero Carousel state
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Product Carousel state
    const [productSlideIndex, setProductSlideIndex] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    // Carousel auto-rotation timer (every 5s, paused when hovered)
    useEffect(() => {
        if (isHovered) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [isHovered]);

    const prevHeroSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
    };

    const nextHeroSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    };

    const fetchData = async () => {
        try {
            await axios.post(`${API}/seed`);
            const [prodRes, catRes] = await Promise.all([
                axios.get(`${API}/products`),
                axios.get(`${API}/categories`)
            ]);
            setProducts(prodRes.data);
            setCategories(catRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const prevProductSlide = () => {
        setProductSlideIndex((prev) => (prev === 0 ? Math.max(0, products.length - 4) : prev - 1));
    };

    const nextProductSlide = () => {
        setProductSlideIndex((prev) => (prev >= products.length - 4 ? 0 : prev + 1));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FFFBF7]">
                <div className="w-10 h-10 border-3 border-rose border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-[#FFFBF7] text-charcoal min-h-screen" data-testid="home-page">
            {/* HERO SECTION */}
            <section 
                className="relative bg-[#FFFBF7] overflow-hidden group" 
                data-testid="hero-section"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 relative w-full min-h-[460px] md:min-h-[500px] flex items-center">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={currentSlide}
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="flex flex-col-reverse md:grid md:grid-cols-12 gap-8 items-center w-full min-h-[400px]"
                        >
                            {/* Left Content (Text) */}
                            <div className="md:col-span-5 text-center md:text-left z-10">
                                <p className="font-serif italic text-rose text-base md:text-lg mb-2 font-medium tracking-wide">
                                    {heroSlides[currentSlide].subtitle}
                                </p>
                                <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-charcoal leading-[1.1] mb-4 uppercase tracking-wider font-normal">
                                    {heroSlides[currentSlide].titlePart1} <br />
                                    <span className="text-rose font-semibold">{heroSlides[currentSlide].titleHighlight}</span>
                                </h1>
                                <p className="text-[#6B5B55] text-xs md:text-sm mb-6 max-w-md leading-relaxed mx-auto md:mx-0">
                                    {heroSlides[currentSlide].description}
                                </p>
                                <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start">
                                    <Link 
                                        to={heroSlides[currentSlide].primaryBtnLink} 
                                        className="px-7 py-3 bg-rose text-white text-xs uppercase tracking-[0.2em] font-semibold rounded-md hover:bg-rose-dark shadow-xs transition-colors" 
                                        data-testid="shop-now-btn"
                                    >
                                        {heroSlides[currentSlide].primaryBtnText}
                                    </Link>
                                    {heroSlides[currentSlide].secondaryBtnText && (
                                        <Link 
                                            to={heroSlides[currentSlide].secondaryBtnLink} 
                                            className="px-6 py-3 border border-[#EADFD6] text-charcoal text-xs uppercase tracking-[0.2em] font-medium rounded-md hover:border-rose hover:text-rose transition-colors bg-white"
                                        >
                                            {heroSlides[currentSlide].secondaryBtnText}
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Right Image Panel (Clean Panel with CSS Mask Fade) */}
                            <div className="md:col-span-7 relative w-full h-[320px] sm:h-[400px] md:h-[460px] flex items-center justify-end overflow-hidden">
                                <img 
                                    src={heroSlides[currentSlide].image}
                                    alt={heroSlides[currentSlide].subtitle}
                                    loading={currentSlide === 0 ? "eager" : "lazy"}
                                    className="w-full h-full object-cover object-center"
                                    style={{
                                        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 25%)',
                                        maskImage: 'linear-gradient(to right, transparent 0%, black 25%)'
                                    }}
                                />

                                {/* Smaller Chip at bottom-left of image panel (hidden on mobile) */}
                                <div className="absolute bottom-4 left-4 z-20 hidden sm:block bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-md shadow-xs border border-[#EADFD6]">
                                    <p className="text-[9px] uppercase tracking-wider text-[#6B5B55] font-medium">
                                        {heroSlides[currentSlide].badgeLabel}
                                    </p>
                                    <p className="font-heading text-sm text-rose font-bold">
                                        {heroSlides[currentSlide].badgeValue}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Desktop Outer Edge 36px Arrows */}
                    <button 
                        onClick={prevHeroSlide}
                        aria-label="Previous Slide"
                        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-charcoal hover:text-rose shadow-xs border border-[#EADFD6] items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-30"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button 
                        onClick={nextHeroSlide}
                        aria-label="Next Slide"
                        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-charcoal hover:text-rose shadow-xs border border-[#EADFD6] items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-30"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Dot Navigation Indicators */}
                <div className="relative mb-4 flex justify-center items-center gap-2 z-20">
                    {heroSlides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                currentSlide === index 
                                    ? 'w-6 bg-rose shadow-xs' 
                                    : 'w-2 bg-rose/30 hover:bg-rose/60'
                            }`}
                        />
                    ))}
                </div>
            </section>

            {/* FEATURES STRIP */}
            <section className="bg-white border-y border-[#EADFD6] py-6 md:py-8" data-testid="features-strip">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                        {[
                            { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹2999' },
                            { icon: Award, title: 'Premium Quality', desc: '100% authentic craftsmanship' },
                            { icon: RotateCcw, title: 'Easy Returns', desc: '7-day hassle-free returns' },
                            { icon: Lock, title: 'Secure Payment', desc: '100% protected checkout' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 group">
                                <div className="w-10 h-10 rounded-full bg-[#FAF0EA] flex items-center justify-center text-rose group-hover:bg-rose group-hover:text-white transition-all flex-shrink-0 border border-[#F6E4E6]">
                                    <item.icon size={18} />
                                </div>
                                <div>
                                    <h3 className="font-heading text-xs md:text-sm font-semibold text-charcoal tracking-wide">{item.title}</h3>
                                    <p className="text-[11px] text-[#6B5B55] mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SHOP BY CATEGORY */}
            <section className="py-16 md:py-20 bg-white border-b border-[#EADFD6]" data-testid="categories-section">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="text-center mb-10">
                        <h2 className="font-heading text-2xl md:text-3xl text-charcoal uppercase tracking-widest font-normal">Shop by Category</h2>
                        <SectionDivider />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {categories.map((category) => {
                            const editorialImg = categoryEditorialImages[category.id] || category.image;
                            return (
                                <Link 
                                    key={category.id}
                                    to={`/shop?category=${category.id}`}
                                    className="block relative aspect-[3/4] overflow-hidden rounded-md group shadow-xs border border-[#EADFD6]"
                                    data-testid={`category-${category.id}`}
                                >
                                    <img 
                                        src={editorialImg}
                                        alt={category.name}
                                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/20 to-transparent"></div>
                                    <div className="absolute bottom-5 left-4 right-4 text-center text-white space-y-1">
                                        <h3 className="font-heading text-lg md:text-xl font-normal uppercase tracking-wider text-white">
                                            {category.name}
                                        </h3>
                                        <p className="text-[10px] text-white/90 font-semibold uppercase tracking-[0.2em]">
                                            SHOP NOW
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* NEW ARRIVALS CAROUSEL */}
            <section className="py-16 md:py-20 bg-[#FFFBF7] border-b border-[#EADFD6]" data-testid="new-arrivals-section">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex items-center justify-between mb-10">
                        <div className="w-full text-center relative">
                            <h2 className="font-heading text-2xl md:text-3xl text-charcoal uppercase tracking-widest font-normal">New Arrivals</h2>
                            <SectionDivider />
                            {/* Carousel Controls on right */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
                                <button 
                                    onClick={prevProductSlide} 
                                    className="p-2 rounded-full border border-[#EADFD6] text-charcoal hover:text-rose hover:border-rose transition-colors bg-white shadow-xs"
                                    aria-label="Previous products"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    onClick={nextProductSlide} 
                                    className="p-2 rounded-full border border-[#EADFD6] text-charcoal hover:text-rose hover:border-rose transition-colors bg-white shadow-xs"
                                    aria-label="Next products"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {products.slice(productSlideIndex, productSlideIndex + 4).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* BRAND STORY */}
            <section className="py-16 md:py-20 bg-white border-b border-[#EADFD6]" data-testid="brand-story-section">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                        <div className="relative aspect-[4/5] rounded-md overflow-hidden shadow-xs border border-[#EADFD6]">
                            <img 
                                src={brandStoryImage} 
                                alt="Heritage Craftsmanship"
                                className="w-full h-full object-cover object-top"
                            />
                        </div>

                        <div className="space-y-4 text-center md:text-left">
                            <h2 className="font-heading text-2xl md:text-3xl text-charcoal uppercase tracking-widest font-normal">
                                Our Essence
                            </h2>
                            <SectionDivider align="left" />
                            <p className="text-[#6B5B55] text-xs md:text-sm leading-relaxed">
                                At Jaridar, every drape weaves together centuries of Indian textile artistry with contemporary elegance. 
                                Our master artisans meticulously hand-craft luxury ethnic wear, timeless sarees, and bridal ensembles designed to make your most cherished celebrations unforgettable.
                            </p>
                            <div className="pt-2">
                                <Link to="/about" className="text-xs uppercase tracking-[0.18em] font-semibold text-rose hover:underline inline-flex items-center gap-1">
                                    <span>Read Our Story</span>
                                    <span>→</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="py-16 md:py-20 bg-[#FFFBF7] border-b border-[#EADFD6]" data-testid="testimonials-section">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="text-center mb-10">
                        <h2 className="font-heading text-2xl md:text-3xl text-charcoal uppercase tracking-widest font-normal">What Our Customers Say</h2>
                        <SectionDivider />
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                name: 'Priya S.',
                                location: 'Mumbai',
                                text: 'Absolutely in love with my bridal lehenga! The craftsmanship is magnificent, and the fit was custom perfection.',
                                rating: 5
                            },
                            {
                                name: 'Ananya M.',
                                location: 'Delhi',
                                text: 'Found the perfect zari embroidered saree for my sister\'s wedding. The silk quality far exceeded my expectations!',
                                rating: 5
                            },
                            {
                                name: 'Kavita R.',
                                location: 'Bangalore',
                                text: 'Gorgeous fusion western gowns too! Love how Jaridar blends timeless heritage with modern chic silhouettes.',
                                rating: 5
                            }
                        ].map((testimonial, i) => (
                            <div key={i} className="bg-white p-6 rounded-md border border-[#EADFD6] shadow-xs">
                                <div className="flex gap-1 mb-3 text-[#C9A961]">
                                    {[...Array(testimonial.rating)].map((_, j) => (
                                        <Star key={j} size={15} className="fill-[#C9A961] text-[#C9A961]" />
                                    ))}
                                </div>
                                <p className="text-[#6B5B55] mb-4 leading-relaxed text-xs italic">"{testimonial.text}"</p>
                                <div>
                                    <p className="font-heading text-sm font-semibold text-charcoal">{testimonial.name}</p>
                                    <p className="text-[10px] text-rose font-medium uppercase tracking-wider">{testimonial.location}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* INSTAGRAM SLIM BLUSH STRIP */}
            <section className="bg-rose-50/70 border-y border-rose-100 py-6" data-testid="instagram-section">
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Instagram size={20} className="text-rose" />
                        <span className="font-heading text-xs md:text-sm uppercase tracking-widest text-charcoal font-semibold">
                            Get Inspired — Follow Us on Instagram
                        </span>
                    </div>
                    <a 
                        href="https://instagram.com" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-5 py-2 bg-rose hover:bg-rose-dark text-white text-xs font-semibold rounded-full transition-colors shadow-xs uppercase tracking-wider"
                    >
                        @jaridarfashion
                    </a>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
