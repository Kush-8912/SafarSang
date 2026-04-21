import { useState, useCallback } from 'react';
import { Map, Plus, Trash2, Edit3, Clock, MapPin, CheckCircle } from 'lucide-react';
import { useTripContext } from '../../context/TripContext';
import {
  addItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
} from '../../services/trip.service';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import SegmentedDateInput, { dmyToYmd, ymdToDmy } from '../ui/SegmentedDateInput';

const CATEGORY_COLORS = {
  transport: 'sky',
  accommodation: 'violet',
  activity: 'teal',
  food: 'amber',
  other: 'gray',
};

const pad2 = (n) => String(n).padStart(2, '0');


// --- Time helpers (user-facing HH:MM + AM/PM, stored as 24h HH:MM) ---
const maskHM = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 4); // HHMM
  const hh = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  return [hh, mm].filter(Boolean).join(':');
};

const hmAmpmTo24hIfComplete = ({ hm, ampm }) => {
  const digits = String(hm || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length !== 4) return '';
  const hh12 = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  if (hh12 < 1 || hh12 > 12) return '';
  if (mm < 0 || mm > 59) return '';
  const isPM = ampm === 'PM';
  let hh24 = hh12 % 12;
  if (isPM) hh24 += 12;
  return `${pad2(hh24)}:${pad2(mm)}`;
};

const from24hToHmAmpm = (time24) => {
  if (!time24 || !time24.includes(':')) return { hm: '', ampm: 'AM' };
  const [hhRaw, mmRaw] = time24.split(':');
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return { hm: '', ampm: 'AM' };
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return { hm: `${pad2(h12)}:${pad2(mm)}`, ampm };
};

/**
 * ItineraryPlanner — daily schedule builder with drag-to-reorder support.
 * Demonstrates controlled components, lifting state up, and list rendering.
 */
