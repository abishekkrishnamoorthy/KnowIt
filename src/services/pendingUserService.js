import { ref, get, set, update, remove } from 'firebase/database';
import { database } from '../config/firebase';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const RESEND_COOLDOWN_SECONDS = 60;

const sanitizeEmail = (email) => email.toLowerCase().replace(/[.#$/[\]]/g, '_');

const generateOTP = () => {
  return Array.from({ length: OTP_LENGTH }, () => Math.floor(Math.random() * 10)).join('');
};

const encodePassword = (password) => {
  if (typeof window !== 'undefined' && window.btoa) {
    return window.btoa(unescape(encodeURIComponent(password)));
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(password, 'utf-8').toString('base64');
  }
  return password;
};

const decodePassword = (encoded) => {
  if (typeof window !== 'undefined' && window.atob) {
    return decodeURIComponent(escape(window.atob(encoded)));
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  }
  return encoded;
};

const getPendingUserSnapshot = async (email) => {
  const pendingRef = ref(database, `pendingUsers/${sanitizeEmail(email)}`);
  const snapshot = await get(pendingRef);
  return { snapshot, pendingRef };
};

export const createPendingUser = async ({ name, email, password }) => {
  const { snapshot, pendingRef } = await getPendingUserSnapshot(email);
  const now = Date.now();
  const otp = generateOTP();

  if (snapshot.exists()) {
    const data = snapshot.val();
    if (data.lockedUntil && data.lockedUntil > now) {
      const minutes = Math.ceil((data.lockedUntil - now) / 60000);
      throw new Error(`Too many attempts. Try again in ${minutes} minutes.`);
    }
  }

  const pendingUserRecord = {
    name,
    email,
    encodedPassword: encodePassword(password),
    otp,
    otpExpiresAt: now + OTP_EXPIRY_MINUTES * 60 * 1000,
    attempts: 0,
    lockedUntil: null,
    lastSentAt: now
  };

  await set(pendingRef, pendingUserRecord);
  return pendingUserRecord;
};

export const resendPendingUserOTP = async (email) => {
  const { snapshot, pendingRef } = await getPendingUserSnapshot(email);
  if (!snapshot.exists()) {
    throw new Error('No pending verification found for this email.');
  }

  const data = snapshot.val();
  const now = Date.now();

  if (data.lockedUntil && data.lockedUntil > now) {
    const minutes = Math.ceil((data.lockedUntil - now) / 60000);
    throw new Error(`Account locked. Try again in ${minutes} minutes.`);
  }

  if (data.lastSentAt && now - data.lastSentAt < RESEND_COOLDOWN_SECONDS * 1000) {
    const seconds = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (now - data.lastSentAt)) / 1000);
    throw new Error(`Please wait ${seconds}s before requesting another code.`);
  }

  const updatedData = {
    ...data,
    otp: generateOTP(),
    otpExpiresAt: now + OTP_EXPIRY_MINUTES * 60 * 1000,
    lastSentAt: now
  };

  await update(pendingRef, updatedData);
  return updatedData;
};

export const verifyPendingUserOTP = async (email, otpInput) => {
  const { snapshot, pendingRef } = await getPendingUserSnapshot(email);
  if (!snapshot.exists()) {
    return { status: 'not_found' };
  }

  const data = snapshot.val();
  const now = Date.now();

  if (data.lockedUntil && data.lockedUntil > now) {
    const minutes = Math.ceil((data.lockedUntil - now) / 60000);
    return { status: 'locked', minutesRemaining: minutes };
  }

  if (!data.otp || data.otpExpiresAt < now) {
    return { status: 'expired' };
  }

  if (data.otp !== otpInput) {
    const attempts = (data.attempts || 0) + 1;
    const updates = { attempts };

    if (attempts >= MAX_ATTEMPTS) {
      updates.lockedUntil = now + LOCKOUT_MINUTES * 60 * 1000;
      updates.attempts = 0;
    }

    await update(pendingRef, updates);
    return {
      status: updates.lockedUntil ? 'locked' : 'invalid',
      attemptsRemaining: MAX_ATTEMPTS - attempts
    };
  }

  return { status: 'verified', pendingUser: data, pendingRef };
};

export const movePendingUserToVerified = async (email) => {
  const { pendingRef } = await getPendingUserSnapshot(email);
  await remove(pendingRef);
};

export const getPendingUserPassword = (pendingUser) => {
  return decodePassword(pendingUser.encodedPassword);
};

