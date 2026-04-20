import { useState, useRef, useCallback } from 'react';
import { Package, Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { useTripContext } from '../../context/TripContext';
import { addPackingItem, togglePackingItem, deletePackingItem } from '../../services/trip.service';
import Button from '../ui/Button';

/**
 * PackingList — per-traveler packing checklist.
 * Demonstrates useRef for form input focus optimization.
 */
const PackingList = () => {
  const { activeTrip, packing, setPacking } = useTripContext();
  const [inputVal, setInputVal] = useState('');
  const [assignee, setAssignee] = useState('Group');
  const [adding, setAdding] = useState(false);
  const inputRef = useRef(null); // useRef to manage focus without re-render

  const packedCount = packing.filter((p) => p.packed).length;
  const totalCount = packing.length;
  const percentage = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;

  const handleAdd = useCallback(async () => {
    if (!inputVal.trim()) return;
    setAdding(true);
    try {
      const ref = await addPackingItem(activeTrip.id, {
        name: inputVal.trim(),
        assignee,
      });
      setPacking((prev) => [...prev, { id: ref.id, name: inputVal.trim(), assignee, packed: false }]);
      setInputVal('');
      // Use ref to return focus to input — avoids re-render
      setTimeout(() => inputRef.current?.focus(), 50);
    } finally {
      setAdding(false);
    }
  }, [inputVal, assignee, activeTrip, setPacking]);

  const handleToggle = async (item) => {
    await togglePackingItem(activeTrip.id, item.id, !item.packed);
    setPacking((prev) => prev.map((p) => p.id === item.id ? { ...p, packed: !p.packed } : p));
  };

  const handleDelete = async (item) => {
    await deletePackingItem(activeTrip.id, item.id);
    setPacking((prev) => prev.filter((p) => p.id !== item.id));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  // Group by assignee
  const grouped = packing.reduce((acc, item) => {
    const key = item.assignee || 'Group';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="pack-wrap animate-fade-in">
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon" style={{ background: 'rgba(56,189,248,0.15)', color: 'var(--sky-400)' }}>
            <Package size={18} />
          </span>
          Packing List
        </div>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {packedCount}/{totalCount} packed
        </span>
      </div>

      {/* Progress */}
      {totalCount > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            <span>Packing Progress</span>
            <span style={{ color: percentage === 100 ? 'var(--teal-400)' : 'var(--text-secondary)' }}>
              {percentage === 100 ? '🎒 All packed!' : `${percentage.toFixed(0)}%`}
            </span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
          </div>
        </div>
      )}

      {/* Add Item */}
      <div className="pack-add-row">
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="form-input"
          placeholder="Add an item (press Enter)..."
          id="packing-input"
          style={{ flex: 1 }}
        />
        <input
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="form-input"
          placeholder="Assignee"
          style={{ maxWidth: 140 }}
          id="packing-assignee"
        />
        <Button variant="primary" size="sm" icon={Plus} loading={adding} onClick={handleAdd} id="packing-add-btn">
          Add
        </Button>
      </div>

      {/* List */}
      {Object.keys(grouped).length === 0 ? (
        <div className="empty-state">
          <Package size={40} />
          <p>Start building your packing checklist</p>
        </div>
      ) : (
        Object.entries(grouped).map(([person, items]) => (
          <div key={person} className="pack-group">
            <p className="pack-group-label">
              {person}
              <span className="pack-group-count">{items.filter((i) => i.packed).length}/{items.length}</span>
            </p>
            <div className="pack-items">
              {items.map((item) => (
                <div key={item.id} className={`pack-item ${item.packed ? 'packed' : ''}`}>
                  <button
                    className="pack-checkbox"
                    onClick={() => handleToggle(item)}
                    id={`pack-toggle-${item.id}`}
                    aria-label={item.packed ? 'Unpack item' : 'Pack item'}
                  >
                    {item.packed ? <CheckSquare size={18} color="var(--teal-400)" /> : <Square size={18} />}
                  </button>
                  <span className="pack-name">{item.name}</span>
                  <button className="icon-btn danger" onClick={() => handleDelete(item)} id={`pack-del-${item.id}`}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <style>{`
        .pack-wrap { display: flex; flex-direction: column; gap: 1.25rem; }
        .pack-add-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
        .pack-group { }
        .pack-group-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.5rem;
        }
        .pack-group-count {
          font-size: 0.7rem;
          background: var(--bg-elevated);
          color: var(--text-muted);
          padding: 0.1rem 0.5rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
        }
        .pack-items { display: flex; flex-direction: column; gap: 0.35rem; }
        .pack-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 0.6rem 0.9rem;
          transition: all var(--transition-fast);
        }
        .pack-item:hover { border-color: var(--border-default); }
        .pack-item.packed { opacity: 0.6; }
        .pack-item.packed .pack-name { text-decoration: line-through; color: var(--text-muted); }
        .pack-checkbox {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          color: var(--text-muted);
          transition: color var(--transition-fast);
          flex-shrink: 0;
        }
        .pack-checkbox:hover { color: var(--teal-400); }
        .pack-name { flex: 1; font-size: 0.9rem; color: var(--text-primary); }
        .icon-btn {
          background: none; border: 1px solid transparent; border-radius: var(--radius-sm);
          color: var(--text-muted); padding: 0.3rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all var(--transition-fast); flex-shrink: 0;
        }
        .icon-btn:hover { background: var(--bg-elevated); color: var(--text-primary); border-color: var(--border-default); }
        .icon-btn.danger:hover { color: var(--coral-400); border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.08); }
      `}</style>
    </div>
  );
};

export default PackingList;
