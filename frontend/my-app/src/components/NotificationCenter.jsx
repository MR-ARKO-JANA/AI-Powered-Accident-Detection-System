import React, { useState, useEffect, useRef, useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';

function NotificationCenter() {
    const { notifications, unreadCount, markAllAsRead, clearNotifications } = useContext(NotificationContext);
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredLink, setHoveredLink] = useState(null);
    const containerRef = useRef(null);

    // Toggle dropdown
    const handleToggle = (e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    // Click away listener to close dropdown
    useEffect(() => {
        if (!isOpen) return;
        const closeDropdown = () => setIsOpen(false);
        document.addEventListener('click', closeDropdown);
        return () => document.removeEventListener('click', closeDropdown);
    }, [isOpen]);

    // Format time/date nicely
    const formatTime = (date) => {
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    // Get color theme based on notification type / domain
    const getAlertStyle = (notif) => {
        if (notif.type === 'sos') {
            const domain = notif.data?.domain;
            if (domain === 'Medical') return { color: '#ef4444', icon: '🚑', bg: 'rgba(239, 68, 68, 0.1)' };
            if (domain === 'Fire') return { color: '#f97316', icon: '🔥', bg: 'rgba(249, 115, 22, 0.1)' };
            return { color: '#3b82f6', icon: '🚔', bg: 'rgba(59, 130, 246, 0.1)' };
        }
        // AI accident
        return { color: '#ec4899', icon: '🚨', bg: 'rgba(236, 72, 153, 0.1)' };
    };

    return (
        <div style={styles.container} ref={containerRef}>
            {/* Bell Icon & Badge */}
            <button
                style={{
                    ...styles.bellButton,
                    ...(hoveredLink === 'bell' ? styles.bellButtonHover : {})
                }}
                onMouseEnter={() => setHoveredLink('bell')}
                onMouseLeave={() => setHoveredLink(null)}
                onClick={handleToggle}
            >
                <span style={styles.bellIcon}>🔔</span>
                {unreadCount > 0 && (
                    <span style={styles.badge}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div style={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                    <div style={styles.header}>
                        <span style={styles.headerTitle}>Notifications</span>
                        <div style={styles.headerActions}>
                            {unreadCount > 0 && (
                                <button style={styles.actionButton} onClick={markAllAsRead}>
                                    Mark read
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button style={{ ...styles.actionButton, color: '#f87171' }} onClick={clearNotifications}>
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={styles.divider}></div>

                    {/* Scrollable list */}
                    <div style={styles.list}>
                        {notifications.length === 0 ? (
                            <div style={styles.emptyState}>
                                <div style={styles.emptyIcon}>🎉</div>
                                <div style={styles.emptyText}>All clear! No alerts.</div>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const style = getAlertStyle(notif);
                                return (
                                    <div
                                        key={notif.id}
                                        style={{
                                            ...styles.item,
                                            ...(notif.unread ? styles.itemUnread : {})
                                        }}
                                    >
                                        <div style={{ ...styles.itemIconWrapper, backgroundColor: style.bg }}>
                                            <span style={{ fontSize: '16px' }}>{style.icon}</span>
                                        </div>
                                        <div style={styles.itemContent}>
                                            <div style={styles.itemTitleRow}>
                                                <span style={{ ...styles.itemTitle, color: style.color }}>
                                                    {notif.title}
                                                </span>
                                                <span style={styles.itemTime}>{formatTime(notif.time)}</span>
                                            </div>
                                            <div style={styles.itemMessage}>{notif.message}</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        position: 'relative',
        display: 'inline-block',
    },
    bellButton: {
        background: 'rgba(30, 41, 59, 0.4)',
        border: '1px solid var(--border-glass)',
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s ease',
        outline: 'none',
    },
    bellButtonHover: {
        background: 'rgba(30, 41, 59, 0.8)',
        borderColor: 'var(--accent-cyan)',
        boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)',
    },
    bellIcon: {
        fontSize: '18px',
        color: 'var(--text-secondary)',
    },
    badge: {
        position: 'absolute',
        top: '-4px',
        right: '-4px',
        background: '#ef4444',
        color: 'white',
        fontSize: '10px',
        fontWeight: 700,
        borderRadius: '50%',
        width: '18px',
        height: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid var(--bg-primary)',
        boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
    },
    dropdown: {
        position: 'absolute',
        top: '48px',
        right: 0,
        width: '320px',
        maxHeight: '450px',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        zIndex: 1002,
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease',
    },
    header: {
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: '15px',
        fontWeight: 700,
        color: 'var(--text-primary)',
    },
    headerActions: {
        display: 'flex',
        gap: '12px',
    },
    actionButton: {
        background: 'none',
        border: 'none',
        color: 'var(--accent-cyan)',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        padding: 0,
        transition: 'opacity 0.2s',
    },
    divider: {
        height: '1px',
        background: 'var(--border-glass)',
    },
    list: {
        overflowY: 'auto',
        flex: 1,
        padding: '8px 0',
        maxHeight: '380px',
    },
    emptyState: {
        padding: '32px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    },
    emptyIcon: {
        fontSize: '32px',
    },
    emptyText: {
        fontSize: '13px',
        color: 'var(--text-muted)',
        fontWeight: 500,
    },
    item: {
        padding: '12px 16px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        transition: 'background-color 0.2s',
        borderBottom: '1px solid rgba(148, 163, 184, 0.03)',
    },
    itemUnread: {
        background: 'rgba(6, 182, 212, 0.03)',
    },
    itemIconWrapper: {
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    itemContent: {
        flex: 1,
        minWidth: 0,
    },
    itemTitleRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2px',
    },
    itemTitle: {
        fontSize: '13px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    itemTime: {
        fontSize: '11px',
        color: 'var(--text-muted)',
    },
    itemMessage: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        lineHeight: 1.4,
        wordBreak: 'break-word',
    },
};

export default NotificationCenter;
