import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthChange } from '../services/auth.service';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

/**
 * Fetch the Firestore user doc and merge its photoURL into the Firebase Auth user.
 * This is needed because Firebase Auth has a character limit on photoURL,
 * so we store custom/uploaded photos in Firestore instead.
 */
const buildMergedUser = async (firebaseUser) => {
  if (!firebaseUser) return null;

  try {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    const firestoreData = userDoc.exists() ? userDoc.data() : {};

    // Firestore photoURL takes priority (uploaded photo) over Firebase Auth photoURL (Google)
    // But if Firestore has no photoURL, fall back to Google's (Firebase Auth) photoURL
    const photoURL = firestoreData.photoURL || firebaseUser.photoURL || null;

    // Return a plain object (not the Firebase user class) so we can add custom fields
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || firestoreData.displayName || 'Traveler',
      photoURL,
      emailVerified: firebaseUser.emailVerified,
    };
  } catch (err) {
    console.error('Error fetching Firestore user doc:', err);
    // Fallback: just use Firebase Auth data
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || 'Traveler',
      photoURL: firebaseUser.photoURL || null,
      emailVerified: firebaseUser.emailVerified,
    };
  }
};

/**
 * AuthProvider — wraps the app and provides session state.
 * Merges Firebase Auth user with Firestore profile (for custom photoURL support).
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const unsubscribe = onAuthChange(async (firebaseUser) => {
        const mergedUser = await buildMergedUser(firebaseUser);
        setUser(mergedUser);
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      console.error('Firebase auth initialization error:', err);
      setError('Firebase failed to initialize. Please check your firebase.js config.');
      setLoading(false);
    }
  }, []);

  /**
   * refreshUser — re-fetch Firebase Auth + Firestore and update context.
   * Call this after any profile update (photo upload, name change, etc.)
   */
  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const mergedUser = await buildMergedUser(auth.currentUser);
      setUser(mergedUser);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    loading,
    error,
    setError,
    clearError,
    refreshUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook for consuming auth context.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
