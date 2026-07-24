import React, { useState, useEffect, useRef } from 'react';
import { cameraAPI } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

const CameraFeed = () => {
    const [cameras, setCameras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const { latestAccident } = useNotifications();
    const [alertCameras, setAlertCameras] = useState(new Set());
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchCameras = async () => {
            try {
                const res = await cameraAPI.getAll();
                setCameras(res.data.data);
            } catch (error) {
                console.error('Failed to fetch cameras:', error);
                // Fallback: show placeholder cameras
                setCameras([
                    { _id: '1', name: 'CAM-01', zone: 'Zone A', status: 'online', coordinates: { lat: 22.57, lng: 88.36 } },
                    { _id: '2', name: 'CAM-02', zone: 'Zone B', status: 'online', coordinates: { lat: 22.58, lng: 88.37 } },
                    { _id: '3', name: 'CAM-03', zone: 'Zone C', status: 'offline', coordinates: { lat: 22.56, lng: 88.35 } },
                    { _id: '4', name: 'CAM-04', zone: 'Zone A', status: 'online', coordinates: { lat: 22.59, lng: 88.38 } },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchCameras();
    }, []);

    // Flash red border when accident detected on a camera
    useEffect(() => {
        if (latestAccident) {
            const camName = latestAccident.camera?.name || latestAccident.camId;
            if (camName) {
                setAlertCameras(prev => new Set([...prev, camName]));
                setTimeout(() => {
                    setAlertCameras(prev => {
                        const next = new Set(prev);
                        next.delete(camName);
                        return next;
                    });
                }, 10000);
            }
        }
    }, [latestAccident]);

    const handleFrameUpload = async (cameraName) => {
        // Trigger file input for manual frame upload
        if (fileInputRef.current) {
            fileInputRef.current.dataset.camera = cameraName;
            fileInputRef.current.click();
        }
    };

    const handleFileSelected = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const cameraName = e.target.dataset.camera;

        try {
            const formData = new FormData();
            formData.append('frame', file);

            const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${API_BASE}/ai-detect`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            console.log(`Detection result for ${cameraName}:`, data);
        } catch (error) {
            console.error('Detection error:', error);
        }
        e.target.value = '';
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="camera-grid">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="camera-tile">
                            <div className="skeleton" style={{ width: '100%', height: '100%' }}></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Live Feed</h1>
                    <p className="page-subtitle">{cameras.filter(c => c.status === 'online').length} of {cameras.length} cameras online</p>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileSelected}
            />

            {/* Expanded Camera View */}
            {selectedCamera && (
                <div className="modal-overlay" onClick={() => setSelectedCamera(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">{selectedCamera.name}</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                    {selectedCamera.zone} • {selectedCamera.status}
                                </p>
                            </div>
                            <button className="modal-close" onClick={() => setSelectedCamera(null)}>✕</button>
                        </div>
                        <div style={{
                            width: '100%', aspectRatio: '16/9',
                            background: 'var(--color-bg-primary)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexDirection: 'column', gap: '16px'
                        }}>
                            <span style={{ fontSize: '4rem' }}>📹</span>
                            <p style={{ color: 'var(--color-text-muted)' }}>
                                {selectedCamera.streamUrl ? 'Stream URL: ' + selectedCamera.streamUrl : 'Simulated feed — Upload frame for detection'}
                            </p>
                            <button className="btn btn-primary" onClick={() => handleFrameUpload(selectedCamera.name)}>
                                📤 Upload Frame for Detection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Grid */}
            <div className="camera-grid">
                {cameras.map((camera) => (
                    <div
                        key={camera._id}
                        className={`camera-tile ${alertCameras.has(camera.name) ? 'camera-tile--alert' : ''}`}
                        onClick={() => setSelectedCamera(camera)}
                    >
                        <div style={{
                            width: '100%', height: '100%',
                            background: camera.status === 'online'
                                ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                                : 'linear-gradient(135deg, #2d1b1b 0%, #1a1a1a 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '3rem', opacity: camera.status === 'online' ? 1 : 0.5
                        }}>
                            {camera.status === 'online' ? '📹' : '📵'}
                        </div>

                        <div className="camera-overlay">
                            <div>
                                <div className="camera-name">{camera.name}</div>
                                <div className="camera-zone">{camera.zone}</div>
                            </div>
                            <div className="camera-status">
                                <span className={`connection-dot ${camera.status !== 'online' ? 'connection-dot--offline' : ''}`}></span>
                                <span>{camera.status}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {cameras.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">📹</div>
                    <div className="empty-title">No cameras configured</div>
                    <p>Add cameras in the Admin Panel to start monitoring.</p>
                </div>
            )}
        </div>
    );
};

export default CameraFeed;