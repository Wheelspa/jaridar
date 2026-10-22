import React from 'react';
import { Layers, PackageCheck } from 'lucide-react';

export default function BulkOrdersPage() {
    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-rose font-semibold">Corporate & Bridal Parties</p>
                <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal">Bulk Orders</h1>
                <p className="text-[#4B5563] text-base leading-relaxed">
                    Custom bulk ordering for wedding entourages, corporate gifting, and special celebrations.
                </p>
            </div>

            <div className="max-w-3xl mx-auto text-center bg-white p-8 md:p-12 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
                <div className="w-14 h-14 bg-[#E8F0F8] text-[#3B6FA0] rounded-full flex items-center justify-center mx-auto">
                    <Layers size={28} />
                </div>
                <h2 className="text-lg font-semibold text-charcoal">Bulk & Wedding Inquiries</h2>
                <p className="text-[#4B5563] text-base leading-relaxed max-w-lg mx-auto">
                    [Placeholder Text] For bulk orders exceeding 10 garments or coordinated bridesmaid sets, reach out to info@jaridar.com for special pricing and dedicated styling.
                </p>
            </div>
        </div>
    );
}
