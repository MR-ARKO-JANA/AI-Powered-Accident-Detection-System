import React, { useState, useEffect } from 'react';
import { accidentAPI } from '../services/api';
import AccidentCard from '../components/AccidentCard';

const Reports = () => {
    const [accidents, setAccidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [filters, setFilters] = useState({
        severity: '', status: '', startDate: '', endDate: ''
    });

    const fetchAccidents = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (filters.severity) params.severity = filters.severity;
            if (filters.status) params.status = filters.status;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const res = await accidentAPI.getAll(params);
            setAccidents(res.data.data);
            setPagination(res.data.pagination);
        } catch (error) {
            console.error('Failed to fetch accidents:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAccidents(); }, [page, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Accident Reports</h1>
                    <p className="page-subtitle">
                        {pagination.total || 0} total records
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <select
                    className="form-select"
                    value={filters.severity}
                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                >
                    <option value="">All Severities</option>
                    <option value="severe">Severe</option>
                    <option value="moderate">Moderate</option>
                    <option value="minor">Minor</option>
                </select>

                <select
                    className="form-select"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="needs_review">Needs Review</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="false_positive">False Positive</option>
                    <option value="resolved">Resolved</option>
                </select>

                <input
                    type="date"
                    className="form-input"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    placeholder="Start Date"
                />

                <input
                    type="date"
                    className="form-input"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    placeholder="End Date"
                />

                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                        setFilters({ severity: '', status: '', startDate: '', endDate: '' });
                        setPage(1);
                    }}
                >
                    Clear
                </button>
            </div>

            {/* Results */}
            {loading ? (
                <div className="accident-grid">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="card">
                            <div className="skeleton" style={{ height: '80px' }}></div>
                        </div>
                    ))}
                </div>
            ) : accidents.length > 0 ? (
                <div className="accident-grid">
                    {accidents.map((accident) => (
                        <AccidentCard key={accident._id} accident={accident} />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <div className="empty-title">No accidents found</div>
                    <p>Try adjusting your filters.</p>
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="pagination">
                    <button
                        className="page-btn"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        ← Prev
                    </button>
                    {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                            <button
                                key={pageNum}
                                className={`page-btn ${page === pageNum ? 'active' : ''}`}
                                onClick={() => setPage(pageNum)}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                    <button
                        className="page-btn"
                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                        disabled={page === pagination.pages}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
};

export default Reports;