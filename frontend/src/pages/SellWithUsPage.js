import React from 'react';
import { Briefcase, Handshake } from 'lucide-react';

export default function SellWithUsPage() {
    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-rose font-semibold">Artisan & Partner Inquiries</p>
                <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal">Sell with Us</h1>
                <p className="text-[#4B5563] text-base leading-relaxed">
                    Partner with Jaridar Fashion Couture to showcase master textile craftsmanship.
                </p>
            </div>

            <div className="max-w-3xl mx-auto text-center bg-white p-8 md:p-12 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
                <div className="w-14 h-14 bg-[#E8F0F8] text-[#3B6FA0] rounded-full flex items-center justify-center mx-auto">
                    <Handshake size={28} />
                </div>
                <h2 className="text-lg font-semibold text-charcoal">Partner Program</h2>
                <p className="text-[#4B5563] text-base leading-relaxed max-w-lg mx-auto">
                    [Placeholder Text] We collaborate with authentic handloom weavers and heritage embroidery master artisans. Contact info@jaridar.com for partnership opportunities.
                </p>
            </div>
        </div>
    );
}
