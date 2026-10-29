import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Truck, Award, RotateCcw, Lock, Star, ChevronLeft, ChevronRight, Instagram } from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Hero ambient background video tuning constants
export const HERO_BG_OVERLAY = 0.72; // Dark overlay opacity (e.g. 0.72)
export const HERO_BG_BLUR = '12px';  // Blur filter for ambient background video

const defaultHeroBackground = {
    video: '/videos/Banner/hero-4.mp4',
    poster: ''
};

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
        video: '/videos/Banner/hero-5.mp4',
        poster: '',
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
        video: '/videos/Banner/store-video-1.mp4',
        poster: '',
        image: '',
        objectPosition: 'center 25%'
    },
    {
        id: 3,
        tabName: 'FESTIVE',
        label: 'FESTIVE EDIT',
        title1: 'FESTIVE',
        title2: 'COLLECTION',
        description: 'Embroidered sets and festive outfits for every celebration.',
        buttonText: 'SHOP FESTIVE',
        link: '/shop',
        video: '/videos/Banner/store-video-2.mp4',
        poster: '',
        image: '',
        objectPosition: 'center 35%'
    }
];

const DEFAULT_SLIDE_VIDEOS = [
    '/videos/Banner/hero-5.mp4',
    '/videos/Banner/store-video-1.mp4',
    '/videos/Banner/store-video-2.mp4'
];

const resolveSlideVideo = (videoPath, index = 0) => {
    const fallback = DEFAULT_SLIDE_VIDEOS[index % DEFAULT_SLIDE_VIDEOS.length];
    if (!videoPath || typeof videoPath !== 'string') {
        return fallback;
    }
    const clean = videoPath.trim();
    if (!clean) return fallback;

    if (clean === '/videos/Banner/hero-5.mp4' ||
        clean === '/videos/Banner/store-video-1.mp4' ||
        clean === '/videos/Banner/store-video-2.mp4' ||
        clean === '/videos/Banner/hero-4.mp4') {
        return clean;
    }

    const lower = clean.toLowerCase();
    if (lower.endsWith('hero-5.mp4')) return '/videos/Banner/hero-5.mp4';
    if (lower.endsWith('store-video-1.mp4')) return '/videos/Banner/store-video-1.mp4';
    if (lower.endsWith('store-video-2.mp4')) return '/videos/Banner/store-video-2.mp4';
    if (lower.endsWith('hero-4.mp4')) return '/videos/Banner/hero-4.mp4';

    return fallback;
};

const resolveHeroBgVideo = (bgVideo) => {
    const fallback = '/videos/Banner/hero-4.mp4';
    if (!bgVideo || typeof bgVideo !== 'string') return fallback;
    const clean = bgVideo.trim();
    if (!clean) return fallback;
    if (clean === fallback) return fallback;
    const lower = clean.toLowerCase();
    if (lower.endsWith('hero-4.mp4')) return fallback;
    if (lower.endsWith('hero-5.mp4')) return '/videos/Banner/hero-5.mp4';
    if (lower.endsWith('store-video-1.mp4')) return '/videos/Banner/store-video-1.mp4';
    if (lower.endsWith('store-video-2.mp4')) return '/videos/Banner/store-video-2.mp4';
    return fallback;
};

const resolveSlidePoster = (poster) => {
    if (!poster || typeof poster !== 'string') return '';
    const clean = poster.trim();
    if (!clean || clean.includes('banner-') || clean.includes('store-video-')) return '';
    return clean;
};

const categoryEditorialImages = {
    ethnic: '/images/products/rust-ajrakh-shirt-kurta.jpg',
    traditional: '/images/categories/category-traditional.jpg',
    western: '/images/products/purple-floral-coord-set.jpg',
    'co-ord-sets': '/images/products/purple-floral-coord-set.jpg'
};

