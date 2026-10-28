import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail, MapPin, Phone, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Footer = () => {
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterLoading, setNewsletterLoading] = useState(false);
    const [newsletterStatus, setNewsletterStatus] = useState({ type: '', message: '' });

    const handleSubscribe = async (e) => {
        e.preventDefault();
        const trimmedEmail = (newsletterEmail || '').trim().toLowerCase();
        if (!trimmedEmail) return;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            const errorMsg = 'Please enter a valid email address';
            setNewsletterStatus({ type: 'error', message: errorMsg });
            toast.error(errorMsg);
            return;
        }

        setNewsletterLoading(true);
        setNewsletterStatus({ type: '', message: '' });

        try {
            const res = await axios.post(`${API}/newsletter/subscribe`, { email: trimmedEmail });
            const successMsg = res.data?.message || 'Successfully subscribed to newsletter!';
            setNewsletterStatus({ type: 'success', message: successMsg });
            toast.success(successMsg);
            setNewsletterEmail('');
        } catch (error) {
            const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Failed to subscribe. Please try again.';
            setNewsletterStatus({ type: 'error', message: errorMsg });
            toast.error(errorMsg);
        } finally {
            setNewsletterLoading(false);
        }
    };

    return (
        <footer 
            className="bg-white text-[#4B5563] relative border-t border-[#E5E7EB]" 
            style={{ borderTop: '3px solid transparent', borderImage: 'linear-gradient(90deg, #C2255C, #3B6FA0) 1' }}
            data-testid="footer"
        >
            {/* Top Band: Logo & Newsletter side by side on desktop, stacked on mobile */}
            <div className="py-5 sm:py-6 border-b border-[#E5E7EB]">
                <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px] flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
                    {/* Compact Logo */}
                    <Link to="/" className="flex items-center gap-2.5 sm:gap-3 hover:opacity-95 transition-opacity flex-shrink-0" data-testid="footer-logo">
                        <img 
                            src="/images/logo/jaridar-icon.png" 
                            alt="Jaridar Icon" 
                            className="h-9 sm:h-10 w-auto object-contain flex-shrink-0" 
                        />
                        <div className="flex flex-col justify-center text-left">
                            <span className="font-heading text-lg sm:text-xl font-black text-[#C2255C] tracking-tight leading-none">
                                JARIDAR
                            </span>
                            <span className="text-[11px] font-bold text-[#3B6FA0] uppercase tracking-[0.24em] pt-0.5 leading-tight">
                                Fashion Couture
                            </span>
                        </div>
                    </Link>

                    {/* Compact Newsletter */}
                    <div className="w-full md:w-auto flex flex-col items-center md:items-end">
                        <div className="w-full sm:w-[360px] md:w-[380px]">
                            <div className="flex items-center justify-between md:justify-end gap-2 mb-1.5">
                                <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-[#3B6FA0]">
                                    Subscribe to our Newsletter
                                </h3>
                            </div>
                            <form onSubmit={handleSubscribe} className="relative flex items-center w-full">
                                <input
                                    type="email"
                                    value={newsletterEmail}
                                    onChange={(e) => {
                                        setNewsletterEmail(e.target.value);
                                        if (newsletterStatus.message) setNewsletterStatus({ type: '', message: '' });
                                    }}
                                    placeholder="Enter your email address"
                                    className="w-full pl-3.5 pr-10 py-2 text-sm bg-white border border-[#E5E7EB] text-[#1F2937] rounded-full focus:outline-none focus:border-[#C2255C] placeholder-[#9CA3AF] shadow-xs"
                                    required
                                    disabled={newsletterLoading}
                                    data-testid="newsletter-input"
                                />
                                <button
                                    type="submit"
                                    disabled={newsletterLoading}
                                    className="absolute right-1 p-1.5 bg-[#C2255C] hover:bg-[#9C1D49] disabled:opacity-60 text-white rounded-full transition-colors flex items-center justify-center shadow-xs"
                                    data-testid="newsletter-submit"
                                    aria-label="Subscribe"
                                >
                                    {newsletterLoading ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                                </button>
                            </form>
                            {newsletterStatus.message && (
                                <p className={`mt-1.5 text-xs font-medium text-left md:text-right ${newsletterStatus.type === 'success' ? 'text-green-600' : 'text-[#C2255C]'}`}>
                                    {newsletterStatus.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 5 Columns Area with tighter padding and gaps */}
            <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px] pt-8 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-4 xl:gap-6 pb-6">
                    {/* Column 1: CUSTOMER SERVICE */}
                    <div>
                        <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-[#3B6FA0] mb-3">
                            CUSTOMER SERVICE
                        </h4>
                        <ul className="space-y-2 text-sm text-[#4B5563]">
                            <li><Link to="/exchange-policy" className="hover:text-[#C2255C] transition-colors">Exchange & Order Cancellation</Link></li>
                            <li><Link to="/account" className="hover:text-[#C2255C] transition-colors">My Account</Link></li>
                            <li><Link to="/shipping-policy" className="hover:text-[#C2255C] transition-colors">Shipping</Link></li>
                            <li><Link to="/payment-options" className="hover:text-[#C2255C] transition-colors">Payment Options</Link></li>
                            <li><Link to="/faqs" className="hover:text-[#C2255C] transition-colors">FAQs</Link></li>
                        </ul>
                    </div>

                    {/* Column 2: DISCOVER */}
                    <div>
                        <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-[#3B6FA0] mb-3">
                            DISCOVER
                        </h4>
                        <ul className="space-y-2 text-sm text-[#4B5563]">
                            <li><Link to="/about" className="hover:text-[#C2255C] transition-colors">About Us</Link></li>
                            <li><Link to="/contact" className="hover:text-[#C2255C] transition-colors">Contact Us</Link></li>
                            <li><Link to="/our-stores" className="hover:text-[#C2255C] transition-colors">Our Stores</Link></li>
                            <li><Link to="/blog" className="hover:text-[#C2255C] transition-colors">Blog</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: QUICK LINKS */}
                    <div>
                        <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-[#3B6FA0] mb-3">
                            QUICK LINKS
                        </h4>
                        <ul className="space-y-2 text-sm text-[#4B5563]">
                            <li><Link to="/shop?category=ethnic" className="hover:text-[#C2255C] transition-colors">Ethnic Wear</Link></li>
                            <li><Link to="/shop?category=traditional" className="hover:text-[#C2255C] transition-colors">Traditional Wear</Link></li>
                            <li><Link to="/shop?category=western" className="hover:text-[#C2255C] transition-colors">Western Wear</Link></li>
                            <li><Link to="/shop?filter=new" className="hover:text-[#C2255C] transition-colors">New Arrivals</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: SERVICES */}
                    <div>
                        <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-[#3B6FA0] mb-3">
                            SERVICES
                        </h4>
                        <ul className="space-y-2 text-sm text-[#4B5563]">
                            <li><Link to="/privacy-policy" className="hover:text-[#C2255C] transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-[#C2255C] transition-colors">Terms & Conditions</Link></li>
                            <li><Link to="/offers" className="hover:text-[#C2255C] transition-colors">Offers</Link></li>
                        </ul>
                    </div>

                    {/* Column 5: CONTACT US */}
                    <div>
                        <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-[#3B6FA0] mb-3">
                            CONTACT US
                        </h4>
                        <div className="space-y-2 text-sm text-[#4B5563]">
                            <div className="flex items-start gap-2">
                                <MapPin size={15} className="text-[#3B6FA0] flex-shrink-0 mt-0.5" />
                                <span className="text-xs leading-relaxed">Jaridar Fashion Couture, Commercial Complex, Shop no. 3, Pink City, Kalewadi - Wakad Rd, Vishnu Dev Nagar, Wakad, Pimpri-Chinchwad, Maharashtra 411057</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={15} className="text-[#3B6FA0] flex-shrink-0" />
                                <a href="tel:+919185025980" className="hover:text-[#C2255C] transition-colors text-xs">+91 91850 25980</a>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={15} className="text-[#3B6FA0] flex-shrink-0" />
                                <span className="text-xs">info@jaridar.com</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-3">
                            <a href="https://instagram.com/jaridarfashion_1" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] hover:bg-[#C2255C] flex items-center justify-center text-[#4B5563] hover:text-white transition-colors" aria-label="Instagram">
                                <Instagram size={15} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: WE ACCEPT & Copyright on ONE line on desktop */}
                <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4B5563]">
                    <div className="flex items-center gap-2.5">
                        <span className="text-[11px] uppercase tracking-wider text-[#3B6FA0] font-semibold">We Accept:</span>
                        <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-white border border-[#E5E7EB] rounded text-[10px] font-bold tracking-wider text-[#1F2937]">VISA</span>
                            <span className="px-1.5 py-0.5 bg-white border border-[#E5E7EB] rounded text-[10px] font-bold tracking-wider text-[#1F2937]">UPI</span>
                            <span className="px-1.5 py-0.5 bg-white border border-[#E5E7EB] rounded text-[10px] font-bold tracking-wider text-[#1F2937]">RAZORPAY</span>
                        </div>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF]">
                        &copy; 2026 Jaridar Fashion Couture. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
