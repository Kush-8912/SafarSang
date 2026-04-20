import { ShieldAlert, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useTripContext } from '../../context/TripContext';

const SEVERITY_CONFIG = {
  high:   { icon: AlertTriangle, color: 'var(--coral-400)',  bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   label: 'HIGH' },
  medium: { icon: AlertCircle,  color: 'var(--amber-400)',  bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  label: 'MEDIUM' },
  low:    { icon: Info,         color: 'var(--sky-400)',    bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)',  label: 'LOW' },
};

/**
 * RiskFlags — computed danger indicators using the memoized riskFlags from TripContext.
 */
const RiskFlags = () => {
  const { riskFlags } = useTripContext();

  return (
    <div className="risk-wrap animate-fade-in">
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--coral-400)' }}>
            <ShieldAlert size={18} />
          </span>
          Risk Flags
        </div>
        <span className="risk-count-badge">
          {riskFlags.filter((f) => f.severity === 'high').length} critical
        </span>
      </div>

      {riskFlags.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '2.5rem' }}>✅</div>
          <h4>All clear!</h4>
          <p>No risk flags detected for this trip</p>
        </div>
      ) : (
        <div className="risk-list">
          {riskFlags.map((flag, i) => {
            const cfg = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.low;
            const Icon = cfg.icon;
            return (
              <div
                key={i}
                className="risk-item"
                style={{
                  background: cfg.bg,
                  borderColor: cfg.border,
                  animationDelay: `${i * 0.07}s`
                }}
              >
                <div className="risk-icon" style={{ color: cfg.color }}>
                  <Icon size={20} />
                </div>
                <div className="risk-content">
                  <span className="risk-severity" style={{ color: cfg.color }}>{cfg.label}</span>
                  <p className="risk-message">{flag.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="risk-legend">
        <p className="risk-legend-title">How risk flags work</p>
        <ul className="risk-legend-list">
          <li><span style={{ color: 'var(--coral-400)' }}>HIGH</span> — Budget ≥85% used, or packing incomplete within 3 days</li>
          <li><span style={{ color: 'var(--amber-400)' }}>MEDIUM</span> — No documents uploaded</li>
          <li><span style={{ color: 'var(--sky-400)' }}>LOW</span> — No emergency contacts added</li>
        </ul>
      </div>

      <style>{`
        .risk-wrap { display: flex; flex-direction: column; gap: 1.25rem; }
        .risk-count-badge {
          font-size: 0.75rem;
          background: rgba(239,68,68,0.12);
          color: var(--coral-400);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: var(--radius-full);
          padding: 0.2rem 0.65rem;
        }
        .risk-list { display: flex; flex-direction: column; gap: 0.65rem; }
        .risk-item {
          display: flex;
          align-items: flex-start;
          gap: 0.9rem;
          border: 1px solid;
          border-radius: var(--radius-md);
          padding: 1rem 1.1rem;
          animation: fadeIn 0.3s both;
        }
        .risk-icon { flex-shrink: 0; margin-top: 1px; }
        .risk-content { flex: 1; }
        .risk-severity { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; display: block; margin-bottom: 0.25rem; }
        .risk-message { font-size: 0.9rem; color: var(--text-primary); margin: 0; line-height: 1.5; }
        .risk-legend {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1rem 1.1rem;
        }
        .risk-legend-title { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem; }
        .risk-legend-list { list-style: none; display: flex; flex-direction: column; gap: 0.25rem; }
        .risk-legend-list li { font-size: 0.78rem; color: var(--text-muted); }
      `}</style>
    </div>
  );
};

export default RiskFlags;
