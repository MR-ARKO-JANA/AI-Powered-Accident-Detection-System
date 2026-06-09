import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import API from '../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Reports = () => {
    const [hoveredStat, setHoveredStat] = useState(null);
    const [accidents, setAccidents] = useState([]);
    const [sosAlerts, setSosAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Center map on Kolkata (default)
    const mapCenter = [22.5726, 88.3639];

    // Fetch real accident data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accRes, sosRes] = await Promise.all([
                    API.get('/accidents?limit=100'),
                    API.get('/sos?limit=100')
                ]);
                if (accRes.data.success) {
                    setAccidents(accRes.data.data);
                }
                if (sosRes.data.success) {
                    setSosAlerts(sosRes.data.data.filter(s => !s.cancelled));
                }
            } catch (error) {
                console.error("Error fetching map data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const incidentStats = [
        {
            id: 'total',
            label: 'Total Incidents',
            value: accidents.length + sosAlerts.length,
            icon: '◎',
            color: 'var(--accent-cyan)',
            bgAccent: 'rgba(6, 182, 212, 0.08)',
        },
        {
            id: 'high',
            label: 'Critical / High',
            value: accidents.filter(a => a.severity === 'Critical' || a.severity === 'High').length,
            icon: '⚠',
            color: 'var(--accent-rose)',
            bgAccent: 'rgba(244, 63, 94, 0.08)',
        },
        {
            id: 'sos',
            label: 'Voice SOS',
            value: sosAlerts.length,
            icon: '◈',
            color: 'var(--accent-amber)',
            bgAccent: 'rgba(245, 158, 11, 0.08)',
        },
    ];

    const severityColor = (severity) => {
        switch (severity) {
            case 'Critical': return '#ef4444';
            case 'High': return '#f97316';
            case 'Medium': return '#f59e0b';
            case 'Low': return '#10b981';
            default: return '#6b7280';
        }
    };

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Incident Mapping</h1>
                    <p style={styles.subtitle}>Geographic visualization of detected accidents & SOS alerts</p>
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
                            <span style={{ ...styles.legendDot, background: '#ef4444' }}></span>
                            <span style={styles.legendText}>Critical</span>
                        </div>
                        <div style={styles.legendItem}>
                            <span style={{ ...styles.legendDot, background: '#f97316' }}></span>
                            <span style={styles.legendText}>High</span>
                        </div>
                        <div style={styles.legendItem}>
                            <span style={{ ...styles.legendDot, background: '#f59e0b' }}></span>
                            <span style={styles.legendText}>Medium/Low</span>
                        </div>
                        <div style={styles.legendItem}>
                            <span style={{ ...styles.legendDot, background: '#3b82f6' }}></span>
                            <span style={styles.legendText}>Voice SOS</span>
                        </div>
                    </div>
                </div>

                <div style={styles.mapContainer}>
                    {isLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                            Loading map data...
                        </div>
                    ) : (
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

                            {/* Real accident markers */}
                            {accidents.map((accident) => (
                                accident.coordinates && (
                                    <CircleMarker
                                        key={accident._id}
                                        center={[accident.coordinates.lat, accident.coordinates.lng]}
                                        radius={accident.severity === 'Critical' ? 12 : accident.severity === 'High' ? 10 : 7}
                                        fillColor={severityColor(accident.severity)}
                                        fillOpacity={0.7}
                                        color={severityColor(accident.severity)}
                                        weight={2}
                                    >
                                        <Popup>
                                            <div style={{ fontFamily: "'Inter', sans-serif", padding: '4px', minWidth: '180px' }}>
                                                <strong style={{ color: severityColor(accident.severity), fontSize: '14px' }}>
                                                    {accident.severity} Severity
                                                </strong>
                                                <br />
                                                <span style={{ fontSize: '13px', color: '#374151' }}>
                                                    📍 {accident.location}
                                                </span>
                                                <br />
                                                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                                    🕐 {new Date(accident.time || accident.createdAt).toLocaleString()}
                                                </span>
                                                <br />
                                                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                                    🎥 {accident.camId} • Status: {accident.status || 'detected'}
                                                </span>
                                                {accident.licensePlate && accident.licensePlate !== 'Unknown' && (
                                                    <>
                                                        <br />
                                                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                                            🚗 Plate: {accident.licensePlate}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                )
                            ))}

                            {/* SOS alert markers (blue) */}
                            {sosAlerts.map((sos) => (
                                sos.coordinates && (
                                    <CircleMarker
                                        key={sos._id}
                                        center={[sos.coordinates.lat, sos.coordinates.lng]}
                                        radius={sos.severity === 'Critical' ? 12 : 9}
                                        fillColor="#3b82f6"
                                        fillOpacity={0.7}
                                        color="#3b82f6"
                                        weight={2}
                                    >
                                        <Popup>
                                            <div style={{ fontFamily: "'Inter', sans-serif", padding: '4px', minWidth: '180px' }}>
                                                <strong style={{ color: '#3b82f6', fontSize: '14px' }}>
                                                    🆘 Voice SOS — {sos.domain}
                                                </strong>
                                                <br />
                                                <span style={{ fontSize: '13px', color: '#374151' }}>
                                                    Severity: {sos.severity} ({(sos.confidence * 100).toFixed(0)}%)
                                                </span>
                                                {sos.transcript && (
                                                    <>
                                                        <br />
                                                        <span style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                                                            "{sos.transcript}"
                                                        </span>
                                                    </>
                                                )}
                                                <br />
                                                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                                    🕐 {new Date(sos.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                )
                            ))}
                        </MapContainer>
                    )}
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