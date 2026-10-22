import React from 'react';
import { Globe, Plane, ShieldCheck } from 'lucide-react';

export default function InternationalOrdersPage() {
    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-rose font-semibold">Worldwide Delivery</p>
                <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal">International Orders</h1>
                <p className="text-[#4B5563] text-base leading-relaxed">
                    We deliver luxury Indian couture to clients worldwide with express shipping partners.
                </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8 bg-white p-8 md:p-12 rounded-xl border border-[#E5E7EB] shadow-xs">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <Globe className="text-rose" size={24} /> Global Shipping Coverage
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] Jaridar ships to over 50 countries including North America, UK, Europe, UAE, Australia, and Singapore.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <Plane className="text-rose" size={24} /> Duties & Customs
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] Customs duties and local import taxes may apply depending on your country's regulations and are paid directly by the customer upon delivery.
                    </p>
                </div>
            </div>
        </div>
    );
}
