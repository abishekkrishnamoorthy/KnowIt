import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, googleProvider, database } from '../config/firebase';
import { storage } from '../utils/storage';
import {
  createPendingUser,
  verifyPendingUserOTP,
  movePendingUserToVerified,
  resendPendingUserOTP,
  getPendingUserPassword
} from '../services/pendingUserService';
import { sendVerificationEmail } from '../utils/emailService';

const requireEmailVerification = import.meta.env.VITE_REQUIRE_EMAIL_VERIFICATION !== 'false';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch user profile from Realtime Database
          const userRef = ref(database, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: userData.name || firebaseUser.displayName || 'User',
              role: userData.role || 'user',
              photoURL: firebaseUser.photoURL || userData.photoURL || null,
              createdAt: userData.createdAt || new Date().toISOString()
            });
          } else {
            // Create user profile if it doesn't exist
            const role = firebaseUser.email?.includes('admin') ? 'admin' : 'user';
            const userProfile = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'User',
              role: role,
              photoURL: firebaseUser.photoURL || null,
              createdAt: new Date().toISOString()
            };
            
            try {
              await set(userRef, userProfile);
              setUser(userProfile);
            } catch (error) {
              console.error('Error creating user profile:', error);
              // Set user anyway with basic info
              setUser(userProfile);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const createUserProfile = async (firebaseUser, name) => {
    const role = firebaseUser.email?.includes('admin') ? 'admin' : 'user';
    const userProfile = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: name || firebaseUser.displayName || 'User',
      role: role,
      photoURL: firebaseUser.photoURL || null,
      createdAt: new Date().toISOString()
    };

    const userRef = ref(database, `users/${firebaseUser.uid}`);
    await set(userRef, userProfile);
    return userProfile;
  };

  const signup = async (email, password, name) => {
    try {
      if (!requireEmailVerification) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        if (name) {
          await updateProfile(firebaseUser, { displayName: name });
        }

        const userProfile = await createUserProfile(firebaseUser, name);
        setUser(userProfile);
        return { status: 'verified', user: userProfile };
      }

      // Create pending user first
      const pendingUser = await createPendingUser({ name, email, password });
      
      // Send verification email
      try {
        await sendVerificationEmail({
          name,
          email,
          otp: pendingUser.otp
        });
        console.log('Verification email sent successfully to:', email);
      } catch (emailError) {
        // If email sending fails, log the error but don't block signup
        // The pending user is already created with the OTP, so user can resend from verification page
        console.error('Failed to send verification email:', emailError);
        console.error('Email error details:', {
          message: emailError.message,
          text: emailError.text,
          status: emailError.status
        });
        // Still return pending status so user can go to verification page and resend
        // The error will be shown when they try to resend
      }
      
      return { status: 'pending', email };
    } catch (error) {
      // Handle Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please sign in instead.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address. Please check and try again.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please choose a stronger password.');
      }
      throw new Error(error.message || 'Failed to create account. Please try again.');
    }
  };

  const resendVerificationCode = async (email) => {
    if (!requireEmailVerification) {
      throw new Error('Email verification is disabled.');
    }

    try {
      const pendingUser = await resendPendingUserOTP(email);
      
      try {
        await sendVerificationEmail({
          name: pendingUser.name,
          email: pendingUser.email,
          otp: pendingUser.otp
        });
        console.log('Resend verification email sent successfully to:', email);
      } catch (emailError) {
        console.error('Failed to resend verification email:', emailError);
        // Re-throw the email error so the UI can show it
        throw new Error(emailError.message || 'Failed to send verification email. Please check your EmailJS configuration.');
      }
      
      return pendingUser;
    } catch (error) {
      // Re-throw with better error message
      if (error.message.includes('No pending verification')) {
        throw new Error('No pending verification found. Please sign up again.');
      } else if (error.message.includes('wait')) {
        throw error; // Keep cooldown messages as-is
      } else if (error.message.includes('locked')) {
        throw error; // Keep lockout messages as-is
      }
      throw new Error(error.message || 'Failed to resend verification code.');
    }
  };

  const verifyEmailOtp = async (email, otp) => {
    if (!requireEmailVerification) {
      return { status: 'disabled' };
    }

    const result = await verifyPendingUserOTP(email, otp);

    if (result.status !== 'verified') {
      return result;
    }

    const { pendingUser } = result;
    const password = getPendingUserPassword(pendingUser);

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    if (pendingUser.name) {
      await updateProfile(firebaseUser, { displayName: pendingUser.name });
    }

    const userProfile = await createUserProfile(firebaseUser, pendingUser.name);
    setUser(userProfile);
    await movePendingUserToVerified(email);

    return { status: 'success', user: userProfile };
  };

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Check if user profile exists, if not create it
      const userRef = ref(database, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        await createUserProfile(firebaseUser, firebaseUser.displayName);
      }
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      // Delete user data from database
      await storage.deleteUserAccount(user.id);

      // Delete user from Firebase Auth
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        await deleteUser(firebaseUser);
      }

      // Clear user state
      setUser(null);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error(error.message || 'Failed to delete account');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        verifyEmailOtp,
        resendVerificationCode,
        signInWithGoogle,
        logout,
        deleteAccount,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