const defaultCategories = [
    { id: 'ethnic', name: 'Ethnic Wear', subcategories: ['Sarees', 'Lehengas', 'Salwar Suits', 'Kurtis'], image: '/images/products/rust-ajrakh-shirt-kurta.jpg', href: '/shop?category=ethnic' },
    { id: 'traditional', name: 'Traditional Wear', subcategories: ['Anarkalis', 'Sharara Sets', 'Palazzo Sets', 'Gharara Sets'], image: '/images/categories/traditional.jpg', href: '/shop?category=traditional' },
    { id: 'western', name: 'Western Wear', subcategories: ['Dresses', 'Tops', 'Jeans', 'Skirts', 'Jumpsuits'], image: '/images/products/purple-floral-coord-set.jpg', href: '/shop?category=western' },
    { id: 'co-ord-sets', name: 'Co-ord Sets', subcategories: ['Co-ord Sets'], image: '/images/products/purple-floral-coord-set.jpg', href: '/shop?product_type=co-ord-set' }
];

const SectionDivider = ({ align = "center" }) => (
    <div className={`flex items-center gap-2 my-3 ${align === "left" ? "justify-center lg:justify-start" : "justify-center"}`}>
        <div className="w-8 h-[1px] bg-[#3B6FA0]/40"></div>
        <span className="text-[#3B6FA0] text-xs">❖</span>
        <div className="w-8 h-[1px] bg-[#3B6FA0]/40"></div>
    </div>
);

