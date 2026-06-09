import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const AccidentCard = ({ data, index = 0 }) => {
    const { user } = useContext(AuthContext);
    const [isHovered, setIsHovered] = useState(false);
    const [status, setStatus] = useState(data.status || 'detected');
    const [isUpdating, setIsUpdating] = useState(false);

    // Keep status state synced with socket updates from parent
    useEffect(() => {
        setStatus(data.status || 'detected');
    }, [data.status]);

    const isHighSeverity = data.severity === 'High' || data.severity === 'Critical';

    const accentColor = isHighSeverity ? 'var(--accent-rose)' : 'var(--accent-amber)';
    const glowColor = isHighSeverity ? 'var(--accent-rose-glow)' : 'var(--accent-amber-glow)';
    const bgAccent = isHighSeverity
        ? 'rgba(244, 63, 94, 0.06)'
        : 'rgba(245, 158, 11, 0.06)';

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        try {
            setIsUpdating(true);
            const res = await API.patch(`/accidents/${data._id || data.id}/status`, { status: newStatus });
            if (res.data?.success) {
                setStatus(newStatus);
            }
        } catch (err) {
            console.error("Failed to update status:", err);
            alert("Error updating status: " + (err.response?.data?.message || err.message));
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusColor = (s) => {
        if (s === 'resolved') return '#10b981'; // Emerald
        if (s === 'responding') return '#3b82f6'; // Blue
        if (s === 'acknowledged') return '#f59e0b'; // Amber
        return '#f43f5e'; // Rose/Red (detected)
    };

    const getStatusBg = (s) => {
        if (s === 'resolved') return 'rgba(16, 185, 129, 0.12)';
        if (s === 'responding') return 'rgba(59, 130, 246, 0.12)';
        if (s === 'acknowledged') return 'rgba(245, 158, 11, 0.12)';
        return 'rgba(244, 63, 94, 0.12)';
    };

    return (
        <div
            style={{
                ...styles.card,
                background: isHovered ? 'var(--bg-glass-hover)' : 'var(--bg-glass)',
                borderColor: isHovered ? accentColor : 'var(--border-glass)',
                boxShadow: isHovered
                    ? (isHighSeverity ? 'var(--shadow-glow-rose)' : 'var(--shadow-glow-amber)')
                    : 'var(--shadow-sm)',
                animationDelay: `${index * 0.1}s`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Left accent stripe */}
            <div style={{
                ...styles.accentStripe,
                background: `linear-gradient(180deg, ${accentColor}, transparent)`,
            }}></div>

            {/* Card Content */}
            <div style={styles.content}>
                {/* Header Row */}
                <div style={styles.headerRow}>
                    <div style={styles.iconWrapper}>
                        <span style={{
                            ...styles.severityIcon,
                            background: bgAccent,
                            color: accentColor,
                            boxShadow: isHighSeverity ? `0 0 12px ${glowColor}` : 'none',
                        }}>
                            {isHighSeverity ? '⚠' : '◈'}
                        </span>
                    </div>

                    <div style={styles.headerText}>
                        <span style={{
                            ...styles.severityLabel,
                            color: accentColor,
                        }}>
                            {data.severity} Severity
                        </span>
                        <span style={styles.alertType}>Collision Detected</span>
                    </div>

                    {/* Status Badge / Selector */}
                    <div style={styles.badgeWrapper}>
                        {user?.isAuthenticated ? (
                            <select
                                value={status}
                                onChange={handleStatusChange}
                                disabled={isUpdating}
                                style={{
                                    ...styles.statusSelect,
                                    color: getStatusColor(status),
                                    backgroundColor: getStatusBg(status),
                                    border: `1px solid ${getStatusColor(status)}`
                                }}
                            >
                                <option value="detected">Detected</option>
                                <option value="acknowledged">Acknowledged</option>
                                <option value="responding">Responding</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        ) : (
                            <div style={{
                                ...styles.statusBadge,
                                color: getStatusColor(status),
                                backgroundColor: getStatusBg(status),
                                border: `1px solid ${getStatusColor(status)}`
                            }}>
                                {status}
                            </div>
                        )}
                    </div>
                </div>

                {/* Details */}
                <div style={styles.details}>
                    <div style={styles.detailItem}>
                        <span style={styles.detailIcon}>◎</span>
                        <span style={styles.detailLabel}>Location</span>
                        <span style={styles.detailValue}>{data.location}</span>
                    </div>
                    <div style={styles.detailItem}>
                        <span style={styles.detailIcon}>▣</span>
                        <span style={styles.detailLabel}>Cam ID</span>
                        <span style={styles.detailValue}>{data.camId || "CAM-01"}</span>
                    </div>
                    <div style={styles.detailItem}>
                        <span style={styles.detailIcon}>◷</span>
                        <span style={styles.detailLabel}>Time</span>
                        <span style={styles.detailValue}>{data.time ? new Date(data.time).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</span>
                    </div>
                    <div style={styles.detailItem}>
                        <span style={styles.detailIcon}>🆔</span>
                        <span style={styles.detailLabel}>Plate</span>
                        <span style={{...styles.detailValue, color: 'var(--accent-cyan)', fontWeight: 700}}>{data.licensePlate || "Unknown"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    card: {
        display: 'flex',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-glass)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
        animation: 'fadeInUp 0.5s ease forwards',
        opacity: 0,
        animationFillMode: 'forwards',
        marginBottom: '12px',
    },

    accentStripe: {
        width: '3px',
        flexShrink: 0,
    },

    content: {
        flex: 1,
        padding: '16px 18px',
    },

    headerRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '14px',
    },

    iconWrapper: {},

    severityIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '16px',
        fontWeight: 'bold',
    },

    headerText: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },

    severityLabel: {
        fontSize: '14px',
        fontWeight: 700,
        letterSpacing: '0.3px',
    },

    alertType: {
        fontSize: '12px',
        color: 'var(--text-muted)',
        fontWeight: 500,
    },

    badgeWrapper: {
        display: 'flex',
        alignItems: 'center',
    },

    statusSelect: {
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.5px',
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        outline: 'none',
        cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
        transition: 'all 0.2s',
    },

    statusBadge: {
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.5px',
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        textTransform: 'uppercase',
    },

    details: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },

    detailItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
    },

    detailIcon: {
        color: 'var(--text-muted)',
        fontSize: '12px',
        width: '16px',
        textAlign: 'center',
    },

    detailLabel: {
        color: 'var(--text-muted)',
        fontWeight: 500,
        minWidth: '60px',
    },

    detailValue: {
        color: 'var(--text-secondary)',
        fontWeight: 500,
    },
};

export default AccidentCard;