import React from 'react';
// 1. Import our newly created components
import CameraFeed from '../components/CameraFeed';
import AccidentCard from '../components/AccidentCard';

const Dashboard = () => {
    // 2. The mock data representing what the Node.js backend will send
    const mockAlerts = [
        { id: 1, location: "Main Street Intersection", severity: "High", time: "10:45 AM" },
        { id: 2, location: "Highway 42, Mile 8", severity: "Low", time: "09:12 AM" }
    ];

    // --- STYLES ---
    const pageContainerStyle = {
        padding: '24px',
        maxWidth: '1200px', // Prevents it from getting too wide on huge monitors
        margin: '0 auto',   // Centers the dashboard on the screen
        fontFamily: 'sans-serif'
    };

    const headerStyle = {
        marginBottom: '24px',
        color: '#1f2937',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '16px'
    };

    const gridLayoutStyle = {
        display: 'grid',
        // This is the magic CSS Grid line: 
        // It creates two columns. The first takes up 2 "fractions" of space, the second takes 1.
        gridTemplateColumns: '2fr 1fr',
        gap: '24px' // Space between the left and right columns
    };

    const columnHeaderStyle = {
        marginTop: '0',
        marginBottom: '16px',
        color: '#4b5563',
        fontSize: '1.2rem'
    };

    return (
        <div style={pageContainerStyle}>
            <h2 style={headerStyle}>Command Center Dashboard</h2>

            {/* The Two-Column Grid Container */}
            <div style={gridLayoutStyle}>

                {/* LEFT COLUMN: The Camera Feed */}
                <div>
                    <h3 style={columnHeaderStyle}>Live Surveillance</h3>
                    {/* We simply drop the component here */}
                    <CameraFeed />
                </div>

                {/* RIGHT COLUMN: The Alert Log */}
                <div>
                    <h3 style={columnHeaderStyle}>Recent Detections</h3>
                    {/* We map through the array and render an AccidentCard for each item */}
                    {mockAlerts.map(alert => (
                        <AccidentCard
                            key={alert.id} // React needs a unique key for every item in a list
                            data={alert}   // Passing the specific alert object into the "data" doorway
                        />
                    ))}
                </div>

            </div>
        </div>
    );
};

export default Dashboard;