import { useState, useMemo } from 'react';
import { IndianRupee, Plus, Trash2, TrendingUp, Users } from 'lucide-react';
import { useTripContext } from '../../context/TripContext';
import { addExpense, deleteExpense } from '../../services/trip.service';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';

const CATEGORIES = ['Transport', 'Accommodation', 'Food', 'Activities', 'Shopping', 'Emergency', 'Other'];

/**
 * BudgetSplitter — expense tracker with budget visualization and per-person split.
 * Demonstrates useMemo for expense calculations.
 */
const BudgetSplitter = () => {
  const { activeTrip, expenses, setExpenses } = useTripContext();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', amount: '', category: 'Transport',
    paidBy: user?.displayName || 'Me', splitWith: 1,
  });

  // useMemo to compute totals — only recalculates when expenses change
  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const budget = activeTrip?.totalBudget || 0;
    const remaining = budget - total;
    const percentage = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount || 0);
      return acc;
    }, {});
    return { total, budget, remaining, percentage, byCategory };
  }, [expenses, activeTrip]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleAdd = async () => {
    if (!form.title || !form.amount) return;
    setSaving(true);
    try {
      const id = await addExpense(activeTrip.id, {
        ...form,
        amount: Number(form.amount),
        addedBy: user?.uid,
        addedByName: user?.displayName || 'Unknown',
        date: new Date().toISOString(),
      });
      setExpenses((prev) => [{
        id,
        ...form,
        amount: Number(form.amount),
        date: new Date().toISOString(),
      }, ...prev]);
      setModalOpen(false);
      setForm({ title: '', amount: '', category: 'Transport', paidBy: user?.displayName || 'Me', splitWith: 1 });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete "${expense.title}"?`)) return;
    await deleteExpense(activeTrip.id, expense.id, expense.amount);
    setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
  };

  const progressColor = stats.percentage >= 100 ? 'danger' : stats.percentage >= 85 ? 'warning' : '';

  return (
    <div className="budget-wrap animate-fade-in">
      <div className="section-header">
        <div className="section-title">
          <span className="section-icon" style={{ background: 'rgba(251,191,36,0.15)', color: 'var(--amber-400)' }}>
            <IndianRupee size={18} />
          </span>
          Budget & Expenses
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setModalOpen(true)} id="budget-add-btn">
          Add Expense
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="budget-stats">
        <div className="stat-card">
          <p className="stat-label">Total Budget</p>
          <p className="stat-value">₹{stats.budget.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Spent</p>
          <p className="stat-value danger">₹{stats.total.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Remaining</p>
          <p className={`stat-value ${stats.remaining < 0 ? 'danger' : 'success'}`}>
            ₹{Math.abs(stats.remaining).toLocaleString()}
            {stats.remaining < 0 && ' over!'}
          </p>
        </div>
      </div>

      {/* Progress */}
      {stats.budget > 0 && (
        <div className="budget-progress-wrap">
          <div className="budget-progress-header">
            <span>Budget Used</span>
            <span style={{ color: stats.percentage >= 85 ? 'var(--coral-400)' : 'var(--text-secondary)' }}>
              {stats.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="progress-bar-track">
            <div
              className={`progress-bar-fill ${progressColor}`}
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {Object.keys(stats.byCategory).length > 0 && (
        <div className="category-breakdown">
          <p className="section-label-sm">BY CATEGORY</p>
          <div className="cat-grid">
            {Object.entries(stats.byCategory).map(([cat, amt]) => (
              <div key={cat} className="cat-item">
                <span className="cat-name">{cat}</span>
                <span className="cat-amount">₹{amt.toLocaleString()}</span>
                <div className="progress-bar-track" style={{ height: 4 }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${stats.total > 0 ? (amt / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="expense-list">
        <p className="section-label-sm">ALL EXPENSES ({expenses.length})</p>
        {expenses.length === 0 ? (
          <div className="empty-state">
            <IndianRupee size={40} />
            <p>No expenses recorded yet</p>
          </div>
        ) : (
          expenses.map((exp) => (
            <div key={exp.id} className="expense-item">
              <div className="expense-left">
                <div className="expense-cat-dot" />
                <div>
                  <p className="expense-title">{exp.title}</p>
                  <p className="expense-meta">
                    Paid by {exp.paidBy} · Split {exp.splitWith} ways ·{' '}
                    <span style={{ color: 'var(--teal-400)' }}>
                      ₹{(Number(exp.amount) / Number(exp.splitWith || 1)).toFixed(2)}/person
                    </span>
                  </p>
                  <Badge variant="amber">{exp.category}</Badge>
                </div>
              </div>
              <div className="expense-right">
                <p className="expense-amount">₹{Number(exp.amount).toLocaleString()}</p>
                <button className="icon-btn danger" onClick={() => handleDelete(exp)} id={`exp-del-${exp.id}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Expense"
        subtitle="Record a new shared expense"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleAdd} id="expense-save-btn">Add Expense</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Description *</label>
            <input name="title" value={form.title} onChange={handleChange} className="form-input" placeholder="e.g. Hotel in Rome" />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={handleChange} className="form-input" placeholder="0.00" />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select name="category" value={form.category} onChange={handleChange} className="form-input">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Paid By</label>
            <input name="paidBy" value={form.paidBy} onChange={handleChange} className="form-input" placeholder="Name" />
          </div>
          <div className="form-group">
            <label className="form-label">Split Between (# people)</label>
            <input name="splitWith" type="number" min="1" value={form.splitWith} onChange={handleChange} className="form-input" />
          </div>
          {form.amount && form.splitWith > 0 && (
            <div style={{ gridColumn: '1/-1', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
              <p style={{ color: 'var(--teal-400)', fontSize: '0.88rem' }}>
                💡 Each person pays: <strong>₹{(Number(form.amount) / Number(form.splitWith)).toFixed(2)}</strong>
              </p>
            </div>
          )}
        </div>
      </Modal>

      <style>{`
        .budget-wrap { display: flex; flex-direction: column; gap: 1.5rem; }
        .budget-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        @media (max-width: 500px) { .budget-stats { grid-template-columns: 1fr; } }
        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1rem 1.25rem;
        }
        .stat-label { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
        .stat-value.danger  { color: var(--coral-400); }
        .stat-value.success { color: var(--teal-400); }
        .budget-progress-wrap { }
        .budget-progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }
        .category-breakdown { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem 1.25rem; }
        .section-label-sm { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 0.75rem; }
        .cat-grid { display: flex; flex-direction: column; gap: 0.6rem; }
        .cat-item { display: grid; grid-template-columns: 1fr auto; gap: 0.35rem; align-items: center; }
        .cat-item .progress-bar-track { grid-column: 1/-1; }
        .cat-name { font-size: 0.82rem; color: var(--text-secondary); }
        .cat-amount { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); }
        .expense-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .expense-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 0.9rem 1rem;
          gap: 1rem;
          transition: border-color var(--transition-fast);
        }
        .expense-item:hover { border-color: var(--border-default); }
        .expense-left { display: flex; align-items: flex-start; gap: 0.75rem; flex: 1; min-width: 0; }
        .expense-cat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--amber-400);
          margin-top: 6px;
          flex-shrink: 0;
        }
        .expense-title { font-size: 0.9rem; font-weight: 500; color: var(--text-primary); margin-bottom: 0.2rem; }
        .expense-meta { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem; }
        .expense-right { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
        .expense-amount { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
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
      `}</style>
    </div>
  );
};

export default BudgetSplitter;
