import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(false);

    // Sync to localStorage
    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }, [user]);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const res = await authAPI.login({ email, password });
            const userData = res.data.data;
            setUser(userData);
            return { success: true, data: userData };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const isAdmin = () => {
        return user?.role === 'super_admin' || user?.role === 'zone_admin';
    };

    const isSuperAdmin = () => {
        return user?.role === 'super_admin';
    };

    const hasRole = (...roles) => {
        return user && roles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{
            user, setUser, login, logout, loading,
            isAdmin, isSuperAdmin, hasRole,
            isAuthenticated: !!user?.token
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export default AuthContext;