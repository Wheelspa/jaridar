import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Truck, Award, RotateCcw, Lock, Instagram, Scissors, Camera, Store, Sparkles } from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard';
import { clientReviews } from '../data/clientReviews';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

// Hero ambient background video tuning constants
export const HERO_BG_OVERLAY = 0.72; // Dark overlay opacity (e.g. 0.72)
export const HERO_BG_BLUR = '12px';  // Blur filter for ambient background video

const defaultHeroBackground = {
    mode: 'slide'
};

const defaultHeroSlides = [
    {
        id: 1,
        tabName: 'FESTIVE',
        label: 'FESTIVE EDIT',
        title1: 'CELEBRATE IN',
        title2: 'STYLE',
        description: 'Elegant festive pieces for weddings, sangeet and every celebration.',
        buttonText: 'SHOP FESTIVE',
        link: '/shop?style=festive-wear',
        video: '/videos/banner/banner-3-festive-wear.mp4',
        poster: 'banner-3-festive-wear-poster.jpg',
        image: '',
        objectPosition: 'center 35%'
    },
    {
        id: 2,
        tabName: 'CO-ORD SETS',
        label: 'TRENDING NOW',
        title1: 'CROP TOP',
        title2: 'SETS',
        description: 'Fresh, easy-to-style co-ord and crop top sets for every day.',
        buttonText: 'SHOP CO-ORD SETS',
        link: '/shop?product_type=co-ord-set',
        video: '/videos/banner/banner-4-crop-top-set.mp4',
        poster: 'banner-4-crop-top-set-poster.jpg',
        image: '',
        objectPosition: 'center 35%'
    },
    {
        id: 3,
        tabName: 'NEW SEASON',
        label: 'JUST IN',
        title1: 'NEW SEASON',
        title2: 'ARRIVALS',
        description: 'Fresh co-ords, kurtas and dresses, now in store.',
        buttonText: 'SHOP NEW ARRIVALS',
        link: '/shop?filter=new',
        video: '/videos/banner/banner-1-new-season.mp4',
        poster: 'banner-1-new-season-poster.jpg',
        image: '',
        objectPosition: 'center 35%'
    },
    {
        id: 4,
        tabName: 'ELEGANCE',
        label: 'TIMELESS ELEGANCE',
        title1: 'EVERY OCCASION',
        title2: 'COVERED',
        description: 'Kurtas, dresses and co-ords crafted for every moment.',
        buttonText: 'SHOP COLLECTIONS',
        link: '/shop',
        video: '/videos/banner/banner-2-elegance.mp4',
        poster: 'banner-2-elegance-poster.jpg',
        image: '',
        objectPosition: 'center 25%'
    }
];

const DEFAULT_SLIDE_VIDEOS = [
    '/videos/Banner/hero-4.mp4',
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

    if (!clean.startsWith('/') && !clean.startsWith('http://') && !clean.startsWith('https://')) {
        return `/videos/banner/${clean}`;
    }

    return clean;
};

const resolveSlidePoster = (poster) => {
    if (!poster || typeof poster !== 'string') return '';
    const clean = poster.trim();
    if (!clean) return '';
    if (clean.startsWith('/') || clean.startsWith('http://') || clean.startsWith('https://')) {
        return clean;
    }
    return `/videos/banner/${clean}`;
};

const categoryEditorialImages = {
    'formal-wear': '/images/categories/formal/formal-04-black-coat-dress.jpg',
    formal: '/images/categories/formal/formal-04-black-coat-dress.jpg',
    'casual-wear': '/images/categories/casual/casual-01-green-floral-shirt-set.jpg',
    casual: '/images/categories/casual/casual-01-green-floral-shirt-set.jpg',
    'ethnic-wear': '/images/categories/ethnic-wear/ethnic-01-navy-kurta-floral-pants.jpg',
    ethnic: '/images/categories/ethnic-wear/ethnic-01-navy-kurta-floral-pants.jpg',
    western: '/images/categories/western/western-06-blue-wrap-crop-top.jpg',
    'western-wear': '/images/categories/western/western-06-blue-wrap-crop-top.jpg',
    'party-wear': '/images/categories/party/party-01-maroon-cowl-dress-web.jpg',
    party: '/images/categories/party/party-01-maroon-cowl-dress-web.jpg',
    'wedding-wear': '/images/categories/wedding/wedding-01-magenta-ruffle-gown.jpg',
    wedding: '/images/categories/wedding/wedding-01-magenta-ruffle-gown.jpg',
    'festive-wear': '/images/categories/festive/festive-01-multicolour-kaftan-drape-set-web.jpg',
    festive: '/images/categories/festive/festive-01-multicolour-kaftan-drape-set-web.jpg'
};

