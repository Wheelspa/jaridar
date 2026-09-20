import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Package, Search, RefreshCw, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const initialFormState = {
    name: '',
    description: '',
    price: '',
    original_price: '',
    category: 'ethnic',
    subcategory: '',
    images: '',
    sizes: 'XS, S, M, L, XL',
    colors: 'Black, White',
    stock: 10,
    featured: false,
    is_new: false,
};

export default function AdminPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (!authLoading) {
            if (!isAdmin) {
                toast.error('Admin access required');
                navigate('/');
            } else {
                fetchProducts();
            }
        }
    }, [authLoading, isAdmin, navigate]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API}/admin/products`);
            setProducts(response.data);
        } catch (error) {
            console.error('Failed to fetch admin products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData(initialFormState);
        setIsFormOpen(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name || '',
            description: product.description || '',
            price: product.price ?? '',
            original_price: product.original_price ?? '',
            category: product.category || 'ethnic',
            subcategory: product.subcategory || '',
            images: Array.isArray(product.images) ? product.images.join(', ') : '',
            sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : '',
            colors: Array.isArray(product.colors) ? product.colors.join(', ') : '',
            stock: product.stock ?? 0,
            featured: Boolean(product.featured),
            is_new: Boolean(product.is_new),
        });
        setIsFormOpen(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleCheckboxChange = (name, checked) => {
        setFormData((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.description || !formData.price || !formData.category) {
            toast.error('Please fill in all required fields (Name, Description, Price, Category)');
            return;
        }

        const imagesArray = formData.images
            .split(',')
            .map((url) => url.trim())
            .filter((url) => url.length > 0);

        const sizesArray = formData.sizes
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        const colorsArray = formData.colors
            .split(',')
            .map((c) => c.trim())
            .filter((c) => c.length > 0);

        const payload = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            price: parseFloat(formData.price),
            original_price: formData.original_price ? parseFloat(formData.original_price) : null,
            category: formData.category,
            subcategory: formData.subcategory.trim() || null,
            images: imagesArray.length > 0 ? imagesArray : ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600'],
            sizes: sizesArray.length > 0 ? sizesArray : ['S', 'M', 'L'],
            colors: colorsArray.length > 0 ? colorsArray : ['Standard'],
            stock: parseInt(formData.stock, 10) || 0,
            featured: Boolean(formData.featured),
            is_new: Boolean(formData.is_new),
        };

        setSubmitting(true);
        try {
            if (editingProduct) {
                await axios.put(`${API}/admin/products/${editingProduct.id}`, payload);
                toast.success('Product updated successfully');
            } else {
                await axios.post(`${API}/admin/products`, payload);
                toast.success('Product created successfully');
            }
            setIsFormOpen(false);
            fetchProducts();
        } catch (error) {
            console.error('Product save error:', error);
            const message = error.response?.data?.detail || 'Failed to save product';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (product) => {
        if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
            return;
        }

        try {
            await axios.delete(`${API}/admin/products/${product.id}`);
            toast.success(`Product "${product.name}" deleted`);
            fetchProducts();
        } catch (error) {
            console.error('Delete error:', error);
            const message = error.response?.data?.detail || 'Failed to delete product';
            toast.error(message);
        }
    };

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(search.toLowerCase()))
    );

    if (authLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-rose" />
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EADFD6] pb-6">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-charcoal">Admin Dashboard</h1>
                    <p className="text-[#6B5B55] text-sm mt-1">Manage store inventory, add, update or delete products.</p>
                </div>
                <Button
                    onClick={openAddModal}
                    className="bg-rose hover:bg-rose-dark text-white gap-2"
                >
                    <Plus size={18} />
                    Add Product
                </Button>
            </div>

            {/* Controls bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FAF0EA] p-4 rounded-lg border border-[#EADFD6]">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5B55]" size={18} />
                    <Input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-white border-[#EADFD6]"
                    />
                </div>
                <div className="flex items-center gap-3 text-sm text-[#6B5B55]">
                    <Package size={18} />
                    <span>Total Products: <strong className="text-charcoal">{products.length}</strong></span>
                    <Button variant="outline" size="sm" onClick={fetchProducts} className="ml-2 gap-1 border-[#EADFD6]">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Products Table */}
            {loading ? (
                <div className="py-20 flex justify-center items-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-rose" />
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-[#FAF0EA] rounded-lg border border-dashed border-[#EADFD6]">
                    <Package className="mx-auto h-12 w-12 text-[#6B5B55] mb-3" />
                    <h3 className="text-lg font-medium text-charcoal">No products found</h3>
                    <p className="text-sm text-[#6B5B55] mt-1">Try adjusting your search query or add a new product.</p>
                </div>
            ) : (
                <div className="border border-[#EADFD6] rounded-lg overflow-hidden bg-white shadow-sm">
                    <Table>
                        <TableHeader className="bg-[#FAF0EA]">
                            <TableRow className="border-b border-[#EADFD6]">
                                <TableHead className="w-16 text-[#6B5B55]">Thumbnail</TableHead>
                                <TableHead className="text-[#6B5B55]">Name</TableHead>
                                <TableHead className="text-[#6B5B55]">Category</TableHead>
                                <TableHead className="text-[#6B5B55]">Price</TableHead>
                                <TableHead className="text-[#6B5B55]">Stock</TableHead>
                                <TableHead className="text-[#6B5B55]">Badges</TableHead>
                                <TableHead className="text-right text-[#6B5B55]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map((product) => (
                                <TableRow key={product.id} className="border-b border-[#EADFD6]">
                                    <TableCell>
                                        <img
                                            src={product.images && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600'}
                                            alt={product.name}
                                            className="w-12 h-12 object-cover rounded-md border border-[#EADFD6]"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium text-charcoal">
                                        <div>{product.name}</div>
                                        {product.subcategory && (
                                            <div className="text-xs text-[#6B5B55]">{product.subcategory}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="capitalize text-charcoal">{product.category}</TableCell>
                                    <TableCell>
                                        <div className="font-semibold text-charcoal">₹{product.price?.toLocaleString('en-IN')}</div>
                                        {product.original_price && (
                                            <div className="text-xs text-[#6B5B55] line-through">
                                                ₹{product.original_price?.toLocaleString('en-IN')}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={product.stock > 0 ? "outline" : "destructive"}>
                                            {product.stock} in stock
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {product.featured && (
                                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0">
                                                    Featured
                                                </Badge>
                                            )}
                                            {product.is_new && (
                                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">
                                                    New
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditModal(product)}
                                                className="h-8 w-8 p-0"
                                                title="Edit Product"
                                            >
                                                <Edit size={14} />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(product)}
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                title="Delete Product"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Product Add / Edit Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-heading font-bold">
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B5B55] mb-1">
                                    Product Name *
                                </label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Pastel Pink Embroidered Saree"
                                    className="border-[#EADFD6]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B5B55] mb-1">
                                    Price (₹) *
                                </label>
                                <Input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="8999"
                                    min="0"
                                    step="0.01"
                                    className="border-[#EADFD6]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B5B55] mb-1">
                                    Original Price (₹)
                                </label>
                                <Input
                                    type="number"
                                    name="original_price"
                                    value={formData.original_price}
                                    onChange={handleChange}
                                    placeholder="12999"
                                    min="0"
                                    step="0.01"
                                    className="border-[#EADFD6]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B5B55] mb-1">
                                    Category *
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-[#EADFD6] rounded-md text-sm bg-white text-charcoal focus:outline-none focus:ring-1 focus:ring-rose"
                                    required
                                >
                                    <option value="ethnic">Ethnic Wear</option>
                                    <option value="traditional">Traditional Wear</option>
                                    <option value="western">Western Wear</option>
                                    <option value="bridal">Bridal Collection</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B5B55] mb-1">
                                    Subcategory
                                </label>
                                <Input
                                    name="subcategory"
                                    value={formData.subcategory}
                                    onChange={handleChange}
                                    placeholder="e.g. Sarees, Lehengas, Dresses"
                                    className="border-[#EADFD6]"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B5B55] mb-1">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Enter detailed description of the product..."
                                    className="w-full px-3 py-2 border border-[#EADFD6] rounded-md text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-rose"
                                    required
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B5B55] mb-1">
                                    Image URLs (comma separated)
                                </label>
                                <textarea
                                    name="images"
                                    value={formData.images}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                                    className="w-full px-3 py-2 border border-[#EADFD6] rounded-md text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-rose"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B5B55] mb-1">
                                    Available Sizes (comma separated)
                                </label>
                                <Input
                                    name="sizes"
                                    value={formData.sizes}
                                    onChange={handleChange}
                                    placeholder="XS, S, M, L, XL"
                                    className="border-[#EADFD6]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B5B55] mb-1">
                                    Available Colors (comma separated)
                                </label>
                                <Input
                                    name="colors"
                                    value={formData.colors}
                                    onChange={handleChange}
                                    placeholder="Pink, Rose, Gold"
                                    className="border-[#EADFD6]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B5B55] mb-1">
                                    Stock Quantity
                                </label>
                                <Input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    placeholder="10"
                                    min="0"
                                    className="border-[#EADFD6]"
                                />
                            </div>

                            <div className="flex items-center gap-6 pt-4">
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                                    <Checkbox
                                        checked={formData.featured}
                                        onCheckedChange={(checked) => handleCheckboxChange('featured', checked)}
                                    />
                                    Featured Product
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                                    <Checkbox
                                        checked={formData.is_new}
                                        onCheckedChange={(checked) => handleCheckboxChange('is_new', checked)}
                                    />
                                    Mark as New
                                </label>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsFormOpen(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-rose hover:bg-rose-dark text-white"
                                disabled={submitting}
                            >
                                {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
