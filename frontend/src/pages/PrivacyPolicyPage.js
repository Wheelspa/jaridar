import React from 'react';
import { ShieldCheck, Lock, Eye } from 'lucide-react';

export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-rose font-semibold">Legal Information</p>
                <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal">Privacy Policy</h1>
                <p className="text-[#4B5563] text-base leading-relaxed">
                    At Jaridar Fashion Couture, we value your trust and are committed to protecting your personal information and privacy rights.
                </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8 bg-white p-8 md:p-12 rounded-xl border border-[#E5E7EB] shadow-xs">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <ShieldCheck className="text-rose" size={24} /> 1. Information We Collect
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] We collect information you provide directly to us when placing an order, creating an account, subscribing to our newsletter, or contacting customer support. This includes your name, email address, billing address, shipping address, and payment details.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <Lock className="text-rose" size={24} /> 2. How We Use Your Information
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] Your data is used exclusively to fulfill orders, process payments, provide customer support, improve our services, and send updates regarding your orders or promotional offers (with your consent).
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <Eye className="text-rose" size={24} /> 3. Data Protection & Sharing
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] We implement security measures to maintain the safety of your personal information. We do not sell, trade, or otherwise transfer your personally identifiable information to outside third parties.
                    </p>
                </div>
            </div>
        </div>
    );
}
