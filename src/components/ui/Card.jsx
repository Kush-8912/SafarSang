/**
 * Card — composable card component with glass-morphism styling.
 * Supports title, subtitle, icon, action slot, and click handler.
 */
const Card = ({
  children,
  title,
  subtitle,
  icon: Icon,
  iconColor = 'teal',
  action,
  onClick,
  className = '',
  padding = true,
  glow = false,
  style = {},
}) => {
  const classes = [
    'card-wrapper',
    onClick && 'card-clickable',
    glow && 'card-glow',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
      style={style}
    >
      {(title || action) && (
        <div className="card-header">
          <div className="card-title-group">
            {Icon && (
              <span className={`card-icon card-icon-${iconColor}`}>
                <Icon size={18} />
              </span>
            )}
            <div>
              {title && <h4 className="card-title">{title}</h4>}
              {subtitle && <p className="card-subtitle">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      <div className={padding ? 'card-body' : ''}>{children}</div>

      <style>{`
        .card-wrapper {
          background: var(--gradient-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          overflow: hidden;
          transition: transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal);
        }
        .card-clickable {
          cursor: pointer;
        }
        .card-clickable:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg), var(--shadow-glow);
          border-color: var(--border-strong);
        }
        .card-clickable:focus-visible {
          outline: 2px solid var(--teal-500);
          outline-offset: 2px;
        }
        .card-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-subtle);
          gap: 1rem;
        }
        .card-title-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .card-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .card-icon-teal   { background: rgba(20,184,166,0.15); color: var(--teal-400); }
        .card-icon-coral  { background: rgba(239,68,68,0.15);  color: var(--coral-400); }
        .card-icon-amber  { background: rgba(251,191,36,0.15); color: var(--amber-400); }
        .card-icon-violet { background: rgba(139,92,246,0.15); color: var(--violet-400); }
        .card-icon-sky    { background: rgba(56,189,248,0.15); color: var(--sky-400); }

        .card-title    { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); margin: 0; }
        .card-subtitle { font-size: 0.78rem; color: var(--text-muted); margin-top: 0.15rem; }
        .card-action   { flex-shrink: 0; }
        .card-body     { padding: 1.5rem; }
      `}</style>
    </div>
  );
};

export default Card;
