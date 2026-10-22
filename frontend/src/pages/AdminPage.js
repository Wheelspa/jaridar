import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Package, Search, RefreshCw, X, Eye, ShoppingBag, Truck, CheckCircle, Clock, Tags, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
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

const ATTRIBUTE_TYPES = [
    { key: 'category', label: 'Category', plural: 'Categories' },
    { key: 'product_type', label: 'Product Type', plural: 'Product Types' },
    { key: 'style', label: 'Style', plural: 'Styles' },
    { key: 'region', label: 'Region', plural: 'Regions' },
    { key: 'fabric', label: 'Fabric', plural: 'Fabrics' },
    { key: 'print_type', label: 'Print / Craft', plural: 'Print & Craft Types' },
];

const initialFormState = {
    name: '',
    description: '',
    price: '',
    original_price: '',
    category: '',
    subcategory: '',
    product_type: '',
    region: '',
    fabric: '',
    print_type: '',
    style: '',
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

    // Active tab: 'products' | 'orders' | 'categories'
    const [activeTab, setActiveTab] = useState('products');

    // Products state
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});

    // Orders state
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [orderSearch, setOrderSearch] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [newOrderStatus, setNewOrderStatus] = useState('pending');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Categories / Attributes state
    const [selectedAttributeType, setSelectedAttributeType] = useState('category');
    const [attributes, setAttributes] = useState([]);
    const [attributesLoading, setAttributesLoading] = useState(false);
    const [attributeSearch, setAttributeSearch] = useState('');
    const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState(null);
    const [attrFormData, setAttrFormData] = useState({
        label: '',
        value: '',
        display_order: 1,
        is_active: true,
    });
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
    const [attrErrors, setAttrErrors] = useState({});
    const [submittingAttr, setSubmittingAttr] = useState(false);
    const [attributeOptions, setAttributeOptions] = useState(null);
    const [attributeOptionsLoading, setAttributeOptionsLoading] = useState(false);
    const [attributeOptionsError, setAttributeOptionsError] = useState(null);
    const [allAttributesList, setAllAttributesList] = useState([]);

    useEffect(() => {
        if (!authLoading) {
            if (!isAdmin) {
                toast.error('Admin access required');
                navigate('/');
            } else {
                fetchProducts();
                fetchOrders();
                fetchAttributes('category');
                fetchAttributeOptions();
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

    const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
            const response = await axios.get(`${API}/admin/orders`);
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch admin orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setOrdersLoading(false);
        }
    };

    const fetchAttributeOptions = async () => {
        setAttributeOptionsLoading(true);
        setAttributeOptionsError(null);
        try {
            const [activeRes, allRes] = await Promise.all([
                axios.get(`${API}/attributes`),
                axios.get(`${API}/admin/attributes`)
            ]);
            setAttributeOptions(activeRes.data);
            setAllAttributesList(allRes.data);
        } catch (err) {
            console.error('Failed to load attributes options:', err);
            setAttributeOptionsError(err.response?.data?.detail || err.message || 'Failed to load options');
        } finally {
            setAttributeOptionsLoading(false);
        }
    };

    // Attributes handlers
    const fetchAttributes = async (type = selectedAttributeType) => {
        setAttributesLoading(true);
        try {
            const response = await axios.get(`${API}/admin/attributes?type=${type}`);
            setAttributes(response.data);
        } catch (error) {
            console.error('Failed to fetch admin attributes:', error);
            toast.error('Failed to load attributes');
        } finally {
            setAttributesLoading(false);
        }
    };

    const handleAttributeTypeChange = (typeKey) => {
        setSelectedAttributeType(typeKey);
        fetchAttributes(typeKey);
    };

    const handleMoveOrder = async (index, direction) => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= filteredAttributes.length) return;

        const currentItem = filteredAttributes[index];
        const targetItem = filteredAttributes[targetIndex];

        const currentOrder = currentItem.display_order ?? currentItem.sort_order ?? (index + 1);
        const targetOrder = targetItem.display_order ?? targetItem.sort_order ?? (targetIndex + 1);

        const newCurrentOrder = targetOrder === currentOrder ? (direction === 'up' ? currentOrder - 1 : currentOrder + 1) : targetOrder;
        const newTargetOrder = currentOrder;

        setAttributes(prev => {
            return prev.map(item => {
                if (item.id === currentItem.id) return { ...item, display_order: newCurrentOrder, sort_order: newCurrentOrder };
                if (item.id === targetItem.id) return { ...item, display_order: newTargetOrder, sort_order: newTargetOrder };
                return item;
            }).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        });

        try {
            await axios.post(`${API}/admin/attributes/reorder`, {
                items: [
                    { id: currentItem.id, sort_order: newCurrentOrder },
                    { id: targetItem.id, sort_order: newTargetOrder }
                ]
            });
            fetchAttributes(selectedAttributeType);
            fetchAttributeOptions();
        } catch (err) {
            console.error('Reorder error:', err);
            toast.error('Failed to update order');
            fetchAttributes(selectedAttributeType);
        }
    };

    const renderDropdownOptions = (typeKey, currentValue, placeholder = 'Select') => {
        const activeList = (attributeOptions && attributeOptions[typeKey]) || [];
        const isCurrentInActive = activeList.some(item => item.value === currentValue);
        
        let inactiveOption = null;
        if (currentValue && !isCurrentInActive) {
            const found = allAttributesList.find(a => a.type === typeKey && a.value === currentValue);
            const label = found ? found.label : currentValue;
            inactiveOption = { value: currentValue, label: `${label} (inactive)` };
        }
        
        return (
            <>
                {placeholder && <option value="">{placeholder}</option>}
                {activeList.map(opt => (
                    <option key={opt.id || opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
                {inactiveOption && (
                    <option key={inactiveOption.value} value={inactiveOption.value}>
                        {inactiveOption.label}
                    </option>
                )}
            </>
        );
    };

    const slugify = (text) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[\s_]+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    const openAddAttrModal = () => {
        setEditingAttribute(null);
        setIsSlugManuallyEdited(false);
        setAttrErrors({});
        const nextOrder = attributes.length > 0
            ? Math.max(...attributes.map((a) => a.display_order || 0)) + 1
            : 1;
        setAttrFormData({
            label: '',
            value: '',
            display_order: nextOrder,
            is_active: true,
        });
        setIsAttrModalOpen(true);
    };

    const openEditAttrModal = (attr) => {
        setEditingAttribute(attr);
        setIsSlugManuallyEdited(true);
        setAttrErrors({});
        setAttrFormData({
            label: attr.label || '',
            value: attr.value || '',
            display_order: attr.display_order ?? 1,
            is_active: Boolean(attr.is_active),
        });
        setIsAttrModalOpen(true);
    };

    const handleAttrLabelChange = (e) => {
        const newLabel = e.target.value;
        setAttrFormData((prev) => ({
            ...prev,
            label: newLabel,
            value: (!editingAttribute && !isSlugManuallyEdited) ? slugify(newLabel) : prev.value,
        }));
        if (attrErrors.label) {
            setAttrErrors((prev) => ({ ...prev, label: null }));
        }
    };

    const handleAttrValueChange = (e) => {
        setIsSlugManuallyEdited(true);
        setAttrFormData((prev) => ({
            ...prev,
            value: e.target.value.toLowerCase().replace(/\s+/g, '-'),
        }));
        if (attrErrors.value) {
            setAttrErrors((prev) => ({ ...prev, value: null }));
        }
    };

    const handleSubmitAttr = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!attrFormData.label || !attrFormData.label.trim()) {
            newErrors.label = 'Label is required';
        }
        if (!editingAttribute && (!attrFormData.value || !attrFormData.value.trim())) {
            newErrors.value = 'Value / slug is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setAttrErrors(newErrors);
            toast.error('Please fix the errors in the form');
            return;
        }

        setSubmittingAttr(true);
        try {
            if (editingAttribute) {
                await axios.put(`${API}/admin/attributes/${editingAttribute.id}`, {
                    label: attrFormData.label.trim(),
                    display_order: parseInt(attrFormData.display_order, 10) || 1,
                    is_active: Boolean(attrFormData.is_active),
                });
                toast.success(`Attribute "${attrFormData.label}" updated successfully`);
            } else {
                await axios.post(`${API}/admin/attributes`, {
                    type: selectedAttributeType,
                    value: attrFormData.value.trim().toLowerCase(),
                    label: attrFormData.label.trim(),
                    display_order: parseInt(attrFormData.display_order, 10) || 1,
                    is_active: Boolean(attrFormData.is_active),
                });
                toast.success(`Attribute "${attrFormData.label}" created successfully`);
            }
            setIsAttrModalOpen(false);
            fetchAttributes(selectedAttributeType);
            fetchAttributeOptions();
        } catch (error) {
            console.error('Attribute save error:', error);
            const message = error.response?.data?.detail || 'Failed to save attribute';
            toast.error(message);
        } finally {
            setSubmittingAttr(false);
        }
    };

    const handleToggleActive = async (attr, checked) => {
        try {
            setAttributes((prev) =>
                prev.map((item) => (item.id === attr.id ? { ...item, is_active: checked } : item))
            );
            await axios.put(`${API}/admin/attributes/${attr.id}`, {
                is_active: checked,
            });
            toast.success(`"${attr.label}" is now ${checked ? 'active' : 'inactive'}`);
            fetchAttributeOptions();
        } catch (error) {
            console.error('Toggle active error:', error);
            setAttributes((prev) =>
                prev.map((item) => (item.id === attr.id ? { ...item, is_active: !checked } : item))
            );
            const message = error.response?.data?.detail || 'Failed to update attribute status';
            toast.error(message);
        }
    };

    const handleDeleteAttr = async (attr) => {
        if (!window.confirm(`Are you sure you want to delete "${attr.label}"?`)) {
            return;
        }

        try {
            await axios.delete(`${API}/admin/attributes/${attr.id}`);
            toast.success(`Attribute "${attr.label}" deleted`);
            fetchAttributes(selectedAttributeType);
            fetchAttributeOptions();
        } catch (error) {
            console.error('Delete attribute error:', error);
            const message = error.response?.data?.detail || 'Failed to delete attribute';
            toast.error(message);
        }
    };

    // Products handlers
    const openAddModal = () => {
        setEditingProduct(null);
        setFormData(initialFormState);
        setErrors({});
        setIsFormOpen(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setErrors({});
        setFormData({
            name: product.name || '',
            description: product.description || '',
            price: product.price ?? '',
            original_price: product.original_price ?? '',
            category: product.category || '',
            subcategory: product.subcategory || '',
            product_type: product.product_type || '',
            region: product.region || '',
            fabric: product.fabric || '',
            print_type: product.print_type || '',
            style: product.style || '',
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
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleCheckboxChange = (name, checked) => {
        setFormData((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.name || !formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.description || !formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.price) newErrors.price = 'Price is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.product_type) newErrors.product_type = 'Product Type is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fill in all required fields (including Category & Product Type)');
            return;
        }
        setErrors({});

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
            product_type: formData.product_type,
            region: formData.region || null,
            fabric: formData.fabric || null,
            print_type: formData.print_type || null,
            style: formData.style || null,
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

    // Orders handlers
    const openOrderModal = (order) => {
        setSelectedOrder(order);
        setNewOrderStatus(order.order_status || 'pending');
        setIsOrderModalOpen(true);
    };

    const handleUpdateOrderStatus = async () => {
        if (!selectedOrder || !newOrderStatus) return;
        setUpdatingStatus(true);
        try {
            const response = await axios.put(`${API}/admin/orders/${selectedOrder.id}/status`, {
                status: newOrderStatus
            });
            toast.success(`Order status updated to "${newOrderStatus}"`);
            setSelectedOrder(response.data);
            setIsOrderModalOpen(false);
            fetchOrders();
        } catch (error) {
            console.error('Order status update error:', error);
            const message = error.response?.data?.detail || 'Failed to update order status';
            toast.error(message);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(search.toLowerCase()))
    );

    const filteredOrders = orders.filter((o) => {
        const matchesStatus = orderStatusFilter === 'all' || (o.order_status && o.order_status.toLowerCase() === orderStatusFilter.toLowerCase());
        const query = orderSearch.toLowerCase();
        const matchesSearch = !query || 
            (o.id && o.id.toLowerCase().includes(query)) ||
            (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
            (o.customer_email && o.customer_email.toLowerCase().includes(query));
        return matchesStatus && matchesSearch;
    });

    const filteredAttributes = attributes.filter((a) => {
        const query = attributeSearch.toLowerCase().trim();
        if (!query) return true;
        return (
            (a.label && a.label.toLowerCase().includes(query)) ||
            (a.value && a.value.toLowerCase().includes(query))
        );
    });

    const currentTypeInfo = ATTRIBUTE_TYPES.find((t) => t.key === selectedAttributeType) || ATTRIBUTE_TYPES[0];

    const getOrderStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>;
            case 'confirmed':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Confirmed</Badge>;
            case 'shipped':
                return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Shipped</Badge>;
            case 'delivered':
                return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Delivered</Badge>;
            case 'cancelled':
                return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'paid':
                return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Paid</Badge>;
            case 'failed':
                return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
            default:
                return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>;
        }
    };

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
        <div className="w-full px-4 sm:px-6 md:px-8 xl:px-[50px] py-8 space-y-6 bg-white min-h-screen">
            {/* Header & Main Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-charcoal">Admin Dashboard</h1>
                    <p className="text-[#4B5563] text-sm mt-1">
                        {activeTab === 'products'
                            ? 'Manage store inventory, add, update or delete products.'
                            : activeTab === 'orders'
                            ? 'Manage customer orders and update shipping statuses.'
                            : 'Manage dynamic store attributes (categories, styles, regions, fabrics, and print types).'}
                    </p>
                </div>
                {activeTab === 'products' && (
                    <Button
                        onClick={openAddModal}
                        className="bg-rose hover:bg-rose-dark text-white gap-2"
                    >
                        <Plus size={18} />
                        Add Product
                    </Button>
                )}
                {activeTab === 'categories' && (
                    <Button
                        onClick={openAddAttrModal}
                        className="bg-rose hover:bg-rose-dark text-white gap-2"
                    >
                        <Plus size={18} />
                        Add {currentTypeInfo.label}
                    </Button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-[#E5E7EB] gap-6" data-testid="admin-tabs">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'products'
                            ? 'border-rose text-rose'
                            : 'border-transparent text-[#4B5563] hover:text-charcoal'
                    }`}
                >
                    <Package size={18} />
                    Products ({products.length})
                </button>
                <button
                    onClick={() => {
                        setActiveTab('orders');
                        fetchOrders();
                    }}
                    className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'orders'
                            ? 'border-rose text-rose'
                            : 'border-transparent text-[#4B5563] hover:text-charcoal'
                    }`}
                >
                    <ShoppingBag size={18} />
                    Orders ({orders.length})
                </button>
                <button
                    onClick={() => {
                        setActiveTab('categories');
                        fetchAttributes(selectedAttributeType);
                    }}
                    className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'categories'
                            ? 'border-rose text-rose'
                            : 'border-transparent text-[#4B5563] hover:text-charcoal'
                    }`}
                    data-testid="admin-tab-categories"
                >
                    <Tags size={18} />
                    Categories & Filters
                </button>
            </div>

            {/* PRODUCTS TAB CONTENT */}
            {activeTab === 'products' && (
                <div className="space-y-6">
                    {/* Controls bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" size={18} />
                            <Input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-white border-[#E5E7EB]"
                            />
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#4B5563]">
                            <Package size={18} />
                            <span>Total Products: <strong className="text-charcoal">{products.length}</strong></span>
                            <Button variant="outline" size="sm" onClick={fetchProducts} className="ml-2 gap-1 border-[#E5E7EB]">
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
                        <div className="text-center py-16 bg-white rounded-lg border border-dashed border-[#E5E7EB] shadow-xs">
                            <Package className="mx-auto h-12 w-12 text-[#4B5563] mb-3" />
                            <h3 className="text-lg font-medium text-charcoal">No products found</h3>
                            <p className="text-sm text-[#4B5563] mt-1">Try adjusting your search query or add a new product.</p>
                        </div>
                    ) : (
                        <div className="border border-[#E5E7EB] rounded-lg overflow-x-auto bg-white shadow-sm">
                            <Table>
                                <TableHeader className="bg-white">
                                    <TableRow className="border-b border-[#E5E7EB]">
                                        <TableHead className="w-16 text-[#4B5563]">Thumbnail</TableHead>
                                        <TableHead className="text-[#4B5563]">Name</TableHead>
                                        <TableHead className="text-[#4B5563]">Category</TableHead>
                                        <TableHead className="text-[#4B5563]">Price</TableHead>
                                        <TableHead className="text-[#4B5563]">Stock</TableHead>
                                        <TableHead className="text-[#4B5563]">Badges</TableHead>
                                        <TableHead className="text-right text-[#4B5563]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.map((product) => (
                                        <TableRow key={product.id} className="border-b border-[#E5E7EB]">
                                            <TableCell>
                                                <img
                                                    src={product.images && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600'}
                                                    alt={product.name}
                                                    className="w-12 h-12 object-cover rounded-md border border-[#E5E7EB]"
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium text-charcoal">
                                                <div>{product.name}</div>
                                                {product.subcategory && (
                                                    <div className="text-xs text-[#4B5563]">{product.subcategory}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="capitalize text-charcoal">{product.category}</TableCell>
                                            <TableCell>
                                                <div className="font-semibold text-charcoal">₹{product.price?.toLocaleString('en-IN')}</div>
                                                {product.original_price && (
                                                    <div className="text-xs text-[#4B5563] line-through">
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
                </div>
            )}

            {/* ORDERS TAB CONTENT */}
            {activeTab === 'orders' && (
                <div className="space-y-6">
                    {/* Controls bar */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" size={18} />
                                <Input
                                    type="text"
                                    placeholder="Search by Order ID, Customer..."
                                    value={orderSearch}
                                    onChange={(e) => setOrderSearch(e.target.value)}
                                    className="pl-10 bg-white border-[#E5E7EB]"
                                />
                            </div>

                            <select
                                value={orderStatusFilter}
                                onChange={(e) => setOrderStatusFilter(e.target.value)}
                                className="w-full sm:w-48 px-3 py-2 border border-[#E5E7EB] rounded-md text-base bg-white text-charcoal focus:outline-none focus:ring-1 focus:ring-rose"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-[#4B5563] w-full md:w-auto justify-between md:justify-end">
                            <span>Total Orders: <strong className="text-charcoal">{orders.length}</strong></span>
                            <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-1 border-[#E5E7EB]">
                                <RefreshCw size={14} className={ordersLoading ? 'animate-spin' : ''} />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Orders Table Container (Mobile Scrollable) */}
                    {ordersLoading ? (
                        <div className="py-20 flex justify-center items-center">
                            <RefreshCw className="w-8 h-8 animate-spin text-rose" />
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-lg border border-dashed border-[#E5E7EB] shadow-xs">
                            <ShoppingBag className="mx-auto h-12 w-12 text-[#4B5563] mb-3" />
                            <h3 className="text-lg font-medium text-charcoal">No orders yet</h3>
                            <p className="text-sm text-[#4B5563] mt-1">
                                {orderStatusFilter !== 'all' || orderSearch
                                    ? 'No orders match the current filter or search criteria.'
                                    : 'When customers place orders, they will appear here.'}
                            </p>
                        </div>
                    ) : (
                        <div className="border border-[#E5E7EB] rounded-lg overflow-x-auto bg-white shadow-sm">
                            <Table className="min-w-[750px]">
                                <TableHeader className="bg-white">
                                    <TableRow className="border-b border-[#E5E7EB]">
                                        <TableHead className="text-[#4B5563]">Order ID</TableHead>
                                        <TableHead className="text-[#4B5563]">Date</TableHead>
                                        <TableHead className="text-[#4B5563]">Customer</TableHead>
                                        <TableHead className="text-[#4B5563]">Items</TableHead>
                                        <TableHead className="text-[#4B5563]">Total</TableHead>
                                        <TableHead className="text-[#4B5563]">Payment</TableHead>
                                        <TableHead className="text-[#4B5563]">Order Status</TableHead>
                                        <TableHead className="text-right text-[#4B5563]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map((order) => (
                                        <TableRow key={order.id} className="border-b border-[#E5E7EB]">
                                            <TableCell className="font-mono text-xs text-charcoal font-semibold">
                                                #{order.id.slice(0, 8)}
                                            </TableCell>
                                            <TableCell className="text-xs text-[#4B5563] whitespace-nowrap">
                                                {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-sm text-charcoal">{order.customer_name}</div>
                                                <div className="text-xs text-[#4B5563]">{order.customer_email}</div>
                                            </TableCell>
                                            <TableCell className="text-sm text-charcoal">
                                                {order.items ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0} items
                                            </TableCell>
                                            <TableCell className="font-semibold text-charcoal whitespace-nowrap">
                                                ₹{order.total_amount?.toLocaleString('en-IN')}
                                            </TableCell>
                                            <TableCell>
                                                {getPaymentStatusBadge(order.payment_status)}
                                            </TableCell>
                                            <TableCell>
                                                {getOrderStatusBadge(order.order_status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openOrderModal(order)}
                                                    className="gap-1 text-xs border-[#E5E7EB] hover:bg-gray-50"
                                                >
                                                    <Eye size={14} />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            )}

            {/* CATEGORIES / ATTRIBUTES TAB CONTENT */}
            {activeTab === 'categories' && (
                <div className="space-y-6">
                    {/* Attribute Type Selector (Sub-tabs) & Actions Bar */}
                    <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* 5 Attribute Types Selector */}
                            <div className="flex flex-wrap items-center gap-2" data-testid="attribute-type-tabs">
                                {ATTRIBUTE_TYPES.map((t) => {
                                    const isSelected = selectedAttributeType === t.key;
                                    return (
                                        <button
                                            key={t.key}
                                            onClick={() => handleAttributeTypeChange(t.key)}
                                            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 border ${
                                                isSelected
                                                    ? 'bg-rose text-white border-rose shadow-xs'
                                                    : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-gray-50 hover:text-charcoal'
                                            }`}
                                            data-testid={`attribute-tab-${t.key}`}
                                        >
                                            <span>{t.label}</span>
                                            {isSelected && (
                                                <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                                                    {attributes.length}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Search and Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" size={16} />
                                    <Input
                                        type="text"
                                        placeholder={`Search ${currentTypeInfo.plural.toLowerCase()}...`}
                                        value={attributeSearch}
                                        onChange={(e) => setAttributeSearch(e.target.value)}
                                        className="pl-9 h-9 text-xs bg-white border-[#E5E7EB]"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchAttributes(selectedAttributeType)}
                                    className="gap-1 border-[#E5E7EB] text-xs h-9 flex-shrink-0"
                                    title="Refresh attributes"
                                >
                                    <RefreshCw size={14} className={attributesLoading ? 'animate-spin' : ''} />
                                    Refresh
                                </Button>
                                <Button
                                    onClick={openAddAttrModal}
                                    className="bg-rose hover:bg-rose-dark text-white gap-1.5 text-xs h-9 w-full sm:w-auto flex-shrink-0"
                                    data-testid="add-attribute-btn"
                                >
                                    <Plus size={16} />
                                    Add New {currentTypeInfo.label}
                                </Button>
                            </div>
                        </div>

                        <div className="text-xs text-[#4B5563] border-t border-[#E5E7EB] pt-2 flex items-center justify-between">
                            <span>
                                Managing <strong>{currentTypeInfo.label}</strong> options available across the storefront and admin forms.
                            </span>
                            <span>
                                Total: <strong className="text-charcoal">{attributes.length}</strong>
                            </span>
                        </div>
                    </div>

                    {/* Attributes Table */}
                    {attributesLoading ? (
                        <div className="py-20 flex justify-center items-center">
                            <RefreshCw className="w-8 h-8 animate-spin text-rose" />
                        </div>
                    ) : filteredAttributes.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-lg border border-dashed border-[#E5E7EB] shadow-xs">
                            <Tags className="mx-auto h-12 w-12 text-[#4B5563] mb-3" />
                            <h3 className="text-lg font-medium text-charcoal">No {currentTypeInfo.plural.toLowerCase()} found</h3>
                            <p className="text-sm text-[#4B5563] mt-1">
                                {attributeSearch
                                    ? 'No items match your search query.'
                                    : `Get started by adding your first ${currentTypeInfo.label.toLowerCase()}.`}
                            </p>
                        </div>
                    ) : (
                        <div className="border border-[#E5E7EB] rounded-lg overflow-x-auto bg-white shadow-sm">
                            <Table className="min-w-[700px]">
                                <TableHeader className="bg-white">
                                    <TableRow className="border-b border-[#E5E7EB]">
                                        <TableHead className="text-[#4B5563] w-24">Order</TableHead>
                                        <TableHead className="text-[#4B5563]">Display Label</TableHead>
                                        <TableHead className="text-[#4B5563]">Slug / Value</TableHead>
                                        <TableHead className="text-[#4B5563] text-center w-28">Product Count</TableHead>
                                        <TableHead className="text-[#4B5563]">Status</TableHead>
                                        <TableHead className="text-[#4B5563] text-center w-32">Quick Toggle</TableHead>
                                        <TableHead className="text-right text-[#4B5563] w-28">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAttributes.map((attr, index) => (
                                        <TableRow key={attr.id} className="border-b border-[#E5E7EB] hover:bg-gray-50/50">
                                            <TableCell className="w-24">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-xs font-semibold text-[#4B5563] w-6">
                                                        #{attr.display_order ?? attr.sort_order ?? (index + 1)}
                                                    </span>
                                                    <div className="flex flex-col">
                                                        <button
                                                            type="button"
                                                            disabled={index === 0}
                                                            onClick={() => handleMoveOrder(index, 'up')}
                                                            className="p-0.5 text-gray-400 hover:text-charcoal disabled:opacity-20 disabled:cursor-not-allowed"
                                                            title="Move Up"
                                                        >
                                                            <ChevronUp size={13} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={index === filteredAttributes.length - 1}
                                                            onClick={() => handleMoveOrder(index, 'down')}
                                                            className="p-0.5 text-gray-400 hover:text-charcoal disabled:opacity-20 disabled:cursor-not-allowed"
                                                            title="Move Down"
                                                        >
                                                            <ChevronDown size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-charcoal text-sm">
                                                {attr.label}
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-xs font-mono bg-gray-100 text-charcoal px-2.5 py-1 rounded border border-[#E5E7EB]">
                                                    {attr.value}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="text-xs font-semibold bg-gray-50 border-[#E5E7EB] text-charcoal">
                                                    {attr.count !== undefined ? attr.count : 0}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {attr.is_active || attr.active ? (
                                                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 text-xs">
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-0 text-xs">
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center">
                                                    <Switch
                                                        checked={Boolean(attr.is_active ?? attr.active)}
                                                        onCheckedChange={(checked) => handleToggleActive(attr, checked)}
                                                        className="data-[state=checked]:bg-rose"
                                                        aria-label={`Toggle active for ${attr.label}`}
                                                        data-testid={`toggle-active-${attr.value}`}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEditAttrModal(attr)}
                                                        className="h-8 w-8 p-0"
                                                        title="Edit Attribute"
                                                        data-testid={`edit-attribute-${attr.value}`}
                                                    >
                                                        <Edit size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteAttr(attr)}
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                        title="Delete Attribute"
                                                        data-testid={`delete-attribute-${attr.value}`}
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
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                                    Product Name *
                                </label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Pastel Pink Embroidered Saree"
                                    className="border-[#E5E7EB]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
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
                                    className="border-[#E5E7EB]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
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
                                    className="border-[#E5E7EB]"
                                />
                            </div>

                            {attributeOptionsError && (
                                <div className="sm:col-span-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-center justify-between text-xs text-red-700">
                                    <span>Failed to load attribute options: {attributeOptionsError}</span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={fetchAttributeOptions}
                                        className="h-7 text-xs border-red-300 hover:bg-red-100 text-red-700 gap-1"
                                    >
                                        <RefreshCw size={12} className={attributeOptionsLoading ? "animate-spin" : ""} /> Retry
                                    </Button>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                                    Category *
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md text-sm bg-white text-charcoal focus:outline-none focus:ring-1 focus:ring-rose ${
                                        errors.category ? 'border-rose' : 'border-[#E5E7EB]'
                                    }`}
                                    required
                                    disabled={attributeOptionsLoading || !!attributeOptionsError}
                                >
                                    {renderDropdownOptions('category', formData.category, 'Select Category')}
                                </select>
                                <p className="text-xs text-[#4B5563] mt-1">Category = broad section</p>
                                {errors.category && (
                                    <p className="text-xs text-rose mt-1 font-medium">{errors.category}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                                    Product Type *
                                </label>
                                <select
                                    name="product_type"
                                    value={formData.product_type || ''}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md text-sm bg-white text-charcoal focus:outline-none focus:ring-1 focus:ring-rose ${
                                        errors.product_type ? 'border-rose' : 'border-[#E5E7EB]'
                                    }`}
                                    required
                                    disabled={attributeOptionsLoading || !!attributeOptionsError}
                                >
                                    {renderDropdownOptions('product_type', formData.product_type, 'Select Product Type')}
                                </select>
                                <p className="text-xs text-[#4B5563] mt-1">Product Type = what the item is</p>
                                {errors.product_type && (
                                    <p className="text-xs text-rose mt-1 font-medium">{errors.product_type}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                                    Subcategory (optional, shown on product page only)
                                </label>
                                <Input
                                    name="subcategory"
                                    value={formData.subcategory}
                                    onChange={handleChange}
                                    placeholder="e.g. Banarasi silk, Floral print"
                                    className="border-[#E5E7EB]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                                    Style
                                </label>
                                <select
                                    name="style"
                                    value={formData.style || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm bg-white text-charcoal focus:outline-none focus:ring-1 focus:ring-rose"
                                    disabled={attributeOptionsLoading || !!attributeOptionsError}
                                >
                                    {renderDropdownOptions('style', formData.style, 'None')}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                                    Region
                                </label>
                                <select
                                    name="region"
                                    value={formData.region || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm bg-white text-charcoal focus:outline-none focus:ring-1 focus:ring-rose"
                                    disabled={attributeOptionsLoading || !!attributeOptionsError}
                                >
                                    {renderDropdownOptions('region', formData.region, 'None')}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                                    Fabric
                                </label>
                                <select
                                    name="fabric"
                                    value={formData.fabric || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm bg-white text-charcoal focus:outline-none focus:ring-1 focus:ring-rose"
                                    disabled={attributeOptionsLoading || !!attributeOptionsError}
                                >
                                    {renderDropdownOptions('fabric', formData.fabric, 'None')}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                                    Print / Craft
                                </label>
                                <select
                                    name="print_type"
                                    value={formData.print_type || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm bg-white text-charcoal focus:outline-none focus:ring-1 focus:ring-rose"
                                    disabled={attributeOptionsLoading || !!attributeOptionsError}
                                >
                                    {renderDropdownOptions('print_type', formData.print_type, 'None')}
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Enter detailed description of the product..."
                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-rose"
                                    required
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                                    Image URLs (comma separated)
                                </label>
                                <textarea
                                    name="images"
                                    value={formData.images}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-rose"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                                    Available Sizes (comma separated)
                                </label>
                                <Input
                                    name="sizes"
                                    value={formData.sizes}
                                    onChange={handleChange}
                                    placeholder="XS, S, M, L, XL"
                                    className="border-[#E5E7EB]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                                    Available Colors (comma separated)
                                </label>
                                <Input
                                    name="colors"
                                    value={formData.colors}
                                    onChange={handleChange}
                                    placeholder="Pink, Rose, Gold"
                                    className="border-[#E5E7EB]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                                    Stock Quantity
                                </label>
                                <Input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    placeholder="10"
                                    min="0"
                                    className="border-[#E5E7EB]"
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

            {/* Order Details & Status Update Dialog */}
            <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                {selectedOrder && (
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-heading font-bold flex items-center justify-between">
                                <span>Order Details #{selectedOrder.id.slice(0, 8)}</span>
                            </DialogTitle>
                            <div className="text-xs text-[#4B5563] flex flex-wrap gap-4 pt-1">
                                <span>Placed on: <strong>{new Date(selectedOrder.created_at).toLocaleString('en-IN')}</strong></span>
                                <span>Payment Method: <strong className="uppercase">{selectedOrder.payment_method || 'Razorpay'}</strong></span>
                            </div>
                        </DialogHeader>

                        <div className="space-y-6 py-2">
                            {/* Customer & Shipping Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-2">Customer Info</h4>
                                    <p className="font-bold text-charcoal text-sm">{selectedOrder.customer_name}</p>
                                    <p className="text-xs text-[#4B5563] mt-0.5">{selectedOrder.customer_email}</p>
                                    <p className="text-xs text-[#4B5563] mt-0.5">Phone: {selectedOrder.customer_phone}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-2">Shipping Address</h4>
                                    {selectedOrder.shipping_address ? (
                                        <div className="text-xs text-[#4B5563] space-y-0.5">
                                            <p className="font-medium text-charcoal">{selectedOrder.shipping_address.name || selectedOrder.customer_name}</p>
                                            <p>{selectedOrder.shipping_address.street || selectedOrder.shipping_address.address}</p>
                                            <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} - {selectedOrder.shipping_address.pincode || selectedOrder.shipping_address.zip}</p>
                                            {selectedOrder.shipping_address.phone && <p>Phone: {selectedOrder.shipping_address.phone}</p>}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-[#4B5563] italic">No shipping address recorded</p>
                                    )}
                                </div>
                            </div>

                            {/* Ordered Items Table */}
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-3">Ordered Items</h4>
                                <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-white">
                                            <TableRow className="border-b border-[#E5E7EB]">
                                                <TableHead className="text-[#4B5563]">Item</TableHead>
                                                <TableHead className="text-[#4B5563]">Variant</TableHead>
                                                <TableHead className="text-[#4B5563]">Price</TableHead>
                                                <TableHead className="text-[#4B5563]">Qty</TableHead>
                                                <TableHead className="text-right text-[#4B5563]">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedOrder.items && selectedOrder.items.map((item, i) => (
                                                <TableRow key={i} className="border-b border-[#E5E7EB]">
                                                    <TableCell className="font-medium text-charcoal">
                                                        <div className="flex items-center gap-3">
                                                            {item.product_image && (
                                                                <img
                                                                    src={item.product_image}
                                                                    alt={item.product_name}
                                                                    className="w-10 h-12 object-cover rounded border border-[#E5E7EB]"
                                                                />
                                                            )}
                                                            <span>{item.product_name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-[#4B5563]">
                                                        Size: {item.size || 'STD'}, Color: {item.color || 'STD'}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-charcoal">
                                                        ₹{item.price?.toLocaleString('en-IN')}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-charcoal">
                                                        {item.quantity}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold text-charcoal">
                                                        ₹{(item.subtotal || (item.price * item.quantity))?.toLocaleString('en-IN')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Summary & Payment Info */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-[#E5E7EB] rounded-xl bg-white">
                                <div className="flex items-center gap-4 text-xs">
                                    <div>
                                        <span className="text-[#4B5563] block">Payment Status:</span>
                                        {getPaymentStatusBadge(selectedOrder.payment_status)}
                                    </div>
                                    <div>
                                        <span className="text-[#4B5563] block">Current Order Status:</span>
                                        {getOrderStatusBadge(selectedOrder.order_status)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-[#4B5563] block">Total Amount</span>
                                    <span className="text-xl font-bold text-charcoal">₹{selectedOrder.total_amount?.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            {/* Status Update Control Section */}
                            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs space-y-3">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4B5563]">
                                    Update Order Fulfillment Status
                                </h4>
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <select
                                        value={newOrderStatus}
                                        onChange={(e) => setNewOrderStatus(e.target.value)}
                                        className="w-full sm:flex-1 px-3 py-2 border border-[#E5E7EB] rounded-md text-base bg-white text-charcoal focus:outline-none focus:ring-1 focus:ring-rose"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <Button
                                        onClick={handleUpdateOrderStatus}
                                        disabled={updatingStatus || newOrderStatus === selectedOrder.order_status}
                                        className="w-full sm:w-auto bg-rose hover:bg-rose-dark text-white gap-2"
                                    >
                                        <Truck size={16} />
                                        {updatingStatus ? 'Updating...' : 'Update Status'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOrderModalOpen(false)}
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>

            {/* Add / Edit Attribute Dialog */}
            <Dialog open={isAttrModalOpen} onOpenChange={setIsAttrModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-heading font-bold text-charcoal">
                            {editingAttribute ? `Edit ${currentTypeInfo.label}` : `Add New ${currentTypeInfo.label}`}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmitAttr} className="space-y-4 py-2">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                                Label (Display Name) *
                            </label>
                            <Input
                                name="label"
                                value={attrFormData.label}
                                onChange={handleAttrLabelChange}
                                placeholder="e.g. Linen"
                                className={attrErrors.label ? 'border-rose' : 'border-[#E5E7EB]'}
                                required
                                autoFocus
                                data-testid="attribute-label-input"
                            />
                            {attrErrors.label && (
                                <p className="text-xs text-rose mt-1">{attrErrors.label}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                                Value (Slug / Identifier) *
                            </label>
                            <Input
                                name="value"
                                value={attrFormData.value}
                                onChange={handleAttrValueChange}
                                placeholder="e.g. linen"
                                disabled={!!editingAttribute}
                                className={`font-mono text-sm ${editingAttribute ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''} ${attrErrors.value ? 'border-rose' : 'border-[#E5E7EB]'}`}
                                required
                                data-testid="attribute-value-input"
                            />
                            {editingAttribute ? (
                                <p className="text-xs text-[#4B5563] mt-1">Slug cannot be changed once created as existing products reference it.</p>
                            ) : (
                                <p className="text-xs text-[#4B5563] mt-1">Auto-generated from label in lowercase-hyphenated format, but you can edit it.</p>
                            )}
                            {attrErrors.value && (
                                <p className="text-xs text-rose mt-1">{attrErrors.value}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                                Display Order
                            </label>
                            <Input
                                type="number"
                                name="display_order"
                                value={attrFormData.display_order}
                                onChange={(e) => setAttrFormData(prev => ({ ...prev, display_order: e.target.value }))}
                                min="1"
                                className="border-[#E5E7EB]"
                                data-testid="attribute-order-input"
                            />
                            <p className="text-xs text-[#4B5563] mt-1">Defines sort position in storefront filters & dropdowns.</p>
                        </div>

                        <div className="pt-2">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                                <Checkbox
                                    checked={attrFormData.is_active}
                                    onCheckedChange={(checked) => setAttrFormData(prev => ({ ...prev, is_active: checked }))}
                                    data-testid="attribute-active-checkbox"
                                />
                                <span>Active (visible in store filters & product dropdowns)</span>
                            </label>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAttrModalOpen(false)}
                                disabled={submittingAttr}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-rose hover:bg-rose-dark text-white"
                                disabled={submittingAttr}
                                data-testid="attribute-submit-btn"
                            >
                                {submittingAttr ? 'Saving...' : editingAttribute ? 'Update Attribute' : 'Create Attribute'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
