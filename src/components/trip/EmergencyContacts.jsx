import { useState } from 'react';
import { Phone, Plus, Trash2, User } from 'lucide-react';
import { useTripContext } from '../../context/TripContext';
import { addEmergencyContact, deleteEmergencyContact } from '../../services/trip.service';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';

const TYPES = ['Personal', 'Medical', 'Hotel', 'Embassy', 'Local Police', 'Tour Guide', 'Other'];

const typeColor = (type) => {
  if (type === 'Medical') return 'coral';
  if (type === 'Embassy') return 'violet';
  if (type === 'Personal') return 'teal';
  return 'gray';
};

/**
 * EmergencyContacts — trip-specific emergency contacts directory.
 */
const EmergencyContacts = () => {
  const { activeTrip, emergency, setEmergency } = useTripContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', type: 'Personal', relation: '', notes: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleAdd = async () => {
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      const ref = await addEmergencyContact(activeTrip.id, form);
      setEmergency((prev) => [...prev, { id: ref.id, ...form }]);
      setModalOpen(false);
      setForm({ name: '', phone: '', type: 'Personal', relation: '', notes: '' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contact) => {
    if (!window.confirm(`Remove ${contact.name}?`)) return;
    await deleteEmergencyContact(activeTrip.id, contact.id);
    setEmergency((prev) => prev.filter((c) => c.id !== contact.id));
  };

  return (
    <div className="ec-wrap animate-fade-in">
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--coral-400)' }}>
            <Phone size={18} />
          </span>
          Emergency Contacts
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setModalOpen(true)} id="ec-add-btn">
          Add Contact
        </Button>
      </div>

      {emergency.length === 0 ? (
        <div className="empty-state">
          <Phone size={48} />
          <h4>No emergency contacts</h4>
          <p>Add contacts for medical, embassy, hotel, and personal use</p>
        </div>
      ) : (
        <div className="ec-grid">
          {emergency.map((contact) => (
            <div key={contact.id} className="ec-card">
              <div className="ec-card-top">
                <Badge variant={typeColor(contact.type)}>{contact.type}</Badge>
                <button className="icon-btn danger" onClick={() => handleDelete(contact)} id={`ec-del-${contact.id}`}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="ec-avatar">
                <User size={20} />
              </div>
              <h4 className="ec-name">{contact.name}</h4>
              {contact.relation && <p className="ec-relation">{contact.relation}</p>}
              <a href={`tel:${contact.phone}`} className="ec-phone" id={`ec-call-${contact.id}`}>
                <Phone size={14} />
                {contact.phone}
              </a>
              {contact.notes && <p className="ec-notes">{contact.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Emergency Contact"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleAdd} id="ec-save-btn">Add Contact</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input name="name" value={form.name} onChange={handleChange} className="form-input" placeholder="Contact name" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} className="form-input" placeholder="+1 555 000 0000" />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select name="type" value={form.type} onChange={handleChange} className="form-input">
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Relation / Role</label>
            <input name="relation" value={form.relation} onChange={handleChange} className="form-input" placeholder="e.g. Doctor, Friend, Hotel Manager" />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} className="form-input" rows={2} style={{ resize: 'vertical' }} />
          </div>
        </div>
      </Modal>

      <style>{`
        .ec-wrap { display: flex; flex-direction: column; gap: 1.25rem; }
        .ec-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; }
        .ec-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          align-items: flex-start;
          transition: border-color var(--transition-fast);
        }
        .ec-card:hover { border-color: var(--border-default); }
        .ec-card-top { display: flex; align-items: center; justify-content: space-between; width: 100%; }
        .ec-avatar {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          margin: 0.25rem 0;
        }
        .ec-name { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); margin: 0; }
        .ec-relation { font-size: 0.76rem; color: var(--text-muted); }
        .ec-phone {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.85rem;
          color: var(--teal-400);
          text-decoration: none;
          font-weight: 500;
        }
        .ec-phone:hover { color: var(--teal-500); }
        .ec-notes { font-size: 0.76rem; color: var(--text-secondary); border-top: 1px solid var(--border-subtle); padding-top: 0.4rem; width: 100%; }
        .icon-btn {
          background: none; border: 1px solid transparent; border-radius: var(--radius-sm);
          color: var(--text-muted); padding: 0.3rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all var(--transition-fast);
        }
        .icon-btn:hover { background: var(--bg-elevated); color: var(--text-primary); border-color: var(--border-default); }
        .icon-btn.danger:hover { color: var(--coral-400); border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.08); }
      `}</style>
    </div>
  );
};

export default EmergencyContacts;
