import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Truck, Award, RotateCcw, Lock, Star, ChevronLeft, ChevronRight, Instagram } from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const defaultHeroSlides = [
    {
        id: 1,
        tabName: 'NEW SEASON',
        label: 'JUST IN',
        title1: 'NEW SEASON',
        title2: 'ARRIVALS',
        description: 'Fresh co-ords, kurtas and dresses, now in store.',
        buttonText: 'SHOP NEW ARRIVALS',
        link: '/shop?filter=new',
        video: '/videos/store-video-1.mp4',
        poster: '/videos/store-video-1-poster.jpg',
        image: '',
        objectPosition: 'center 35%'
    },
    {
        id: 2,
        tabName: 'ELEGANCE',
        label: 'TIMELESS ELEGANCE',
        title1: 'EVERY OCCASION',
        title2: 'COVERED',
        description: 'Kurtas, dresses and co-ords crafted for every moment.',
        buttonText: 'SHOP COLLECTIONS',
        link: '/shop',
        video: '/videos/store-video-2.mp4',
        poster: '/videos/store-video-2-poster.jpg',
        image: '',
        objectPosition: 'center 25%'
    }
];

const categoryEditorialImages = {
    ethnic: '/images/products/rust-ajrakh-shirt-kurta.jpg',
    traditional: '/images/categories/category-traditional.jpg',
    western: '/images/products/purple-floral-coord-set.jpg',
    bridal: '/images/categories/category-bridal.jpg'
};

const defaultCategories = [
    { id: 'ethnic', name: 'Ethnic Wear', subcategories: ['Sarees', 'Lehengas', 'Salwar Suits', 'Kurtis'], image: '/images/products/rust-ajrakh-shirt-kurta.jpg' },
    { id: 'traditional', name: 'Traditional Wear', subcategories: ['Anarkalis', 'Sharara Sets', 'Palazzo Sets', 'Gharara Sets'], image: '/images/categories/traditional.jpg' },
    { id: 'western', name: 'Western Wear', subcategories: ['Dresses', 'Tops', 'Jeans', 'Skirts', 'Jumpsuits'], image: '/images/products/purple-floral-coord-set.jpg' },
    { id: 'bridal', name: 'Bridal Collection', subcategories: ['Bridal Lehengas', 'Reception Gowns', 'Sangeet Outfits', 'Mehendi Outfits'], image: '/images/categories/bridal.jpg' }
];

const SectionDivider = ({ align = "center" }) => (
    <div className={`flex items-center gap-2 my-3 ${align === "left" ? "justify-center md:justify-start" : "justify-center"}`}>
        <div className="w-8 h-[1px] bg-[#3B6FA0]/40"></div>
        <span className="text-[#3B6FA0] text-xs">❖</span>
        <div className="w-8 h-[1px] bg-[#3B6FA0]/40"></div>
    </div>
);

