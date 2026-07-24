import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accidentAPI, alertAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AccidentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasRole } = useAuth();
    const [accident, setAccident] = useState(null);
    const [alertLogs, setAlertLogs] = useState([]);
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedbackNote, setFeedbackNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await accidentAPI.getById(id);
                setAccident(res.data.data);
                setAlertLogs(res.data.alertLogs || []);
                setFeedback(res.data.feedback || null);
            } catch (error) {
                console.error('Failed to fetch accident:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handleFeedback = async (label) => {
        setSubmitting(true);
        try {
            await accidentAPI.addFeedback(id, { label, notes: feedbackNote });
            // Refresh
            const res = await accidentAPI.getById(id);
            setAccident(res.data.data);
            setFeedback(res.data.feedback);
        } catch (error) {
            console.error('Feedback error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (status) => {
        try {
            await accidentAPI.updateStatus(id, status);
            const res = await accidentAPI.getById(id);
            setAccident(res.data.data);
        } catch (error) {
            console.error('Status update error:', error);
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }}></div>
            </div>
        );
    }

    if (!accident) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <div className="empty-icon">❌</div>
                    <div className="empty-title">Accident not found</div>
                    <button className="btn btn-primary" onClick={() => navigate('/reports')}>Back to Reports</button>
                </div>
            </div>
        );
    }

    const severity = accident.severity?.toLowerCase() || 'minor';

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '8px' }}>
                        ← Back
                    </button>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Accident Detail
                        <span className={`severity-badge severity-badge--${severity}`}>{severity}</span>
                        <span className={`status-badge status-badge--${accident.status}`}>{accident.status?.replace('_', ' ')}</span>
                    </h1>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Evidence Viewer */}
                <div className="card">
                    <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: '600' }}>📷 Evidence</h3>
                    {accident.evidence?.imageUrl ? (
                        <img
                            src={accident.evidence.imageUrl}
                            alt="Accident evidence"
                            style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: '400px', objectFit: 'cover' }}
                        />
                    ) : (
                        <div className="empty-state" style={{ padding: '40px' }}>
                            <div className="empty-icon">📷</div>
                            <p>No evidence image available</p>
                        </div>
                    )}
                    {accident.evidence?.clipUrl && (
                        <video
                            src={accident.evidence.clipUrl}
                            controls
                            style={{ width: '100%', borderRadius: 'var(--radius-md)', marginTop: '12px' }}
                        />
                    )}
                </div>

                {/* Metadata Panel */}
                <div>
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: '600' }}>📋 Details</h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {[
                                ['Time', new Date(accident.detectedAt || accident.createdAt).toLocaleString()],
                                ['Confidence', `${((accident.confidence || 0) * 100).toFixed(1)}%`],
                                ['Camera', accident.camera?.name || accident.camId || 'Unknown'],
                                ['Zone', accident.camera?.zone || '—'],
                                ['Location', accident.location?.address || '—'],
                                ['GPS', `${accident.location?.lat?.toFixed(4)}, ${accident.location?.lng?.toFixed(4)}`],
                                ['License Plate', accident.licensePlate || 'Unknown'],
                                ['Reviewed By', accident.reviewedBy?.name || '—'],
                            ].map(([label, value]) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{label}</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '500', fontFamily: label === 'GPS' || label === 'Confidence' ? 'var(--font-mono)' : 'inherit' }}>{value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Map link */}
                        {accident.location?.lat && (
                            <a
                                href={`https://www.google.com/maps?q=${accident.location.lat},${accident.location.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost btn-sm"
                                style={{ width: '100%', marginTop: '16px' }}
                            >
                                🗺️ View on Google Maps
                            </a>
                        )}
                    </div>

                    {/* Nearest Facilities */}
                    {(accident.nearestHospital || accident.nearestPolice) && (
                        <div className="card" style={{ marginBottom: '16px' }}>
                            <h3 style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: '600' }}>🏥 Nearest Facilities</h3>
                            {accident.nearestHospital && (
                                <div style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>🏥 {accident.nearestHospital.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>📞 {accident.nearestHospital.contactNumber}</div>
                                </div>
                            )}
                            {accident.nearestPolice && (
                                <div style={{ padding: '8px 0' }}>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>🚔 {accident.nearestPolice.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>📞 {accident.nearestPolice.contactNumber}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Alert Delivery Status */}
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <h3 style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: '600' }}>📨 Alert Status</h3>
                        {alertLogs.length > 0 ? (
                            <div style={{ display: 'grid', gap: '8px' }}>
                                {alertLogs.map((log, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                                        <span>{log.channel === 'email' ? '📧' : log.channel === 'sms' ? '📱' : log.channel === 'websocket' ? '🔌' : '📞'}</span>
                                        <span style={{ flex: 1, fontSize: '0.85rem' }}>{log.recipient}</span>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            padding: '2px 8px',
                                            borderRadius: 'var(--radius-full)',
                                            background: log.status === 'sent' || log.status === 'delivered' ? 'var(--color-success-bg)' : log.status === 'failed' ? 'var(--color-severe-bg)' : 'var(--color-moderate-bg)',
                                            color: log.status === 'sent' || log.status === 'delivered' ? 'var(--color-success)' : log.status === 'failed' ? 'var(--color-severe)' : 'var(--color-moderate)',
                                            fontWeight: '600'
                                        }}>
                                            {log.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No alerts dispatched yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            {hasRole('super_admin', 'zone_admin', 'responder') && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: '600' }}>🎯 Actions</h3>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        {accident.status === 'needs_review' && (
                            <>
                                <button className="btn btn-success" onClick={() => handleFeedback('true_positive')} disabled={submitting}>
                                    ✅ Confirm Incident
                                </button>
                                <button className="btn btn-ghost" onClick={() => handleFeedback('false_positive')} disabled={submitting}>
                                    ❌ Mark False Positive
                                </button>
                            </>
                        )}
                        {accident.status === 'confirmed' && (
                            <button className="btn btn-primary" onClick={() => handleStatusUpdate('resolved')} disabled={submitting}>
                                ✔️ Mark Resolved
                            </button>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Review Note</label>
                        <textarea
                            className="form-input"
                            rows="2"
                            value={feedbackNote}
                            onChange={(e) => setFeedbackNote(e.target.value)}
                            placeholder="Add a note about this incident..."
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {feedback && (
                        <div style={{ marginTop: '12px', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-primary)', fontSize: '0.85rem' }}>
                            <strong>Feedback:</strong> {feedback.label?.replace('_', ' ')} by {feedback.labeledBy?.name || 'Unknown'}
                            {feedback.notes && <p style={{ marginTop: '4px', color: 'var(--color-text-secondary)' }}>{feedback.notes}</p>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AccidentDetail;
