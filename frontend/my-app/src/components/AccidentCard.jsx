import React from 'react';

const AccidentCard = ({ data }) => {
    // 1. We create a boolean (true/false) to check if the severity is High
    const isHighSeverity = data.severity === 'High';

    // 2. We use ternary operators (condition ? true : false) to change colors dynamically
    const cardStyle = {
        backgroundColor: isHighSeverity ? '#fee2e2' : '#fef3c7', // Light red OR Light yellow
        borderLeft: isHighSeverity ? '6px solid #ef4444' : '6px solid #f59e0b', // Thick left border
        padding: '16px',
        marginBottom: '16px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontFamily: 'sans-serif'
    }

    const titleStyle = {
        margin: '0 0 8px 0',
        color: isHighSeverity ? '#991b1b' : '#b45309', // Dark red OR Dark yellow text
        fontSize: '1.1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    };

    const textStyle = {
        margin: '4px 0',
        color: '#374151',
        fontSize: '0.95rem'
    };

    return (
        <div style={cardStyle}>
            <h4 style={titleStyle}>
                {/* We even change the emoji based on severity! */}
                <span>{isHighSeverity ? '🚨' : '⚠️'}</span>
                {data.severity} Severity Alert
            </h4>
            <p style={textStyle}><strong>Location:</strong> {data.location}</p>
            <p style={textStyle}><strong>Time:</strong> {data.time}</p>
        </div>
    );
}

export default AccidentCard;