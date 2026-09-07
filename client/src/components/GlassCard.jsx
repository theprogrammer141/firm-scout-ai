export default function GlassCard({ children, className = '', title, subtitle, action }) {
  return (
    <div className={`glass-card ${className}`}>
      {(title || action) && (
        <div className="glass-card__header">
          <div>
            {title && <div className="glass-card__title">{title}</div>}
            {subtitle && <div className="glass-card__subtitle">{subtitle}</div>}
          </div>
          {action && <div className="glass-card__action">{action}</div>}
        </div>
      )}
      <div className="glass-card__body">{children}</div>
    </div>
  );
}
