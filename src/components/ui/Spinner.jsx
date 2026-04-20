/**
 * Spinner — animated loading indicator with size variants.
 */
const Spinner = ({ size = 'md', color = 'teal', label = 'Loading...' }) => {
  const sizes = { sm: 20, md: 36, lg: 56 };
  const px = sizes[size] || sizes.md;

  const colors = {
    teal:  'rgba(249, 115, 22, 0.8)', /* Saffron */
    white: 'rgba(234, 88, 12, 0.8)',
    coral: 'rgba(244, 63, 94, 0.8)',
  };
  const c = colors[color] || colors.teal;

  return (
    <div className="spinner-wrap" role="status" aria-label={label}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 50 50"
        className="spinner-svg"
      >
        <circle
          cx="25" cy="25" r="20"
          fill="none"
          stroke="rgba(139, 122, 106, 0.2)"
          strokeWidth="4"
        />
        <circle
          cx="25" cy="25" r="20"
          fill="none"
          stroke={c}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="80 40"
        />
      </svg>

      <style>{`
        .spinner-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .spinner-svg {
          animation: spin 0.9s linear infinite;
        }
      `}</style>
    </div>
  );
};

export const FullPageSpinner = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '1rem',
    background: 'var(--bg-base)',
    textAlign: 'center',
    padding: '2rem'
  }}>
    <img src="/logo.png" alt="SafarSang Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '1rem', animation: 'pulse 2s infinite ease-in-out' }} />
    <Spinner size="lg" />
    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', fontFamily: '"Rozha One", serif', marginTop: '1rem' }}>
      "A journey is best measured in friends, rather than miles."
    </p>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: '"Outfit", sans-serif' }}>
      Preparing your Safar...
    </p>
  </div>
);

export default Spinner;
