import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import NotificationCenter from "./NotificationCenter";

function Navbar() {
    const location = useLocation();
    const { user, logout } = useContext(AuthContext);
    const [hoveredLink, setHoveredLink] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Filter links based on role
    const navLinks = [
        { path: '/dashboard', label: 'Dashboard', icon: '◈' },
        { path: '/reports', label: 'Reports', icon: '◎' },
        { path: '/analytics', label: 'Analytics', icon: '⬘' },
        // Only show Admin for 'admin' role
        ...(user?.details?.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: '⬡' }] : []),
    ];

    const isActive = (path) => location.pathname === path;

    const userInitial = user?.details?.name ? user.details.name[0].toUpperCase() : 'A';

    // Click away listener to close dropdown when clicking outside
    useEffect(() => {
        if (!isDropdownOpen) return;
        const closeDropdown = () => setIsDropdownOpen(false);
        document.addEventListener('click', closeDropdown);
        return () => document.removeEventListener('click', closeDropdown);
    }, [isDropdownOpen]);

    const handleAvatarClick = (e) => {
        e.stopPropagation();
        setIsDropdownOpen(!isDropdownOpen);
    };

    return (
        <header style={styles.container}>
            {/* Left - Animated Logo */}
            <Link to="/dashboard" style={styles.logoLink}>
                <div style={styles.logoWrapper}>
                    <div style={styles.logoPulse}></div>
                    <span style={styles.logoIcon}>⬢</span>
                    <div style={styles.logoText}>
                        <span style={styles.logoTitle}>APADS</span>
                        <span style={styles.logoSub}>Accident Detection</span>
                    </div>
                </div>
            </Link>

            {/* Middle - Navigation Links (Only shown when user is logged in) */}
            {user && (
                <nav style={styles.nav}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                ...styles.navLink,
                                ...(isActive(link.path) ? styles.navLinkActive : {}),
                                ...(hoveredLink === link.path && !isActive(link.path) ? styles.navLinkHover : {}),
                            }}
                            onMouseEnter={() => setHoveredLink(link.path)}
                            onMouseLeave={() => setHoveredLink(null)}
                        >
                            <span style={styles.navIcon}>{link.icon}</span>
                            {link.label}
                            {isActive(link.path) && <div style={styles.activeIndicator}></div>}
                        </Link>
                    ))}
                </nav>
            )}

            {/* Right - Status & Profile (Only shown when user is logged in) */}
            {user && (
                <div style={styles.rightSection}>
                    {/* System Status Badge */}
                    <div style={styles.statusBadge}>
                        <span style={styles.statusDot}></span>
                        <span style={styles.statusText}>System Active</span>
                    </div>

                    {/* Notification Center */}
                    <NotificationCenter />

                    {/* Profile Avatar and Dropdown Container */}
                    <div style={styles.profileWrapper}>
                        <div
                            style={{
                                ...styles.avatar,
                                ...(hoveredLink === 'profile' ? styles.avatarHover : {}),
                            }}
                            onMouseEnter={() => setHoveredLink('profile')}
                            onMouseLeave={() => setHoveredLink(null)}
                            onClick={handleAvatarClick}
                        >
                            <span style={styles.avatarText}>{userInitial}</span>
                        </div>

                        {isDropdownOpen && (
                            <div style={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                                <div style={styles.dropdownHeader}>
                                    <div style={styles.userName}>{user.details?.name || 'Operator'}</div>
                                    <div style={styles.userEmail}>{user.details?.email || ''}</div>
                                    <div style={styles.userRoleBadge}>{user.details?.role || 'User'}</div>
                                </div>
                                <div style={styles.dropdownDivider}></div>
                                <button
                                    style={{
                                        ...styles.logoutButton,
                                        ...(hoveredLink === 'logout' ? styles.logoutButtonHover : {})
                                    }}
                                    onMouseEnter={() => setHoveredLink('logout')}
                                    onMouseLeave={() => setHoveredLink(null)}
                                    onClick={() => {
                                        logout();
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    <span style={styles.logoutIcon}>⎋</span> Log Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

const styles = {
    container: {
        width: '100%',
        height: 'var(--navbar-height)',
        background: 'rgba(10, 14, 26, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        boxSizing: 'border-box',
        color: 'var(--text-primary)',
        borderBottom: '1px solid var(--border-glass)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        animation: 'fadeIn 0.5s ease',
    },

    logoLink: {
        textDecoration: 'none',
        color: 'inherit',
    },

    logoWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
    },

    logoPulse: {
        position: 'absolute',
        left: '-4px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'rgba(6, 182, 212, 0.1)',
        animation: 'pulseScale 3s ease-in-out infinite',
    },

    logoIcon: {
        fontSize: '28px',
        color: 'var(--accent-cyan)',
        position: 'relative',
        zIndex: 1,
        filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))',
    },

    logoText: {
        display: 'flex',
        flexDirection: 'column',
        lineHeight: 1.1,
    },

    logoTitle: {
        fontSize: '18px',
        fontWeight: 800,
        letterSpacing: '2px',
        background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-emerald))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    },

    logoSub: {
        fontSize: '10px',
        fontWeight: 500,
        color: 'var(--text-muted)',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
    },

    nav: {
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
    },

    navLink: {
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: 500,
        padding: '8px 20px',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        letterSpacing: '0.3px',
    },

    navLinkActive: {
        color: 'var(--accent-cyan)',
        background: 'rgba(6, 182, 212, 0.1)',
    },

    navLinkHover: {
        color: 'var(--text-primary)',
        background: 'rgba(148, 163, 184, 0.08)',
    },

    navIcon: {
        fontSize: '14px',
        opacity: 0.7,
    },

    activeIndicator: {
        position: 'absolute',
        bottom: '-1px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '20px',
        height: '2px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--accent-cyan)',
        boxShadow: '0 0 8px rgba(6, 182, 212, 0.6)',
    },

    rightSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },

    statusBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        borderRadius: 'var(--radius-full)',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
    },

    statusDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'var(--accent-emerald)',
        boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
        animation: 'pulse 2s ease-in-out infinite',
        display: 'inline-block',
    },

    statusText: {
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--accent-emerald)',
        letterSpacing: '0.5px',
    },

    profileWrapper: {
        position: 'relative',
    },

    avatar: {
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: '2px solid transparent',
    },

    avatarHover: {
        transform: 'scale(1.08)',
        boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)',
        border: '2px solid rgba(6, 182, 212, 0.3)',
    },

    avatarText: {
        fontSize: '15px',
        fontWeight: 700,
        color: 'white',
    },

    dropdown: {
        position: 'absolute',
        top: '48px',
        right: 0,
        width: '220px',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        padding: '16px 0 8px 0',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
    },

    dropdownHeader: {
        padding: '0 16px 12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },

    userName: {
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--text-primary)',
    },

    userEmail: {
        fontSize: '12px',
        color: 'var(--text-muted)',
        wordBreak: 'break-all',
    },

    userRoleBadge: {
        alignSelf: 'flex-start',
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--accent-cyan)',
        background: 'rgba(6, 182, 212, 0.1)',
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        marginTop: '6px',
    },

    dropdownDivider: {
        height: '1px',
        background: 'var(--border-glass)',
        margin: '8px 0',
    },

    logoutButton: {
        width: '100%',
        background: 'none',
        border: 'none',
        padding: '10px 16px',
        color: '#f87171',
        fontSize: '14px',
        fontWeight: 500,
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
    },

    logoutButtonHover: {
        background: 'rgba(239, 68, 68, 0.08)',
    },

    logoutIcon: {
        fontSize: '16px',
    },
};

export default Navbar;