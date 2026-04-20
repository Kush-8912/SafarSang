import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PlusCircle, Map, IndianRupee, ShieldAlert,
  Clock, Users, Trash2, Calendar, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserTrips, deleteTrip } from '../services/trip.service';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }
});

const scaleIn = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.88 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay }
});

/**
 * Dashboard — main hub showing all user trips, risk summary, and quick stats.
 * Demonstrates conditional rendering, lists/keys, useEffect for data fetching.
 */
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchTrips = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserTrips(user.uid);
      setTrips(data);
    } catch (err) {
      setError('Failed to load trips. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleDelete = async (e, trip) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm(`Delete "${trip.name}"? This cannot be undone.`)) return;
    setDeleting(trip.id);
    try {
      await deleteTrip(trip.id);
      setTrips((prev) => prev.filter((t) => t.id !== trip.id));
    } finally {
      setDeleting(null);
    }
  };

  const statusColor = (status) => {
    return { planning: 'amber', confirmed: 'teal', completed: 'gray' }[status] || 'gray';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Stats derived from trips
  const totalBudget = trips.reduce((s, t) => s + (t.totalBudget || 0), 0);
  const upcomingCount = trips.filter((t) => t.startDate && daysUntil(t.startDate) > 0).length;

  return (
    <div className="dash-page">

      {/* Floating background decorations */}
      <div className="dash-bg-orb orb-1" />
      <div className="dash-bg-orb orb-2" />
      <div className="dash-bg-orb orb-3" />

      {/* Header */}
      <motion.div className="dash-header" {...fadeUp(0)}>
        <div>
          <h1 className="dash-greeting">
            Namaste,{' '}
            <span className="dash-name">{user?.displayName?.split(' ')[0] || 'Traveler'}</span>{' '}
            <span className="wave-emoji">🙏</span>
          </h1>
          <p className="dash-sub">Here's an overview of all your planned safars.</p>
        </div>
        <Button
          variant="primary"
          icon={PlusCircle}
          onClick={() => navigate('/trips/new')}
          id="dash-new-trip"
        >
          New Safar
        </Button>
      </motion.div>

      {/* Quick Stats */}
      <div className="dash-stats-row">
        {[
          { label: 'Total Safars', value: trips.length, icon: Globe, color: 'teal' },
          { label: 'Upcoming', value: upcomingCount, icon: Calendar, color: 'sky' },
          { label: 'Total Budget', value: `₹${totalBudget.toLocaleString()}`, icon: IndianRupee, color: 'amber' },
        ].map((stat, i) => (
          <motion.div key={stat.label} className="dash-stat-card" {...scaleIn(i * 0.1 + 0.15)}>
            <div className={`dash-stat-icon dash-stat-icon-${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="dash-stat-value">{stat.value}</p>
              <p className="dash-stat-label">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trips Grid */}
      <div className="dash-section">
        <motion.h2 className="dash-section-title" {...fadeUp(0.4)}>
          <Map size={18} /> Your Trips
        </motion.h2>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Spinner size="md" />
          </div>
        ) : error ? (
          <div className="dash-error">
            <p>{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchTrips}>Retry</Button>
          </div>
        ) : trips.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">🪷</div>
            <h3>Your Journey Begins Here</h3>
            <p className="sub-text">"Safar khoobsurat hai manzil se bhi" - The journey is more beautiful than the destination.</p>
            <p>Create your first Safar to start exploring the globe together.</p>
            <Button variant="primary" icon={PlusCircle} onClick={() => navigate('/trips/new')} id="dash-empty-cta">
              Plan First Safar
            </Button>
          </div>
        ) : (
          <div className="trip-grid">
            <AnimatePresence>
            {trips.map((trip, i) => {
              const days = daysUntil(trip.startDate);
              const budgetPct = trip.totalBudget > 0 ? Math.min((trip.totalSpent || 0) / trip.totalBudget * 100, 100) : 0;
              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                <Link
                  to={`/trips/${trip.id}`}
                  className="trip-card"
                  id={`trip-card-${trip.id}`}
                >
                  {/* Card gradient banner */}
                  <div className="trip-card-banner" style={{
                    background: `linear-gradient(135deg, hsl(${(i * 47 + 170) % 360}, 60%, 28%), hsl(${(i * 47 + 220) % 360}, 60%, 20%))`
                  }}>
                    <div className="trip-card-emoji">
                      {trip.destination?.includes('Rishikesh') ? '🧵️' :
                       trip.destination?.includes('Goa') ? '🌴' :
                       trip.destination?.includes('Jaipur') ? '🏀' : '🪷'}
                    </div>
                    {days !== null && days > 0 && (
                      <div className="trip-countdown">
                        <Clock size={12} />
                        {days} day{days !== 1 ? 's' : ''} away
                      </div>
                    )}
                    {days !== null && days <= 0 && trip.status !== 'completed' && (
                      <div className="trip-countdown active">🚀 In progress</div>
                    )}
                  </div>

                  <div className="trip-card-body">
                    <div className="trip-card-top">
                      <div>
                        <h3 className="trip-name">{trip.name}</h3>
                        <p className="trip-dest">{trip.destination || 'Destination TBD'}</p>
                      </div>
                      <button
                        className="trip-delete-btn"
                        onClick={(e) => handleDelete(e, trip)}
                        disabled={deleting === trip.id}
                        id={`trip-del-${trip.id}`}
                        aria-label="Delete trip"
                      >
                        {deleting === trip.id ? <Spinner size="sm" /> : <Trash2 size={14} />}
                      </button>
                    </div>

                    <div className="trip-dates">
                      <Calendar size={13} />
                      {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
                    </div>

                    <div className="trip-card-meta">
                      <Badge variant={statusColor(trip.status)}>{trip.status}</Badge>
                      <span className="trip-collab">
                        <Users size={12} />
                        {trip.collaborators?.length || 1} traveler{trip.collaborators?.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {trip.totalBudget > 0 && (
                      <div className="trip-budget-preview">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                          <span>Budget used</span>
                          <span>{budgetPct.toFixed(0)}%</span>
                        </div>
                        <div className="progress-bar-track" style={{ height: 5 }}>
                          <div
                            className={`progress-bar-fill ${budgetPct >= 100 ? 'danger' : budgetPct >= 85 ? 'warning' : ''}`}
                            style={{ width: `${budgetPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style>{`
        .dash-page { max-width: 1140px; margin: 0 auto; position: relative; overflow: hidden; }

        /* Floating orb decorations */
        .dash-bg-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
          animation: orbFloat 8s ease-in-out infinite;
        }
        .orb-1 { width: 400px; height: 400px; background: rgba(249,115,22,0.06); top: -100px; right: -100px; animation-delay: 0s; }
        .orb-2 { width: 350px; height: 350px; background: rgba(244,63,94,0.05); bottom: 10%; left: -80px; animation-delay: -3s; }
        .orb-3 { width: 250px; height: 250px; background: rgba(55,48,163,0.05); top: 50%; right: 20%; animation-delay: -5s; }
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }

        /* Wave emoji animation */
        .wave-emoji { display: inline-block; animation: wave 2.5s ease-in-out infinite; transform-origin: 70% 70%; }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-8deg); }
          60% { transform: rotate(12deg); }
          80% { transform: rotate(-4deg); }
        }

        /* Stat card hover shimmer */
        .dash-stat-card {
          position: relative;
          overflow: hidden;
        }
        .dash-stat-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(125deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%);
          background-size: 200% 200%;
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .dash-stat-card:hover::after { transform: translateX(100%); }

        .dash-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 2rem;
          gap: 1rem;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }
        .dash-greeting { font-size: clamp(1.3rem, 3vw, 1.9rem); margin-bottom: 0.35rem; }
        .dash-name { background: var(--gradient-brand); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .dash-sub { color: var(--text-muted); font-size: 0.9rem; }

        .dash-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2.5rem;
        }
        @media (max-width: 640px) { .dash-stats-row { grid-template-columns: 1fr; } }
        .dash-stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--gradient-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
        }
        .dash-stat-icon {
          width: 46px; height: 46px; border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dash-stat-icon-teal   { background: rgba(20,184,166,0.15); color: var(--teal-400); }
        .dash-stat-icon-sky    { background: rgba(56,189,248,0.15); color: var(--sky-400); }
        .dash-stat-icon-amber  { background: rgba(251,191,36,0.15); color: var(--amber-400); }
        .dash-stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
        .dash-stat-label { font-size: 0.78rem; color: var(--text-muted); }

        .dash-section { }
        .dash-section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          color: var(--text-secondary);
          margin-bottom: 1.25rem;
        }
        .dash-error {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
        .dash-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          background: var(--gradient-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          gap: 0.75rem;
        }
        .dash-empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
        .dash-empty h3 { font-size: 1.2rem; }
        .dash-empty p { color: var(--text-muted); max-width: 340px; }

        .trip-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }
        .trip-card {
          background: var(--gradient-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          overflow: hidden;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          transition: transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal);
          cursor: pointer;
        }
        .trip-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg), var(--shadow-glow);
          border-color: var(--border-strong);
        }
        .trip-card-banner {
          height: 100px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .trip-card-emoji { font-size: 2.7rem; animation: diya-float 4s ease-in-out infinite; }
        .trip-countdown {
          position: absolute;
          top: 0.6rem;
          right: 0.7rem;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(6px);
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.2rem 0.55rem;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .trip-countdown.active { background: rgba(20,184,166,0.5); border: 1px solid rgba(20,184,166,0.5); }
        .trip-card-body { padding: 1.1rem 1.25rem; display: flex; flex-direction: column; gap: 0.65rem; }
        .trip-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
        .trip-name { font-size: 0.98rem; font-weight: 600; color: var(--text-primary); margin: 0; }
        .trip-dest { font-size: 0.78rem; color: var(--text-muted); margin-top: 0.15rem; }
        .trip-delete-btn {
          background: none; border: 1px solid transparent; border-radius: var(--radius-sm);
          color: var(--text-muted); padding: 0.3rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all var(--transition-fast); flex-shrink: 0;
        }
        .trip-delete-btn:hover { color: var(--coral-400); border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.08); }
        .trip-dates { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: var(--text-muted); }
        .trip-card-meta { display: flex; align-items: center; gap: 0.75rem; }
        .trip-collab { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: var(--text-muted); }
        .trip-budget-preview { margin-top: 0.25rem; }
      `}</style>
    </div>
  );
};

export default Dashboard;
