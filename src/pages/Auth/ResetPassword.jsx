import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { completePasswordReset, verifyResetCode } from '../../services/auth.service';
import Button from '../../components/ui/Button';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [linkInput, setLinkInput] = useState('');

  const oobCode = searchParams.get('oobCode') || '';
  const mode = searchParams.get('mode') || '';

  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (mode && mode !== 'resetPassword') {
        setError('This link is not a password reset link.');
        return;
      }
      if (!oobCode) {
        setError('This password reset link is invalid.');
        return;
      }
      try {
        await verifyResetCode(oobCode);
        if (alive) setReady(true);
      } catch {
        if (alive) setError('This password reset link is invalid or expired. Please request a new one.');
      }
    };
    run();
    return () => { alive = false; };
  }, [oobCode, mode]);

  const passReqs = useMemo(() => ([
    { text: '8+ Chars', met: password.length >= 8 },
    { text: 'Uppercase', met: /[A-Z]/.test(password) },
    { text: 'Lowercase', met: /[a-z]/.test(password) },
    { text: 'Number', met: /[0-9]/.test(password) },
    { text: 'Special (!@#)', met: /[!@#$%^&*_,.?~-]/.test(password) },
  ]), [password]);

  const validate = () => {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*_,.?~-]/.test(password)) return 'Password must contain at least one special character.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validationErr = validate();
    if (validationErr) {
      setError(validationErr);
      return;
    }
    setLoading(true);
    try {
      await completePasswordReset(oobCode, password);
      setSuccess(true);
    } catch {
      setError('Failed to reset password. This link may have expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseLink = (e) => {
    e.preventDefault();
    setError('');
    const raw = String(linkInput || '').trim();
    if (!raw) {
      setError('Please paste the reset link from your email.');
      return;
    }
    try {
      const parsed = new URL(raw);
      const code = parsed.searchParams.get('oobCode');
      const parsedMode = parsed.searchParams.get('mode');
      if (!code) {
        setError('Could not find reset code in this link.');
        return;
      }
      if (parsedMode && parsedMode !== 'resetPassword') {
        setError('This is not a password reset link.');
        return;
      }
      window.location.assign(`/reset-password?mode=resetPassword&oobCode=${encodeURIComponent(code)}`);
    } catch {
      setError('That does not look like a valid URL. Please paste the full email link.');
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
            <h2 className="auth-title">Password Reset Successful</h2>
            <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg" fullWidth>Go to Login</Button>
            </Link>
          </div>
        ) : (
          <>
            <h2 className="auth-title">Set New Password</h2>
            <p className="auth-subtitle">Choose a strong password for your account.</p>

            {error && <div className="auth-error" role="alert">{error}</div>}

            {!ready && (
              <form onSubmit={handleUseLink} noValidate style={{ marginBottom: '1rem' }}>
                <div className="form-group auth-field">
                  <label className="form-label" htmlFor="reset-link-paste">Paste Reset Link</label>
                  <textarea
                    id="reset-link-paste"
                    value={linkInput}
                    onChange={(e) => { setError(''); setLinkInput(e.target.value); }}
                    className="form-input"
                    rows={3}
                    placeholder="Paste full link from email here..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <Button type="submit" variant="secondary" size="lg" fullWidth>
                  Use This Link
                </Button>
              </form>
            )}

            {ready && (
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group auth-field">
                  <label className="form-label" htmlFor="reset-new-password">New Password</label>
                  <div className="input-icon-wrap">
                    <Lock className="input-icon" size={16} />
                    <input
                      id="reset-new-password"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setError(''); setPassword(e.target.value); }}
                      className="form-input has-icon has-icon-right"
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      required
                    />
                    <button type="button" className="input-icon-right-btn" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Hide password' : 'Show password'}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="password-reqs">
                    {passReqs.map((req, i) => (
                      <span key={i} className={`req-badge ${req.met ? 'met' : ''}`}>
                        {req.met ? '✓' : '○'} {req.text}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-group auth-field">
                  <label className="form-label" htmlFor="reset-confirm-password">Confirm Password</label>
                  <div className="input-icon-wrap">
                    <Lock className="input-icon" size={16} />
                    <input
                      id="reset-confirm-password"
                      type={showPass ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => { setError(''); setConfirm(e.target.value); }}
                      className="form-input has-icon"
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} icon={ArrowRight} iconPosition="right">
                  Reset Password
                </Button>
              </form>
            )}
          </>
        )}
      </div>
      <style>{`
        .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg-base); padding:1.5rem; position:relative; overflow:hidden; }
        .auth-bg-gfx { position:absolute; inset:0; background: radial-gradient(ellipse 60% 40% at 10% 10%, rgba(20,184,166,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 90% 90%, rgba(139,92,246,0.08) 0%, transparent 60%); pointer-events:none; }
        .auth-card { background:var(--bg-elevated); border:1px solid var(--border-default); border-radius:var(--radius-xl); padding:2.5rem; width:100%; max-width:520px; box-shadow:var(--shadow-lg),0 0 60px rgba(20,184,166,0.07); position:relative; z-index:1; }
        .auth-logo { display:flex; align-items:center; gap:0.75rem; margin-bottom:2rem; }
        .auth-logo-icon { width:52px; height:52px; border-radius:var(--radius-md); background:white; display:flex; align-items:center; justify-content:center; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.1); }
        .logo-img { width:90%; height:90%; object-fit:contain; }
        .auth-brand { font-family:'Space Grotesk',sans-serif; font-size:1.25rem; font-weight:700; background:var(--gradient-brand); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin:0; }
        .auth-tagline { font-size:0.72rem; color:var(--text-muted); margin:0; }
        .auth-title { font-size:1.5rem; margin-bottom:0.4rem; }
        .auth-subtitle { font-size:0.875rem; color:var(--text-muted); margin-bottom:1.75rem; }
        .auth-error { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-md); padding:0.75rem 1rem; color:var(--coral-400); font-size:0.85rem; margin-bottom:1.25rem; }
        .auth-field { margin-bottom:1rem; }
        .input-icon-wrap { position:relative; }
        .input-icon { position:absolute; left:0.9rem; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
        .form-input.has-icon { padding-left:2.5rem !important; }
        .form-input.has-icon-right { padding-right:2.75rem !important; }
        .input-icon-right-btn { position:absolute; right:0.9rem; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:0; display:flex; transition:color var(--transition-fast); }
        .input-icon-right-btn:hover { color:var(--text-primary); }
        .password-reqs { display:flex; flex-wrap:wrap; gap:0.35rem; margin-top:0.6rem; }
        .req-badge { font-size:0.68rem; display:inline-flex; align-items:center; gap:0.25rem; padding:0.2rem 0.5rem; border-radius:4px; background:rgba(0,0,0,0.04); color:var(--text-muted); transition:all 0.2s ease; font-weight:500; }
        .req-badge.met { background:rgba(16,185,129,0.15); color:var(--teal-600); }
        .reset-success { text-align:center; padding:1rem 0; }
        .success-icon { color:var(--teal-500); margin-bottom:1rem; }
      `}</style>
    </div>
  );
};

export default ResetPassword;
