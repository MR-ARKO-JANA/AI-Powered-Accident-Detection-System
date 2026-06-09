import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register ChartJS elements
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function Analytics() {
    const [timeRange, setTimeRange] = useState(30); // 7, 30, 90 days
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const res = await API.get(`/stats/analytics?days=${timeRange}`);
                if (res.data?.success) {
                    setData(res.data.data);
                } else {
                    setError('Failed to fetch analytics data');
                }
            } catch (err) {
                console.error(err);
                setError('Network error fetching analytics');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [timeRange]);

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Analyzing APADS intelligence data...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={styles.errorContainer}>
                <div style={styles.errorIcon}>⚠️</div>
                <p style={styles.errorText}>{error || 'Analytics not available'}</p>
                <button style={styles.retryButton} onClick={() => setTimeRange(timeRange)}>Retry</button>
            </div>
        );
    }

    // --- CHART 1: DAILY TRENDS (LINE) ---
    const datesSet = new Set([
        ...data.dailyAccidents.map(d => d._id),
        ...data.dailySOS.map(d => d._id)
    ]);
    const sortedDates = Array.from(datesSet).sort();

    const accidentDataPoints = sortedDates.map(date => {
        const found = data.dailyAccidents.find(d => d._id === date);
        return found ? found.count : 0;
    });

    const sosDataPoints = sortedDates.map(date => {
        const found = data.dailySOS.find(d => d._id === date);
        return found ? found.count : 0;
    });

    const trendChartData = {
        labels: sortedDates.map(date => {
            const parts = date.split('-');
            return `${parts[1]}/${parts[2]}`; // MM/DD format
        }),
        datasets: [
            {
                label: 'AI Accidents',
                data: accidentDataPoints,
                borderColor: '#06b6d4', // Cyan
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#06b6d4',
            },
            {
                label: 'SOS Alerts',
                data: sosDataPoints,
                borderColor: '#f43f5e', // Rose
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#f43f5e',
            }
        ]
    };

    // --- CHART 2: PEAK HOUR DISTRIBUTION (BAR) ---
    const hourlyLabels = Array.from({ length: 24 }, (_, i) => {
        const ampm = i >= 12 ? 'PM' : 'AM';
        const hour = i % 12 === 0 ? 12 : i % 12;
        return `${hour} ${ampm}`;
    });
    const hourlyDataPoints = Array.from({ length: 24 }, (_, i) => {
        const found = data.hourlyDistribution.find(h => h._id === i);
        return found ? found.count : 0;
    });

    const hourlyChartData = {
        labels: hourlyLabels,
        datasets: [
            {
                label: 'Incidents Count',
                data: hourlyDataPoints,
                backgroundColor: 'rgba(139, 92, 246, 0.7)', // Violet
                hoverBackgroundColor: '#8b5cf6',
                borderRadius: 4,
            }
        ]
    };

    // --- CHART 3: SEVERITY DISTRIBUTION (DOUGHNUT) ---
    const severityLabels = ['Critical', 'High', 'Medium', 'Low'];
    const severityDataPoints = severityLabels.map(label => {
        const found = data.severityDistribution.find(s => s._id === label);
        return found ? found.count : 0;
    });

    const severityChartData = {
        labels: severityLabels,
        datasets: [
            {
                data: severityDataPoints,
                backgroundColor: [
                    '#f43f5e', // Rose
                    '#f59e0b', // Amber
                    '#06b6d4', // Cyan
                    '#10b981'  // Emerald
                ],
                borderWidth: 1,
                borderColor: 'rgba(15, 23, 42, 0.8)'
            }
        ]
    };

    // --- CHART 4: STATUS DISTRIBUTION (PIE) ---
    const statusLabels = ['detected', 'acknowledged', 'responding', 'resolved'];
    const statusDisplayLabels = ['Detected', 'Acknowledged', 'Responding', 'Resolved'];
    const statusDataPoints = statusLabels.map(label => {
        const found = data.statusDistribution.find(s => s._id === label);
        return found ? found.count : 0;
    });

    const statusChartData = {
        labels: statusDisplayLabels,
        datasets: [
            {
                data: statusDataPoints,
                backgroundColor: [
                    'rgba(244, 63, 94, 0.8)',  // Rose
                    'rgba(245, 158, 11, 0.8)', // Amber
                    'rgba(139, 92, 246, 0.8)', // Violet
                    'rgba(16, 185, 129, 0.8)'  // Emerald
                ],
                borderWidth: 1,
                borderColor: 'rgba(15, 23, 42, 0.8)'
            }
        ]
    };

    // --- CHART 5: CAMERA WORKLOADS (BAR) ---
    const cameraLabels = data.cameraStats.map(c => c._id || 'Unknown');
    const cameraDataPoints = data.cameraStats.map(c => c.count);

    const cameraChartData = {
        labels: cameraLabels,
        datasets: [
            {
                label: 'Alerts Count',
                data: cameraDataPoints,
                backgroundColor: 'rgba(16, 185, 129, 0.7)', // Emerald
                hoverBackgroundColor: '#10b981',
                borderRadius: 4,
            }
        ]
    };

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#94a3b8',
                    font: { family: 'Inter, sans-serif', size: 12 }
                }
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                borderColor: 'rgba(148, 163, 184, 0.2)',
                borderWidth: 1
            }
        },
        scales: {
            x: {
                ticks: { color: '#64748b' },
                grid: { color: 'rgba(148, 163, 184, 0.05)' }
            },
            y: {
                ticks: { color: '#64748b', stepSize: 1 },
                grid: { color: 'rgba(148, 163, 184, 0.05)' }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: '#94a3b8',
                    font: { family: 'Inter, sans-serif', size: 12 }
                }
            }
        }
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>System Analytics</h1>
                    <p style={styles.subtitle}>Historical reports and pattern analytics for incident metrics</p>
                </div>
                <div style={styles.rangeSelector}>
                    <button
                        style={{ ...styles.rangeButton, ...(timeRange === 7 ? styles.rangeButtonActive : {}) }}
                        onClick={() => setTimeRange(7)}
                    >
                        7 Days
                    </button>
                    <button
                        style={{ ...styles.rangeButton, ...(timeRange === 30 ? styles.rangeButtonActive : {}) }}
                        onClick={() => setTimeRange(30)}
                    >
                        30 Days
                    </button>
                    <button
                        style={{ ...styles.rangeButton, ...(timeRange === 90 ? styles.rangeButtonActive : {}) }}
                        onClick={() => setTimeRange(90)}
                    >
                        90 Days
                    </button>
                </div>
            </div>

            {/* Grid Layout */}
            <div style={styles.grid}>
                {/* 1. Daily Trend Line Chart */}
                <div style={{ ...styles.card, ...styles.fullWidthCard }}>
                    <h3 style={styles.cardTitle}>Daily Incident Trend</h3>
                    <div style={styles.chartWrapper}>
                        <Line data={trendChartData} options={commonOptions} />
                    </div>
                </div>

                {/* 2. Peak Hours Bar Chart */}
                <div style={{ ...styles.card, ...styles.twoThirdsCard }}>
                    <h3 style={styles.cardTitle}>Peak Activity (Hourly Distribution)</h3>
                    <div style={styles.chartWrapper}>
                        <Bar data={hourlyChartData} options={commonOptions} />
                    </div>
                </div>

                {/* 3. Severity Distribution Doughnut */}
                <div style={{ ...styles.card, ...styles.oneThirdCard }}>
                    <h3 style={styles.cardTitle}>Severity Distribution</h3>
                    <div style={styles.chartWrapper}>
                        <Doughnut data={severityChartData} options={doughnutOptions} />
                    </div>
                </div>

                {/* 4. Status Distribution Pie */}
                <div style={{ ...styles.card, ...styles.oneThirdCard }}>
                    <h3 style={styles.cardTitle}>Resolution Status</h3>
                    <div style={styles.chartWrapper}>
                        <Pie data={statusChartData} options={doughnutOptions} />
                    </div>
                </div>

                {/* 5. Camera Workloads Bar Chart */}
                <div style={{ ...styles.card, ...styles.twoThirdsCard }}>
                    <h3 style={styles.cardTitle}>Incidents per Surveillance Camera</h3>
                    <div style={styles.chartWrapper}>
                        {cameraLabels.length > 0 ? (
                            <Bar data={cameraChartData} options={commonOptions} />
                        ) : (
                            <div style={styles.noData}>No camera activity logged yet</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 24px',
        animation: 'fadeInUp 0.6s ease-out',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px',
    },
    title: {
        fontSize: '32px',
        fontWeight: 800,
        letterSpacing: '-0.5px',
        background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        fontSize: '14px',
        color: 'var(--text-muted)',
        marginTop: '4px',
    },
    rangeSelector: {
        display: 'flex',
        background: 'rgba(30, 41, 59, 0.4)',
        border: '1px solid var(--border-glass)',
        padding: '4px',
        borderRadius: 'var(--radius-md)',
    },
    rangeButton: {
        background: 'none',
        border: 'none',
        color: 'var(--text-secondary)',
        padding: '8px 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        transition: 'all 0.2s ease',
    },
    rangeButtonActive: {
        background: 'var(--accent-cyan)',
        color: 'white',
        boxShadow: '0 0 12px rgba(6, 182, 212, 0.3)',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px',
    },
    card: {
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
    },
    fullWidthCard: {
        gridColumn: 'span 3',
    },
    twoThirdsCard: {
        gridColumn: 'span 2',
    },
    oneThirdCard: {
        gridColumn: 'span 1',
    },
    cardTitle: {
        fontSize: '16px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '20px',
        letterSpacing: '0.2px',
    },
    chartWrapper: {
        position: 'relative',
        height: '300px',
        width: '100%',
    },
    noData: {
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '14px',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        gap: '16px',
    },
    spinner: {
        border: '4px solid rgba(148, 163, 184, 0.1)',
        borderTop: '4px solid var(--accent-cyan)',
        borderRadius: '50%',
        width: '48px',
        height: '48px',
        animation: 'spin 1s linear infinite',
    },
    loadingText: {
        color: 'var(--text-secondary)',
        fontSize: '15px',
        fontWeight: 500,
    },
    errorContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        gap: '16px',
    },
    errorIcon: {
        fontSize: '48px',
    },
    errorText: {
        color: '#f87171',
        fontSize: '16px',
        fontWeight: 500,
    },
    retryButton: {
        background: 'var(--accent-cyan)',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
};

export default Analytics;
