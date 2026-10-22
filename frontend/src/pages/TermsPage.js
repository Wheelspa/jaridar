import React from 'react';
import { FileText, Scale, CheckCircle } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-rose font-semibold">Legal Agreement</p>
                <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal">Terms & Conditions</h1>
                <p className="text-[#4B5563] text-base leading-relaxed">
                    Please read these terms and conditions carefully before using Jaridar Fashion Couture services.
                </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8 bg-white p-8 md:p-12 rounded-xl border border-[#E5E7EB] shadow-xs">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <FileText className="text-rose" size={24} /> 1. Acceptance of Terms
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] By accessing or using the Jaridar website and purchasing our luxury couture collections, you agree to be bound by these Terms and Conditions and our Privacy Policy.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <Scale className="text-rose" size={24} /> 2. Products & Pricing
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] All prices displayed are subject to change without prior notice. Handcrafted couture items may feature subtle variations in weave and embroidery, celebrating authentic craftsmanship.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal flex items-center gap-3">
                        <CheckCircle className="text-rose" size={24} /> 3. Intellectual Property
                    </h2>
                    <p className="text-[#4B5563] text-base leading-relaxed">
                        [Placeholder Text] All content included on this website, such as images, designs, logos, text, and graphics, is the property of Jaridar Fashion Couture and is protected by copyright laws.
                    </p>
                </div>
            </div>
        </div>
    );
}
