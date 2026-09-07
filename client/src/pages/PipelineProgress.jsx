import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import usePolling from '../hooks/usePolling';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';

const STAGES = [
  'icp_analysis',
  'discovery',
  'digital_presence',
  'needs_inference',
  'service_match',
  'budget_estimation',
  'urgency_scoring',
  'risk_assessment',
  'outreach_generation',
];

const STAGE_LABELS = {
  icp_analysis: 'ICP Analysis',
  discovery: 'Business Discovery',
  digital_presence: 'Digital Presence Scan',
  needs_inference: 'Needs Inference',
  service_match: 'Service Matching',
  budget_estimation: 'Budget Estimation',
  urgency_scoring: 'Urgency Scoring',
  risk_assessment: 'Risk Assessment',
  outreach_generation: 'Outreach Generation',
};

export default function PipelineProgress() {
  const { jobId } = useParams();

  const { data: job, error, loading } = usePolling(
    () => api.getJob(jobId),
    2000,
    [jobId]
  );

  if (loading && !job) {
    return <LoadingSpinner message="Connecting to pipeline..." />;
  }

  if (error) {
    return (
      <div className="error-state">
        <div className="error-state__title">Pipeline Error</div>
        <div className="error-state__message">{error.message || 'Failed to connect to the analysis pipeline.'}</div>
        <Link to="/discover" className="btn btn--secondary mt-2" style={{ display: 'inline-flex' }}>
          Back to Discovery
        </Link>
      </div>
    );
  }

  const currentStage = job?.current_stage || job?.stage || '';
  const stageStatus = job?.stage_status || job?.stages || {};
  const isComplete = job?.status === 'completed' || job?.status === 'done';
  const isFailed = job?.status === 'failed' || job?.status === 'error';
  const leadId = job?.lead_id || job?.result?.lead_id;

  function getStageState(stage) {
    if (isComplete) return 'completed';
    if (stageStatus[stage] === 'completed' || stageStatus[stage] === 'done') return 'completed';
    if (stage === currentStage) return 'active';
    return 'pending';
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-header__title">Pipeline Progress</h1>
        <p className="page-header__subtitle">
          {isComplete
            ? 'Analysis complete.'
            : isFailed
            ? 'Pipeline encountered an error.'
            : 'Running the 7-agent analysis pipeline...'}
        </p>
      </div>

      <GlassCard>
        <div className="flex items-center gap-md mb-3">
          <Badge variant={isComplete ? 'success' : isFailed ? 'hot' : 'info'}>
            {job?.status || 'running'}
          </Badge>
          <span className="text-sm text-muted font-mono">
            Job: {jobId}
          </span>
        </div>

        <div className="pipeline">
          {STAGES.map((stage, idx) => {
            const state = getStageState(stage);
            return (
              <div key={stage} className={`pipeline__stage pipeline__stage--${state}`}>
                <div className="pipeline__stage-icon">
                  {state === 'completed' ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2 7 5.5 10.5 12 4" />
                    </svg>
                  ) : state === 'active' ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="7" cy="7" r="3" />
                    </svg>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <div className="pipeline__stage-name">
                  {STAGE_LABELS[stage] || stage.replace(/_/g, ' ')}
                </div>
                <div className="pipeline__stage-status">
                  {state === 'completed' && 'Done'}
                  {state === 'active' && 'Running...'}
                  {state === 'pending' && 'Pending'}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {isComplete && (
        <GlassCard className="mt-2" title="Analysis Complete">
          <p className="mb-2">
            The analysis pipeline has finished processing. Review the results in the lead dashboard.
          </p>
          <div className="flex gap-sm">
            {leadId ? (
              <Link to={`/lead/${leadId}`} className="btn btn--primary">
                View Lead Details
              </Link>
            ) : null}
            <Link to="/dashboard" className="btn btn--secondary">
              Go to Dashboard
            </Link>
          </div>
        </GlassCard>
      )}

      {isFailed && (
        <GlassCard className="mt-2">
          <div className="error-state">
            <div className="error-state__title">Pipeline Failed</div>
            <div className="error-state__message">
              {job?.error || job?.message || 'An unknown error occurred during the analysis.'}
            </div>
          </div>
          <div className="flex gap-sm mt-2">
            <Link to="/discover" className="btn btn--secondary">
              Try Again
            </Link>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
