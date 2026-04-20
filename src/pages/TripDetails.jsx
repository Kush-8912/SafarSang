import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, IndianRupee, FileText, Package,
  ShieldAlert, Phone, MessageSquare, AlertTriangle
} from 'lucide-react';
import { useTripContext } from '../context/TripContext';
import { useTripData } from '../hooks/useTripData';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';

// Lazy is handled at App.jsx level; imports directly here for stability
import ItineraryPlanner from '../components/trip/ItineraryPlanner';
import BudgetSplitter from '../components/trip/BudgetSplitter';
import DocumentVault from '../components/trip/DocumentVault';
import PackingList from '../components/trip/PackingList';
import RiskFlags from '../components/trip/RiskFlags';
import EmergencyContacts from '../components/trip/EmergencyContacts';
import TripComments from '../components/trip/TripComments';

const TAB_CONFIG = [
  { key: 'itinerary',  label: 'Itinerary',  icon: Map,          component: ItineraryPlanner },
  { key: 'budget',     label: 'Budget',      icon: IndianRupee,   component: BudgetSplitter },
  { key: 'documents',  label: 'Documents',   icon: FileText,     component: DocumentVault },
  { key: 'packing',    label: 'Packing',     icon: Package,      component: PackingList },
  { key: 'risks',      label: 'Risk Flags',  icon: ShieldAlert,  component: RiskFlags },
  { key: 'emergency',  label: 'Emergency',   icon: Phone,        component: EmergencyContacts },
  { key: 'comments',   label: 'Comments',    icon: MessageSquare, component: TripComments },
];

/**
 * TripDetails — full trip management hub with tab-based sections.
 * Demonstrates nested routing with dynamic params, context consumption,
 * and component lazy loading.
 */
const TripDetails = () => {
  const { tripId } = useParams();
  const { activeTrip, activeTab, setActiveTab, loading, riskFlags } = useTripContext();
  const { fetchError } = useTripData(tripId);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--coral-400)' }}>
        <AlertTriangle size={40} />
        <p style={{ marginTop: '1rem' }}>{fetchError}</p>
      </div>
    );
  }

  const highRisks = riskFlags.filter((f) => f.severity === 'high').length;
  const ActiveComponent = TAB_CONFIG.find((t) => t.key === activeTab)?.component || ItineraryPlanner;

  return (
    <div className="trip-page animate-fade-in">
      {/* Trip Header */}
      {activeTrip && (
        <div className="trip-page-header">
          <div>
            <div className="trip-page-breadcrumb">
              <span>My Trips</span>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)' }}>{activeTrip.name}</span>
            </div>
            <h1 className="trip-page-title">{activeTrip.name}</h1>
            <div className="trip-page-meta">
              <Badge variant={{ planning: 'amber', confirmed: 'teal', completed: 'gray' }[activeTrip.status] || 'gray'}>
                {activeTrip.status}
              </Badge>
              {activeTrip.destination && (
                <span className="trip-page-dest">📍 {activeTrip.destination}</span>
              )}
              {activeTrip.startDate && (
                <span className="trip-page-date">
                  📅 {new Date(activeTrip.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {activeTrip.endDate && ' → ' + new Date(activeTrip.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          {/* Budget summary pill */}
          {activeTrip.totalBudget > 0 && (
            <div className="trip-page-budget-pill">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Budget</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                ₹{(activeTrip.totalSpent || 0).toLocaleString()}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                  {' '}/ ₹{activeTrip.totalBudget.toLocaleString()}
                </span>
              </span>
              {highRisks > 0 && (
                <span className="trip-risk-pulse">
                  <AlertTriangle size={12} />
                  {highRisks} risk{highRisks !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="trip-tabs-wrap">
        <nav className="trip-tabs" role="tablist" aria-label="Trip sections">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`trip-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              id={`trip-tab-${tab.key}`}
            >
              <tab.icon size={15} style={{ position: 'relative', zIndex: 1 }} />
              <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
              {tab.key === 'risks' && highRisks > 0 && (
                <span className="tab-badge" style={{ position: 'relative', zIndex: 1 }}>{highRisks}</span>
              )}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="trip-tab-bg"
                  className="trip-tab-active-bg"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Active Tab Content */}
      <div className="trip-tab-panel" role="tabpanel">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      <style>{`
        .trip-page { max-width: 1000px; margin: 0 auto; }
        .trip-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.75rem;
          flex-wrap: wrap;
        }
        .trip-page-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-bottom: 0.35rem;
        }
        .trip-page-title { font-size: clamp(1.4rem, 3vw, 2rem); margin: 0 0 0.5rem; }
        .trip-page-meta { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .trip-page-dest, .trip-page-date { font-size: 0.82rem; color: var(--text-muted); }
        .trip-page-budget-pill {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.2rem;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 0.75rem 1.1rem;
          flex-shrink: 0;
        }
        .trip-risk-pulse {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.72rem;
          color: var(--coral-400);
          background: rgba(239,68,68,0.1);
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-full);
        }

        .trip-tabs-wrap {
          overflow-x: auto;
          margin-bottom: 1.5rem;
          -webkit-overflow-scrolling: touch;
        }
        .trip-tabs {
          display: flex;
          gap: 0.25rem;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 0;
          min-width: max-content;
        }
        .trip-tab {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.65rem 1rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
          font-family: 'Inter', sans-serif;
          position: relative;
          bottom: -1px;
        }
        .trip-tab:hover { color: var(--text-primary); }
        .trip-tab.active {
          color: var(--teal-500);
        }
        .trip-tab-active-bg {
          position: absolute;
          inset: 0;
          background: var(--bg-elevated);
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          border-bottom: 2px solid var(--teal-500);
          z-index: 0;
        }
        .tab-badge {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--coral-400);
          color: white;
          font-size: 0.6rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .trip-tab-panel {
          background: var(--gradient-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 1.75rem;
        }
        @media (max-width: 640px) {
          .trip-tab-panel { padding: 1.25rem; }
        }
      `}</style>
    </div>
  );
};

export default TripDetails;
