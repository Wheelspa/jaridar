import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

export default function BlogPage() {
    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-rose font-semibold">Editorial & Stories</p>
                <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal">Jaridar Journal</h1>
                <p className="text-[#4B5563] text-base leading-relaxed">
                    Coming Soon. Stay tuned for fashion insights, styling tips, and heritage textile stories.
                </p>
            </div>

            <div className="max-w-3xl mx-auto text-center bg-white p-8 md:p-12 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
                <div className="w-14 h-14 bg-[#E8F0F8] text-[#3B6FA0] rounded-full flex items-center justify-center mx-auto">
                    <BookOpen size={28} />
                </div>
                <h2 className="text-lg font-semibold text-charcoal">Coming Soon</h2>
                <p className="text-[#4B5563] text-base leading-relaxed max-w-lg mx-auto">
                    [Placeholder Text] We are preparing curated articles on Indian couture trends, artisan spotlights, and bridal fashion advice. Check back soon!
                </p>
            </div>
        </div>
    );
}
