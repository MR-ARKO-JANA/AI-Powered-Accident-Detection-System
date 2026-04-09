import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Reports from "./pages/Reports";
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* The Navbar stays OUTSIDE the Routes so it shows on every page */}
        <Navbar />

        <Routes>
          {/* Default route redirects to Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" />} />

          {/* Your main pages */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
