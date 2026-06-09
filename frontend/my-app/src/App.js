import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Reports from "./pages/Reports";
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import PrivateRoute from './components/PrivateRoute';
import AdminPanel from './pages/AdminPanel';
import Analytics from './pages/Analytics';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          {/* The Navbar stays OUTSIDE the Routes so it shows on every page */}
          <Navbar />

          <Routes>
            {/* Default route redirects to Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" />} />

            {/* Your main pages */}
            <Route path="/admin" element={<PrivateRoute adminOnly={true}><AdminPanel /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
