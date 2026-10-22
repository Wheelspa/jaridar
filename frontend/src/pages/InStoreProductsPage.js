import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Store } from 'lucide-react';

export default function InStoreProductsPage() {
    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-rose font-semibold">Boutique Experience</p>
                <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal">In-Store Products</h1>
                <p className="text-[#4B5563] text-base leading-relaxed">
                    Explore our exquisite collections in person at our physical flagship store.
                </p>
            </div>

            <div className="max-w-3xl mx-auto text-center bg-white p-8 md:p-12 rounded-2xl border border-[#E5E7EB] space-y-6 shadow-xs">
                <div className="w-14 h-14 bg-[#E8F0F8] text-[#3B6FA0] rounded-full flex items-center justify-center mx-auto">
                    <ShoppingBag size={28} />
                </div>
                <h2 className="text-lg font-semibold text-charcoal">Try All Collections In-Store</h2>
                <p className="text-[#4B5563] text-base leading-relaxed max-w-lg mx-auto">
                    All products available on our online store—including our bridal lehengas, handwoven sarees, suits, and fusion ensembles—are also available to view, feel, and try on in-person at our Wakad, Pune boutique.
                </p>
                <div className="pt-2">
                    <Link
                        to="/our-stores"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-rose hover:bg-rose-dark text-white text-sm font-semibold uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                    >
                        <Store size={16} />
                        Visit Us
                    </Link>
                </div>
            </div>
        </div>
    );
}
