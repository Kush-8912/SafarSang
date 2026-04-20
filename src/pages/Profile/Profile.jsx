import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile, uploadProfilePicture } from '../../services/auth.service';
import Button from '../../components/ui/Button';
import { User, Save, CheckCircle, Camera, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user, refreshUser } = useAuth();

  // --- Display Name is the only editable text field ---
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  // --- Live preview URL for avatar (starts from Firebase Auth user) ---
  const [previewURL, setPreviewURL] = useState(user?.photoURL || null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync when Firebase Auth user object updates (e.g., after Google sign-in)
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      // Only update preview if we haven't set a new upload preview
      if (!previewURL) {
        setPreviewURL(user.photoURL || null);
      }
    }
  }, [user?.uid]); // Only re-sync on user change, not on every re-render

  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  // --- Handle photo file selection (instant base64 conversion) ---
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    // Clear the input so the same file can be re-selected if needed
    e.target.value = '';
    if (!file) return;

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const downloadURL = await uploadProfilePicture(file);
      setPreviewURL(downloadURL);
      // Reload Firebase Auth user so Navbar/everywhere picks up new photo
      await refreshUser();
      setSuccess('Profile picture updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  // --- Handle display name save (NEVER touches the photo) ---
  const handleSave = async (e) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setError('Display Name cannot be empty.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Only updates the name — photo is protected inside updateUserProfile
      await updateUserProfile(displayName.trim());
      // Reload Firebase Auth user so Navbar picks up new display name
      await refreshUser();
      setSuccess('Profile saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your public identity on SafarSang.</p>
      </div>

      <motion.div 
        className="profile-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >

        {/* ── Avatar with Upload Button ──────────────────────────── */}
        <div className="avatar-section">
          <div className="avatar-wrap">
            <div className="avatar-circle">
              {previewURL ? (
                <img
                  src={previewURL}
                  alt="Profile"
                  className="avatar-img"
                  onError={() => setPreviewURL(null)}
                />
              ) : (
                <span className="avatar-initials">{initials}</span>
              )}
              {uploading && (
                <div className="avatar-overlay">
                  <div className="mini-spinner" />
                  <span className="overlay-text">Saving...</span>
                </div>
              )}
            </div>

            {/* Clickable camera badge */}
            <label
              className={`camera-btn ${uploading ? 'disabled' : ''}`}
              htmlFor="avatar-file-input"
              title="Upload new photo"
            >
              <Camera size={15} />
              <input
                id="avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div className="avatar-info">
            <h3>{displayName || 'Your Name'}</h3>
            <p className="upload-hint">
              Click the 📷 button to upload a photo.<br />
              <span className="hint-sub">Max 500KB — JPEG, PNG, GIF supported.</span>
            </p>
          </div>
        </div>

        <hr className="profile-divider" />

        {/* ── Feedback Alerts ───────────────────────────────────── */}
        {error && (
          <div className="feedback-alert error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="feedback-alert success">
            <CheckCircle size={16} />
            {success}
          </div>
        )}

        {/* ── Name Form ─────────────────────────────────────────── */}
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-name">
              Display Name
            </label>
            <div className="input-icon-wrap">
              <User className="input-icon" size={16} />
              <input
                id="profile-name"
                type="text"
                value={displayName}
                onChange={(e) => { setError(''); setDisplayName(e.target.value); }}
                className="form-input has-icon"
                placeholder="Your name"
              />
            </div>
          </div>

          <div className="form-group" style={{ opacity: 0.65 }}>
            <label className="form-label">Email (Read Only)</label>
            <input
              type="email"
              value={user?.email || ''}
              className="form-input"
              disabled
            />
          </div>

          <div className="save-row">
            <Button type="submit" variant="primary" loading={saving} icon={Save}>
              Save Name
            </Button>
          </div>
        </form>
      </motion.div>

      <style>{`
        .profile-page { padding: 2rem; max-width: 720px; margin: 0 auto; }
        .profile-header { margin-bottom: 2rem; }
        .profile-header h1 { font-family: 'Space Grotesk', sans-serif; font-size: 2rem; margin-bottom: 0.4rem; }
        .profile-header p { color: var(--text-muted); }

        .profile-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: 2rem;
          box-shadow: var(--shadow-md);
        }

        /* Avatar section */
        .avatar-section { display: flex; align-items: center; gap: 1.75rem; margin-bottom: 2rem; }
        .avatar-wrap { position: relative; flex-shrink: 0; }
        .avatar-circle {
          width: 96px; height: 96px;
          border-radius: 50%;
          background: var(--gradient-brand);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 18px rgba(249,115,22,0.25);
          position: relative;
        }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-initials { color: white; font-size: 2.2rem; font-weight: 700; font-family: 'Rozha One', serif; }

        /* Upload overlay */
        .avatar-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 0.35rem;
        }
        .overlay-text { color: white; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
        .mini-spinner {
          width: 22px; height: 22px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
        }

        /* Camera badge */
        .camera-btn {
          position: absolute; bottom: 2px; right: 2px;
          width: 30px; height: 30px;
          background: var(--bg-elevated);
          border: 2px solid var(--bg-base);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: var(--saffron-500);
          box-shadow: var(--shadow-sm);
          transition: transform 0.18s, color 0.18s;
        }
        .camera-btn:hover { transform: scale(1.15); color: var(--saffron-600); }
        .camera-btn.disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }

        /* Avatar info */
        .avatar-info h3 { font-size: 1.2rem; margin-bottom: 0.5rem; }
        .upload-hint { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; }
        .hint-sub { font-size: 0.75rem; color: var(--text-muted); }

        /* Divider */
        .profile-divider { border: 0; border-top: 1px solid var(--border-subtle); margin: 1.75rem 0; }

        /* Feedback */
        .feedback-alert {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.8rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.88rem;
          margin-bottom: 1.25rem;
        }
        .feedback-alert.error { background: rgba(239,68,68,0.1); color: var(--coral-400); border: 1px solid rgba(239,68,68,0.3); }
        .feedback-alert.success { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }

        /* Form */
        .form-group { margin-bottom: 1.25rem; }
        .input-icon-wrap { position: relative; }
        .input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .form-input.has-icon { padding-left: 2.75rem !important; }

        /* Save button */
        .save-row { display: flex; justify-content: flex-end; margin-top: 1rem; }
      `}</style>
    </div>
  );
};

export default Profile;
