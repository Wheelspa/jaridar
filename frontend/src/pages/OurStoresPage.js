import React from 'react';
import { Store, MapPin, Clock, Navigation, Camera, Phone } from 'lucide-react';

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Jaridar Fashion Couture, Commercial Complex, Shop no. 3, Pink City, Kalewadi - Wakad Rd, Vishnu Dev Nagar, Wakad, Pimpri-Chinchwad, Maharashtra 411057')}`;

export default function OurStoresPage() {
    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-rose font-semibold">Visit Our Flagship Boutique</p>
                <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal">Our Store</h1>
                <p className="text-[#4B5563] text-base leading-relaxed">
                    Experience luxury Indian couture, bridal wear, and custom fitting consultations at our boutique in Wakad, Pimpri-Chinchwad, Maharashtra.
                </p>
            </div>

            <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl border border-[#E5E7EB] space-y-8 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#E5E7EB]">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#E8F0F8] text-[#3B6FA0] rounded-xl">
                                <Store size={24} />
                            </div>
                            <h2 className="text-lg font-semibold text-charcoal">Jaridar Flagship Store</h2>
                        </div>
                        <div className="space-y-2 text-sm text-[#4B5563] pl-1">
                            <div className="flex items-start gap-2.5">
                                <MapPin size={18} className="text-rose flex-shrink-0 mt-0.5" />
                                <span className="font-medium text-charcoal">Jaridar Fashion Couture, Commercial Complex, Shop no. 3, Pink City, Kalewadi - Wakad Rd, Vishnu Dev Nagar, Wakad, Pimpri-Chinchwad, Maharashtra 411057</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Clock size={18} className="text-rose flex-shrink-0" />
                                <span>Open daily: 10:00 AM – 10:00 PM</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Phone size={18} className="text-rose flex-shrink-0" />
                                <a href="tel:+919185025980" className="hover:text-rose transition-colors">+91 91850 25980</a>
                            </div>
                        </div>
                    </div>
                    <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-rose hover:bg-rose-dark text-white text-sm font-semibold uppercase tracking-wider rounded-xl transition-colors shadow-sm self-start md:self-center"
                    >
                        <Navigation size={16} />
                        Get Directions
                    </a>
                </div>

                {/* Store Photos Placeholder Box */}
                <div className="border-2 border-dashed border-[#C2255C]/40 bg-white p-12 rounded-xl text-center space-y-3 shadow-xs">
                    <div className="w-12 h-12 bg-[#E8F0F8] text-[#3B6FA0] rounded-full flex items-center justify-center mx-auto">
                        <Camera size={24} />
                    </div>
                    <h3 className="font-heading text-lg text-charcoal font-bold">[Store Photos Placeholder]</h3>
                    <p className="text-xs text-[#4B5563] max-w-md mx-auto">
                        Official photos of the Jaridar Flagship Store in Wakad, Pimpri-Chinchwad will be uploaded here.
                    </p>
                </div>
            </div>
        </div>
    );
}
