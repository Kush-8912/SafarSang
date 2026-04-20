import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword as firebaseUpdatePassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

/**
 * Register a new user with email, password, and display name.
 * Also creates a Firestore user document.
 */
export const registerUser = async (email, password, displayName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update display name on the auth profile
  await updateProfile(user, { displayName });

  // Create user document in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    displayName,
    email,
    createdAt: serverTimestamp(),
    photoURL: null,
  });

  return user;
};

/**
 * Sign in an existing user with email and password.
 */
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Sign out the currently authenticated user.
 */
export const logoutUser = async () => {
  await signOut(auth);
};

/**
 * Sign in or Register a user via Google OAuth 
 */
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const userDocRef = doc(db, 'users', user.uid);
  const userDocSnap = await getDoc(userDocRef);

  const payload = {
    uid: user.uid,
    email: user.email,
    lastLogin: serverTimestamp(),
  };

  // Only assign Google displayName and photoURL if it is a brand new user
  // This prevents overwriting any user-customized profile or uploaded photo!
  if (!userDocSnap.exists()) {
    payload.displayName = user.displayName || 'SafarSang User';
    payload.photoURL = user.photoURL || null;
    payload.createdAt = serverTimestamp();
  }

  await setDoc(userDocRef, payload, { merge: true });

  return user;
};

/**
 * Send an email to the user with a password reset link.
 */
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Update the securely logged in user's password.
 */
export const updateUserPassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  
  // Verify their current password before allowing change
  await reauthenticateWithCredential(user, credential);
  await firebaseUpdatePassword(user, newPassword);
};

/**
 * Update display name and optionally photo URL in both Auth and Firestore.
 */
export const updateUserProfile = async (displayName, photoURL = null) => {
  const user = auth.currentUser;
  
  // Only update displayName in Firebase Auth (photoURL has a char limit in Auth)
  await updateProfile(user, { displayName });
  
  // Mirror displayName + optionally photoURL in Firestore (no size limits)
  const updatePayload = { displayName };
  if (photoURL && photoURL.trim() !== '') {
    updatePayload.photoURL = photoURL;
  }
  
  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, updatePayload, { merge: true });
};

/**
 * Convert a local image file to a base64 data URL and save it
 * to Firestore only (Firebase Auth photoURL has a character limit).
 */
export const uploadProfilePicture = (file) => {
  return new Promise((resolve, reject) => {
    if (!auth.currentUser) {
      reject(new Error('You must be logged in to change your profile picture.'));
      return;
    }
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (JPEG, PNG, GIF, etc.)'));
      return;
    }
    // Keep under 500KB so the Firestore doc stays within its 1MB limit
    if (file.size > 500 * 1024) {
      reject(new Error('Image must be less than 500KB. Please compress or crop it first.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64URL = e.target.result;
        const user = auth.currentUser;

        // Save ONLY to Firestore — do NOT pass to Firebase Auth updateProfile
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { photoURL: base64URL }, { merge: true });

        resolve(base64URL);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the image file.'));
    reader.readAsDataURL(file);
  });
};

/**
 * Subscribe to auth state changes. Returns the unsubscribe function.
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
