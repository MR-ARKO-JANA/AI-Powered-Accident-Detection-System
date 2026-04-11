import React, { useState } from 'react';
import CameraFeed from '../components/CameraFeed';
import AccidentCard from '../components/AccidentCard';

const Dashboard = () => {
    const [hoveredStat, setHoveredStat] = useState(null);

    // Mock data representing what the Node.js backend will send
    const mockAlerts = [
        { id: 1, location: "Main Street Intersection", severity: "High", time: "10:45 AM" },
        { id: 2, location: "Highway 42, Mile 8", severity: "Low", time: "09:12 AM" },
        { id: 3, location: "Park Avenue Bridge", severity: "High", time: "08:30 AM" },
    ];

    // Stats data
    const stats = [
        {
            id: 'alerts',
            label: 'Total Alerts',
            value: '24',
            trend: '+3 today',
            icon: '⚡',
            color: 'var(--accent-rose)',
            glow: 'var(--accent-rose-glow)',
            bgAccent: 'rgba(244, 63, 94, 0.08)',
        },
        {
            id: 'cameras',
            label: 'Active Cameras',
            value: '12',
            trend: 'All online',
            icon: '◎',
            color: 'var(--accent-cyan)',
            glow: 'var(--accent-cyan-glow)',
            bgAccent: 'rgba(6, 182, 212, 0.08)',
        },
        {
            id: 'status',
            label: 'System Status',
            value: '99.8%',
            trend: 'Uptime',
            icon: '⬢',
            color: 'var(--accent-emerald)',
            glow: 'var(--accent-emerald-glow)',
            bgAccent: 'rgba(16, 185, 129, 0.08)',
        },
        {
            id: 'response',
            label: 'Avg Response',
            value: '2.4s',
            trend: '-0.3s faster',
            icon: '◈',
            color: 'var(--accent-violet)',
            glow: 'var(--accent-violet-glow)',
            bgAccent: 'rgba(139, 92, 246, 0.08)',
        },
    ];

    return (
        <div style={styles.page}>
            {/* Page Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Command Center</h1>
                    <p style={styles.subtitle}>Real-time surveillance and incident management</p>
                </div>
                <div style={styles.headerBadge}>
                    <span style={styles.liveDot}></span>
                    LIVE MONITORING
                </div>
            </div>

            {/* Stats Row */}
            <div style={styles.statsGrid}>
                {stats.map((stat, i) => (
                    <div
                        key={stat.id}
                        style={{
                            ...styles.statCard,
                            animationDelay: `${i * 0.1}s`,
                            borderColor: hoveredStat === stat.id ? stat.color : 'var(--border-glass)',
                            boxShadow: hoveredStat === stat.id
                                ? `0 0 24px ${stat.glow}, var(--shadow-md)`
                                : 'var(--shadow-sm)',
                        }}
                        onMouseEnter={() => setHoveredStat(stat.id)}
                        onMouseLeave={() => setHoveredStat(null)}
                    >
                        <div style={{
                            ...styles.statIcon,
                            background: stat.bgAccent,
                            color: stat.color,
                        }}>
                            {stat.icon}
                        </div>
                        <div style={styles.statContent}>
                            <span style={styles.statLabel}>{stat.label}</span>
                            <span style={{ ...styles.statValue, color: stat.color }}>{stat.value}</span>
                            <span style={styles.statTrend}>{stat.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Grid: Camera + Alerts */}
            <div style={styles.mainGrid}>

                {/* Left — Surveillance Panel */}
                <div style={styles.panel}>
                    <div style={styles.panelHeader}>
                        <div style={styles.panelTitleGroup}>
                            <div style={styles.panelAccent}></div>
                            <h2 style={styles.panelTitle}>Live Surveillance</h2>
                        </div>
                        <span style={styles.panelBadge}>CAM-01</span>
                    </div>
                    <CameraFeed />
                </div>

                {/* Right — Alerts Panel */}
                <div style={styles.panel}>
                    <div style={styles.panelHeader}>
                        <div style={styles.panelTitleGroup}>
                            <div style={{
                                ...styles.panelAccent,
                                background: 'var(--accent-rose)',
                                boxShadow: '0 0 8px var(--accent-rose-glow)',
                            }}></div>
                            <h2 style={styles.panelTitle}>Recent Detections</h2>
                        </div>
                        <span style={{
                            ...styles.panelBadge,
                            background: 'rgba(244, 63, 94, 0.1)',
                            color: 'var(--accent-rose)',
                            border: '1px solid rgba(244, 63, 94, 0.2)',
                        }}>
                            {mockAlerts.length} alerts
                        </span>
                    </div>
                    <div style={styles.alertsList}>
                        {mockAlerts.map((alert, index) => (
                            <AccidentCard
                                key={alert.id}
                                data={alert}
                                index={index}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

const styles = {
    page: {
        padding: '28px 36px',
        maxWidth: '1400px',
        margin: '0 auto',
        animation: 'fadeIn 0.4s ease',
    },

    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '28px',
        animation: 'fadeInUp 0.5s ease',
    },

    title: {
        fontSize: '28px',
        fontWeight: 800,
        color: 'var(--text-primary)',
        letterSpacing: '-0.5px',
        margin: 0,
        lineHeight: 1.2,
    },

    subtitle: {
        fontSize: '14px',
        color: 'var(--text-muted)',
        fontWeight: 400,
        marginTop: '6px',
    },

    headerBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '1.5px',
        color: 'var(--accent-rose)',
        background: 'rgba(244, 63, 94, 0.08)',
        border: '1px solid rgba(244, 63, 94, 0.2)',
        padding: '8px 16px',
        borderRadius: 'var(--radius-full)',
    },

    liveDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'var(--accent-rose)',
        animation: 'pulse 1.5s ease-in-out infinite',
        boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)',
        display: 'inline-block',
    },

    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '28px',
    },

    statCard: {
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
        animation: 'fadeInUp 0.5s ease forwards',
        opacity: 0,
        animationFillMode: 'forwards',
    },

    statIcon: {
        width: '48px',
        height: '48px',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        flexShrink: 0,
    },

    statContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },

    statLabel: {
        fontSize: '12px',
        color: 'var(--text-muted)',
        fontWeight: 500,
        letterSpacing: '0.3px',
    },

    statValue: {
        fontSize: '24px',
        fontWeight: 800,
        letterSpacing: '-0.5px',
        lineHeight: 1.1,
    },

    statTrend: {
        fontSize: '11px',
        color: 'var(--text-muted)',
        fontWeight: 500,
    },

    mainGrid: {
        display: 'grid',
        gridTemplateColumns: '1.8fr 1fr',
        gap: '24px',
    },

    panel: {
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        animation: 'fadeInUp 0.6s ease forwards',
        opacity: 0,
        animationDelay: '0.2s',
        animationFillMode: 'forwards',
    },

    panelHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '18px',
    },

    panelTitleGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },

    panelAccent: {
        width: '3px',
        height: '18px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--accent-cyan)',
        boxShadow: '0 0 8px var(--accent-cyan-glow)',
    },

    panelTitle: {
        fontSize: '16px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        margin: 0,
        letterSpacing: '0.3px',
    },

    panelBadge: {
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.5px',
        padding: '5px 12px',
        borderRadius: 'var(--radius-full)',
        background: 'rgba(6, 182, 212, 0.1)',
        color: 'var(--accent-cyan)',
        border: '1px solid rgba(6, 182, 212, 0.2)',
    },

    alertsList: {
        maxHeight: '380px',
        overflowY: 'auto',
        paddingRight: '4px',
    },
};

export default Dashboard;