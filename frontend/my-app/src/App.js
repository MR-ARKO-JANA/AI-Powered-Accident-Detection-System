import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import NotificationCenter from './components/NotificationCenter';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import AccidentDetail from './pages/AccidentDetail';
import MapView from './pages/MapView';
import Analytics from './pages/Analytics';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import CameraFeed from './components/CameraFeed';

import './index.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <NotificationProvider>
                    <div className="app-layout">
                        <Navbar />
                        <NotificationCenter />
                        <Routes>
                            {/* Public */}
                            <Route path="/login" element={<Login />} />

                            {/* Authenticated */}
                            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                            <Route path="/live-feed" element={<PrivateRoute><CameraFeed /></PrivateRoute>} />
                            <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
                            <Route path="/accidents/:id" element={<PrivateRoute><AccidentDetail /></PrivateRoute>} />
                            <Route path="/map" element={<PrivateRoute><MapView /></PrivateRoute>} />
                            <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
                            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

                            {/* Admin Only */}
                            <Route path="/admin" element={<PrivateRoute adminOnly><AdminPanel /></PrivateRoute>} />

                            {/* Default Redirect */}
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </div>
                </NotificationProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
