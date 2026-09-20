import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('jaridar_token'));

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const formatUserData = (data) => {
        if (!data) return null;
        const isAdmin = Boolean(data.isAdmin || data.is_admin);
        return {
            ...data,
            is_admin: isAdmin,
            isAdmin: isAdmin
        };
    };

    const fetchUser = async () => {
        try {
            const response = await axios.get(`${API}/auth/me`);
            setUser(formatUserData(response.data));
        } catch (error) {
            console.error('Failed to fetch user:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await axios.post(`${API}/auth/login`, { email, password });
        const { token: newToken, user: userData } = response.data;
        const formattedUser = formatUserData(userData);
        localStorage.setItem('jaridar_token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);
        setUser(formattedUser);
        return formattedUser;
    };

    const register = async (name, email, password, phone) => {
        const response = await axios.post(`${API}/auth/register`, { name, email, password, phone });
        const { token: newToken, user: userData } = response.data;
        const formattedUser = formatUserData(userData);
        localStorage.setItem('jaridar_token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);
        setUser(formattedUser);
        return formattedUser;
    };

    const logout = () => {
        localStorage.removeItem('jaridar_token');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
    };

    const updateProfile = async (data) => {
        const response = await axios.put(`${API}/auth/profile`, data);
        const formattedUser = formatUserData(response.data);
        setUser(formattedUser);
        return formattedUser;
    };

    const isAdmin = Boolean(user?.isAdmin || user?.is_admin);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, isAuthenticated: !!user, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
