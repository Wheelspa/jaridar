import React from 'react';
import { Award, Sparkles, Heart, Shield } from 'lucide-react';

const aboutImage = '/images/about/about-1.jpg';

export default function AboutPage() {
    return (
        <div className="w-full bg-white text-charcoal min-h-screen">
            {/* Header Band */}
            <div className="bg-white border-b border-[#E5E7EB] py-16">
                <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px] text-center max-w-4xl mx-auto space-y-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-rose font-bold">Our Heritage</p>
                    <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal uppercase">Where Heritage Meets Craftsmanship</h1>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        Jaridar Fashion Couture brings together timeless Indian textile traditions and contemporary elegance.
                        Every drape, weave, and embroidery in our collection tells a story of passion, art, and timeless sophistication.
                    </p>
                </div>
            </div>

            <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px] py-16 space-y-16">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden border border-[#E5E7EB] bg-white shadow-xs">
                        <img 
                            src={aboutImage} 
                            alt="Artisan Craftsmanship" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-xl md:text-2xl font-bold tracking-wide text-charcoal uppercase">Handcrafted Perfection</h2>
                        <p className="text-[#4B5563] text-base leading-relaxed">
                            From hand-woven Banarasi silk sarees to intricately detailed bridal lehengas, our master artisans devote hundreds of hours to creating garments that radiate royal grace and comfort.
                        </p>
                        <div className="grid grid-cols-2 gap-6 pt-4">
                            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-[#E5E7EB] shadow-xs">
                                <div className="p-3 bg-white text-rose rounded-xl border border-[#E5E7EB] shadow-xs"><Award size={24} /></div>
                                <div>
                                    <h3 className="font-semibold text-charcoal text-sm">Authentic Fabrics</h3>
                                    <p className="text-xs text-[#4B5563] mt-1">100% genuine silk, cotton & chiffons.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-[#E5E7EB] shadow-xs">
                                <div className="p-3 bg-white text-rose rounded-xl border border-[#E5E7EB] shadow-xs"><Sparkles size={24} /></div>
                                <div>
                                    <h3 className="font-semibold text-charcoal text-sm">Custom Fitting</h3>
                                    <p className="text-xs text-[#4B5563] mt-1">Tailored perfection for your special occasions.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
