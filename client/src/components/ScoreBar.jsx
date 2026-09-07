export default function ScoreBar({ score = 0, classification = 'COLD', breakdown = {} }) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const classKey = classification.toLowerCase();

  const breakdownEntries = Object.entries(breakdown);

  return (
    <div className="score-bar">
      <div className="score-bar__header">
        <span className={`score-bar__value`}>
          {clampedScore}
        </span>
        <span className={`badge badge--${classKey}`}>
          {classification}
        </span>
      </div>
      <div className="score-bar__track">
        <div
          className={`score-bar__fill score-bar__fill--${classKey}`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
      {breakdownEntries.length > 0 && (
        <div className="score-bar__breakdown">
          {breakdownEntries.map(([key, value]) => (
            <div key={key} className="score-bar__breakdown-item">
              <span className="score-bar__breakdown-label">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
              </span>
              <span className="score-bar__breakdown-value">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
