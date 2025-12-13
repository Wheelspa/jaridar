import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="bg-charcoal text-white" data-testid="footer">
            {/* Newsletter */}
            <div className="newsletter-section py-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
                    <h3 className="font-heading text-3xl md:text-4xl text-charcoal mb-3">Stay in Style</h3>
                    <p className="text-charcoal/70 mb-6">Subscribe for exclusive offers and new arrivals</p>
                    <form className="max-w-md mx-auto flex gap-3">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-6 py-3 rounded-full bg-white text-charcoal placeholder-gray-400 border-0 focus:ring-2 focus:ring-white outline-none"
                            data-testid="newsletter-input"
                        />
                        <button type="submit" className="btn-primary bg-charcoal text-white hover:bg-charcoal/90" data-testid="newsletter-submit">
                            Subscribe
                        </button>
                    </form>
                </div>
            </div>

            {/* Main footer */}
            <div className="py-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                        {/* Brand */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose to-serenity flex items-center justify-center">
                                    <span className="font-heading text-2xl text-white font-semibold">J</span>
                                </div>
                                <div>
                                    <h2 className="font-heading text-2xl">JARIDAR</h2>
                                    <p className="text-xs text-serenity uppercase tracking-widest">Fashion Couture</p>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                Where traditional elegance meets contemporary style. Discover exquisite ethnic, traditional, and western wear for every occasion.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-rose transition-colors">
                                    <Instagram size={18} />
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-rose transition-colors">
                                    <Facebook size={18} />
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-rose transition-colors">
                                    <Twitter size={18} />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="font-heading text-xl mb-6">Quick Links</h4>
                            <ul className="space-y-3">
                                <li><Link to="/shop?category=ethnic" className="footer-link">Ethnic Wear</Link></li>
                                <li><Link to="/shop?category=traditional" className="footer-link">Traditional Wear</Link></li>
                                <li><Link to="/shop?category=western" className="footer-link">Western Wear</Link></li>
                                <li><Link to="/shop?category=bridal" className="footer-link">Bridal Collection</Link></li>
                                <li><Link to="/shop?is_new=true" className="footer-link">New Arrivals</Link></li>
                            </ul>
                        </div>

                        {/* Customer Service */}
                        <div>
                            <h4 className="font-heading text-xl mb-6">Customer Service</h4>
                            <ul className="space-y-3">
                                <li><Link to="/about" className="footer-link">About Us</Link></li>
                                <li><Link to="/contact" className="footer-link">Contact Us</Link></li>
                                <li><Link to="/size-guide" className="footer-link">Size Guide</Link></li>
                                <li><a href="#" className="footer-link">Shipping Policy</a></li>
                                <li><a href="#" className="footer-link">Returns & Exchanges</a></li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="font-heading text-xl mb-6">Contact Us</h4>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <MapPin size={18} className="text-rose mt-1 flex-shrink-0" />
                                    <span className="text-gray-400 text-sm">123 Fashion Street, Varanasi, Uttar Pradesh 221001</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone size={18} className="text-rose flex-shrink-0" />
                                    <span className="text-gray-400 text-sm">+91 98765 43210</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail size={18} className="text-rose flex-shrink-0" />
                                    <span className="text-gray-400 text-sm">hello@jaridar.com</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/10 py-6">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">
                        &copy; 2025 Jaridar Fashion Couture. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-rose">Privacy Policy</a>
                        <a href="#" className="hover:text-rose">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
