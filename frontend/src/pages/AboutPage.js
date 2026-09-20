import React from 'react';
import { Award, Sparkles, Heart, Shield } from 'lucide-react';

const aboutImage = '/images/about/about-1.jpg';

export default function AboutPage() {
    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-16">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-rose font-semibold">Our Heritage</p>
                <h1 className="font-heading text-4xl md:text-6xl text-charcoal font-bold">Where Heritage Meets Craftsmanship</h1>
                <p className="text-[#6B5B55] text-lg leading-relaxed">
                    Jaridar Fashion Couture brings together timeless Indian textile traditions and contemporary elegance.
                    Every drape, weave, and embroidery in our collection tells a story of passion, art, and timeless sophistication.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="aspect-[4/3] rounded-md overflow-hidden border border-[#EADFD6]">
                    <img 
                        src={aboutImage} 
                        alt="Artisan Craftsmanship" 
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="space-y-6">
                    <h2 className="font-heading text-3xl text-charcoal font-bold">Handcrafted Perfection</h2>
                    <p className="text-[#6B5B55] leading-relaxed">
                        From hand-woven Banarasi silk sarees to intricately detailed bridal lehengas, our master artisans devote hundreds of hours to creating garments that radiate royal grace and comfort.
                    </p>
                    <div className="grid grid-cols-2 gap-6 pt-4">
                        <div className="flex items-start gap-3">
                            <div className="p-3 bg-[#F6E4E6] text-rose rounded-xl"><Award size={24} /></div>
                            <div>
                                <h3 className="font-semibold text-charcoal text-sm">Authentic Fabrics</h3>
                                <p className="text-xs text-[#6B5B55] mt-1">100% genuine silk, cotton & chiffons.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-3 bg-[#F6E4E6] text-rose rounded-xl"><Sparkles size={24} /></div>
                            <div>
                                <h3 className="font-semibold text-charcoal text-sm">Custom Fitting</h3>
                                <p className="text-xs text-[#6B5B55] mt-1">Tailored perfection for your special occasions.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
