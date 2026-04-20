import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Globe, Calendar, IndianRupee, ArrowLeft, Wand2, PenTool } from 'lucide-react';
import { createTrip, addItineraryItem } from '../services/trip.service';
import { generateAITrip } from '../services/ai.service';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

/**
 * CreateTrip — guided trip creation form with AI orchestration.
 */
const CreateTrip = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('magic'); // 'manual' | 'magic'
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    totalBudget: '',
    description: '',
    status: 'planning',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError('');
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Trip name is required.';
    if (!form.destination.trim()) return 'Destination is required.';
    if (form.startDate && form.endDate && form.startDate > form.endDate)
      return 'End date must be after start date.';
    return null;
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const validationErr = validate();
    if (validationErr) { setError(validationErr); return; }
    setSaving(true);
    try {
      const tripId = await createTrip({
        ...form,
        totalBudget: form.totalBudget ? Number(form.totalBudget) : 0,
      }, user.uid);
      navigate(`/trips/${tripId}`);
    } catch (err) {
      setError(err.message || 'Failed to create trip.');
    } finally {
      setSaving(false);
    }
  };

  const handleMagicSubmit = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) {
      setError("Please tell SafarPandit what kind of trip you want.");
      return;
    }
    setSaving(true);
    setError('');
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error("Groq API Key is missing. Please add VITE_GROQ_API_KEY to your .env file.");

      // 1. Get AI generation
      const aiTripCode = await generateAITrip(aiPrompt, apiKey);

      // 2. Create Trip document
      const tripId = await createTrip({
        name: aiTripCode.name || 'Magical Safar',
        destination: aiTripCode.destination || 'India',
        startDate: aiTripCode.startDate || '',
        endDate: aiTripCode.endDate || '',
        totalBudget: aiTripCode.totalBudget ? Number(aiTripCode.totalBudget) : 0,
        description: aiTripCode.description || '',
        status: 'planning',
      }, user.uid);

      // 3. Inject constraints properly into Itinerary
      if (aiTripCode.itinerary && Array.isArray(aiTripCode.itinerary)) {
        for (const item of aiTripCode.itinerary) {
          await addItineraryItem(tripId, {
            date: item.date || '',
            time: item.time || '',
            title: item.title || 'Activity',
            location: item.location || '',
            category: item.category || 'activity',
            notes: item.notes || '',
            confirmed: true, // We auto-confirm the AI's suggestions 
          });
        }
      }

      // 4. Redirect
      navigate(`/trips/${tripId}`);
    } catch (err) {
      setError(err.message || 'Failed to conjure the magical safar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="create-page animate-fade-in">
      <div className="create-header">
        <button className="create-back" onClick={() => navigate(-1)} id="create-back-btn">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="create-title">Plan a New Safar 🪷</h1>
        <p className="create-sub">Choose how you want to build your journey.</p>
      </div>

      {/* Mode Toggle */}
      <div className="mode-toggle-wrap">
        <button 
          className={`mode-toggle-btn ${mode === 'magic' ? 'active' : ''}`}
          onClick={() => setMode('magic')}
        >
          <Wand2 size={16} /> AI Magic Safar
        </button>
        <button 
          className={`mode-toggle-btn ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => setMode('manual')}
        >
          <PenTool size={16} /> Manual Plan
        </button>
      </div>

      <div className="create-card" style={mode === 'magic' ? { border: '2px solid var(--amber-400)', boxShadow: '0 8px 30px rgba(249, 115, 22, 0.15)' } : {}}>
        {error && <div className="create-error" role="alert">{error}</div>}

        {mode === 'magic' ? (
          <form onSubmit={handleMagicSubmit} noValidate>
            <div className="magic-wrapper">
              <div className="magic-icon-container animate-pulse">✨</div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontFamily: '"Rozha One", serif', fontSize: '1.5rem' }}>
                Consult SafarPandit
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                Describe your dream safar. Our AI will automatically generate your itinerary, budget, and destination details.
              </p>
              
              <textarea
                value={aiPrompt}
                onChange={(e) => { setError(''); setAiPrompt(e.target.value); }}
                className="form-input"
                placeholder="e.g. Plan a 4-day spiritual retreat to Varanasi in December. Focus on temples, Ganga Aarti, and local street food. Budget is ₹25,000."
                rows={5}
                style={{ fontSize: '1.1rem', padding: '1rem', height: '120px' }}
                disabled={saving}
              />
            </div>

            <div className="create-actions" style={{ justifyContent: 'center', marginTop: '2rem' }}>
              <Button variant="primary" type="submit" loading={saving} icon={Wand2} id="magic-submit">
                {saving ? "Architecting your Safar..." : "Generate Magic Safar"}
              </Button>
            </div>
            
            {saving && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--teal-500)', fontSize: '0.85rem' }}>
                <p className="animate-pulse">Panditji is consulting the maps and creating your itinerary...</p>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleManualSubmit} noValidate>
            <div className="create-grid">
              {/* Trip Name */}
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label" htmlFor="ct-name">
                  <PlusCircle size={13} style={{ display: 'inline', marginRight: 4 }} /> Trip Name *
                </label>
                <input id="ct-name" name="name" value={form.name} onChange={handleChange} className="form-input create-input-lg" placeholder="e.g. Char Dham Yatra" required />
              </div>

              {/* Destination */}
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label" htmlFor="ct-dest">
                  <Globe size={13} style={{ display: 'inline', marginRight: 4 }} /> Destination *
                </label>
                <input id="ct-dest" name="destination" value={form.destination} onChange={handleChange} className="form-input" placeholder="e.g. Rishikesh, India" required />
              </div>

              {/* Dates */}
              <div className="form-group">
                <label className="form-label" htmlFor="ct-start">
                  <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} /> Start Date
                </label>
                <input id="ct-start" name="startDate" type="date" value={form.startDate} onChange={handleChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ct-end">
                  <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} /> End Date
                </label>
                <input id="ct-end" name="endDate" type="date" value={form.endDate} onChange={handleChange} className="form-input" />
              </div>

              {/* Budget */}
              <div className="form-group">
                <label className="form-label" htmlFor="ct-budget">
                  <IndianRupee size={13} style={{ display: 'inline', marginRight: 4 }} /> Total Budget (₹)
                </label>
                <input id="ct-budget" name="totalBudget" type="number" min="0" step="1" value={form.totalBudget} onChange={handleChange} className="form-input" placeholder="0" />
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label" htmlFor="ct-status">Status</label>
                <select id="ct-status" name="status" value={form.status} onChange={handleChange} className="form-input">
                  <option value="planning">Planning</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Description */}
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label" htmlFor="ct-desc">Description</label>
                <textarea
                  id="ct-desc"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="form-input"
                  rows={3}
                  placeholder="Brief description of your trip plans..."
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="create-actions">
              <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Cancel</Button>
              <Button variant="primary" type="submit" loading={saving} icon={PlusCircle} id="create-submit">
                Create Safar
              </Button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .create-page { max-width: 720px; margin: 0 auto; padding-bottom: 3rem; }
        .create-header { margin-bottom: 1.5rem; }
        .create-back {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.82rem;
          color: var(--text-muted);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-bottom: 1rem;
          transition: color var(--transition-fast);
          font-family: 'Inter', sans-serif;
        }
        .create-back:hover { color: var(--text-primary); }
        .create-title { font-size: 1.8rem; margin-bottom: 0.35rem; }
        .create-sub { color: var(--text-muted); }
        
        .mode-toggle-wrap {
          display: flex;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          padding: 0.35rem;
          margin-bottom: 1.5rem;
          width: max-content;
        }
        .mode-toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.5rem;
          border-radius: var(--radius-full);
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .mode-toggle-btn.active {
          background: var(--gradient-brand);
          color: white;
          box-shadow: 0 4px 10px rgba(249, 115, 22, 0.3);
        }

        .create-card {
          background: var(--gradient-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 2.5rem 2rem;
          box-shadow: var(--shadow-md);
          transition: all 0.5s ease;
        }
        
        .magic-wrapper {
          text-align: center;
          padding: 1rem 0;
        }
        .magic-icon-container {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .create-error {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: var(--radius-md);
          padding: 0.75rem 1rem;
          color: var(--coral-400);
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
        }
        .create-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.1rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 500px) {
          .create-grid { grid-template-columns: 1fr; }
          .create-grid > div[style] { grid-column: 1 !important; }
        }
        .create-input-lg { font-size: 1.05rem !important; padding: 0.85rem 1rem !important; }
        .create-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
      `}</style>
    </div>
  );
};

export default CreateTrip;
