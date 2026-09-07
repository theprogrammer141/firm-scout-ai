import { Link } from 'react-router-dom';

const pipelineStages = [
  {
    title: 'Digital Presence Scan',
    description: 'Analyzes website, social profiles, and online footprint',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    title: 'Needs Inference',
    description: 'AI infers business needs from observed signals and patterns',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 4 12.7V17H8v-2.3A7 7 0 0 1 12 2z" />
      </svg>
    ),
  },
  {
    title: 'Service Match',
    description: 'Maps your services to inferred business needs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    title: 'Budget Estimation',
    description: 'Estimates potential budget range for your services',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    title: 'Urgency Scoring',
    description: 'Evaluates time-sensitivity based on market signals',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: 'Risk Assessment',
    description: 'Identifies potential risks and disqualifying factors',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    title: 'Outreach Generation',
    description: 'Creates personalized email, LinkedIn, and WhatsApp messages',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
];

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing__content">
        <div className="landing__badge animate-fadeIn">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="7,1 8.8,5 13,5.5 9.8,8.5 10.8,12.5 7,10.2 3.2,12.5 4.2,8.5 1,5.5 5.2,5" />
          </svg>
          7-Agent AI Pipeline
        </div>

        <h1 className="landing__title animate-slideUp">
          AI-Powered Sales Intelligence
        </h1>

        <p className="landing__subtitle animate-slideUp" style={{ animationDelay: '0.1s' }}>
          Discover, analyze, and engage your ideal customers with a multi-agent
          AI pipeline that scores leads, infers needs, and generates personalized
          outreach -- all from a single business description.
        </p>

        <div className="landing__cta animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <Link to="/icp" className="btn btn--primary btn--lg">
            Get Started
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="8" x2="13" y2="8" />
              <polyline points="9,4 13,8 9,12" />
            </svg>
          </Link>
        </div>

        <div className="landing__features">
          {pipelineStages.map((stage, idx) => (
            <div
              key={stage.title}
              className="glass-card landing__feature animate-slideUp"
              style={{ animationDelay: `${0.3 + idx * 0.08}s` }}
            >
              <div className="landing__feature-icon">{stage.icon}</div>
              <div className="landing__feature-title">{stage.title}</div>
              <div className="landing__feature-desc">{stage.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
