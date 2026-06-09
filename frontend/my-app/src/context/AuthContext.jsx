import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is already logged in when the app loads
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setUser({ isAuthenticated: true, token, details: JSON.parse(userData) });
        }
        setLoading(false);
    }, []);

    // REAL Login Function
    const login = async (email, password) => {
        try {
            const response = await API.post('/auth/login', { email, password });
            const { token, name, _id, role } = response.data;

            // Save to local storage so they stay logged in after refreshing
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ name, _id, email, role }));

            setUser({ isAuthenticated: true, token, details: { name, _id, email, role } });
            return { success: true };
        } catch (error) {
            console.error("Login failed:", error.response?.data?.message || error.message);
            return { success: false, message: error.response?.data?.message || "Login failed" };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};