import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Sparkles, UploadCloud, Download, RefreshCw, AlertCircle, 
    Lock, Check, Image as ImageIcon, ArrowRight, ShieldCheck, Info
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const TryOnModal = ({ isOpen, onClose, product, isAuthenticated }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);

    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [consent, setConsent] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultImage, setResultImage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [quota, setQuota] = useState({ daily_used: 0, daily_limit: 5, remaining: 5 });
    const [fetchingQuota, setFetchingQuota] = useState(false);

    // Fetch quota whenever modal opens for an authenticated user
    useEffect(() => {
        if (isOpen && isAuthenticated) {
            fetchQuota();
        }
    }, [isOpen, isAuthenticated]);

    // Clean up preview object URL on unmount or file change
    useEffect(() => {
        return () => {
            if (photoPreview && photoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    // Reset internal state when modal closes
    useEffect(() => {
        if (!isOpen) {
            handleReset();
        }
    }, [isOpen]);

    const fetchQuota = async () => {
        setFetchingQuota(true);
        try {
            const res = await axios.get(`${API}/tryon/quota`);
            if (res.data) {
                setQuota(res.data);
            }
        } catch (err) {
            // Non-critical: fail gracefully
            console.error('Failed to load try-on quota:', err);
        } finally {
            setFetchingQuota(false);
        }
    };

    const handleFileValidationAndSet = (file) => {
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            const err = 'Please upload a valid JPG, PNG, or WebP photo.';
            setErrorMessage(err);
            toast.error(err);
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            const err = 'Photo exceeds the 5MB file size limit. Please choose a smaller photo.';
            setErrorMessage(err);
            toast.error(err);
            return;
        }

        setErrorMessage(null);
        setPhotoFile(file);
        if (photoPreview && photoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(photoPreview);
        }
        setPhotoPreview(URL.createObjectURL(file));
        setResultImage(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
            handleFileValidationAndSet(e.dataTransfer.files[0]);
        }
    };

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileValidationAndSet(e.target.files[0]);
        }
    };

    const handleReset = () => {
        if (photoPreview && photoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(photoPreview);
        }
        setPhotoFile(null);
        setPhotoPreview(null);
        setResultImage(null);
        setErrorMessage(null);
        setConsent(false);
        setIsGenerating(false);
    };

    const handleGenerate = async () => {
        if (!consent) {
            toast.error('Please agree to the AI preview consent before generating.');
            return;
        }
        if (!photoFile) {
            toast.error('Please upload a photo of yourself first.');
            return;
        }
        if (!product?.id) {
            toast.error('Product details missing.');
            return;
        }
        if (quota.remaining <= 0) {
            const limitErr = `You have reached your daily limit of ${quota.daily_limit} virtual try-ons. Please try again tomorrow!`;
            setErrorMessage(limitErr);
            toast.error(limitErr);
            return;
        }

        setIsGenerating(true);
        setErrorMessage(null);

        const formData = new FormData();
        formData.append('file', photoFile);
        formData.append('product_id', product.id);

        try {
            const response = await axios.post(`${API}/tryon`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data?.image || response.data?.image_url) {
                setResultImage(response.data.image || response.data.image_url);
                if (response.data.remaining !== undefined) {
                    setQuota(prev => ({
                        ...prev,
                        daily_used: response.data.daily_used,
                        remaining: response.data.remaining,
                    }));
                }
                toast.success('Your virtual try-on preview is ready!');
            } else {
                throw new Error('No image returned from AI service.');
            }
        } catch (error) {
            console.error('Try-on error:', error);
            const detailMsg = error.response?.data?.detail 
                || (typeof error.response?.data === 'string' ? error.response.data : null)
                || error.message 
                || 'Failed to generate virtual try-on. Please try again.';
            setErrorMessage(detailMsg);
            toast.error(detailMsg);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!resultImage) return;
        try {
            const link = document.createElement('a');
            link.href = resultImage;
            const safeName = (product?.name || 'garment')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            link.download = `jaridar-tryon-${safeName}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Preview downloaded successfully!');
        } catch (err) {
            console.error('Download error:', err);
            toast.error('Failed to trigger download.');
        }
    };

    const handleRedirectToLogin = () => {
        onClose();
        navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
                onClick={onClose}
                data-testid="try-on-modal-overlay"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-3xl bg-[#FDFBF7] border border-[#E5E7EB] rounded-2xl shadow-2xl overflow-hidden my-auto"
                    data-testid="try-on-modal"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-white/80 backdrop-blur-md">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-rose/10 flex items-center justify-center text-rose">
                                <Sparkles size={16} />
                            </div>
                            <div>
                                <h3 className="font-serif text-xl font-medium text-[#1A1A1A] tracking-tight">
                                    Virtual Try-On
                                </h3>
                                <p className="text-xs text-[#595959]">
                                    {product?.name || 'Exclusive Couture Piece'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {isAuthenticated && quota && (
                                <span 
                                    className={`hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                                        quota.remaining > 0 
                                            ? 'bg-rose/5 border-rose/20 text-rose font-medium' 
                                            : 'bg-red-50 border-red-200 text-red-600 font-medium'
                                    }`}
                                    title="Try-on limit resets daily"
                                >
                                    <Sparkles size={12} />
                                    <span>{quota.remaining} of {quota.daily_limit} try-ons left today</span>
                                </span>
                            )}
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[#595959] hover:text-[#1A1A1A] hover:bg-black/5 transition-colors"
                                aria-label="Close dialog"
                                data-testid="try-on-close-btn"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                        {!isAuthenticated ? (
                            /* Guest / Not Logged In View */
                            <div className="text-center py-10 px-4 max-w-md mx-auto" data-testid="try-on-login-prompt">
                                <div className="w-14 h-14 rounded-full bg-rose/10 text-rose flex items-center justify-center mx-auto mb-4">
                                    <Lock size={24} />
                                </div>
                                <h4 className="font-serif text-2xl font-normal text-[#1A1A1A] mb-2">
                                    Please Log In to Try On
                                </h4>
                                <p className="text-sm text-[#595959] leading-relaxed mb-6">
                                    Virtual Try-On is exclusively available to registered members. Sign in to your Jaridar account to see how this couture piece looks on you.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button
                                        onClick={handleRedirectToLogin}
                                        className="btn-primary px-6 py-2.5 flex items-center justify-center gap-2 text-sm"
                                        data-testid="try-on-login-btn"
                                    >
                                        <span>Log In to Continue</span>
                                        <ArrowRight size={15} />
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="btn-outline px-6 py-2.5 text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : resultImage ? (
                            /* Result View (Side by Side) */
                            <div className="space-y-6" data-testid="try-on-result-view">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Original Photo */}
                                    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
                                        <div className="px-3.5 py-2 bg-gray-50 border-b border-[#E5E7EB] flex items-center justify-between text-xs font-semibold text-[#595959] uppercase tracking-wider">
                                            <span>Your Photo</span>
                                            <span className="text-[10px] text-gray-400">Original</span>
                                        </div>
                                        <div className="aspect-3/4 w-full bg-[#F3F4F6] flex items-center justify-center overflow-hidden">
                                            {photoPreview ? (
                                                <img 
                                                    src={photoPreview} 
                                                    alt="Original uploaded photo" 
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <ImageIcon size={32} className="text-gray-400" />
                                            )}
                                        </div>
                                    </div>

                                    {/* AI Result */}
                                    <div className="bg-white border-2 border-rose/40 rounded-xl overflow-hidden shadow-md relative">
                                        <div className="px-3.5 py-2 bg-rose/10 border-b border-rose/20 flex items-center justify-between text-xs font-semibold text-rose uppercase tracking-wider">
                                            <span className="flex items-center gap-1.5">
                                                <Sparkles size={13} />
                                                <span>Virtual Try-On</span>
                                            </span>
                                            <span className="text-[10px] bg-rose text-white px-2 py-0.5 rounded-full uppercase">
                                                AI Preview
                                            </span>
                                        </div>
                                        <div className="aspect-3/4 w-full bg-[#F3F4F6] flex items-center justify-center overflow-hidden">
                                            <img 
                                                src={resultImage} 
                                                alt="AI-generated virtual try-on preview" 
                                                className="w-full h-full object-contain"
                                                data-testid="try-on-result-image"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Mandatory Disclaimer Note */}
                                <div className="flex items-center justify-center gap-2 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-800">
                                    <Info size={15} className="shrink-0 text-amber-600" />
                                    <span className="font-medium" data-testid="try-on-disclaimer">
                                        AI-generated preview. Actual fit may differ.
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                                    <button
                                        onClick={handleReset}
                                        className="btn-outline flex items-center justify-center gap-2 py-2.5 px-5 text-xs tracking-wider uppercase font-semibold"
                                        data-testid="try-another-btn"
                                    >
                                        <RefreshCw size={14} />
                                        <span>Try Another Photo</span>
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className="btn-primary flex items-center justify-center gap-2 py-2.5 px-6 text-xs tracking-wider uppercase font-semibold shadow-sm"
                                        data-testid="try-on-download-btn"
                                    >
                                        <Download size={15} />
                                        <span>Download Preview</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Setup & Upload View */
                            <div className="space-y-6">
                                {/* Error Message Display */}
                                {errorMessage && (
                                    <div 
                                        className="flex items-start gap-3 p-4 bg-rose/10 border border-rose/30 rounded-xl text-xs text-[#1A1A1A]"
                                        data-testid="try-on-error-alert"
                                    >
                                        <AlertCircle size={18} className="shrink-0 text-rose mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-semibold text-rose mb-0.5">Could not complete try-on</p>
                                            <p className="text-[#595959] leading-relaxed">{errorMessage}</p>
                                        </div>
                                        <button 
                                            onClick={() => setErrorMessage(null)} 
                                            className="text-gray-400 hover:text-charcoal"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}

                                {/* Product Reference Pill */}
                                <div className="flex items-center gap-3 p-3 bg-white border border-[#E5E7EB] rounded-xl">
                                    {product?.images?.[0] ? (
                                        <img 
                                            src={product.images[0]} 
                                            alt={product.name} 
                                            className="w-12 h-14 object-cover rounded-md border border-[#E5E7EB]"
                                        />
                                    ) : (
                                        <div className="w-12 h-14 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                                            <ImageIcon size={20} />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[10px] uppercase tracking-wider text-rose font-semibold block">
                                            Trying On Garment
                                        </span>
                                        <h4 className="text-sm font-medium text-[#1A1A1A] truncate">
                                            {product?.name}
                                        </h4>
                                        <p className="text-xs text-[#595959]">
                                            ₹{product?.price?.toLocaleString?.() || product?.price}
                                        </p>
                                    </div>
                                    {quota && (
                                        <div className="text-right sm:hidden">
                                            <span className="text-[10px] font-semibold text-rose bg-rose/10 px-2 py-0.5 rounded-full">
                                                {quota.remaining} left
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Drag and Drop Upload Zone */}
                                <div>
                                    <label className="text-xs uppercase tracking-wider font-semibold text-charcoal block mb-2">
                                        Upload Your Full-Length Photo
                                    </label>

                                    {!photoPreview ? (
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                                isDragging
                                                    ? 'border-rose bg-rose/5 scale-[1.01]'
                                                    : 'border-[#E5E7EB] hover:border-rose/50 bg-white hover:bg-rose/5'
                                            }`}
                                            data-testid="try-on-dropzone"
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={handleFileInputChange}
                                                className="hidden"
                                                data-testid="try-on-file-input"
                                            />
                                            <div className="w-12 h-12 rounded-full bg-rose/10 text-rose flex items-center justify-center mx-auto mb-3">
                                                <UploadCloud size={24} />
                                            </div>
                                            <p className="text-sm font-medium text-[#1A1A1A] mb-1">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-xs text-[#595959] mb-3">
                                                JPG, PNG, or WebP (max. 5MB)
                                            </p>
                                            <span className="inline-flex items-center gap-1 text-[11px] text-charcoal/70 bg-gray-100 px-3 py-1 rounded-full">
                                                <ShieldCheck size={12} className="text-rose" />
                                                <span>Best results: clear, well-lit portrait photo</span>
                                            </span>
                                        </div>
                                    ) : (
                                        /* Photo Selected Preview */
                                        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center gap-4">
                                            <div className="w-20 h-24 rounded-lg bg-[#F3F4F6] overflow-hidden border border-[#E5E7EB] shrink-0">
                                                <img 
                                                    src={photoPreview} 
                                                    alt="Uploaded portrait preview" 
                                                    className="w-full h-full object-cover"
                                                    data-testid="uploaded-photo-preview"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold mb-1">
                                                    <Check size={14} />
                                                    <span>Photo selected</span>
                                                </div>
                                                <p className="text-xs text-[#1A1A1A] font-medium truncate">
                                                    {photoFile?.name}
                                                </p>
                                                <p className="text-[11px] text-[#595959]">
                                                    {(photoFile?.size / (1024 * 1024)).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="text-xs text-rose hover:text-rose-hover font-semibold px-2.5 py-1.5 rounded-md hover:bg-rose/5"
                                                >
                                                    Change
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleReset}
                                                    className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50"
                                                    title="Remove photo"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={handleFileInputChange}
                                                className="hidden"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Consent Checkbox */}
                                <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl">
                                    <label className="flex items-start gap-3 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={consent}
                                            onChange={(e) => setConsent(e.target.checked)}
                                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rose focus:ring-rose focus:ring-offset-0 cursor-pointer accent-rose"
                                            data-testid="try-on-consent-checkbox"
                                        />
                                        <span className="text-xs text-[#595959] leading-relaxed">
                                            My photo will be sent to Google's AI service to create this preview. It is not saved on our website.
                                        </span>
                                    </label>
                                </div>

                                {/* Generate Button */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={handleGenerate}
                                        disabled={!consent || !photoFile || isGenerating || quota.remaining <= 0}
                                        className={`w-full py-3.5 px-6 rounded-md font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-sm ${
                                            !consent || !photoFile || isGenerating || quota.remaining <= 0
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200'
                                                : 'btn-primary'
                                        }`}
                                        data-testid="try-on-generate-btn"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <RefreshCw size={16} className="animate-spin text-charcoal" />
                                                <span>Tailoring Your AI Preview...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={16} />
                                                <span>Generate</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Disabled reason hint */}
                                    {(!consent || !photoFile) && (
                                        <p className="text-[11px] text-center text-[#595959] mt-2">
                                            {!photoFile 
                                                ? 'Please upload a photo and check the consent box to generate.' 
                                                : 'Please check the consent box to proceed.'}
                                        </p>
                                    )}
                                    {quota.remaining <= 0 && (
                                        <p className="text-[11px] text-center text-red-600 font-medium mt-2">
                                            Daily limit of {quota.daily_limit} try-ons reached. Resets tomorrow.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