const ItineraryPlanner = () => {
  const { activeTrip, itinerary, setItinerary } = useTripContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    // Canonical values we persist
    date: '', // "YYYY-MM-DD"
    time: '', // "HH:MM"
    // User-friendly inputs
    dateInput: '', // "DD-MM-YYYY"
    timeInput: '', // "HH:MM" in 12-hour form
    ampm: 'AM',
    title: '',
    location: '',
    category: 'activity',
    notes: '',
    confirmed: false,
  });

  const resetForm = () => {
    setForm({
      date: '',
      time: '',
      dateInput: '',
      timeInput: '',
      ampm: 'AM',
      title: '',
      location: '',
      category: 'activity',
      notes: '',
      confirmed: false
    });
    setEditing(null);
    setFormError('');
  };

  const openAddModal = () => { resetForm(); setModalOpen(true); };

  const openEditModal = (item) => {
    setEditing(item.id);
    setFormError('');
    const t = from24hToHmAmpm(item.time || '');
    setForm({
      date: item.date || '',
      time: item.time || '',
      dateInput: ymdToDmy(item.date || ''),
      timeInput: t.hm,
      ampm: t.ampm,
      title: item.title || '',
      location: item.location || '',
      category: item.category || 'activity',
      notes: item.notes || '',
      confirmed: item.confirmed || false,
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormError('');
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleTimeInputChange = (e) => {
    const masked = maskHM(e.target.value);
    setFormError('');
    setForm((prev) => {
      const time24 = hmAmpmTo24hIfComplete({ hm: masked, ampm: prev.ampm });
      return { ...prev, timeInput: masked, time: time24 };
    });
  };

  const handleAmpmChange = (e) => {
    const ampm = e.target.value;
    setFormError('');
    setForm((prev) => {
      const time24 = hmAmpmTo24hIfComplete({ hm: prev.timeInput, ampm });
      return { ...prev, ampm, time: time24 };
    });
  };

  const handleSave = async () => {
    if (!activeTrip?.id) {
      setFormError('Trip is not loaded yet. Please wait a second and try again.');
      return;
    }

    const title = (form.title || '').trim();
    const date = (form.date || '').trim();
    const time = (form.time || '').trim();
    const location = (form.location || '').trim();
    const notes = (form.notes || '').trim();
    const category = (form.category || '').trim();

    // All fields (except confirmed) are mandatory
    if (!date) { setFormError('Date is required.'); return; }
    if (!time) { setFormError('Time is required.'); return; }
    if (!title) { setFormError('Title is required.'); return; }
    if (!location) { setFormError('Location is required.'); return; }
    if (!category) { setFormError('Category is required.'); return; }
    if (!notes) { setFormError('Notes are required.'); return; }

    const cleaned = {
      ...form,
      title,
      date,
      time,
      location,
      notes,
      category,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateItineraryItem(activeTrip.id, editing, cleaned);
        setItinerary((prev) => prev.map((i) => i.id === editing ? { ...i, ...cleaned } : i));
      } else {
        const ref = await addItineraryItem(activeTrip.id, cleaned);
        setItinerary((prev) => [...prev, { id: ref.id, ...cleaned }]);
      }
      setModalOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err?.message || 'Failed to save activity. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback(async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    await deleteItineraryItem(activeTrip.id, item.id);
    setItinerary((prev) => prev.filter((i) => i.id !== item.id));
  }, [activeTrip, setItinerary]);

  // Group items by date
  const grouped = itinerary.reduce((acc, item) => {
    const d = item.date || 'Unscheduled';
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="itin-wrap animate-fade-in">
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon"><Map size={18} /></span>
          Itinerary Planner
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={openAddModal} id="itin-add-btn">
          Add Activity
        </Button>
      </div>

      {sortedDates.length === 0 ? (
        <div className="empty-state">
          <Map size={48} />
          <h4>No activities yet</h4>
          <p>Start building your day-by-day itinerary</p>
        </div>
      ) : (
        sortedDates.map((date, di) => (
          <div key={date} className="itin-day animate-fade-in" style={{ animationDelay: `${di * 0.05}s` }}>
            <div className="itin-day-header">
              <span className="itin-day-date">{date === 'Unscheduled' ? 'Unscheduled' : new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              <span className="itin-day-count">{grouped[date].length} activities</span>
            </div>
            <div className="itin-items">
              {grouped[date]
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                .map((item) => (
                  <div key={item.id} className="itin-item">
                    <div className="itin-timeline">
                      <div className="itin-dot" />
                      <div className="itin-line" />
                    </div>
                    <div className="itin-card">
                      <div className="itin-card-top">
                        <div className="itin-meta">
                          {item.time && (
                            <span className="itin-time"><Clock size={12} />{item.time}</span>
                          )}
                          <Badge variant={CATEGORY_COLORS[item.category] || 'gray'}>
                            {item.category}
                          </Badge>
                          {item.confirmed && (
                            <Badge variant="teal" dot>Confirmed</Badge>
                          )}
                        </div>
                        <div className="itin-actions">
                          <button className="icon-btn" onClick={() => openEditModal(item)} id={`itin-edit-${item.id}`}><Edit3 size={14} /></button>
                          <button className="icon-btn danger" onClick={() => handleDelete(item)} id={`itin-del-${item.id}`}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <h4 className="itin-title">{item.title}</h4>
                      {item.location && (
                        <p className="itin-location"><MapPin size={12} />{item.location}</p>
                      )}
                      {item.notes && <p className="itin-notes">{item.notes}</p>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editing ? 'Edit Activity' : 'Add Activity'}
        subtitle="Fill in the details for this itinerary item"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave} id="itin-save-btn">
              {editing ? 'Save Changes' : 'Add Activity'}
            </Button>
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
        <div className="modal-form-grid">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <SegmentedDateInput
              id="itin-date"
              value={form.dateInput}
              onChange={(v) => {
                setFormError('');
                setForm((prev) => ({ ...prev, dateInput: v, date: dmyToYmd(v) }));
              }}
              required
              ariaLabel="Itinerary date"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Time *</label>
            <div className="time-picker">
              <input
                type="text"
                inputMode="numeric"
                placeholder="HH:MM"
                value={form.timeInput}
                onChange={handleTimeInputChange}
                className="form-input form-input-datetime"
                maxLength={5}
                required
              />
              <select
                value={form.ampm}
                onChange={handleAmpmChange}
                className="form-input form-input-datetime"
                required
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
          <div className="form-group full-span">
            <label className="form-label">Title *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. Flight to Paris, Hotel Check-in"
              required
            />
          </div>
          <div className="form-group full-span">
            <label className="form-label">Location *</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="form-input"
              placeholder="Address or place name"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select name="category" value={form.category} onChange={handleChange} className="form-input" required>
              <option value="transport">Transport</option>
              <option value="accommodation">Accommodation</option>
              <option value="activity">Activity</option>
              <option value="food">Food</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group" style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.88rem', padding: '0.85rem 0' }}>
              <input type="checkbox" name="confirmed" checked={form.confirmed} onChange={handleChange} style={{ accentColor: 'var(--teal-500)', width: 16, height: 16, cursor: 'pointer' }} />
              Mark as Confirmed
            </label>
          </div>
          <div className="form-group full-span">
            <label className="form-label">Notes *</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="form-input"
              rows={3}
              placeholder="Additional notes..."
              style={{ resize: 'vertical', minHeight: '80px', lineHeight: '1.6', fontFamily: 'inherit' }}
              required
            />
          </div>
        </div>
      </Modal>

      <style>{`
        .itin-wrap { display: flex; flex-direction: column; gap: 1.5rem; }
        .itin-day { }
        .itin-day-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-subtle);
        }
        .itin-day-date { font-weight: 600; font-size: 0.95rem; color: var(--text-primary); }
        .itin-day-count { font-size: 0.78rem; color: var(--text-muted); background: var(--bg-elevated); padding: 0.2rem 0.6rem; border-radius: var(--radius-full); }
        .itin-items { display: flex; flex-direction: column; gap: 0.75rem; }
        .itin-item { display: flex; gap: 0.75rem; }
        .itin-timeline { display: flex; flex-direction: column; align-items: center; padding-top: 0.65rem; }
        .itin-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--teal-500); flex-shrink: 0; box-shadow: 0 0 8px rgba(20,184,166,0.5); }
        .itin-line { flex: 1; width: 2px; background: var(--border-subtle); margin-top: 4px; min-height: 20px; }
        .itin-card {
          flex: 1;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 0.9rem 1rem;
          transition: border-color var(--transition-fast);
        }
        .itin-card:hover { border-color: var(--border-default); }
        .itin-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.35rem; gap: 0.5rem; flex-wrap: wrap; }
        .itin-meta { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
        .itin-time { display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; color: var(--text-muted); }
        .itin-actions { display: flex; gap: 0.35rem; flex-shrink: 0; }
        .itin-title { font-size: 0.92rem; font-weight: 600; color: var(--text-primary); margin: 0.25rem 0; }
        .itin-location { display: flex; align-items: center; gap: 0.3rem; font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem; }
        .itin-notes { font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.35rem; line-height: 1.5; }
        .icon-btn {
          background: none;
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          padding: 0.3rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }
        .icon-btn:hover { background: var(--bg-elevated); color: var(--text-primary); border-color: var(--border-default); }
        .icon-btn.danger:hover { color: var(--coral-400); border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.08); }
        .modal-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .modal-form-grid .full-span {
          grid-column: 1 / -1;
        }

        /* ── Date & Time input fixes (WebKit / Safari) ─── */
        .form-input-datetime {
          color-scheme: light;
          color: var(--text-primary);
          -webkit-text-fill-color: var(--text-primary);
          background: var(--bg-elevated);
          border: 2px solid var(--border-subtle);
          min-height: 50px;
          font-size: 1rem;
          line-height: 1.2;
        }
        .form-input-datetime::-webkit-calendar-picker-indicator {
          opacity: 0.6;
          cursor: pointer;
          filter: invert(35%) sepia(30%) saturate(500%) hue-rotate(340deg);
          width: 18px;
          height: 18px;
        }
        .form-input-datetime::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
        .form-input-datetime::-webkit-datetime-edit {
          color: var(--text-primary);
          padding: 0;
        }
        .form-input-datetime::-webkit-datetime-edit-fields-wrapper {
          background: transparent;
        }
        .form-input-datetime::-webkit-datetime-edit-text,
        .form-input-datetime::-webkit-datetime-edit-month-field,
        .form-input-datetime::-webkit-datetime-edit-day-field,
        .form-input-datetime::-webkit-datetime-edit-year-field,
        .form-input-datetime::-webkit-datetime-edit-hour-field,
        .form-input-datetime::-webkit-datetime-edit-minute-field,
        .form-input-datetime::-webkit-datetime-edit-ampm-field {
          color: var(--text-primary);
          background: transparent;
        }
        .form-input-datetime::-webkit-inner-spin-button { display: none; }

        .segdate-wrap { display: flex; align-items: center; gap: 0.45rem; }
        .segdate-part { width: 3.3rem; text-align: center; padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
        .segdate-year { width: 4.9rem; }
        .segdate-sep { color: var(--text-muted); font-weight: 700; user-select: none; }
        .segdate-calendar-btn {
          height: 50px; width: 44px; border-radius: var(--radius-sm); border: 2px solid var(--border-subtle);
          background: var(--bg-elevated); cursor: pointer;
        }
        .segdate-native { position: absolute; opacity: 0; pointer-events: none; width: 1px; height: 1px; }

        .time-picker {
          display: grid;
          grid-template-columns: 1fr 110px;
          gap: 0.5rem;
          align-items: center;
        }

        @media (max-width: 500px) {
          .modal-form-grid { grid-template-columns: 1fr; }
          .modal-form-grid .full-span { grid-column: 1; }
          .time-picker { grid-template-columns: 1fr 90px; }
        }
      `}</style>
    </div>
  );
};

export default ItineraryPlanner;
