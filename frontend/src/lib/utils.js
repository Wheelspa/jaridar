import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const KNOWN_ATTRIBUTE_LABELS = {
    // Categories
    'ethnic': 'Ethnic Wear',
    'traditional': 'Traditional Wear',
    'western': 'Western Wear',
    'bridal': 'Bridal Collection',
    // Product Types
    'saree': 'Saree',
    'lehenga': 'Lehenga / Ghagra',
    'kurta-set': 'Kurta Set / Kurti',
    'salwar-suit': 'Salwar Suit / Anarkali',
    'gown': 'Gown',
    'co-ord-set': 'Co-ord Set',
    'dress': 'Dress',
    'top-shirt': 'Top / Shirt',
    'jumpsuit': 'Jumpsuit',
    'dupatta': 'Dupatta / Stole',
    'other': 'Other',
    // Styles
    'new-collection': 'New Collection',
    'casual': 'Casual',
    'party-wear': 'Party Wear',
    'partywear': 'Party Wear',
    'formal': 'Formal',
    'festive-wear': 'Festive Wear',
    'festivalwear': 'Festive Wear',
    // Regions
    'banarasi': 'Banarasi Silk',
    'kanjivaram': 'Kanjivaram Silk',
    'rajasthani': 'Rajasthani Bandhani',
    'gujarati': 'Gujarati Patola',
    'bengali': 'Bengali Jamdani',
    // Fabrics
    'silk': 'Silk',
    'cotton': 'Cotton',
    'georgette': 'Georgette',
    'velvet': 'Velvet',
    'chiffon': 'Chiffon',
    'net': 'Net',
    // Prints
    'printed': 'Printed',
    'embroidered': 'Embroidered',
    'plain': 'Plain / Solid',
    'block_print': 'Block Print',
    'zari_work': 'Zari Work'
};

export function formatAttributeLabel(val) {
    if (!val) return '';
    if (KNOWN_ATTRIBUTE_LABELS[val]) return KNOWN_ATTRIBUTE_LABELS[val];
    return String(val).replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
