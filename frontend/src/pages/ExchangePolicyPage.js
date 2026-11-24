import React from 'react';
import { RefreshCw, CheckCircle, HelpCircle, Sparkles } from 'lucide-react';

export default function ExchangePolicyPage() {
    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-rose font-semibold">Customer Service</p>
                <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal">Exchange & Order Cancellation</h1>
                <p className="text-[#4B5563] text-base leading-relaxed">
                    Easy and hassle-free exchanges for sizing and style adjustments.
                </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8 bg-white p-8 md:p-12 rounded-xl border border-[#E5E7EB] shadow-xs">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <RefreshCw className="text-rose" size={24} /> Size & Style Exchanges
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] If your garment does not fit perfectly, you can request a size exchange within 7 days of receiving your package.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <CheckCircle className="text-rose" size={24} /> Exchange Eligibility
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] Products must be unworn, unwashed, and returned in their original condition with security tags attached. Custom tailored wear is excluded from standard exchanges.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <Sparkles className="text-rose" size={24} /> Virtual Try-On ("Try Me On") Refund Policy
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        Virtual Try-On is an instant digital AI preview service priced at ₹15 per session. If a try-on generation fails or encounters any technical interruption, your ₹15 payment is automatically refunded back to your account. Paid sessions remain valid for 15 minutes; if you do not upload a photo within 15 minutes of payment, the session expires and ₹15 is automatically refunded to your original payment method. Once an AI try-on image has been successfully generated and delivered, the digital service is considered fulfilled and is non-refundable. All refunds are issued automatically through our payment gateway to the original payment source (taking 2 to 5 business days to reflect).
                    </p>
                </div>
            </div>
        </div>
    );
}
