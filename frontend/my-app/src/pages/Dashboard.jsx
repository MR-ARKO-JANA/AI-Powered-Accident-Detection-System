import React, { useState, useEffect } from 'react';
import { statsAPI, accidentAPI } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import AccidentCard from '../components/AccidentCard';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentAccidents, setRecentAccidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { latestAccident, notifications } = useNotifications();

    const fetchData = async () => {
        try {
            const [statsRes, accidentsRes] = await Promise.all([
                statsAPI.getDashboard(),
                accidentAPI.getAll({ limit: 10, page: 1 })
            ]);
            setStats(statsRes.data.data);
            setRecentAccidents(accidentsRes.data.data);
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    // Refresh when new accident detected via WebSocket
    useEffect(() => {
        if (latestAccident) {
            fetchData();
        }
    }, [latestAccident]);

    if (loading) {
        return (
            <div className="page-container">
                <div className="stat-grid">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="stat-card">
                            <div className="skeleton" style={{ height: '14px', width: '80px' }}></div>
                            <div className="skeleton" style={{ height: '36px', width: '60px', marginTop: '8px' }}></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const activeAlerts = notifications.filter(n => n.type === 'severe');

    return (
        <div className="page-container">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Real-time accident monitoring overview</p>
                </div>
            </div>

            {/* Live Alert Banner */}
            {activeAlerts.length > 0 && (
                <div className="alert-banner">
                    <span className="alert-icon">🚨</span>
                    <div className="alert-content">
                        <div className="alert-title">
                            NEW: {activeAlerts[0]?.title}
                        </div>
                        <div className="alert-message">
                            {activeAlerts[0]?.message}
                        </div>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => window.location.href = `/accidents/${activeAlerts[0]?.data?._id}`}>
                        View
                    </button>
                </div>
            )}

            {/* Stat Cards */}
            <div className="stat-grid">
                <div className="stat-card" style={{ '--stat-accent': 'var(--color-severe)' }}>
                    <span className="stat-label">Active Incidents</span>
                    <span className="stat-value">{stats?.activeIncidents || 0}</span>
                    <span className="stat-change">Requiring attention</span>
                </div>
                <div className="stat-card" style={{ '--stat-accent': 'var(--color-moderate)' }}>
                    <span className="stat-label">Today's Alerts</span>
                    <span className="stat-value">{stats?.todayAlerts || 0}</span>
                    <span className="stat-change">{stats?.todayAccidents || 0} accidents + {stats?.todaySOS || 0} SOS</span>
                </div>
                <div className="stat-card" style={{ '--stat-accent': 'var(--color-brand)' }}>
                    <span className="stat-label">Cameras Online</span>
                    <span className="stat-value">{stats?.cameras?.online || 0}/{stats?.cameras?.total || 0}</span>
                    <span className="stat-change">Active feeds</span>
                </div>
                <div className="stat-card" style={{ '--stat-accent': 'var(--color-success)' }}>
                    <span className="stat-label">False Positive Rate</span>
                    <span className="stat-value">{stats?.falsePositiveRate || 0}%</span>
                    <span className="stat-change">Alerts sent: {stats?.alerts?.sent || 0}</span>
                </div>
            </div>

            {/* Severity Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <span className="severity-badge severity-badge--severe" style={{ marginBottom: '8px' }}>Severe</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
                        {stats?.severity?.severe || 0}
                    </div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <span className="severity-badge severity-badge--moderate" style={{ marginBottom: '8px' }}>Moderate</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
                        {stats?.severity?.moderate || 0}
                    </div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <span className="severity-badge severity-badge--minor" style={{ marginBottom: '8px' }}>Minor</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
                        {stats?.severity?.minor || 0}
                    </div>
                </div>
            </div>

            {/* Recent Accidents */}
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Recent Accidents</h2>
                <a href="/reports" className="btn btn-ghost btn-sm">View All →</a>
            </div>

            {recentAccidents.length > 0 ? (
                <div className="accident-grid">
                    {recentAccidents.map((accident) => (
                        <AccidentCard key={accident._id} accident={accident} />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">🛡️</div>
                    <div className="empty-title">No accidents detected</div>
                    <p>The system is monitoring. Accidents will appear here in real-time.</p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;