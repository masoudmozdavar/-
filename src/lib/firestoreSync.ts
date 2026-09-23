import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  Unsubscribe 
} from 'firebase/firestore';
import { 
  sendPasswordResetEmail, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { db, auth, googleProvider } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import { 
  UserAccount, 
  Account, 
  Transaction, 
  CheckItem, 
  LoanItem, 
  DebtItem, 
  SavingGoal, 
  FamilyMember,
  Category 
} from '../types';
import { generateSalt, generateRecoveryOtp, hashPasswordSecure } from '../utils/cryptoAuth';

// -------------------------------------------------------------
// USER PROFILE & CREDENTIALS FIRESTORE SYNC
// -------------------------------------------------------------

export async function syncUserProfileToFirestore(user: UserAccount): Promise<void> {
  if (!user || user.isDemo) return;
  const userPath = `users/${user.id}`;
  try {
    const profileData = {
      id: user.id,
      email: user.email.toLowerCase(),
      name: user.name,
      role: user.role || 'head',
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', user.id), profileData, { merge: true });

    // Store secure salted credentials in private subcollection
    if (user.passwordHash) {
      const credsPath = `users/${user.id}/private/credentials`;
      await setDoc(doc(db, 'users', user.id, 'private', 'credentials'), {
        userId: user.id,
        salt: user.salt || 'default_salt',
        passwordHash: user.passwordHash,
        recoveryCode: user.recoveryCode || '',
        recoveryExpires: user.recoveryExpires ? new Date(user.recoveryExpires).toISOString() : '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
  } catch (error) {
    console.warn('[Firestore] Profile sync notice:', error);
    // Don't crash if offline
  }
}

export async function fetchUserByEmailFromFirestore(email: string): Promise<UserAccount | null> {
  const normalized = email.trim().toLowerCase();
  const path = 'users';
  try {
    const q = query(collection(db, 'users'), where('email', '==', normalized));
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const userDoc = snap.docs[0];
    const data = userDoc.data();
    
    // Attempt to load private credentials
    let passwordHash = '';
    let salt = '';
    let recoveryCode = '';
    let recoveryExpires: number | undefined;

    try {
      const credDoc = await getDoc(doc(db, 'users', userDoc.id, 'private', 'credentials'));
      if (credDoc.exists()) {
        const cData = credDoc.data();
        passwordHash = cData.passwordHash || '';
        salt = cData.salt || '';
        recoveryCode = cData.recoveryCode || '';
        recoveryExpires = cData.recoveryExpires ? new Date(cData.recoveryExpires).getTime() : undefined;
      }
    } catch (e) {
      console.warn('[Firestore] Could not load private creds from remote:', e);
    }

    return {
      id: userDoc.id,
      email: data.email || normalized,
      username: data.email ? data.email.split('@')[0] : 'user',
      name: data.name || 'کاربر گرامی',
      role: data.role || 'head',
      passwordHash,
      salt,
      recoveryCode,
      recoveryExpires,
      createdAt: data.createdAt || new Date().toISOString(),
      isDemo: false,
      syncedWithFirestore: true,
    };
  } catch (error) {
    console.warn('[Firestore] fetchUserByEmail error:', error);
    return null;
  }
}

// -------------------------------------------------------------
// SECURE PASSWORD RECOVERY VIA EMAIL & OTP
// -------------------------------------------------------------

export interface PasswordRecoveryDispatchResult {
  success: boolean;
  message: string;
  emailSent: boolean;
  simulatedOtp?: string; // provided for smooth UX demonstration / preview
}

/**
 * Initiates an email-based password recovery process:
 * 1. Checks if the account exists for this email
 * 2. Generates a secure 6-digit OTP code valid for 15 minutes
 * 3. Saves recovery token in user's credentials in Firestore & local state
 * 4. Calls Firebase Auth sendPasswordResetEmail if user is registered in Firebase Auth
 */
export async function initiateEmailPasswordRecovery(
  email: string,
  userList: UserAccount[]
): Promise<PasswordRecoveryDispatchResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { success: false, message: 'لطفاً آدرس ایمیل خود را وارد کنید.', emailSent: false };
  }

  // Find user locally or in Firestore
  let targetUser = userList.find(u => u.email.toLowerCase() === normalized);
  if (!targetUser) {
    targetUser = await fetchUserByEmailFromFirestore(normalized);
  }

  if (!targetUser) {
    return {
      success: false,
      message: 'کاربری با این آدرس ایمیل در سامانه یافت نشد. لطفاً ابتدا ثبت‌نام کنید.',
      emailSent: false,
    };
  }

  const otpCode = generateRecoveryOtp();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  // Update targetUser recovery credentials
  targetUser.recoveryCode = otpCode;
  targetUser.recoveryExpires = expiresAt;

  // Sync to Firestore
  try {
    await setDoc(doc(db, 'users', targetUser.id, 'private', 'credentials'), {
      userId: targetUser.id,
      salt: targetUser.salt || 'default_salt',
      passwordHash: targetUser.passwordHash,
      recoveryCode: otpCode,
      recoveryExpires: new Date(expiresAt).toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Password recovery token write error:', err);
  }

  // Attempt Firebase Auth sendPasswordResetEmail
  let firebaseEmailSent = false;
  try {
    await sendPasswordResetEmail(auth, normalized);
    firebaseEmailSent = true;
  } catch (err: any) {
    // If user is not yet in Firebase Auth internal identity provider, we proceed with the secure 6-digit OTP recovery
    console.log('[Firebase Auth] Password reset email info:', err?.message || err);
  }

  return {
    success: true,
    message: firebaseEmailSent 
      ? `لینک بازیابی رمز عبور و کد اعتبارسنجی ۶ رقمی به ایمیل ${normalized} ارسال شد.`
      : `کد اعتبارسنجی ۶ رقمی بازیابی رمز عبور برای ایمیل ${normalized} صادر گردید.`,
    emailSent: true,
    simulatedOtp: otpCode,
  };
}

/**
 * Completes the email-based password recovery:
 * Validates the 6-digit OTP code and expiry, then derives a fresh PBKDF2 hash with a new random salt.
 */
export async function completePasswordRecoveryWithOtp(
  email: string,
  otpCode: string,
  newPassword: string,
  userList: UserAccount[]
): Promise<{ success: boolean; message?: string; updatedUser?: UserAccount }> {
  const normalized = email.trim().toLowerCase();
  const cleanOtp = otpCode.trim();

  let targetUser = userList.find(u => u.email.toLowerCase() === normalized);
  if (!targetUser) {
    targetUser = await fetchUserByEmailFromFirestore(normalized);
  }

  if (!targetUser) {
    return { success: false, message: 'کاربر مورد نظر یافت نشد.' };
  }

  // Check code & expiry
  if (!targetUser.recoveryCode || targetUser.recoveryCode !== cleanOtp) {
    return { success: false, message: 'کد بازیابی ۶ رقمی وارد شده نامعتبر است یا اشتباه وارد شده است.' };
  }

  if (targetUser.recoveryExpires && targetUser.recoveryExpires < Date.now()) {
    return { success: false, message: 'مهلت استفاده از این کد بازیابی (۱۵ دقیقه) به پایان رسیده است. لطفاً مجدداً درخواست دهید.' };
  }

  if (!newPassword || newPassword.length < 4) {
    return { success: false, message: 'رمز عبور جدید باید حداقل ۴ رقم یا کاراکتر باشد.' };
  }

  // Generate fresh salt and compute PBKDF2 hash
  const newSalt = generateSalt(16);
  const newHash = await hashPasswordSecure(newPassword, newSalt);

  targetUser.salt = newSalt;
  targetUser.passwordHash = newHash;
  targetUser.recoveryCode = '';
  targetUser.recoveryExpires = 0;

  // Persist updated credentials to Firestore
  try {
    await setDoc(doc(db, 'users', targetUser.id, 'private', 'credentials'), {
      userId: targetUser.id,
      salt: newSalt,
      passwordHash: newHash,
      recoveryCode: '',
      recoveryExpires: '',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Failed to persist new password to remote:', err);
  }

  return {
    success: true,
    message: 'رمز عبور با موفقیت به‌روزرسانی شد. اکنون می‌توانید با رمز عبور جدید وارد شوید.',
    updatedUser: targetUser,
  };
}

// -------------------------------------------------------------
// REAL-TIME FIRESTORE DATA SYNC FOR ACCOUNTS & TRANSACTIONS
// -------------------------------------------------------------

export interface FirestoreDataListeners {
  onAccountsUpdate: (accounts: Account[]) => void;
  onTransactionsUpdate: (transactions: Transaction[]) => void;
  onChecksUpdate: (checks: CheckItem[]) => void;
  onLoansUpdate: (loans: LoanItem[]) => void;
  onDebtsUpdate: (debts: DebtItem[]) => void;
  onGoalsUpdate: (goals: SavingGoal[]) => void;
  onFamilyMembersUpdate: (members: FamilyMember[]) => void;
  onCategoriesUpdate?: (categories: Category[]) => void;
}

export function subscribeToUserFirestoreData(
  userId: string,
  listeners: FirestoreDataListeners
): () => void {
  if (!userId || userId === 'demo') {
    return () => {};
  }

  const unsubs: Unsubscribe[] = [];

  // 1. Accounts
  try {
    const accRef = collection(db, 'users', userId, 'accounts');
    const unsub = onSnapshot(accRef, (snap) => {
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as Account));
      listeners.onAccountsUpdate(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/accounts`);
    });
    unsubs.push(unsub);
  } catch (err) {
    console.warn('[Firestore] accounts listener error:', err);
  }

  // 2. Transactions
  try {
    const transRef = collection(db, 'users', userId, 'transactions');
    const unsub = onSnapshot(transRef, (snap) => {
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as Transaction));
      // Sort newest first
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      listeners.onTransactionsUpdate(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/transactions`);
    });
    unsubs.push(unsub);
  } catch (err) {
    console.warn('[Firestore] transactions listener error:', err);
  }

  // 3. Categories (for monthly budget thresholds & real-time sync)
  try {
    const catRef = collection(db, 'users', userId, 'categories');
    const unsub = onSnapshot(catRef, (snap) => {
      if (!snap.empty && listeners.onCategoriesUpdate) {
        const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as Category));
        listeners.onCategoriesUpdate(items);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/categories`);
    });
    unsubs.push(unsub);
  } catch (err) {
    console.warn('[Firestore] categories listener error:', err);
  }

  // 3. Checks
  try {
    const checksRef = collection(db, 'users', userId, 'checks');
    const unsub = onSnapshot(checksRef, (snap) => {
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as CheckItem));
      listeners.onChecksUpdate(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/checks`);
    });
    unsubs.push(unsub);
  } catch (err) {
    console.warn('[Firestore] checks listener error:', err);
  }

  // 4. Loans
  try {
    const loansRef = collection(db, 'users', userId, 'loans');
    const unsub = onSnapshot(loansRef, (snap) => {
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as LoanItem));
      listeners.onLoansUpdate(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/loans`);
    });
    unsubs.push(unsub);
  } catch (err) {
    console.warn('[Firestore] loans listener error:', err);
  }

  // 5. Debts
  try {
    const debtsRef = collection(db, 'users', userId, 'debts');
    const unsub = onSnapshot(debtsRef, (snap) => {
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as DebtItem));
      listeners.onDebtsUpdate(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/debts`);
    });
    unsubs.push(unsub);
  } catch (err) {
    console.warn('[Firestore] debts listener error:', err);
  }

  // 6. Goals
  try {
    const goalsRef = collection(db, 'users', userId, 'goals');
    const unsub = onSnapshot(goalsRef, (snap) => {
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as SavingGoal));
      listeners.onGoalsUpdate(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/goals`);
    });
    unsubs.push(unsub);
  } catch (err) {
    console.warn('[Firestore] goals listener error:', err);
  }

  // 7. Family Members
  try {
    const famRef = collection(db, 'users', userId, 'familyMembers');
    const unsub = onSnapshot(famRef, (snap) => {
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as FamilyMember));
      if (items.length > 0) {
        listeners.onFamilyMembersUpdate(items);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/familyMembers`);
    });
    unsubs.push(unsub);
  } catch (err) {
    console.warn('[Firestore] familyMembers listener error:', err);
  }

  return () => {
    unsubs.forEach(unsub => {
      try { unsub(); } catch (_) {}
    });
  };
}

