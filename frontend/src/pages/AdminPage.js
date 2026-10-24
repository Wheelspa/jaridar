import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Package, Search, RefreshCw, X, Eye, ShoppingBag, Truck, CheckCircle, Clock, Tags, ChevronUp, ChevronDown, Upload, Loader2, Image as ImageIcon, Users, Star, MessageSquare, Mail, Download, LayoutDashboard, AlertTriangle, TrendingUp, IndianRupee, Sliders } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { HomeContentTab } from '@/components/admin/HomeContentTab';
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

    // Active tab: 'dashboard' | 'products' | 'orders' | 'categories' | 'customers' | 'reviews' | 'newsletter'
    const [activeTab, setActiveTab] = useState('dashboard');

    // Dashboard state
    const [dashboardStats, setDashboardStats] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(false);

    // Products state
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});
    const [uploadingImage, setUploadingImage] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const fileInputRef = useRef(null);

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

    // Customers state
    const [customers, setCustomers] = useState([]);
    const [customersLoading, setCustomersLoading] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewSearch, setReviewSearch] = useState('');
    const [deletingReviewId, setDeletingReviewId] = useState(null);

    // Newsletter state
    const [subscribers, setSubscribers] = useState([]);
    const [subscribersLoading, setSubscribersLoading] = useState(false);
    const [subscriberSearch, setSubscriberSearch] = useState('');

    useEffect(() => {
        if (!authLoading) {
            if (!isAdmin) {
                toast.error('Admin access required');
                navigate('/');
            } else {
                fetchDashboardStats();
                fetchProducts();
                fetchOrders();
                fetchAttributes('category');
                fetchAttributeOptions();
                fetchCustomers();
                fetchReviews();
                fetchSubscribers();
            }
        }
    }, [authLoading, isAdmin, navigate]);

    const fetchDashboardStats = async () => {
        setDashboardLoading(true);
        try {
            const token = localStorage.getItem('jaridar_token');
            const response = await axios.get(`${API}/admin/dashboard-stats`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setDashboardStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
            toast.error('Failed to load dashboard metrics');
        } finally {
            setDashboardLoading(false);
        }
    };

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

    const fetchCustomers = async () => {
        setCustomersLoading(true);
        try {
            const token = localStorage.getItem('jaridar_token');
            const response = await axios.get(`${API}/admin/customers`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setCustomers(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Failed to fetch admin customers:', error);
            toast.error('Failed to load customers');
        } finally {
            setCustomersLoading(false);
        }
    };

    const fetchReviews = async () => {
        setReviewsLoading(true);
        try {
            const token = localStorage.getItem('jaridar_token');
            const response = await axios.get(`${API}/admin/reviews`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setReviews(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Failed to fetch admin reviews:', error);
            toast.error('Failed to load reviews');
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleDeleteReview = async (review) => {
        const targetDesc = `review by "${review.customer_name || 'Customer'}" for "${review.product_name || 'Product'}"`;
        if (!window.confirm(`Are you sure you want to delete this ${targetDesc}?`)) {
            return;
        }

        setDeletingReviewId(review.id);
        try {
            const token = localStorage.getItem('jaridar_token');
            await axios.delete(`${API}/admin/reviews/${review.id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            toast.success('Review deleted successfully');
            setReviews((prev) => prev.filter((r) => r.id !== review.id));
            fetchProducts();
        } catch (error) {
            console.error('Failed to delete review:', error);
            const errorMsg = error.response?.data?.detail || 'Failed to delete review';
            toast.error(errorMsg);
        } finally {
            setDeletingReviewId(null);
        }
    };

    const fetchSubscribers = async () => {
        setSubscribersLoading(true);
        try {
            const token = localStorage.getItem('jaridar_token');
            const response = await axios.get(`${API}/admin/newsletter`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setSubscribers(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Failed to fetch newsletter subscribers:', error);
            toast.error('Failed to load newsletter subscribers');
        } finally {
            setSubscribersLoading(false);
        }
    };

    const downloadNewsletterCSV = () => {
        if (subscribers.length === 0) {
            toast.error('No newsletter subscribers to export');
            return;
        }

        const headers = ['Email', 'Subscribed Date'];
        const rows = subscribers.map((s) => {
            const date = s.subscribed_at || s.created_at || '';
            const formattedDate = date ? new Date(date).toISOString().replace('T', ' ').slice(0, 19) : '';
            return `"${(s.email || '').replace(/"/g, '""')}","${formattedDate}"`;
        });

        const csvContent = [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.setAttribute('download', `jaridar-newsletter-subscribers-${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Newsletter subscribers exported to CSV');
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

    const uploadImageFile = async (file) => {
        if (!file) return;

        const validExtensions = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!validExtensions.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
            toast.error('Invalid file type. Please upload a JPG, PNG, or WebP image.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size exceeds 5MB limit.');
            return;
        }

        setUploadingImage(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        try {
            const token = localStorage.getItem('jaridar_token');
            const res = await axios.post(`${API}/admin/products/upload-image`, uploadFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            const uploadedUrl = res.data?.url || res.data?.image_url;
            if (uploadedUrl) {
                setFormData((prev) => {
                    const currentImgs = prev.images
                        ? prev.images.split(',').map((s) => s.trim()).filter(Boolean)
                        : [];
                    const updatedImgs = [...currentImgs, uploadedUrl].join(', ');
                    return { ...prev, images: updatedImgs };
                });
                toast.success('Image uploaded successfully');
            }
        } catch (err) {
            console.error('Failed to upload image:', err);
            const errorMsg = err.response?.data?.detail || 'Failed to upload image. Please try again.';
            toast.error(errorMsg);
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadImageFile(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            uploadImageFile(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDraggingOver(false);
    };

    const handleRemoveImage = (indexToRemove) => {
        setFormData((prev) => {
            const currentImgs = prev.images
                ? prev.images.split(',').map((s) => s.trim()).filter(Boolean)
                : [];
            const updatedImgs = currentImgs.filter((_, idx) => idx !== indexToRemove).join(', ');
            return { ...prev, images: updatedImgs };
        });
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

    const filteredCustomers = customers.filter((c) => {
        if (!customerSearch.trim()) return true;
        const query = customerSearch.toLowerCase().trim();
        const name = (c.name || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        return name.includes(query) || email.includes(query) || phone.includes(query);
    });

    const filteredReviews = reviews.filter((r) => {
        if (!reviewSearch.trim()) return true;
        const query = reviewSearch.toLowerCase().trim();
        const prodName = (r.product_name || '').toLowerCase();
        const custName = (r.customer_name || r.user_name || '').toLowerCase();
        const comment = (r.comment || '').toLowerCase();
        return prodName.includes(query) || custName.includes(query) || comment.includes(query);
    });

    const filteredSubscribers = subscribers.filter((s) => {
        if (!subscriberSearch.trim()) return true;
        const query = subscriberSearch.toLowerCase().trim();
        return (s.email || '').toLowerCase().includes(query);
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
                        {activeTab === 'dashboard'
                            ? 'Overview of store performance, revenue, orders, and inventory alerts.'
                            : activeTab === 'products'
                            ? 'Manage store inventory, add, update or delete products.'
                            : activeTab === 'orders'
                            ? 'Manage customer orders and update shipping statuses.'
                            : activeTab === 'categories'
                            ? 'Manage dynamic store attributes (categories, styles, regions, fabrics, and print types).'
                            : activeTab === 'customers'
                            ? 'View registered customers, their contact details, and order activity.'
                            : activeTab === 'reviews'
                            ? 'Moderate customer product reviews and ratings.'
                            : activeTab === 'newsletter'
                            ? 'View and export newsletter subscriber email addresses.'
                            : activeTab === 'homeContent'
                            ? 'Manage top announcement bar and hero banner slides without touching code.'
                            : 'Admin settings and configuration.'}
                    </p>
                </div>
                {activeTab === 'dashboard' && (
                    <Button
                        variant="outline"
                        onClick={fetchDashboardStats}
                        disabled={dashboardLoading}
                        className="border-[#E5E7EB] text-charcoal hover:bg-neutral-50 gap-2"
                        title="Refresh metrics"
                    >
                        <RefreshCw size={15} className={dashboardLoading ? 'animate-spin' : ''} />
                        Refresh Metrics
                    </Button>
                )}
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
                    onClick={() => {
                        setActiveTab('dashboard');
                        fetchDashboardStats();
                    }}
                    className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'dashboard'
                            ? 'border-rose text-rose'
                            : 'border-transparent text-[#4B5563] hover:text-charcoal'
                    }`}
                    data-testid="admin-tab-dashboard"
                >
                    <LayoutDashboard size={18} />
                    Dashboard
                </button>
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
                <button
                    onClick={() => {
                        setActiveTab('customers');
                        fetchCustomers();
                    }}
                    className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'customers'
                            ? 'border-rose text-rose'
                            : 'border-transparent text-[#4B5563] hover:text-charcoal'
                    }`}
                    data-testid="admin-tab-customers"
                >
                    <Users size={18} />
                    Customers ({customers.length})
                </button>
                <button
                    onClick={() => {
                        setActiveTab('reviews');
                        fetchReviews();
                    }}
                    className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'reviews'
                            ? 'border-rose text-rose'
                            : 'border-transparent text-[#4B5563] hover:text-charcoal'
                    }`}
                    data-testid="admin-tab-reviews"
                >
                    <Star size={18} />
                    Reviews ({reviews.length})
                </button>
                <button
                    onClick={() => {
                        setActiveTab('newsletter');
                        fetchSubscribers();
                    }}
                    className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'newsletter'
                            ? 'border-rose text-rose'
                            : 'border-transparent text-[#4B5563] hover:text-charcoal'
                    }`}
                    data-testid="admin-tab-newsletter"
                >
                    <Mail size={18} />
                    Newsletter ({subscribers.length})
                </button>
                <button
                    onClick={() => setActiveTab('homeContent')}
                    className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'homeContent'
                            ? 'border-rose text-rose'
                            : 'border-transparent text-[#4B5563] hover:text-charcoal'
                    }`}
                    data-testid="admin-tab-home-content"
                >
                    <Sliders size={18} />
                    Home Content
                </button>
            </div>

            {/* DASHBOARD TAB CONTENT */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    {/* Top 4 Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. Total Revenue */}
                        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[#6B7280] font-semibold">Total Revenue</p>
                                <h3 className="text-2xl font-bold font-heading text-charcoal mt-1">
                                    ₹{Number(dashboardStats?.total_revenue || 0).toLocaleString('en-IN')}
                                </h3>
                                <p className="text-[11px] text-[#6B7280] mt-0.5">Delivered & Confirmed</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                                <IndianRupee size={22} />
                            </div>
                        </div>

                        {/* 2. Total Orders */}
                        <div 
                            onClick={() => { setActiveTab('orders'); fetchOrders(); }}
                            className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between cursor-pointer hover:border-rose/40 hover:shadow-sm transition-all"
                            title="Click to view all orders"
                        >
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[#6B7280] font-semibold">Total Orders</p>
                                <h3 className="text-2xl font-bold font-heading text-charcoal mt-1">
                                    {dashboardStats?.total_orders ?? orders.length}
                                </h3>
                                <p className="text-[11px] text-rose font-medium mt-0.5 hover:underline">
                                    View orders &rarr;
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
                                <ShoppingBag size={22} />
                            </div>
                        </div>

                        {/* 3. Total Products */}
                        <div 
                            onClick={() => { setActiveTab('products'); }}
                            className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between cursor-pointer hover:border-rose/40 hover:shadow-sm transition-all"
                            title="Click to view product inventory"
                        >
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[#6B7280] font-semibold">Total Products</p>
                                <h3 className="text-2xl font-bold font-heading text-charcoal mt-1">
                                    {dashboardStats?.total_products ?? products.length}
                                </h3>
                                <p className="text-[11px] text-rose font-medium mt-0.5 hover:underline">
                                    Manage catalog &rarr;
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
                                <Package size={22} />
                            </div>
                        </div>

                        {/* 4. Total Customers */}
                        <div 
                            onClick={() => { setActiveTab('customers'); fetchCustomers(); }}
                            className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between cursor-pointer hover:border-rose/40 hover:shadow-sm transition-all"
                            title="Click to view customers"
                        >
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[#6B7280] font-semibold">Total Customers</p>
                                <h3 className="text-2xl font-bold font-heading text-charcoal mt-1">
                                    {dashboardStats?.total_customers ?? customers.length}
                                </h3>
                                <p className="text-[11px] text-rose font-medium mt-0.5 hover:underline">
                                    View customers &rarr;
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
                                <Users size={22} />
                            </div>
                        </div>
                    </div>

                    {/* Orders by Status Summary Strip */}
                    <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-heading font-semibold text-sm text-charcoal uppercase tracking-wider">
                                Order Status Breakdown
                            </h4>
                            <span className="text-xs text-[#6B7280]">
                                Total: {dashboardStats?.total_orders ?? orders.length} orders
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {[
                                { key: 'pending', label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                                { key: 'confirmed', label: 'Confirmed', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                                { key: 'shipped', label: 'Shipped', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                                { key: 'delivered', label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                                { key: 'cancelled', label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200' }
                            ].map((statusItem) => {
                                const count = dashboardStats?.orders_by_status?.[statusItem.key] ?? 0;
                                return (
                                    <div 
                                        key={statusItem.key}
                                        onClick={() => {
                                            setOrderStatusFilter(statusItem.key);
                                            setActiveTab('orders');
                                            fetchOrders();
                                        }}
                                        className={`p-3 rounded-lg border flex flex-col items-center justify-center cursor-pointer hover:shadow-xs transition-all ${statusItem.color}`}
                                    >
                                        <span className="text-xl font-bold">{count}</span>
                                        <span className="text-xs font-medium uppercase tracking-wider mt-0.5">{statusItem.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Low Stock Warning Section */}
                    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-xs">
                        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={18} className="text-amber-500" />
                                <h4 className="font-heading font-semibold text-sm text-charcoal uppercase tracking-wider">
                                    Low Stock Alert (Stock &lt; 5 Units)
                                </h4>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-200 text-charcoal">
                                {dashboardStats?.low_stock_products?.length || 0} Products
                            </span>
                        </div>

                        {dashboardStats?.low_stock_products?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-[#E5E7EB]">
                                            <TableHead className="font-bold text-charcoal">Product</TableHead>
                                            <TableHead className="font-bold text-charcoal">Category</TableHead>
                                            <TableHead className="font-bold text-charcoal">Price</TableHead>
                                            <TableHead className="font-bold text-charcoal">Current Stock</TableHead>
                                            <TableHead className="font-bold text-charcoal text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dashboardStats.low_stock_products.map((p) => {
                                            const firstImg = p.images && p.images[0] ? p.images[0] : null;
                                            return (
                                                <TableRow key={p.id} className="border-b border-[#E5E7EB] hover:bg-neutral-50/60 transition-colors">
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            {firstImg ? (
                                                                <img
                                                                    src={firstImg}
                                                                    alt={p.name}
                                                                    className="w-10 h-10 object-cover rounded-md border border-[#E5E7EB] flex-shrink-0"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-md bg-neutral-100 border border-[#E5E7EB] flex items-center justify-center text-xs text-[#9CA3AF] flex-shrink-0">
                                                                    <Package size={16} />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-medium text-charcoal">{p.name}</div>
                                                                <div className="text-xs text-[#6B7280] font-mono">ID: {p.id.slice(0, 8)}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-xs uppercase tracking-wider font-semibold text-[#4B5563]">
                                                            {p.category || 'General'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm font-semibold text-charcoal">
                                                            ₹{Number(p.price || 0).toLocaleString('en-IN')}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose border border-rose-200">
                                                            {p.stock === 0 ? 'Out of stock (0)' : `Only ${p.stock} left`}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                const fullProduct = products.find(prod => prod.id === p.id) || p;
                                                                openEditModal(fullProduct);
                                                            }}
                                                            className="text-xs border-[#E5E7EB] hover:border-rose hover:text-rose h-8"
                                                        >
                                                            Restock / Edit
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-8 px-4 text-center">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                                    <CheckCircle size={20} />
                                </div>
                                <p className="text-sm font-semibold text-charcoal">All inventory levels are healthy</p>
                                <p className="text-xs text-[#6B7280] mt-0.5">
                                    No products currently have stock below 5 units.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

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

            {/* CUSTOMERS TAB CONTENT */}
            {activeTab === 'customers' && (
                <div className="space-y-6">
                    {/* Controls Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" size={18} />
                            <Input
                                placeholder="Search by name, email, or phone..."
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                className="pl-9 border-[#E5E7EB]"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <span className="text-xs font-medium text-[#4B5563]">
                                Showing {filteredCustomers.length} of {customers.length} Customers
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchCustomers}
                                disabled={customersLoading}
                                className="border-[#E5E7EB] gap-2"
                                title="Refresh customers"
                            >
                                <RefreshCw size={14} className={customersLoading ? 'animate-spin' : ''} />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Customers Table */}
                    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-xs">
                        {customersLoading && customers.length === 0 ? (
                            <div className="py-20 text-center text-[#4B5563] flex flex-col items-center gap-2">
                                <Loader2 size={32} className="animate-spin text-rose" />
                                <span>Loading customers...</span>
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="py-16 text-center text-[#4B5563]">
                                <Users size={40} className="mx-auto mb-2 text-[#9CA3AF] opacity-60" />
                                <p className="font-medium">No customers found</p>
                                <p className="text-xs text-[#6B7280] mt-1">
                                    {customerSearch ? 'Try a different search term.' : 'Registered customer accounts will appear here.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                            <TableHead className="font-bold text-charcoal">Customer</TableHead>
                                            <TableHead className="font-bold text-charcoal">Email</TableHead>
                                            <TableHead className="font-bold text-charcoal">Phone</TableHead>
                                            <TableHead className="font-bold text-charcoal">Join Date</TableHead>
                                            <TableHead className="font-bold text-charcoal text-center">Orders Placed</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCustomers.map((c) => {
                                            const formattedDate = c.created_at
                                                ? new Date(c.created_at).toLocaleDateString('en-IN', {
                                                      day: 'numeric',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : '—';

                                            return (
                                                <TableRow key={c.id || c.email} className="border-b border-[#E5E7EB] hover:bg-neutral-50/60 transition-colors">
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-rose/10 text-rose flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                                                                {c.name ? c.name.charAt(0) : 'U'}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-charcoal flex items-center gap-2">
                                                                    <span>{c.name || 'Unnamed Customer'}</span>
                                                                    {c.is_admin && (
                                                                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose/10 text-rose border border-rose/30">
                                                                            Admin
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-[#6B7280] font-mono">ID: {c.id ? c.id.slice(0, 8) : '—'}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-charcoal">{c.email || '—'}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-[#4B5563]">{c.phone || '—'}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-[#4B5563]">{formattedDate}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                            c.order_count > 0 
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                                : 'bg-neutral-100 text-[#4B5563] border border-[#E5E7EB]'
                                                        }`}>
                                                            {c.order_count ?? 0} {c.order_count === 1 ? 'order' : 'orders'}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* REVIEWS TAB CONTENT */}
            {activeTab === 'reviews' && (
                <div className="space-y-6">
                    {/* Controls Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" size={18} />
                            <Input
                                placeholder="Search by product, customer, or comment..."
                                value={reviewSearch}
                                onChange={(e) => setReviewSearch(e.target.value)}
                                className="pl-9 border-[#E5E7EB]"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <span className="text-xs font-medium text-[#4B5563]">
                                Showing {filteredReviews.length} of {reviews.length} Reviews
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchReviews}
                                disabled={reviewsLoading}
                                className="border-[#E5E7EB] gap-2"
                                title="Refresh reviews"
                            >
                                <RefreshCw size={14} className={reviewsLoading ? 'animate-spin' : ''} />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Reviews Table */}
                    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-xs">
                        {reviewsLoading && reviews.length === 0 ? (
                            <div className="py-20 text-center text-[#4B5563] flex flex-col items-center gap-2">
                                <Loader2 size={32} className="animate-spin text-rose" />
                                <span>Loading reviews...</span>
                            </div>
                        ) : filteredReviews.length === 0 ? (
                            <div className="py-16 text-center text-[#4B5563]">
                                <MessageSquare size={40} className="mx-auto mb-2 text-[#9CA3AF] opacity-60" />
                                <p className="font-medium">No reviews found</p>
                                <p className="text-xs text-[#6B7280] mt-1">
                                    {reviewSearch ? 'Try a different search query.' : 'Customer product reviews will appear here for moderation.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                            <TableHead className="font-bold text-charcoal">Product</TableHead>
                                            <TableHead className="font-bold text-charcoal">Customer</TableHead>
                                            <TableHead className="font-bold text-charcoal">Rating</TableHead>
                                            <TableHead className="font-bold text-charcoal max-w-md">Review Comment</TableHead>
                                            <TableHead className="font-bold text-charcoal">Date</TableHead>
                                            <TableHead className="font-bold text-charcoal text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredReviews.map((r) => {
                                            const formattedDate = r.created_at
                                                ? new Date(r.created_at).toLocaleDateString('en-IN', {
                                                      day: 'numeric',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : '—';
                                            const ratingNum = Math.min(5, Math.max(1, Number(r.rating) || 5));

                                            return (
                                                <TableRow key={r.id} className="border-b border-[#E5E7EB] hover:bg-neutral-50/60 transition-colors">
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            {r.product_image ? (
                                                                <img
                                                                    src={r.product_image}
                                                                    alt={r.product_name}
                                                                    className="w-10 h-10 object-cover rounded-md border border-[#E5E7EB] flex-shrink-0"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-md bg-neutral-100 border border-[#E5E7EB] flex items-center justify-center text-xs text-[#9CA3AF] flex-shrink-0">
                                                                    <Package size={16} />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-medium text-charcoal">{r.product_name}</div>
                                                                <div className="text-xs text-[#6B7280] font-mono">ID: {r.product_id ? r.product_id.slice(0, 8) : '—'}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-charcoal">{r.customer_name}</div>
                                                        {r.customer_email && (
                                                            <div className="text-xs text-[#6B7280]">{r.customer_email}</div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={14}
                                                                    className={i < ratingNum ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}
                                                                />
                                                            ))}
                                                            <span className="text-xs font-semibold text-charcoal ml-1">{ratingNum}.0</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="max-w-md">
                                                        <p className="text-xs text-[#374151] italic leading-relaxed line-clamp-3">
                                                            "{r.comment || 'No comment provided'}"
                                                        </p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-xs text-[#4B5563]">{formattedDate}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteReview(r)}
                                                            disabled={deletingReviewId === r.id}
                                                            className="text-rose border-rose/30 hover:bg-rose/10 hover:text-rose-dark hover:border-rose gap-1.5 h-8 px-2.5 text-xs font-medium"
                                                            title="Delete review"
                                                        >
                                                            {deletingReviewId === r.id ? (
                                                                <Loader2 size={13} className="animate-spin" />
                                                            ) : (
                                                                <Trash2 size={13} />
                                                            )}
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* NEWSLETTER TAB CONTENT */}
            {activeTab === 'newsletter' && (
                <div className="space-y-6">
                    {/* Controls Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" size={18} />
                            <Input
                                placeholder="Search by email address..."
                                value={subscriberSearch}
                                onChange={(e) => setSubscriberSearch(e.target.value)}
                                className="pl-9 border-[#E5E7EB]"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <span className="text-xs font-medium text-[#4B5563]">
                                Showing {filteredSubscribers.length} of {subscribers.length} Subscribers
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchSubscribers}
                                disabled={subscribersLoading}
                                className="border-[#E5E7EB] gap-2"
                                title="Refresh subscriber list"
                            >
                                <RefreshCw size={14} className={subscribersLoading ? 'animate-spin' : ''} />
                                Refresh
                            </Button>
                            <Button
                                size="sm"
                                onClick={downloadNewsletterCSV}
                                disabled={subscribers.length === 0}
                                className="bg-rose hover:bg-rose-dark text-white gap-2 font-medium"
                                title="Download subscribers as CSV"
                            >
                                <Download size={14} />
                                Download CSV
                            </Button>
                        </div>
                    </div>

                    {/* Newsletter Subscribers Table */}
                    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-xs">
                        {subscribersLoading && subscribers.length === 0 ? (
                            <div className="py-20 text-center text-[#4B5563] flex flex-col items-center gap-2">
                                <Loader2 size={32} className="animate-spin text-rose" />
                                <span>Loading subscribers...</span>
                            </div>
                        ) : filteredSubscribers.length === 0 ? (
                            <div className="py-16 text-center text-[#4B5563]">
                                <Mail size={40} className="mx-auto mb-2 text-[#9CA3AF] opacity-60" />
                                <p className="font-medium">No subscribers found</p>
                                <p className="text-xs text-[#6B7280] mt-1">
                                    {subscriberSearch ? 'Try a different search term.' : 'Newsletter email subscriptions will appear here.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                            <TableHead className="font-bold text-charcoal w-16 text-center">#</TableHead>
                                            <TableHead className="font-bold text-charcoal">Subscribed Email</TableHead>
                                            <TableHead className="font-bold text-charcoal">Subscribe Date & Time</TableHead>
                                            <TableHead className="font-bold text-charcoal text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredSubscribers.map((s, idx) => {
                                            const dateVal = s.subscribed_at || s.created_at;
                                            const formattedDate = dateVal
                                                ? new Date(dateVal).toLocaleDateString('en-IN', {
                                                      day: 'numeric',
                                                      month: 'short',
                                                      year: 'numeric',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                  })
                                                : '—';

                                            return (
                                                <TableRow key={s.id || s.email} className="border-b border-[#E5E7EB] hover:bg-neutral-50/60 transition-colors">
                                                    <TableCell className="text-center text-xs text-[#6B7280] font-mono">
                                                        {idx + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-rose/10 text-rose flex items-center justify-center flex-shrink-0">
                                                                <Mail size={14} />
                                                            </div>
                                                            <span className="text-sm font-medium text-charcoal">{s.email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-[#4B5563]">{formattedDate}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Subscribed
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* HOME CONTENT TAB CONTENT */}
            {activeTab === 'homeContent' && (
                <HomeContentTab />
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

                            <div className="sm:col-span-2 space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1.5">
                                        Product Images
                                    </label>

                                    {/* Drag & Drop / Click to Browse Box */}
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => !uploadingImage && fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                                            isDraggingOver 
                                                ? 'border-rose bg-rose/5' 
                                                : 'border-[#E5E7EB] hover:border-rose/50 bg-[#F9FAFB]'
                                        } ${uploadingImage ? 'opacity-70 pointer-events-none' : ''}`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleFileInputChange}
                                            className="hidden"
                                        />
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            {uploadingImage ? (
                                                <>
                                                    <Loader2 size={26} className="animate-spin text-rose" />
                                                    <p className="text-sm font-medium text-charcoal">Uploading image to server...</p>
                                                    <p className="text-xs text-[#6B7280]">Please wait a moment</p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-10 h-10 rounded-full bg-rose/10 flex items-center justify-center text-rose">
                                                        <Upload size={20} />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-semibold text-rose hover:underline">
                                                            Click to browse image
                                                        </span>
                                                        <span className="text-sm text-[#4B5563]"> or drag and drop here</span>
                                                    </div>
                                                    <p className="text-xs text-[#6B7280]">
                                                        JPG, PNG, or WebP up to 5MB &bull; Automatically saved to catalog
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Thumbnail Previews List with Remove Button */}
                                {(() => {
                                    const imageList = formData.images
                                        ? formData.images.split(',').map((s) => s.trim()).filter(Boolean)
                                        : [];
                                    if (imageList.length === 0) return null;

                                    return (
                                        <div className="bg-neutral-50 p-3 rounded-lg border border-[#E5E7EB]">
                                            <p className="text-xs font-semibold text-charcoal mb-2">
                                                Images ({imageList.length}) &bull; First image is used as cover
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                                {imageList.map((url, idx) => (
                                                    <div key={idx} className="relative group w-20 h-20 rounded-md border border-[#E5E7EB] overflow-hidden bg-white flex-shrink-0 shadow-xs">
                                                        <img
                                                            src={url}
                                                            alt={`Product thumbnail ${idx + 1}`}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600';
                                                            }}
                                                        />
                                                        {idx === 0 && (
                                                            <span className="absolute bottom-0 inset-x-0 bg-charcoal/85 text-white text-[9px] font-bold uppercase tracking-wider text-center py-0.5 pointer-events-none">
                                                                Cover
                                                            </span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveImage(idx);
                                                            }}
                                                            title="Remove image"
                                                            aria-label="Remove image"
                                                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-charcoal/80 hover:bg-rose text-white flex items-center justify-center transition-colors shadow-xs"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Fallback URL-paste field */}
                                <div>
                                    <label className="block text-xs font-medium text-[#4B5563] mb-1">
                                        Or enter Image URLs manually (comma separated):
                                    </label>
                                    <textarea
                                        name="images"
                                        value={formData.images}
                                        onChange={handleChange}
                                        rows={2}
                                        placeholder="https://example.com/img1.jpg, /images/products/example.jpg"
                                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-rose"
                                    />
                                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                                        Uploaded image paths automatically appear above and below. Both file upload and URL paste work seamlessly together.
                                    </p>
                                </div>
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