const HomePage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(defaultCategories);
    const [prodLoading, setProdLoading] = useState(true);
    const [prodError, setProdError] = useState(false);
    const [catLoading, setCatLoading] = useState(true);
    const [catError, setCatError] = useState(false);

    // Hero Carousel state
    const [slides, setSlides] = useState(defaultHeroSlides);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isTabVisible, setIsTabVisible] = useState(true);

    // Product Carousel state
    const [productSlideIndex, setProductSlideIndex] = useState(0);

    // Hero Video slide state & refs
    const [heroVideoErrors, setHeroVideoErrors] = useState({});
    const heroVideoRetriesRef = useRef({});
    
    // Slide 0 video refs (mobile, desktop bg, desktop fg)
    const slide0MobileVideoRef = useRef(null);
    const slide0BgVideoRef = useRef(null);
    const slide0FgVideoRef = useRef(null);

    // Slide 1 video refs (mobile, desktop bg, desktop fg)
    const slide1MobileVideoRef = useRef(null);
    const slide1BgVideoRef = useRef(null);
    const slide1FgVideoRef = useRef(null);

    // Hero video error handler with retry and visibility check
    const handleHeroVideoError = (slideId, event) => {
        const videoEl = event.target;
        if (!videoEl) return;

        // Check if video is visible at current screen size / breakpoint
        const isHidden = window.getComputedStyle(videoEl).display === 'none' || videoEl.offsetParent === null;
        if (isHidden) return;

        console.error("Hero video error", slideId, videoEl.error?.code, videoEl.error?.message);

        if (!heroVideoRetriesRef.current[slideId]) {
            heroVideoRetriesRef.current[slideId] = true;
            setTimeout(() => {
                if (videoEl) {
                    videoEl.muted = true;
                    videoEl.load();
                    videoEl.play().catch(() => {});
                }
            }, 1000);
        } else {
            setHeroVideoErrors((prev) => ({ ...prev, [slideId]: true }));
        }
    };

    // Our Essence Video state & refs
    const [essenceVideoError, setEssenceVideoError] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const essenceSectionRef = useRef(null);
    const essenceVideoRef = useRef(null);

    // Check prefers-reduced-motion
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);
        const handleChange = (e) => setPrefersReducedMotion(e.matches);
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, []);

    // Sync play/pause & restart from 0 for active hero videos
    useEffect(() => {
        const slide0Refs = [slide0MobileVideoRef, slide0BgVideoRef, slide0FgVideoRef];
        const slide1Refs = [slide1MobileVideoRef, slide1BgVideoRef, slide1FgVideoRef];

        const activeRefs = currentSlide === 0 ? slide0Refs : slide1Refs;
        const inactiveRefs = currentSlide === 0 ? slide1Refs : slide0Refs;

        inactiveRefs.forEach((ref) => {
            if (ref.current) {
                ref.current.pause();
            }
        });

        activeRefs.forEach((ref) => {
            if (ref.current) {
                ref.current.muted = true;
                try {
                    ref.current.load();
                } catch (_) {}
                ref.current.currentTime = 0;
                ref.current.play().catch(() => {});
            }
        });
    }, [currentSlide]);

    // IntersectionObserver for Our Essence Video
    const showEssenceVideo = !essenceVideoError && !prefersReducedMotion;

    useEffect(() => {
        const sectionEl = essenceSectionRef.current;
        const videoEl = essenceVideoRef.current;
        if (!sectionEl || !videoEl || !showEssenceVideo) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        videoEl.play().catch(() => {});
                    } else {
                        videoEl.pause();
                    }
                });
            },
            { threshold: 0.1 }
        );

        observer.observe(sectionEl);

        return () => {
            observer.disconnect();
        };
    }, [showEssenceVideo]);

    // Track tab visibility
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsTabVisible(document.visibilityState === 'visible');
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Initial data fetch
    useEffect(() => {
        fetchProductsData();
        fetchCategoriesData();
        fetchSiteContent();
    }, []);

    const fetchSiteContent = async () => {
        try {
            const res = await axios.get(`${API}/site-content`);
            if (res.data?.hero_slides && Array.isArray(res.data.hero_slides) && res.data.hero_slides.length === 2) {
                setSlides(res.data.hero_slides);
            }
        } catch (err) {
            console.error('Failed to load site content on home page:', err);
        }
    };

    // Carousel auto-rotation timer (10s per slide, paused when hovered or tab hidden)
    useEffect(() => {
        if (isHovered || !isTabVisible || !slides.length) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 10000);
        return () => clearInterval(interval);
    }, [isHovered, isTabVisible, slides.length]);

    const prevHeroSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    const nextHeroSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const fetchProductsData = async () => {
        setProdLoading(true);
        setProdError(false);
        try {
            const prodRes = await axios.get(`${API}/products`);
            const rawProducts = prodRes.data && prodRes.data.length > 0 ? prodRes.data : [];
            const sortedProducts = [...rawProducts].sort((a, b) => {
                const isNewA = a.is_new ? 1 : 0;
                const isNewB = b.is_new ? 1 : 0;
                if (isNewA !== isNewB) {
                    return isNewB - isNewA;
                }
                const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return timeB - timeA;
            });
            setProducts(sortedProducts);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setProdError(true);
        } finally {
            setProdLoading(false);
        }
    };

    const fetchCategoriesData = async () => {
        setCatLoading(true);
        setCatError(false);
        try {
            const catRes = await axios.get(`${API}/categories`);
            setCategories(catRes.data && catRes.data.length > 0 ? catRes.data : defaultCategories);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setCatError(true);
            setCategories(defaultCategories);
        } finally {
            setCatLoading(false);
        }
    };

    const prevProductSlide = () => {
        setProductSlideIndex((prev) => (prev === 0 ? Math.max(0, products.length - 4) : prev - 1));
    };

    const nextProductSlide = () => {
        setProductSlideIndex((prev) => (prev >= products.length - 4 ? 0 : prev + 1));
    };

    return (
        <div className="bg-white text-[#1F2937] min-h-screen" data-testid="home-page">
            {/* HERO SECTION - UNTOUCHED */}
            <section 
                className="relative w-full bg-[#1A1412] overflow-hidden group border-b border-[#1F2937]" 
                data-testid="hero-section"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Desktop Full Viewport & Mobile Responsive Container */}
                <div className="relative w-full h-[540px] md:h-[580px] lg:h-[clamp(560px,42vw,720px)] overflow-hidden">
                    {slides.map((slide, index) => {
                        const isActive = currentSlide === index;
                        const hasError = heroVideoErrors[slide.id];
                        const mobileRef = index === 0 ? slide0MobileVideoRef : slide1MobileVideoRef;
                        const bgRef = index === 0 ? slide0BgVideoRef : slide1BgVideoRef;
                        const fgRef = index === 0 ? slide0FgVideoRef : slide1FgVideoRef;

                        return (
                            <div 
                                key={slide.id}
                                className={`transition-opacity duration-700 ease-in-out absolute inset-0 w-full h-full ${
                                    isActive ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
                                }`}
                            >
                                <div className="w-full h-full relative overflow-hidden bg-[#1A1412]">
                                    {/* Video / Photo / Error state background */}
                                    {slide.image ? (
                                        <div className="absolute inset-0 w-full h-full bg-[#1A1412] overflow-hidden pointer-events-none">
                                            <img 
                                                src={slide.image} 
                                                alt={slide.title1 ? `${slide.title1} ${slide.title2 || ''} - Jaridar Fashion Couture`.trim() : (slide.tabName || 'Jaridar Hero Banner')} 
                                                className="w-full h-full object-cover origin-top"
                                                style={{ objectPosition: slide.objectPosition || 'center 35%' }}
                                                loading={index === 0 ? "eager" : "lazy"}
                                                decoding={index === 0 ? "sync" : "async"}
                                            />
                                            <div className="absolute inset-0 bg-black/40" />
                                        </div>
                                    ) : hasError ? (
                                        <div className="absolute inset-0 w-full h-full bg-[#1A1412] overflow-hidden pointer-events-none">
                                            <img 
                                                src={slide.poster} 
                                                alt={slide.title1 ? `${slide.title1} ${slide.title2 || ''} - Jaridar Fashion Couture`.trim() : 'Jaridar Video Poster'} 
                                                className="w-full h-full object-cover origin-top"
                                                style={{ objectPosition: slide.objectPosition }}
                                                loading={index === 0 ? "eager" : "lazy"}
                                                decoding={index === 0 ? "sync" : "async"}
                                            />
                                            <div className="absolute inset-0 bg-black/40" />
                                        </div>
                                    ) : (
                                        <>
                                            {/* Mobile / Tablet (<1024px): Single full-bleed cover video */}
                                            <video 
                                                ref={mobileRef}
                                                src={isActive ? slide.video : undefined}
                                                poster={slide.poster}
                                                autoPlay={isActive}
                                                muted
                                                loop
                                                playsInline
                                                preload="metadata"
                                                onError={(e) => handleHeroVideoError(slide.id, e)}
                                                className="lg:hidden w-full h-full object-cover origin-top scale-[1.12]"
                                                style={{ objectPosition: slide.objectPosition }}
                                            />

                                            {/* Desktop (>=1024px): Background layer */}
                                            <video 
                                                ref={bgRef}
                                                src={isActive ? slide.video : undefined}
                                                poster={slide.poster}
                                                autoPlay={isActive}
                                                muted
                                                loop
                                                playsInline
                                                preload="metadata"
                                                onError={(e) => handleHeroVideoError(slide.id, e)}
                                                className="hidden lg:block absolute inset-0 w-full h-full object-cover pointer-events-none"
                                                style={{ 
                                                    filter: 'blur(28px) brightness(0.55)', 
                                                    transform: 'scale(1.2)' 
                                                }}
                                            />

                                            {/* Desktop (>=1024px): Foreground portrait video container */}
                                            <div 
                                                className="hidden lg:flex absolute top-1/2 -translate-y-1/2 left-[70%] -translate-x-1/2 h-[90%] aspect-[9/16] rounded-lg overflow-hidden shadow-2xl items-center justify-center bg-black/20 z-20"
                                            >
                                                <video 
                                                    ref={fgRef}
                                                    src={isActive ? slide.video : undefined}
                                                    poster={slide.poster}
                                                    autoPlay={isActive}
                                                    muted
                                                    loop
                                                    playsInline
                                                    preload="metadata"
                                                    onError={(e) => handleHeroVideoError(slide.id, e)}
                                                    className="w-full h-full object-contain origin-top scale-[1.08]"
                                                    style={{ 
                                                        transform: 'scale(1.08)',
                                                        transformOrigin: 'top center'
                                                    }}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Dark Gradient Overlay for Left Text */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent pointer-events-none z-10" />

                                    {/* Content Overlay */}
                                    <div className="absolute inset-0 w-full h-full flex items-center pointer-events-none z-20">
                                        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[50px] pb-12 md:pb-0">
                                            <div className="max-w-[540px] lg:max-w-[45%] pointer-events-auto text-left space-y-4">
                                                {/* BADGE / TAG */}
                                                <div>
                                                    <span className="border border-white/40 bg-white/10 backdrop-blur-xs text-white text-xs uppercase tracking-[0.2em] font-medium px-3.5 py-1 rounded-full inline-block">
                                                        {slide.label}
                                                    </span>
                                                </div>
                                                {/* HEADLINE: Two-tone */}
                                                <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-[1.05] uppercase tracking-tight font-black">
                                                    <span className="block text-white">{slide.title1}</span>
                                                    <span className="block text-[#F3D9A0]">{slide.title2}</span>
                                                </h1>
                                                {/* SUBTEXT */}
                                                <p className="text-white/90 text-sm md:text-base leading-relaxed max-w-md font-normal">
                                                    {slide.description}
                                                </p>
                                                {/* BUTTON */}
                                                <div className="pt-2 flex items-center gap-3">
                                                    <Link 
                                                        to={slide.link} 
                                                        className="px-7 py-3.5 bg-[#C2255C] hover:bg-[#9C1D49] text-white text-sm uppercase tracking-wide font-bold rounded-md shadow-md transition-colors inline-block" 
                                                        data-testid="shop-now-btn"
                                                    >
                                                        {slide.buttonText}
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Navigation Arrows */}
                    <button 
                        onClick={prevHeroSlide}
                        aria-label="Previous Slide"
                        className="flex absolute left-3 md:left-4 lg:left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white shadow-md border border-white/20 items-center justify-center transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-30"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button 
                        onClick={nextHeroSlide}
                        aria-label="Next Slide"
                        className="flex absolute right-3 md:right-4 lg:right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white shadow-md border border-white/20 items-center justify-center transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-30"
                    >
                        <ChevronRight size={20} />
                    </button>

                    {/* DOT INDICATORS at bottom center */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 pointer-events-auto">
                        {slides.map((slide, index) => {
                            const isActive = currentSlide === index;
                            return (
                                <button
                                    key={slide.id}
                                    onClick={() => setCurrentSlide(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                        isActive 
                                            ? 'bg-[#C2255C] scale-110' 
                                            : 'bg-white/40 hover:bg-white/60'
                                    }`}
                                />
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* FEATURES / TRUST STRIP (White Section) */}
            <section className="bg-white border-b border-[#E5E7EB] py-6 md:py-8" data-testid="features-strip">
                <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px]">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0">
                        {[
                            { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹2999' },
                            { icon: Award, title: 'Premium Quality', desc: '100% authentic craftsmanship' },
                            { icon: RotateCcw, title: 'Easy Returns', desc: '7-day hassle-free returns' },
                            { icon: Lock, title: 'Secure Payment', desc: '100% protected checkout' }
                        ].map((item, i) => (
                            <div 
                                key={i} 
                                className={`flex items-center gap-3.5 group px-2 sm:px-4 ${
                                    i < 3 ? 'lg:border-r lg:border-[#E5E7EB]' : ''
                                }`}
                            >
                                <div className="w-12 h-12 rounded-full bg-[#E8F0F8] flex items-center justify-center text-[#3B6FA0] flex-shrink-0 border border-[#E5E7EB]">
                                    <item.icon size={22} />
                                </div>
                                <div>
                                    <h3 className="font-heading text-sm sm:text-base font-semibold text-[#1F2937] tracking-wide">{item.title}</h3>
                                    <p className="text-xs sm:text-sm text-[#4B5563] mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SHOP BY CATEGORY (White Section) */}
            <section className="py-14 md:py-16 bg-white border-b border-[#E5E7EB]" data-testid="categories-section">
                <div className="w-full px-3 sm:px-4 md:px-8 xl:px-[50px]">
                    <div className="text-center mb-10">
                        <h2 className="font-heading text-2xl md:text-4xl text-[#1F2937] uppercase tracking-[0.06em] font-bold">Shop by Category</h2>
                        <SectionDivider />
                    </div>

                    {catLoading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="aspect-[3/4] bg-[#E5E7EB]/50 animate-pulse rounded-md border border-[#E5E7EB]" />
                            ))}
                        </div>
                    ) : catError || categories.length === 0 ? (
                        <div className="text-center py-12 px-4 bg-white/70 rounded-md border border-[#E5E7EB] max-w-md mx-auto">
                            <p className="text-[#1F2937] text-base font-medium mb-4">Categories could not be loaded. Please try again.</p>
                            <button 
                                onClick={fetchCategoriesData}
                                className="px-6 py-2.5 bg-[#C2255C] text-white text-sm uppercase tracking-wide font-semibold rounded-md hover:bg-[#9C1D49] transition-colors shadow-xs"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                            {categories.map((category) => {
                                const editorialImg = categoryEditorialImages[category.id] || category.image;
                                return (
                                    <Link 
                                        key={category.id}
                                        to={`/shop?category=${category.id}`}
                                        className="block relative aspect-[3/4] overflow-hidden rounded-sm group border border-[#E5E7EB] bg-white shadow-xs hover:shadow-md transition-all"
                                        data-testid={`category-${category.id}`}
                                    >
                                        <img 
                                            src={editorialImg}
                                            alt={`${category.name} Collection - Jaridar Fashion Couture`}
                                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#1F2937]/85 via-[#1F2937]/20 to-transparent"></div>
                                        <div className="absolute bottom-5 left-4 right-4 text-center text-white space-y-1">
                                            <h3 className="font-heading text-base md:text-lg font-semibold uppercase tracking-wide text-white">
                                                {category.name}
                                            </h3>
                                            <p className="text-xs text-white/90 font-semibold uppercase tracking-[0.2em] group-hover:underline">
                                                SHOP NOW
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* NEW ARRIVALS CAROUSEL (White Section) */}
            <section className="py-14 md:py-16 bg-white border-b border-[#E5E7EB]" data-testid="new-arrivals-section">
                <div className="w-full px-3 sm:px-4 md:px-8 xl:px-[50px]">
                    <div className="flex items-center justify-between mb-10">
                        <div className="w-full text-center relative">
                            <h2 className="font-heading text-2xl md:text-4xl text-[#1F2937] uppercase tracking-[0.06em] font-bold">New Arrivals</h2>
                            <SectionDivider />
                            {/* Carousel Controls on right */}
                            {!prodLoading && !prodError && products.length > 0 && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
                                    <button 
                                        onClick={prevProductSlide} 
                                        className="p-2 rounded-full border border-[#E5E7EB] text-[#1F2937] hover:text-[#C2255C] hover:border-[#C2255C] transition-colors bg-white shadow-xs"
                                        aria-label="Previous products"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button 
                                        onClick={nextProductSlide} 
                                        className="p-2 rounded-full border border-[#E5E7EB] text-[#1F2937] hover:text-[#C2255C] hover:border-[#C2255C] transition-colors bg-white shadow-xs"
                                        aria-label="Next products"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {prodLoading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="aspect-[3/4] bg-neutral-100 animate-pulse rounded-md border border-[#E5E7EB]" />
                            ))}
                        </div>
                    ) : prodError ? (
                        <div className="text-center py-12 px-4 bg-white rounded-md border border-[#E5E7EB] max-w-md mx-auto shadow-xs">
                            <p className="text-[#1F2937] text-base font-medium mb-4">Products could not be loaded. Please try again.</p>
                            <button 
                                onClick={fetchProductsData}
                                className="px-6 py-2.5 bg-[#C2255C] text-white text-sm uppercase tracking-wide font-semibold rounded-md hover:bg-[#9C1D49] transition-colors shadow-xs"
                            >
                                Retry
                            </button>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-12 px-4 bg-white rounded-md border border-[#E5E7EB] max-w-md mx-auto shadow-xs">
                            <p className="text-[#1F2937] text-base font-medium mb-4">No products match these filters.</p>
                            <Link 
                                to="/shop"
                                className="px-6 py-2.5 bg-[#C2255C] text-white text-sm uppercase tracking-wide font-semibold rounded-md hover:bg-[#9C1D49] transition-colors shadow-xs inline-block"
                            >
                                Clear all filters
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                            {products.slice(productSlideIndex, productSlideIndex + 4).map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* BRAND STORY / OUR ESSENCE SECTION - LIGHT THEME */}
            <section 
                ref={essenceSectionRef}
                className="relative overflow-hidden py-16 md:py-20 lg:py-24 border-b border-[#E5E7EB] flex items-center justify-center bg-white" 
                data-testid="brand-story-section"
            >
                {/* Background Video or Fallback Light Background */}
                {showEssenceVideo ? (
                    <video 
                        ref={essenceVideoRef}
                        src="/videos/essence-fabric.mp4" 
                        autoPlay 
                        muted 
                        loop 
                        playsInline 
                        preload="metadata"
                        onError={() => setEssenceVideoError(true)}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                ) : (
                    <div className="absolute inset-0 w-full h-full pointer-events-none bg-white" />
                )}

                {/* Light White Overlay */}
                <div 
                    className="absolute inset-0 pointer-events-none z-10" 
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.45)' }}
                />

                {/* Main Content Container (Responsive Grid: 1 Col on Mobile, 2 Cols on Desktop) */}
                <div className="relative z-20 w-full px-4 sm:px-6 md:px-8 xl:px-[50px]">
                    <div className="max-w-[1140px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
                        
                        {/* Mobile Logo Card (On Top for Mobile/Tablet < lg) */}
                        <div className="lg:hidden w-full flex justify-center">
                            <div className="bg-white/85 backdrop-blur-xs border border-[#E5E7EB] rounded-2xl shadow-md p-6 max-w-[220px] sm:max-w-[260px] w-full flex items-center justify-center gap-3">
                                <img 
                                    src="/images/logo/jaridar-icon.png" 
                                    alt="Jaridar Fashion Couture Logo" 
                                    className="h-10 sm:h-12 w-auto object-contain flex-shrink-0" 
                                    loading="lazy"
                                    decoding="async"
                                />
                                <div className="flex flex-col justify-center text-left">
                                    <span className="font-heading text-xl sm:text-2xl font-black text-[#C2255C] tracking-tight leading-none">
                                        JARIDAR
                                    </span>
                                    <span className="text-xs font-bold text-[#3B6FA0] uppercase tracking-[0.24em] pt-0.5 leading-tight">
                                        Fashion Couture
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Left Column (60% on Desktop): Text Content */}
                        <div className="w-full lg:w-[60%] text-center lg:text-left space-y-4">
                            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#3B6FA0]">
                                OUR STORY
                            </p>
                            <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl text-[#1F2937] uppercase tracking-[0.06em] font-bold">
                                STYLE THAT FEELS LIKE YOU
                            </h2>
                            <div className="flex justify-center lg:justify-start">
                                <SectionDivider align="left" />
                            </div>
                            <p className="text-[#1F2937]/90 text-base md:text-lg leading-relaxed font-medium max-w-[680px] mx-auto lg:mx-0">
                                Jaridar Fashion Couture is a boutique in Wakad, Pimpri-Chinchwad, where everyday kurtas, co-ord sets, dresses and festive wear are chosen with care for fabric, fit and comfort. Visit our store or shop online, and find something that feels like you.
                            </p>
                            <div className="pt-2">
                                <Link 
                                    to="/our-stores" 
                                    className="text-xs uppercase tracking-[0.18em] font-semibold text-[#C2255C] hover:text-[#9C1D49] underline decoration-[#C2255C] underline-offset-4 transition-colors inline-flex items-center gap-1"
                                >
                                    <span>VISIT OUR STORE →</span>
                                </Link>
                            </div>
                        </div>

                        {/* Right Column (40% on Desktop): Desktop Logo Card (Centered Vertically) */}
                        <div className="hidden lg:flex w-full lg:w-[40%] justify-center lg:justify-end items-center">
                            <div className="bg-white/85 backdrop-blur-xs border border-[#E5E7EB] rounded-2xl shadow-lg p-8 lg:p-9 max-w-[340px] xl:max-w-[380px] w-full flex items-center justify-center gap-4 transition-all">
                                <img 
                                    src="/images/logo/jaridar-icon.png" 
                                    alt="Jaridar Fashion Couture Logo" 
                                    className="h-14 xl:h-16 w-auto object-contain flex-shrink-0" 
                                    loading="lazy"
                                    decoding="async"
                                />
                                <div className="flex flex-col justify-center text-left">
                                    <span className="font-heading text-2xl xl:text-3xl font-black text-[#C2255C] tracking-tight leading-none">
                                        JARIDAR
                                    </span>
                                    <span className="text-xs font-bold text-[#3B6FA0] uppercase tracking-[0.26em] pt-1 leading-tight">
                                        Fashion Couture
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* TESTIMONIALS (White Section) */}
            <section className="py-14 md:py-16 bg-white border-b border-[#E5E7EB]" data-testid="testimonials-section">
                <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px]">
                    <div className="text-center mb-10">
                        <h2 className="font-heading text-2xl md:text-4xl text-[#1F2937] uppercase tracking-[0.06em] font-bold">What Our Customers Say</h2>
                        <SectionDivider />
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 items-stretch">
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
                            <div key={i} className="bg-white p-6 rounded-md border border-[#E5E7EB] shadow-xs h-full flex flex-col">
                                <div className="flex gap-1 mb-3 text-[#3B6FA0]">
                                    {[...Array(testimonial.rating)].map((_, j) => (
                                        <Star key={j} size={15} className="fill-[#3B6FA0] text-[#3B6FA0]" />
                                    ))}
                                </div>
                                <p className="text-[#4B5563] text-base not-italic leading-relaxed mb-4">"{testimonial.text}"</p>
                                <div className="mt-auto pt-2">
                                    <p className="font-heading text-sm font-semibold text-[#1F2937]">{testimonial.name}</p>
                                    <p className="text-xs text-[#C2255C] font-medium uppercase tracking-wider">{testimonial.location}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* INSTAGRAM (White Section) */}
            <section className="bg-white border-y border-[#E5E7EB] py-6" data-testid="instagram-section">
                <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px] flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Instagram size={20} className="text-[#C2255C]" />
                        <span className="font-heading text-xs md:text-sm uppercase tracking-widest text-[#1F2937] font-semibold">
                            Get Inspired – Follow Us on Instagram
                        </span>
                    </div>
                    <a 
                        href="https://instagram.com/jaridarfashion_1" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-5 py-2 bg-[#C2255C] hover:bg-[#9C1D49] text-white text-xs font-semibold rounded-full transition-colors shadow-xs uppercase tracking-wider"
                    >
                        @jaridarfashion_1
                    </a>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
