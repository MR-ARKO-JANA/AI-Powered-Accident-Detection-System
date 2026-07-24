import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { statsAPI } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#94A3B8', font: { family: 'Inter' } } },
        tooltip: { backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1 }
    },
    scales: {
        x: { ticks: { color: '#64748B' }, grid: { color: 'rgba(51,65,85,0.3)' } },
        y: { ticks: { color: '#64748B' }, grid: { color: 'rgba(51,65,85,0.3)' } }
    }
};

const Analytics = () => {
    const [data, setData] = useState(null);
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await statsAPI.getAnalytics(days);
                setData(res.data.data);
            } catch (error) {
                console.error('Analytics fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [days]);

    if (loading || !data) {
        return (
            <div className="page-container">
                <div className="charts-grid">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="chart-container">
                            <div className="skeleton" style={{ height: '300px' }}></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Accidents over time chart
    const dailyChart = {
        labels: (data.dailyAccidents || []).map(d => d._id),
        datasets: [
            {
                label: 'Accidents',
                data: (data.dailyAccidents || []).map(d => d.count),
                borderColor: '#DC2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'SOS Alerts',
                data: (data.dailySOS || []).map(d => d.count),
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    // Hourly distribution
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const hourlyData = new Array(24).fill(0);
    (data.hourlyDistribution || []).forEach(h => { hourlyData[h._id] = h.count; });

    const hourlyChart = {
        labels: hours,
        datasets: [{
            label: 'Accidents by Hour',
            data: hourlyData,
            backgroundColor: hourlyData.map((v, i) => {
                const max = Math.max(...hourlyData, 1);
                const intensity = v / max;
                return `rgba(220, 38, 38, ${0.2 + intensity * 0.8})`;
            }),
            borderRadius: 4,
        }]
    };

    // Severity distribution
    const sevLabels = (data.severityDistribution || []).map(s => s._id);
    const sevData = (data.severityDistribution || []).map(s => s.count);
    const sevColors = { severe: '#DC2626', moderate: '#F59E0B', minor: '#3B82F6' };

    const severityChart = {
        labels: sevLabels.map(s => s?.charAt(0).toUpperCase() + s?.slice(1)),
        datasets: [{
            data: sevData,
            backgroundColor: sevLabels.map(s => sevColors[s] || '#64748B'),
            borderWidth: 0
        }]
    };

    // Camera performance
    const cameraChart = {
        labels: (data.cameraStats || []).slice(0, 10).map(c => c._id || 'Unknown'),
        datasets: [{
            label: 'Detections',
            data: (data.cameraStats || []).slice(0, 10).map(c => c.count),
            backgroundColor: '#2563EB',
            borderRadius: 6,
        }]
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics</h1>
                    <p className="page-subtitle">Accident trends and system performance</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[7, 14, 30, 60, 90].map(d => (
                        <button
                            key={d}
                            className={`map-toggle ${days === d ? 'active' : ''}`}
                            onClick={() => setDays(d)}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Row */}
            <div className="stat-grid">
                <div className="stat-card" style={{ '--stat-accent': 'var(--color-brand)' }}>
                    <span className="stat-label">Avg Alert Latency</span>
                    <span className="stat-value">{data.avgAlertLatencyMs ? `${(data.avgAlertLatencyMs / 1000).toFixed(1)}s` : 'N/A'}</span>
                </div>
                <div className="stat-card" style={{ '--stat-accent': 'var(--color-moderate)' }}>
                    <span className="stat-label">Total Detections</span>
                    <span className="stat-value">{(data.dailyAccidents || []).reduce((s, d) => s + d.count, 0)}</span>
                </div>
                <div className="stat-card" style={{ '--stat-accent': 'var(--color-success)' }}>
                    <span className="stat-label">Feedback Received</span>
                    <span className="stat-value">{(data.feedbackStats || []).reduce((s, f) => s + f.count, 0)}</span>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="chart-container">
                    <div className="chart-title">📈 Accidents Over Time</div>
                    <div style={{ height: '300px' }}>
                        <Line data={dailyChart} options={chartOptions} />
                    </div>
                </div>

                <div className="chart-container">
                    <div className="chart-title">🕐 Hourly Distribution</div>
                    <div style={{ height: '300px' }}>
                        <Bar data={hourlyChart} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
                    </div>
                </div>

                <div className="chart-container">
                    <div className="chart-title">⚡ Severity Breakdown</div>
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Doughnut data={severityChart} options={{
                            ...chartOptions,
                            scales: {},
                            cutout: '60%'
                        }} />
                    </div>
                </div>

                <div className="chart-container">
                    <div className="chart-title">📹 Detections by Camera</div>
                    <div style={{ height: '300px' }}>
                        <Bar data={cameraChart} options={{ ...chartOptions, indexAxis: 'y', plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
