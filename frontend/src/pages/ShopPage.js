import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Filter, ChevronDown, X, Grid3X3, LayoutGrid, RotateCcw } from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const prettify = (val) => {
    if (!val) return '';
    return val.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const FILTER_SECTIONS = [
    { key: 'category', heading: 'Category', param: 'category' },
    { key: 'product_type', heading: 'Product Type', param: 'product_type' },
    { key: 'style', heading: 'Style', param: 'style' },
    { key: 'region', heading: 'Region', param: 'region' },
    { key: 'fabric', heading: 'Fabric', param: 'fabric' },
    { key: 'print_type', heading: 'Print / Craft', param: 'print_type' }
];

const priceRanges = [
    { label: 'Under ₹3,000', min: '', max: '3000' },
    { label: '₹3,000 - ₹10,000', min: '3000', max: '10000' },
    { label: '₹10,000 - ₹25,000', min: '10000', max: '25000' },
    { label: '₹25,000 - ₹50,000', min: '25000', max: '50000' },
    { label: 'Above ₹50,000', min: '50000', max: '' }
];

const ShopPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [attributesData, setAttributesData] = useState({
        category: [],
        product_type: [],
        style: [],
        region: [],
        fabric: [],
        print_type: []
    });
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [gridCols, setGridCols] = useState(4);
    const [error, setError] = useState(false);

    // Collapsible filter groups state
    const [openGroups, setOpenGroups] = useState({
        category: true,
        product_type: true,
        style: true,
        region: true,
        fabric: true,
        print_type: true,
        price: true,
    });

    const toggleGroup = (groupKey) => {
        setOpenGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
    };

    const filterParam = searchParams.get('filter') || '';
    const category = searchParams.get('category') || '';
    const subcategory = searchParams.get('subcategory') || '';
    const product_type = searchParams.get('product_type') || '';
    const region = searchParams.get('region') || '';
    const fabric = searchParams.get('fabric') || '';
    const print_type = searchParams.get('print_type') || '';
    const style = searchParams.get('style') || '';
    const search = searchParams.get('search') || '';
    const featured = searchParams.get('featured') || '';
    const isNew = searchParams.get('is_new') || (filterParam === 'new' ? 'true' : '');
    const sort = searchParams.get('sort') || 'newest';
    const minPrice = searchParams.get('min_price') || '';
    const maxPrice = searchParams.get('max_price') || '';

    useEffect(() => {
        fetchCategories();
        fetchAttributes();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [category, subcategory, product_type, region, fabric, print_type, style, search, featured, isNew, filterParam, minPrice, maxPrice]);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API}/categories`);
            setCategories(response.data);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchAttributes = async () => {
        try {
            const response = await axios.get(`${API}/attributes?with_counts=true`);
            if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
                setAttributesData(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch attributes with counts:', err);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        setError(false);
        try {
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (subcategory) params.append('subcategory', subcategory);
            if (product_type) params.append('product_type', product_type);
            if (region) params.append('region', region);
            if (fabric) params.append('fabric', fabric);
            if (print_type) params.append('print_type', print_type);
            if (style) params.append('style', style);
            if (search) params.append('search', search);
            if (featured) params.append('featured', featured);
            if (isNew) params.append('is_new', isNew);
            if (minPrice) params.append('min_price', minPrice);
            if (maxPrice) params.append('max_price', maxPrice);

            const response = await axios.get(`${API}/products?${params.toString()}`);
            setProducts(response.data || []);
        } catch (err) {
            console.error('Failed to fetch products:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const updateFilter = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        setSearchParams(newParams);
    };

    const toggleMultiFilter = (key, value) => {
        const currentStr = searchParams.get(key) || '';
        const currentList = currentStr ? currentStr.split(',').map(s => s.trim()).filter(Boolean) : [];
        let newList;
        if (currentList.includes(value)) {
            newList = currentList.filter(item => item !== value);
        } else {
            newList = [...currentList, value];
        }
        const newParams = new URLSearchParams(searchParams);
        if (newList.length > 0) {
            newParams.set(key, newList.join(','));
        } else {
            newParams.delete(key);
        }
        setSearchParams(newParams);
    };

    const clearFilters = () => {
        setSearchParams({});
    };

    // Helper to safely parse price as a numeric value
    const getNumericPrice = (p) => {
        if (!p || p.price === undefined || p.price === null) return 0;
        if (typeof p.price === 'number') return isNaN(p.price) ? 0 : p.price;
        const cleaned = String(p.price).replace(/[^0-9.]/g, '');
        const val = parseFloat(cleaned);
        return isNaN(val) ? 0 : val;
    };

    const sortProducts = (productsList) => {
        if (!Array.isArray(productsList)) return [];
        switch (sort) {
            case 'price-low':
                return [...productsList].sort((a, b) => getNumericPrice(a) - getNumericPrice(b));
            case 'price-high':
                return [...productsList].sort((a, b) => getNumericPrice(b) - getNumericPrice(a));
            case 'rating':
                return [...productsList].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
            case 'newest':
            default:
                return productsList;
        }
    };

    const sortedProducts = sortProducts(products);
    const currentCategory = categories.find(c => c.id === category);

    const getLabel = (type, val) => {
        if (!val) return '';
        const list = attributesData[type] || [];
        const found = list.find(item => item.value === val);
        if (found && found.label) return found.label;
        return prettify(val);
    };

    // Filter Groups Component
    const FilterGroups = () => (
        <div className="space-y-5">
            {FILTER_SECTIONS.map(sec => {
                const activeList = (searchParams.get(sec.param) || '').split(',').map(s => s.trim()).filter(Boolean);
                const allForType = attributesData[sec.key] || [];

                // Options with count >= 1 or currently selected
                const visibleOptions = allForType.filter(opt =>
                    (opt.count !== undefined ? opt.count : 0) >= 1 || activeList.includes(opt.value)
                );

                // Ensure any selected value from URL appears so user can see & uncheck
                activeList.forEach(val => {
                    if (!visibleOptions.some(o => o.value === val)) {
                        visibleOptions.push({
                            value: val,
                            label: prettify(val),
                            count: 0
                        });
                    }
                });

                if (visibleOptions.length === 0) {
                    return null;
                }

                const isOpen = openGroups[sec.key] !== false;

                return (
                    <div key={sec.key} className="border-b border-[#E5E7EB] pb-3.5">
                        <button 
                            type="button"
                            className="w-full flex items-center justify-between py-1 text-left"
                            onClick={() => toggleGroup(sec.key)}
                        >
                            <span className="font-heading text-xs uppercase tracking-wider text-charcoal font-bold">{sec.heading}</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-rose' : 'text-[#4B5563]'}`} />
                        </button>
                        {isOpen && (
                            <div className="pt-2.5 space-y-2">
                                {visibleOptions.map((opt) => {
                                    const isChecked = activeList.includes(opt.value);
                                    return (
                                        <label key={opt.value} className="flex items-center justify-between cursor-pointer text-xs text-charcoal hover:text-rose">
                                            <div className="flex items-center gap-2.5">
                                                <input 
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleMultiFilter(sec.param, opt.value)}
                                                    className="w-4 h-4 rounded border-[#E5E7EB] text-rose focus:ring-rose accent-rose cursor-pointer"
                                                />
                                                <span className="font-medium">{opt.label}</span>
                                            </div>
                                            <span className="text-xs text-[#4B5563] font-normal">({opt.count ?? 0})</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Price Range */}
            <div className="border-b border-[#E5E7EB] pb-3.5">
                <button 
                    type="button"
                    className="w-full flex items-center justify-between py-1 text-left"
                    onClick={() => toggleGroup('price')}
                >
                    <span className="font-heading text-xs uppercase tracking-wider text-charcoal font-bold">Price Range</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${openGroups.price ? 'rotate-180 text-rose' : 'text-[#4B5563]'}`} />
                </button>
                {openGroups.price && (
                    <div className="pt-2.5 space-y-2">
                        {priceRanges.map((range, idx) => {
                            const isChecked = minPrice === range.min && maxPrice === range.max;
                            return (
                                <label key={idx} className="flex items-center gap-2.5 cursor-pointer text-xs text-charcoal hover:text-rose">
                                    <input 
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                            if (!isChecked) {
                                                updateFilter('min_price', range.min);
                                                updateFilter('max_price', range.max);
                                            } else {
                                                updateFilter('min_price', '');
                                                updateFilter('max_price', '');
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-[#E5E7EB] text-rose focus:ring-rose accent-rose cursor-pointer"
                                    />
                                    <span className="font-medium">{range.label}</span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Clear All Button */}
            {(category || subcategory || product_type || region || fabric || print_type || minPrice || maxPrice || featured || isNew || filterParam) && (
                <button 
                    onClick={clearFilters}
                    className="text-xs text-rose hover:underline flex items-center gap-1 font-bold pt-3 w-full justify-center border-t border-[#E5E7EB]"
                    data-testid="clear-filters-btn"
                >
                    <RotateCcw size={13} /> Reset All Filters
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-white" data-testid="shop-page">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-[#E5E7EB]">
                <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px] py-3.5">
                    <div className="flex items-center text-xs text-[#4B5563]">
                        <Link to="/" className="hover:text-rose">Home</Link>
                        <span className="breadcrumb-separator">/</span>
                        <span className="text-charcoal font-medium">Shop</span>
                        {category && (
                            <>
                                <span className="breadcrumb-separator">/</span>
                                <span className="text-rose capitalize font-medium">{getLabel('category', category)}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="bg-white border-b border-[#E5E7EB] py-10">
                <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px] text-center">
                    <h1 className="font-heading text-2xl md:text-4xl uppercase tracking-wide text-charcoal mb-2 font-bold">
                        {search ? `Search: "${search}"` : 
                         region ? `${getLabel('region', region)} Collection` :
                         currentCategory ? currentCategory.name : 
                         featured ? 'Featured Collection' :
                         isNew ? 'New Arrivals' :
                         'All Products'}
                    </h1>
                    <p className="text-xs text-[#4B5563] uppercase tracking-wider">{sortedProducts.length} Products Available</p>
                </div>
            </div>

            <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px] py-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Sidebar Filters - Desktop & Tablet (md+) (White Panel) */}
                    <aside className="hidden md:block w-64 flex-shrink-0 sticky top-24">
                        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs">
                            <h2 className="font-heading text-sm uppercase tracking-wider text-charcoal font-black mb-4 pb-2 border-b border-[#E5E7EB]">
                                Filter By
                            </h2>
                            <FilterGroups />
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 w-full min-w-0">
                        {/* Removable Active Filter Chips */}
                        {(category || product_type || region || fabric || print_type || style || subcategory || minPrice || maxPrice || featured || isNew || search) && (
                            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white rounded-md border border-[#E5E7EB]">
                                <span className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider mr-1">Active Filters:</span>
                                
                                {FILTER_SECTIONS.map(sec => {
                                    const activeList = (searchParams.get(sec.param) || '').split(',').map(s => s.trim()).filter(Boolean);
                                    return activeList.map(val => (
                                        <span 
                                            key={`chip-${sec.key}-${val}`} 
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose/10 text-rose border border-rose/30"
                                        >
                                            {sec.heading}: {getLabel(sec.key, val)}
                                            <button 
                                                type="button"
                                                onClick={() => toggleMultiFilter(sec.param, val)} 
                                                className="hover:text-rose-dark"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ));
                                })}

                                {subcategory && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose/10 text-rose border border-rose/30">
                                        Subcategory: {subcategory}
                                        <button 
                                            type="button"
                                            onClick={() => updateFilter('subcategory', '')} 
                                            className="hover:text-rose-dark"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                )}

                                {(isNew || filterParam === 'new') && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose/10 text-rose border border-rose/30">
                                        New Arrivals
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const newParams = new URLSearchParams(searchParams);
                                                newParams.delete('is_new');
                                                newParams.delete('filter');
                                                setSearchParams(newParams);
                                            }} 
                                            className="hover:text-rose-dark"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                )}

                                {featured && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose/10 text-rose border border-rose/30">
                                        Featured
                                        <button 
                                            type="button"
                                            onClick={() => updateFilter('featured', '')} 
                                            className="hover:text-rose-dark"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                )}

                                {search && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-charcoal border border-gray-300">
                                        Search: "{search}"
                                        <button 
                                            type="button"
                                            onClick={() => updateFilter('search', '')} 
                                            className="hover:text-charcoal"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                )}

                                {(minPrice || maxPrice) && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                        Price: {minPrice ? `≥ ₹${minPrice}` : ''} {minPrice && maxPrice ? '-' : ''} {maxPrice ? `≤ ₹${maxPrice}` : ''}
                                        <button 
                                            type="button"
                                            onClick={() => { updateFilter('min_price', ''); updateFilter('max_price', ''); }} 
                                            className="hover:text-amber-950"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                )}

                                <button 
                                    onClick={clearFilters}
                                    className="text-xs text-rose hover:underline font-bold ml-auto pl-2"
                                >
                                    Clear All
                                </button>
                            </div>
                        )}

                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-6 bg-white p-3 rounded-md border border-[#E5E7EB]">
                            <button 
                                onClick={() => setShowFilters(true)}
                                className="md:hidden flex items-center gap-2 text-xs font-semibold text-charcoal uppercase tracking-wider bg-white px-3 py-1.5 rounded border border-[#E5E7EB]"
                            >
                                <Filter size={15} className="text-rose" /> Filters
                            </button>

                            <div className="flex items-center gap-4 ml-auto">
                                {/* Grid Layout Toggle Icons */}
                                <div className="flex items-center gap-2" data-testid="grid-toggle-container">
                                    <button 
                                        type="button"
                                        onClick={() => setGridCols(3)}
                                        className={`p-1.5 rounded transition-all duration-200 ${
                                            gridCols === 3 
                                                ? 'text-rose bg-[#FBF0EC] border border-rose/30 shadow-xs font-bold' 
                                                : 'text-[#4B5563] hover:text-charcoal border border-transparent hover:bg-gray-100'
                                        }`}
                                        title="3 Columns View"
                                        aria-label="3 Columns View"
                                        data-testid="grid-toggle-3"
                                    >
                                        <Grid3X3 size={18} />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setGridCols(4)}
                                        className={`p-1.5 rounded transition-all duration-200 ${
                                            gridCols === 4 
                                                ? 'text-rose bg-[#FBF0EC] border border-rose/30 shadow-xs font-bold' 
                                                : 'text-[#4B5563] hover:text-charcoal border border-transparent hover:bg-gray-100'
                                        }`}
                                        title="4 Columns View"
                                        aria-label="4 Columns View"
                                        data-testid="grid-toggle-4"
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                </div>

                                {/* Sort Control Dropdown */}
                                <Select value={sort} onValueChange={(value) => updateFilter('sort', value)}>
                                    <SelectTrigger className="w-44 text-base border-[#E5E7EB] bg-white text-charcoal font-medium" data-testid="sort-select">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Newest</SelectItem>
                                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                                        <SelectItem value="rating">Top Rated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Products Grid Container */}
                        {loading ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="animate-pulse bg-white p-3 rounded-xl border border-[#E5E7EB]">
                                        <div className="aspect-[3/4] bg-gray-100 mb-3 rounded-lg"></div>
                                        <div className="h-3 bg-gray-100 mb-2 w-1/3 rounded"></div>
                                        <div className="h-4 bg-gray-100 mb-2 rounded"></div>
                                        <div className="h-3 bg-gray-100 w-1/2 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-[#E5E7EB] space-y-4">
                                <p className="text-sm font-semibold text-charcoal">Products could not be loaded. Please try again.</p>
                                <button onClick={fetchProducts} className="btn-primary">
                                    Retry
                                </button>
                            </div>
                        ) : sortedProducts.length > 0 ? (
                            <div 
                                className={`grid grid-cols-2 ${gridCols === 3 ? 'md:grid-cols-3 lg:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} gap-3 md:gap-4 transition-all duration-200`}
                                data-testid="products-grid"
                            >
                                {sortedProducts.map((product) => (
                                    <div key={product.id}>
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-xl border border-[#E5E7EB] space-y-4">
                                <p className="text-sm font-medium text-charcoal">No products match these filters.</p>
                                <button onClick={clearFilters} className="btn-primary">
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            {showFilters && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-charcoal/50" onClick={() => setShowFilters(false)}></div>
                    <div className="absolute left-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto border-r border-[#E5E7EB]">
                        <div className="flex justify-between items-center mb-6 border-b border-[#E5E7EB] pb-3">
                            <h2 className="font-heading text-lg uppercase tracking-wider text-charcoal font-bold">Filter By</h2>
                            <button onClick={() => setShowFilters(false)} className="text-charcoal hover:text-rose">
                                <X size={20} />
                            </button>
                        </div>

                        <FilterGroups />

                        <button 
                            onClick={() => setShowFilters(false)}
                            className="btn-primary w-full mt-8"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopPage;
