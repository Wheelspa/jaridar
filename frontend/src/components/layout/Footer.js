import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail, MapPin, Phone } from 'lucide-react';
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
        <footer className="bg-charcoal text-white pt-14 pb-8 border-t border-white/10" data-testid="footer">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {/* 4 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-10">
                    {/* Col 1: About Jaridar */}
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose via-rose-dark to-gold flex items-center justify-center shadow-sm">
                                <span className="font-heading text-lg text-white font-semibold">J</span>
                            </div>
                            <div className="flex flex-col">
                                <h2 className="font-heading text-xl text-white tracking-tight font-bold leading-none">JARIDAR</h2>
                                <span className="text-[9px] text-gold uppercase tracking-[0.25em] font-medium pt-0.5">Couture</span>
                            </div>
                        </Link>
                        <p className="text-stone-400 text-xs leading-relaxed max-w-sm">
                            Where traditional elegance meets contemporary couture. Discover exquisite sarees, lehengas, and fusion ensembles crafted with heritage artistry.
                        </p>
                        
                        {/* Contact details */}
                        <div className="space-y-2 text-xs text-stone-300 pt-1">
                            <div className="flex items-start gap-2">
                                <MapPin size={14} className="text-rose flex-shrink-0 mt-0.5" />
                                <span>123 Couture Lane, Mumbai, MH 400001</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={14} className="text-rose flex-shrink-0" />
                                <span>+91 98765 43210</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={14} className="text-rose flex-shrink-0" />
                                <span>care@jaridar.com</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-stone-800 hover:bg-rose flex items-center justify-center text-stone-300 hover:text-white transition-colors" aria-label="Instagram">
                                <Instagram size={15} />
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-stone-800 hover:bg-rose flex items-center justify-center text-stone-300 hover:text-white transition-colors" aria-label="Facebook">
                                <Facebook size={15} />
                            </a>
                            <a href="https://pinterest.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-stone-800 hover:bg-rose flex items-center justify-center text-stone-300 hover:text-white transition-colors text-xs font-bold" aria-label="Pinterest">
                                P
                            </a>
                        </div>
                    </div>

                    {/* Col 2: Quick Links */}
                    <div>
                        <h4 className="font-heading text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-5">Quick Links</h4>
                        <ul className="space-y-2.5 text-xs text-stone-300">
                            <li><Link to="/shop?category=ethnic" className="hover:text-rose transition-colors">Ethnic Wear</Link></li>
                            <li><Link to="/shop?category=traditional" className="hover:text-rose transition-colors">Traditional Wear</Link></li>
                            <li><Link to="/shop?category=western" className="hover:text-rose transition-colors">Western Wear</Link></li>
                            <li><Link to="/shop?category=bridal" className="hover:text-rose transition-colors">Bridal Collection</Link></li>
                            <li><Link to="/shop?filter=new" className="hover:text-rose transition-colors">New Arrivals</Link></li>
                        </ul>
                    </div>

                    {/* Col 3: Customer Care */}
                    <div>
                        <h4 className="font-heading text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-5">Customer Care</h4>
                        <ul className="space-y-2.5 text-xs text-stone-300">
                            <li><Link to="/contact" className="hover:text-rose transition-colors">Contact Us</Link></li>
                            <li><a href="#" className="hover:text-rose transition-colors">Size Guide</a></li>
                            <li><a href="#" className="hover:text-rose transition-colors">Shipping Policy</a></li>
                            <li><a href="#" className="hover:text-rose transition-colors">Returns & Exchanges</a></li>
                        </ul>
                    </div>

                    {/* Col 4: Newsletter */}
                    <div>
                        <h4 className="font-heading text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-5">Newsletter</h4>
                        <p className="text-stone-400 text-xs mb-4 leading-relaxed">
                            Subscribe for exclusive offers and collection launches.
                        </p>
                        <form onSubmit={handleSubscribe} className="space-y-2">
                            <div className="relative">
                                <input
                                    type="email"
                                    value={newsletterEmail}
                                    onChange={(e) => setNewsletterEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full px-3.5 py-2 text-xs bg-stone-900 border border-stone-800 text-white rounded-md focus:outline-none focus:border-rose placeholder-stone-500"
                                    required
                                    data-testid="newsletter-input"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 bg-rose hover:bg-rose-dark text-white text-xs font-semibold uppercase tracking-wider rounded-md transition-colors shadow-sm"
                                data-testid="newsletter-submit"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Row: WE ACCEPT & Copyright */}
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-400">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">We Accept:</span>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-stone-800 border border-stone-700/80 rounded text-[10px] font-bold tracking-wider text-stone-300">VISA</span>
                            <span className="px-2 py-0.5 bg-stone-800 border border-stone-700/80 rounded text-[10px] font-bold tracking-wider text-stone-300">MASTERCARD</span>
                            <span className="px-2 py-0.5 bg-stone-800 border border-stone-700/80 rounded text-[10px] font-bold tracking-wider text-stone-300">UPI</span>
                            <span className="px-2 py-0.5 bg-stone-800 border border-stone-700/80 rounded text-[10px] font-bold tracking-wider text-stone-300">RAZORPAY</span>
                        </div>
                    </div>
                    <p className="text-[11px] text-stone-500">
                        &copy; 2026 Jaridar Fashion Couture. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
