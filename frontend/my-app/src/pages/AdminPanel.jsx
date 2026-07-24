import React, { useState, useEffect } from 'react';
import { statsAPI, cameraAPI, contactAPI, auditAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
    const { isSuperAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [cameras, setCameras] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(null); // 'user' | 'camera' | 'contact'
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchTabData();
    }, [activeTab]);

    const fetchTabData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const res = await statsAPI.getUsers();
                setUsers(res.data.data.users || []);
            } else if (activeTab === 'cameras') {
                const res = await cameraAPI.getAll();
                setCameras(res.data.data || []);
            } else if (activeTab === 'contacts') {
                const res = await contactAPI.getAll();
                setContacts(res.data.data || []);
            } else if (activeTab === 'audit') {
                const res = await auditAPI.getAll({ limit: 50 });
                setAuditLogs(res.data.data || []);
            }
        } catch (error) {
            console.error('Admin fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (showModal === 'user') {
                await authAPI.register(formData);
            } else if (showModal === 'camera') {
                await cameraAPI.create({
                    ...formData,
                    coordinates: { lat: parseFloat(formData.lat) || 0, lng: parseFloat(formData.lng) || 0 }
                });
            } else if (showModal === 'contact') {
                await contactAPI.create(formData);
            }
            setShowModal(null);
            setFormData({});
            fetchTabData();
        } catch (error) {
            console.error('Create error:', error);
            alert(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            if (type === 'camera') await cameraAPI.delete(id);
            else if (type === 'contact') await contactAPI.delete(id);
            fetchTabData();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const tabs = [
        { key: 'users', label: '👥 Users & Roles' },
        { key: 'cameras', label: '📹 Cameras' },
        { key: 'contacts', label: '📞 Emergency Contacts' },
        ...(isSuperAdmin() ? [{ key: 'audit', label: '📋 Audit Logs' }] : [])
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Admin Panel</h1>
                    <p className="page-subtitle">System management & configuration</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {loading ? (
                <div className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }}></div>
            ) : (
                <>
                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div>
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn-primary" onClick={() => { setShowModal('user'); setFormData({ role: 'viewer' }); }}>
                                    + Add User
                                </button>
                            </div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Last Login</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user._id}>
                                                <td style={{ fontWeight: '500' }}>{user.name}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{user.email}</td>
                                                <td>
                                                    <span style={{
                                                        padding: '3px 10px', borderRadius: 'var(--radius-full)',
                                                        fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase',
                                                        background: user.role === 'super_admin' ? 'rgba(220,38,38,0.15)' : user.role === 'zone_admin' ? 'rgba(245,158,11,0.15)' : 'rgba(37,99,235,0.15)',
                                                        color: user.role === 'super_admin' ? '#DC2626' : user.role === 'zone_admin' ? '#F59E0B' : '#3B82F6'
                                                    }}>
                                                        {user.role?.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`connection-dot ${user.isActive === false ? 'connection-dot--offline' : ''}`} style={{ display: 'inline-block', marginRight: '6px' }}></span>
                                                    {user.isActive !== false ? 'Active' : 'Inactive'}
                                                </td>
                                                <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Cameras Tab */}
                    {activeTab === 'cameras' && (
                        <div>
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn-primary" onClick={() => { setShowModal('camera'); setFormData({}); }}>
                                    + Add Camera
                                </button>
                            </div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Zone</th>
                                            <th>Status</th>
                                            <th>Coordinates</th>
                                            <th>Edge Mode</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cameras.map(cam => (
                                            <tr key={cam._id}>
                                                <td style={{ fontWeight: '500' }}>{cam.name}</td>
                                                <td>{cam.zone}</td>
                                                <td>
                                                    <span className={`connection-dot ${cam.status !== 'online' ? 'connection-dot--offline' : ''}`} style={{ display: 'inline-block', marginRight: '6px' }}></span>
                                                    {cam.status}
                                                </td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                                                    {cam.coordinates?.lat?.toFixed(4)}, {cam.coordinates?.lng?.toFixed(4)}
                                                </td>
                                                <td>{cam.edgeMode ? '✅' : '—'}</td>
                                                <td>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete('camera', cam._id)}>🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Contacts Tab */}
                    {activeTab === 'contacts' && (
                        <div>
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn-primary" onClick={() => { setShowModal('contact'); setFormData({}); }}>
                                    + Add Contact
                                </button>
                            </div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Phone</th>
                                            <th>Email</th>
                                            <th>Relation</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contacts.map(contact => (
                                            <tr key={contact._id}>
                                                <td style={{ fontWeight: '500' }}>{contact.name}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)' }}>{contact.phone}</td>
                                                <td style={{ fontSize: '0.85rem' }}>{contact.email || '—'}</td>
                                                <td>{contact.relation || '—'}</td>
                                                <td>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete('contact', contact._id)}>🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Audit Logs Tab */}
                    {activeTab === 'audit' && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Actor</th>
                                        <th>Action</th>
                                        <th>Target</th>
                                        <th>IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map(log => (
                                        <tr key={log._id}>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td>{log.actor?.name || 'System'}</td>
                                            <td>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: 'var(--radius-full)',
                                                    fontSize: '0.7rem', fontWeight: '600',
                                                    background: 'rgba(37,99,235,0.15)', color: '#3B82F6'
                                                }}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>{log.targetType}</td>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                {log.ipAddress || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {showModal === 'user' ? '👤 Add User' : showModal === 'camera' ? '📹 Add Camera' : '📞 Add Contact'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(null)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {showModal === 'user' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Name</label>
                                        <input className="form-input" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input type="email" className="form-input" required value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Password</label>
                                        <input type="password" className="form-input" required value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Role</label>
                                        <select className="form-select" value={formData.role || 'viewer'} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                            <option value="viewer">Viewer</option>
                                            <option value="responder">Responder</option>
                                            <option value="zone_admin">Zone Admin</option>
                                            {isSuperAdmin() && <option value="super_admin">Super Admin</option>}
                                        </select>
                                    </div>
                                </>
                            )}

                            {showModal === 'camera' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Camera Name</label>
                                        <input className="form-input" required placeholder="CAM-01" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Zone</label>
                                        <input className="form-input" required placeholder="Zone A" value={formData.zone || ''} onChange={e => setFormData({ ...formData, zone: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Stream URL (optional)</label>
                                        <input className="form-input" placeholder="rtsp://..." value={formData.streamUrl || ''} onChange={e => setFormData({ ...formData, streamUrl: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Latitude</label>
                                            <input type="number" step="any" className="form-input" required value={formData.lat || ''} onChange={e => setFormData({ ...formData, lat: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Longitude</label>
                                            <input type="number" step="any" className="form-input" required value={formData.lng || ''} onChange={e => setFormData({ ...formData, lng: e.target.value })} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {showModal === 'contact' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Name</label>
                                        <input className="form-input" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input className="form-input" required placeholder="+91..." value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input type="email" className="form-input" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Relation</label>
                                        <input className="form-input" placeholder="Family, Fleet Manager..." value={formData.relation || ''} onChange={e => setFormData({ ...formData, relation: e.target.value })} />
                                    </div>
                                </>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;