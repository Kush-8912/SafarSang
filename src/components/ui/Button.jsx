import { forwardRef } from 'react';

/**
 * Button — reusable button with multiple variants and sizes.
 * Demonstrates component composition and prop patterns.
 */
const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const base = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && 'btn-full',
    (loading || disabled) && 'btn-disabled',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      className={base}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 16} />}
          {children && <span>{children}</span>}
          {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 16} />}
        </>
      )}

      <style>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all var(--transition-normal);
          white-space: nowrap;
          position: relative;
          overflow: hidden;
        }
        .btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: white;
          opacity: 0;
          transition: opacity var(--transition-fast);
        }
        .btn:hover::after { opacity: 0.05; }
        .btn:active { transform: scale(0.97); }

        /* Sizes */
        .btn-sm   { padding: 0.4rem 0.85rem; font-size: 0.8rem; }
        .btn-md   { padding: 0.65rem 1.25rem; font-size: 0.9rem; }
        .btn-lg   { padding: 0.85rem 1.75rem; font-size: 1rem; }
        .btn-full { width: 100%; }

        /* Variants */
        .btn-primary {
          background: var(--gradient-brand);
          color: white;
          box-shadow: 0 4px 15px rgba(20, 184, 166, 0.25);
        }
        .btn-primary:hover {
          box-shadow: 0 6px 25px rgba(20, 184, 166, 0.4);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: var(--bg-elevated);
          color: var(--text-primary);
          border: 1px solid var(--border-default);
        }
        .btn-secondary:hover {
          border-color: var(--teal-500);
          color: var(--teal-400);
        }

        .btn-ghost {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid transparent;
        }
        .btn-ghost:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
          border-color: var(--border-default);
        }

        .btn-danger {
          background: rgba(239, 68, 68, 0.15);
          color: var(--coral-400);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .btn-danger:hover {
          background: rgba(239, 68, 68, 0.25);
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
        }

        .btn-disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }

        /* Spinner */
        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
      `}</style>
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
