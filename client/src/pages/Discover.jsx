import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Discover() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const icpId = searchParams.get('icp');

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBusinesses();
      setBusinesses(data.businesses || data || []);
    } catch (err) {
      setError(err.message || 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  }

  const industries = [...new Set(businesses.map((b) => b.industry).filter(Boolean))];
  const locations = [...new Set(businesses.map((b) => b.location).filter(Boolean))];

  const filtered = businesses.filter((b) => {
    if (filterIndustry && b.industry !== filterIndustry) return false;
    if (filterLocation && b.location !== filterLocation) return false;
    return true;
  });

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((b) => b.id)));
    }
  }

  async function handleAnalyze() {
    if (selected.size === 0) return;
    setAnalyzing(true);
    setError(null);

    try {
      const selectedBusinesses = businesses.filter((b) => selected.has(b.id));
      const result = await api.analyzeLead({
        businesses: selectedBusinesses,
        icp_id: icpId,
      });
      const jobId = result.job_id || result.id;
      if (jobId) {
        navigate(`/pipeline/${jobId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to start analysis');
      setAnalyzing(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading businesses..." />;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-header__title">Discover Businesses</h1>
        <p className="page-header__subtitle">
          Browse and select businesses to analyze with the AI pipeline.
        </p>
      </div>

      {error && (
        <div className="error-state mb-2">
          <div className="error-state__title">Error</div>
          <div className="error-state__message">{error}</div>
        </div>
      )}

      <div className="filter-bar">
        <select
          className="select"
          value={filterIndustry}
          onChange={(e) => setFilterIndustry(e.target.value)}
        >
          <option value="">All Industries</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
        <select
          className="select"
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <button className="btn btn--ghost btn--sm" onClick={selectAll}>
          {selected.size === filtered.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-secondary">
            {selected.size} business{selected.size !== 1 ? 'es' : ''} selected
          </span>
          <button
            className="btn btn--primary"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? 'Starting Analysis...' : `Analyze Selected (${selected.size})`}
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div className="empty-state__title">No businesses found</div>
          <div className="empty-state__desc">Try adjusting your filters.</div>
        </div>
      ) : (
        <div className="discovery-grid">
          {filtered.map((biz) => (
            <div
              key={biz.id}
              className={`glass-card discovery-card ${selected.has(biz.id) ? 'discovery-card--selected' : ''}`}
              onClick={() => toggleSelect(biz.id)}
              style={{
                cursor: 'pointer',
                borderColor: selected.has(biz.id) ? 'rgba(59, 130, 246, 0.4)' : undefined,
              }}
            >
              <div className="discovery-card__select">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={selected.has(biz.id)}
                  onChange={() => toggleSelect(biz.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="discovery-card__info">
                <div className="discovery-card__name">{biz.name}</div>
                <div className="discovery-card__meta">
                  {biz.industry && (
                    <Badge variant="info">{biz.industry}</Badge>
                  )}
                  {biz.location && (
                    <span>{biz.location}</span>
                  )}
                </div>
                {biz.description && (
                  <div className="discovery-card__desc">{biz.description}</div>
                )}
                {biz.website && (
                  <div className="text-xs text-muted mt-1">{biz.website}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