const defaultCategories = [
    { id: 'formal-wear', name: 'Formal Wear', subcategories: ['Shirt Dresses', 'Dresses', 'Two-Piece Sets'], image: '/images/categories/formal/formal-04-black-coat-dress.jpg', href: '/shop?category=formal-wear' },
    { id: 'casual-wear', name: 'Casual Wear', subcategories: ['Co-ord Sets', 'Shirt Sets'], image: '/images/categories/casual/casual-01-green-floral-shirt-set.jpg', href: '/shop?category=casual-wear' },
    { id: 'ethnic', name: 'Ethnic Wear', subcategories: ['Sarees', 'Lehengas', 'Salwar Suits', 'Kurtis'], image: '/images/categories/ethnic-wear/ethnic-01-navy-kurta-floral-pants.jpg', href: '/shop?category=ethnic' },
    { id: 'western', name: 'Western Wear', subcategories: ['Dresses', 'Tops', 'Jeans', 'Skirts', 'Jumpsuits'], image: '/images/categories/western/western-06-blue-wrap-crop-top.jpg', href: '/shop?category=western' },
    { id: 'party-wear', name: 'Party Wear', subcategories: ['Mini Dresses', 'Dresses', 'Blouses', 'Corset Tops', 'Maxi Dresses'], image: '/images/categories/party/party-01-maroon-cowl-dress-web.jpg', href: '/shop?category=party-wear' },
    { id: 'wedding-wear', name: 'Wedding Wear', subcategories: ['Gowns', 'Lehenga Sets'], image: '/images/categories/wedding/wedding-01-magenta-ruffle-gown.jpg', href: '/shop?category=wedding-wear' },
    { id: 'festive-wear', name: 'Festive Wear', subcategories: ['Kaftans', 'Blouses', 'Waistcoats', 'Three-Piece Sets'], image: '/images/categories/festive/festive-01-multicolour-kaftan-drape-set-web.jpg', href: '/shop?category=festive-wear' }
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

    // Hero Video slide state & refs
    const [heroVideoErrors, setHeroVideoErrors] = useState({});
    const heroVideoRetriesRef = useRef({});
    
    const heroWindowVideoRefs = useRef({});
    const heroBgVideoRefs = useRef({});

    // Check mobile screen size to conditionally mount background video
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    // Slide change tracking, guard and autoplay controls
    const prevSlideIndexRef = useRef(currentSlide);
    const slideElapsedRef = useRef(0);
    const videoPlayingRef = useRef(false);

    // Guard: ensure each slide index can advance only once per active cycle
    const hasAdvancedRef = useRef(false);
    const fallbackTimerRef = useRef(null);

    const clearFallbackTimer = useCallback(() => {
        if (fallbackTimerRef.current) {
            clearInterval(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
        }
    }, []);

    const nextHeroSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, [slides.length]);

    const prevHeroSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    }, [slides.length]);

    // Advance safely: triggers next slide once, ignoring any subsequent calls for the current slide
    const triggerSlideAdvance = useCallback((fromIndex) => {
        if (fromIndex !== undefined && fromIndex !== currentSlide) return;
        if (hasAdvancedRef.current) return;
        hasAdvancedRef.current = true;
        clearFallbackTimer();
        nextHeroSlide();
    }, [currentSlide, clearFallbackTimer, nextHeroSlide]);

    const handleDotClick = useCallback((index) => {
        if (index === currentSlide) return;
        hasAdvancedRef.current = true;
        clearFallbackTimer();
        setCurrentSlide(index);
    }, [currentSlide, clearFallbackTimer]);

    // Sync play/pause & restart from 0 for active hero videos
    useEffect(() => {
        const isNewSlide = prevSlideIndexRef.current !== currentSlide;
        prevSlideIndexRef.current = currentSlide;

        slides.forEach((_, index) => {
            const windowEl = heroWindowVideoRefs.current[index];
            const bgEl = heroBgVideoRefs.current[index];

            if (index === currentSlide) {
                if (isNewSlide) {
                    if (windowEl) {
                        windowEl.muted = true;
                        windowEl.currentTime = 0;
                    }
                    if (!isMobile && bgEl && heroBackground?.mode !== 'gradient') {
                        bgEl.muted = true;
                        bgEl.currentTime = 0;
                    }
                }

                if (isHovered || !isTabVisible) {
                    if (windowEl) windowEl.pause();
                    if (bgEl) bgEl.pause();
                } else {
                    if (windowEl) {
                        windowEl.muted = true;
                        windowEl.play().catch(() => {});
                    }
                    if (!isMobile && bgEl && heroBackground?.mode !== 'gradient') {
                        bgEl.muted = true;
                        bgEl.play().catch(() => {});
                    }
                }
            } else {
                if (windowEl) {
                    windowEl.pause();
                    windowEl.currentTime = 0;
                }
                if (bgEl) {
                    bgEl.pause();
                    bgEl.currentTime = 0;
                }
            }
        });
    }, [currentSlide, isHovered, isTabVisible, isMobile, heroBackground?.mode, slides]);

    // Keep currentTime in sync between background and window video
    const handleTimeUpdate = (index) => {
        if (index !== currentSlide || isMobile || heroBackground?.mode === 'gradient') return;
        const windowEl = heroWindowVideoRefs.current[index];
        const bgEl = heroBgVideoRefs.current[index];
        if (windowEl && bgEl && !bgEl.paused && !windowEl.paused) {
            if (Math.abs(bgEl.currentTime - windowEl.currentTime) > 0.25) {
                bgEl.currentTime = windowEl.currentTime;
            }
        }
    };

    // Called when the active right card video finishes naturally
    const handleSlideEnded = (index) => {
        if (index === currentSlide) {
            triggerSlideAdvance(index);
        }
    };

    // Hero video autoplay timer with safety fallbacks (waits for video end; fallback at 7s if error/not playing)
    useEffect(() => {
        // Reset advance guard and timer for the newly active slide
        hasAdvancedRef.current = false;
        slideElapsedRef.current = 0;
        videoPlayingRef.current = false;

        clearFallbackTimer();

        const currentSlideData = slides[currentSlide];
        const isImageOnly = Boolean(currentSlideData?.image);
        const hasError = Boolean(heroVideoErrors[currentSlideData?.id || currentSlide]);

        fallbackTimerRef.current = setInterval(() => {
            // Paused when mouse is over hero or tab is hidden
            if (isHovered || !isTabVisible) {
                return;
            }

            slideElapsedRef.current += 200;
            const elapsed = slideElapsedRef.current;

            const windowEl = heroWindowVideoRefs.current[currentSlide];
            if (windowEl && !windowEl.paused && windowEl.currentTime > 0.1) {
                videoPlayingRef.current = true;
            }

            // If already advanced by user click or onEnded, skip
            if (hasAdvancedRef.current) return;

            // Fallback 1: Image-only slide or Video Error -> advance after 7 seconds
            if (isImageOnly || hasError) {
                if (elapsed >= 7000) {
                    triggerSlideAdvance(currentSlide);
                }
                return;
            }

            // Fallback 2: Video does not start within 5 seconds -> advance after 7 seconds
            if (elapsed >= 5000 && !videoPlayingRef.current) {
                if (elapsed >= 7000) {
                    triggerSlideAdvance(currentSlide);
                }
                return;
            }

            // Fallback 3: Hard safety guard if video hangs or reaches duration without onEnded
            if (windowEl && windowEl.duration && Number.isFinite(windowEl.duration)) {
                if (elapsed >= (windowEl.duration + 2) * 1000) {
                    triggerSlideAdvance(currentSlide);
                }
            } else if (elapsed >= 30000) {
                triggerSlideAdvance(currentSlide);
            }
        }, 200);

        return () => {
            clearFallbackTimer();
        };
    }, [currentSlide, isHovered, isTabVisible, slides, heroVideoErrors, clearFallbackTimer, triggerSlideAdvance]);

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
                setSlides(res.data.hero_slides);
            }
            if (res.data?.hero_background && typeof res.data.hero_background === 'object') {
                setHeroBackground(res.data.hero_background);
            }
        } catch (err) {
            console.error('Failed to load site content on home page:', err);
        }
    };

    // Touch swipe handling for mobile
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const touchEndX = useRef(null);
    const touchEndY = useRef(null);

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        touchEndX.current = null;
        touchEndY.current = null;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
        touchEndY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
        if (touchStartX.current === null || touchEndX.current === null) return;
        const diffX = touchStartX.current - touchEndX.current;
        const diffY = (touchStartY.current || 0) - (touchEndY.current || 0);

        if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
            hasAdvancedRef.current = true;
            clearFallbackTimer();
            if (diffX > 0) {
                nextHeroSlide();
            } else {
                prevHeroSlide();
            }
        }
        touchStartX.current = null;
        touchStartY.current = null;
        touchEndX.current = null;
        touchEndY.current = null;
    };

    const normalizeProductCategory = (category) => {
        if (!category) return '';
        const c = String(category).toLowerCase().trim();
        if (c === 'ethnic' || c === 'ethnic-wear') return 'ethnic';
        if (c === 'western' || c === 'western-wear') return 'western';
        if (c === 'casual' || c === 'casual-wear') return 'casual-wear';
        if (c === 'party' || c === 'party-wear') return 'party-wear';
        if (c === 'festive' || c === 'festive-wear') return 'festive-wear';
        if (c === 'formal' || c === 'formal-wear') return 'formal-wear';
        if (c === 'wedding' || c === 'wedding-wear') return 'wedding-wear';
        return c;
    };

    const fetchProductsData = async () => {
        setProdLoading(true);
        setProdError(false);
        try {
            const prodRes = await axios.get(`${API}/products?limit=200`);
            const rawProducts = prodRes.data && Array.isArray(prodRes.data) ? prodRes.data : [];

            // Primary categories in exact order: Casual Wear, Ethnic Wear, Formal Wear, Western Wear
            const PRIMARY_CATEGORIES = ['casual-wear', 'ethnic', 'formal-wear', 'western'];
            // Fallback categories in exact priority order
            const FALLBACK_CATEGORIES = ['party-wear', 'festive-wear', 'wedding-wear'];

            // Index each product to preserve insertion sequence for tie-breaking
            const indexedProducts = rawProducts.map((p, idx) => ({ ...p, _rawIndex: idx }));

            const isValidProduct = (p) => {
                if (!p) return false;
                const isActive = p.active !== false && p.is_active !== false;
                const isNew = p.is_new === true;
                const hasWorkingImage = Boolean(
                    p.images &&
                    Array.isArray(p.images) &&
                    p.images.length > 0 &&
                    typeof p.images[0] === 'string' &&
                    p.images[0].trim() !== ''
                );
                return isActive && isNew && hasWorkingImage;
            };

            const getNewestForCategory = (catSlug) => {
                const candidates = indexedProducts.filter((p) => {
                    const normCat = normalizeProductCategory(p.category);
                    return normCat === catSlug && isValidProduct(p);
                });

                if (candidates.length === 0) return null;

                candidates.sort((a, b) => {
                    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
                        return timeB - timeA;
                    }
                    return b._rawIndex - a._rawIndex;
                });

                return candidates[0];
            };

            const selected = [];
            const usedCategories = new Set();
            let fallbackIdx = 0;

            PRIMARY_CATEGORIES.forEach((catSlug) => {
                const prod = getNewestForCategory(catSlug);
                if (prod) {
                    selected.push(prod);
                    usedCategories.add(catSlug);
                } else {
                    // Fallback to next available fallback category
                    while (fallbackIdx < FALLBACK_CATEGORIES.length) {
                        const fbCat = FALLBACK_CATEGORIES[fallbackIdx++];
                        if (!usedCategories.has(fbCat)) {
                            const fbProd = getNewestForCategory(fbCat);
                            if (fbProd) {
                                selected.push(fbProd);
                                usedCategories.add(fbCat);
                                break;
                            }
                        }
                    }
                }
            });

            // If still fewer than 4 products, fill remaining slots from fallback categories
            while (selected.length < 4 && fallbackIdx < FALLBACK_CATEGORIES.length) {
                const fbCat = FALLBACK_CATEGORIES[fallbackIdx++];
                if (!usedCategories.has(fbCat)) {
                    const fbProd = getNewestForCategory(fbCat);
                    if (fbProd) {
                        selected.push(fbProd);
                        usedCategories.add(fbCat);
                    }
                }
            }

            setProducts(selected.slice(0, 4));
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
            const [catRes, attrRes] = await Promise.all([
                axios.get(`${API}/categories`).catch(() => ({ data: [] })),
                axios.get(`${API}/attributes?with_counts=true`).catch(() => ({ data: {} }))
            ]);

            const loadedCats = catRes.data && catRes.data.length > 0 ? catRes.data : defaultCategories;

            // Map product counts by category value
            const countMap = {};
            if (attrRes.data && attrRes.data.category) {
                attrRes.data.category.forEach(c => {
                    countMap[c.value] = c.count || 0;
                });
            }

            const canonicalNames = {
                'formal-wear': 'Formal Wear',
                'casual-wear': 'Casual Wear',
                'ethnic': 'Ethnic Wear',
                'western': 'Western Wear',
                'party-wear': 'Party Wear',
                'wedding-wear': 'Wedding Wear',
                'festive-wear': 'Festive Wear'
            };

            const OFFICIAL_ORDER = [
                'formal-wear',
                'casual-wear',
                'ethnic',
                'western',
                'party-wear',
                'wedding-wear',
                'festive-wear'
            ];

            const resolvedCats = loadedCats
                .filter(cat => {
                    const norm = (cat.id || '').toLowerCase();
                    const nameNorm = (cat.name || '').toLowerCase();
                    // Hide Bridal Collection and Traditional Wear on Home page
                    if (norm === 'bridal' || nameNorm.includes('bridal')) return false;
                    if (norm === 'traditional' || nameNorm.includes('traditional')) return false;
                    return true;
                })
                .map(cat => {
                    const resolvedId = (cat.id === 'ethnic-wear' || cat.id === 'ethnic') ? 'ethnic'
                        : (cat.id === 'casual' || cat.id === 'casual-wear') ? 'casual-wear'
                        : (cat.id === 'formal' || cat.id === 'formal-wear') ? 'formal-wear'
                        : (cat.id === 'western' || cat.id === 'western-wear') ? 'western'
                        : (cat.id === 'party' || cat.id === 'party-wear') ? 'party-wear'
                        : (cat.id === 'wedding' || cat.id === 'wedding-wear') ? 'wedding-wear'
                        : (cat.id === 'festive' || cat.id === 'festive-wear') ? 'festive-wear'
                        : cat.id;

                    const resolvedHref = resolvedId === 'formal-wear' ? '/shop?category=formal-wear'
                        : resolvedId === 'casual-wear' ? '/shop?category=casual-wear'
                        : resolvedId === 'ethnic' ? '/shop?category=ethnic'
                        : resolvedId === 'western' ? '/shop?category=western'
                        : resolvedId === 'party-wear' ? '/shop?category=party-wear'
                        : resolvedId === 'wedding-wear' ? '/shop?category=wedding-wear'
                        : resolvedId === 'festive-wear' ? '/shop?category=festive-wear'
                        : cat.href || `/shop?category=${resolvedId}`;

                    return {
                        ...cat,
                        id: resolvedId,
                        name: canonicalNames[resolvedId] || cat.name,
                        href: resolvedHref
                    };
                });

            // Keep only the 7 official categories, ensure at least 1 product
            const catMap = new Map();
            resolvedCats.forEach(cat => {
                if (!OFFICIAL_ORDER.includes(cat.id)) return;
                const count = countMap[cat.id] !== undefined ? countMap[cat.id] : 1;
                if (count > 0 && !catMap.has(cat.id)) {
                    catMap.set(cat.id, cat);
                }
            });

            // Ensure fallbacks for any missing official category with products
            OFFICIAL_ORDER.forEach(id => {
                if (!catMap.has(id)) {
                    const fallback = defaultCategories.find(c => c.id === id);
                    const count = countMap[id] !== undefined ? countMap[id] : 1;
                    if (fallback && count > 0) {
                        catMap.set(id, fallback);
                    }
                }
            });

            // Strict sort in OFFICIAL_ORDER
            const sortedCats = OFFICIAL_ORDER
                .map(id => catMap.get(id))
                .filter(Boolean);

            setCategories(sortedCats);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setCatError(true);
            setCategories(defaultCategories);
        } finally {
            setCatLoading(false);
        }
    };

    return (
        <div className="bg-white text-[#1F2937] min-h-screen overflow-x-hidden" data-testid="home-page">
            {/* HERO SECTION */}
            <section 
                className="relative w-full bg-[#1A1412] overflow-hidden group border-b border-[#1F2937]" 
                data-testid="hero-section"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Desktop Full Viewport & Mobile Responsive Container */}
                <div className="relative w-full h-[540px] md:h-[580px] lg:h-[clamp(560px,42vw,720px)] overflow-hidden">
                    {/* Background layer */}
                    {heroBackground?.mode === 'gradient' ? (
                        <div 
                            className="absolute inset-0 w-full h-full pointer-events-none z-0"
                            style={{
                                background: 'radial-gradient(circle at 60% 40%, #3D0C22 0%, #200511 45%, #0D0207 100%)'
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-[#1A1412]">
                            {slides.map((slide, index) => {
                                const isActive = currentSlide === index;
                                const videoSrc = resolveSlideVideo(slide.video, index);
                                const posterSrc = resolveSlidePoster(slide.poster);
                                return (
                                    <div
                                        key={`bg-${slide.id || index}`}
                                        className={`absolute inset-0 w-full h-full transition-opacity duration-[600ms] ease-in-out ${
                                            isActive ? 'opacity-100 z-1' : 'opacity-0 z-0'
                                        }`}
                                    >
                                        {isMobile ? (
                                            posterSrc ? (
                                                <img
                                                    src={posterSrc}
                                                    alt=""
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                    className="w-full h-full object-cover"
                                                    style={{
                                                        filter: 'blur(8px) saturate(1.1) brightness(1.0)',
                                                        transform: 'scale(1.1)'
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-[#1A1412]" />
                                            )
                                        ) : (
                                            <video
                                                ref={el => { heroBgVideoRefs.current[index] = el; }}
                                                src={videoSrc}
                                                {...(posterSrc ? { poster: posterSrc } : {})}
                                                autoPlay={isActive}
                                                muted
                                                playsInline
                                                preload={isActive ? "auto" : "metadata"}
                                                className="w-full h-full object-cover"
                                                style={{
                                                    filter: 'blur(8px) saturate(1.1) brightness(1.0)',
                                                    transform: 'scale(1.1)'
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Left-to-right gradient overlay behind the text: ~rgba(0,0,0,0.55) at the far left fading to fully transparent by ~55% of width */}
                    <div 
                        className="absolute inset-0 pointer-events-none z-10" 
                        style={{ 
                            background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.35) 25%, rgba(0, 0, 0, 0.12) 42%, rgba(0, 0, 0, 0) 55%)'
                        }} 
                    />

                    {/* Foreground Slides */}
                    {slides.map((slide, index) => {
                        const isActive = currentSlide === index;

                        return (
                            <div 
                                key={slide.id || index}
                                className={`transition-opacity duration-700 ease-in-out absolute inset-0 w-full h-full ${
                                    isActive ? 'opacity-100 pointer-events-auto z-20' : 'opacity-0 pointer-events-none z-0'
                                }`}
                            >
                                <div className="w-full h-full relative overflow-hidden">
                                    {/* Right Window: framed portrait video window */}
                                    {slide.image ? (
                                        <div 
                                            className="flex absolute top-1/2 -translate-y-1/2 right-3 sm:right-6 lg:left-[72%] lg:right-auto lg:-translate-x-1/2 h-[68%] sm:h-[78%] lg:h-[85%] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl items-center justify-center border border-white/20 bg-black/20 z-20 pointer-events-auto"
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
                                            className="flex absolute top-1/2 -translate-y-1/2 right-3 sm:right-6 lg:left-[72%] lg:right-auto lg:-translate-x-1/2 h-[68%] sm:h-[78%] lg:h-[85%] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl items-center justify-center border border-white/20 bg-black/20 z-20 pointer-events-auto"
                                        >
                                            <video 
                                                ref={el => { heroWindowVideoRefs.current[index] = el; }}
                                                src={resolveSlideVideo(slide.video, index)}
                                                {...(resolveSlidePoster(slide.poster) ? { poster: resolveSlidePoster(slide.poster) } : {})}
                                                autoPlay={isActive}
                                                muted
                                                playsInline
                                                preload={isActive ? "auto" : "metadata"}
                                                onTimeUpdate={() => handleTimeUpdate(index)}
                                                onEnded={() => handleSlideEnded(index)}
                                                onError={(e) => handleHeroVideoError(slide.id || index, e)}
                                                className={`w-full h-full object-cover origin-top ${heroVideoErrors[slide.id || index] ? 'hidden' : 'block'}`}
                                                style={{ 
                                                    objectPosition: slide.objectPosition || 'center 35%'
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Content Overlay */}
                                    <div className="absolute inset-0 w-full h-full flex items-center pointer-events-none z-20">
                                        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[50px] pb-12 md:pb-0">
                                            <div className="max-w-[62%] sm:max-w-[55%] lg:max-w-[45%] pointer-events-auto text-left space-y-4">
                                                {/* BADGE / TAG */}
                                                <div>
                                                    <span 
                                                        className="border border-white/40 bg-black/25 backdrop-blur-xs text-white text-xs uppercase tracking-[0.2em] font-semibold px-3.5 py-1 rounded-full inline-block"
                                                        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                                                    >
                                                        {slide.label}
                                                    </span>
                                                </div>
                                                {/* HEADLINE: Two-tone */}
                                                <h1 
                                                    className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-[1.05] uppercase tracking-tight font-black"
                                                    style={{ textShadow: '0 2px 10px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.9)' }}
                                                >
                                                    <span className="block text-white">{slide.title1}</span>
                                                    <span className="block text-[#F3D9A0]">{slide.title2}</span>
                                                </h1>
                                                {/* SUBTEXT */}
                                                <p 
                                                    className="text-white/95 text-sm md:text-base leading-relaxed max-w-md font-medium"
                                                    style={{ textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}
                                                >
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

                    {/* Hero Slide Controls: Dots only in bottom pill */}
                    <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 pointer-events-auto bg-black/45 backdrop-blur-md px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full border border-white/20 shadow-lg select-none" role="tablist" aria-label="Hero slide indicators">
                        {slides.map((slide, index) => {
                            const isActive = currentSlide === index;
                            return (
                                <button
                                    key={slide.id || index}
                                    onClick={() => handleDotClick(index)}
                                    aria-label={`Go to slide ${index + 1}: ${slide.tabName || slide.title1}`}
                                    role="tab"
                                    aria-selected={isActive}
                                    className={`transition-all duration-300 cursor-pointer ${
                                        isActive 
                                            ? 'w-7 sm:w-8 h-2 sm:h-2.5 rounded-full bg-[#C2255C]' 
                                            : 'w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-white/50 hover:bg-white/80'
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
                        <div className="flex flex-wrap justify-center -m-1.5 sm:-m-2 md:-m-2.5">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="w-1/2 lg:w-1/4 p-1.5 sm:p-2 md:p-2.5 flex-none">
                                    <div className="aspect-[3/4] bg-[#E5E7EB]/50 animate-pulse rounded-xl md:rounded-2xl border border-[#E5E7EB]" />
                                </div>
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
                        <div className="flex flex-wrap justify-center -m-1.5 sm:-m-2 md:-m-2.5">
                            {categories.map((category) => {
                                const editorialImg = categoryEditorialImages[category.id] || category.image;
                                const categoryHref = (
                                    (category.id === 'formal' || category.id === 'formal-wear') ? '/shop?category=formal-wear' :
                                    (category.id === 'casual' || category.id === 'casual-wear') ? '/shop?category=casual-wear' :
                                    (category.id === 'ethnic' || category.id === 'ethnic-wear') ? '/shop?category=ethnic' :
                                    (category.id === 'western' || category.id === 'western-wear') ? '/shop?category=western' :
                                    (category.id === 'party' || category.id === 'party-wear') ? '/shop?category=party-wear' :
                                    (category.id === 'wedding' || category.id === 'wedding-wear') ? '/shop?category=wedding-wear' :
                                    (category.id === 'festive' || category.id === 'festive-wear') ? '/shop?category=festive-wear' :
                                    category.href || `/shop?category=${category.id}`
                                );
                                return (
                                    <div key={category.id} className="w-1/2 lg:w-1/4 p-1.5 sm:p-2 md:p-2.5 flex-none">
                                        <Link 
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
                                    </div>
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
                                {products.map((product) => (
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
                        
                        {/* Left Column (58% on Desktop): Text Content (stacked first on mobile) */}
                        <div className="w-full lg:w-[58%] text-center lg:text-left space-y-4">
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
                            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-5">
                                <Link 
                                    to="/about"
                                    className="px-6 sm:px-7 py-3 bg-[#C2255C] text-white text-xs sm:text-sm uppercase tracking-wider font-semibold rounded-xl hover:bg-[#9C1D49] transition-all shadow-xs inline-flex items-center justify-center"
                                >
                                    READ OUR STORY
                                </Link>
                                <Link 
                                    to="/our-stores" 
                                    className="text-xs uppercase tracking-[0.18em] font-semibold text-[#C2255C] hover:text-[#9C1D49] underline decoration-[#C2255C] underline-offset-4 transition-colors inline-flex items-center gap-1"
                                >
                                    <span>VISIT OUR STORE →</span>
                                </Link>
                            </div>
                        </div>

                        {/* Right Column (42% on Desktop): Photo Card (stacked below text on mobile, right on desktop) */}
                        <div className="w-full lg:w-[42%] flex justify-center lg:justify-end items-center">
                            <div className="w-full max-w-[480px] aspect-[4/3] rounded-2xl overflow-hidden shadow-md lg:shadow-lg border border-white/90 bg-white">
                                <img 
                                    src="/images/story/story-design-sketchbook.jpg" 
                                    alt="Jaridar Fashion Couture Design Sketchbook" 
                                    width="736"
                                    height="552"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* WHY JARIDAR */}
            <section className="py-10 md:py-14 lg:py-16 bg-white border-b border-[#E5E7EB]" data-testid="why-jaridar-section">
                <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px]">
                    <SectionHeader 
                        label="THE JARIDAR DIFFERENCE" 
                        title="Why Jaridar" 
                        align="center"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-6xl mx-auto">
                        {/* 1. Custom Stitching & Designing */}
                        <Link 
                            to="/contact" 
                            className="group bg-white p-6 sm:p-7 rounded-2xl border border-[#E5E7EB] shadow-xs hover:border-[#C2255C] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-start space-y-3.5 block"
                        >
                            <div className="w-11 h-11 rounded-xl bg-[#E8F0F8] text-[#3B6FA0] group-hover:bg-[#C2255C]/10 group-hover:text-[#C2255C] transition-colors flex items-center justify-center flex-shrink-0">
                                <Scissors size={20} className="stroke-[1.75]" />
                            </div>
                            <div className="space-y-1.5 text-left">
                                <h3 className="font-heading text-base md:text-lg font-bold text-[#1F2937] group-hover:text-[#C2255C] transition-colors leading-snug">
                                    Custom Stitching & Designing
                                </h3>
                                <p className="text-sm text-[#4B5563] leading-relaxed">
                                    Outfits stitched and designed as per your style and fit.
                                </p>
                            </div>
                        </Link>

                        {/* 2. Reference Pictures Welcome */}
                        <Link 
                            to="/contact" 
                            className="group bg-white p-6 sm:p-7 rounded-2xl border border-[#E5E7EB] shadow-xs hover:border-[#C2255C] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-start space-y-3.5 block"
                        >
                            <div className="w-11 h-11 rounded-xl bg-[#E8F0F8] text-[#3B6FA0] group-hover:bg-[#C2255C]/10 group-hover:text-[#C2255C] transition-colors flex items-center justify-center flex-shrink-0">
                                <Camera size={20} className="stroke-[1.75]" />
                            </div>
                            <div className="space-y-1.5 text-left">
                                <h3 className="font-heading text-base md:text-lg font-bold text-[#1F2937] group-hover:text-[#C2255C] transition-colors leading-snug">
                                    Reference Pictures Welcome
                                </h3>
                                <p className="text-sm text-[#4B5563] leading-relaxed">
                                    Share your idea or reference photos, we make it for you.
                                </p>
                            </div>
                        </Link>

                        {/* 3. Visit Our Wakad Boutique */}
                        <Link 
                            to="/our-stores" 
                            className="group bg-white p-6 sm:p-7 rounded-2xl border border-[#E5E7EB] shadow-xs hover:border-[#C2255C] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-start space-y-3.5 block"
                        >
                            <div className="w-11 h-11 rounded-xl bg-[#E8F0F8] text-[#3B6FA0] group-hover:bg-[#C2255C]/10 group-hover:text-[#C2255C] transition-colors flex items-center justify-center flex-shrink-0">
                                <Store size={20} className="stroke-[1.75]" />
                            </div>
                            <div className="space-y-1.5 text-left">
                                <h3 className="font-heading text-base md:text-lg font-bold text-[#1F2937] group-hover:text-[#C2255C] transition-colors leading-snug">
                                    Visit Our Wakad Boutique
                                </h3>
                                <p className="text-sm text-[#4B5563] leading-relaxed">
                                    Come see fabrics and designs in person.
                                </p>
                            </div>
                        </Link>

                        {/* 4. Made for Every Occasion */}
                        <Link 
                            to="/shop" 
                            className="group bg-white p-6 sm:p-7 rounded-2xl border border-[#E5E7EB] shadow-xs hover:border-[#C2255C] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-start space-y-3.5 block"
                        >
                            <div className="w-11 h-11 rounded-xl bg-[#E8F0F8] text-[#3B6FA0] group-hover:bg-[#C2255C]/10 group-hover:text-[#C2255C] transition-colors flex items-center justify-center flex-shrink-0">
                                <Sparkles size={20} className="stroke-[1.75]" />
                            </div>
                            <div className="space-y-1.5 text-left">
                                <h3 className="font-heading text-base md:text-lg font-bold text-[#1F2937] group-hover:text-[#C2255C] transition-colors leading-snug">
                                    Made for Every Occasion
                                </h3>
                                <p className="text-sm text-[#4B5563] leading-relaxed">
                                    Casual, festive, party and wedding wear.
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CLIENT EDITS */}
            {(() => {
                const activeClientReviews = (clientReviews || []).filter(
                    (c) => c && typeof c.review === 'string' && c.review.trim().length > 0
                );
                if (activeClientReviews.length === 0) return null;

                return (
                    <section className="py-10 md:py-14 lg:py-16 bg-white border-b border-[#E5E7EB]" data-testid="client-edits-section">
                        <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px]">
                            <SectionHeader 
                                label="CLIENT DIARIES" 
                                title="Client Edits" 
                                align="center" 
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
                                {activeClientReviews.map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E5E7EB] shadow-xs hover:border-[#C2255C] hover:shadow-md transition-all flex flex-col justify-between h-full"
                                    >
                                        <div className="space-y-3">
                                            {item.photo && item.photo.trim() !== '' && (
                                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#C2255C]/30 mb-2">
                                                    <img 
                                                        src={item.photo} 
                                                        alt={item.name} 
                                                        className="w-full h-full object-cover" 
                                                        loading="lazy" 
                                                        decoding="async" 
                                                    />
                                                </div>
                                            )}
                                            <p className="text-[#4B5563] text-sm sm:text-base leading-relaxed">
                                                "{item.review.trim()}"
                                            </p>
                                        </div>
                                        <div className="mt-5 pt-4 border-t border-[#F3F4F6] flex items-center justify-between">
                                            <div>
                                                <p className="font-heading text-sm md:text-base font-bold text-[#1F2937]">
                                                    {item.name}
                                                </p>
                                                {item.city && item.city.trim() !== '' && (
                                                    <p className="text-xs text-[#C2255C] font-semibold uppercase tracking-wider">
                                                        {item.city}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="w-9 h-9 rounded-full bg-[#FBF0EC] text-[#C2255C] font-heading font-bold text-sm flex items-center justify-center flex-shrink-0">
                                                {item.name ? item.name.charAt(0).toUpperCase() : 'J'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                );
            })()}

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
