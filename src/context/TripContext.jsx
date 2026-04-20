import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const TripContext = createContext(null);

/**
 * TripProvider — holds state for the currently active trip being viewed.
 * Shared across all sibling panes (Itinerary, Budget, Documents, etc.)
 * without prop-drilling.
 */
export const TripProvider = ({ children }) => {
  const [activeTrip, setActiveTrip] = useState(null);
  const [activeTab, setActiveTab] = useState('itinerary');

  // Local mirror of sub-collection data (optimistic updates)
  const [itinerary, setItinerary] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [packing, setPacking] = useState([]);
  const [comments, setComments] = useState([]);
  const [emergency, setEmergency] = useState([]);
  const [loading, setLoading] = useState(false);

  const clearTripData = useCallback(() => {
    setActiveTrip(null);
    setItinerary([]);
    setExpenses([]);
    setDocuments([]);
    setPacking([]);
    setComments([]);
    setEmergency([]);
  }, []);

  // Derived: risk flags based on trip data
  // useMemo to avoid recalculating on every render
  const riskFlags = useMemo(() => {
    const flags = [];
    if (!activeTrip) return flags;

    const spent = activeTrip.totalSpent || 0;
    const budget = activeTrip.totalBudget || 0;

    if (budget > 0 && spent / budget > 0.85) {
      flags.push({ type: 'budget', severity: 'high', message: `Budget ${Math.round((spent / budget) * 100)}% used — close to limit!` });
    }
    if (documents.length === 0) {
      flags.push({ type: 'documents', severity: 'medium', message: 'No documents uploaded. Add visas, tickets, or bookings.' });
    }
    const unpacked = packing.filter((p) => !p.packed).length;
    if (unpacked > 0 && activeTrip.startDate) {
      const daysLeft = Math.ceil((new Date(activeTrip.startDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 3 && unpacked > 0) {
        flags.push({ type: 'packing', severity: 'high', message: `${unpacked} items unpacked — trip starts in ${daysLeft} day(s)!` });
      }
    }
    if (emergency.length === 0) {
      flags.push({ type: 'emergency', severity: 'low', message: 'No emergency contacts added for this trip.' });
    }

    return flags;
  }, [activeTrip, documents, packing, emergency]);

  const value = {
    activeTrip,
    setActiveTrip,
    activeTab,
    setActiveTab,
    itinerary,
    setItinerary,
    expenses,
    setExpenses,
    documents,
    setDocuments,
    packing,
    setPacking,
    comments,
    setComments,
    emergency,
    setEmergency,
    loading,
    setLoading,
    riskFlags,
    clearTripData,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};

export const useTripContext = () => {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTripContext must be used within TripProvider');
  return ctx;
};

export default TripContext;
