import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // State to hold the user's login status
    const [user, setUser] = useState(null);

    // Function to log the user in
    const login = (token) => {
        setUser({ isAuthenticated: true, token });
    };

    //Function to log the use out  
    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}