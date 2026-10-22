import React from 'react';
import { CreditCard, Shield, Smartphone } from 'lucide-react';

export default function PaymentOptionsPage() {
    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-rose font-semibold">Secure Transactions</p>
                <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal">Payment Options</h1>
                <p className="text-[#4B5563] text-base leading-relaxed">
                    We accept a wide variety of safe and secure payment methods for your convenience.
                </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8 bg-white p-8 md:p-12 rounded-xl border border-[#E5E7EB] shadow-xs">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <CreditCard className="text-rose" size={24} /> Cards & Net Banking
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] Visa, Mastercard, American Express, and all major Indian net banking portals via encrypted Razorpay gateway.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <Smartphone className="text-rose" size={24} /> UPI & Digital Wallets
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] Google Pay, PhonePe, Paytm, and all BHIM UPI payment solutions.
                    </p>
                </div>
            </div>
        </div>
    );
}
