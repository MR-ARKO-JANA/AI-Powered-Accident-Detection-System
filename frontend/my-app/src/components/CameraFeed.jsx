import React, { useRef, useEffect, useState } from 'react';

const CameraFeed = () => {
    const videoRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        // Request access to the user's webcam
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsConnected(true);
                }
            })
            .catch((err) => {
                console.error("Camera access denied or no camera found:", err);
                setIsConnected(false);
            });
    }, []);

    // Live timestamp
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div style={styles.container}>

            {/* Scan Line Effect Overlay */}
            <div style={styles.scanlineOverlay}></div>

            {/* Top Bar — REC + Timestamp */}
            <div style={styles.topBar}>
                <div style={styles.recGroup}>
                    <span style={styles.recDot}></span>
                    <span style={styles.recText}>REC</span>
                </div>
                <div style={styles.timestamp}>
                    <span style={styles.timestampIcon}>◷</span>
                    {currentTime}
                </div>
            </div>

            {/* Bottom Gradient Overlay */}
            <div style={styles.bottomOverlay}>
                <div style={styles.cameraInfo}>
                    <span style={styles.cameraLabel}>CAM-01 • MAIN INTERSECTION</span>
                    <span style={{
                        ...styles.statusChip,
                        ...(isConnected ? styles.statusConnected : styles.statusDisconnected)
                    }}>
                        <span style={{
                            ...styles.statusIndicator,
                            background: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                        }}></span>
                        {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                </div>
            </div>

            {/* Corner Brackets (HUD style) */}
            <div style={{ ...styles.corner, top: '12px', left: '12px', borderTop: '2px solid rgba(6, 182, 212, 0.5)', borderLeft: '2px solid rgba(6, 182, 212, 0.5)' }}></div>
            <div style={{ ...styles.corner, top: '12px', right: '12px', borderTop: '2px solid rgba(6, 182, 212, 0.5)', borderRight: '2px solid rgba(6, 182, 212, 0.5)' }}></div>
            <div style={{ ...styles.corner, bottom: '12px', left: '12px', borderBottom: '2px solid rgba(6, 182, 212, 0.5)', borderLeft: '2px solid rgba(6, 182, 212, 0.5)' }}></div>
            <div style={{ ...styles.corner, bottom: '12px', right: '12px', borderBottom: '2px solid rgba(6, 182, 212, 0.5)', borderRight: '2px solid rgba(6, 182, 212, 0.5)' }}></div>

            {/* The Actual Video Feed */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={styles.video}
            />
        </div>
    );
};

const styles = {
    container: {
        position: 'relative',
        width: '100%',
        height: '420px',
        backgroundColor: '#070b14',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-glow-cyan)',
        boxShadow: 'var(--shadow-glow-cyan)',
        animation: 'fadeInUp 0.6s ease forwards',
    },

    scanlineOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.03) 2px, rgba(0, 0, 0, 0.03) 4px)',
        pointerEvents: 'none',
        zIndex: 3,
    },

    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 20px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
        zIndex: 5,
    },

    recGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },

    recDot: {
        width: '10px',
        height: '10px',
        backgroundColor: '#ef4444',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'pulseScale 1.5s ease-in-out infinite',
        boxShadow: '0 0 10px rgba(239, 68, 68, 0.7)',
    },

    recText: {
        color: '#ef4444',
        fontWeight: 700,
        letterSpacing: '2px',
        fontSize: '12px',
        fontFamily: "'Inter', monospace",
    },

    timestamp: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '1px',
        fontFamily: "'Inter', monospace",
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(0, 0, 0, 0.4)',
        padding: '4px 12px',
        borderRadius: 'var(--radius-full)',
    },

    timestampIcon: {
        fontSize: '14px',
        opacity: 0.7,
    },

    bottomOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '40px 20px 16px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
        zIndex: 5,
    },

    cameraInfo: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    cameraLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
    },

    statusChip: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '1px',
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
    },

    statusConnected: {
        background: 'rgba(16, 185, 129, 0.15)',
        color: 'var(--accent-emerald)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
    },

    statusDisconnected: {
        background: 'rgba(244, 63, 94, 0.15)',
        color: 'var(--accent-rose)',
        border: '1px solid rgba(244, 63, 94, 0.3)',
    },

    statusIndicator: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        display: 'inline-block',
    },

    corner: {
        position: 'absolute',
        width: '20px',
        height: '20px',
        zIndex: 4,
    },

    video: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        position: 'relative',
        zIndex: 1,
    },
};

export default CameraFeed;