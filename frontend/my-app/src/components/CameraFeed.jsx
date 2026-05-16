import React, { useRef, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const CameraFeed = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [currentTime, setCurrentTime] = useState('');
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectionStatus, setDetectionStatus] = useState('safe'); // 'safe' or 'accident'
    const [confidence, setConfidence] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // Audio Buzzer logic
    const playBuzzer = useCallback(() => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(150, audioCtx.currentTime); // Low frequency for buzzer
            
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
            console.error("Audio error:", e);
        }
    }, []);


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

    // Socket.io for global real-time alerts
    useEffect(() => {
        const socket = io('http://localhost:5000');

        socket.on('accidentDetected', (data) => {
            // If an accident is detected (anywhere), show it on the HUD and play buzzer
            setDetectionStatus('accident');
            playBuzzer();
            console.log("🌩️ Global Real-time alert received in HUD");
        });

        return () => socket.disconnect();
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

    const captureAndDetect = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Draw current video frame to hidden canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
            if (!blob) return;

            const formData = new FormData();
            formData.append('frame', blob, 'frame.jpg');

            try {
                setIsDetecting(true);
                setIsProcessing(true);
                // Call AI Flask Service
                const aiResponse = await axios.post('http://localhost:5001/detect', formData);
                setConfidence(aiResponse.data.confidence);
                
                if (aiResponse.data.accident) {
                    setDetectionStatus('accident');
                    playBuzzer(); // Trigger buzzer
                    console.warn("⚠️ ACCIDENT DETECTED! Confidence:", aiResponse.data.confidence);
                } else {
                    setDetectionStatus('safe');
                }
            } catch (error) {
                console.error("Detection error:", error);
            } finally {
                setIsDetecting(false);
                setIsProcessing(false);
            }
        }, 'image/jpeg');
    }, [playBuzzer]);

    // Detection Loop
    useEffect(() => {
        if (!isConnected) return;

        const interval = setInterval(async () => {
            if (isDetecting) return;
            captureAndDetect();
        }, 1000); // Check every 1 second for better responsiveness

        return () => clearInterval(interval);
    }, [isConnected, isDetecting, captureAndDetect]);

    return (
        <div style={styles.container}>

            {/* Scan Line Effect Overlay */}
            <div style={styles.scanlineOverlay}></div>

            {/* Top Bar — REC + Timestamp */}
            <div style={styles.topBar}>
                <div style={styles.recGroup}>
                    <div style={styles.recDot}></div>
                    <div style={{
                        ...styles.liveStatusHUD,
                        color: isProcessing ? '#fbbf24' : (detectionStatus === 'safe' ? '#10b981' : '#f43f5e'),
                        borderColor: isProcessing ? 'rgba(251, 191, 36, 0.3)' : (detectionStatus === 'safe' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'),
                        background: isProcessing ? 'rgba(251, 191, 36, 0.1)' : (detectionStatus === 'safe' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'),
                    }}>
                        {isProcessing ? '● PROCESSING...' : (detectionStatus === 'safe' ? '● NORMAL' : '● ACCIDENT')}
                        <span style={styles.confidenceText}>({(confidence * 100).toFixed(0)}%)</span>
                    </div>
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

            {/* Hidden Canvas for AI processing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* The Actual Video Feed */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={styles.video}
            />

            {/* DEBUG: Simulation Button */}
            <button 
                onClick={() => {
                    const fakeData = {
                        severity: "High",
                        location: "Simulated Test Site",
                        time: new Date().toLocaleTimeString(),
                        coordinates: { lat: 22.5726, lng: 88.3639 }
                    };
                    axios.post('http://localhost:5000/api/accidents', fakeData)
                        .then(() => alert("✅ Test alert sent! Check your Dashboard and Email."))
                        .catch(err => alert("❌ Test failed: " + err.message));
                }}
                style={styles.debugBtn}
            >
                Test Alert
            </button>
        </div>
    );
};

const styles = {
    debugBtn: {
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        padding: '8px 16px',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: 'white',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
        zIndex: 100,
    },
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

    liveStatusHUD: {
        fontSize: '10px',
        fontWeight: 800,
        letterSpacing: '1px',
        padding: '3px 8px',
        borderRadius: '4px',
        border: '1px solid',
        marginLeft: '10px',
        marginRight: '10px',
        transition: 'all 0.3s ease',
    },

    confidenceText: {
        marginLeft: '6px',
        opacity: 0.8,
        fontSize: '9px',
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