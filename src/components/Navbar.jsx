import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, User, LogOut, Settings, ChevronDown, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../services/auth.service';
import { getUserTrips } from '../services/trip.service';

/**
 * Navbar — top navigation bar with user menu and mobile toggle.
 */
const Navbar = ({ onMobileMenuToggle, mobileMenuOpen }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [readState, setReadState] = useState({});

  const readKey = user?.uid ? `safarsang_notifs_read_v1_${user.uid}` : null;

  const toMs = (v) => {
    if (!v) return 0;
    if (typeof v?.toMillis === 'function') return v.toMillis();
    if (v?.seconds != null) return v.seconds * 1000;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const daysUntil = (ymd) => {
    if (!ymd) return null;
    const d = new Date(`${ymd}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
  };

  const relTime = (ms) => {
    if (!ms) return '';
    const diff = Math.max(0, Date.now() - ms);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  };

  const buildNotifications = (trips) => {
    const out = [];
    const now = Date.now();

    for (const trip of trips) {
      const startIn = daysUntil(trip.startDate);
      const budget = Number(trip.totalBudget || 0);
      const spent = Number(trip.totalSpent || 0);
      const usage = budget > 0 ? spent / budget : 0;
      const createdMs = toMs(trip.createdAt);

      if (trip.status !== 'completed' && startIn !== null && startIn >= 0 && startIn <= 7) {
        out.push({
          id: `upcoming_${trip.id}`,
          tripId: trip.id,
          title: 'Upcoming Safar',
          desc: `${trip.name} starts in ${startIn} day${startIn !== 1 ? 's' : ''}.`,
          timeMs: createdMs || now,
          severity: startIn <= 2 ? 'high' : 'medium',
        });
      }

      if (budget > 0 && usage >= 0.85 && trip.status !== 'completed') {
        out.push({
          id: `budget_${trip.id}`,
          tripId: trip.id,
          title: usage >= 1 ? 'Budget Exceeded' : 'Budget Alert',
          desc: `${trip.name} is at ${Math.round(usage * 100)}% budget usage.`,
          timeMs: now,
          severity: usage >= 1 ? 'high' : 'medium',
        });
      }

      if (createdMs && now - createdMs <= 24 * 60 * 60 * 1000) {
        out.push({
          id: `new_${trip.id}`,
          tripId: trip.id,
          title: 'New Safar Created',
          desc: `${trip.name} was added to your dashboard.`,
          timeMs: createdMs,
          severity: 'low',
        });
      }

      if (trip.status === 'completed') {
        out.push({
          id: `completed_${trip.id}`,
          tripId: trip.id,
          title: 'Safar Completed',
          desc: `Great job wrapping up ${trip.name}.`,
          timeMs: now,
          severity: 'low',
        });
      }
    }

    const deduped = new Map();
    for (const n of out) deduped.set(n.id, n);
    return [...deduped.values()]
      .sort((a, b) => b.timeMs - a.timeMs)
      .slice(0, 20);
  };

  useEffect(() => {
    if (!readKey) return;
    try {
      const raw = localStorage.getItem(readKey);
      if (raw) setReadState(JSON.parse(raw) || {});
    } catch {
      setReadState({});
    }
  }, [readKey]);

  useEffect(() => {
    let cancelled = false;
    if (!user?.uid) return;

    const fetchNotifs = async () => {
      setLoadingNotifs(true);
      try {
        const trips = await getUserTrips(user.uid);
        if (!cancelled) setNotifs(buildNotifications(trips));
      } catch {
        if (!cancelled) setNotifs([]);
      } finally {
        if (!cancelled) setLoadingNotifs(false);
      }
    };

    fetchNotifs();
    const timer = setInterval(fetchNotifs, 60000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user?.uid]);

  const unreadCount = useMemo(
    () => notifs.filter((n) => !readState[n.id]).length,
    [notifs, readState]
  );

  const persistRead = (next) => {
    setReadState(next);
    if (readKey) localStorage.setItem(readKey, JSON.stringify(next));
  };

  const markRead = (notifId) => {
    if (readState[notifId]) return;
    persistRead({ ...readState, [notifId]: true });
  };

  const markAllRead = () => {
    const next = { ...readState };
    for (const n of notifs) next[n.id] = true;
    persistRead(next);
  };

  const openNotif = (n) => {
    markRead(n.id);
    setNotifsOpen(false);
    if (n.tripId) navigate(`/trips/${n.tripId}`);
  };

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
              {unreadCount > 0 && <span className="nav-dot" />}
            </button>

            {notifsOpen && (
              <div className="user-dropdown notifs-dropdown animate-scale-in">
                <div className="dropdown-header">
                  <p className="dropdown-name" style={{ fontSize: '0.9rem' }}>Notifications</p>
                  {notifs.length > 0 && (
                    <button
                      className="notif-mark-read"
                      onClick={markAllRead}
                      type="button"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="dropdown-divider" />
                {loadingNotifs ? (
                  <div className="notif-empty">Loading notifications...</div>
                ) : notifs.length === 0 ? (
                  <div className="notif-empty">No notifications right now.</div>
                ) : (
                  notifs.map((n) => (
                    <button
                      key={n.id}
                      className={`dropdown-item notif-item ${readState[n.id] ? '' : 'unread'}`}
                      onClick={() => openNotif(n)}
                      type="button"
                    >
                      <div className="notif-text">
                        <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{n.title}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.desc}</span>
                      </div>
                      <small style={{ fontSize: '0.65rem', color: 'var(--brand-500)', flexShrink: 0 }}>{relTime(n.timeMs)}</small>
                    </button>
                  ))
                )}
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
          max-height: 420px;
          overflow-y: auto;
        }
        .notif-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          gap: 0.5rem;
          cursor: pointer;
        }
        .notif-item:hover { background: var(--bg-card); }
        .notif-item.unread {
          background: rgba(20,184,166,0.07);
          border-left: 2px solid var(--teal-400);
        }
        .notif-text { display: flex; flex-direction: column; gap: 0.2rem; }
        .notif-mark-read {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--teal-400);
          font-size: 0.72rem;
          cursor: pointer;
        }
        .notif-empty {
          padding: 0.9rem 1rem;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        
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
          .user-dropdown {
            right: 0;
            width: min(92vw, 300px);
          }
          .notifs-dropdown {
            right: -40px;
            width: min(92vw, 320px);
            max-height: min(70vh, 420px);
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
