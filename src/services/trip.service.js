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
    travelerCount: Number(tripData.travelerCount || 1),
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
  // NOTE:
  // Using where + orderBy on Firestore often requires a composite index and can
  // fail with "The query requires an index". To keep dashboard fully functional
  // without manual index setup, fetch by collaborator and sort client-side.
  const q = query(
    collection(db, 'trips'),
    where('collaborators', 'array-contains', userId)
  );
  const snapshot = await getDocs(q);

  const toMillis = (v) => {
    if (!v) return 0;
    if (typeof v?.toMillis === 'function') return v.toMillis();
    if (v?.seconds != null) return v.seconds * 1000;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  };

  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
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
  // Sort by createdAt only to avoid requiring a composite index.
  // Date/time ordering is handled client-side in the UI.
  const q = query(collection(db, 'trips', tripId, 'itinerary'), orderBy('createdAt', 'asc'));
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

export const updateExpense = async (tripId, expenseId, updates) => {
  const expRef = doc(db, 'trips', tripId, 'expenses', expenseId);
  const beforeSnap = await getDoc(expRef);
  if (!beforeSnap.exists()) throw new Error('Expense not found');

  const before = beforeSnap.data();
  const beforeAmount = Number(before.amount || 0);
  const afterAmount = updates?.amount != null ? Number(updates.amount) : beforeAmount;

  await updateDoc(expRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  // Keep trip totalSpent in sync if amount changed
  const delta = afterAmount - beforeAmount;
  if (delta !== 0) {
    const trip = await getTripById(tripId);
    const newTotal = Math.max(0, (trip.totalSpent || 0) + delta);
    await updateDoc(doc(db, 'trips', tripId), { totalSpent: newTotal });
  }
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

export const updateDocumentItem = async (tripId, docId, updates) => {
  await updateDoc(doc(db, 'trips', tripId, 'documents', docId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
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

export const updatePackingItem = async (tripId, itemId, updates) => {
  await updateDoc(doc(db, 'trips', tripId, 'packing', itemId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
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

export const updateEmergencyContact = async (tripId, contactId, updates) => {
  await updateDoc(doc(db, 'trips', tripId, 'emergency', contactId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteEmergencyContact = async (tripId, contactId) => {
  await deleteDoc(doc(db, 'trips', tripId, 'emergency', contactId));
};
