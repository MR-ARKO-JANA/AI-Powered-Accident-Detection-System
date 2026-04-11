import React, { useState, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [isHoveredBtn, setIsHoveredBtn] = useState(false);

    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleLogin = (e) => {
        e.preventDefault();

        if (email && password) {
            setIsLoading(true);
            // Simulate API call delay
            setTimeout(() => {
                login('dummy_jwt_token_123');
                navigate('/dashboard');
            }, 1200);
        } else {
            alert("Please enter both email and password.");
        }
    };

    return (
        <div style={styles.page}>
            {/* Animated Background Orbs */}
            <div style={styles.bgOrb1}></div>
            <div style={styles.bgOrb2}></div>
            <div style={styles.bgOrb3}></div>

            {/* Login Card */}
            <form onSubmit={handleLogin} style={styles.card}>

                {/* Logo Section */}
                <div style={styles.logoSection}>
                    <div style={styles.logoIcon}>⬢</div>
                    <h1 style={styles.logoTitle}>APADS</h1>
                    <p style={styles.logoSubtitle}>AI-Powered Accident Detection System</p>
                </div>

                {/* Divider */}
                <div style={styles.divider}>
                    <div style={styles.dividerLine}></div>
                    <span style={styles.dividerText}>SECURE LOGIN</span>
                    <div style={styles.dividerLine}></div>
                </div>

                {/* Email Field */}
                <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                        <span style={styles.labelIcon}>✉</span>
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        style={{
                            ...styles.input,
                            borderColor: focusedField === 'email' ? 'var(--accent-cyan)' : 'var(--border-glass)',
                            boxShadow: focusedField === 'email'
                                ? '0 0 0 3px rgba(6, 182, 212, 0.15), var(--shadow-sm)'
                                : 'var(--shadow-sm)',
                        }}
                        placeholder="admin@apads.system"
                    />
                </div>

                {/* Password Field */}
                <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                        <span style={styles.labelIcon}>🔒</span>
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        style={{
                            ...styles.input,
                            borderColor: focusedField === 'password' ? 'var(--accent-cyan)' : 'var(--border-glass)',
                            boxShadow: focusedField === 'password'
                                ? '0 0 0 3px rgba(6, 182, 212, 0.15), var(--shadow-sm)'
                                : 'var(--shadow-sm)',
                        }}
                        placeholder="••••••••••"
                    />
                </div>

                {/* Remember + Forgot */}
                <div style={styles.optionsRow}>
                    <label style={styles.checkboxLabel}>
                        <input type="checkbox" style={styles.checkbox} />
                        <span style={styles.checkboxText}>Remember me</span>
                    </label>
                    <span style={styles.forgotLink}>Forgot password?</span>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        ...styles.submitBtn,
                        ...(isHoveredBtn && !isLoading ? styles.submitBtnHover : {}),
                        ...(isLoading ? styles.submitBtnLoading : {}),
                    }}
                    onMouseEnter={() => setIsHoveredBtn(true)}
                    onMouseLeave={() => setIsHoveredBtn(false)}
                >
                    {isLoading ? (
                        <div style={styles.loadingGroup}>
                            <span style={styles.spinner}></span>
                            Authenticating...
                        </div>
                    ) : (
                        'Access System →'
                    )}
                </button>

                {/* Footer */}
                <p style={styles.footer}>
                    Protected by AI-powered security protocols
                </p>
            </form>
        </div>
    );
};

const styles = {
    page: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - var(--navbar-height))',
        padding: '40px 20px',
        position: 'relative',
        overflow: 'hidden',
    },

    // Animated background orbs
    bgOrb1: {
        position: 'fixed',
        top: '-15%',
        left: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)',
        animation: 'float 8s ease-in-out infinite',
        pointerEvents: 'none',
    },
    bgOrb2: {
        position: 'fixed',
        bottom: '-20%',
        right: '-10%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
        animation: 'float 10s ease-in-out infinite reverse',
        pointerEvents: 'none',
    },
    bgOrb3: {
        position: 'fixed',
        top: '50%',
        left: '60%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
        animation: 'float 12s ease-in-out infinite',
        pointerEvents: 'none',
    },

    card: {
        width: '100%',
        maxWidth: '440px',
        padding: '44px 40px',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-glass)',
        boxShadow: '0 0 60px rgba(6, 182, 212, 0.06), var(--shadow-lg)',
        animation: 'fadeInUp 0.6s ease',
        position: 'relative',
        zIndex: 1,
    },

    logoSection: {
        textAlign: 'center',
        marginBottom: '28px',
    },

    logoIcon: {
        fontSize: '48px',
        color: 'var(--accent-cyan)',
        filter: 'drop-shadow(0 0 16px rgba(6, 182, 212, 0.5))',
        marginBottom: '12px',
        display: 'block',
        animation: 'float 4s ease-in-out infinite',
    },

    logoTitle: {
        fontSize: '32px',
        fontWeight: 900,
        letterSpacing: '4px',
        background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-emerald))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        margin: '0 0 6px 0',
    },

    logoSubtitle: {
        fontSize: '12px',
        color: 'var(--text-muted)',
        fontWeight: 500,
        letterSpacing: '1px',
        textTransform: 'uppercase',
    },

    divider: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '28px',
    },

    dividerLine: {
        flex: 1,
        height: '1px',
        background: 'var(--border-glass)',
    },

    dividerText: {
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '2px',
        color: 'var(--text-muted)',
    },

    fieldGroup: {
        marginBottom: '20px',
    },

    label: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '8px',
        color: 'var(--text-secondary)',
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '0.3px',
    },

    labelIcon: {
        fontSize: '13px',
    },

    input: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-glass)',
        background: 'rgba(15, 23, 42, 0.5)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        fontWeight: 500,
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
        outline: 'none',
    },

    optionsRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    },

    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
    },

    checkbox: {
        accentColor: 'var(--accent-cyan)',
        width: '15px',
        height: '15px',
    },

    checkboxText: {
        fontSize: '13px',
        color: 'var(--text-muted)',
        fontWeight: 500,
    },

    forgotLink: {
        fontSize: '13px',
        color: 'var(--accent-cyan)',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'color 0.3s ease',
    },

    submitBtn: {
        width: '100%',
        padding: '15px',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, var(--accent-cyan), #0891b2)',
        color: 'white',
        fontSize: '15px',
        fontWeight: 700,
        letterSpacing: '0.5px',
        cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 16px rgba(6, 182, 212, 0.3)',
    },

    submitBtnHover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 24px rgba(6, 182, 212, 0.4)',
        background: 'linear-gradient(135deg, #0891b2, var(--accent-cyan))',
    },

    submitBtnLoading: {
        opacity: 0.8,
        cursor: 'wait',
    },

    loadingGroup: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
    },

    spinner: {
        width: '18px',
        height: '18px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderTopColor: 'white',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 0.8s linear infinite',
    },

    footer: {
        textAlign: 'center',
        marginTop: '24px',
        fontSize: '11px',
        color: 'var(--text-muted)',
        fontWeight: 500,
        letterSpacing: '0.5px',
    },
};

export default Login;