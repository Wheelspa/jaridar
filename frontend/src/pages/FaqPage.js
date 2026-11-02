import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
    {
        question: "What is Jaridar Fashion Couture?",
        answer: "Jaridar Fashion Couture is a fashion brand focused on stylish, premium, and personalized outfits. We offer stitching, designing, customization, and fashionable clothing for different styles and occasions."
    },
    {
        question: "What services does Jaridar offer?",
        answer: "We offer stitching, custom outfit designing, garment customization, and a selection of fashionable outfits to suit different preferences and occasions."
    },
    {
        question: "Can I customize an outfit according to my choice?",
        answer: "Yes! You can share your ideas, preferred style, fabric, colour, pattern, and fitting requirements with us. We aim to bring your vision to life with a personalized touch."
    },
    {
        question: "Can I share a reference picture for my outfit?",
        answer: "Yes, you can share reference pictures or inspiration designs. Our team will discuss the design possibilities and suggest suitable options according to your requirements."
    },
    {
        question: "Do you stitch outfits using customer-provided fabric?",
        answer: "You can contact us to discuss stitching with your own fabric. Availability depends on the garment design and fabric suitability."
    },
    {
        question: "What types of outfits do you offer?",
        answer: "Our collection and services may include kurtas, tops, trousers, pants, co-ord sets, gowns, dresses, one-piece outfits, shrugs, salwar suits, and customized designs."
    },
    {
        question: "Do you create outfits for special occasions?",
        answer: "Yes! We offer fashionable outfit options for festivals, parties, celebrations, weddings, and other special occasions, depending on your requirements."
    },
    {
        question: "How can I place an order?",
        answer: "You can contact Jaridar Fashion Couture through our available contact channels or visit our boutique. Share your preferred design and requirements, and we will guide you through the ordering process."
    },
    {
        question: "How is the price of a customized outfit decided?",
        answer: "Pricing depends on the design, fabric, detailing, stitching complexity, and customization requirements. Contact us with your preferences for a price estimate."
    },
    {
        question: "How long will it take to complete my order?",
        answer: "The delivery timeline depends on the outfit design, customization, and current workload. We will communicate the expected completion date when confirming your order."
    },
    {
        question: "Can I request changes to the neckline, sleeves, or fitting?",
        answer: "Yes! You can discuss your preferred neckline, sleeve style, length, fitting, and other design details with us before your order is finalized."
    },
    {
        question: "Where is Jaridar Fashion Couture located?",
        answer: "Jaridar Fashion Couture is located in Wakad, Pimpri-Chinchwad, Maharashtra. Contact us for directions and boutique visit information."
    },
    {
        question: "How can I contact Jaridar Fashion Couture?",
        answer: "You can connect with us through Instagram at @jaridarfashion_1 or email us at info@jaridar.com for inquiries about our collection, stitching, designing, and customization services."
    },
    {
        question: "Can I get an outfit designed exclusively for me?",
        answer: "Yes! We welcome your creative ideas and preferences to help you achieve a personalized look that reflects your individual style."
    },
    {
        question: "Why should I choose Jaridar Fashion Couture?",
        answer: "At Jaridar Fashion Couture, we believe fashion should reflect your personality. Our focus is on stylish designs, personalized customization, thoughtful detailing, and outfits created to suit your preferences."
    }
];

export default function FaqPage() {
    const [openIndex, setOpenIndex] = useState(0);

    const toggleFaq = (index) => {
        setOpenIndex((prev) => (prev === index ? null : index));
    };

    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
            {/* Structured Data: FAQPage Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": FAQS.map((faq) => ({
                            "@type": "Question",
                            "name": faq.question,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": faq.answer
                            }
                        }))
                    })
                }}
            />

            {/* Page Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-rose font-semibold">Help & Assistance</p>
                <h1 className="text-2xl md:text-4xl font-bold tracking-wide text-charcoal">Frequently Asked Questions</h1>
                <p className="text-[#4B5563] text-base leading-relaxed">
                    Find answers to commonly asked questions about our collections, sizing, orders, and delivery.
                </p>
            </div>

            {/* Accordion FAQ List */}
            <div className="max-w-4xl mx-auto space-y-4">
                {FAQS.map((faq, index) => {
                    const isOpen = openIndex === index;
                    return (
                        <div
                            key={index}
                            className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden transition-all duration-200"
                        >
                            <button
                                type="button"
                                onClick={() => toggleFaq(index)}
                                aria-expanded={isOpen}
                                aria-controls={`faq-answer-${index}`}
                                id={`faq-question-${index}`}
                                className="w-full p-5 sm:p-6 md:p-7 flex items-center justify-between text-left gap-4 hover:bg-gray-50/60 transition-colors cursor-pointer select-none"
                            >
                                <span className="text-base sm:text-lg font-semibold text-charcoal pr-2">
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 text-rose shrink-0 transition-transform duration-200 ${
                                        isOpen ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>
                            {isOpen && (
                                <div
                                    id={`faq-answer-${index}`}
                                    role="region"
                                    aria-labelledby={`faq-question-${index}`}
                                    className="px-5 pb-5 sm:px-6 sm:pb-6 md:px-7 md:pb-7 text-[#4B5563] text-base leading-relaxed border-t border-gray-100/80 pt-4"
                                >
                                    <p>{faq.answer}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
