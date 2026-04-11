import React, { useState } from 'react';

const AccidentCard = ({ data, index = 0 }) => {
    const [isHovered, setIsHovered] = useState(false);

    const isHighSeverity = data.severity === 'High';

    const accentColor = isHighSeverity ? 'var(--accent-rose)' : 'var(--accent-amber)';
    const glowColor = isHighSeverity ? 'var(--accent-rose-glow)' : 'var(--accent-amber-glow)';
    const bgAccent = isHighSeverity
        ? 'rgba(244, 63, 94, 0.06)'
        : 'rgba(245, 158, 11, 0.06)';

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

                    {/* Severity Badge */}
                    <div style={{
                        ...styles.badge,
                        background: bgAccent,
                        color: accentColor,
                        border: `1px solid ${isHovered ? accentColor : 'transparent'}`,
                        animation: isHighSeverity ? 'pulse 2s ease-in-out infinite' : 'none',
                    }}>
                        {isHighSeverity ? 'CRITICAL' : 'MINOR'}
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
                        <span style={styles.detailIcon}>◷</span>
                        <span style={styles.detailLabel}>Time</span>
                        <span style={styles.detailValue}>{data.time}</span>
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

    badge: {
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '1px',
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        transition: 'all 0.3s ease',
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