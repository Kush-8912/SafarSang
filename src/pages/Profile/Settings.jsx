import { useState } from 'react';
import { updateUserPassword } from '../../services/auth.service';
import Button from '../../components/ui/Button';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

const Settings = () => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const pass = form.newPassword || '';
  const passReqs = [
    { text: '8+ Chars', met: pass.length >= 8 },
    { text: 'Uppercase', met: /[A-Z]/.test(pass) },
    { text: 'Lowercase', met: /[a-z]/.test(pass) },
    { text: 'Number', met: /[0-9]/.test(pass) },
    { text: 'Special (!@#)', met: /[!@#$%^&*_,.?~-]/.test(pass) },
  ];

  const handleChange = (e) => {
    setError('');
    setSuccess('');
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }
    
    if (form.newPassword.length < 8) { setError('New password must be at least 8 characters long.'); return; }
    if (!/[A-Z]/.test(form.newPassword)) { setError('New password must contain at least one uppercase letter.'); return; }
    if (!/[a-z]/.test(form.newPassword)) { setError('New password must contain at least one lowercase letter.'); return; }
    if (!/[0-9]/.test(form.newPassword)) { setError('New password must contain at least one number.'); return; }
    if (!/[!@#$%^&*_,.?~-]/.test(form.newPassword)) { setError('New password must contain at least one special character.'); return; }
    
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await updateUserPassword(form.currentPassword, form.newPassword);
      setSuccess('Your password has been successfully updated.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Current password is incorrect.'
          : err.message || 'Failed to update password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Account Settings</h1>
        <p>Manage your security preferences and account settings.</p>
      </div>

      <div className="settings-card animate-scale-in">
        <div className="card-header">
          <ShieldCheck size={20} className="icon" />
          <h2>Security & Password</h2>
        </div>
        <p className="card-desc">
          To change your password, please safely verify your current password first.
          If you logged in purely via Google, you will need to set a password via the Forgot Password functionality on the login screen first.
        </p>

        {error && <div className="alert alert-error"><AlertCircle size={16} /> {error}</div>}
        {success && <div className="alert alert-success"><ShieldCheck size={16} /> {success}</div>}

        <form onSubmit={handlePasswordChange}>
          
          <div className="form-group">
            <label className="form-label" htmlFor="current-password">Current Password</label>
            <div className="input-icon-wrap">
              <Lock className="input-icon" size={16} />
              <input
                id="current-password"
                name="currentPassword"
                type={showPass ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={handleChange}
                className="form-input has-icon has-icon-right"
                placeholder="Enter current password"
              />
              <button type="button" className="input-icon-right-btn" onClick={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">New Password</label>
              <div className="input-icon-wrap">
                <Lock className="input-icon" size={16} />
                <input
                  id="new-password"
                  name="newPassword"
                  type={showPass ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={handleChange}
                  className="form-input has-icon"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div className="password-reqs">
                {passReqs.map((req, i) => (
                  <span key={i} className={`req-badge ${req.met ? 'met' : ''}`}>
                    {req.met ? '✓' : '○'} {req.text}
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
              <div className="input-icon-wrap">
                <Lock className="input-icon" size={16} />
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPass ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="form-input has-icon"
                  placeholder="Repeat new password"
                />
              </div>
            </div>
          </div>

          <div className="actions">
            <Button type="submit" variant="primary" loading={loading} icon={ShieldCheck}>
              Update Password
            </Button>
          </div>
        </form>
      </div>

      <style>{`
        .settings-page {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }
        .settings-header {
          margin-bottom: 2rem;
        }
        .settings-header h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        .settings-header p {
          color: var(--text-muted);
        }
        .settings-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: 2rem;
          box-shadow: var(--shadow-md);
        }
        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        .card-header .icon {
          color: var(--brand-500);
        }
        .card-header h2 {
          font-size: 1.25rem;
          margin: 0;
        }
        .card-desc {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 2rem;
          line-height: 1.5;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        
        @media (max-width: 640px) {
          .form-row { grid-template-columns: 1fr; gap: 0; }
        }

        .form-group { margin-bottom: 1.5rem; }
        .input-icon-wrap { position: relative; }
        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .form-input.has-icon { padding-left: 2.75rem !important; }
        .form-input.has-icon-right { padding-right: 2.75rem !important; }
        .input-icon-right-btn {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          transition: color 0.2s;
        }
        .input-icon-right-btn:hover { color: var(--text-primary); }

        .alert {
          padding: 1rem;
          border-radius: var(--radius-md);
          margin-bottom: 2rem;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          color: var(--coral-400);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .alert-success {
          background: rgba(16, 185, 129, 0.1);
          color: var(--teal-500);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
        }
        .password-reqs { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.6rem; }
        .req-badge {
          font-size: 0.68rem;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          background: rgba(0,0,0,0.04);
          color: var(--text-muted);
          transition: all 0.2s ease;
          font-weight: 500;
        }
        .req-badge.met { background: rgba(16,185,129,0.15); color: var(--teal-600); }
      `}</style>
    </div>
  );
};

export default Settings;
