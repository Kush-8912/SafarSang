import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── TRIPS ────────────────────────────────────────────────────────────────────

/**
 * Create a new trip document. The current user is the owner.
 */
export const createTrip = async (tripData, userId) => {
  const tripRef = await addDoc(collection(db, 'trips'), {
    ...tripData,
    ownerId: userId,
    collaborators: [userId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'planning', // planning | confirmed | completed
    totalBudget: tripData.totalBudget || 0,
    totalSpent: 0,
  });
  return tripRef.id;
};

/**
 * Get all trips where the user is a collaborator.
 */
export const getUserTrips = async (userId) => {
  const q = query(
    collection(db, 'trips'),
    where('collaborators', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Get a single trip by ID.
 */
export const getTripById = async (tripId) => {
  const docRef = doc(db, 'trips', tripId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error('Trip not found');
  return { id: snap.id, ...snap.data() };
};

/**
 * Update trip metadata.
 */
export const updateTrip = async (tripId, updates) => {
  await updateDoc(doc(db, 'trips', tripId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Delete a trip and all its sub-collections (done with client-side deletes for simplicity).
 */
export const deleteTrip = async (tripId) => {
  await deleteDoc(doc(db, 'trips', tripId));
};

/**
 * Add a collaborator UID to a trip.
 */
export const addCollaborator = async (tripId, uid) => {
  await updateDoc(doc(db, 'trips', tripId), {
    collaborators: arrayUnion(uid),
    updatedAt: serverTimestamp(),
  });
};

// ─── ITINERARY ────────────────────────────────────────────────────────────────

export const addItineraryItem = async (tripId, item) => {
  return addDoc(collection(db, 'trips', tripId, 'itinerary'), {
    ...item,
    createdAt: serverTimestamp(),
  });
};

export const getItinerary = async (tripId) => {
  const q = query(collection(db, 'trips', tripId, 'itinerary'), orderBy('date', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const updateItineraryItem = async (tripId, itemId, updates) => {
  await updateDoc(doc(db, 'trips', tripId, 'itinerary', itemId), updates);
};

export const deleteItineraryItem = async (tripId, itemId) => {
  await deleteDoc(doc(db, 'trips', tripId, 'itinerary', itemId));
};

// ─── BUDGET / EXPENSES ────────────────────────────────────────────────────────

export const addExpense = async (tripId, expense) => {
  const ref = await addDoc(collection(db, 'trips', tripId, 'expenses'), {
    ...expense,
    createdAt: serverTimestamp(),
  });
  // Update totalSpent on the trip
  const trip = await getTripById(tripId);
  const newTotal = (trip.totalSpent || 0) + Number(expense.amount);
  await updateDoc(doc(db, 'trips', tripId), { totalSpent: newTotal });
  return ref.id;
};

export const getExpenses = async (tripId) => {
  const q = query(collection(db, 'trips', tripId, 'expenses'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteExpense = async (tripId, expenseId, amount) => {
  await deleteDoc(doc(db, 'trips', tripId, 'expenses', expenseId));
  const trip = await getTripById(tripId);
  const newTotal = Math.max(0, (trip.totalSpent || 0) - Number(amount));
  await updateDoc(doc(db, 'trips', tripId), { totalSpent: newTotal });
};

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────

export const addDocument = async (tripId, docData) => {
  return addDoc(collection(db, 'trips', tripId, 'documents'), {
    ...docData,
    uploadedAt: serverTimestamp(),
  });
};

export const getDocuments = async (tripId) => {
  const snap = await getDocs(collection(db, 'trips', tripId, 'documents'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteDocument = async (tripId, docId) => {
  await deleteDoc(doc(db, 'trips', tripId, 'documents', docId));
};

// ─── PACKING LIST ─────────────────────────────────────────────────────────────

export const addPackingItem = async (tripId, item) => {
  return addDoc(collection(db, 'trips', tripId, 'packing'), {
    ...item,
    packed: false,
    createdAt: serverTimestamp(),
  });
};

export const getPackingList = async (tripId) => {
  const snap = await getDocs(collection(db, 'trips', tripId, 'packing'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const togglePackingItem = async (tripId, itemId, packed) => {
  await updateDoc(doc(db, 'trips', tripId, 'packing', itemId), { packed });
};

export const deletePackingItem = async (tripId, itemId) => {
  await deleteDoc(doc(db, 'trips', tripId, 'packing', itemId));
};

// ─── COMMENTS ─────────────────────────────────────────────────────────────────

export const addComment = async (tripId, comment) => {
  return addDoc(collection(db, 'trips', tripId, 'comments'), {
    ...comment,
    createdAt: serverTimestamp(),
  });
};

export const getComments = async (tripId) => {
  const q = query(collection(db, 'trips', tripId, 'comments'), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─── EMERGENCY CONTACTS ───────────────────────────────────────────────────────

export const addEmergencyContact = async (tripId, contact) => {
  return addDoc(collection(db, 'trips', tripId, 'emergency'), {
    ...contact,
    addedAt: serverTimestamp(),
  });
};

export const getEmergencyContacts = async (tripId) => {
  const snap = await getDocs(collection(db, 'trips', tripId, 'emergency'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteEmergencyContact = async (tripId, contactId) => {
  await deleteDoc(doc(db, 'trips', tripId, 'emergency', contactId));
};
