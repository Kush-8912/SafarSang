import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, IndianRupee, FileText, Package, Edit3, Users,
  ShieldAlert, Phone, MessageSquare, AlertTriangle
} from 'lucide-react';
import { useTripContext } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { useTripData } from '../hooks/useTripData';
import { updateTrip } from '../services/trip.service';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SegmentedDateInput, { dmyToYmd, isDmy, ymdToDmy } from '../components/ui/SegmentedDateInput';

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
  const { user } = useAuth();
  const { activeTrip, setActiveTrip, activeTab, setActiveTab, loading, riskFlags } = useTripContext();
  const { fetchError } = useTripData(tripId);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [metaForm, setMetaForm] = useState({
    startDate: '',
    endDate: '',
    travelerCount: 1,
    status: 'planning',
  });

  const formatDmy = (ymd) => {
    if (!ymd) return 'TBD';
    const d = new Date(`${ymd}T00:00:00`);
    if (Number.isNaN(d.getTime())) return 'TBD';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const openEditModal = () => {
    if (!activeTrip) return;
    setFormError('');
    setMetaForm({
      startDate: ymdToDmy(activeTrip.startDate || ''),
      endDate: ymdToDmy(activeTrip.endDate || ''),
      travelerCount: Number(activeTrip.travelerCount || activeTrip.collaborators?.length || 1),
      status: activeTrip.status || 'planning',
    });
    setEditOpen(true);
  };

  const handleMetaChange = (e) => {
    const { name, value } = e.target;
    setFormError('');
    if (name === 'travelerCount') {
      const digits = String(value ?? '').replace(/\D/g, '');
      const next = digits === '' ? 1 : Math.max(1, Number(digits));
      setMetaForm((prev) => ({ ...prev, travelerCount: next }));
      return;
    }
    setMetaForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveTripMeta = async () => {
    if (!activeTrip?.id) return;
    const travelerCount = Number(metaForm.travelerCount);
    if (!metaForm.startDate) { setFormError('Start date is required.'); return; }
    if (!metaForm.endDate) { setFormError('End date is required.'); return; }
    if (!isDmy(metaForm.startDate) || !isDmy(metaForm.endDate)) {
      setFormError('Dates must be in DD-MM-YYYY format.');
      return;
    }
    const startYmd = dmyToYmd(metaForm.startDate);
    const endYmd = dmyToYmd(metaForm.endDate);
    if (!startYmd || !endYmd) { setFormError('Please enter valid dates.'); return; }
    if (startYmd > endYmd) { setFormError('End date must be on or after start date.'); return; }
    if (!Number.isFinite(travelerCount) || travelerCount < 1) { setFormError('Traveler count must be at least 1.'); return; }
    if (!['planning', 'confirmed', 'completed'].includes(metaForm.status)) { setFormError('Please select a valid status.'); return; }

    const updates = {
      startDate: startYmd,
      endDate: endYmd,
      travelerCount,
      status: metaForm.status,
    };

    setSaving(true);
    try {
      await updateTrip(activeTrip.id, updates);
      setActiveTrip((prev) => {
        const next = prev ? { ...prev, ...updates } : prev;
        if (next && user?.uid) {
          const cacheKey = `safarsang_dashboard_trips_v1_${user.uid}`;
          try {
            const raw = localStorage.getItem(cacheKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed?.trips)) {
                const trips = parsed.trips.map((t) => (t.id === next.id ? { ...t, ...updates } : t));
                localStorage.setItem(cacheKey, JSON.stringify({ updatedAt: Date.now(), trips }));
              }
            }
          } catch {
            // Ignore cache errors
          }
        }
        return next;
      });
      setEditOpen(false);
    } catch (err) {
      setFormError(err?.message || 'Failed to update trip details.');
    } finally {
      setSaving(false);
    }
  };

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
              <span>My Safars</span>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)' }}>{activeTrip.name}</span>
            </div>
            <h1 className="trip-page-title">{activeTrip.name}</h1>
            <div className="trip-page-meta">
              <Badge variant={{ planning: 'amber', confirmed: 'teal', completed: 'gray' }[activeTrip.status] || 'gray'}>
                {activeTrip.status}
              </Badge>
              <span className="trip-page-dest"><Users size={12} style={{ verticalAlign: 'text-bottom' }} /> {Number(activeTrip.travelerCount || activeTrip.collaborators?.length || 1)} traveler{Number(activeTrip.travelerCount || activeTrip.collaborators?.length || 1) !== 1 ? 's' : ''}</span>
              {activeTrip.destination && (
                <span className="trip-page-dest">📍 {activeTrip.destination}</span>
              )}
              {activeTrip.startDate && (
                <span className="trip-page-date">
                  📅 {formatDmy(activeTrip.startDate)}
                  {activeTrip.endDate && ' → ' + formatDmy(activeTrip.endDate)}
                </span>
              )}
            </div>
            <div style={{ marginTop: '0.65rem' }}>
              <Button variant="secondary" size="sm" icon={Edit3} onClick={openEditModal} id="trip-meta-edit-btn">
                Edit Safar Details
              </Button>
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

      <Modal
        isOpen={editOpen}
        onClose={() => { if (!saving) setEditOpen(false); }}
        title="Edit Trip Details"
        subtitle="Update dates, traveler count, and status"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={saveTripMeta} loading={saving} id="trip-meta-save-btn">Save Changes</Button>
          </>
        }
      >
        {formError && (
          <div
            role="alert"
            style={{
              marginBottom: '1rem',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 0.9rem',
              color: 'var(--coral-400)',
              fontSize: '0.85rem',
            }}
          >
            {formError}
          </div>
        )}
        <div className="trip-meta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Start Date *</label>
            <SegmentedDateInput id="trip-meta-start" value={metaForm.startDate} onChange={(v) => { setFormError(''); setMetaForm((prev) => ({ ...prev, startDate: v })); }} required ariaLabel="Trip start date" />
          </div>
          <div className="form-group">
            <label className="form-label">End Date *</label>
            <SegmentedDateInput id="trip-meta-end" value={metaForm.endDate} onChange={(v) => { setFormError(''); setMetaForm((prev) => ({ ...prev, endDate: v })); }} required ariaLabel="Trip end date" />
          </div>
          <div className="form-group">
            <label className="form-label">Travelers *</label>
            <input name="travelerCount" type="number" min="1" step="1" value={metaForm.travelerCount} onChange={handleMetaChange} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Status *</label>
            <select name="status" value={metaForm.status} onChange={handleMetaChange} className="form-input" required>
              <option value="planning">Planning</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </Modal>

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
        .trip-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .segdate-wrap { display: flex; align-items: center; gap: 0.45rem; }
        .segdate-part { width: 3.3rem; text-align: center; padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
        .segdate-year { width: 4.9rem; }
        .segdate-sep { color: var(--text-muted); font-weight: 700; user-select: none; }
        .segdate-calendar-btn {
          height: 44px; width: 44px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);
          background: var(--bg-elevated); cursor: pointer;
        }
        .segdate-native { position: absolute; opacity: 0; pointer-events: none; width: 1px; height: 1px; }
        @media (max-width: 640px) {
          .trip-tab-panel { padding: 1.25rem; }
          .trip-meta-grid { grid-template-columns: 1fr; }
          .segdate-wrap { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
};

export default TripDetails;
