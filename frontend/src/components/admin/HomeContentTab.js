import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    Save, UploadCloud, RefreshCw, Check, AlertCircle, Eye, 
    Image as ImageIcon, Video, Trash2, Sparkles, Sliders
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_SITE_CONTENT = {
    announcement: {
        enabled: true,
        messages: [
            { prefix: "BUY 1 GET ", highlight: "20% OFF", suffix: "" },
            { prefix: "BUY 2 GET EXTRA ", highlight: "₹500 OFF", suffix: "" },
            { prefix: "FREE SHIPPING ON ORDERS ABOVE ₹2999", highlight: "", suffix: "" }
        ]
    },
    hero_slides: [
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
    ]
};

export const HomeContentTab = () => {
    const [content, setContent] = useState(DEFAULT_SITE_CONTENT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingSlide, setUploadingSlide] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const slide0FileInputRef = useRef(null);
    const slide1FileInputRef = useRef(null);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/site-content`);
            if (res.data) {
                const safeAnnouncement = res.data.announcement || DEFAULT_SITE_CONTENT.announcement;
                const safeSlides = (res.data.hero_slides && res.data.hero_slides.length === 2)
                    ? res.data.hero_slides
                    : DEFAULT_SITE_CONTENT.hero_slides;

                // Ensure at least 3 message slots exist for editing
                const msgs = [...(safeAnnouncement.messages || [])];
                while (msgs.length < 3) {
                    msgs.push({ prefix: '', highlight: '', suffix: '' });
                }

                setContent({
                    announcement: {
                        enabled: safeAnnouncement.enabled !== false,
                        messages: msgs.slice(0, 3)
                    },
                    hero_slides: safeSlides
                });
            }
        } catch (err) {
            console.error('Failed to fetch site content:', err);
            toast.error('Failed to load current content. Using default values.');
        } finally {
            setLoading(false);
        }
    };

    // Announcement Handlers
    const handleToggleAnnouncement = () => {
        setContent(prev => ({
            ...prev,
            announcement: {
                ...prev.announcement,
                enabled: !prev.announcement.enabled
            }
        }));
        setSaveSuccess(false);
    };

    const handleMessageChange = (index, field, value) => {
        setContent(prev => {
            const updated = [...prev.announcement.messages];
            updated[index] = {
                ...updated[index],
                [field]: value
            };
            return {
                ...prev,
                announcement: {
                    ...prev.announcement,
                    messages: updated
                }
            };
        });
        setSaveSuccess(false);
    };

    // Hero Slide Handlers
    const handleSlideChange = (slideIndex, field, value) => {
        setContent(prev => {
            const updated = [...prev.hero_slides];
            updated[slideIndex] = {
                ...updated[slideIndex],
                [field]: value
            };
            return {
                ...prev,
                hero_slides: updated
            };
        });
        setSaveSuccess(false);
    };

    // Image Upload Handler
    const handleImageUpload = async (slideIndex, file) => {
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size exceeds 5MB limit.');
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload a JPG, PNG, or WebP image.');
            return;
        }

        setUploadingSlide(slideIndex);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('jaridar_token');
            const res = await axios.post(`${API}/admin/products/upload-image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            const uploadedUrl = res.data?.url || res.data?.image_url;
            if (uploadedUrl) {
                handleSlideChange(slideIndex, 'image', uploadedUrl);
                toast.success(`Photo uploaded for Slide ${slideIndex + 1}! Click "Save Changes" to publish.`);
            } else {
                throw new Error('Upload succeeded but no URL was returned.');
            }
        } catch (err) {
            console.error('Image upload failed:', err);
            const msg = err.response?.data?.detail || 'Failed to upload photo.';
            toast.error(msg);
        } finally {
            setUploadingSlide(null);
            if (slideIndex === 0 && slide0FileInputRef.current) slide0FileInputRef.current.value = '';
            if (slideIndex === 1 && slide1FileInputRef.current) slide1FileInputRef.current.value = '';
        }
    };

    const handleRemoveSlideImage = (slideIndex) => {
        handleSlideChange(slideIndex, 'image', '');
        toast.info(`Slide ${slideIndex + 1} will use the default store video. Click "Save Changes" to publish.`);
    };

    // Save All
    const handleSave = async () => {
        setSaving(true);
        setSaveSuccess(false);

        try {
            const token = localStorage.getItem('jaridar_token');
            const payload = {
                announcement: {
                    enabled: content.announcement.enabled,
                    messages: content.announcement.messages
                        .filter(m => (m.prefix || m.highlight || m.suffix || '').trim() !== '')
                },
                hero_slides: content.hero_slides
            };

            const res = await axios.put(`${API}/admin/site-content`, payload, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            if (res.data) {
                setSaveSuccess(true);
                toast.success('Home content saved and published successfully!');
                setTimeout(() => setSaveSuccess(false), 4000);
            }
        } catch (err) {
            console.error('Failed to save site content:', err);
            const msg = err.response?.data?.detail || 'Failed to save changes. Please try again.';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="py-20 text-center text-[#595959]" data-testid="home-content-loading">
                <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-rose" />
                <p className="text-sm font-medium">Loading Home Content settings...</p>
            </div>
        );
    }

    const activeMessages = content.announcement.messages.filter(
        m => (m.prefix || m.highlight || m.suffix || '').trim() !== ''
    );

    return (
        <div className="space-y-8" data-testid="home-content-tab">
            {/* Action Bar Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs">
                <div>
                    <h3 className="text-lg font-serif font-medium text-charcoal flex items-center gap-2">
                        <Sliders size={20} className="text-rose" />
                        Home Page Content Manager
                    </h3>
                    <p className="text-xs text-[#595959] mt-0.5">
                        Customize the top announcement bar and the 2 hero banner slides shown to visitors.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {saveSuccess && (
                        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md font-medium">
                            <Check size={14} /> Saved & Published
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 text-xs uppercase tracking-wider font-semibold shadow-xs"
                        data-testid="save-home-content-btn"
                    >
                        {saving ? (
                            <>
                                <RefreshCw size={15} className="animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={15} />
                                <span>Save Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* SECTION 1: ANNOUNCEMENT BAR */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden" data-testid="announcement-section">
                <div className="px-6 py-4 bg-[#FDFBF7] border-b border-[#E5E7EB] flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-sm text-charcoal flex items-center gap-2">
                            <span>1. Announcement Bar</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose/10 text-rose border border-rose/20">
                                Top of site
                            </span>
                        </h4>
                        <p className="text-xs text-[#595959] mt-0.5">
                            Displays offer messages at the very top of every page.
                        </p>
                    </div>

                    {/* On/Off Switch */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-charcoal">
                            {content.announcement.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={content.announcement.enabled}
                            onClick={handleToggleAnnouncement}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                content.announcement.enabled ? 'bg-[#C2255C]' : 'bg-gray-300'
                            }`}
                            data-testid="announcement-toggle-btn"
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    content.announcement.enabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Live Preview */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#4B5563] flex items-center gap-1.5">
                                <Eye size={14} className="text-rose" />
                                Announcement Bar Live Preview
                            </span>
                            {!content.announcement.enabled && (
                                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
                                    Currently Hidden on Storefront
                                </span>
                            )}
                        </div>

                        <div 
                            className={`rounded-lg overflow-hidden transition-all ${
                                !content.announcement.enabled ? 'opacity-50 ring-2 ring-dashed ring-gray-300' : 'shadow-xs'
                            }`}
                        >
                            <div className="bg-[#C2255C] h-10 flex items-center justify-center px-4 text-center">
                                {activeMessages.length > 0 ? (
                                    <div className="flex items-center justify-center gap-3 text-xs md:text-sm uppercase tracking-wide overflow-x-auto">
                                        {activeMessages.map((msg, idx) => (
                                            <span key={idx} className="flex items-center gap-3 whitespace-nowrap">
                                                {idx > 0 && <span className="text-white/40 font-normal">|</span>}
                                                <span>
                                                    <span className="font-medium text-white">{msg.prefix}</span>
                                                    {msg.highlight && (
                                                        <span className="font-bold text-[#F3D9A0] mx-1">{msg.highlight}</span>
                                                    )}
                                                    {msg.suffix && (
                                                        <span className="font-medium text-white">{msg.suffix}</span>
                                                    )}
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-white/70 italic">
                                        No active announcement messages. Enter messages below.
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Messages Inputs */}
                    <div className="space-y-4">
                        <label className="text-xs uppercase tracking-wider font-semibold text-charcoal block">
                            Offer Messages (Up to 3)
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {content.announcement.messages.map((msg, index) => (
                                <div key={index} className="p-4 bg-[#FDFBF7] border border-[#E5E7EB] rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
                                            Message {index + 1}
                                        </span>
                                        <span className="text-[10px] text-[#595959]">
                                            {index === 0 ? 'Offer 1' : index === 1 ? 'Offer 2' : 'Free Shipping / Info'}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-medium text-[#4B5563] block mb-1">
                                            Offer Text / Prefix
                                        </label>
                                        <input
                                            type="text"
                                            value={msg.prefix || ''}
                                            onChange={(e) => handleMessageChange(index, 'prefix', e.target.value)}
                                            placeholder={index === 0 ? 'BUY 1 GET ' : index === 1 ? 'BUY 2 GET EXTRA ' : 'FREE SHIPPING ON ORDERS ABOVE '}
                                            className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-rose"
                                            data-testid={`announcement-prefix-${index}`}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-medium text-[#4B5563] block mb-1 flex items-center justify-between">
                                            <span>Highlighted Text (Gold)</span>
                                            <span className="text-[10px] text-amber-600 font-semibold">Optional</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={msg.highlight || ''}
                                            onChange={(e) => handleMessageChange(index, 'highlight', e.target.value)}
                                            placeholder={index === 0 ? '20% OFF' : index === 1 ? '₹500 OFF' : '₹2999'}
                                            className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-rose text-amber-800 font-medium"
                                            data-testid={`announcement-highlight-${index}`}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-medium text-[#4B5563] block mb-1">
                                            Suffix (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={msg.suffix || ''}
                                            onChange={(e) => handleMessageChange(index, 'suffix', e.target.value)}
                                            placeholder="e.g. USE CODE: JARIDAR"
                                            className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-rose"
                                            data-testid={`announcement-suffix-${index}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: HERO BANNER (2 SLIDES) */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden" data-testid="hero-slides-section">
                <div className="px-6 py-4 bg-[#FDFBF7] border-b border-[#E5E7EB]">
                    <h4 className="font-semibold text-sm text-charcoal flex items-center gap-2">
                        <span>2. Hero Banner Slides</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose/10 text-rose border border-rose/20">
                            Exactly 2 Slides
                        </span>
                    </h4>
                    <p className="text-xs text-[#595959] mt-0.5">
                        Edit titles, descriptions, button links, and upload an optional custom photo to replace the background video for each slide.
                    </p>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {content.hero_slides.map((slide, index) => {
                            const fileInputRef = index === 0 ? slide0FileInputRef : slide1FileInputRef;
                            const isUploading = uploadingSlide === index;

                            return (
                                <div 
                                    key={slide.id || index}
                                    className="p-5 bg-[#FDFBF7] border border-[#E5E7EB] rounded-2xl space-y-4 flex flex-col justify-between"
                                    data-testid={`hero-slide-editor-${index}`}
                                >
                                    <div className="space-y-4">
                                        {/* Slide Header */}
                                        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-[#1A1412] text-white text-xs font-bold flex items-center justify-center">
                                                    {index + 1}
                                                </span>
                                                <h5 className="font-semibold text-sm text-charcoal">
                                                    Slide {index + 1}: {slide.tabName || `Slide ${index + 1}`}
                                                </h5>
                                            </div>

                                            {/* Media State Badge */}
                                            {slide.image ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                                                    <ImageIcon size={12} /> Custom Photo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                                    <Video size={12} /> Default Store Video
                                                </span>
                                            )}
                                        </div>

                                        {/* Tab Name & Label */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[11px] font-semibold text-charcoal block mb-1">
                                                    Tab Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={slide.tabName || ''}
                                                    onChange={(e) => handleSlideChange(index, 'tabName', e.target.value)}
                                                    placeholder="NEW SEASON"
                                                    className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-rose font-medium"
                                                    data-testid={`slide-${index}-tabName`}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-semibold text-charcoal block mb-1">
                                                    Badge Label
                                                </label>
                                                <input
                                                    type="text"
                                                    value={slide.label || ''}
                                                    onChange={(e) => handleSlideChange(index, 'label', e.target.value)}
                                                    placeholder="JUST IN"
                                                    className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-rose font-medium"
                                                    data-testid={`slide-${index}-label`}
                                                />
                                            </div>
                                        </div>

                                        {/* Title Lines */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[11px] font-semibold text-charcoal block mb-1">
                                                    Title Line 1 (White)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={slide.title1 || ''}
                                                    onChange={(e) => handleSlideChange(index, 'title1', e.target.value)}
                                                    placeholder="NEW SEASON"
                                                    className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-rose font-medium"
                                                    data-testid={`slide-${index}-title1`}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-semibold text-charcoal block mb-1">
                                                    Title Line 2 (Gold Accent)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={slide.title2 || ''}
                                                    onChange={(e) => handleSlideChange(index, 'title2', e.target.value)}
                                                    placeholder="ARRIVALS"
                                                    className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-rose text-amber-800 font-medium"
                                                    data-testid={`slide-${index}-title2`}
                                                />
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="text-[11px] font-semibold text-charcoal block mb-1">
                                                Description
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={slide.description || ''}
                                                onChange={(e) => handleSlideChange(index, 'description', e.target.value)}
                                                placeholder="Fresh co-ords, kurtas and dresses, now in store."
                                                className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-rose resize-none"
                                                data-testid={`slide-${index}-description`}
                                            />
                                        </div>

                                        {/* Button Text & Button Link */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[11px] font-semibold text-charcoal block mb-1">
                                                    Button Text
                                                </label>
                                                <input
                                                    type="text"
                                                    value={slide.buttonText || ''}
                                                    onChange={(e) => handleSlideChange(index, 'buttonText', e.target.value)}
                                                    placeholder="SHOP NEW ARRIVALS"
                                                    className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-rose font-medium"
                                                    data-testid={`slide-${index}-buttonText`}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-semibold text-charcoal block mb-1">
                                                    Button Link
                                                </label>
                                                <input
                                                    type="text"
                                                    value={slide.link || ''}
                                                    onChange={(e) => handleSlideChange(index, 'link', e.target.value)}
                                                    placeholder="/shop?filter=new"
                                                    className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-rose font-mono"
                                                    data-testid={`slide-${index}-link`}
                                                />
                                            </div>
                                        </div>

                                        {/* Media / Photo Upload Block */}
                                        <div className="pt-2">
                                            <label className="text-[11px] font-semibold text-charcoal block mb-2 flex items-center justify-between">
                                                <span>Slide Background Media</span>
                                                <span className="text-[10px] text-[#595959]">Photo overrides video</span>
                                            </label>

                                            {slide.image ? (
                                                /* Uploaded Photo Preview Card */
                                                <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 flex items-center gap-3">
                                                    <div className="w-16 h-16 rounded-lg bg-black/10 overflow-hidden shrink-0 border border-[#E5E7EB]">
                                                        <img 
                                                            src={slide.image} 
                                                            alt={`Slide ${index + 1} background`}
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                                                            Active Photo
                                                        </span>
                                                        <p className="text-xs text-charcoal truncate font-mono">
                                                            {slide.image}
                                                        </p>
                                                        <span className="text-[11px] text-[#595959]">
                                                            Shown instead of video
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            disabled={isUploading}
                                                            className="text-xs text-rose hover:text-rose-hover font-semibold px-2 py-1 rounded hover:bg-rose/5"
                                                        >
                                                            Replace
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveSlideImage(index)}
                                                            className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                                            title="Revert to default video"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Default Video State + Upload Option */
                                                <div className="bg-white border border-dashed border-[#E5E7EB] rounded-xl p-4 text-center">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                                                        <Video size={20} />
                                                    </div>
                                                    <p className="text-xs font-medium text-charcoal">
                                                        Using default store video ({slide.video})
                                                    </p>
                                                    <p className="text-[11px] text-[#595959] mb-3">
                                                        Upload a high-res photo to display instead of the video.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={isUploading}
                                                        className="btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-1.5 cursor-pointer"
                                                        data-testid={`slide-${index}-upload-btn`}
                                                    >
                                                        {isUploading ? (
                                                            <>
                                                                <RefreshCw size={13} className="animate-spin" />
                                                                <span>Uploading...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UploadCloud size={13} />
                                                                <span>Upload Slide Photo</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}

                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        handleImageUpload(index, e.target.files[0]);
                                                    }
                                                }}
                                                className="hidden"
                                                data-testid={`slide-${index}-file-input`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Save Button Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
                {saveSuccess && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-md font-medium">
                        <Check size={14} /> Home content saved & published
                    </span>
                )}
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex items-center justify-center gap-2 px-8 py-3 text-xs uppercase tracking-wider font-semibold shadow-sm"
                    data-testid="save-home-content-bottom-btn"
                >
                    {saving ? (
                        <>
                            <RefreshCw size={16} className="animate-spin" />
                            <span>Saving Changes...</span>
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            <span>Save Changes</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
