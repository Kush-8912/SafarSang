/**
 * Badge — status indicator with semantic color variants.
 */
const Badge = ({ children, variant = 'teal', dot = false }) => (
  <span className={`badge badge-${variant}`}>
    {dot && <span className="badge-dot" />}
    {children}
  </span>
);

export default Badge;
