import { useState, useEffect, useCallback } from 'react';
import {
  getTripById,
  getItinerary,
  getExpenses,
  getDocuments,
  getPackingList,
  getComments,
  getEmergencyContacts,
} from '../services/trip.service';
import { useTripContext } from '../context/TripContext';

/**
 * useTripData — custom hook that fetches all sub-collections for a trip
 * and populates the TripContext state. Avoids redundant re-fetches via
 * the tripId dependency.
 */
export const useTripData = (tripId) => {
  const {
    setActiveTrip,
    setItinerary,
    setExpenses,
    setDocuments,
    setPacking,
    setComments,
    setEmergency,
    setLoading,
    clearTripData,
  } = useTripContext();

  const [fetchError, setFetchError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setFetchError(null);

    try {
      // Parallel fetch all sub-collections
      const [trip, itinerary, expenses, documents, packing, comments, emergency] =
        await Promise.all([
          getTripById(tripId),
          getItinerary(tripId),
          getExpenses(tripId),
          getDocuments(tripId),
          getPackingList(tripId),
          getComments(tripId),
          getEmergencyContacts(tripId),
        ]);

      setActiveTrip(trip);
      setItinerary(itinerary);
      setExpenses(expenses);
      setDocuments(documents);
      setPacking(packing);
      setComments(comments);
      setEmergency(emergency);
    } catch (err) {
      setFetchError(err.message || 'Failed to load trip data');
    } finally {
      setLoading(false);
    }
  }, [tripId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAll();

    return () => {
      clearTripData(); // Cleanup when navigating away from trip
    };
  }, [fetchAll, clearTripData]);

  return { fetchError, refetch: fetchAll };
};
