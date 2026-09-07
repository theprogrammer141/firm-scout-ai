import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function IcpSetup() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('text');
  const [scenarios, setScenarios] = useState([]);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Free-text mode
  const [description, setDescription] = useState('');

  // Structured mode
  const [form, setForm] = useState({
    industry: '',
    location: '',
    businessSize: '',
    services: '',
    budgetRange: '',
  });

  useEffect(() => {
    loadScenarios();
  }, []);

  async function loadScenarios() {
    setLoadingScenarios(true);
    try {
      const data = await api.getScenarios();
      setScenarios(data.scenarios || data || []);
    } catch {
      setScenarios([]);
    } finally {
      setLoadingScenarios(false);
    }
  }

  function handleScenarioLoad(scenario) {
    if (scenario.description) {
      setMode('text');
      setDescription(scenario.description);
    } else {
      setMode('structured');
      setForm({
        industry: scenario.industry || '',
        location: scenario.location || '',
        businessSize: scenario.businessSize || scenario.business_size || '',
        services: scenario.services || '',
        budgetRange: scenario.budgetRange || scenario.budget_range || '',
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const body = mode === 'text'
        ? { description }
        : {
            industry: form.industry,
            location: form.location,
            businessSize: form.businessSize,
            services: form.services,
            budgetRange: form.budgetRange,
          };

      const result = await api.analyzeIcp(body);
      const icpId = result.icp_id || result.id || 'current';
      navigate(`/discover?icp=${encodeURIComponent(icpId)}`);
    } catch (err) {
      setError(err.message || 'Failed to analyze ICP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-header__title">Ideal Customer Profile</h1>
        <p className="page-header__subtitle">
          Define your target market to guide the AI pipeline in finding the right businesses.
        </p>
      </div>

      {scenarios.length > 0 && (
        <div className="mb-3">
          <h4 className="mb-2" style={{ fontSize: '0.9rem' }}>Demo Scenarios</h4>
          {loadingScenarios ? (
            <LoadingSpinner message="Loading scenarios..." />
          ) : (
            <div className="icp-scenarios">
              {scenarios.map((s, i) => (
                <div
                  key={i}
                  className="icp-scenario-card"
                  onClick={() => handleScenarioLoad(s)}
                >
                  <div className="icp-scenario-card__title">{s.name || s.title || `Scenario ${i + 1}`}</div>
                  <div className="icp-scenario-card__desc">{s.description || s.summary || ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <GlassCard>
        <div className="icp-mode-toggle">
          <button
            className={`btn ${mode === 'text' ? 'btn--primary' : 'btn--ghost'} btn--sm`}
            onClick={() => setMode('text')}
          >
            Free-Text Description
          </button>
          <button
            className={`btn ${mode === 'structured' ? 'btn--primary' : 'btn--ghost'} btn--sm`}
            onClick={() => setMode('structured')}
          >
            Structured Form
          </button>
        </div>

        {error && (
          <div className="error-state mb-2">
            <div className="error-state__title">Error</div>
            <div className="error-state__message">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'text' ? (
            <div className="form-group">
              <label className="form-label" htmlFor="icp-description">
                Describe your ideal customer
              </label>
              <textarea
                id="icp-description"
                className="textarea"
                rows={6}
                placeholder="e.g., We offer digital marketing services to small dental practices in the US with 2-10 employees and annual revenue under $2M..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <div className="form-hint">
                Be specific about industry, location, size, and the services you offer.
              </div>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="icp-industry">Industry</label>
                <input
                  id="icp-industry"
                  className="input"
                  placeholder="e.g., Dental Practices, Restaurants, Law Firms"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="icp-location">Location</label>
                <input
                  id="icp-location"
                  className="input"
                  placeholder="e.g., United States, New York, Remote"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="icp-size">Business Size</label>
                <input
                  id="icp-size"
                  className="input"
                  placeholder="e.g., 2-10 employees, under $2M revenue"
                  value={form.businessSize}
                  onChange={(e) => setForm({ ...form, businessSize: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="icp-services">Services You Offer</label>
                <textarea
                  id="icp-services"
                  className="textarea"
                  rows={3}
                  placeholder="e.g., SEO, social media management, Google Ads, website design"
                  value={form.services}
                  onChange={(e) => setForm({ ...form, services: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="icp-budget">Budget Range</label>
                <input
                  id="icp-budget"
                  className="input"
                  placeholder="e.g., $500-$2000/month"
                  value={form.budgetRange}
                  onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Analyzing...' : 'Analyze ICP'}
            {!submitting && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="2" y1="7" x2="12" y2="7" />
                <polyline points="8,3 12,7 8,11" />
              </svg>
            )}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
