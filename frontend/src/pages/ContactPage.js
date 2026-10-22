import React from 'react';
import { Mail, Phone, MapPin, Clock, Navigation } from 'lucide-react';

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Jaridar Fashion Couture, Commercial Complex, Shop no. 3, Pink City, Kalewadi - Wakad Rd, Vishnu Dev Nagar, Wakad, Pimpri-Chinchwad, Maharashtra 411057')}`;

export default function ContactPage() {
    return (
        <div className="w-full bg-white text-charcoal min-h-screen">
            {/* Header Band */}
            <div className="bg-white border-b border-[#E5E7EB] py-16">
                <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px] text-center max-w-4xl mx-auto space-y-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-rose font-bold">Get In Touch</p>
                    <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal uppercase">Contact Us</h1>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        Our couture concierge is here to assist you with styling, order inquiries, and custom consultations.
                    </p>
                </div>
            </div>

            <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px] py-16">
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Contact Details Panel */}
                    <div className="space-y-8 bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-xs">
                        <h2 className="text-lg font-semibold text-charcoal uppercase tracking-wide">Contact Details</h2>
                        <div className="space-y-6 text-[#4B5563]">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white text-rose rounded-xl border border-[#E5E7EB] shadow-xs"><MapPin size={20} /></div>
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-charcoal text-sm">Flagship Boutique</h4>
                                    <p className="text-xs leading-relaxed">
                                        Jaridar Fashion Couture, Commercial Complex, Shop no. 3, Pink City, Kalewadi - Wakad Rd, Vishnu Dev Nagar, Wakad, Pimpri-Chinchwad, Maharashtra 411057
                                    </p>
                                    <a
                                        href={mapsUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-rose font-semibold hover:underline pt-1"
                                    >
                                        <Navigation size={14} /> Get Directions
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white text-rose rounded-xl border border-[#E5E7EB] shadow-xs"><Clock size={20} /></div>
                                <div>
                                    <h4 className="font-semibold text-charcoal text-sm">Boutique Hours</h4>
                                    <p className="text-xs mt-1">Open daily: 10:00 AM – 10:00 PM</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white text-rose rounded-xl border border-[#E5E7EB] shadow-xs"><Phone size={20} /></div>
                                <div>
                                    <h4 className="font-semibold text-charcoal text-sm">Phone Assistance</h4>
                                    <a href="tel:+919185025980" className="text-xs mt-1 block hover:text-rose transition-colors">+91 91850 25980</a>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white text-rose rounded-xl border border-[#E5E7EB] shadow-xs"><Mail size={20} /></div>
                                <div>
                                    <h4 className="font-semibold text-charcoal text-sm">Email</h4>
                                    <p className="text-xs mt-1">info@jaridar.com</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Send Message Panel */}
                    <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
                        <h2 className="text-lg font-semibold text-charcoal uppercase tracking-wide">Send a Message</h2>
                        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                            <input type="text" placeholder="Your Name" className="w-full px-4 py-3 text-base bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-rose text-charcoal" required />
                            <input type="email" placeholder="Your Email" className="w-full px-4 py-3 text-base bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-rose text-charcoal" required />
                            <textarea placeholder="Your Message..." rows={4} className="w-full px-4 py-3 text-base bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-rose text-charcoal" required />
                            <button type="submit" className="btn-primary w-full">Send Message</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
