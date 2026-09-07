import { useState, useEffect } from 'react';
import { api } from '../api';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Settings() {
  const [aiStatus, setAiStatus] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError(null);

    const [statusRes, configRes] = await Promise.allSettled([
      api.getAiStatus(),
      api.getConfig(),
    ]);

    if (statusRes.status === 'fulfilled') setAiStatus(statusRes.value);
    if (configRes.status === 'fulfilled') setConfig(configRes.value);

    if (statusRes.status === 'rejected' && configRes.status === 'rejected') {
      setError('Failed to load settings');
    }

    setLoading(false);
  }

  async function handleProbe() {
    setProbing(true);
    setProbeResult(null);
    try {
      const result = await api.probeAi();
      setProbeResult(result);
    } catch (err) {
      setProbeResult({ success: false, error: err.message });
    } finally {
      setProbing(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading settings..." />;

  const isConfigured = aiStatus?.configured || aiStatus?.is_configured;
  const isReachable = aiStatus?.reachable || aiStatus?.is_reachable;
  const lastCheck = aiStatus?.last_check || aiStatus?.last_checked;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-header__title">Settings</h1>
        <p className="page-header__subtitle">
          Manage AI connection, configuration, and system status.
        </p>
      </div>

      {error && (
        <div className="error-state mb-2">
          <div className="error-state__title">Error</div>
          <div className="error-state__message">{error}</div>
        </div>
      )}

      {/* AI Connection Status */}
      <div className="settings-section">
        <h3 className="settings-section__title">AI Connection Status</h3>
        <GlassCard>
          <div className="settings-row">
            <span className="settings-row__label">Status</span>
            <span className="status-indicator">
              <span className={`status-dot status-dot--${isConfigured ? (isReachable ? 'green' : 'amber') : 'red'}`} />
              <span className="settings-row__value">
                {isConfigured ? (isReachable ? 'Connected' : 'Configured but unreachable') : 'Not configured'}
              </span>
            </span>
          </div>

          {lastCheck && (
            <div className="settings-row">
              <span className="settings-row__label">Last Check</span>
              <span className="settings-row__value">{new Date(lastCheck).toLocaleString()}</span>
            </div>
          )}

          {aiStatus?.model && (
            <div className="settings-row">
              <span className="settings-row__label">Model</span>
              <span className="settings-row__value">{aiStatus.model}</span>
            </div>
          )}

          {aiStatus?.models && (
            <div className="settings-row">
              <span className="settings-row__label">Models</span>
              <span className="settings-row__value">{Array.isArray(aiStatus.models) ? aiStatus.models.join(', ') : aiStatus.models}</span>
            </div>
          )}

          <div className="mt-2">
            <button className="btn btn--primary btn--sm" onClick={handleProbe} disabled={probing}>
              {probing ? 'Testing...' : 'Test Connection'}
            </button>

            {probeResult && (
              <div className="mt-2">
                <Badge variant={probeResult.success !== false ? 'success' : 'hot'}>
                  {probeResult.success !== false ? 'Connection successful' : 'Connection failed'}
                </Badge>
                {probeResult.latency && (
                  <span className="text-sm text-muted" style={{ marginLeft: '0.75rem' }}>
                    Latency: {probeResult.latency}ms
                  </span>
                )}
                {probeResult.error && (
                  <div className="text-sm mt-1" style={{ color: 'var(--accent-red)' }}>
                    {probeResult.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {!isConfigured && (
            <div className="mt-2" style={{
              padding: '1rem',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <h5 style={{ color: 'var(--accent-amber)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                AI Not Configured
              </h5>
              <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                To enable the AI analysis pipeline, configure your AI provider credentials.
                Set the <code>DASHSCOPE_API_KEY</code> or <code>OPENAI_API_KEY</code> environment
                variable on the server and restart the backend.
              </p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Telemetry */}
      {(aiStatus?.telemetry || aiStatus?.stats) && (
        <div className="settings-section">
          <h3 className="settings-section__title">Telemetry</h3>
          <GlassCard>
            {Object.entries(aiStatus.telemetry || aiStatus.stats || {}).map(([key, val]) => (
              <div key={key} className="settings-row">
                <span className="settings-row__label">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
                <span className="settings-row__value">{typeof val === 'object' ? JSON.stringify(val) : val}</span>
              </div>
            ))}
          </GlassCard>
        </div>
      )}

      {/* Configuration */}
      {config && (
        <div className="settings-section">
          <h3 className="settings-section__title">Configuration</h3>
          <GlassCard>
            {Object.entries(config).map(([key, val]) => (
              <div key={key} className="settings-row">
                <span className="settings-row__label">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
                <span className="settings-row__value">
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </span>
              </div>
            ))}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
