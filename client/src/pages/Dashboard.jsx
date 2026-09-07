import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import ScoreBar from '../components/ScoreBar';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterClass, setFilterClass] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLeads();
      setLeads(data.leads || data || []);
    } catch (err) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const hot = leads.filter((l) => l.classification === 'HOT').length;
    const warm = leads.filter((l) => l.classification === 'WARM').length;
    const cold = leads.filter((l) => l.classification === 'COLD').length;
    const avgScore = leads.length
      ? Math.round(leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length)
      : 0;
    return { total: leads.length, hot, warm, cold, avgScore };
  }, [leads]);

  const filtered = useMemo(() => {
    let result = [...leads];
    if (filterClass) {
      result = result.filter((l) => l.classification === filterClass);
    }
    if (sortBy === 'score') {
      result.sort((a, b) => sortDir === 'desc' ? (b.score || 0) - (a.score || 0) : (a.score || 0) - (b.score || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => sortDir === 'desc'
        ? (b.name || '').localeCompare(a.name || '')
        : (a.name || '').localeCompare(b.name || '')
      );
    }
    return result;
  }, [leads, filterClass, sortBy, sortDir]);

  function handleSort(column) {
    if (sortBy === column) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  }

  function sortIndicator(column) {
    if (sortBy !== column) return '';
    return sortDir === 'desc' ? ' \u25BC' : ' \u25B2';
  }

  if (loading) return <LoadingSpinner message="Loading leads..." />;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-header__title">Lead Dashboard</h1>
        <p className="page-header__subtitle">
          Overview of all analyzed businesses with scores and classifications.
        </p>
      </div>

      {error && (
        <div className="error-state mb-2">
          <div className="error-state__title">Error</div>
          <div className="error-state__message">{error}</div>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card stat-card--blue">
          <div className="stat-card__value">{stats.total}</div>
          <div className="stat-card__label">Total Leads</div>
        </div>
        <div className="stat-card stat-card--red">
          <div className="stat-card__value">{stats.hot}</div>
          <div className="stat-card__label">Hot</div>
        </div>
        <div className="stat-card stat-card--amber">
          <div className="stat-card__value">{stats.warm}</div>
          <div className="stat-card__label">Warm</div>
        </div>
        <div className="stat-card stat-card--cyan">
          <div className="stat-card__value">{stats.cold}</div>
          <div className="stat-card__label">Cold</div>
        </div>
        <div className="stat-card stat-card--green">
          <div className="stat-card__value">{stats.avgScore}</div>
          <div className="stat-card__label">Avg Score</div>
        </div>
      </div>

      <div className="filter-bar">
        <select
          className="select"
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
        >
          <option value="">All Classifications</option>
          <option value="HOT">Hot</option>
          <option value="WARM">Warm</option>
          <option value="COLD">Cold</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
          </div>
          <div className="empty-state__title">No leads yet</div>
          <div className="empty-state__desc">
            Start by setting up your ICP and discovering businesses to analyze.
          </div>
          <button className="btn btn--primary" onClick={() => navigate('/icp')}>
            Set Up ICP
          </button>
        </div>
      ) : (
        <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th
                  className="data-table__sortable"
                  onClick={() => handleSort('name')}
                >
                  Name{sortIndicator('name')}
                </th>
                <th>Industry</th>
                <th>Location</th>
                <th
                  className="data-table__sortable"
                  onClick={() => handleSort('score')}
                >
                  Score{sortIndicator('score')}
                </th>
                <th>Classification</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => navigate(`/lead/${lead.id}`)}
                >
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {lead.name || lead.business_name}
                  </td>
                  <td>{lead.industry || '-'}</td>
                  <td>{lead.location || '-'}</td>
                  <td>
                    <span className="font-mono" style={{ fontWeight: 600 }}>
                      {lead.score || 0}
                    </span>
                  </td>
                  <td>
                    <Badge variant={(lead.classification || 'cold').toLowerCase()}>
                      {lead.classification || 'N/A'}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={getStatusVariant(lead.status)}>
                      {lead.status || 'NEW'}
                    </Badge>
                  </td>
                  <td>
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/lead/${lead.id}`);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}

function getStatusVariant(status) {
  switch ((status || '').toUpperCase()) {
    case 'NEW': return 'new';
    case 'CONTACTED': return 'contacted';
    case 'QUALIFIED': return 'qualified';
    case 'PROPOSAL': return 'proposal';
    case 'CLOSED': return 'closed';
    default: return 'neutral';
  }
}
