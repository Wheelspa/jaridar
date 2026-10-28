import React from 'react';
import { Truck, Clock, PackageCheck } from 'lucide-react';

export default function ShippingPolicyPage() {
    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-rose font-semibold">Delivery & Logistics</p>
                <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal">Shipping Policy</h1>
                <p className="text-[#4B5563] text-base leading-relaxed">
                    Information regarding order processing, shipping speeds, and tracking.
                </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8 bg-white p-8 md:p-12 rounded-xl border border-[#E5E7EB] shadow-xs">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <Truck className="text-rose" size={24} /> Domestic Shipping
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] Standard domestic shipping within India takes 3 to 7 business days for ready-to-ship garments.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <Clock className="text-rose" size={24} /> Custom & Couture Lead Times
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] Made-to-measure and couture ensembles require 3-6 weeks for meticulous hand embroidery and fitting prior to dispatch.
                    </p>
                </div>
            </div>
        </div>
    );
}
