import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Initialize socket connection when user is logged in
    useEffect(() => {
        if (!user || !user.isAuthenticated) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const socketUrl = process.env.REACT_APP_API_URL || undefined;
        const newSocket = io(socketUrl);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('📡 Connected to APADS shared WebSocket');
        });

        // Request browser push notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    // Handle WebSocket events
    useEffect(() => {
        if (!socket) return;

        const showPushNotification = (title, body, iconUrl) => {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, {
                    body,
                    icon: iconUrl || '/logo192.png'
                });
            }
        };

        const playAlertSound = () => {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch beep
                gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.3);
            } catch (e) {
                console.error('Audio beep failed:', e);
            }
        };

        // Real-time accident alert listener
        const handleAccident = (newAccident) => {
            const notif = {
                id: `accident-${newAccident._id || Date.now()}`,
                type: 'accident',
                title: `🚨 Accident: ${newAccident.severity} severity`,
                message: `Location: ${newAccident.location} | Cam: ${newAccident.camId}`,
                time: new Date(newAccident.createdAt || Date.now()),
                unread: true,
                data: newAccident
            };

            setNotifications(prev => [notif, ...prev.slice(0, 19)]); // limit to recent 20
            setUnreadCount(prev => prev + 1);
            playAlertSound();
            showPushNotification(notif.title, notif.message, newAccident.mediaUrl);
        };

        // Real-time SOS alert listener
        const handleSos = (newSOS) => {
            const notif = {
                id: `sos-${newSOS._id || Date.now()}`,
                type: 'sos',
                title: `🚑 Voice SOS Alert: ${newSOS.domain}`,
                message: `Location: ${newSOS.location} | Conf: ${(newSOS.confidence * 100).toFixed(0)}%`,
                time: new Date(newSOS.createdAt || Date.now()),
                unread: true,
                data: newSOS
            };

            setNotifications(prev => [notif, ...prev.slice(0, 19)]); // limit to recent 20
            setUnreadCount(prev => prev + 1);
            playAlertSound();
            showPushNotification(notif.title, notif.message);
        };

        // Accident status updated listener
        const handleAccidentStatus = ({ id, status }) => {
            setNotifications(prev => prev.map(n => {
                if (n.type === 'accident' && n.data._id === id) {
                    return {
                        ...n,
                        message: `${n.message.split(' | Status:')[0]} | Status: ${status}`,
                        data: { ...n.data, status }
                    };
                }
                return n;
            }));
        };

        // Accident deleted listener
        const handleAccidentDeleted = ({ id }) => {
            setNotifications(prev => {
                const target = prev.find(n => n.type === 'accident' && n.data._id === id);
                if (target && target.unread) {
                    setUnreadCount(u => Math.max(0, u - 1));
                }
                return prev.filter(n => !(n.type === 'accident' && n.data._id === id));
            });
        };

        // SOS cancelled listener
        const handleSosCancelled = ({ id }) => {
            setNotifications(prev => prev.map(n => {
                if (n.type === 'sos' && n.data._id === id) {
                    return {
                        ...n,
                        title: `<s>${n.title} (Cancelled)</s>`,
                        data: { ...n.data, cancelled: true }
                    };
                }
                return n;
            }));
        };

        socket.on('accidentDetected', handleAccident);
        socket.on('sosAlertReceived', handleSos);
        socket.on('accidentStatusUpdated', handleAccidentStatus);
        socket.on('accidentDeleted', handleAccidentDeleted);
        socket.on('sosCancelled', handleSosCancelled);

        return () => {
            socket.off('accidentDetected', handleAccident);
            socket.off('sosAlertReceived', handleSos);
            socket.off('accidentStatusUpdated', handleAccidentStatus);
            socket.off('accidentDeleted', handleAccidentDeleted);
            socket.off('sosCancelled', handleSosCancelled);
        };
    }, [socket]);

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
        setUnreadCount(0);
    };

    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    return (
        <NotificationContext.Provider value={{
            socket,
            notifications,
            unreadCount,
            markAllAsRead,
            clearNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
