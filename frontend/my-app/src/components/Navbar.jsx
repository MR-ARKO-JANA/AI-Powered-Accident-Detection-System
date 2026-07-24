import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const { connected, notifications, soundEnabled, toggleSound } = useNotifications();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user?.token) return null;

    const unreadCount = notifications.length;

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <span className="navbar-brand-icon">🚨</span>
                <span>APADS</span>
            </div>

            <ul className="navbar-links">
                <li>
                    <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                        📊 Dashboard
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/live-feed" className={({ isActive }) => isActive ? 'active' : ''}>
                        📹 Live Feed
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
                        📋 Reports
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/map" className={({ isActive }) => isActive ? 'active' : ''}>
                        🗺️ Map
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/analytics" className={({ isActive }) => isActive ? 'active' : ''}>
                        📈 Analytics
                    </NavLink>
                </li>
                {isAdmin() && (
                    <li>
                        <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                            ⚙️ Admin
                        </NavLink>
                    </li>
                )}
            </ul>

            <div className="navbar-right">
                <div className="connection-indicator">
                    <span className={`connection-dot ${!connected ? 'connection-dot--offline' : ''}`}></span>
                    <span>{connected ? 'Live' : 'Offline'}</span>
                </div>

                <button
                    className="nav-link"
                    onClick={toggleSound}
                    title={soundEnabled ? 'Mute alerts' : 'Unmute alerts'}
                    style={{ padding: '6px 10px', fontSize: '1rem' }}
                >
                    {soundEnabled ? '🔔' : '🔕'}
                </button>

                {unreadCount > 0 && (
                    <span style={{
                        background: 'var(--color-severe)',
                        color: 'white',
                        borderRadius: 'var(--radius-full)',
                        padding: '2px 8px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        fontFamily: 'var(--font-mono)'
                    }}>
                        {unreadCount}
                    </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {user.name}
                    </span>
                    <span style={{
                        fontSize: '0.65rem',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(37, 99, 235, 0.15)',
                        color: 'var(--color-brand-light)',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                    }}>
                        {user.role?.replace('_', ' ')}
                    </span>
                </div>

                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;