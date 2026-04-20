import { Link } from 'react-router-dom';
import { PlaneTakeoff, Home } from 'lucide-react';

/** NotFound — 404 page. */
const NotFound = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '100vh', gap: '1rem',
    background: 'var(--bg-base)', textAlign: 'center', padding: '2rem'
  }}>
    <div style={{ fontSize: '6rem', lineHeight: 1 }}>✈️</div>
    <h1 style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--text-muted)', lineHeight: 1 }}>404</h1>
    <h2>Page Not Found</h2>
    <p style={{ color: 'var(--text-muted)', maxWidth: 360 }}>
      Looks like this route went off course. Let's get you back on track.
    </p>
    <Link
      to="/dashboard"
      id="notfound-home"
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: 'var(--gradient-brand)', color: 'white',
        padding: '0.65rem 1.5rem', borderRadius: 'var(--radius-md)',
        textDecoration: 'none', fontWeight: 500, marginTop: '0.5rem',
        boxShadow: '0 4px 15px rgba(20,184,166,0.3)'
      }}
    >
      <Home size={16} /> Go to Dashboard
    </Link>
  </div>
);

export default NotFound;
