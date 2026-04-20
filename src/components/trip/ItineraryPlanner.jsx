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

const CATEGORY_COLORS = {
  transport: 'sky',
  accommodation: 'violet',
  activity: 'teal',
  food: 'amber',
  other: 'gray',
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
  const [form, setForm] = useState({
    date: '',
    time: '',
    title: '',
    location: '',
    category: 'activity',
    notes: '',
    confirmed: false,
  });

  const resetForm = () => {
    setForm({ date: '', time: '', title: '', location: '', category: 'activity', notes: '', confirmed: false });
    setEditing(null);
  };

  const openAddModal = () => { resetForm(); setModalOpen(true); };

  const openEditModal = (item) => {
    setEditing(item.id);
    setForm({
      date: item.date || '',
      time: item.time || '',
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
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    if (!form.date || !form.title) return;
    setSaving(true);
    try {
      if (editing) {
        await updateItineraryItem(activeTrip.id, editing, form);
        setItinerary((prev) => prev.map((i) => i.id === editing ? { ...i, ...form } : i));
      } else {
        const ref = await addItineraryItem(activeTrip.id, form);
        setItinerary((prev) => [...prev, { id: ref.id, ...form }]);
      }
      setModalOpen(false);
      resetForm();
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
        <div className="modal-form-grid">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="form-input form-input-datetime"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Time</label>
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={handleChange}
              className="form-input form-input-datetime"
            />
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
            />
          </div>
          <div className="form-group full-span">
            <label className="form-label">Location</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="form-input"
              placeholder="Address or place name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select name="category" value={form.category} onChange={handleChange} className="form-input">
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
            <label className="form-label">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="form-input"
              rows={3}
              placeholder="Additional notes..."
              style={{ resize: 'vertical', minHeight: '80px', lineHeight: '1.6', fontFamily: 'inherit' }}
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
          background: var(--bg-elevated);
          border: 2px solid var(--border-subtle);
          min-height: 50px;
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

        @media (max-width: 500px) {
          .modal-form-grid { grid-template-columns: 1fr; }
          .modal-form-grid .full-span { grid-column: 1; }
        }
      `}</style>
    </div>
  );
};

export default ItineraryPlanner;
