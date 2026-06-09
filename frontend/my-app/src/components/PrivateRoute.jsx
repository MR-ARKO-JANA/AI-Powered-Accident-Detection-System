import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useContext(AuthContext);

    // Show a loading indicator during the initial authentication check
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{
                    border: '4px solid #334155',
                    borderTop: '4px solid #ef4444',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user || !user.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Redirect to dashboard if trying to access admin page but role is not admin
    if (adminOnly && user.details?.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default PrivateRoute;
