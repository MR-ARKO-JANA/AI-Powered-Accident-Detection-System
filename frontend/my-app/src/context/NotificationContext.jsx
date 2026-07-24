import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

export const NotificationProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [connected, setConnected] = useState(false);
    const [latestAccident, setLatestAccident] = useState(null);
    const socketRef = useRef(null);
    const audioRef = useRef(null);
    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem('apads_sound') !== 'false';
    });

    // Initialize audio
    useEffect(() => {
        // Create a simple alert sound using Web Audio API
        audioRef.current = {
            play: () => {
                if (!soundEnabled) return;
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.setValueAtTime(880, ctx.currentTime);
                    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
                    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.4);
                } catch (e) {
                    // Audio API not available — silent
                }
            }
        };
    }, [soundEnabled]);

    const addNotification = useCallback((notification) => {
        const id = Date.now() + Math.random();
        const newNotif = { id, timestamp: new Date(), ...notification };
        setNotifications(prev => [newNotif, ...prev].slice(0, 50));

        // Auto-dismiss after 8 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 8000);

        return id;
    }, []);

    const dismissNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    // Socket.IO connection
    useEffect(() => {
        if (!isAuthenticated) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setConnected(false);
            }
            return;
        }

        const socket = io(WS_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('🔌 WebSocket connected');
            setConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
            setConnected(false);
        });

        // ── Live accident events ──
        socket.on('accident:new', (accident) => {
            console.log('🚨 New accident detected:', accident);
            setLatestAccident(accident);

            addNotification({
                type: 'severe',
                title: `${accident.severity?.toUpperCase()} Accident Detected`,
                message: `${accident.location?.address || 'Unknown location'} — Camera: ${accident.camera?.name || accident.camId || 'Unknown'}`,
                data: accident
            });

            audioRef.current?.play();
        });

        socket.on('accident:statusUpdated', (data) => {
            addNotification({
                type: 'info',
                title: 'Accident Status Updated',
                message: `Accident status changed to: ${data.status?.replace('_', ' ')}`
            });
        });

        socket.on('accident:feedbackAdded', (data) => {
            addNotification({
                type: data.label === 'false_positive' ? 'info' : 'success',
                title: 'Feedback Recorded',
                message: `Accident marked as: ${data.label?.replace('_', ' ')}`
            });
        });

        socket.on('accidentDetected', (accident) => {
            // Legacy event name support
            setLatestAccident(accident);
            addNotification({
                type: 'severe',
                title: 'Accident Detected',
                message: `${accident.severity} severity — ${accident.location?.address || accident.location || 'Unknown'}`,
                data: accident
            });
            audioRef.current?.play();
        });

        socket.on('sos:new', (alert) => {
            addNotification({
                type: 'severe',
                title: `🆘 Voice SOS: ${alert.domain}`,
                message: `Severity: ${alert.severity} — ${alert.location || 'Unknown location'}`,
                data: alert
            });
            audioRef.current?.play();
        });

        socket.on('sosAlertReceived', (alert) => {
            // Legacy event name support
            addNotification({
                type: 'severe',
                title: `🆘 SOS Alert: ${alert.domain}`,
                message: `${alert.severity} — ${alert.location || 'Unknown'}`,
                data: alert
            });
            audioRef.current?.play();
        });

        socket.on('camera:updated', (camera) => {
            addNotification({
                type: 'info',
                title: 'Camera Updated',
                message: `${camera.name} — Status: ${camera.status}`
            });
        });

        return () => {
            socket.disconnect();
            setConnected(false);
        };
    }, [isAuthenticated, addNotification]);

    const toggleSound = () => {
        setSoundEnabled(prev => {
            const next = !prev;
            localStorage.setItem('apads_sound', String(next));
            return next;
        });
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            connected,
            latestAccident,
            soundEnabled,
            addNotification,
            dismissNotification,
            clearAll,
            toggleSound,
            socket: socketRef.current
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
};

export default NotificationContext;
