import React from 'react';
import { useNotifications } from '../context/NotificationContext';

const NotificationCenter = () => {
    const { notifications, dismissNotification, clearAll } = useNotifications();

    if (notifications.length === 0) return null;

    return (
        <div className="toast-container">
            {notifications.slice(0, 5).map((notif) => (
                <div key={notif.id} className={`toast toast--${notif.type || 'info'}`}>
                    <span className="toast-icon">
                        {notif.type === 'severe' ? '🚨' : notif.type === 'success' ? '✅' : 'ℹ️'}
                    </span>
                    <div className="toast-body">
                        <div className="toast-title">{notif.title}</div>
                        <div className="toast-message">{notif.message}</div>
                    </div>
                    <button
                        className="alert-dismiss"
                        onClick={() => dismissNotification(notif.id)}
                        aria-label="Dismiss"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
};

export default NotificationCenter;
