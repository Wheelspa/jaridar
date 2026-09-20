import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Filter, ChevronDown, X, Grid3X3, LayoutGrid } from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ShopPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [gridCols, setGridCols] = useState(4);

    const category = searchParams.get('category') || '';
    const subcategory = searchParams.get('subcategory') || '';
    const search = searchParams.get('search') || '';
    const featured = searchParams.get('featured') || '';
    const isNew = searchParams.get('is_new') || '';
    const sort = searchParams.get('sort') || 'newest';
    const minPrice = searchParams.get('min_price') || '';
    const maxPrice = searchParams.get('max_price') || '';

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [category, subcategory, search, featured, isNew, minPrice, maxPrice]);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API}/categories`);
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (subcategory) params.append('subcategory', subcategory);
            if (search) params.append('search', search);
            if (featured) params.append('featured', featured);
            if (isNew) params.append('is_new', isNew);
            if (minPrice) params.append('min_price', minPrice);
            if (maxPrice) params.append('max_price', maxPrice);

            const response = await axios.get(`${API}/products?${params.toString()}`);
            setProducts(response.data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
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

    const clearFilters = () => {
        setSearchParams({});
    };

    const sortProducts = (products) => {
        switch (sort) {
            case 'price-low':
                return [...products].sort((a, b) => a.price - b.price);
            case 'price-high':
                return [...products].sort((a, b) => b.price - a.price);
            case 'rating':
                return [...products].sort((a, b) => b.rating - a.rating);
            case 'newest':
            default:
                return products;
        }
    };

    const sortedProducts = sortProducts(products);
    const currentCategory = categories.find(c => c.id === category);

    const priceRanges = [
        { label: 'Under ₹3,000', min: '', max: '3000' },
        { label: '₹3,000 - ₹10,000', min: '3000', max: '10000' },
        { label: '₹10,000 - ₹25,000', min: '10000', max: '25000' },
        { label: '₹25,000 - ₹50,000', min: '25000', max: '50000' },
        { label: 'Above ₹50,000', min: '50000', max: '' }
    ];

    return (
        <div className="min-h-screen bg-[#FFFBF7]" data-testid="shop-page">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-[#EADFD6]">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5">
                    <div className="flex items-center text-xs text-[#6B5B55]">
                        <Link to="/" className="hover:text-rose">Home</Link>
                        <span className="breadcrumb-separator">/</span>
                        <span className="text-charcoal font-medium">Shop</span>
                        {category && (
                            <>
                                <span className="breadcrumb-separator">/</span>
                                <span className="text-rose capitalize font-medium">{category.replace('-', ' ')}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="bg-[#FAF0EA] border-b border-[#EADFD6] py-10">
                <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
                    <h1 className="font-heading text-3xl md:text-4xl uppercase tracking-widest text-charcoal mb-2">
                        {search ? `Search: "${search}"` : 
                         currentCategory ? currentCategory.name : 
                         featured ? 'Featured Collection' :
                         isNew ? 'New Arrivals' :
                         'All Products'}
                    </h1>
                    <p className="text-xs text-[#6B5B55] uppercase tracking-wider">{sortedProducts.length} Products Available</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
                <div className="flex gap-8">
                    {/* Sidebar Filters - Desktop */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-24 space-y-8 bg-white p-5 rounded-md border border-[#EADFD6]">
                            {/* Categories */}
                            <div>
                                <h3 className="font-heading text-sm uppercase tracking-wider text-charcoal font-semibold mb-3 border-b border-[#EADFD6] pb-2">Categories</h3>
                                <ul className="space-y-2">
                                    <li>
                                        <button 
                                            onClick={() => updateFilter('category', '')}
                                            className={`text-xs ${!category ? 'text-rose font-semibold' : 'text-[#6B5B55] hover:text-charcoal'}`}
                                        >
                                            All Products
                                        </button>
                                    </li>
                                    {categories.map((cat) => (
                                        <li key={cat.id}>
                                            <button 
                                                onClick={() => updateFilter('category', cat.id)}
                                                className={`text-xs ${category === cat.id ? 'text-rose font-semibold' : 'text-[#6B5B55] hover:text-charcoal'}`}
                                                data-testid={`filter-category-${cat.id}`}
                                            >
                                                {cat.name}
                                            </button>
                                            {category === cat.id && cat.subcategories && (
                                                <ul className="ml-3 mt-1.5 space-y-1 border-l border-[#EADFD6] pl-2">
                                                    {cat.subcategories.map((sub) => (
                                                        <li key={sub}>
                                                            <button 
                                                                onClick={() => updateFilter('subcategory', sub)}
                                                                className={`text-[11px] ${subcategory === sub ? 'text-rose font-semibold' : 'text-[#6B5B55] hover:text-charcoal'}`}
                                                            >
                                                                {sub}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Price Range */}
                            <div>
                                <h3 className="font-heading text-sm uppercase tracking-wider text-charcoal font-semibold mb-3 border-b border-[#EADFD6] pb-2">Price Range</h3>
                                <ul className="space-y-2.5">
                                    {priceRanges.map((range, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Checkbox 
                                                id={`price-${i}`}
                                                checked={minPrice === range.min && maxPrice === range.max}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        updateFilter('min_price', range.min);
                                                        updateFilter('max_price', range.max);
                                                    } else {
                                                        updateFilter('min_price', '');
                                                        updateFilter('max_price', '');
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`price-${i}`} className="text-xs text-[#6B5B55] cursor-pointer hover:text-charcoal">
                                                {range.label}
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Clear Filters */}
                            {(category || subcategory || minPrice || maxPrice || featured || isNew) && (
                                <button 
                                    onClick={clearFilters}
                                    className="text-xs text-rose hover:underline flex items-center gap-1 font-semibold pt-2"
                                    data-testid="clear-filters-btn"
                                >
                                    <X size={14} /> Clear All Filters
                                </button>
                            )}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-6 bg-white p-3 rounded-md border border-[#EADFD6]">
                            <button 
                                onClick={() => setShowFilters(true)}
                                className="lg:hidden flex items-center gap-2 text-xs font-semibold text-charcoal uppercase tracking-wider"
                            >
                                <Filter size={16} className="text-rose" /> Filters
                            </button>

                            <div className="flex items-center gap-4 ml-auto">
                                <div className="hidden sm:flex items-center gap-2">
                                    <button 
                                        onClick={() => setGridCols(3)}
                                        className={`p-1.5 rounded ${gridCols === 3 ? 'text-rose bg-rose-light' : 'text-[#6B5B55]'}`}
                                    >
                                        <Grid3X3 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => setGridCols(4)}
                                        className={`p-1.5 rounded ${gridCols === 4 ? 'text-rose bg-rose-light' : 'text-[#6B5B55]'}`}
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                </div>

                                <Select value={sort} onValueChange={(value) => updateFilter('sort', value)}>
                                    <SelectTrigger className="w-40 text-xs border-[#EADFD6] bg-white text-charcoal" data-testid="sort-select">
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

                        {/* Products Grid */}
                        {loading ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="animate-pulse bg-white p-3 rounded-md border border-[#EADFD6]">
                                        <div className="aspect-[3/4] bg-[#FAF0EA] mb-3 rounded-sm"></div>
                                        <div className="h-3 bg-[#FAF0EA] mb-2 w-1/3 rounded"></div>
                                        <div className="h-4 bg-[#FAF0EA] mb-2 rounded"></div>
                                        <div className="h-3 bg-[#FAF0EA] w-1/2 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : sortedProducts.length > 0 ? (
                            <motion.div 
                                className={`grid grid-cols-2 ${gridCols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4 md:gap-6`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {sortedProducts.map((product, index) => (
                                    <motion.div 
                                        key={product.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                    >
                                        <ProductCard product={product} />
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-md border border-[#EADFD6]">
                                <p className="text-xs uppercase tracking-wider text-[#6B5B55] mb-4">No products found matching your filter criteria</p>
                                <button onClick={clearFilters} className="btn-primary">
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            {showFilters && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-charcoal/50" onClick={() => setShowFilters(false)}></div>
                    <div className="absolute left-0 top-0 bottom-0 w-80 bg-[#FFFBF7] p-6 overflow-y-auto border-r border-[#EADFD6]">
                        <div className="flex justify-between items-center mb-6 border-b border-[#EADFD6] pb-3">
                            <h2 className="font-heading text-lg uppercase tracking-wider text-charcoal font-semibold">Filters</h2>
                            <button onClick={() => setShowFilters(false)} className="text-charcoal hover:text-rose">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-heading text-sm uppercase tracking-wider text-charcoal font-semibold mb-3">Categories</h3>
                                <ul className="space-y-2">
                                    <li>
                                        <button 
                                            onClick={() => { updateFilter('category', ''); setShowFilters(false); }}
                                            className={`text-xs ${!category ? 'text-rose font-semibold' : 'text-[#6B5B55]'}`}
                                        >
                                            All Products
                                        </button>
                                    </li>
                                    {categories.map((cat) => (
                                        <li key={cat.id}>
                                            <button 
                                                onClick={() => { updateFilter('category', cat.id); setShowFilters(false); }}
                                                className={`text-xs ${category === cat.id ? 'text-rose font-semibold' : 'text-[#6B5B55]'}`}
                                            >
                                                {cat.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-heading text-sm uppercase tracking-wider text-charcoal font-semibold mb-3">Price Range</h3>
                                <ul className="space-y-2">
                                    {priceRanges.map((range, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Checkbox 
                                                id={`mobile-price-${i}`}
                                                checked={minPrice === range.min && maxPrice === range.max}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        updateFilter('min_price', range.min);
                                                        updateFilter('max_price', range.max);
                                                    } else {
                                                        updateFilter('min_price', '');
                                                        updateFilter('max_price', '');
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`mobile-price-${i}`} className="text-xs text-[#6B5B55]">
                                                {range.label}
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

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
