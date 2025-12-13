import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CartProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [cart, setCart] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchCart();
        } else {
            setCart({ items: [], total: 0 });
        }
    }, [isAuthenticated]);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API}/cart`);
            setCart(response.data);
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (productId, quantity, size, color) => {
        try {
            await axios.post(`${API}/cart`, { product_id: productId, quantity, size, color });
            await fetchCart();
            return true;
        } catch (error) {
            console.error('Failed to add to cart:', error);
            throw error;
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        try {
            await axios.put(`${API}/cart/${itemId}?quantity=${quantity}`);
            await fetchCart();
        } catch (error) {
            console.error('Failed to update quantity:', error);
        }
    };

    const removeFromCart = async (itemId) => {
        try {
            await axios.delete(`${API}/cart/${itemId}`);
            await fetchCart();
        } catch (error) {
            console.error('Failed to remove from cart:', error);
        }
    };

    const clearCart = async () => {
        try {
            await axios.delete(`${API}/cart`);
            setCart({ items: [], total: 0 });
        } catch (error) {
            console.error('Failed to clear cart:', error);
        }
    };

    const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeFromCart, clearCart, cartCount, fetchCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};
