/**
 * Contact configuration and WhatsApp click-to-chat constants.
 */

// Primary WhatsApp business contact number (Country code 91, no plus, no spaces)
export const WHATSAPP_NUMBER = "919185025980";

// Default general inquiry message for floating chat button
export const WHATSAPP_DEFAULT_MESSAGE =
    "Hi Jaridar Fashion Couture, I would like to know more about your collection.";

/**
 * Builds a direct wa.me WhatsApp URL with prefilled text message.
 * @param {string} message - Text message to prefill in WhatsApp
 * @returns {string} Fully encoded WhatsApp URL
 */
export const buildWhatsAppLink = (message) => {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message || "");
};
