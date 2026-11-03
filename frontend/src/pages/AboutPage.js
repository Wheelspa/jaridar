import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Navigation, Store } from 'lucide-react';

const aboutImage = '/images/about/about-1.jpg';
const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Jaridar Fashion Couture, Commercial Complex, Shop no. 3, Pink City, Kalewadi - Wakad Rd, Vishnu Dev Nagar, Wakad, Pimpri-Chinchwad, Maharashtra 411057')}`;

export default function AboutPage() {
    const [collectionVideoError, setCollectionVideoError] = useState(false);

    useEffect(() => {
        document.title = "About Us | Jaridar Fashion Couture";
    }, []);

    return (
        <div className="w-full bg-white text-[#1F2937] min-h-screen">
            {/* Header Band */}
            <div className="bg-white border-b border-[#E5E7EB] py-12 md:py-16">
                <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 xl:px-[50px] text-center space-y-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-[#C2255C] font-bold">About Us</p>
                    <h1 className="font-heading text-2xl md:text-4xl font-bold tracking-wide text-[#1F2937] uppercase">
                        Welcome to Jaridar Fashion Couture
                    </h1>
                    <div className="w-12 h-0.5 bg-[#C2255C] rounded-full mx-auto" />
                    <p className="text-[#4B5563] text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
                        At Jaridar Fashion Couture, we believe that fashion is more than just clothing, it is a way to express your personality, confidence, and individuality.
                    </p>
                </div>
            </div>

            {/* Main Content Sections */}
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 xl:px-[50px] py-12 md:py-16 space-y-16">
                {/* Intro Story + Decorative Sketch A */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    <div className="w-full lg:col-span-5 aspect-[4/3] rounded-2xl overflow-hidden border border-[#E5E7EB] bg-white shadow-xs">
                        <img 
                            src={aboutImage} 
                            alt="Jaridar Fashion Couture Boutique" 
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                    <div className="w-full lg:col-span-7 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
                        <div className="flex-1 space-y-4">
                            <p className="text-[#4B5563] text-base md:text-lg leading-relaxed">
                                We are a fashion boutique dedicated to bringing creativity, elegance, and craftsmanship together. Our focus is on creating beautiful outfits that reflect your unique style, fit your preferences, and make every occasion special.
                            </p>
                        </div>
                        {/* Decorative sketch: desktop only, right side, about 220px wide, opacity 0.9, mix-blend-mode multiply */}
                        <div className="hidden md:block flex-shrink-0 w-[190px] lg:w-[220px]">
                            <img 
                                src="/images/story/story-sketch-drape.jpg" 
                                alt="Fashion designer draping sketch" 
                                className="w-full h-auto object-contain opacity-90"
                                style={{ mixBlendMode: 'multiply' }}
                                loading="lazy"
                                decoding="async"
                            />
                        </div>
                    </div>
                </div>

                {/* Section B: HOW WE WORK (label: DESIGN • CUSTOMIZE • STITCH) */}
                <div className="space-y-8">
                    <div className="text-center space-y-2">
                        <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#C2255C]">
                            DESIGN • CUSTOMIZE • STITCH
                        </p>
                        <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl text-[#1F2937] uppercase tracking-wide font-bold">
                            How We Work
                        </h2>
                        <div className="w-12 h-0.5 bg-[#C2255C] rounded-full mx-auto mt-2.5" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {/* 1. DESIGN */}
                        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs p-3.5 space-y-3.5 flex flex-col justify-between">
                            <div className="aspect-[4/5] w-full rounded-xl overflow-hidden bg-neutral-100 border border-[#E5E7EB]">
                                <img 
                                    src="/images/story/story-design-sketchbook.jpg" 
                                    alt="Design - Share your idea, style and reference pictures" 
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                            <div className="p-2 space-y-1.5 text-left">
                                <div className="flex items-center gap-2">
                                    <span className="font-heading text-sm font-bold text-[#C2255C] tracking-wider">01</span>
                                    <span className="text-[#E5E7EB]">|</span>
                                    <h3 className="font-heading text-base md:text-lg font-bold text-[#1F2937] uppercase tracking-wide">
                                        DESIGN
                                    </h3>
                                </div>
                                <p className="text-sm md:text-base text-[#4B5563] leading-relaxed">
                                    Share your idea, your style and reference pictures. We turn them into a design.
                                </p>
                            </div>
                        </div>

                        {/* 2. CUSTOMIZE */}
                        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs p-3.5 space-y-3.5 flex flex-col justify-between">
                            <div className="aspect-[4/5] w-full rounded-xl overflow-hidden bg-neutral-100 border border-[#E5E7EB]">
                                <img 
                                    src="/images/story/story-customize-moodboard.jpg" 
                                    alt="Customize - Choose fabric, colour, neckline, sleeves and fitting" 
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                            <div className="p-2 space-y-1.5 text-left">
                                <div className="flex items-center gap-2">
                                    <span className="font-heading text-sm font-bold text-[#C2255C] tracking-wider">02</span>
                                    <span className="text-[#E5E7EB]">|</span>
                                    <h3 className="font-heading text-base md:text-lg font-bold text-[#1F2937] uppercase tracking-wide">
                                        CUSTOMIZE
                                    </h3>
                                </div>
                                <p className="text-sm md:text-base text-[#4B5563] leading-relaxed">
                                    Choose fabric, colour, neckline, sleeves and fitting, made your way.
                                </p>
                            </div>
                        </div>

                        {/* 3. STITCH */}
                        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs p-3.5 space-y-3.5 flex flex-col justify-between">
                            <div className="aspect-[4/5] w-full rounded-xl overflow-hidden bg-neutral-100 border border-[#E5E7EB]">
                                <img 
                                    src="/images/story/story-stitch.jpg" 
                                    alt="Stitch - Your outfit is stitched with care" 
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                            <div className="p-2 space-y-1.5 text-left">
                                <div className="flex items-center gap-2">
                                    <span className="font-heading text-sm font-bold text-[#C2255C] tracking-wider">03</span>
                                    <span className="text-[#E5E7EB]">|</span>
                                    <h3 className="font-heading text-base md:text-lg font-bold text-[#1F2937] uppercase tracking-wide">
                                        STITCH
                                    </h3>
                                </div>
                                <p className="text-sm md:text-base text-[#4B5563] leading-relaxed">
                                    Your outfit is stitched with care and finished to fit you.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section C: OUR COLLECTION (Two columns: Video card left, Text + CTA right) */}
                <div className="bg-white p-6 sm:p-8 md:p-12 rounded-2xl border border-[#E5E7EB] shadow-xs">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-14">
                        {/* Left: Portrait Video Card (max-w-[340px], rounded-2xl, soft shadow) */}
                        <div className="w-full md:w-auto flex justify-center flex-shrink-0">
                            <div className="w-full max-w-[340px] aspect-[368/656] rounded-2xl overflow-hidden shadow-md lg:shadow-lg border border-[#E5E7EB] bg-black">
                                {collectionVideoError ? (
                                    <img 
                                        src="/videos/our-story/about-blouse-video-poster.jpg" 
                                        alt="Festive Blouse Collection" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <video 
                                        src="/videos/our-story/about-blouse-video.mp4" 
                                        poster="/videos/our-story/about-blouse-video-poster.jpg" 
                                        autoPlay 
                                        muted 
                                        loop 
                                        playsInline 
                                        preload="metadata"
                                        onError={() => setCollectionVideoError(true)}
                                        className="w-full h-full object-cover pointer-events-none"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Right: Label, Heading, Line, Button */}
                        <div className="w-full flex-1 text-center md:text-left space-y-4">
                            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#C2255C]">
                                OUR COLLECTION
                            </p>
                            <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl text-[#1F2937] uppercase tracking-wide font-bold">
                                DESIGNED WITH DETAIL
                            </h2>
                            <div className="w-12 h-0.5 bg-[#C2255C] rounded-full mx-auto md:mx-0" />
                            <p className="text-base md:text-lg text-[#4B5563] leading-relaxed max-w-xl">
                                Festive blouses and outfits, made with detail and care.
                            </p>
                            <div className="pt-2">
                                <Link 
                                    to="/shop?category=festive-wear" 
                                    className="px-6 sm:px-7 py-3 bg-[#C2255C] text-white text-xs sm:text-sm uppercase tracking-wider font-semibold rounded-xl hover:bg-[#9C1D49] transition-all shadow-xs inline-flex items-center justify-center"
                                >
                                    SHOP FESTIVE WEAR
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section D: VISIT OUR BOUTIQUE */}
                <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-6">
                    <div className="text-center md:text-left space-y-2">
                        <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#C2255C]">
                            OUR BOUTIQUE
                        </p>
                        <h2 className="font-heading text-2xl md:text-3xl text-[#1F2937] uppercase tracking-wide font-bold">
                            VISIT OUR BOUTIQUE
                        </h2>
                        <div className="w-12 h-0.5 bg-[#C2255C] rounded-full mx-auto md:mx-0" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                        {/* Address */}
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-[#E8F0F8] text-[#3B6FA0] rounded-xl flex-shrink-0 mt-0.5">
                                <MapPin size={20} />
                            </div>
                            <div className="space-y-1 text-sm text-[#4B5563]">
                                <span className="font-bold text-[#1F2937] block">Boutique Address</span>
                                <p className="leading-relaxed">
                                    Jaridar Fashion Couture, Commercial Complex, Shop no. 3, Pink City, Kalewadi - Wakad Rd, Vishnu Dev Nagar, Wakad, Pimpri-Chinchwad, Maharashtra 411057
                                </p>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-[#E8F0F8] text-[#3B6FA0] rounded-xl flex-shrink-0 mt-0.5">
                                <Phone size={20} />
                            </div>
                            <div className="space-y-1 text-sm text-[#4B5563]">
                                <span className="font-bold text-[#1F2937] block">Phone (Tap to Call)</span>
                                <a 
                                    href="tel:+919185025980" 
                                    className="text-[#C2255C] hover:text-[#9C1D49] font-semibold transition-colors block text-base"
                                >
                                    +91 91850 25980
                                </a>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-[#E8F0F8] text-[#3B6FA0] rounded-xl flex-shrink-0 mt-0.5">
                                <Mail size={20} />
                            </div>
                            <div className="space-y-1 text-sm text-[#4B5563]">
                                <span className="font-bold text-[#1F2937] block">Email Us</span>
                                <a 
                                    href="mailto:info@jaridar.com" 
                                    className="text-[#C2255C] hover:text-[#9C1D49] font-semibold transition-colors block text-base"
                                >
                                    info@jaridar.com
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 border-t border-[#E5E7EB]">
                        <a 
                            href={googleMapsUrl}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-6 sm:px-7 py-3 bg-[#C2255C] text-white text-xs sm:text-sm uppercase tracking-wider font-semibold rounded-xl hover:bg-[#9C1D49] transition-all shadow-xs inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            <Navigation size={16} />
                            <span>GET DIRECTIONS</span>
                        </a>
                        <Link 
                            to="/our-stores" 
                            className="px-6 sm:px-7 py-3 border border-[#C2255C] text-[#C2255C] hover:bg-[#C2255C] hover:text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            <Store size={16} />
                            <span>OUR STORES</span>
                        </Link>
                    </div>
                </div>

                {/* Section E: Rest of Page - Our Expertise */}
                <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-6">
                    <div className="space-y-2">
                        <h2 className="font-heading text-xl md:text-2xl font-bold tracking-wide text-[#1F2937] uppercase">
                            Our Expertise
                        </h2>
                        <div className="w-12 h-0.5 bg-[#C2255C] rounded-full" />
                        <p className="text-[#4B5563] text-base leading-relaxed pt-1">
                            We offer a range of fashion services designed around your needs:
                        </p>
                    </div>

                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-2">
                        <li className="flex items-start gap-3 text-base text-[#4B5563] leading-relaxed">
                            <span className="text-[#C2255C] text-lg leading-none mt-1 select-none">•</span>
                            <span>
                                <strong className="font-semibold text-[#1F2937]">Custom Stitching:</strong> Perfectly tailored outfits designed for your comfort and fit.
                            </span>
                        </li>
                        <li className="flex items-start gap-3 text-base text-[#4B5563] leading-relaxed">
                            <span className="text-[#C2255C] text-lg leading-none mt-1 select-none">•</span>
                            <span>
                                <strong className="font-semibold text-[#1F2937]">Fashion Designing:</strong> Unique and creative designs that bring your ideas to life.
                            </span>
                        </li>
                        <li className="flex items-start gap-3 text-base text-[#4B5563] leading-relaxed">
                            <span className="text-[#C2255C] text-lg leading-none mt-1 select-none">•</span>
                            <span>
                                <strong className="font-semibold text-[#1F2937]">Customization:</strong> Personalized styles, patterns, cuts, and details to match your preferences.
                            </span>
                        </li>
                        <li className="flex items-start gap-3 text-base text-[#4B5563] leading-relaxed">
                            <span className="text-[#C2255C] text-lg leading-none mt-1 select-none">•</span>
                            <span>
                                <strong className="font-semibold text-[#1F2937]">Designer Wear:</strong> Carefully crafted outfits for festive occasions, celebrations, parties, and everyday elegance.
                            </span>
                        </li>
                        <li className="flex items-start gap-3 text-base text-[#4B5563] leading-relaxed">
                            <span className="text-[#C2255C] text-lg leading-none mt-1 select-none">•</span>
                            <span>
                                <strong className="font-semibold text-[#1F2937]">Ready-to-Wear Fashion:</strong> A selection of stylish outfits designed for different tastes and occasions.
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Section E: Rest of Page - Philosophy and Promise */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                    {/* Our Philosophy */}
                    <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4 flex flex-col justify-between">
                        <div className="space-y-4">
                            <h2 className="font-heading text-xl md:text-2xl font-bold tracking-wide text-[#1F2937] uppercase">
                                Our Philosophy
                            </h2>
                            <div className="w-12 h-0.5 bg-[#C2255C] rounded-full" />
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
                            <h2 className="font-heading text-xl md:text-2xl font-bold tracking-wide text-[#1F2937] uppercase">
                                Our Promise
                            </h2>
                            <div className="w-12 h-0.5 bg-[#C2255C] rounded-full" />
                            <p className="text-[#4B5563] text-base leading-relaxed">
                                Your ideas inspire our designs. Your preferences guide our creativity. And your satisfaction is at the heart of everything we do.
                            </p>
                        </div>
                        <div className="pt-2">
                            <p className="font-heading text-base md:text-lg font-bold text-[#1F2937] tracking-wide">
                                Jaridar Fashion Couture, Fashion Crafted Around You.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Call to Action Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link 
                        to="/our-stores" 
                        className="px-8 py-3.5 bg-[#C2255C] text-white text-xs sm:text-sm uppercase tracking-wider font-semibold rounded-xl hover:bg-[#9C1D49] transition-all shadow-xs w-full sm:w-auto text-center"
                    >
                        Visit Our Store
                    </Link>
                    <Link 
                        to="/contact" 
                        className="px-8 py-3.5 border border-[#C2255C] text-[#C2255C] hover:bg-[#C2255C] hover:text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs w-full sm:w-auto text-center"
                    >
                        Contact Us
                    </Link>
                </div>
            </div>
        </div>
    );
}
