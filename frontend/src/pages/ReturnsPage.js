import React from 'react';
import { RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

export default function ReturnsPage() {
    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-rose font-semibold">Customer Service</p>
                <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal">Returns & Cancellation</h1>
                <p className="text-[#4B5563] text-base leading-relaxed">
                    Learn about our return guidelines, cancellation procedures, and refund processing.
                </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8 bg-white p-8 md:p-12 rounded-xl border border-[#E5E7EB] shadow-xs">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <RotateCcw className="text-rose" size={24} /> Return Policy Overview
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] We accept return requests within 7 days of delivery for eligible unused items in their original packaging with tags intact.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <AlertCircle className="text-rose" size={24} /> Order Cancellations
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] Orders can be cancelled within 24 hours of placement if they have not yet entered production or shipping.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <CheckCircle className="text-rose" size={24} /> Refund Processing
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] Approved refunds will be processed back to your original payment method within 5-7 business days after quality inspection.
                    </p>
                </div>
            </div>
        </div>
    );
}
