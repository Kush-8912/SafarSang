import { useState } from 'react';
import { FileText, Plus, Trash2, Edit3, Link } from 'lucide-react';
import { useTripContext } from '../../context/TripContext';
import { addDocument, updateDocumentItem, deleteDocument } from '../../services/trip.service';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import SegmentedDateInput, { dmyToYmd, ymdToDmy } from '../ui/SegmentedDateInput';

const DOC_TYPES = [
  { value: 'visa', label: 'Visa', color: 'violet' },
  { value: 'passport', label: 'Passport', color: 'teal' },
  { value: 'ticket', label: 'Ticket', color: 'sky' },
  { value: 'hotel', label: 'Hotel Booking', color: 'amber' },
  { value: 'insurance', label: 'Insurance', color: 'coral' },
  { value: 'other', label: 'Other', color: 'gray' },
];

const typeColor = (type) => DOC_TYPES.find((d) => d.value === type)?.color || 'gray';


/**
 * DocumentVault — store links to travel documents with categorization.
 */
const DocumentVault = () => {
  const { activeTrip, documents, setDocuments } = useTripContext();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '',
    type: 'visa',
    url: '',
    holder: '',
    expiryDate: '',      // canonical ISO "YYYY-MM-DD"
    expiryDateInput: '', // UI "DD-MM-YYYY"
    notes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormError('');
    setForm((p) => ({ ...p, [name]: value }));
  };

  const resetForm = () => {
    setForm({ name: '', type: 'visa', url: '', holder: '', expiryDate: '', expiryDateInput: '', notes: '' });
    setEditingId(null);
    setFormError('');
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (doc) => {
    setEditingId(doc.id);
    setFormError('');
    setForm({
      name: doc.name || '',
      type: doc.type || 'visa',
      url: doc.url || '',
      holder: doc.holder || '',
      expiryDate: doc.expiryDate || '',
      expiryDateInput: ymdToDmy(doc.expiryDate || ''),
      notes: doc.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const name = String(form.name || '').trim();
    const holder = String(form.holder || '').trim();
    const notes = String(form.notes || '').trim();
    const type = String(form.type || '').trim();
    const expiryDate = String(form.expiryDate || '').trim();
    const url = String(form.url || '').trim();

    // All fields mandatory; URL required
    if (!name) { setFormError('Document Name is required.'); return; }
    if (!type) { setFormError('Type is required.'); return; }
    if (!holder) { setFormError('Holder / Owner is required.'); return; }
    if (!expiryDate) { setFormError('Expiry Date is required (DD-MM-YYYY).'); return; }
    if (!notes) { setFormError('Notes are required.'); return; }
    if (!url) { setFormError('Document URL is required.'); return; }

    setSaving(true);
    try {
      const docPayload = {
        name,
        type,
        holder,
        expiryDate,
        notes,
        url,
        addedBy: user?.uid,
        addedByName: user?.displayName || 'Unknown',
      };

      if (editingId) {
        await updateDocumentItem(activeTrip.id, editingId, docPayload);
        setDocuments((prev) => prev.map((d) => (d.id === editingId ? { ...d, ...docPayload } : d)));
      } else {
        const ref = await addDocument(activeTrip.id, docPayload);
        setDocuments((prev) => [...prev, { id: ref.id, ...docPayload }]);
      }
      setModalOpen(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.name}"?`)) return;
    await deleteDocument(activeTrip.id, doc.id);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  };

  const grouped = documents.reduce((acc, doc) => {
    if (!acc[doc.type]) acc[doc.type] = [];
    acc[doc.type].push(doc);
    return acc;
  }, {});

  return (
    <div className="docsv-wrap animate-fade-in">
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--violet-400)' }}>
            <FileText size={18} />
          </span>
          Document Vault
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={openAddModal} id="doc-add-btn">
          Add Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h4>Vault is empty</h4>
          <p>Store links to visas, tickets, hotel bookings, and more</p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, docs]) => (
          <div key={type} className="doc-section">
            <p className="section-label-sm">{DOC_TYPES.find((d) => d.value === type)?.label?.toUpperCase() || type.toUpperCase()}</p>
            <div className="doc-grid">
              {docs.map((doc) => (
                <div key={doc.id} className="doc-card">
                  <div className="doc-card-top">
                    <Badge variant={typeColor(doc.type)}>{doc.type}</Badge>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button className="icon-btn" onClick={() => openEditModal(doc)} id={`doc-edit-${doc.id}`}>
                        <Edit3 size={13} />
                      </button>
                      <button className="icon-btn danger" onClick={() => handleDelete(doc)} id={`doc-del-${doc.id}`}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <h4 className="doc-name">{doc.name}</h4>
                  {doc.holder && <p className="doc-meta">Holder: {doc.holder}</p>}
                  {doc.expiryDate && <p className="doc-meta">Expires: {doc.expiryDate}</p>}
                  {doc.url && (
                    <p className="doc-link">
                      <Link size={11} />
                      <span>{doc.url.length > 40 ? doc.url.slice(0, 40) + '…' : doc.url}</span>
                    </p>
                  )}
                  {doc.notes && <p className="doc-notes">{doc.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingId ? 'Edit Document' : 'Add Document'}
        subtitle={editingId ? 'Update this travel document' : 'Add a link or reference to a travel document'}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave} id="doc-save-btn">
              {editingId ? 'Save Changes' : 'Add Document'}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Document Name *</label>
            <input name="name" value={form.name} onChange={handleChange} className="form-input" placeholder="e.g. John's US Visa" required />
          </div>
          <div className="form-group">
            <label className="form-label">Type *</label>
            <select name="type" value={form.type} onChange={handleChange} className="form-input" required>
              {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Holder / Owner *</label>
            <input name="holder" value={form.holder} onChange={handleChange} className="form-input" placeholder="Person this belongs to" required />
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Document URL (Google Drive, Dropbox, etc.) *</label>
            <input name="url" type="url" value={form.url} onChange={handleChange} className="form-input" placeholder="https://drive.google.com/..." required />
          </div>
          <div className="form-group">
            <label className="form-label">Expiry Date (DD-MM-YYYY) *</label>
            <SegmentedDateInput
              id="doc-expiry"
              value={form.expiryDateInput}
              onChange={(v) => {
                setFormError('');
                setForm((p) => ({ ...p, expiryDateInput: v, expiryDate: dmyToYmd(v) }));
              }}
              required
              ariaLabel="Document expiry date"
            />
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Notes *</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} className="form-input" rows={2} placeholder="Additional details..." style={{ resize: 'vertical' }} required />
          </div>
        </div>
      </Modal>

      <style>{`
        .docsv-wrap { display: flex; flex-direction: column; gap: 1.5rem; }
        .doc-section { }
        .section-label-sm { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 0.75rem; }
        .doc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.75rem; }
        .doc-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          transition: border-color var(--transition-fast);
        }
        .doc-card:hover { border-color: var(--border-default); }
        .doc-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
        .doc-name { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); margin: 0; }
        .doc-meta { font-size: 0.76rem; color: var(--text-muted); }
        .doc-link { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: var(--text-muted); overflow: hidden; }
        .doc-link a { color: var(--teal-400); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .doc-notes { font-size: 0.78rem; color: var(--text-secondary); border-top: 1px solid var(--border-subtle); padding-top: 0.4rem; }
        .icon-btn {
          background: none; border: 1px solid transparent; border-radius: var(--radius-sm);
          color: var(--text-muted); padding: 0.3rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all var(--transition-fast);
          text-decoration: none;
        }
        .icon-btn:hover { background: var(--bg-elevated); color: var(--text-primary); border-color: var(--border-default); }
        .icon-btn.danger:hover { color: var(--coral-400); border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.08); }

        .segdate-wrap { display: flex; align-items: center; gap: 0.45rem; }
        .segdate-part { width: 3.3rem; text-align: center; padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
        .segdate-year { width: 4.9rem; }
        .segdate-sep { color: var(--text-muted); font-weight: 700; user-select: none; }
        .segdate-calendar-btn {
          height: 44px; width: 44px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);
          background: var(--bg-elevated); cursor: pointer;
        }
        .segdate-native { position: absolute; opacity: 0; pointer-events: none; width: 1px; height: 1px; }
      `}</style>
    </div>
  );
};

export default DocumentVault;