const SectionHeader = ({ label, title, align = "center", rightAction = null }) => (
    <div className={`mb-6 sm:mb-8 ${rightAction ? 'flex items-end justify-between gap-4' : align === 'left' ? 'text-left' : 'text-center'}`}>
        <div className="space-y-1">
            {label && (
                <p className="text-xs uppercase tracking-[0.25em] font-bold text-[#C2255C]">
                    {label}
                </p>
            )}
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl text-[#1F2937] uppercase tracking-wide font-bold">
                {title}
            </h2>
            <div className={`w-12 h-0.5 bg-[#C2255C] rounded-full mt-2.5 ${align === 'center' && !rightAction ? 'mx-auto' : ''}`} />
        </div>
        {rightAction && (
            <div className="flex-shrink-0">{rightAction}</div>
        )}
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
    const [heroBackground, setHeroBackground] = useState(defaultHeroBackground);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isTabVisible, setIsTabVisible] = useState(true);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

    // Product Carousel state
    const [productSlideIndex, setProductSlideIndex] = useState(0);

    // Hero Video slide state & refs
    const [heroVideoErrors, setHeroVideoErrors] = useState({});
    const heroVideoRetriesRef = useRef({});
    
    const heroVideoRefs = useRef({});
    const heroBgVideoRef = useRef(null);

    // Check mobile screen size to conditionally mount background video
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Ensure background video plays
    useEffect(() => {
        if (heroBgVideoRef.current) {
            heroBgVideoRef.current.muted = true;
            heroBgVideoRef.current.play().catch(() => {});
        }
    }, [isMobile, heroBackground.video]);

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
        Object.entries(heroVideoRefs.current).forEach(([key, videoEl]) => {
            if (!videoEl) return;
            const slideIdx = parseInt(String(key).split('-')[0], 10);
            if (slideIdx === currentSlide) {
                videoEl.muted = true;
                videoEl.currentTime = 0;
                videoEl.play().catch(() => {});
            } else {
                videoEl.pause();
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
            if (res.data?.hero_slides && Array.isArray(res.data.hero_slides) && res.data.hero_slides.length >= 1) {
                const fetchedSlides = res.data.hero_slides.slice(0, 3);
                while (fetchedSlides.length < 3) {
                    fetchedSlides.push(defaultHeroSlides[fetchedSlides.length]);
                }
                setSlides(fetchedSlides);
            }
            if (res.data?.hero_background && typeof res.data.hero_background === 'object') {
                setHeroBackground(res.data.hero_background);
            }
        } catch (err) {
            console.error('Failed to load site content on home page:', err);
        }
    };

    // Carousel auto-rotation timer (7s per slide, paused when hovered or tab hidden)
    useEffect(() => {
        if (isHovered || !isTabVisible || !slides.length) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 7000);
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
            const loadedCats = catRes.data && catRes.data.length > 0 ? catRes.data : defaultCategories;
            const filteredCats = loadedCats
                .filter(cat => cat.id !== 'bridal' && !cat.name?.toLowerCase().includes('bridal'))
                .map(cat => ({
                    ...cat,
                    href: cat.href || (cat.id === 'co-ord-sets' ? '/shop?product_type=co-ord-set' : `/shop?category=${cat.id}`)
                }));

            if (!filteredCats.some(c => c.id === 'co-ord-sets' || c.name === 'Co-ord Sets')) {
                filteredCats.push({
                    id: 'co-ord-sets',
                    name: 'Co-ord Sets',
                    subcategories: ['Co-ord Sets'],
                    image: '/images/products/purple-floral-coord-set.jpg',
                    href: '/shop?product_type=co-ord-set'
                });
            }
            setCategories(filteredCats);
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
        <div className="bg-white text-[#1F2937] min-h-screen overflow-x-hidden" data-testid="home-page">
            {/* HERO SECTION */}
            <section 
                className="relative w-full bg-[#1A1412] overflow-hidden group border-b border-[#1F2937]" 
                data-testid="hero-section"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Desktop Full Viewport & Mobile Responsive Container */}
                <div className="relative w-full h-[540px] md:h-[580px] lg:h-[clamp(560px,42vw,720px)] overflow-hidden">
                    {/* Full-width persistent background: ambient blurred video with dark gradient overlay, fallback to solid brand color */}
                    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-[#1A1412]">
                        {/* Dark gradient overlay so text stays readable */}
                        <div 
                            className="absolute inset-0 z-10 pointer-events-none" 
                            style={{ 
                                backgroundColor: `rgba(0, 0, 0, ${HERO_BG_OVERLAY})`,
                                backgroundImage: `linear-gradient(180deg, rgba(26,20,18,${Math.min(0.96, Number(HERO_BG_OVERLAY) + 0.12)}) 0%, rgba(0,0,0,${HERO_BG_OVERLAY}) 50%, rgba(26,20,18,${Math.min(0.98, Number(HERO_BG_OVERLAY) + 0.16)}) 100%)`
                            }} 
                        />
                        {isMobile && resolveSlidePoster(heroBackground?.poster) ? (
                            <img
                                src={resolveSlidePoster(heroBackground.poster)}
                                alt="Hero Background Poster"
                                className="w-full h-full object-cover"
                                style={{
                                    filter: `blur(${HERO_BG_BLUR})`,
                                    transform: 'scale(1.08)'
                                }}
                            />
                        ) : (
                            <video
                                ref={heroBgVideoRef}
                                src={resolveHeroBgVideo(heroBackground?.video)}
                                {...(resolveSlidePoster(heroBackground?.poster) ? { poster: resolveSlidePoster(heroBackground.poster) } : {})}
                                autoPlay
                                muted
                                loop
                                playsInline
                                preload="auto"
                                className="w-full h-full object-cover"
                                style={{
                                    filter: `blur(${HERO_BG_BLUR})`,
                                    transform: 'scale(1.08)'
                                }}
                            />
                        )}
                    </div>

                    {/* Foreground Slides: exactly 3 slides, text left, portrait video frame right */}
                    {slides.map((slide, index) => {
                        const isActive = currentSlide === index;

                        return (
                            <div 
                                key={slide.id || index}
                                className={`transition-opacity duration-700 ease-in-out absolute inset-0 w-full h-full ${
                                    isActive ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
                                }`}
                            >
                                <div className="w-full h-full relative overflow-hidden">
                                    {/* Desktop (>=1024px): Foreground portrait video container */}
                                    {slide.image ? (
                                        <div 
                                            className="hidden lg:flex absolute top-1/2 -translate-y-1/2 left-[70%] -translate-x-1/2 h-[90%] aspect-[9/16] rounded-lg overflow-hidden shadow-2xl items-center justify-center bg-black/20 z-20"
                                        >
                                            <img 
                                                src={slide.image} 
                                                alt={slide.title1 ? `${slide.title1} ${slide.title2 || ''} - Jaridar Fashion Couture`.trim() : (slide.tabName || 'Jaridar Hero Banner')} 
                                                className="w-full h-full object-cover origin-top"
                                                style={{ objectPosition: slide.objectPosition || 'center 35%' }}
                                                loading={index === 0 ? "eager" : "lazy"}
                                            />
                                        </div>
                                    ) : (
                                        <div 
                                            className="hidden lg:flex absolute top-1/2 -translate-y-1/2 left-[70%] -translate-x-1/2 h-[90%] aspect-[9/16] rounded-lg overflow-hidden shadow-2xl items-center justify-center bg-black/20 z-20"
                                        >
                                            <video 
                                                ref={el => { heroVideoRefs.current[index] = el; }}
                                                src={resolveSlideVideo(slide.video, index)}
                                                {...(resolveSlidePoster(slide.poster) ? { poster: resolveSlidePoster(slide.poster) } : {})}
                                                autoPlay={isActive}
                                                muted
                                                loop
                                                playsInline
                                                preload="metadata"
                                                onError={(e) => handleHeroVideoError(slide.id || index, e)}
                                                className={`w-full h-full object-contain origin-top scale-[1.08] ${heroVideoErrors[slide.id || index] ? 'hidden' : 'block'}`}
                                                style={{ 
                                                    transform: 'scale(1.08)',
                                                    transformOrigin: 'top center'
                                                }}
                                            />
                                        </div>
                                    )}

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

                    {/* DOT INDICATORS / TABS at bottom center */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 pointer-events-auto">
                        {slides.map((slide, index) => {
                            const isActive = currentSlide === index;
                            return (
                                <button
                                    key={slide.id || index}
                                    onClick={() => setCurrentSlide(index)}
                                    aria-label={`Go to slide ${index + 1}: ${slide.tabName || slide.title1}`}
                                    className={`transition-all duration-300 ${
                                        isActive 
                                            ? 'w-8 h-2.5 rounded-full bg-[#C2255C]' 
                                            : 'w-2.5 h-2.5 rounded-full bg-white/50 hover:bg-white/80'
                                    }`}
                                />
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* FEATURES / TRUST STRIP - Compact Light Strip */}
            <section className="bg-[#F9FAFB] border-b border-[#E5E7EB] py-3.5 sm:py-4 md:py-4.5" data-testid="features-strip">
                <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px]">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-0">
                        {[
                            { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹2999' },
                            { icon: Award, title: 'Premium Quality', desc: '100% authentic craftsmanship' },
                            { icon: RotateCcw, title: 'Easy Exchange', desc: '7-day hassle-free exchange' },
                            { icon: Lock, title: 'Secure Payment', desc: '100% protected checkout' }
                        ].map((item, i) => (
                            <div 
                                key={i} 
                                className={`flex items-center gap-2.5 sm:gap-3 group px-2 sm:px-3 lg:px-4 ${
                                    i < 3 ? 'lg:border-r lg:border-[#E5E7EB]' : ''
                                }`}
                            >
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E8F0F8] flex items-center justify-center text-[#3B6FA0] flex-shrink-0 border border-[#E5E7EB]">
                                    <item.icon size={16} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-heading text-xs sm:text-sm font-semibold text-[#1F2937] tracking-wide truncate">{item.title}</h3>
                                    <p className="text-[11px] sm:text-xs text-[#4B5563] mt-0.5 truncate">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SHOP BY CATEGORY */}
            <section className="py-10 md:py-14 lg:py-16 bg-white border-b border-[#E5E7EB]" data-testid="categories-section">
                <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px]">
                    <SectionHeader 
                        label="COLLECTIONS" 
                        title="Shop by Category" 
                    />

                    {catLoading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="aspect-[3/4] bg-[#E5E7EB]/50 animate-pulse rounded-xl md:rounded-2xl border border-[#E5E7EB]" />
                            ))}
                        </div>
                    ) : catError || categories.length === 0 ? (
                        <div className="text-center py-12 px-4 bg-white/70 rounded-xl border border-[#E5E7EB] max-w-md mx-auto">
                            <p className="text-[#1F2937] text-base font-medium mb-4">Categories could not be loaded. Please try again.</p>
                            <button 
                                onClick={fetchCategoriesData}
                                className="px-6 py-2.5 bg-[#C2255C] text-white text-sm uppercase tracking-wide font-semibold rounded-xl hover:bg-[#9C1D49] transition-colors shadow-xs"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                            {categories.map((category) => {
                                const editorialImg = categoryEditorialImages[category.id] || category.image;
                                const categoryHref = category.href || (category.id === 'co-ord-sets' ? '/shop?product_type=co-ord-set' : `/shop?category=${category.id}`);
                                return (
                                    <Link 
                                        key={category.id}
                                        to={categoryHref}
                                        className="group relative block aspect-[3/4] w-full overflow-hidden rounded-xl md:rounded-2xl border border-[#E5E7EB] bg-white shadow-xs hover:shadow-md transition-shadow"
                                        data-testid={`category-${category.id}`}
                                    >
                                        <img 
                                            src={editorialImg}
                                            alt={`${category.name} Collection - Jaridar Fashion Couture`}
                                            className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        {/* Bottom-to-top dark gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
                                        
                                        {/* Category name placed over gradient at bottom in white */}
                                        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-center pointer-events-none">
                                            <h3 className="font-heading text-base sm:text-lg md:text-xl font-bold uppercase tracking-wider text-white drop-shadow-sm">
                                                {category.name}
                                            </h3>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* NEW ARRIVALS */}
            <section className="py-10 md:py-14 lg:py-16 bg-white border-b border-[#E5E7EB]" data-testid="new-arrivals-section">
                <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px]">
                    <SectionHeader 
                        label="CURATED PICKS" 
                        title="New Arrivals"
                        align="center"
                    />

                    <div className="relative">
                        {!prodLoading && !prodError && products.length > 4 && (
                            <>
                                <button 
                                    onClick={prevProductSlide} 
                                    className="absolute -left-1 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#E5E7EB] text-[#1F2937] hover:text-[#C2255C] hover:border-[#C2255C] transition-all bg-white/95 shadow-md flex items-center justify-center cursor-pointer"
                                    aria-label="Previous products"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    onClick={nextProductSlide} 
                                    className="absolute -right-1 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#E5E7EB] text-[#1F2937] hover:text-[#C2255C] hover:border-[#C2255C] transition-all bg-white/95 shadow-md flex items-center justify-center cursor-pointer"
                                    aria-label="Next products"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </>
                        )}

                        {prodLoading ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                                {[1, 2, 3, 4].map((n) => (
                                    <div key={n} className="aspect-[3/4] bg-neutral-100 animate-pulse rounded-xl border border-[#E5E7EB]" />
                                ))}
                            </div>
                        ) : prodError ? (
                            <div className="text-center py-12 px-4 bg-white rounded-xl border border-[#E5E7EB] max-w-md mx-auto shadow-xs">
                                <p className="text-[#1F2937] text-base font-medium mb-4">Products could not be loaded. Please try again.</p>
                                <button 
                                    onClick={fetchProductsData}
                                    className="px-6 py-2.5 bg-[#C2255C] text-white text-sm uppercase tracking-wide font-semibold rounded-xl hover:bg-[#9C1D49] transition-colors shadow-xs"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-12 px-4 bg-white rounded-xl border border-[#E5E7EB] max-w-md mx-auto shadow-xs">
                                <p className="text-[#1F2937] text-base font-medium mb-4">No products match these filters.</p>
                                <Link 
                                    to="/shop"
                                    className="px-6 py-2.5 bg-[#C2255C] text-white text-sm uppercase tracking-wide font-semibold rounded-xl hover:bg-[#9C1D49] transition-colors shadow-xs inline-block"
                                >
                                    Clear all filters
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                                {products.slice(productSlideIndex, productSlideIndex + 4).map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Centred View All button below product row */}
                    <div className="mt-8 sm:mt-10 text-center">
                        <Link 
                            to="/shop?filter=new" 
                            className="px-7 py-3 border border-[#C2255C] text-[#C2255C] hover:bg-[#C2255C] hover:text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs inline-flex items-center gap-2 group"
                        >
                            <span>View All Products</span>
                            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* BRAND STORY / OUR STORY SECTION */}
            <section 
                ref={essenceSectionRef}
                className="relative overflow-hidden py-10 lg:py-16 border-b border-[#E5E7EB] flex items-center justify-center bg-white" 
                data-testid="brand-story-section"
            >
                {/* Background Video or Fallback Light Background */}
                {showEssenceVideo ? (
                    <video 
                        ref={essenceVideoRef}
                        src="/videos/our-story/our-story-silk-background.mp4" 
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
                    <div className="max-w-[1140px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-14">
                        
                        {/* Left Column (60% on Desktop): Text Content (stacked first on mobile) */}
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

                        {/* Right Column (40% on Desktop): Logo Card (stacked below text on mobile, right on desktop) */}
                        <div className="w-full lg:w-[40%] flex justify-center lg:justify-end items-center">
                            <div className="bg-white/85 backdrop-blur-xs border border-[#E5E7EB] rounded-2xl shadow-md lg:shadow-lg p-6 sm:p-8 lg:p-9 max-w-[280px] sm:max-w-[320px] lg:max-w-[380px] w-full flex items-center justify-center gap-3.5 lg:gap-4 transition-all">
                                <img 
                                    src="/images/logo/jaridar-icon.png" 
                                    alt="Jaridar Fashion Couture Logo" 
                                    className="h-11 sm:h-12 lg:h-16 w-auto object-contain flex-shrink-0" 
                                    loading="lazy"
                                    decoding="async"
                                />
                                <div className="flex flex-col justify-center text-left">
                                    <span className="font-heading text-xl sm:text-2xl lg:text-3xl font-black text-[#C2255C] tracking-tight leading-none">
                                        JARIDAR
                                    </span>
                                    <span className="text-xs font-bold text-[#3B6FA0] uppercase tracking-[0.24em] lg:tracking-[0.26em] pt-0.5 lg:pt-1 leading-tight">
                                        Fashion Couture
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            {/* TODO: Testimonials content will be replaced later */}
            <section className="py-10 md:py-14 lg:py-16 bg-white border-b border-[#E5E7EB]" data-testid="testimonials-section">
                <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px]">
                    <SectionHeader 
                        label="TESTIMONIALS" 
                        title="What Our Customers Say" 
                    />

                    {/* 3 cards per row on desktop, horizontal swipe on mobile */}
                    <div className="flex md:grid md:grid-cols-3 gap-5 sm:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 items-stretch">
                        {[
                            {
                                name: 'Priya S.',
                                location: 'Mumbai',
                                text: 'Absolutely in love with my designer lehenga! The craftsmanship is magnificent, and the fit was custom perfection.',
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
                            <div 
                                key={i} 
                                className="flex-shrink-0 w-[85%] sm:w-[70%] md:w-auto snap-center bg-white p-6 sm:p-7 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between h-full"
                            >
                                <div className="space-y-3">
                                    <div className="flex gap-1 text-[#3B6FA0]">
                                        {[...Array(testimonial.rating)].map((_, j) => (
                                            <Star key={j} size={15} className="fill-[#3B6FA0] text-[#3B6FA0]" />
                                        ))}
                                    </div>
                                    <p className="text-[#4B5563] text-sm sm:text-base leading-relaxed">
                                        "{testimonial.text}"
                                    </p>
                                </div>
                                <div className="mt-5 pt-3 border-t border-[#F3F4F6]">
                                    <p className="font-heading text-sm font-semibold text-[#1F2937]">{testimonial.name}</p>
                                    <p className="text-xs text-[#C2255C] font-medium uppercase tracking-wider">{testimonial.location}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* INSTAGRAM (White Section) */}
            <section className="bg-white border-b border-[#E5E7EB] py-5 sm:py-6" data-testid="instagram-section">
                <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Instagram size={20} className="text-[#C2255C]" />
                        <span className="font-heading text-xs md:text-sm uppercase tracking-widest text-[#1F2937] font-semibold text-center sm:text-left">
                            Get Inspired – Follow Us on Instagram
                        </span>
                    </div>
                    <a 
                        href="https://instagram.com/jaridarfashion_1" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-5 py-2 bg-[#C2255C] hover:bg-[#9C1D49] text-white text-xs font-semibold rounded-full transition-colors shadow-xs uppercase tracking-wider flex-shrink-0"
                    >
                        @jaridarfashion_1
                    </a>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
