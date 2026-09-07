import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Opportunities() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOpportunities();
  }, []);

  async function loadOpportunities() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLeads();
      const allLeads = data.leads || data || [];
      // Gather opportunities from all leads
      const opps = [];
      for (const lead of allLeads) {
        try {
          const oppData = await api.getLeadOpportunities(lead.id);
          const items = oppData.opportunities || oppData || [];
          if (Array.isArray(items)) {
            items.forEach((opp) => {
              opps.push({ ...opp, lead_id: lead.id, lead_name: lead.name || lead.business_name });
            });
          }
        } catch {
          // skip leads with no opportunity data
        }
      }
      setLeads(allLeads);
      setOpportunities(opps);
    } catch (err) {
      setError(err.message || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading opportunities..." />;

  const hotLeads = leads.filter((l) => l.classification === 'HOT');
  const warmLeads = leads.filter((l) => l.classification === 'WARM');

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-header__title">Opportunities</h1>
        <p className="page-header__subtitle">
          Overview of sales opportunities across all analyzed businesses.
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
          <div className="stat-card__value">{leads.length}</div>
          <div className="stat-card__label">Total Leads</div>
        </div>
        <div className="stat-card stat-card--red">
          <div className="stat-card__value">{hotLeads.length}</div>
          <div className="stat-card__label">Hot Leads</div>
        </div>
        <div className="stat-card stat-card--amber">
          <div className="stat-card__value">{warmLeads.length}</div>
          <div className="stat-card__label">Warm Leads</div>
        </div>
        <div className="stat-card stat-card--green">
          <div className="stat-card__value">{opportunities.length}</div>
          <div className="stat-card__label">Opportunities</div>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12,2 15,8.5 22,9.3 17,14 18.2,20.8 12,17.5 5.8,20.8 7,14 2,9.3 9,8.5" />
            </svg>
          </div>
          <div className="empty-state__title">No opportunities yet</div>
          <div className="empty-state__desc">
            Run the analysis pipeline on discovered businesses to identify opportunities.
          </div>
          <button className="btn btn--primary" onClick={() => navigate('/discover')}>
            Discover Businesses
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {opportunities.map((opp, i) => (
            <div
              key={i}
              className="opportunity-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/lead/${opp.lead_id}`)}
            >
              <div className="opportunity-card__header">
                <div>
                  <div className="opportunity-card__title">{opp.title || opp.name || `Opportunity ${i + 1}`}</div>
                  <div className="text-xs text-muted mt-1">
                    {opp.lead_name || `Lead ${opp.lead_id}`}
                  </div>
                </div>
                {opp.priority && (
                  <Badge variant={opp.priority === 'HIGH' ? 'hot' : opp.priority === 'MEDIUM' ? 'warm' : 'cold'}>
                    {opp.priority}
                  </Badge>
                )}
              </div>
              {opp.problem && (
                <div className="opportunity-card__section">
                  <div className="opportunity-card__section-label">Problem</div>
                  <div className="opportunity-card__section-text">{opp.problem}</div>
                </div>
              )}
              {opp.solution && (
                <div className="opportunity-card__section">
                  <div className="opportunity-card__section-label">Solution</div>
                  <div className="opportunity-card__section-text">{opp.solution}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
