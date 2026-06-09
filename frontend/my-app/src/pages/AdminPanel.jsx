import React, { useState, useEffect } from 'react';
import API from '../services/api';

const AdminPanel = () => {
        const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newContact, setNewContact] = useState({
        name: '',
        role: 'Lead Responder',
        phone: '',
        email: ''
    });
    const [formError, setFormError] = useState('');

    const fetchContacts = async () => {
        try {
            const response = await API.get('/contacts');
            if (response.data.success) {
                setContacts(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching contacts:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const [hoveredRow, setHoveredRow] = useState(null);
    const [hoveredBtn, setHoveredBtn] = useState(null);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this personnel?")) {
            try {
                await API.delete(`/contacts/${id}`);
                setContacts(contacts.filter(contact => (contact._id || contact.id) !== id));
            } catch (error) {
                console.error("Error deleting contact:", error);
            }
        }
    };

    const handleAdd = () => {
        setFormError('');
        setNewContact({
            name: '',
            role: 'Lead Responder',
            phone: '',
            email: ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { name, role, phone, email } = newContact;

        if (!name || !role || !phone) {
            setFormError("Please fill out all required fields.");
            return;
        }

        try {
            const response = await API.post('/contacts', { name, role, phone, email });
            if (response.data.success) {
                setContacts([...contacts, response.data.data]);
                setIsModalOpen(false);
            } else {
                setFormError("Failed to save personnel.");
            }
        } catch (error) {
            console.error("Error adding contact:", error);
            setFormError(error.response?.data?.message || "Error adding personnel.");
        }
    };

    const roleColors = {
        'System Admin': { bg: 'rgba(139, 92, 246, 0.12)', color: 'var(--accent-violet)', border: 'rgba(139, 92, 246, 0.25)' },
        'Lead Responder': { bg: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', border: 'rgba(6, 182, 212, 0.25)' },
        'Police Liaison': { bg: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)', border: 'rgba(16, 185, 129, 0.25)' },
    };

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>System Administration</h1>
                    <p style={styles.subtitle}>Manage emergency personnel and system configuration</p>
                </div>
                <button
                    onClick={handleAdd}
                    style={{
                        ...styles.addBtn,
                        ...(hoveredBtn === 'add' ? styles.addBtnHover : {}),
                    }}
                    onMouseEnter={() => setHoveredBtn('add')}
                    onMouseLeave={() => setHoveredBtn(null)}
                >
                    <span style={styles.addBtnIcon}>+</span>
                    Add Personnel
                </button>
            </div>

            {/* Table Panel */}
            <div style={styles.tablePanel}>
                <div style={styles.tablePanelHeader}>
                    <div style={styles.panelTitleGroup}>
                        <div style={styles.panelAccent}></div>
                        <h2 style={styles.panelTitle}>Registered Emergency Personnel</h2>
                    </div>
                    <span style={styles.countBadge}>{contacts.length} members</span>
                </div>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Personnel</th>
                                <th style={styles.th}>Role</th>
                                <th style={styles.th}>Contact</th>
                                <th style={styles.th}>Status</th>
                                <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="5" style={styles.td}>Loading...</td></tr>
                            ) : contacts.map((contact, index) => {
                                const roleStyle = roleColors[contact.role] || roleColors['System Admin'];
                                const contactId = contact._id || contact.id;
                                return (
                                    <tr
                                        key={contactId}
                                        style={{
                                            ...styles.tr,
                                            backgroundColor: hoveredRow === contactId
                                                ? 'rgba(148, 163, 184, 0.05)'
                                                : 'transparent',
                                            animation: `fadeInUp 0.4s ease forwards`,
                                            animationDelay: `${index * 0.08}s`,
                                            opacity: 0,
                                        }}
                                        onMouseEnter={() => setHoveredRow(contactId)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                    >
                                        {/* Name + Avatar */}
                                        <td style={styles.td}>
                                            <div style={styles.nameCell}>
                                                <div style={{
                                                    ...styles.avatar,
                                                    background: `linear-gradient(135deg, ${roleStyle.color}, ${roleStyle.border})`,
                                                }}>
                                                    {contact.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <div style={styles.nameText}>{contact.name}</div>
                                                    <div style={styles.idText}>ID-{String(contactId).slice(-4).toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role Badge */}
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.roleBadge,
                                                background: roleStyle.bg,
                                                color: roleStyle.color,
                                                border: `1px solid ${roleStyle.border}`,
                                            }}>
                                                {contact.role}
                                            </span>
                                        </td>

                                        {/* Phone */}
                                        <td style={styles.td}>
                                            <span style={styles.phoneText}>{contact.phone}</span>
                                        </td>

                                        {/* Status */}
                                        <td style={styles.td}>
                                            <div style={styles.statusGroup}>
                                                <span style={styles.statusDot}></span>
                                                <span style={styles.statusText}>{contact.status || 'Active'}</span>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ ...styles.td, textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDelete(contactId)}
                                                style={{
                                                    ...styles.deleteBtn,
                                                    ...(hoveredBtn === `del-${contactId}` ? styles.deleteBtnHover : {}),
                                                }}
                                                onMouseEnter={() => setHoveredBtn(`del-${contactId}`)}
                                                onMouseLeave={() => setHoveredBtn(null)}
                                            >
                                                ✕ Remove
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Empty state */}
                {contacts.length === 0 && (
                    <div style={styles.emptyState}>
                        <span style={styles.emptyIcon}>◎</span>
                        <p style={styles.emptyText}>No personnel registered</p>
                        <p style={styles.emptySub}>Add emergency contacts to get started</p>
                    </div>
                )}
            {/* Add Contact Modal */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>Add Emergency Personnel</h3>
                            <button style={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} style={styles.modalForm}>
                            {formError && <div style={styles.errorAlert}>{formError}</div>}
                            
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Full Name <span style={{color: '#f43f5e'}}>*</span></label>
                                <input
                                    type="text"
                                    required
                                    style={styles.input}
                                    placeholder="e.g. Dr. Jane Doe"
                                    value={newContact.name}
                                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Role <span style={{color: '#f43f5e'}}>*</span></label>
                                <select
                                    style={styles.select}
                                    value={newContact.role}
                                    onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                                >
                                    <option value="System Admin">System Admin</option>
                                    <option value="Lead Responder">Lead Responder</option>
                                    <option value="Police Liaison">Police Liaison</option>
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Phone Number <span style={{color: '#f43f5e'}}>*</span></label>
                                <input
                                    type="tel"
                                    required
                                    style={styles.input}
                                    placeholder="e.g. +91 98765 43210"
                                    value={newContact.phone}
                                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Email Address (Optional)</label>
                                <input
                                    type="email"
                                    style={styles.input}
                                    placeholder="e.g. jane.doe@example.com"
                                    value={newContact.email}
                                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                />
                            </div>

                            <div style={styles.formActions}>
                                <button type="button" style={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" style={styles.submitBtn}>
                                    Save Personnel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    page: {
        padding: '28px 36px',
        maxWidth: '1200px',
        margin: '0 auto',
        animation: 'fadeIn 0.4s ease',
    },

    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '28px',
        animation: 'fadeInUp 0.5s ease',
    },

    title: {
        fontSize: '28px',
        fontWeight: 800,
        color: 'var(--text-primary)',
        letterSpacing: '-0.5px',
        margin: 0,
        lineHeight: 1.2,
    },

    subtitle: {
        fontSize: '14px',
        color: 'var(--text-muted)',
        fontWeight: 400,
        marginTop: '6px',
    },

    addBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 22px',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(6, 182, 212, 0.08)',
        color: 'var(--accent-cyan)',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
        transition: 'all 0.3s ease',
        letterSpacing: '0.3px',
    },

    addBtnHover: {
        background: 'rgba(6, 182, 212, 0.15)',
        borderColor: 'var(--accent-cyan)',
        boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)',
        transform: 'translateY(-1px)',
    },

    addBtnIcon: {
        fontSize: '18px',
        fontWeight: 300,
    },

    tablePanel: {
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        animation: 'fadeInUp 0.6s ease',
    },

    tablePanelHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },

    panelTitleGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },

    panelAccent: {
        width: '3px',
        height: '18px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--accent-violet)',
        boxShadow: '0 0 8px var(--accent-violet-glow)',
    },

    panelTitle: {
        fontSize: '16px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        margin: 0,
    },

    countBadge: {
        fontSize: '12px',
        fontWeight: 600,
        padding: '5px 14px',
        borderRadius: 'var(--radius-full)',
        background: 'rgba(139, 92, 246, 0.1)',
        color: 'var(--accent-violet)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
    },

    tableWrapper: {
        overflowX: 'auto',
    },

    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0 2px',
    },

    th: {
        padding: '12px 18px',
        color: 'var(--text-muted)',
        fontWeight: 600,
        fontSize: '12px',
        letterSpacing: '0.8px',
        textTransform: 'uppercase',
        textAlign: 'left',
        borderBottom: '1px solid var(--border-glass)',
    },

    tr: {
        transition: 'background-color 0.2s ease',
        borderBottom: '1px solid var(--border-subtle)',
    },

    td: {
        padding: '16px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        verticalAlign: 'middle',
    },

    nameCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
    },

    avatar: {
        width: '40px',
        height: '40px',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        fontWeight: 700,
        color: 'white',
        flexShrink: 0,
    },

    nameText: {
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--text-primary)',
    },

    idText: {
        fontSize: '11px',
        color: 'var(--text-muted)',
        fontWeight: 500,
        marginTop: '2px',
    },

    roleBadge: {
        fontSize: '12px',
        fontWeight: 600,
        padding: '5px 12px',
        borderRadius: 'var(--radius-full)',
        display: 'inline-block',
        letterSpacing: '0.3px',
    },

    phoneText: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        fontWeight: 500,
        fontFamily: "'Inter', monospace",
        letterSpacing: '0.5px',
    },

    statusGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },

    statusDot: {
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: 'var(--accent-emerald)',
        boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)',
        display: 'inline-block',
    },

    statusText: {
        fontSize: '13px',
        color: 'var(--accent-emerald)',
        fontWeight: 600,
    },

    deleteBtn: {
        padding: '7px 16px',
        border: '1px solid rgba(244, 63, 94, 0.2)',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(244, 63, 94, 0.06)',
        color: 'var(--accent-rose)',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
        transition: 'all 0.3s ease',
        letterSpacing: '0.3px',
    },

    deleteBtnHover: {
        background: 'rgba(244, 63, 94, 0.15)',
        borderColor: 'var(--accent-rose)',
        boxShadow: '0 0 12px rgba(244, 63, 94, 0.15)',
        transform: 'translateY(-1px)',
    },

    emptyState: {
        textAlign: 'center',
        padding: '60px 20px',
    },

    emptyIcon: {
        fontSize: '48px',
        color: 'var(--text-muted)',
        opacity: 0.3,
        display: 'block',
        marginBottom: '16px',
    },

    emptyText: {
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        margin: '0 0 6px 0',
    },

    emptySub: {
        fontSize: '13px',
        color: 'var(--text-muted)',
        margin: 0,
    },

    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 7, 12, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        animation: 'fadeIn 0.25s ease',
    },

    modalContent: {
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-lg)',
        width: '450px',
        maxWidth: '90%',
        boxShadow: 'var(--shadow-lg)',
        padding: '28px',
        animation: 'fadeInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    },

    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    },

    modalTitle: {
        fontSize: '18px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        margin: 0,
    },

    modalCloseBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        fontSize: '18px',
        cursor: 'pointer',
        transition: 'color 0.2s',
    },

    modalForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
    },

    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },

    label: {
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        textAlign: 'left',
    },

    input: {
        background: 'rgba(30, 41, 59, 0.35)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 14px',
        color: 'var(--text-primary)',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.2s',
    },

    select: {
        background: 'rgba(30, 41, 59, 0.35)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 14px',
        color: 'var(--text-primary)',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.2s',
        cursor: 'pointer',
    },

    errorAlert: {
        background: 'rgba(244, 63, 94, 0.1)',
        border: '1px solid rgba(244, 63, 94, 0.2)',
        color: '#f87171',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 14px',
        fontSize: '13px',
        fontWeight: 500,
    },

    formActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '8px',
    },

    cancelBtn: {
        background: 'none',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 18px',
        color: 'var(--text-secondary)',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },

    submitBtn: {
        background: 'var(--accent-cyan)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)',
    },
};

export default AdminPanel;