import React, { useState, useEffect } from 'react';
import CameraFeed from '../components/CameraFeed';
import AccidentCard from '../components/AccidentCard';
import API from '../services/api';
import io from 'socket.io-client';

const Dashboard = () => {
    const [hoveredStat, setHoveredStat] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [sosAlerts, setSosAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Socket.io Connection
    useEffect(() => {
        const socket = io('http://localhost:5000');

        socket.on('connect', () => {
            console.log("🟢 Connected to APADS Real-time Engine");
        });

        socket.on('accidentDetected', (newAccident) => {
            console.log("🚨 REAL-TIME ALERT RECEIVED:", newAccident);
            setAlerts(prev => [newAccident, ...prev]);
        });

        // Voice SOS real-time listener
        socket.on('sosAlertReceived', (newSOS) => {
            console.log("🆘 VOICE SOS ALERT RECEIVED:", newSOS);
            setSosAlerts(prev => [newSOS, ...prev]);
        });

        socket.on('sosCancelled', ({ id }) => {
            console.log("🚫 SOS CANCELLED:", id);
            setSosAlerts(prev => prev.map(a => a._id === id ? { ...a, cancelled: true } : a));
        });

        return () => socket.disconnect();
    }, []);

    // Initial fetch for historical alerts
    const fetchAlerts = async () => {
        try {
            const response = await API.get('/accidents');
            if (response.data.success) {
                setAlerts(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching alerts:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch SOS history
    const fetchSOSAlerts = async () => {
        try {
            const response = await API.get('/sos');
            if (response.data.success) {
                setSosAlerts(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching SOS alerts:", error);
        }
    };

    useEffect(() => {
        fetchAlerts();
        fetchSOSAlerts();
    }, []);

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
                        <span style={styles.panelBadge}>{alerts[0]?.camId || "CAM-01"}</span>
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
                            {alerts.length} alerts
                        </span>
                    </div>
                    <div style={styles.alertsList}>
                        {/* LIVE STATUS BANNER */}
                        {!isLoading && (
                            <div style={{
                                ...styles.statusBanner,
                                background: alerts.length === 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                                borderColor: alerts.length === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                                color: alerts.length === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                            }}>
                                <div style={{
                                    ...styles.statusDot,
                                    background: alerts.length === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                                    boxShadow: alerts.length === 0 ? '0 0 10px var(--accent-emerald-glow)' : '0 0 10px var(--accent-rose-glow)',
                                }}></div>
                                {alerts.length === 0 ? 'NORMAL' : 'ACCIDENT'}
                            </div>
                        )}

                        {isLoading ? (
                            <p style={styles.emptyText}>Loading alerts...</p>
                        ) : alerts.length > 0 ? (
                            alerts.map((alert, index) => (
                                <AccidentCard
                                    key={alert._id || alert.id}
                                    data={alert}
                                    index={index}
                                />
                            ))
                        ) : (
                            <p style={styles.emptyText}>No accidents detected.</p>
                        )}
                    </div>
                </div>

            </div>

            {/* ── Voice SOS Alerts Panel ────────────────────────────── */}
            {sosAlerts.length > 0 && (
                <div style={{ ...styles.panel, marginTop: '24px', opacity: 1, animationDelay: '0.3s' }}>
                    <div style={styles.panelHeader}>
                        <div style={styles.panelTitleGroup}>
                            <div style={{
                                ...styles.panelAccent,
                                background: '#f97316',
                                boxShadow: '0 0 8px rgba(249, 115, 22, 0.4)',
                            }}></div>
                            <h2 style={styles.panelTitle}>🆘 Voice SOS Alerts</h2>
                        </div>
                        <span style={{
                            ...styles.panelBadge,
                            background: 'rgba(249, 115, 22, 0.1)',
                            color: '#f97316',
                            border: '1px solid rgba(249, 115, 22, 0.2)',
                        }}>
                            {sosAlerts.filter(a => !a.cancelled).length} active
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                        {sosAlerts.map((sos, index) => {
                            const domainColors = {
                                Medical: { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.25)', text: '#ef4444', icon: '🚑' },
                                Fire:    { bg: 'rgba(249, 115, 22, 0.08)', border: 'rgba(249, 115, 22, 0.25)', text: '#f97316', icon: '🔥' },
                                Police:  { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.25)', text: '#3b82f6', icon: '🚔' },
                            };
                            const dc = domainColors[sos.domain] || domainColors.Medical;
                            return (
                                <div key={sos._id || index} style={{
                                    background: sos.cancelled ? 'rgba(107, 114, 128, 0.05)' : dc.bg,
                                    border: `1px solid ${sos.cancelled ? 'rgba(107, 114, 128, 0.2)' : dc.border}`,
                                    borderRadius: 'var(--radius-md)',
                                    padding: '16px',
                                    opacity: sos.cancelled ? 0.5 : 1,
                                    transition: 'all 0.3s ease',
                                    animation: 'fadeInUp 0.4s ease forwards',
                                    animationDelay: `${index * 0.05}s`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '20px' }}>{dc.icon}</span>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            {sos.cancelled && (
                                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', background: 'rgba(107, 114, 128, 0.15)', padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px' }}>CANCELLED</span>
                                            )}
                                            <span style={{
                                                fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
                                                color: sos.severity === 'Critical' ? '#ef4444' : sos.severity === 'High' ? '#f59e0b' : '#6b7280',
                                                background: sos.severity === 'Critical' ? 'rgba(239, 68, 68, 0.12)' : sos.severity === 'High' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(107, 114, 128, 0.12)',
                                                padding: '2px 8px', borderRadius: '20px',
                                            }}>{sos.severity}</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: sos.cancelled ? '#6b7280' : dc.text, marginBottom: '4px' }}>
                                        {sos.domain} Emergency
                                    </div>
                                    {sos.transcript && (
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '8px', lineHeight: 1.4 }}>
                                            "{sos.transcript}"
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>
                                        <span>Confidence: {(sos.confidence * 100).toFixed(0)}%</span>
                                        <span>{new Date(sos.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                    {sos.coordinates && sos.coordinates.lat !== 0 && (
                                        <a
                                            href={`https://www.google.com/maps?q=${sos.coordinates.lat},${sos.coordinates.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ fontSize: '10px', color: dc.text, marginTop: '6px', display: 'inline-block', textDecoration: 'none', fontWeight: 600 }}
                                        >
                                            📍 View Location
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
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

    statusBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid',
        fontSize: '14px',
        fontWeight: 700,
        letterSpacing: '1px',
        marginBottom: '16px',
        animation: 'fadeIn 0.5s ease',
    },

    statusDot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        animation: 'pulse 2s infinite',
    },
};

export default Dashboard;