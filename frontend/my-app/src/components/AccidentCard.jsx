import React from 'react';
import { useNavigate } from 'react-router-dom';

const timeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

const severityIcon = {
    severe: '🔴',
    moderate: '🟠',
    minor: '🔵',
    Critical: '🔴',
    High: '🟠',
    Medium: '🟡'
};

const AccidentCard = ({ accident, onClick }) => {
    const navigate = useNavigate();
    const severity = accident.severity?.toLowerCase() || 'minor';

    const handleClick = () => {
        if (onClick) {
            onClick(accident);
        } else {
            navigate(`/accidents/${accident._id}`);
        }
    };

    return (
        <div
            className={`accident-card accident-card--${severity}`}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        >
            <div className="card-thumbnail">
                {accident.evidence?.imageUrl ? (
                    <img
                        src={accident.evidence.imageUrl}
                        alt="Evidence"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                        onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = severityIcon[severity] || '⚠️'; }}
                    />
                ) : (
                    severityIcon[severity] || '⚠️'
                )}
            </div>

            <div className="card-body">
                <div className="card-header">
                    <span className={`severity-badge severity-badge--${severity}`}>
                        {severity}
                    </span>
                    <span className={`status-badge status-badge--${accident.status || 'needs_review'}`}>
                        {(accident.status || 'needs_review').replace('_', ' ')}
                    </span>
                </div>

                <div className="card-location">
                    {accident.location?.address || accident.location || 'Unknown Location'}
                </div>

                <div className="card-meta">
                    <span className="card-time">
                        {timeAgo(accident.detectedAt || accident.createdAt)}
                    </span>
                    <span>
                        📹 {accident.camera?.name || accident.camId || 'Unknown'}
                    </span>
                    {accident.confidence && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                            {(accident.confidence * 100).toFixed(0)}% conf
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccidentCard;