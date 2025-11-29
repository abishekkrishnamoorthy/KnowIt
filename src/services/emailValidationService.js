import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { ref, get, query, orderByChild, equalTo, get as dbGet } from 'firebase/database';
import { auth, database } from '../config/firebase';

const sanitizeEmail = (email) => email.toLowerCase().replace(/[.#$/[\]]/g, '_');

/**
 * Check if email already exists in Firebase Auth or Realtime Database
 * @param {string} email - Email address to check
 * @returns {Promise<{exists: boolean, message?: string}>}
 */
export const checkEmailExists = async (email) => {
  if (!email || !email.includes('@')) {
    return { exists: false };
  }

  try {
    // Check Firebase Auth
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    if (signInMethods && signInMethods.length > 0) {
      return {
        exists: true,
        message: 'This email is already registered. Please sign in instead.'
      };
    }

    // Check Realtime Database users
    const usersRef = ref(database, 'users');
    const usersSnapshot = await dbGet(usersRef);
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      const emailLower = email.toLowerCase();
      const userExists = Object.values(users).some(
        (user) => user.email?.toLowerCase() === emailLower
      );
      
      if (userExists) {
        return {
          exists: true,
          message: 'This email is already registered. Please sign in instead.'
        };
      }
    }

    // Check pending users (only if not expired)
    const sanitizedEmail = sanitizeEmail(email);
    const pendingUserRef = ref(database, `pendingUsers/${sanitizedEmail}`);
    const pendingSnapshot = await dbGet(pendingUserRef);
    
    if (pendingSnapshot.exists()) {
      const pendingData = pendingSnapshot.val();
      const now = Date.now();
      
      // If locked, block signup
      if (pendingData.lockedUntil && pendingData.lockedUntil > now) {
        const minutes = Math.ceil((pendingData.lockedUntil - now) / 60000);
        return {
          exists: true,
          message: `Account is temporarily locked. Try again in ${minutes} minutes.`
        };
      }
      
      // If OTP is still valid (not expired), warn user
      if (pendingData.otpExpiresAt && pendingData.otpExpiresAt > now) {
        return {
          exists: false, // Don't block, but show warning
          message: 'A verification code was recently sent. Please check your email or wait a moment before requesting a new one.'
        };
      }
      
      // If expired, allow signup (old pending user will be overwritten)
    }

    return { exists: false };
  } catch (error) {
    // If error is "user not found", email doesn't exist
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
      return { exists: false };
    }
    // For other errors, log but don't block signup
    console.error('Error checking email existence:', error);
    return { exists: false };
  }
};

