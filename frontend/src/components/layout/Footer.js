import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube, Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Footer = () => {
    const [newsletterEmail, setNewsletterEmail] = useState('');

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!newsletterEmail) return;
        try {
            await axios.post(`${API}/newsletter/subscribe`, { email: newsletterEmail });
            toast.success('Successfully subscribed to newsletter!');
            setNewsletterEmail('');
        } catch (error) {
            toast.error('Failed to subscribe. Please try again.');
        }
    };

    return (
        <footer 
            className="bg-white text-[#4B5563] relative border-t border-[#E5E7EB]" 
            style={{ borderTop: '3px solid transparent', borderImage: 'linear-gradient(90deg, #C2255C, #3B6FA0) 1' }}
            data-testid="footer"
        >
            {/* Header-Style Compact Logo Section */}
            <div className="pt-10 pb-6 flex flex-col items-center justify-center border-b border-[#E5E7EB]">
                <Link to="/" className="flex items-center gap-2.5 sm:gap-3 hover:opacity-95 transition-opacity" data-testid="footer-logo">
                    <img 
                        src="/images/logo/jaridar-icon.png" 
                        alt="Jaridar Icon" 
                        className="h-10 sm:h-12 w-auto object-contain flex-shrink-0" 
                    />
                    <div className="flex flex-col justify-center text-left">
                        <span className="font-heading text-xl sm:text-2xl font-black text-[#C2255C] tracking-tight leading-none">
                            JARIDAR
                        </span>
                        <span className="text-xs font-bold text-[#3B6FA0] uppercase tracking-[0.26em] pt-0.5 leading-tight">
                            Fashion Couture
                        </span>
                    </div>
                </Link>
            </div>

            {/* Newsletter Band */}
            <div className="bg-white py-8 border-t border-b border-[#E5E7EB]">
                <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px] text-center">
                    <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-[#3B6FA0] mb-4">
                        Subscribe to our Newsletter
                    </h3>
                    <form onSubmit={handleSubscribe} className="max-w-md mx-auto relative flex items-center">
                        <input
                            type="email"
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="w-full pl-4 pr-12 py-2.5 text-base bg-white border border-[#E5E7EB] text-[#1F2937] rounded-full focus:outline-none focus:border-[#C2255C] placeholder-[#9CA3AF] shadow-xs"
                            required
                            data-testid="newsletter-input"
                        />
                        <button
                            type="submit"
                            className="absolute right-1.5 p-2 bg-[#C2255C] hover:bg-[#9C1D49] text-white rounded-full transition-colors flex items-center justify-center shadow-xs"
                            data-testid="newsletter-submit"
                            aria-label="Subscribe"
                        >
                            <ArrowRight size={14} />
                        </button>
                    </form>
                </div>
            </div>

            {/* 5 Columns Area */}
            <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px] pt-12 pb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6 xl:gap-8 pb-10">
                    {/* Column 1: CUSTOMER SERVICE */}
                    <div>
                        <h4 className="font-heading text-sm font-semibold uppercase tracking-widest text-[#3B6FA0] mb-5">
                            CUSTOMER SERVICE
                        </h4>
                        <ul className="space-y-2.5 text-sm text-[#4B5563]">
                            <li><Link to="/returns" className="hover:text-[#C2255C] transition-colors">Returns & Cancellation</Link></li>
                            <li><Link to="/account" className="hover:text-[#C2255C] transition-colors">My Account</Link></li>
                            <li><Link to="/exchange-policy" className="hover:text-[#C2255C] transition-colors">Exchange Policy</Link></li>
                            <li><Link to="/international-orders" className="hover:text-[#C2255C] transition-colors">International Orders</Link></li>
                            <li><Link to="/shipping-policy" className="hover:text-[#C2255C] transition-colors">Shipping</Link></li>
                            <li><Link to="/payment-options" className="hover:text-[#C2255C] transition-colors">Payment Options</Link></li>
                            <li><Link to="/faqs" className="hover:text-[#C2255C] transition-colors">FAQs</Link></li>
                        </ul>
                    </div>

                    {/* Column 2: DISCOVER */}
                    <div>
                        <h4 className="font-heading text-sm font-semibold uppercase tracking-widest text-[#3B6FA0] mb-5">
                            DISCOVER
                        </h4>
                        <ul className="space-y-2.5 text-sm text-[#4B5563]">
                            <li><Link to="/about" className="hover:text-[#C2255C] transition-colors">About Us</Link></li>
                            <li><Link to="/contact" className="hover:text-[#C2255C] transition-colors">Contact Us</Link></li>
                            <li><Link to="/our-stores" className="hover:text-[#C2255C] transition-colors">Our Stores</Link></li>
                            <li><Link to="/in-store-products" className="hover:text-[#C2255C] transition-colors">In-Store Products</Link></li>
                            <li><Link to="/blog" className="hover:text-[#C2255C] transition-colors">Blog</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: QUICK LINKS */}
                    <div>
                        <h4 className="font-heading text-sm font-semibold uppercase tracking-widest text-[#3B6FA0] mb-5">
                            QUICK LINKS
                        </h4>
                        <ul className="space-y-2.5 text-sm text-[#4B5563]">
                            <li><Link to="/shop?category=ethnic" className="hover:text-[#C2255C] transition-colors">Ethnic Wear</Link></li>
                            <li><Link to="/shop?category=traditional" className="hover:text-[#C2255C] transition-colors">Traditional Wear</Link></li>
                            <li><Link to="/shop?category=western" className="hover:text-[#C2255C] transition-colors">Western Wear</Link></li>
                            <li><Link to="/shop?category=bridal" className="hover:text-[#C2255C] transition-colors">Bridal Collection</Link></li>
                            <li><Link to="/shop?filter=new" className="hover:text-[#C2255C] transition-colors">New Arrivals</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: SERVICES */}
                    <div>
                        <h4 className="font-heading text-sm font-semibold uppercase tracking-widest text-[#3B6FA0] mb-5">
                            SERVICES
                        </h4>
                        <ul className="space-y-2.5 text-sm text-[#4B5563]">
                            <li><Link to="/sell-with-us" className="hover:text-[#C2255C] transition-colors">Sell with Us</Link></li>
                            <li><Link to="/privacy-policy" className="hover:text-[#C2255C] transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-[#C2255C] transition-colors">Terms & Conditions</Link></li>
                            <li><Link to="/offers" className="hover:text-[#C2255C] transition-colors">Offers</Link></li>
                        </ul>
                    </div>

                    {/* Column 5: CONTACT US */}
                    <div>
                        <h4 className="font-heading text-sm font-semibold uppercase tracking-widest text-[#3B6FA0] mb-5">
                            CONTACT US
                        </h4>
                        <div className="space-y-2.5 text-sm text-[#4B5563]">
                            <div className="flex items-start gap-2">
                                <MapPin size={16} className="text-[#3B6FA0] flex-shrink-0 mt-0.5" />
                                <span>Jaridar Fashion Couture, Commercial Complex, Shop no. 3, Pink City, Kalewadi - Wakad Rd, Vishnu Dev Nagar, Wakad, Pimpri-Chinchwad, Maharashtra 411057</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-[#3B6FA0] flex-shrink-0" />
                                <a href="tel:+919185025980" className="hover:text-[#C2255C] transition-colors">+91 91850 25980</a>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-[#3B6FA0] flex-shrink-0" />
                                <span>info@jaridar.com</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] hover:bg-[#C2255C] flex items-center justify-center text-[#4B5563] hover:text-white transition-colors" aria-label="Facebook">
                                <Facebook size={15} />
                            </a>
                            <a href="https://youtube.com/@jaridarfashion" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] hover:bg-[#C2255C] flex items-center justify-center text-[#4B5563] hover:text-white transition-colors" aria-label="YouTube">
                                <Youtube size={15} />
                            </a>
                            <a href="https://instagram.com/jaridarfashion_1" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] hover:bg-[#C2255C] flex items-center justify-center text-[#4B5563] hover:text-white transition-colors" aria-label="Instagram">
                                <Instagram size={15} />
                            </a>
                            <a href="https://pinterest.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] hover:bg-[#C2255C] flex items-center justify-center text-[#4B5563] hover:text-white transition-colors" aria-label="Pinterest">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.621 0 11.988-5.367 11.988-11.987C24.005 5.367 18.638 0 12.017 0z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: WE ACCEPT & Copyright */}
                <div className="pt-8 border-t border-[#E5E7EB] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#4B5563]">
                    <div className="flex items-center gap-3">
                        <span className="text-xs uppercase tracking-widest text-[#3B6FA0] font-semibold">We Accept:</span>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-white border border-[#E5E7EB] rounded text-xs font-bold tracking-wider text-[#1F2937]">VISA</span>
                            <span className="px-2 py-0.5 bg-white border border-[#E5E7EB] rounded text-xs font-bold tracking-wider text-[#1F2937]">MASTERCARD</span>
                            <span className="px-2 py-0.5 bg-white border border-[#E5E7EB] rounded text-xs font-bold tracking-wider text-[#1F2937]">UPI</span>
                            <span className="px-2 py-0.5 bg-white border border-[#E5E7EB] rounded text-xs font-bold tracking-wider text-[#1F2937]">RAZORPAY</span>
                        </div>
                    </div>
                    <p className="text-xs text-[#9CA3AF]">
                        &copy; 2026 Jaridar Fashion Couture. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
