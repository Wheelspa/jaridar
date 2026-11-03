export const MENU_CONFIG = [
    {
        id: 'home',
        label: 'HOME',
        url: '/',
        hasDropdown: false
    },
    {
        id: 'collections',
        label: 'COLLECTIONS',
        url: '/shop',
        hasDropdown: true,
        columns: 3,
        items: [
            { label: 'Ethnic Wear', url: '/shop?category=ethnic' },
            { label: 'Western Wear', url: '/shop?category=western' },
            { label: 'Dresses & Gowns', url: '/shop?product_type=dresses,gowns,shirt-dresses' },
            { label: 'Co-ord Sets', url: '/shop?product_type=co-ord-sets' },
            { label: 'Tops & Shirts', url: '/shop?product_type=tops,crop-tops,shirts' },
            { label: 'Palazzo & Pant Sets', url: '/shop?search=pants|palazzo' },
            { label: 'Kurta & Suits', url: '/shop?product_type=kurta-sets,salwar-suits' },
            { label: 'Party Wear', url: '/shop?category=party-wear' },
            { label: 'Festive Collection', url: '/shop?style=festive-wear' },
            { label: 'Custom Couture', url: '/contact' },
            { label: 'Designer Blouses', url: '/shop?product_type=blouses' },
            { label: 'Shrugs & Jackets', url: '/shop?product_type=jackets,waistcoats' },
            { label: 'One-Piece Dresses', url: '/shop?product_type=dresses,maxi-dresses,mini-dresses,midi-dresses,wrap-dresses,shirt-dresses,jumpsuits' },
            { label: 'Fusion Wear', url: '/shop?style=kaftan-style,peplum' },
            { label: 'Exclusive Jaridar Collection', url: '/shop?featured=true', highlight: true }
        ]
    },
    {
        id: 'by-region',
        label: 'BY REGION',
        url: '/shop',
        hasDropdown: true,
        columns: 3,
        items: [
            { label: 'North Indian Collection', url: '/shop?region=north-indian-collection' },
            { label: 'South Indian Collection', url: '/shop?region=south-indian-collection' },
            { label: 'West Indian Collection', url: '/shop?region=west-indian-collection' },
            { label: 'East Indian Collection', url: '/shop?region=east-indian-collection' },
            { label: 'Maharashtrian Collection', url: '/shop?region=maharashtrian-collection' },
            { label: 'Rajasthani Collection', url: '/shop?region=rajasthani-collection' },
            { label: 'Gujarati Collection', url: '/shop?region=gujarati-collection' },
            { label: 'Punjabi Collection', url: '/shop?region=punjabi-collection' },
            { label: 'Bengali Collection', url: '/shop?region=bengali-collection' },
            { label: 'Kashmiri Collection', url: '/shop?region=kashmiri-collection' },
            { label: 'Lucknowi Collection', url: '/shop?region=lucknowi-collection' },
            { label: 'Indo-Western Collection', url: '/shop?region=indo-western-collection' }
        ]
    },
    {
        id: 'new-arrivals',
        label: 'NEW ARRIVALS',
        url: '/shop?filter=new',
        hasDropdown: true,
        columns: 2,
        items: [
            { label: 'Just Arrived', url: '/shop?filter=new' },
            { label: 'Latest Collection', url: '/shop?filter=new&sort=newest' },
            { label: 'Trending Now', url: '/shop?featured=true', hidden: true },
            { label: 'New Season Styles', url: '/shop?filter=new' },
            { label: 'Latest Co-ord Sets', url: '/shop?filter=new&product_type=co-ord-sets' },
            { label: 'New Dresses & Gowns', url: '/shop?filter=new&product_type=dresses,gowns,shirt-dresses' },
            { label: 'New Festive Collection', url: '/shop?filter=new&style=festive-wear' },
            { label: 'New Statement Pieces', url: '/shop?filter=new&featured=true', hidden: true },
            { label: 'Explore What\'s New', url: '/shop?filter=new' }
        ]
    },
    {
        id: 'fabrics',
        label: 'FABRICS',
        url: '/shop',
        hasDropdown: true,
        columns: 5,
        mobileColumns: 2,
        items: [
            { label: 'Cotton', url: '/shop?fabric=cotton' },
            { label: 'Silk', url: '/shop?fabric=silk' },
            { label: 'Satin', url: '/shop?fabric=satin' },
            { label: 'Georgette', url: '/shop?fabric=georgette' },
            { label: 'Chiffon', url: '/shop?fabric=chiffon' },
            { label: 'Crepe', url: '/shop?fabric=crepe' },
            { label: 'Rayon', url: '/shop?fabric=rayon' },
            { label: 'Linen', url: '/shop?fabric=linen' },
            { label: 'Velvet', url: '/shop?fabric=velvet' },
            { label: 'Organza', url: '/shop?fabric=organza' },
            { label: 'Chanderi', url: '/shop?fabric=chanderi' },
            { label: 'Banarasi Silk', url: '/shop?fabric=banarasi-silk' },
            { label: 'Brocade', url: '/shop?fabric=brocade' },
            { label: 'Muslin', url: '/shop?fabric=muslin' },
            { label: 'Net', url: '/shop?fabric=net' },
            { label: 'Denim', url: '/shop?fabric=denim' },
            { label: 'Polyester', url: '/shop?fabric=polyester' },
            { label: 'Modal', url: '/shop?fabric=modal' },
            { label: 'Jacquard', url: '/shop?fabric=jacquard' },
            { label: 'Tissue Fabric', url: '/shop?fabric=tissue-fabric' },
            { label: 'Khadi', url: '/shop?fabric=khadi' },
            { label: 'Viscose', url: '/shop?fabric=viscose' },
            { label: 'Tulle', url: '/shop?fabric=tulle' },
            { label: 'Lycra', url: '/shop?fabric=lycra' },
            { label: 'Raw Silk', url: '/shop?fabric=raw-silk' },
            { label: 'Kota Doria', url: '/shop?fabric=kota-doria' },
            { label: 'Maheshwari Silk', url: '/shop?fabric=maheshwari-silk' },
            { label: 'Paithani', url: '/shop?fabric=paithani' },
            { label: 'Bandhani', url: '/shop?fabric=bandhani' },
            { label: 'Ikat', url: '/shop?fabric=ikat' }
        ]
    },
    {
        id: 'shop-by-occasion',
        label: 'SHOP BY OCCASION',
        url: '/shop',
        hasDropdown: true,
        columns: 2,
        items: [
            { label: 'Wedding', url: '/shop?category=wedding-wear' },
            { label: 'Party', url: '/shop?category=party-wear' },
            { label: 'Festive', url: '/shop?category=festive-wear' },
            { label: 'Casual', url: '/shop?category=casual-wear' },
            { label: 'Workwear', url: '/shop?category=formal-wear' }
        ]
    },
    {
        id: 'about-us',
        label: 'ABOUT US',
        url: '/about',
        hasDropdown: false
    },
    {
        id: 'contact',
        label: 'CONTACT',
        url: '/contact',
        hasDropdown: false
    }
];

export default MENU_CONFIG;
