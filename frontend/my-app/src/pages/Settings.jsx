import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { authAPI } from '../services/api';

const Settings = () => {
    const { user } = useAuth();
    const { soundEnabled, toggleSound } = useNotifications();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage('');

        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setMessage('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await authAPI.updatePassword({ currentPassword, newPassword });
            setMessage('Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Profile & notification preferences</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '900px' }}>
                {/* Profile Info */}
                <div className="card">
                    <h3 style={{ marginBottom: '20px', fontSize: '1rem', fontWeight: '600' }}>👤 Profile</h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {[
                            ['Name', user?.name],
                            ['Email', user?.email],
                            ['Role', user?.role?.replace('_', ' ').toUpperCase()],
                        ].map(([label, value]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{label}</span>
                                <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notification Preferences */}
                <div className="card">
                    <h3 style={{ marginBottom: '20px', fontSize: '1rem', fontWeight: '600' }}>🔔 Notifications</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <div>
                            <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>Alert Sound</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Play audio chime on new detections</div>
                        </div>
                        <button
                            className={`btn ${soundEnabled ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                            onClick={toggleSound}
                        >
                            {soundEnabled ? '🔔 Enabled' : '🔕 Disabled'}
                        </button>
                    </div>
                </div>

                {/* Change Password */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <h3 style={{ marginBottom: '20px', fontSize: '1rem', fontWeight: '600' }}>🔒 Change Password</h3>

                    {message && (
                        <div className="alert-banner" style={{ animation: 'none', marginBottom: '16px', borderLeftColor: message.includes('success') ? 'var(--color-success)' : 'var(--color-severe)' }}>
                            <span className="alert-icon">{message.includes('success') ? '✅' : '⚠️'}</span>
                            <div className="alert-content">
                                <div className="alert-message">{message}</div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handlePasswordChange}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input type="password" className="form-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <input type="password" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
