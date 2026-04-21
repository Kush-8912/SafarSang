import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PlaneTakeoff, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { loginUser, loginWithGoogle } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { motion } from 'framer-motion';

/**
 * Login — auth page with controlled form, error handling, and redirect-after-login.
 */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setError } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [localError, setLocalError] = useState('');
  const AUTH_NOTICE_KEY = 'safarsang_auth_notice';

  useEffect(() => {
    try {
      const notice = sessionStorage.getItem(AUTH_NOTICE_KEY);
      if (notice) {
        setLocalError(notice);
        sessionStorage.removeItem(AUTH_NOTICE_KEY);
      }
    } catch {
      // Ignore sessionStorage errors.
    }
  }, []);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setLocalError('');
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setLocalError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await loginUser(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setLocalError(
        err.code === 'app/account-not-found'
          ? 'No account found. Please create an account first.'
          :
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Invalid credentials. If you are new, please create an account first.'
          : err.code === 'auth/user-not-found'
          ? 'No account found. Please create an account first.'
          : err.message || 'Login failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setLocalError('');
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setLocalError(
          err.code === 'app/account-not-found'
            ? 'No account found. Please create an account first.'
            : (err.message || 'Google Login failed.')
        );
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-gfx" aria-hidden="true" />
      {/* Floating orbs for depth */}
      <div style={{ position:'fixed', width:'360px', height:'360px', borderRadius:'50%', background:'rgba(249,115,22,0.07)', filter:'blur(80px)', top:'-80px', left:'-80px', pointerEvents:'none', animation:'orbFloat 9s ease-in-out infinite' }} />
      <div style={{ position:'fixed', width:'280px', height:'280px', borderRadius:'50%', background:'rgba(244,63,94,0.06)', filter:'blur(70px)', bottom:'-50px', right:'-60px', pointerEvents:'none', animation:'orbFloat 7s ease-in-out infinite reverse' }} />

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <img src="/logo.png" alt="Logo" className="logo-img" />
          </div>
          <div>
            <h1 className="auth-brand">SafarSang</h1>
            <p className="auth-tagline">Your Journey, Together</p>
          </div>
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle"><i>"Atithi Devo Bhava"</i><br />Sign in to access your planned safars.</p>

        {localError && (
          <div className="auth-error" role="alert">
            {localError}
          </div>
        )}

        {/* Google Authentication */}
        <Button 
          type="button" 
          variant="secondary" 
          size="lg" 
          fullWidth 
          loading={loadingGoogle}
          onClick={handleGoogleLogin} 
          style={{ marginBottom: '1.25rem', background: 'white', color: '#333', border: '1px solid #d1d5db' }}
        >
          {loadingGoogle ? 'Connecting to Google...' : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </span>
          )}
        </Button>

        <div className="auth-separator">
          <span>or log in with email</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="form-group auth-field">
            <label className="form-label" htmlFor="login-email">Email address</label>
            <div className="input-icon-wrap">
              <Mail className="input-icon" size={16} />
              <input
                id="login-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="form-input has-icon"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group auth-field">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="input-icon-wrap">
              <Lock className="input-icon" size={16} />
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="form-input has-icon has-icon-right"
                placeholder="Your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="input-icon-right-btn"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: '0.4rem' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--coral-500)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' }}>
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={ArrowRight}
            iconPosition="right"
            id="login-submit"
            style={{ marginTop: '0.5rem' }}
          >
            Sign In
          </Button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/signup" id="login-signup-link">Create one for free</Link>
        </p>
      </motion.div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-base);
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }
        .auth-bg-gfx {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 10% 10%, rgba(20,184,166,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 90% 90%, rgba(139,92,246,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .auth-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: 2.5rem;
          width: 100%;
          max-width: 420px;
          box-shadow: var(--shadow-lg), 0 0 60px rgba(20,184,166,0.07);
          position: relative;
          z-index: 1;
        }
        .auth-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        .auth-logo-icon {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md);
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .logo-img {
          width: 90%;
          height: 90%;
          object-fit: contain;
        }
        .auth-brand {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          background: var(--gradient-brand);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }
        .auth-tagline { font-size: 0.72rem; color: var(--text-muted); margin: 0; }
        .auth-title { font-size: 1.5rem; margin-bottom: 0.4rem; }
        .auth-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.75rem; }
        .auth-error {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: var(--radius-md);
          padding: 0.75rem 1rem;
          color: var(--coral-400);
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
        }
        .auth-field { margin-bottom: 1.1rem; }
        .input-icon-wrap { position: relative; }
        .input-icon {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .form-input.has-icon { padding-left: 2.5rem !important; }
        .form-input.has-icon-right { padding-right: 2.75rem !important; }
        .input-icon-right-btn {
          position: absolute;
          right: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0;
          display: flex;
          transition: color var(--transition-fast);
        }
        .input-icon-right-btn:hover { color: var(--text-primary); }
        .auth-separator {
          display: flex;
          align-items: center;
          text-align: center;
          margin-bottom: 1.25rem;
        }
        .auth-separator::before, .auth-separator::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border-subtle);
        }
        .auth-separator span {
          padding: 0 0.8rem;
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .auth-switch {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default Login;
