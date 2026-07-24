import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loading, user } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    if (user?.token) {
        navigate('/dashboard', { replace: true });
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        const result = await login(email, password);
        if (result.success) {
            // Role-aware redirect
            const role = result.data.role;
            if (role === 'responder') {
                navigate('/live-feed');
            } else {
                navigate('/dashboard');
            }
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-logo">
                    <div className="logo-icon">🚨</div>
                    <h1>APADS</h1>
                    <p>AI-Powered Accident Detection System</p>
                </div>

                {error && (
                    <div className="alert-banner" style={{ animation: 'none', marginBottom: '20px' }}>
                        <span className="alert-icon">⚠️</span>
                        <div className="alert-content">
                            <div className="alert-message">{error}</div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@apads.com"
                            autoComplete="email"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', marginTop: '8px' }}
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p style={{
                    textAlign: 'center',
                    marginTop: '20px',
                    fontSize: '0.78rem',
                    color: 'var(--color-text-muted)'
                }}>
                    Emergency monitoring console • Authorized personnel only
                </p>
            </div>
        </div>
    );
};

export default Login;