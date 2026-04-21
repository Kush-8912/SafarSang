import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser,
  getAdditionalUserInfo,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword as firebaseUpdatePassword,
  verifyPasswordResetCode,
  confirmPasswordReset,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const AUTH_NOTICE_KEY = 'safarsang_auth_notice';
const setAuthNotice = (message) => {
  try {
    sessionStorage.setItem(AUTH_NOTICE_KEY, message);
  } catch {
    // Ignore storage errors.
  }
};

const hasRegisteredAccountByEmail = async (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  // Preferred lookup for newly-created/updated docs.
  const q1 = query(
    collection(db, 'users'),
    where('lowerEmail', '==', normalized)
  );
  const snap1 = await getDocs(q1);
  if (snap1.docs.some((d) => d.data()?.accountReady)) return true;

  // Backward compatibility for older docs that may not have lowerEmail.
  const q2 = query(
    collection(db, 'users'),
    where('email', '==', email)
  );
  const snap2 = await getDocs(q2);
  if (snap2.docs.some((d) => d.data()?.accountReady)) return true;

  return false;
};

const hasAuthIdentityByEmail = async (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  try {
    const methods = await fetchSignInMethodsForEmail(auth, normalized);
    return Array.isArray(methods) && methods.length > 0;
  } catch {
    return false;
  }
};

/**
 * Register a new user with email, password, and display name.
 * Also creates a Firestore user document.
 */
export const registerUser = async (email, password, displayName) => {
  const normalized = normalizeEmail(email);

  // Strict app-level check: block only if account is already fully created in our DB.
  const accountExists = await hasRegisteredAccountByEmail(normalized);
  if (accountExists) {
    const err = new Error('An account with this email already exists.');
    err.code = 'app/account-already-exists';
    throw err;
  }

  let user;
  let isNewAuthUser = false;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, normalized, password);
    user = userCredential.user;
    isNewAuthUser = true;
  } catch (err) {
    // If Firebase auth user exists but app profile isn't ready, recover and complete signup.
    if (err?.code !== 'auth/email-already-in-use') throw err;
    const accountExistsInApp = await hasRegisteredAccountByEmail(normalized);
    const methods = await fetchSignInMethodsForEmail(auth, normalized);
    if (methods.includes('google.com') && !methods.includes('password')) {
      const socialErr = new Error('This email is linked with Google. Please use Continue with Google.');
      socialErr.code = 'app/email-linked-google';
      throw socialErr;
    }
    if (!accountExistsInApp) {
      const actionCodeSettings = {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, normalized, actionCodeSettings);
      const recoverErr = new Error('We found a sign-in identity for this email and sent a recovery link. Please check your inbox, reset password, then sign in.');
      recoverErr.code = 'app/recovery-email-sent';
      throw recoverErr;
    }
    try {
      const signin = await signInWithEmailAndPassword(auth, normalized, password);
      user = signin.user;

      const existingDoc = await getDoc(doc(db, 'users', user.uid));
      if (existingDoc.exists() && existingDoc.data()?.accountReady) {
        const existsErr = new Error('An account with this email already exists.');
        existsErr.code = 'app/account-already-exists';
        throw existsErr;
      }
    } catch (signInErr) {
      if (signInErr?.code === 'auth/invalid-credential' || signInErr?.code === 'auth/wrong-password') {
        const existsErr = new Error('This email is already in use. Please sign in or use Forgot Password.');
        existsErr.code = 'app/account-already-exists';
        throw existsErr;
      }
      throw signInErr;
    }
  }

  // Update display name on the auth profile
  await updateProfile(user, { displayName });

  // Create/repair user document in Firestore
  const payload = {
    uid: user.uid,
    displayName,
    email: normalized,
    lowerEmail: normalized,
    accountReady: true,
    registrationMethod: 'email',
    photoURL: user.photoURL || null,
    lastLogin: serverTimestamp(),
  };
  if (isNewAuthUser) payload.createdAt = serverTimestamp();
  await setDoc(doc(db, 'users', user.uid), payload, { merge: true });

  return user;
};

