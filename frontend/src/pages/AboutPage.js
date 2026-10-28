import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const aboutImage = '/images/about/about-1.jpg';

export default function AboutPage() {
    useEffect(() => {
        document.title = "About Us | Jaridar Fashion Couture";
    }, []);

    return (
        <div className="w-full bg-white text-charcoal min-h-screen">
            {/* Header Band */}
            <div className="bg-white border-b border-[#E5E7EB] py-14 md:py-16">
                <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 xl:px-[50px] text-center space-y-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-rose font-bold">About Us</p>
                    <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal uppercase">
                        Welcome to Jaridar Fashion Couture
                    </h1>
                    <p className="text-[#4B5563] text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
                        At Jaridar Fashion Couture, we believe that fashion is more than just clothing, it is a way to express your personality, confidence, and individuality.
                    </p>
                </div>
            </div>

            {/* Main Content Sections */}
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 xl:px-[50px] py-12 md:py-16 space-y-12">
                {/* Intro Story + Image (Equal columns, vertically centered text) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12 items-center">
                    <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#E5E7EB] bg-white shadow-xs">
                        <img 
                            src={aboutImage} 
                            alt="Jaridar Fashion Couture Boutique" 
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                    <div className="w-full flex flex-col justify-center space-y-4 text-left">
                        <p className="text-[#4B5563] text-base md:text-lg leading-relaxed">
                            We are a fashion boutique dedicated to bringing creativity, elegance, and craftsmanship together. Our focus is on creating beautiful outfits that reflect your unique style, fit your preferences, and make every occasion special.
                        </p>
                    </div>
                </div>

                {/* Our Expertise (5 bullets in 2 columns on md+, 1 col on mobile) */}
                <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-bold tracking-wide text-charcoal uppercase">
                            Our Expertise
                        </h2>
                        <p className="text-[#4B5563] text-base leading-relaxed">
                            We offer a range of fashion services designed around your needs:
                        </p>
                    </div>

                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-2">
                        <li className="flex items-start gap-3 text-base text-[#4B5563] leading-relaxed">
                            <span className="text-rose text-lg leading-none mt-1 select-none">•</span>
                            <span>
                                <strong className="font-semibold text-charcoal">Custom Stitching:</strong> Perfectly tailored outfits designed for your comfort and fit.
                            </span>
                        </li>
                        <li className="flex items-start gap-3 text-base text-[#4B5563] leading-relaxed">
                            <span className="text-rose text-lg leading-none mt-1 select-none">•</span>
                            <span>
                                <strong className="font-semibold text-charcoal">Fashion Designing:</strong> Unique and creative designs that bring your ideas to life.
                            </span>
                        </li>
                        <li className="flex items-start gap-3 text-base text-[#4B5563] leading-relaxed">
                            <span className="text-rose text-lg leading-none mt-1 select-none">•</span>
                            <span>
                                <strong className="font-semibold text-charcoal">Customization:</strong> Personalized styles, patterns, cuts, and details to match your preferences.
                            </span>
                        </li>
                        <li className="flex items-start gap-3 text-base text-[#4B5563] leading-relaxed">
                            <span className="text-rose text-lg leading-none mt-1 select-none">•</span>
                            <span>
                                <strong className="font-semibold text-charcoal">Designer Wear:</strong> Carefully crafted outfits for festive occasions, celebrations, parties, and everyday elegance.
                            </span>
                        </li>
                        <li className="flex items-start gap-3 text-base text-[#4B5563] leading-relaxed">
                            <span className="text-rose text-lg leading-none mt-1 select-none">•</span>
                            <span>
                                <strong className="font-semibold text-charcoal">Ready-to-Wear Fashion:</strong> A selection of stylish outfits designed for different tastes and occasions.
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Philosophy and Promise (Side by side on md+, stacked on mobile) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                    {/* Our Philosophy */}
                    <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4 flex flex-col justify-between">
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-bold tracking-wide text-charcoal uppercase">
                                Our Philosophy
                            </h2>
                            <p className="text-[#4B5563] text-base leading-relaxed">
                                At Jaridar, we believe every outfit should feel as special as the person wearing it. We pay attention to the little details, from fabric and fitting to patterns, finishing, and design, to deliver a personalized fashion experience.
                            </p>
                            <p className="text-[#4B5563] text-base leading-relaxed">
                                Our goal is to combine modern trends with individual creativity, offering styles that are elegant, comfortable, and distinctive.
                            </p>
                        </div>
                    </div>

                    {/* Our Promise */}
                    <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4 flex flex-col justify-between">
                        <div className="space-y-4">
                            <h2 className="text-xl md:text-2xl font-bold tracking-wide text-charcoal uppercase">
                                Our Promise
                            </h2>
                            <p className="text-[#4B5563] text-base leading-relaxed">
                                Your ideas inspire our designs. Your preferences guide our creativity. And your satisfaction is at the heart of everything we do.
                            </p>
                        </div>
                        <div className="pt-2">
                            <p className="text-base md:text-lg font-bold text-charcoal tracking-wide">
                                Jaridar Fashion Couture, Fashion Crafted Around You.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Call to Action Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link 
                        to="/our-stores" 
                        className="btn-primary w-full sm:w-auto text-center"
                    >
                        Visit Our Store
                    </Link>
                    <Link 
                        to="/contact" 
                        className="btn-secondary w-full sm:w-auto text-center"
                    >
                        Contact Us
                    </Link>
                </div>
            </div>
        </div>
    );
}
