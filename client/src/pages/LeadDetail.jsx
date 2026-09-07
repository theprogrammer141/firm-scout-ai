import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import ScoreBar from '../components/ScoreBar';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [research, setResearch] = useState(null);
  const [opportunities, setOpportunities] = useState(null);
  const [outreach, setOutreach] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [outreachChannel, setOutreachChannel] = useState('email');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadLead();
  }, [id]);

  async function loadLead() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLead(id);
      setLead(data.lead || data);
    } catch (err) {
      setError(err.message || 'Failed to load lead');
      setLoading(false);
      return;
    }

    // Load additional data in parallel
    const [resData, oppData, outData] = await Promise.allSettled([
      api.getLeadResearch(id),
      api.getLeadOpportunities(id),
      api.getLeadOutreach(id),
    ]);

    if (resData.status === 'fulfilled') setResearch(resData.value.research || resData.value);
    if (oppData.status === 'fulfilled') setOpportunities(oppData.value.opportunities || oppData.value || []);
    if (outData.status === 'fulfilled') setOutreach(outData.value.outreach || outData.value);
    setLoading(false);
  }

  async function handleStatusChange(newStatus) {
    setUpdating(true);
    try {
      await api.updateLeadStatus(id, { status: newStatus });
      setLead((prev) => ({ ...prev, status: newStatus }));
    } catch {
      // silently fail, user can retry
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.deleteLead(id);
      navigate('/dashboard');
    } catch {
      // ignore
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return <LoadingSpinner message="Loading lead details..." />;

  if (error || !lead) {
    return (
      <div className="error-state">
        <div className="error-state__title">Error</div>
        <div className="error-state__message">{error || 'Lead not found'}</div>
        <button className="btn btn--secondary mt-2" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const classification = (lead.classification || 'COLD').toLowerCase();
  const statusOptions = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'CLOSED'];

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-3">
        <div>
          <button className="btn btn--ghost btn--sm mb-1" onClick={() => navigate('/dashboard')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="10" y1="7" x2="4" y2="7" />
              <polyline points="7,10 4,7 7,4" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="page-header__title">{lead.name || lead.business_name}</h1>
          <p className="page-header__subtitle">
            {[lead.industry, lead.location].filter(Boolean).join(' / ') || 'Business Details'}
          </p>
        </div>
        <div className="flex gap-sm">
          <button className="btn btn--danger btn--sm" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="tabs">
        {['overview', 'research', 'opportunities', 'outreach'].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="animate-fadeIn" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <GlassCard title="Business Information">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <InfoRow label="Industry" value={lead.industry} />
              <InfoRow label="Location" value={lead.location} />
              <InfoRow label="Website" value={lead.website} />
              <InfoRow label="Size" value={lead.business_size || lead.businessSize} />
              <InfoRow label="Description" value={lead.description} />
            </div>
          </GlassCard>

          <GlassCard title="Score & Classification">
            <ScoreBar
              score={lead.score || 0}
              classification={lead.classification || 'COLD'}
              breakdown={lead.score_breakdown || lead.breakdown}
            />
            <div className="mt-2">
              <div className="form-label">Status</div>
              <select
                className="select"
                value={lead.status || 'NEW'}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </GlassCard>
        </div>
      )}

      {/* RESEARCH TAB */}
      {activeTab === 'research' && (
        <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <GlassCard title="Business Overview">
            <p>{research?.overview || research?.summary || lead.description || 'No research data available.'}</p>
          </GlassCard>

          {research?.facts && research.facts.length > 0 && (
            <GlassCard title="Observed Facts">
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {research.facts.map((fact, i) => (
                  <li key={i} className="flex items-center gap-sm">
                    <span style={{ color: 'var(--accent-cyan)', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polyline points="2 7 5.5 10.5 12 4" />
                      </svg>
                    </span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{fact}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          {research?.inferences && research.inferences.length > 0 && (
            <GlassCard title="AI Inferences">
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {research.inferences.map((inf, i) => (
                  <li key={i} className="flex items-center gap-sm">
                    <Badge variant="info">Inference</Badge>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{inf}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          {research?.digital_presence && (
            <GlassCard title="Digital Presence">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {Object.entries(research.digital_presence).map(([key, val]) => (
                  <div key={key} className="score-bar__breakdown-item">
                    <span className="score-bar__breakdown-label">{key.replace(/_/g, ' ')}</span>
                    <span className="score-bar__breakdown-value">{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* OPPORTUNITIES TAB */}
      {activeTab === 'opportunities' && (
        <div className="animate-fadeIn">
          {!opportunities || (Array.isArray(opportunities) && opportunities.length === 0) ? (
            <div className="empty-state">
              <div className="empty-state__title">No opportunities identified</div>
              <div className="empty-state__desc">Opportunities will appear here after the analysis pipeline completes.</div>
            </div>
          ) : (
            (Array.isArray(opportunities) ? opportunities : [opportunities]).map((opp, i) => (
              <div key={i} className="opportunity-card">
                <div className="opportunity-card__header">
                  <div className="opportunity-card__title">{opp.title || opp.name || `Opportunity ${i + 1}`}</div>
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
                {opp.evidence && (
                  <div className="opportunity-card__section">
                    <div className="opportunity-card__section-label">Evidence</div>
                    <div className="opportunity-card__section-text">{opp.evidence}</div>
                  </div>
                )}
                {opp.solution && (
                  <div className="opportunity-card__section">
                    <div className="opportunity-card__section-label">Solution</div>
                    <div className="opportunity-card__section-text">{opp.solution}</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* OUTREACH TAB */}
      {activeTab === 'outreach' && (
        <div className="animate-fadeIn outreach-section">
          {!outreach ? (
            <div className="empty-state">
              <div className="empty-state__title">No outreach generated</div>
              <div className="empty-state__desc">Outreach messages will appear here after the pipeline completes.</div>
            </div>
          ) : (
            <>
              <div className="outreach-tabs">
                {['email', 'linkedin', 'whatsapp'].map((ch) => (
                  <button
                    key={ch}
                    className={`tab ${outreachChannel === ch ? 'tab--active' : ''}`}
                    onClick={() => setOutreachChannel(ch)}
                  >
                    {ch.charAt(0).toUpperCase() + ch.slice(1)}
                  </button>
                ))}
              </div>
              <div className="outreach-content">
                <pre>{outreach[outreachChannel] || outreach[`${outreachChannel}_message`] || outreach[`${outreachChannel}_template`] || 'No content available for this channel.'}</pre>
                <button
                  className="btn btn--secondary btn--sm outreach-copy-btn"
                  onClick={() => copyToClipboard(
                    outreach[outreachChannel] || outreach[`${outreachChannel}_message`] || outreach[`${outreachChannel}_template`] || ''
                  )}
                >
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs text-muted" style={{ marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{value}</div>
    </div>
  );
}
