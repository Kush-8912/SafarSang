import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Map, Bell, User, LogOut, Settings, ChevronDown,
  PlaneTakeoff, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../services/auth.service';

/**
 * Navbar — top navigation bar with user menu and mobile toggle.
 */
const Navbar = ({ onMobileMenuToggle, mobileMenuOpen }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);

  const mockNotifs = [
    { title: 'New Magic Safar', desc: 'Panditji finalized your requested itinerary!', time: '12m' },
    { title: 'Trip Budget', desc: 'Your group budget for Goa was updated.', time: '2h' }
  ];

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/dashboard" className="navbar-brand">
          <div className="navbar-logo">
            <img src="/logo.png" alt="SafarSang Logo" className="logo-img" />
          </div>
          <span className="navbar-name">SafarSang</span>
        </Link>

        {/* Right Actions */}
        <div className="navbar-right">
          <div className="user-menu-wrap">
            <button 
              className={`nav-icon-btn ${notifsOpen ? 'active' : ''}`}
              onClick={() => { setNotifsOpen((v) => !v); setUserMenuOpen(false); }}
              id="nav-notifications"
            >
              <Bell size={18} />
              <span className="nav-dot" />
            </button>

            {notifsOpen && (
              <div className="user-dropdown notifs-dropdown animate-scale-in">
                <div className="dropdown-header">
                  <p className="dropdown-name" style={{ fontSize: '0.9rem' }}>Notifications</p>
                </div>
                <div className="dropdown-divider" />
                {mockNotifs.map((n, i) => (
                  <div key={i} className="dropdown-item notif-item">
                    <div className="notif-text">
                      <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{n.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.desc}</span>
                    </div>
                    <small style={{ fontSize: '0.65rem', color: 'var(--brand-500)', flexShrink: 0 }}>{n.time}</small>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="user-menu-wrap">
            <button
              className="user-avatar-btn"
              onClick={() => { setUserMenuOpen((v) => !v); setNotifsOpen(false); }}
              id="nav-user-menu"
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
            >
              <div className="avatar">
                {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="avatar-img-sm" /> : initials}
              </div>
              <div className="user-info hide-mobile">
                <span className="user-name">{user?.displayName || 'Traveler'}</span>
                <span className="user-email">{user?.email}</span>
              </div>
              <ChevronDown size={14} className={`chevron ${userMenuOpen ? 'open' : ''}`} />
            </button>

            {userMenuOpen && (
              <div className="user-dropdown animate-scale-in">
                <div className="dropdown-header">
                  <div className="avatar avatar-lg">
                    {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="avatar-img-sm" /> : initials}
                  </div>
                  <div>
                    <p className="dropdown-name">{user?.displayName || 'Traveler'}</p>
                    <p className="dropdown-email">{user?.email}</p>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)} id="nav-profile">
                  <User size={15} /> Profile
                </Link>
                <Link to="/settings" className="dropdown-item" onClick={() => setUserMenuOpen(false)} id="nav-settings">
                  <Settings size={15} /> Settings
                </Link>
                <div className="dropdown-divider" />
                <button className="dropdown-item danger" onClick={handleLogout} id="nav-logout">
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="nav-icon-btn show-mobile" onClick={onMobileMenuToggle} id="nav-mobile-toggle">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--navbar-height);
          background: rgba(17, 22, 34, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-subtle);
          z-index: 900;
        }
        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          padding: 0 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
        }
        .navbar-logo {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: white; /* White background for the India map logo */
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .logo-img {
          width: 90%;
          height: 90%;
          object-fit: contain;
        }
        .navbar-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          background: var(--gradient-brand);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          position: relative;
        }
        .nav-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-default);
          background: var(--bg-elevated);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
        }
        .nav-icon-btn:hover { color: var(--text-primary); border-color: var(--border-strong); }
        .nav-dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 7px;
          height: 7px;
          background: var(--coral-400);
          border-radius: 50%;
          border: 1.5px solid var(--bg-surface);
        }
        .user-menu-wrap { position: relative; }
        .user-avatar-btn {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          padding: 0.35rem 0.75rem 0.35rem 0.35rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--text-primary);
        }
        .user-avatar-btn:hover { border-color: var(--border-strong); }

        .avatar {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
          background: var(--gradient-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }
        .avatar-lg { width: 40px; height: 40px; font-size: 0.9rem; border-radius: var(--radius-md); }
        .user-info { display: flex; flex-direction: column; align-items: flex-start; }
        .user-name  { font-size: 0.8rem; font-weight: 600; line-height: 1.2; }
        .user-email { font-size: 0.7rem; color: var(--text-muted); }
        .chevron { color: var(--text-muted); transition: transform var(--transition-fast); }
        .chevron.open { transform: rotate(180deg); }

        .user-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 240px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.15);
          z-index: 9999;
          overflow: hidden;
        }
        .notifs-dropdown {
          width: 300px;
          right: -10px;
        }
        .notif-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          gap: 0.5rem;
          cursor: pointer;
        }
        .notif-item:hover { background: var(--bg-modifier); }
        .notif-text { display: flex; flex-direction: column; gap: 0.2rem; }
        
        .avatar-img-sm { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
        .dropdown-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
        }
        .dropdown-name  { font-size: 0.85rem; font-weight: 600; }
        .dropdown-email { font-size: 0.72rem; color: var(--text-muted); }
        .dropdown-divider {
          height: 1px;
          background: var(--border-subtle);
          margin: 0.35rem 0;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.65rem 1rem;
          color: var(--text-secondary);
          font-size: 0.85rem;
          text-decoration: none;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          transition: all var(--transition-fast);
          font-family: 'Inter', sans-serif;
        }
        .dropdown-item:hover { background: var(--bg-card); color: var(--text-primary); }
        .dropdown-item.danger:hover { color: var(--coral-400); }

        .hide-mobile { }
        .show-mobile { display: none !important; }

        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
