import React from 'react';
import { Package, Truck, RefreshCw } from 'lucide-react';

export default function FaqPage() {
    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-rose font-semibold">Help & Assistance</p>
                <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal">Frequently Asked Questions</h1>
                <p className="text-[#4B5563] text-base leading-relaxed">
                    Find answers to commonly asked questions about our collections, sizing, orders, and delivery.
                </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white p-6 md:p-8 rounded-xl border border-[#E5E7EB] shadow-xs space-y-3">
                    <h3 className="text-lg font-semibold text-charcoal flex items-center gap-2">
                        <Package className="text-rose" size={20} /> How do I place a custom order?
                    </h3>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] You can contact our bridal consultation team directly through our Contact Us page or reach out via email at info@jaridar.com.
                    </p>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-xl border border-[#E5E7EB] shadow-xs space-y-3">
                    <h3 className="text-lg font-semibold text-charcoal flex items-center gap-2">
                        <Truck className="text-rose" size={20} /> What are your standard shipping timelines?
                    </h3>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] Ready-to-ship garments are dispatched within 2-4 business days. Custom tailored and bridal wear orders typically take 3-6 weeks depending on embroidery detail.
                    </p>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-xl border border-[#E5E7EB] shadow-xs space-y-3">
                    <h3 className="text-lg font-semibold text-charcoal flex items-center gap-2">
                        <RefreshCw className="text-rose" size={20} /> What is your return and exchange policy?
                    </h3>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] We accept exchange requests within 7 days of delivery for non-customized garments in original, unused condition with all tags attached.
                    </p>
                </div>
            </div>
        </div>
    );
}
