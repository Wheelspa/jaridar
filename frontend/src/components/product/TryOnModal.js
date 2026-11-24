import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    X, 
    Upload, 
    Sparkles, 
    Clock, 
    AlertCircle, 
    CheckCircle2, 
    Download, 
    RefreshCw, 
    ShieldCheck, 
    Image as ImageIcon,
    ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PROGRESS_STAGES = [
    "Uploading your photo securely...",
    "Detecting body pose & alignment...",
    "Matching garment fabric, weave & cut...",
    "Generating photorealistic AI drape...",
    "Finalizing high-resolution couture preview..."
];

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export const TryOnModal = ({ isOpen, onClose, product, isAuthenticated, priceInr = 15 }) => {
    const { user } = useAuth();
    const fileInputRef = useRef(null);

    const [photoFile, setPhotoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [consent, setConsent] = useState(false);
    const [step, setStep] = useState('upload'); // 'upload' | 'processing' | 'result' | 'error'
    const [progressStageIdx, setProgressStageIdx] = useState(0);
    const [resultImageUrl, setResultImageUrl] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorStatus, setErrorStatus] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // Active paid order state (if previously paid and page refreshed / modal reopened within 15 mins)
    const [activePaidOrder, setActivePaidOrder] = useState(null);
    const [countdownSeconds, setCountdownSeconds] = useState(0);

    // Check status on modal open
    useEffect(() => {
        if (!isOpen) return;

        // Reset fields when reopening if not already in result
        if (step !== 'result') {
            setErrorMessage('');
            setErrorStatus(null);
            setProgressStageIdx(0);
        }

        if (isAuthenticated) {
            axios.get(`${API}/tryon/status`)
                .then(res => {
                    const data = res.data;
                    if (data.has_payment && data.status === 'paid' && data.remaining_seconds > 0) {
                        setActivePaidOrder({
                            order_id: data.order_id,
                            remaining_seconds: data.remaining_seconds,
                            expires_at: data.expires_at
                        });
                        setCountdownSeconds(data.remaining_seconds);
                    } else {
                        setActivePaidOrder(null);
                        setCountdownSeconds(0);
                    }
                })
                .catch(() => {
                    setActivePaidOrder(null);
                });
        }
    }, [isOpen, isAuthenticated]);

    // Countdown timer for active paid session
    useEffect(() => {
        if (!countdownSeconds || countdownSeconds <= 0) return;
        const timer = setInterval(() => {
            setCountdownSeconds(prev => {
                if (prev <= 1) {
                    setActivePaidOrder(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [countdownSeconds]);

    // Progress message cycler during processing
    useEffect(() => {
        if (step !== 'processing') return;
        const interval = setInterval(() => {
            setProgressStageIdx(prev => (prev + 1) % PROGRESS_STAGES.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [step]);

    // Cleanup object URL on unmount or file change
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    if (!isOpen) return null;

    const handleFileSelect = (file) => {
        if (!file) return;

        // Validation
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a JPG, PNG, or WebP photo.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Photo exceeds the maximum allowed size of 5MB.');
            return;
        }

        setPhotoFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        handleFileSelect(droppedFile);
    };

    const handlePayAndTry = async () => {
        if (!photoFile) {
            toast.error('Please upload a standing photo first');
            return;
        }
        if (!consent) {
            toast.error('Please confirm the photo consent checkbox to proceed');
            return;
        }

        // If user already has an active verified payment within 15 minutes, skip payment!
        if (activePaidOrder && activePaidOrder.order_id && countdownSeconds > 0) {
            await executeRun(activePaidOrder.order_id);
            return;
        }

        // Create new Razorpay order
        setStep('processing');
        setProgressStageIdx(0);

        try {
            const orderRes = await axios.post(`${API}/tryon/order`);
            const { order_id, amount, currency, key_id } = orderRes.data;

            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                setStep('upload');
                toast.error('Failed to connect to payment gateway. Please check your network.');
                return;
            }

            const options = {
                key: key_id,
                amount: amount,
                currency: currency || 'INR',
                name: 'Jaridar Fashion Couture',
                description: `Virtual Try-On • ${product?.name || 'Garment'}`,
                order_id: order_id,
                handler: async function (response) {
                    setProgressStageIdx(1);
                    const verifyPayload = {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    };

                    let verified = false;
                    try {
                        await axios.post(`${API}/tryon/verify`, verifyPayload);
                        verified = true;
                    } catch (firstErr) {
                        // Retry once after 2 seconds
                        await new Promise((resolve) => setTimeout(resolve, 2000));
                        try {
                            await axios.post(`${API}/tryon/verify`, verifyPayload);
                            verified = true;
                        } catch (secondErr) {
                            console.error('Payment verify retry failed:', secondErr);
                        }
                    }

                    if (verified) {
                        await executeRun(response.razorpay_order_id);
                    } else {
                        setErrorMessage("तुमचे पेमेंट मिळाले आहे पण पुष्टी होऊ शकली नाही. काही मिनिटांत Try-On सुरू न झाल्यास तुमचे ₹15 आपोआप परत केले जातील.");
                        setErrorStatus('unconfirmed');
                        setActivePaidOrder(null);
                        setStep('error');
                    }
                },
                modal: {
                    ondismiss: function () {
                        setStep('upload');
                        toast.info('Payment window closed. You can retry whenever you are ready.');
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phone || ''
                },
                theme: {
                    color: '#e11d48'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (orderErr) {
            const msg = orderErr.response?.data?.detail || 'Unable to initiate try-on payment. Please try again.';
            toast.error(msg);
            setStep('upload');
        }
    };

    const executeRun = async (orderId) => {
        setStep('processing');
        setProgressStageIdx(2);

        const formData = new FormData();
        formData.append('file', photoFile);
        formData.append('product_id', product.id);
        formData.append('order_id', orderId);
        formData.append('consent', 'true');

        try {
            const res = await axios.post(`${API}/tryon/run`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 240000 // 4 minutes timeout
            });

            if (res.data?.success && res.data?.image_url) {
                setResultImageUrl(res.data.image_url);
                setActivePaidOrder(null);
                setCountdownSeconds(0);
                setErrorStatus(null);
                setStep('result');
                toast.success('Your virtual try-on is ready!');
            } else {
                throw new Error('No result image returned');
            }
        } catch (err) {
            const isTimeoutOrNetwork = !err.response || err.code === 'ECONNABORTED' || (err.message && err.message.toLowerCase().includes('timeout'));

            if (isTimeoutOrNetwork) {
                // Poll GET /tryon/status?order_id=... every 5 seconds for up to 3 minutes (36 attempts)
                let pollDone = false;
                const maxPollAttempts = 36;

                for (let i = 0; i < maxPollAttempts; i++) {
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                    try {
                        const statusRes = await axios.get(`${API}/tryon/status?order_id=${orderId}`);
                        const sData = statusRes.data;

                        if (sData?.status === 'succeeded' && sData?.image_url) {
                            setResultImageUrl(sData.image_url);
                            setActivePaidOrder(null);
                            setCountdownSeconds(0);
                            setErrorStatus(null);
                            setStep('result');
                            toast.success('Your virtual try-on is ready!');
                            pollDone = true;
                            break;
                        } else if (['refunded', 'refunding', 'refund_failed'].includes(sData?.status)) {
                            setActivePaidOrder(null);
                            setCountdownSeconds(0);
                            setErrorStatus(sData.status);
                            setErrorMessage(
                                sData.status === 'refund_failed'
                                    ? 'Try-On अयशस्वी झाले. तुमचे ₹15 परत करण्याची प्रक्रिया सुरू आहे, काही दिवसांत खात्यात जमा होतील.'
                                    : 'Try-On अयशस्वी झाले. तुमचे ₹15 परत केले आहेत.'
                            );
                            setStep('error');
                            pollDone = true;
                            break;
                        } else if (sData?.status === 'paid' && sData?.remaining_seconds > 0) {
                            setActivePaidOrder({
                                order_id: sData.order_id,
                                remaining_seconds: sData.remaining_seconds,
                                expires_at: sData.expires_at
                            });
                            setCountdownSeconds(sData.remaining_seconds);
                            setErrorStatus('paid');
                            setErrorMessage('तुमचे पेमेंट सक्रिय आहे. कृपया दुसरा फोटो अपलोड करून पुन्हा प्रयत्न करा.');
                            setStep('error');
                            pollDone = true;
                            break;
                        } else if (sData?.status === 'processing') {
                            continue;
                        }
                    } catch (pollErr) {
                        console.error('Polling status error:', pollErr);
                    }
                }

                if (!pollDone) {
                    setErrorStatus('processing');
                    setErrorMessage("तुमचे ट्राय-ऑन अजून चालू आहे. काही वेळाने Try Me On उघडून पाहा, पैसे सुरक्षित आहेत; अयशस्वी झाल्यास आपोआप परत केले जातील.");
                    setStep('error');
                }
                return;
            }

            // HTTP error response from server
            let currStatus = null;
            try {
                const statusRes = await axios.get(`${API}/tryon/status?order_id=${orderId}`);
                const sData = statusRes.data;
                currStatus = sData?.status;
                if (sData?.has_payment && sData?.status === 'paid' && sData?.remaining_seconds > 0) {
                    setActivePaidOrder({
                        order_id: sData.order_id,
                        remaining_seconds: sData.remaining_seconds,
                        expires_at: sData.expires_at
                    });
                    setCountdownSeconds(sData.remaining_seconds);
                } else if (['refunded', 'refunding', 'refund_failed'].includes(sData?.status)) {
                    setActivePaidOrder(null);
                    setCountdownSeconds(0);
                }
            } catch (statusErr) {
                console.error('Failed to get payment status after run failure:', statusErr);
            }

            const detail = err.response?.data?.detail || 'Try-On could not be completed. Please try again.';
            setErrorMessage(detail);
            setErrorStatus(currStatus);
            setStep('error');
        }
    };

    const handleDownload = async () => {
        if (!resultImageUrl) return;
        try {
            const response = await fetch(resultImageUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `jaridar-tryon-${product?.name ? product.name.toLowerCase().replace(/\s+/g, '-') : 'outfit'}.jpg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
            toast.success('Try-on image downloaded!');
        } catch (e) {
            window.open(resultImageUrl, '_blank');
        }
    };

    const formatRemainingMinutes = (secs) => {
        const mins = Math.floor(secs / 60);
        const rem = secs % 60;
        return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg sm:max-w-xl bg-white rounded-2xl shadow-2xl border border-rose/10 overflow-hidden flex flex-col max-h-[92vh]">
                
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-rose/5 to-white shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-rose/10 flex items-center justify-center text-rose">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-charcoal text-base leading-tight">Virtual Try-On</h3>
                            <p className="text-[11px] text-gray-500 truncate max-w-[240px] sm:max-w-xs">{product?.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-charcoal flex items-center justify-center transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
                    
                    {/* Active Paid Session Banner */}
                    {activePaidOrder && countdownSeconds > 0 && step === 'upload' && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3 text-emerald-800 text-xs">
                            <Clock size={18} className="text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                            <div className="flex-1">
                                <p className="font-semibold text-emerald-900">Payment Verified (₹{priceInr})</p>
                                <p className="mt-0.5 text-emerald-700">
                                    तुमचे पैसे भरले आहेत! 15 मिनिटांत फोटो upload करा. (वेळ शिल्लक: <span className="font-mono font-bold">{formatRemainingMinutes(countdownSeconds)}</span>)
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-5">
                            
                            {/* Product Info Thumbnail */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <img 
                                    src={product?.images?.[0] || '/images/placeholder.jpg'} 
                                    alt={product?.name}
                                    className="w-14 h-16 object-cover rounded-lg border border-gray-200 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs uppercase tracking-wider text-rose font-semibold">Selected Outfit</p>
                                    <h4 className="text-sm font-medium text-charcoal truncate">{product?.name}</h4>
                                    <p className="text-xs text-gray-500 font-mono mt-0.5">₹{product?.price?.toLocaleString('en-IN')}</p>
                                </div>
                            </div>

                            {/* Photo Upload Area */}
                            <div>
                                <label className="block text-xs font-semibold text-charcoal mb-2 uppercase tracking-wider">
                                    Upload Your Photo
                                </label>
                                
                                {previewUrl ? (
                                    <div className="relative rounded-xl border-2 border-rose/30 bg-rose/5 p-4 flex items-center gap-4">
                                        <img 
                                            src={previewUrl} 
                                            alt="Your preview" 
                                            className="w-20 h-24 object-cover rounded-lg border border-rose/20 shadow-xs"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-charcoal truncate">{photoFile?.name}</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                {(photoFile?.size / (1024 * 1024)).toFixed(2)} MB • Ready
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="mt-2 text-xs font-semibold text-rose hover:text-rose/80 underline underline-offset-2 flex items-center gap-1"
                                            >
                                                <RefreshCw size={12} /> Change Photo
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                        onDragLeave={() => setIsDragOver(false)}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                                            isDragOver 
                                                ? 'border-rose bg-rose/5' 
                                                : 'border-gray-300 hover:border-rose/50 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-rose/10 text-rose flex items-center justify-center mx-auto mb-3">
                                            <Upload size={22} />
                                        </div>
                                        <p className="text-sm font-semibold text-charcoal">Click or drag & drop your photo</p>
                                        <p className="text-xs text-gray-500 mt-1">Full or half body standing photo with clear lighting (JPG, PNG, WebP up to 5MB)</p>
                                    </div>
                                )}

                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept="image/jpeg,image/png,image/webp" 
                                    className="hidden" 
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                />
                            </div>

                            {/* Photo Tips Pill */}
                            <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2.5">
                                <ShieldCheck size={16} className="text-amber-700 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold">Tip for best results:</span> Stand facing the camera in good natural lighting with neutral posture.
                                </div>
                            </div>

                            {/* Privacy Consent Checkbox */}
                            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200/70">
                                <label className="flex items-start gap-3 cursor-pointer select-none">
                                    <input 
                                        type="checkbox"
                                        checked={consent}
                                        onChange={(e) => setConsent(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-rose focus:ring-rose accent-rose shrink-0"
                                    />
                                    <span className="text-xs text-gray-700 leading-relaxed">
                                        माझा फोटो फक्त या Try-On साठी वापरला जाईल. तो AI प्रक्रियेसाठी आमच्या AI भागीदाराकडे (FASHN AI) पाठवला जाईल आणि आमच्या सर्व्हरवर किंवा डेटाबेसमध्ये साठवला जाणार नाही.
                                        <span className="block text-[11px] text-gray-500 mt-0.5">
                                            (My photo is sent to FASHN AI for processing only and is not stored on Jaridar servers.)
                                        </span>
                                    </span>
                                </label>
                            </div>

                            {/* Action Button */}
                            <button
                                type="button"
                                onClick={handlePayAndTry}
                                disabled={!photoFile || !consent}
                                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all ${
                                    photoFile && consent
                                        ? 'bg-rose text-white hover:bg-rose/90 cursor-pointer shadow-rose/20'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <Sparkles size={16} />
                                <span>
                                    {activePaidOrder && countdownSeconds > 0
                                        ? 'Try On Now (Paid Session Active)'
                                        : `Pay ₹${priceInr} & Try Me On`
                                    }
                                </span>
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    )}

                    {/* Step: Processing */}
                    {step === 'processing' && (
                        <div className="py-12 text-center space-y-6">
                            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-4 border-rose/20 border-t-rose animate-spin" />
                                <Sparkles size={28} className="text-rose animate-pulse" />
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="text-base font-semibold text-charcoal">Creating Your Virtual Look</h4>
                                <p className="text-xs text-gray-500 max-w-sm mx-auto min-h-[36px] transition-all duration-300">
                                    {PROGRESS_STAGES[progressStageIdx]}
                                </p>
                            </div>

                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose/5 border border-rose/15 text-[11px] text-rose font-medium">
                                <Clock size={13} className="animate-spin" />
                                <span>Takes about 20-40 seconds • Please do not refresh</span>
                            </div>
                        </div>
                    )}

                    {/* Step: Result */}
                    {step === 'result' && (
                        <div className="space-y-5 animate-in fade-in duration-300">
                            <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-md bg-black/5 aspect-[3/4] max-h-[460px] mx-auto flex items-center justify-center">
                                <img 
                                    src={resultImageUrl} 
                                    alt="Virtual Try-On Result" 
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5 shadow-sm">
                                    <Sparkles size={12} className="text-rose" /> AI Generated
                                </div>
                            </div>

                            {/* Disclaimer & Expiry notice */}
                            <div className="bg-rose/5 border border-rose/15 rounded-xl p-3 text-center">
                                <p className="text-xs text-charcoal font-medium">
                                    AI Preview • प्रत्यक्ष फिट, कापडाची रचना आणि रंग स्क्रीननुसार थोडे वेगळे असू शकतात.
                                </p>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    (इमेज लिंक काही वेळात एक्स्पायर होते, कृपया आत्ताच डाउनलोड करा.)
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="flex-1 py-3 px-4 rounded-xl bg-rose text-white hover:bg-rose/90 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
                                >
                                    <Download size={16} /> Download Photo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('upload');
                                        setPhotoFile(null);
                                        setPreviewUrl(null);
                                        setConsent(false);
                                    }}
                                    className="py-3 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-charcoal font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                                >
                                    <RefreshCw size={14} /> Try Another
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Error */}
                    {step === 'error' && (
                        <div className="py-8 text-center space-y-5 animate-in fade-in duration-200">
                            <div className="w-14 h-14 rounded-full bg-rose/10 text-rose flex items-center justify-center mx-auto">
                                <AlertCircle size={28} />
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-base font-semibold text-charcoal">Try-On Not Completed</h4>
                                <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                                    {errorMessage || 'Try-On could not be completed. Please try again.'}
                                </p>
                            </div>

                            {/* Show green refund safety box only if refunded, refunding, or refund_failed */}
                            {['refunded', 'refunding', 'refund_failed'].includes(errorStatus) && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 max-w-sm mx-auto text-left flex items-start gap-2.5">
                                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold text-emerald-900">Your ₹15 is 100% safe:</span>
                                        <p className="mt-0.5 text-emerald-700">
                                            Jaridar धोरणानुसार अयशस्वी ट्राय-ऑनचे पैसे मूळ खात्यात त्वरित परत केले जातात (२-५ कार्यालयीन दिवसांत खात्यात जमा होतात).
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Show active paid info when status is paid */}
                            {(errorStatus === 'paid' || (activePaidOrder && countdownSeconds > 0)) && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-800 max-w-sm mx-auto text-left flex items-start gap-2.5">
                                    <Clock size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold text-blue-900">तुमचे पैसे भरले आहेत:</span>
                                        <p className="mt-0.5 text-blue-700">
                                            15 मिनिटांत ({formatRemainingMinutes(countdownSeconds)}) दुसरा फोटो upload करा, पुन्हा पैसे लागणार नाहीत.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setStep('upload');
                                    setErrorMessage('');
                                    if (activePaidOrder && countdownSeconds > 0) {
                                        setPhotoFile(null);
                                        setPreviewUrl(null);
                                    }
                                }}
                                className="py-2.5 px-6 rounded-xl bg-charcoal text-white hover:bg-charcoal/90 text-xs font-semibold uppercase tracking-wider transition-all"
                            >
                                {activePaidOrder && countdownSeconds > 0
                                    ? 'Upload another photo'
                                    : 'Try Again with Another Photo'
                                }
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
