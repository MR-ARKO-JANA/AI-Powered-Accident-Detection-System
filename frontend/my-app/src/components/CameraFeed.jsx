import React from 'react';

const CameraFeed = () => {
    // 1. Style for the main black box
    const containerStyle = {
        backgroundColor: '#111827', // Dark background
        height: '400px',            // Large height
        width: '100%',              // Take up full width of its column
        borderRadius: '10px',       // Slightly rounded corners
        display: 'flex',            // Use flexbox...
        justifyContent: 'center',   // ...to center text horizontally
        alignItems: 'center',       // ...to center text vertically
        position: 'relative',       // Crucial for the REC badge positioning!
        color: '#9ca3af',           // Light gray text
        fontFamily: 'monospace',
        border: '2px solid #374151'
    }

    // 2. Style for the container holding the dot and "REC" text
    const recContainerStyle = {
        position: 'absolute',       // Pulls it out of normal flow
        top: '20px',                // 20px from the top edge
        left: '20px',               // 20px from the left edge
        display: 'flex',
        alignItems: 'center',
        gap: '8px',                 // Space between dot and text
        color: '#ef4444',           // Red text
        fontWeight: 'bold',
        letterSpacing: '2px'
    }

    // 3. Style for the actual red dot
    const redDotStyle = {
        width: '12px',
        height: '12px',
        backgroundColor: '#ef4444', // Red color
        borderRadius: '50%',        // Makes it a perfect circle
    }

    return (
        <div style={containerStyle}>
            {/* The Bonus: REC Badge positioned in the corner */}
            <div style={recContainerStyle}>
                <div style={redDotStyle}>

                </div>
                <span>REC</span>
            </div>
        </div>
    )

}

export default CameraFeed;