/**
 * Sign in an existing user with email and password.
 */
export const loginUser = async (email, password) => {
  const normalized = normalizeEmail(email);
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, normalized, password);
  } catch (err) {
    if (err?.code === 'auth/user-not-found') {
      setAuthNotice('No account found. Please create an account first.');
      const notFoundErr = new Error('No account found. Please create an account first.');
      notFoundErr.code = 'app/account-not-found';
      throw notFoundErr;
    }
    if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password') {
      const hasAuth = await hasAuthIdentityByEmail(normalized);
      if (!hasAuth) {
        setAuthNotice('No account found. Please create an account first.');
        const notFoundErr = new Error('No account found. Please create an account first.');
        notFoundErr.code = 'app/account-not-found';
        throw notFoundErr;
      }
    }
    throw err;
  }
  const user = userCredential.user;
  const userDocRef = doc(db, 'users', user.uid);
  const userDocSnap = await getDoc(userDocRef);
  const data = userDocSnap.exists() ? userDocSnap.data() : null;
  if (!data?.accountReady) {
    // Self-heal orphan auth users by creating the missing app profile on first successful login.
    await setDoc(userDocRef, {
      uid: user.uid,
      email: normalizeEmail(user.email),
      lowerEmail: normalizeEmail(user.email),
      displayName: user.displayName || 'SafarSang User',
      photoURL: user.photoURL || null,
      accountReady: true,
      registrationMethod: 'email-recovered',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    }, { merge: true });
  }
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
  // Strict login: user must already exist in our users collection.
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const info = getAdditionalUserInfo(result);
  const userDocRef = doc(db, 'users', user.uid);
  const userDocSnap = await getDoc(userDocRef);
  const data = userDocSnap.exists() ? userDocSnap.data() : null;

  // If Google indicates a brand-new auth user, block login flow immediately.
  if (info?.isNewUser || !data?.accountReady) {
    // Revert accidental first-time Google auth creation for login flow.
    try {
      await deleteUser(user);
    } catch {
      // If delete fails, still ensure no active session.
      await signOut(auth);
    }
    setAuthNotice('No account found. Please create an account first.');
    const err = new Error('No account found. Please create an account first.');
    err.code = 'app/account-not-found';
    throw err;
  }

  await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true });
  return user;
};

/**
 * Sign up/register via Google OAuth.
 */
export const registerWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const userDocRef = doc(db, 'users', user.uid);
  const userDocSnap = await getDoc(userDocRef);

  const payload = {
    uid: user.uid,
    email: user.email,
    lowerEmail: normalizeEmail(user.email),
    displayName: user.displayName || 'SafarSang User',
    photoURL: user.photoURL || null,
    accountReady: true,
    registrationMethod: 'google',
    lastLogin: serverTimestamp(),
  };
  if (!userDocSnap.exists()) payload.createdAt = serverTimestamp();

  await setDoc(userDocRef, payload, { merge: true });
  return user;
};

/**
 * Send an email to the user with a password reset link.
 */
export const resetPassword = async (email) => {
  const normalized = normalizeEmail(email);
  const accountExists = await hasRegisteredAccountByEmail(normalized);
  const hasAuth = await hasAuthIdentityByEmail(normalized);
  if (!accountExists && !hasAuth) {
    const err = new Error('No account found. Please create an account first.');
    err.code = 'app/account-not-found';
    throw err;
  }
  const actionCodeSettings = {
    url: `${window.location.origin}/reset-password`,
    handleCodeInApp: true,
  };
  await sendPasswordResetEmail(auth, normalized, actionCodeSettings);
};

/**
 * Validate password reset code from email link.
 */
export const verifyResetCode = async (oobCode) => {
  return verifyPasswordResetCode(auth, oobCode);
};

/**
 * Complete password reset using code and new password.
 */
export const completePasswordReset = async (oobCode, newPassword) => {
  await confirmPasswordReset(auth, oobCode, newPassword);
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
