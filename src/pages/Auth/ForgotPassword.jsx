import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PlaneTakeoff, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { resetPassword } from '../../services/auth.service';
import Button from '../../components/ui/Button';

/**
 * ForgotPassword — allows users to reset their forgotten passwords.
 */
const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fromQuery = (searchParams.get('email') || '').trim();
    if (fromQuery) setEmail(fromQuery);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(
        err.code === 'app/account-not-found' || err.code === 'auth/user-not-found'
          ? 'No account found with this email.' 
          : err.message || 'Failed to send reset email.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-gfx" aria-hidden="true" />

      <div className="auth-card animate-scale-in">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <img src="/logo.png" alt="Logo" className="logo-img" />
          </div>
          <div>
            <h1 className="auth-brand">SafarSang</h1>
            <p className="auth-tagline">Your Journey, Together</p>
          </div>
        </div>

        {success ? (
          <div className="reset-success animate-fade-in">
            <CheckCircle size={48} className="success-icon" />
            <h2 className="auth-title">Email Sent!</h2>
            <p className="auth-subtitle">
              We've sent a password reset link to <br/><strong>{email}</strong>
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Please check your inbox (and spam folder) and click the link to create a new password.
            </p>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg" fullWidth>
                Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">
              Enter the email associated with your account and we'll send you a link to reset your password.
            </p>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group auth-field">
                <label className="form-label" htmlFor="reset-email">Email address</label>
                <div className="input-icon-wrap">
                  <Mail className="input-icon" size={16} />
                  <input
                    id="reset-email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => { setError(''); setEmail(e.target.value); }}
                    className="form-input has-icon"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
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
                style={{ marginTop: '0.5rem' }}
              >
                Send Reset Link
              </Button>
            </form>

            <p className="auth-switch">
              Remember your password?{' '}
              <Link to="/login" id="reset-login-link">Sign in</Link>
            </p>
          </>
        )}
      </div>

      <style>{`
        .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg-base); padding:1.5rem; position:relative; overflow:hidden; }
        .auth-bg-gfx { position:absolute; inset:0; background: radial-gradient(ellipse 60% 40% at 10% 10%, rgba(20,184,166,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 90% 90%, rgba(139,92,246,0.08) 0%, transparent 60%); pointer-events:none; }
        .auth-card { background:var(--bg-elevated); border:1px solid var(--border-default); border-radius:var(--radius-xl); padding:2.5rem; width:100%; max-width:420px; box-shadow:var(--shadow-lg),0 0 60px rgba(20,184,166,0.07); position:relative; z-index:1; }
        .auth-logo { display:flex; align-items:center; gap:0.75rem; margin-bottom:2rem; }
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
        .auth-brand { font-family:'Space Grotesk',sans-serif; font-size:1.25rem; font-weight:700; background:var(--gradient-brand); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin:0; }
        .auth-tagline { font-size:0.72rem; color:var(--text-muted); margin:0; }
        .auth-title { font-size:1.5rem; margin-bottom:0.4rem; }
        .auth-subtitle { font-size:0.875rem; color:var(--text-muted); margin-bottom:1.75rem; line-height: 1.4; }
        .auth-error { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-md); padding:0.75rem 1rem; color:var(--coral-400); font-size:0.85rem; margin-bottom:1.25rem; }
        .auth-field { margin-bottom:1.1rem; }
        .input-icon-wrap { position:relative; }
        .input-icon { position:absolute; left:0.9rem; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
        .form-input.has-icon { padding-left:2.5rem !important; }
        .auth-switch { text-align:center; margin-top:1.5rem; font-size:0.85rem; color:var(--text-muted); }
        .reset-success { text-align: center; padding: 1rem 0; }
        .success-icon { color: var(--teal-500); margin-bottom: 1rem; }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
