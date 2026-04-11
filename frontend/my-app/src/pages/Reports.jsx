import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Reports = () => {
    const [hoveredStat, setHoveredStat] = useState(null);

    // Center map on Kolkata
    const mapCenter = [22.5726, 88.3639];

    // Dummy data for accidents
    const [accidents] = useState([
        { id: 1, position: [22.5726, 88.3639], severity: 'High', location: 'Esplanade Crossing', time: '10:45 AM' },
        { id: 2, position: [22.5830, 88.4150], severity: 'Low', location: 'Salt Lake Sector V', time: '09:12 AM' },
    ]);

    const incidentStats = [
        {
            id: 'total',
            label: 'Total Incidents',
            value: accidents.length,
            icon: '◎',
            color: 'var(--accent-cyan)',
            bgAccent: 'rgba(6, 182, 212, 0.08)',
        },
        {
            id: 'high',
            label: 'High Severity',
            value: accidents.filter(a => a.severity === 'High').length,
            icon: '⚠',
            color: 'var(--accent-rose)',
            bgAccent: 'rgba(244, 63, 94, 0.08)',
        },
        {
            id: 'low',
            label: 'Low Severity',
            value: accidents.filter(a => a.severity === 'Low').length,
            icon: '◈',
            color: 'var(--accent-amber)',
            bgAccent: 'rgba(245, 158, 11, 0.08)',
        },
    ];

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Incident Mapping</h1>
                    <p style={styles.subtitle}>Geographic visualization of detected accidents</p>
                </div>
            </div>

            {/* Stats Row */}
            <div style={styles.statsRow}>
                {incidentStats.map((stat) => (
                    <div
                        key={stat.id}
                        style={{
                            ...styles.statCard,
                            borderColor: hoveredStat === stat.id ? stat.color : 'var(--border-glass)',
                        }}
                        onMouseEnter={() => setHoveredStat(stat.id)}
                        onMouseLeave={() => setHoveredStat(null)}
                    >
                        <span style={{
                            ...styles.statIcon,
                            background: stat.bgAccent,
                            color: stat.color,
                        }}>
                            {stat.icon}
                        </span>
                        <div style={styles.statContent}>
                            <span style={styles.statLabel}>{stat.label}</span>
                            <span style={{ ...styles.statValue, color: stat.color }}>{stat.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Map Panel */}
            <div style={styles.mapPanel}>
                <div style={styles.mapPanelHeader}>
                    <div style={styles.panelTitleGroup}>
                        <div style={styles.panelAccent}></div>
                        <h2 style={styles.panelTitle}>Live Incident Map</h2>
                    </div>
                    <div style={styles.mapLegend}>
                        <div style={styles.legendItem}>
                            <span style={{ ...styles.legendDot, background: 'var(--accent-rose)' }}></span>
                            <span style={styles.legendText}>High</span>
                        </div>
                        <div style={styles.legendItem}>
                            <span style={{ ...styles.legendDot, background: 'var(--accent-amber)' }}></span>
                            <span style={styles.legendText}>Low</span>
                        </div>
                    </div>
                </div>

                <div style={styles.mapContainer}>
                    <MapContainer
                        center={mapCenter}
                        zoom={12}
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-md)' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />

                        {accidents.map((accident) => (
                            <Marker key={accident.id} position={accident.position}>
                                <Popup>
                                    <div style={{ fontFamily: "'Inter', sans-serif", padding: '4px' }}>
                                        <strong style={{ color: accident.severity === 'High' ? '#ef4444' : '#f59e0b' }}>
                                            {accident.severity} Severity
                                        </strong>
                                        <br />
                                        <span style={{ fontSize: '13px', color: '#374151' }}>
                                            📍 {accident.location}
                                        </span>
                                        <br />
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                            🕐 {accident.time}
                                        </span>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
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

    statsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px',
    },

    statCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-md)',
        padding: '18px 20px',
        transition: 'all 0.3s ease',
        animation: 'fadeInUp 0.5s ease',
    },

    statIcon: {
        width: '42px',
        height: '42px',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
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
    },

    statValue: {
        fontSize: '22px',
        fontWeight: 800,
        letterSpacing: '-0.5px',
    },

    mapPanel: {
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        animation: 'fadeInUp 0.6s ease',
    },

    mapPanelHeader: {
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
    },

    mapLegend: {
        display: 'flex',
        gap: '16px',
    },

    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },

    legendDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        display: 'inline-block',
    },

    legendText: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        fontWeight: 500,
    },

    mapContainer: {
        height: '550px',
        width: '100%',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-glow-cyan)',
    },
};

export default Reports;