import React from 'react';
import { useLocation } from 'react-router-dom';
import { buildWhatsAppLink, WHATSAPP_DEFAULT_MESSAGE } from '../../config/contact';
import { WhatsAppIcon } from './WhatsAppIcon';

/**
 * Floating WhatsApp click-to-chat button.
 * - Visible on all public pages.
 * - Hidden on /admin, checkout, and payment pages.
 * - Desktop: displays "Chat with us" hover tooltip on the left.
 * - Mobile: compact 56px floating icon.
 */
export const WhatsAppFloatingButton = () => {
    const location = useLocation();
    const pathname = location?.pathname || '';

    // Hide on admin, checkout, and payment pages
    const isHidden = 
        pathname.startsWith('/admin') || 
        pathname === '/checkout' || 
        pathname.startsWith('/checkout/') ||
        pathname === '/payment' ||
        pathname.startsWith('/payment/');

    if (isHidden) {
        return null;
    }

    const whatsappUrl = buildWhatsAppLink(WHATSAPP_DEFAULT_MESSAGE);

    return (
        <aside
            aria-label="WhatsApp Support"
            className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-40 flex items-center group pointer-events-auto"
        >
            {/* Desktop-only hover tooltip label to the left */}
            <span
                id="whatsapp-hover-label"
                role="tooltip"
                className="hidden md:inline-flex items-center mr-3 px-3.5 py-1.5 text-xs font-medium text-charcoal bg-white rounded-full shadow-md border border-[#E5E7EB] opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none select-none whitespace-nowrap -translate-x-1 group-hover:translate-x-0"
            >
                Chat with us
            </span>

            {/* Round 56px WhatsApp button */}
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with Jaridar on WhatsApp"
                aria-describedby="whatsapp-hover-label"
                className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
                data-testid="whatsapp-floating-btn"
            >
                <WhatsAppIcon className="w-8 h-8 fill-current text-white" />
            </a>
        </aside>
    );
};
