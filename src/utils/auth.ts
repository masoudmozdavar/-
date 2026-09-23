import { UserAccount } from '../types';
import { hashPin } from './security';
import { generateSalt, hashPasswordSecure } from './cryptoAuth';
import { 
  syncUserProfileToFirestore, 
  fetchUserByEmailFromFirestore,
  initiateEmailPasswordRecovery,
  completePasswordRecoveryWithOtp
} from '../lib/firestoreSync';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

const USERS_STORAGE_KEY = 'jibino_registered_users_v1';
const CURRENT_USER_KEY = 'jibino_current_session_user_v1';

export const DEMO_USER: UserAccount = {
  id: 'demo',
  email: 'demo@jibino.app',
  username: 'demo',
  passwordHash: '',
  name: 'مسعود (کاربر دمو)',
  role: 'head',
  createdAt: '2026-01-01',
  isDemo: true,
};

export function getRegisteredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to get registered users:', err);
    return [];
  }
}

export function saveRegisteredUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save registered users:', err);
  }
}

export function getCurrentUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to get current user session:', err);
    return null;
  }
}

export function setCurrentUser(user: UserAccount | null): void {
  try {
    if (!user) {
      localStorage.removeItem(CURRENT_USER_KEY);
    } else {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
  } catch (err) {
    console.error('Failed to set current user session:', err);
  }
}

export function updateUserAccountProfile(userId: string, updates: Partial<UserAccount>): UserAccount | null {
  try {
    const users = getRegisteredUsers();
    const idx = users.findIndex(u => u.id === userId);
    const current = getCurrentUser();
    let updatedUser: UserAccount | null = null;
    
    if (current && (current.id === userId || current.isDemo)) {
      updatedUser = { ...current, ...updates };
      setCurrentUser(updatedUser);
    }
    
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      saveRegisteredUsers(users);
      if (!updatedUser) updatedUser = users[idx];
    }
    
    if (updatedUser && !updatedUser.isDemo) {
      syncUserProfileToFirestore(updatedUser).catch(e => console.warn(e));
    }
    
    return updatedUser;
  } catch (err) {
    console.error('Failed to update user profile in auth storage:', err);
    return null;
  }
}

export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  role?: 'head' | 'member';
}): Promise<{ success: boolean; error?: string; user?: UserAccount }> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const trimmedName = params.name.trim();

  if (!trimmedName) {
    return { success: false, error: 'لطفاً نام و نام خانوادگی خود را وارد کنید.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    return { success: false, error: 'لطفاً یک آدرس ایمیل معتبر وارد کنید (مثال: name@example.com).' };
  }
  if (!params.password || params.password.length < 4) {
    return { success: false, error: 'رمز عبور باید حداقل ۴ رقم یا کاراکتر باشد.' };
  }
  if (normalizedEmail === 'demo@jibino.app' || normalizedEmail === 'demo') {
    return { success: false, error: 'این ایمیل برای حساب دمو رزرو شده است.' };
  }

  const existingUsers = getRegisteredUsers();
  if (existingUsers.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: 'کاربری با این ایمیل قبلاً ثبت‌نام کرده است. لطفاً وارد شوید.' };
  }

  // Generate unique cryptographically secure salt and PBKDF2-SHA256 hash
  const salt = generateSalt(16);
  const passwordHash = await hashPasswordSecure(params.password, salt);

  // Attempt Firebase Auth creation
  let firebaseUid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  try {
    const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, params.password);
    if (cred.user) {
      firebaseUid = cred.user.uid;
      await updateProfile(cred.user, { displayName: trimmedName });
    }
  } catch (fbErr: any) {
    console.log('[Firebase Auth] Note during register:', fbErr?.code || fbErr?.message);
    // If user already exists in Firebase Auth or email-password provider requires console activation, we still proceed with secure salted hashing
  }

  const newUser: UserAccount = {
    id: firebaseUid,
    email: normalizedEmail,
    username: normalizedEmail.split('@')[0],
    passwordHash,
    salt,
    name: trimmedName,
    role: params.role || 'head',
    createdAt: new Date().toISOString(),
    isDemo: false,
    syncedWithFirestore: true,
  };

  existingUsers.push(newUser);
  saveRegisteredUsers(existingUsers);
  setCurrentUser(newUser);

  // Sync to Firestore database in background
  syncUserProfileToFirestore(newUser).catch(e => console.warn('[Firestore] Async profile sync notice:', e));

  return { success: true, user: newUser };
}

export async function loginUser(
  identifier: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: UserAccount }> {
  const normalizedIdentifier = identifier.trim().toLowerCase();

  if (normalizedIdentifier === 'demo' || normalizedIdentifier === 'demo@jibino.app') {
    setCurrentUser(DEMO_USER);
    return { success: true, user: DEMO_USER };
  }

  const users = getRegisteredUsers();
  let user = users.find(
    u => u.email.toLowerCase() === normalizedIdentifier || u.username?.toLowerCase() === normalizedIdentifier
  );

  // If not found in local cache, attempt to fetch from Firestore
  if (!user) {
    const remoteUser = await fetchUserByEmailFromFirestore(normalizedIdentifier);
    if (remoteUser) {
      user = remoteUser;
      users.push(remoteUser);
      saveRegisteredUsers(users);
    }
  }

  if (!user) {
    return { success: false, error: 'کاربری با این ایمیل یافت نشد. لطفاً ابتدا ثبت‌نام کنید.' };
  }

  // Verify password: check PBKDF2 with salt, or legacy hashPin with auto-upgrade
  let isPasswordValid = false;
  if (user.salt) {
    const computedHash = await hashPasswordSecure(password, user.salt);
    isPasswordValid = (computedHash === user.passwordHash);
  } else {
    // Legacy hashPin fallback
    const legacyHash = await hashPin(password);
    if (legacyHash === user.passwordHash) {
      isPasswordValid = true;
      // Upgrade to secure PBKDF2 salt & hash
      const newSalt = generateSalt(16);
      user.salt = newSalt;
      user.passwordHash = await hashPasswordSecure(password, newSalt);
      saveRegisteredUsers(users);
      syncUserProfileToFirestore(user).catch(e => console.warn(e));
    }
  }

  if (!isPasswordValid) {
    return { success: false, error: 'رمز عبور وارد شده نادرست است.' };
  }

  // Attempt Firebase Auth sign-in in background
  try {
    await signInWithEmailAndPassword(auth, user.email, password);
  } catch (fbErr: any) {
    console.log('[Firebase Auth] Sign in note:', fbErr?.code || fbErr?.message);
  }

  setCurrentUser(user);
  return { success: true, user };
}

export async function requestPasswordRecovery(email: string) {
  const users = getRegisteredUsers();
  const res = await initiateEmailPasswordRecovery(email, users);
  saveRegisteredUsers(users);
  return res;
}

export async function confirmPasswordRecovery(email: string, otpCode: string, newPassword: string) {
  const users = getRegisteredUsers();
  const res = await completePasswordRecoveryWithOtp(email, otpCode, newPassword, users);
  if (res.success && res.updatedUser) {
    const idx = users.findIndex(u => u.id === res.updatedUser?.id);
    if (idx !== -1) {
      users[idx] = res.updatedUser;
    } else {
      users.push(res.updatedUser);
    }
    saveRegisteredUsers(users);
  }
  return res;
}

export function loginAsDemo(): UserAccount {
  setCurrentUser(DEMO_USER);
  return DEMO_USER;
}

export function logoutUser(): void {
  setCurrentUser(null);
}