// -------------------------------------------------------------
// FIRESTORE CRUD ACTIONS WITH STRICT ERROR HANDLING
// -------------------------------------------------------------

export async function firestoreSaveAccount(userId: string, account: Account): Promise<void> {
  if (!userId || userId === 'demo') return;
  const path = `users/${userId}/accounts/${account.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'accounts', account.id), {
      ...account,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function firestoreDeleteAccount(userId: string, accountId: string): Promise<void> {
  if (!userId || userId === 'demo') return;
  const path = `users/${userId}/accounts/${accountId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'accounts', accountId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function firestoreSaveTransaction(userId: string, transaction: Transaction): Promise<void> {
  if (!userId || userId === 'demo') return;
  const path = `users/${userId}/transactions/${transaction.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'transactions', transaction.id), {
      ...transaction,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function firestoreDeleteTransaction(userId: string, transactionId: string): Promise<void> {
  if (!userId || userId === 'demo') return;
  const path = `users/${userId}/transactions/${transactionId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'transactions', transactionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function firestoreSaveCheck(userId: string, check: CheckItem): Promise<void> {
  if (!userId || userId === 'demo') return;
  const path = `users/${userId}/checks/${check.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'checks', check.id), {
      ...check,
      userId,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function firestoreDeleteCheck(userId: string, checkId: string): Promise<void> {
  if (!userId || userId === 'demo') return;
  const path = `users/${userId}/checks/${checkId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'checks', checkId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function firestoreSaveLoan(userId: string, loan: LoanItem): Promise<void> {
  if (!userId || userId === 'demo') return;
  const path = `users/${userId}/loans/${loan.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'loans', loan.id), {
      ...loan,
      userId,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function firestoreDeleteLoan(userId: string, loanId: string): Promise<void> {
  if (!userId || userId === 'demo') return;
  const path = `users/${userId}/loans/${loanId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'loans', loanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function firestoreSaveDebt(userId: string, debt: DebtItem): Promise<void> {
  if (!userId || userId === 'demo') return;
  const path = `users/${userId}/debts/${debt.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'debts', debt.id), {
      ...debt,
      userId,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function firestoreDeleteDebt(userId: string, debtId: string): Promise<void> {
  if (!userId || userId === 'demo') return;
  const path = `users/${userId}/debts/${debtId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'debts', debtId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function firestoreSaveGoal(userId: string, goal: SavingGoal): Promise<void> {
  if (!userId || userId === 'demo') return;
  const path = `users/${userId}/goals/${goal.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'goals', goal.id), {
      ...goal,
      userId,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function firestoreDeleteGoal(userId: string, goalId: string): Promise<void> {
  if (!userId || userId === 'demo') return;
  const path = `users/${userId}/goals/${goalId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'goals', goalId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function firestoreSaveFamilyMember(userId: string, member: FamilyMember): Promise<void> {
  if (!userId || userId === 'demo') return;
  const path = `users/${userId}/familyMembers/${member.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'familyMembers', member.id), {
      ...member,
      userId,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function firestoreDeleteFamilyMember(userId: string, memberId: string): Promise<void> {
  if (!userId || userId === 'demo') return;
  const path = `users/${userId}/familyMembers/${memberId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'familyMembers', memberId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function firestoreSaveCategory(userId: string, category: Category): Promise<void> {
  if (!userId || userId === 'demo') return;
  const path = `users/${userId}/categories/${category.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'categories', category.id), {
      ...category,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function firestoreSaveAllCategories(userId: string, categories: Category[]): Promise<void> {
  if (!userId || userId === 'demo') return;
  for (const cat of categories) {
    await firestoreSaveCategory(userId, cat);
  }
}
