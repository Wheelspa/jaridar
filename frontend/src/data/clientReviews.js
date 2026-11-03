/**
 * Client Reviews Data for the "CLIENT EDITS" section.
 *
 * HOW TO FILL AN ENTRY:
 * - Each client entry has 4 fields: name, city, review, photo.
 * - 'name': Client's full name (e.g., "Pooja Patil")
 * - 'city': Client's city or location (e.g., "Pune")
 * - 'review': Client's testimonial text.
 * - 'photo': Path or URL to client photo (e.g. "/images/clients/pooja.jpg"), or "" if none.
 *
 * DISPLAY RULES:
 * - An entry is shown ONLY if its 'review' field is NOT empty.
 * - If NO entry has review text, the entire CLIENT EDITS section is automatically hidden
 *   (will not render any heading or empty space on the Home page).
 */

export const clientReviews = [
    {
        name: "Pooja Patil",
        city: "Pune",
        review: "Absolutely in love with my designer lehenga! The craftsmanship is magnificent, and the fit was custom perfection.",
        photo: ""
    },
    {
        name: "Licee Moses",
        city: "Pune",
        review: "Found the perfect zari embroidered saree for my sister's wedding. The silk quality far exceeded my expectations!",
        photo: ""
    },
    {
        name: "Manju Sha",
        city: "Pune",
        review: "Gorgeous fusion western gowns too! Love how Jaridar blends timeless heritage with modern chic silhouettes.",
        photo: ""
    }
];
