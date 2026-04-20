import { useState } from 'react';
import { FileText, Plus, Trash2, ExternalLink, Link } from 'lucide-react';
import { useTripContext } from '../../context/TripContext';
import { addDocument, deleteDocument } from '../../services/trip.service';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';

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
  const [form, setForm] = useState({ name: '', type: 'visa', url: '', holder: '', expiryDate: '', notes: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleAdd = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const ref = await addDocument(activeTrip.id, {
        ...form,
        addedBy: user?.uid,
        addedByName: user?.displayName || 'Unknown',
      });
      setDocuments((prev) => [...prev, { id: ref.id, ...form }]);
      setModalOpen(false);
      setForm({ name: '', type: 'visa', url: '', holder: '', expiryDate: '', notes: '' });
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
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setModalOpen(true)} id="doc-add-btn">
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
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="icon-btn" id={`doc-open-${doc.id}`}>
                          <ExternalLink size={13} />
                        </a>
                      )}
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
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        {doc.url.length > 40 ? doc.url.slice(0, 40) + '…' : doc.url}
                      </a>
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
        onClose={() => setModalOpen(false)}
        title="Add Document"
        subtitle="Add a link or reference to a travel document"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleAdd} id="doc-save-btn">Add Document</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Document Name *</label>
            <input name="name" value={form.name} onChange={handleChange} className="form-input" placeholder="e.g. John's US Visa" />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select name="type" value={form.type} onChange={handleChange} className="form-input">
              {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Holder / Owner</label>
            <input name="holder" value={form.holder} onChange={handleChange} className="form-input" placeholder="Person this belongs to" />
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Document URL (Google Drive, Dropbox, etc.)</label>
            <input name="url" type="url" value={form.url} onChange={handleChange} className="form-input" placeholder="https://drive.google.com/..." />
          </div>
          <div className="form-group">
            <label className="form-label">Expiry Date</label>
            <input name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} className="form-input" rows={2} placeholder="Additional details..." style={{ resize: 'vertical' }} />
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
      `}</style>
    </div>
  );
};

export default DocumentVault;
