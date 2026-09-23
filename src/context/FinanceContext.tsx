import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Account, 
  Category, 
  Transaction, 
  CheckItem, 
  DebtItem, 
  LoanItem, 
  SavingGoal, 
  CurrencyType, 
  LanguageType, 
  NavigationTab,
  CheckStatus,
  BudgetAlert,
  ThemeMode,
  FinanceNotification,
  SecurityLockConfig,
  FamilyMember,
  FamilyAllowanceRequest,
  FamilyRole,
  FamilyMemberRoutineTab,
  HighValueTransactionAlert,
  SmartBudgetProjectionAlert,
  UserAccount
} from '../types';
import { 
  getCurrentUser, 
  setCurrentUser as saveAuthUser, 
  updateUserAccountProfile,
  logoutUser, 
  DEMO_USER 
} from '../utils/auth';
import { 
  subscribeToUserFirestoreData,
  firestoreSaveAccount,
  firestoreDeleteAccount,
  firestoreSaveTransaction,
  firestoreDeleteTransaction,
  firestoreSaveCheck,
  firestoreDeleteCheck,
  firestoreSaveLoan,
  firestoreDeleteLoan,
  firestoreSaveDebt,
  firestoreDeleteDebt,
  firestoreSaveGoal,
  firestoreDeleteGoal,
  firestoreSaveFamilyMember,
  firestoreDeleteFamilyMember,
  firestoreSaveCategory,
} from '../lib/firestoreSync';
import { validateFirestoreConnection } from '../lib/firebase';
import { analyzeSmartBudgetProjections } from '../utils/smartBudgetEngine';
import { playAlertChime } from '../utils/audioAlert';
import { 
  loadStoredData, 
  saveStateToStorage, 
  AppStateData 
} from '../utils/storage';
import { 
  loadSecurityConfig, 
  saveSecurityConfig, 
  hashPin, 
  isBiometricSupported, 
  authenticateBiometric 
} from '../utils/security';
import { 
  INITIAL_ACCOUNTS, 
  INITIAL_CATEGORIES, 
  INITIAL_CHECKS, 
  INITIAL_DEBTS, 
  INITIAL_GOALS, 
  INITIAL_LOANS, 
  INITIAL_TRANSACTIONS,
  INITIAL_FAMILY_MEMBERS,
  INITIAL_ALLOWANCE_REQUESTS
} from '../utils/initialData';
import { getTodayISO, getTodayJalali } from '../utils/jalali';
import { generatePrioritizedNotifications } from '../utils/notificationEngine';
import { 
  broadcastFamilyEvent, 
  listenToFamilyEvents, 
  syncTransactionWithServer, 
  syncRequestWithServer, 
  fetchServerFamilyState, 
  getMemberIdFromCurrentURL 
} from '../utils/familySync';

interface FinanceContextType {
  // User Account & Authentication
  currentUser: UserAccount | null;
  isFirestoreConnected: boolean;
  setCurrentUser: (user: UserAccount | null) => void;
  logout: () => void;
  loadDemoData: () => void;
  clearUserData: () => void;

  // State
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  checks: CheckItem[];
  debts: DebtItem[];
  loans: LoanItem[];
  goals: SavingGoal[];
  currency: CurrencyType;
  language: LanguageType;
  theme: ThemeMode;
  activeTab: NavigationTab;

  // Family Hub & Routine Mode State & Operations
  familyMembers: FamilyMember[];
  activeMemberId: string;
  activeMember: FamilyMember;
  isHeadOfFamily: boolean;
  allowanceRequests: FamilyAllowanceRequest[];
  activeMemberRoutineTab: FamilyMemberRoutineTab;
  setActiveMemberRoutineTab: (tab: FamilyMemberRoutineTab) => void;
  setActiveMemberId: (id: string) => void;
  addFamilyMember: (member: Omit<FamilyMember, 'id' | 'createdAt'>) => void;
  updateFamilyMember: (id: string, updated: Partial<FamilyMember>) => void;
  deleteFamilyMember: (id: string) => void;
  switchMemberProfile: (memberId: string, pinAttempt?: string) => { success: boolean; error?: string };
  exitToHeadProfile: (headPinAttempt?: string) => { success: boolean; error?: string };
  submitAllowanceRequest: (amount: number, reason: string) => void;
  approveAllowanceRequest: (requestId: string, sourceAccountId: string) => void;
  rejectAllowanceRequest: (requestId: string) => void;
  isProfileSwitcherOpen: boolean;
  setIsProfileSwitcherOpen: (open: boolean) => void;
  isUserProfileModalOpen: boolean;
  setIsUserProfileModalOpen: (open: boolean) => void;
  openUserProfile: () => void;
  updateUserProfile: (updates: Partial<{ name: string; avatar: string; phone?: string }>) => Promise<boolean>;
  memberAccessModalFor: FamilyMember | null;
  setMemberAccessModalFor: (member: FamilyMember | null) => void;
  memberSpendingStats: Array<{
    memberId: string;
    memberName: string;
    memberRole: FamilyRole;
    avatar: string;
    color: string;
    totalSpentThisMonth: number;
    transactionCount: number;
    allowance: number;
    allowancePercent: number;
  }>;

  // Real-time High Value Transaction Alerts for Head
  highValueAlertThreshold: number;
  setHighValueAlertThreshold: (threshold: number) => void;
  highValueAlerts: HighValueTransactionAlert[];
  activeHighValueAlert: HighValueTransactionAlert | null;
  dismissHighValueAlert: (alertId: string) => void;
  clearAllHighValueAlerts: () => void;
  triggerTestHighValueAlert: () => void;

  // Modals & UI State
  isTransactionModalOpen: boolean;
  editingTransaction: Transaction | null;
  openTransactionModal: (tx?: Transaction) => void;
  openAddTransactionModal: (tx?: Transaction) => void;
  closeTransactionModal: () => void;

  // Setters & Actions
  setCurrency: (c: CurrencyType) => void;
  setLanguage: (l: LanguageType) => void;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
  setActiveTab: (tab: NavigationTab) => void;

  // Account Operations
  addAccount: (acc: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, acc: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  transferBetweenAccounts: (fromId: string, toId: string, amount: number, description?: string) => void;

  // Transaction Operations
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Checks Operations
  addCheck: (check: Omit<CheckItem, 'id'>) => void;
  updateCheckStatus: (id: string, status: CheckStatus) => void;
  deleteCheck: (id: string) => void;

  // Debt Operations
  addDebt: (debt: Omit<DebtItem, 'id' | 'createdAt'>) => void;
  recordDebtPayment: (id: string, paymentAmount: number) => void;
  deleteDebt: (id: string) => void;

  // Loan Operations
  addLoan: (loan: Omit<LoanItem, 'id'>) => void;
  payLoanInstallment: (id: string) => void;
  deleteLoan: (id: string) => void;

  // Goals Operations
  addGoal: (goal: Omit<SavingGoal, 'id'>) => void;
  addFundsToGoal: (id: string, amount: number, sourceAccountId?: string) => void;
  deleteGoal: (id: string) => void;

  // Category & Budget Operations
  updateCategoryBudget: (categoryId: string, monthlyLimit: number) => void;
  updateCategory: (categoryId: string, updated: Partial<Category>) => void;

  // Reset & Import
  resetToSampleData: () => void;
  importBackupData: (data: AppStateData) => void;

  // Computed Summaries
  totalNetWorth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  pendingIssuedChecks: number;
  pendingReceivedChecks: number;
  totalDebtsOwed: number; // پولی که من باید بدم
  totalReceivablesOwed: number; // پولی که باید بگیرم
  financialHealthScore: number; // 0 to 100
  budgetAlerts: BudgetAlert[];
  smartBudgetAlerts: SmartBudgetProjectionAlert[];
  dismissSmartBudgetAlert: (id: string) => void;

  // Prioritized Notifications & Reminders
  notifications: FinanceNotification[];
  activeNotifications: FinanceNotification[];
  dismissNotification: (id: string) => void;
  criticalNotificationsCount: number;
  unreadNotificationsCount: number;

  // Security & App Lock
  securityConfig: SecurityLockConfig;
  isLocked: boolean;
  isSecuritySettingsOpen: boolean;
  setIsSecuritySettingsOpen: (open: boolean) => void;
  lockApp: () => void;
  unlockAppWithPin: (pin: string) => Promise<boolean>;
  unlockAppWithBiometric: () => Promise<boolean>;
  updateSecurityConfig: (config: Partial<SecurityLockConfig>) => void;
  setNewPin: (newPin: string) => Promise<void>;
  isBiometricHardwareAvailable: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const generateUniqueId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

function ensureUniqueIds<T extends { id: string }>(items: T[] = [], prefix: string): T[] {
  const seen = new Set<string>();
  return items.map((item, idx) => {
    if (!item.id || seen.has(item.id)) {
      const newId = `${prefix}-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
      seen.add(newId);
      return { ...item, id: newId };
    }
    seen.add(item.id);
    return item;
  });
}

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<UserAccount | null>(() => getCurrentUser());
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);

  const initial = useMemo(() => {
    const raw = loadStoredData(currentUser?.id, currentUser?.name);
    return {
      ...raw,
      accounts: ensureUniqueIds(raw.accounts, 'acc'),
      categories: ensureUniqueIds(raw.categories, 'cat'),
      transactions: ensureUniqueIds(raw.transactions, 'tx'),
      checks: ensureUniqueIds(raw.checks, 'chk'),
      debts: ensureUniqueIds(raw.debts, 'dbt'),
      loans: ensureUniqueIds(raw.loans, 'loan'),
      goals: ensureUniqueIds(raw.goals, 'goal'),
      familyMembers: ensureUniqueIds(raw.familyMembers || [
        { id: 'head', name: currentUser?.name || 'کاربر گرامی', role: 'head', avatar: '👨', color: 'blue', isActive: true, createdAt: new Date().toISOString() }
      ], 'mem'),
      allowanceRequests: ensureUniqueIds(raw.allowanceRequests || [], 'req'),
      activeMemberId: raw.activeMemberId || 'head',
      highValueAlertThreshold: raw.highValueAlertThreshold || 1000000,
      highValueAlerts: ensureUniqueIds(raw.highValueAlerts || [], 'hva'),
    };
  }, [currentUser?.id]);

  const [accounts, setAccounts] = useState<Account[]>(initial.accounts);
  const [categories, setCategories] = useState<Category[]>(initial.categories);
  const [transactions, setTransactions] = useState<Transaction[]>(initial.transactions);
  const [checks, setChecks] = useState<CheckItem[]>(initial.checks);
  const [debts, setDebts] = useState<DebtItem[]>(initial.debts);
  const [loans, setLoans] = useState<LoanItem[]>(initial.loans);
  const [goals, setGoals] = useState<SavingGoal[]>(initial.goals);
  const [currency, setCurrencyState] = useState<CurrencyType>(initial.currency);
  const [language, setLanguageState] = useState<LanguageType>(initial.language);
  const [theme, setThemeState] = useState<ThemeMode>(initial.theme || 'light');
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // Real-time High Value Transaction Alerts for Head
  const [highValueAlertThreshold, setHighValueAlertThreshold] = useState<number>(initial.highValueAlertThreshold || 1000000);
  const [highValueAlerts, setHighValueAlerts] = useState<HighValueTransactionAlert[]>(initial.highValueAlerts || []);
  const [activeHighValueAlert, setActiveHighValueAlert] = useState<HighValueTransactionAlert | null>(null);

  // Family Hub & Routine Mode State
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(initial.familyMembers);
  const [activeMemberId, setActiveMemberId] = useState<string>(() => {
    const fromUrl = getMemberIdFromCurrentURL();
    return fromUrl || initial.activeMemberId || 'head';
  });
  const [allowanceRequests, setAllowanceRequests] = useState<FamilyAllowanceRequest[]>(initial.allowanceRequests);
  const [activeMemberRoutineTab, setActiveMemberRoutineTab] = useState<FamilyMemberRoutineTab>('entry');
  const [isProfileSwitcherOpen, setIsProfileSwitcherOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [memberAccessModalFor, setMemberAccessModalFor] = useState<FamilyMember | null>(null);

  const activeMember = useMemo<FamilyMember>(() => {
    const found = familyMembers.find(m => m.id === activeMemberId);
    if (found) return found;
    return familyMembers[0] || INITIAL_FAMILY_MEMBERS[0];
  }, [familyMembers, activeMemberId]);

  const isHeadOfFamily = activeMember.role === 'head' || activeMember.id === 'head';

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const [dismissedSmartBudgetAlertIds, setDismissedSmartBudgetAlertIds] = useState<string[]>([]);

  // Security & App Lock State
  const [securityConfig, setSecurityConfig] = useState<SecurityLockConfig>(() => loadSecurityConfig());
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const cfg = loadSecurityConfig();
    if (!cfg.isEnabled) return false;
    // autoLockMinutes <= 0 means manual lock only
    if (!cfg.autoLockMinutes || cfg.autoLockMinutes <= 0) return false;
    if (!cfg.lastUnlockedAt) return false;
    const elapsedMinutes = (Date.now() - cfg.lastUnlockedAt) / (1000 * 60);
    return elapsedMinutes >= cfg.autoLockMinutes;
  });
  const [isSecuritySettingsOpen, setIsSecuritySettingsOpen] = useState(false);
  const [isBiometricHardwareAvailable, setIsBiometricHardwareAvailable] = useState(false);

  // Check biometric support on mount
  useEffect(() => {
    isBiometricSupported().then(avail => {
      setIsBiometricHardwareAvailable(avail);
    });
  }, []);

  // Synchronize PIN hash with current user's password if not set
  useEffect(() => {
    if (currentUser?.passwordHash) {
      if (securityConfig.pinHash !== currentUser.passwordHash) {
        setSecurityConfig(prev => {
          const updated = { ...prev, pinHash: currentUser.passwordHash };
          saveSecurityConfig(updated);
          return updated;
        });
      }
    } else if (!securityConfig.pinHash && currentUser?.isDemo) {
      hashPin('1234').then(hashed => {
        setSecurityConfig(prev => {
          const updated = { ...prev, pinHash: hashed };
          saveSecurityConfig(updated);
          return updated;
        });
      });
    }
  }, [currentUser?.passwordHash, currentUser?.isDemo, securityConfig.pinHash]);

  const lockApp = () => {
    setIsLocked(true);
  };

  const unlockAppWithPin = async (pin: string): Promise<boolean> => {
    const inputHash = await hashPin(pin);
    const default1234Hash = await hashPin('1234');

    // Check against user registered password, custom pin, or demo fallback
    const matchesUserPassword = !!(currentUser?.passwordHash && inputHash === currentUser.passwordHash);
    const matchesSecurityPin = !!(securityConfig.pinHash && inputHash === securityConfig.pinHash);
    const matchesDemo = !!(currentUser?.isDemo && inputHash === default1234Hash);

    if (matchesUserPassword || matchesSecurityPin || matchesDemo) {
      setIsLocked(false);
      const updated = { ...securityConfig, lastUnlockedAt: Date.now() };
      setSecurityConfig(updated);
      saveSecurityConfig(updated);
      return true;
    }
    return false;
  };

  const unlockAppWithBiometric = async (): Promise<boolean> => {
    const verified = await authenticateBiometric();
    if (verified) {
      setIsLocked(false);
      const updated = { ...securityConfig, lastUnlockedAt: Date.now() };
      setSecurityConfig(updated);
      saveSecurityConfig(updated);
      return true;
    }
    return false;
  };

  const updateSecurityConfig = (patch: Partial<SecurityLockConfig>) => {
    setSecurityConfig(prev => {
      const updated = { ...prev, ...patch };
      saveSecurityConfig(updated);
      return updated;
    });
  };

  const setNewPin = async (newPin: string) => {
    const hashed = await hashPin(newPin);
    updateSecurityConfig({ pinHash: hashed });
  };

  // Auth Operations
  const setCurrentUser = (user: UserAccount | null) => {
    saveAuthUser(user);
    setCurrentUserState(user);
    // When logging in or registering, always unlock the session
    setIsLocked(false);
    if (user?.passwordHash) {
      updateSecurityConfig({
        pinHash: user.passwordHash,
        lastUnlockedAt: Date.now(),
      });
    }
    if (user) {
      const raw = loadStoredData(user.id, user.name);
      setAccounts(ensureUniqueIds(raw.accounts, 'acc'));
      setCategories(ensureUniqueIds(raw.categories, 'cat'));
      setTransactions(ensureUniqueIds(raw.transactions, 'tx'));
      setChecks(ensureUniqueIds(raw.checks, 'chk'));
      setDebts(ensureUniqueIds(raw.debts, 'dbt'));
      setLoans(ensureUniqueIds(raw.loans, 'loan'));
      setGoals(ensureUniqueIds(raw.goals, 'goal'));
      setFamilyMembers(ensureUniqueIds(raw.familyMembers && raw.familyMembers.length > 0 ? raw.familyMembers : [
        { id: 'head', name: user.name, role: 'head', avatar: '👨', color: 'blue', isActive: true, createdAt: new Date().toISOString() }
      ], 'mem'));
      setAllowanceRequests(ensureUniqueIds(raw.allowanceRequests || [], 'req'));
      setActiveMemberId(raw.activeMemberId || 'head');
      setCurrencyState(raw.currency || 'toman');
      setLanguageState(raw.language || 'fa');
    }
  };

  const logout = () => {
    logoutUser();
    setIsLocked(false);
    setCurrentUserState(null);
  };

  const loadDemoData = () => {
    setAccounts(ensureUniqueIds(INITIAL_ACCOUNTS, 'acc'));
    setCategories(ensureUniqueIds(INITIAL_CATEGORIES, 'cat'));
    setTransactions(ensureUniqueIds(INITIAL_TRANSACTIONS, 'tx'));
    setChecks(ensureUniqueIds(INITIAL_CHECKS, 'chk'));
    setDebts(ensureUniqueIds(INITIAL_DEBTS, 'dbt'));
    setLoans(ensureUniqueIds(INITIAL_LOANS, 'loan'));
    setGoals(ensureUniqueIds(INITIAL_GOALS, 'goal'));
    setFamilyMembers(ensureUniqueIds(INITIAL_FAMILY_MEMBERS, 'mem'));
    setAllowanceRequests(ensureUniqueIds(INITIAL_ALLOWANCE_REQUESTS, 'req'));
  };

  const clearUserData = () => {
    setAccounts([]);
    setTransactions([]);
    setChecks([]);
    setDebts([]);
    setLoans([]);
    setGoals([]);
    setAllowanceRequests([]);
    if (currentUser) {
      setFamilyMembers([{ id: 'head', name: currentUser.name, role: 'head', avatar: '👨', color: 'blue', isActive: true, createdAt: new Date().toISOString() }]);
    }
  };

  // Sync to local storage
  useEffect(() => {
    if (!currentUser) return;
    saveStateToStorage({
      accounts,
      categories,
      transactions,
      checks,
      debts,
      loans,
      goals,
      familyMembers,
      allowanceRequests,
      activeMemberId,
      highValueAlertThreshold,
      highValueAlerts,
      currency,
      language,
      theme,
    }, currentUser.id);
  }, [accounts, categories, transactions, checks, debts, loans, goals, familyMembers, allowanceRequests, activeMemberId, highValueAlertThreshold, highValueAlerts, currency, language, theme, currentUser?.id]);

  const checkAndTriggerHighValueAlert = (tx: Transaction) => {
    const effectiveThreshold = currency === 'rial' ? highValueAlertThreshold * 10 : highValueAlertThreshold;
    const isMemberTx = (tx.memberId && tx.memberId !== 'head') || (activeMemberId !== 'head');
    
    if (tx.type === 'expense' && tx.amount >= effectiveThreshold && isMemberTx) {
      const member = familyMembers.find(m => m.id === tx.memberId) || activeMember;
      const cat = categories.find(c => c.id === tx.categoryId);
      const acc = accounts.find(a => a.id === tx.accountId);
      
      const newAlert: HighValueTransactionAlert = {
        id: generateUniqueId('hva'),
        transactionId: tx.id,
        amount: tx.amount,
        threshold: highValueAlertThreshold,
        memberId: tx.memberId || member.id,
        memberName: tx.memberName || member.name,
        memberAvatar: member.avatar || '👤',
        categoryName: cat ? (language === 'fa' ? cat.name : cat.nameEn) : 'هزینه',
        accountName: acc?.name || 'حساب بانکی',
        date: tx.date,
        jalaliDate: tx.jalaliDate,
        description: tx.description || 'تراکنش با مبلغ بالا توسط عضو خانواده',
        timestamp: Date.now(),
        isRead: false,
      };

      setHighValueAlerts(prev => [newAlert, ...prev]);
      setActiveHighValueAlert(newAlert);
      playAlertChime();
    }
  };

  const dismissHighValueAlert = (alertId: string) => {
    setHighValueAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
    setActiveHighValueAlert(prev => prev?.id === alertId ? null : prev);
  };

  const clearAllHighValueAlerts = () => {
    setHighValueAlerts([]);
    setActiveHighValueAlert(null);
  };

  const triggerTestHighValueAlert = () => {
    const testMember = familyMembers.find(m => m.role !== 'head') || familyMembers[1] || familyMembers[0];
    const cat = categories[0];
    const acc = accounts[0];
    const mockAlert: HighValueTransactionAlert = {
      id: generateUniqueId('hva-test'),
      transactionId: generateUniqueId('tx-test'),
      amount: currency === 'rial' ? 15000000 : 1500000,
      threshold: highValueAlertThreshold,
      memberId: testMember.id,
      memberName: testMember.name,
      memberAvatar: testMember.avatar || '👤',
      categoryName: cat ? (language === 'fa' ? cat.name : cat.nameEn) : 'خرید روزمره',
      accountName: acc?.name || 'کارت شتاب',
      date: getTodayISO(),
      jalaliDate: getTodayJalali(),
      description: 'خرید ویژه پوشاک زمستانه و لوازم جانبی',
      timestamp: Date.now(),
      isRead: false,
    };
    setHighValueAlerts(prev => [mockAlert, ...prev]);
    setActiveHighValueAlert(mockAlert);
    playAlertChime();
  };

  // Real-time multi-tab and server synchronization
  useEffect(() => {
    const unsubscribe = listenToFamilyEvents(event => {
      if (event.type === 'TX_ADDED') {
        const tx = event.transaction;
        setTransactions(prev => {
          if (prev.some(t => t.id === tx.id)) return prev;
          return [tx, ...prev];
        });
        checkAndTriggerHighValueAlert(tx);
        // Update local balance
        setAccounts(prev => prev.map(acc => {
          if (tx.type === 'income' && acc.id === tx.accountId) {
            return { ...acc, balance: acc.balance + tx.amount };
          }
          if (tx.type === 'expense' && acc.id === tx.accountId) {
            return { ...acc, balance: acc.balance - tx.amount };
          }
          if (tx.type === 'transfer') {
            if (acc.id === tx.accountId) return { ...acc, balance: acc.balance - tx.amount };
            if (acc.id === tx.toAccountId) return { ...acc, balance: acc.balance + tx.amount };
          }
          return acc;
        }));
      } else if (event.type === 'REQUEST_SUBMITTED') {
        setAllowanceRequests(prev => {
          if (prev.some(r => r.id === event.request.id)) return prev;
          return [event.request, ...prev];
        });
      } else if (event.type === 'MEMBER_UPDATED') {
        setFamilyMembers(event.members);
      }
    });

    // Check URL parameters for direct member access
    const urlMemberId = getMemberIdFromCurrentURL();
    if (urlMemberId) {
      setActiveMemberId(urlMemberId);
    }

    // Periodic poll to server for multi-device sync
    const pollServer = async () => {
      const serverState = await fetchServerFamilyState();
      if (serverState) {
        if (serverState.transactions && serverState.transactions.length > 0) {
          setTransactions(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const newTxs = serverState.transactions!.filter(t => !existingIds.has(t.id));
            if (newTxs.length === 0) return prev;
            return [...newTxs, ...prev];
          });
        }
        if (serverState.requests && serverState.requests.length > 0) {
          setAllowanceRequests(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const newReqs = serverState.requests!.filter(r => !existingIds.has(r.id));
            if (newReqs.length === 0) return prev;
            return [...newReqs, ...prev];
          });
        }
      }
    };

    pollServer();
    const interval = setInterval(pollServer, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Real-time Cloud Database Firestore Synchronization
  useEffect(() => {
    if (!currentUser || currentUser.isDemo || currentUser.id === 'demo') {
      return;
    }

    validateFirestoreConnection().then(connected => {
      setIsFirestoreConnected(connected);
    });

    const unsubscribe = subscribeToUserFirestoreData(currentUser.id, {
      onAccountsUpdate: (remoteAccounts) => {
        if (remoteAccounts && remoteAccounts.length > 0) {
          setAccounts(remoteAccounts);
        }
      },
      onTransactionsUpdate: (remoteTxs) => {
        if (remoteTxs && remoteTxs.length > 0) {
          setTransactions(remoteTxs);
        }
      },
      onChecksUpdate: (remoteChecks) => {
        if (remoteChecks && remoteChecks.length > 0) {
          setChecks(remoteChecks);
        }
      },
      onLoansUpdate: (remoteLoans) => {
        if (remoteLoans && remoteLoans.length > 0) {
          setLoans(remoteLoans);
        }
      },
      onDebtsUpdate: (remoteDebts) => {
        if (remoteDebts && remoteDebts.length > 0) {
          setDebts(remoteDebts);
        }
      },
      onGoalsUpdate: (remoteGoals) => {
        if (remoteGoals && remoteGoals.length > 0) {
          setGoals(remoteGoals);
        }
      },
      onFamilyMembersUpdate: (remoteMembers) => {
        if (remoteMembers && remoteMembers.length > 0) {
          setFamilyMembers(remoteMembers);
        }
      },
      onCategoriesUpdate: (remoteCategories) => {
        if (remoteCategories && remoteCategories.length > 0) {
          setCategories(remoteCategories);
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id, currentUser?.isDemo]);

  // Sync dark class on document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Set document dir & lang
  useEffect(() => {
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const setCurrency = (c: CurrencyType) => setCurrencyState(c);
  const setLanguage = (l: LanguageType) => setLanguageState(l);
  const setTheme = (t: ThemeMode) => setThemeState(t);
  const toggleTheme = () => setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));

  const openTransactionModal = (tx?: Transaction) => {
    setEditingTransaction(tx || null);
    setIsTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(false);
  };

  // Account Handlers
  const addAccount = (acc: Omit<Account, 'id'>) => {
    const newAcc: Account = {
      ...acc,
      id: generateUniqueId('acc'),
    };
    setAccounts(prev => [newAcc, ...prev]);
    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreSaveAccount(currentUser.id, newAcc).catch(e => console.warn(e));
    }
  };

  const updateAccount = (id: string, updated: Partial<Account>) => {
    setAccounts(prev => prev.map(a => {
      if (a.id === id) {
        const merged = { ...a, ...updated };
        if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
          firestoreSaveAccount(currentUser.id, merged).catch(e => console.warn(e));
        }
        return merged;
      }
      return a;
    }));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreDeleteAccount(currentUser.id, id).catch(e => console.warn(e));
    }
  };

  const transferBetweenAccounts = (fromId: string, toId: string, amount: number, description?: string) => {
    if (fromId === toId || amount <= 0) return;

    // Deduct from source and add to destination
    setAccounts(prev => prev.map(acc => {
      if (acc.id === fromId) return { ...acc, balance: acc.balance - amount };
      if (acc.id === toId) return { ...acc, balance: acc.balance + amount };
      return acc;
    }));

    // Record transaction
    const newTx: Transaction = {
      id: generateUniqueId('tx'),
      type: 'transfer',
      amount,
      categoryId: 'cat-other-exp',
      accountId: fromId,
      toAccountId: toId,
      date: getTodayISO(),
      jalaliDate: getTodayJalali(),
      description: description || 'انتقال بین حساب‌ها',
    };
    setTransactions(prev => [newTx, ...prev]);
    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreSaveTransaction(currentUser.id, newTx).catch(e => console.warn(e));
    }
  };

  // Transaction Handlers
  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const member = familyMembers.find(m => m.id === (tx.memberId || activeMemberId)) || activeMember;
    const newTx: Transaction = {
      ...tx,
      id: generateUniqueId('tx'),
      memberId: tx.memberId || member.id,
      memberName: tx.memberName || member.name,
      memberRole: tx.memberRole || member.role,
    };

    // Update account balances
    setAccounts(prev => prev.map(acc => {
      if (tx.type === 'income' && acc.id === tx.accountId) {
        return { ...acc, balance: acc.balance + tx.amount };
      }
      if (tx.type === 'expense' && acc.id === tx.accountId) {
        return { ...acc, balance: acc.balance - tx.amount };
      }
      if (tx.type === 'transfer') {
        if (acc.id === tx.accountId) return { ...acc, balance: acc.balance - tx.amount };
        if (acc.id === tx.toAccountId) return { ...acc, balance: acc.balance + tx.amount };
      }
      return acc;
    }));

    setTransactions(prev => [newTx, ...prev]);

    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreSaveTransaction(currentUser.id, newTx).catch(e => console.warn(e));
    }

    // Check for high-value alert
    checkAndTriggerHighValueAlert(newTx);

    // Live broadcast to other tabs & sync with remote server
    broadcastFamilyEvent({ type: 'TX_ADDED', transaction: newTx });
    syncTransactionWithServer(newTx);
  };

  const updateTransaction = (id: string, updated: Partial<Transaction>) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    // Revert old transaction from accounts
    setAccounts(prev => prev.map(acc => {
      let balance = acc.balance;
      if (oldTx.type === 'income' && acc.id === oldTx.accountId) balance -= oldTx.amount;
      if (oldTx.type === 'expense' && acc.id === oldTx.accountId) balance += oldTx.amount;
      if (oldTx.type === 'transfer') {
        if (acc.id === oldTx.accountId) balance += oldTx.amount;
        if (acc.id === oldTx.toAccountId) balance -= oldTx.amount;
      }
      return { ...acc, balance };
    }));

    const merged = { ...oldTx, ...updated };

    // Apply new transaction balance
    setAccounts(prev => prev.map(acc => {
      let balance = acc.balance;
      if (merged.type === 'income' && acc.id === merged.accountId) balance += merged.amount;
      if (merged.type === 'expense' && acc.id === merged.accountId) balance -= merged.amount;
      if (merged.type === 'transfer') {
        if (acc.id === merged.accountId) balance -= merged.amount;
        if (acc.id === merged.toAccountId) balance += merged.amount;
      }
      return { ...acc, balance };
    }));

    setTransactions(prev => prev.map(t => t.id === id ? merged : t));
    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreSaveTransaction(currentUser.id, merged).catch(e => console.warn(e));
    }
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // Revert account balance
    setAccounts(prev => prev.map(acc => {
      if (tx.type === 'income' && acc.id === tx.accountId) return { ...acc, balance: acc.balance - tx.amount };
      if (tx.type === 'expense' && acc.id === tx.accountId) return { ...acc, balance: acc.balance + tx.amount };
      if (tx.type === 'transfer') {
        if (acc.id === tx.accountId) return { ...acc, balance: acc.balance + tx.amount };
        if (acc.id === tx.toAccountId) return { ...acc, balance: acc.balance - tx.amount };
      }
      return acc;
    }));

    setTransactions(prev => prev.filter(t => t.id !== id));
    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreDeleteTransaction(currentUser.id, id).catch(e => console.warn(e));
    }
  };

  // Check Handlers
  const addCheck = (check: Omit<CheckItem, 'id'>) => {
    const newCheck: CheckItem = {
      ...check,
      id: generateUniqueId('chk'),
    };
    setChecks(prev => [newCheck, ...prev]);
    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreSaveCheck(currentUser.id, newCheck).catch(e => console.warn(e));
    }
  };

  const updateCheckStatus = (id: string, status: CheckStatus) => {
    setChecks(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, status };
        if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
          firestoreSaveCheck(currentUser.id, updated).catch(e => console.warn(e));
        }
        // If status changes to cleared and wasn't before, optionally record transaction
        if (status === 'cleared' && c.status !== 'cleared') {
          if (c.type === 'issued' && c.accountId) {
            addTransaction({
              type: 'expense',
              amount: c.amount,
              categoryId: 'cat-installment',
              accountId: c.accountId,
              date: getTodayISO(),
              jalaliDate: getTodayJalali(),
              description: `وصول چک صادره #${c.checkNumber} به ${c.recipientOrPayer}`,
            });
          } else if (c.type === 'received' && c.accountId) {
            addTransaction({
              type: 'income',
              amount: c.amount,
              categoryId: 'cat-other-inc',
              accountId: c.accountId,
              date: getTodayISO(),
              jalaliDate: getTodayJalali(),
              description: `وصول چک دریافتی #${c.checkNumber} از ${c.recipientOrPayer}`,
            });
          }
        }
        return updated;
      }
      return c;
    }));
  };

  const deleteCheck = (id: string) => {
    setChecks(prev => prev.filter(c => c.id !== id));
    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreDeleteCheck(currentUser.id, id).catch(e => console.warn(e));
    }
  };

  // Debt Handlers
  const addDebt = (debt: Omit<DebtItem, 'id' | 'createdAt'>) => {
    const newDebt: DebtItem = {
      ...debt,
      id: generateUniqueId('dbt'),
      createdAt: getTodayISO(),
    };
    setDebts(prev => [newDebt, ...prev]);
    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreSaveDebt(currentUser.id, newDebt).catch(e => console.warn(e));
    }
  };

  const recordDebtPayment = (id: string, paymentAmount: number) => {
    setDebts(prev => prev.map(d => {
      if (d.id === id) {
        const newPaid = Math.min(d.totalAmount, d.paidAmount + paymentAmount);
        const updated = {
          ...d,
          paidAmount: newPaid,
          isSettled: newPaid >= d.totalAmount,
        };
        if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
          firestoreSaveDebt(currentUser.id, updated).catch(e => console.warn(e));
        }
        return updated;
      }
      return d;
    }));
  };

  const deleteDebt = (id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id));
    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreDeleteDebt(currentUser.id, id).catch(e => console.warn(e));
    }
  };

  // Loan Handlers
  const addLoan = (loan: Omit<LoanItem, 'id'>) => {
    const newLoan: LoanItem = {
      ...loan,
      id: generateUniqueId('loan'),
    };
    setLoans(prev => [newLoan, ...prev]);
    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreSaveLoan(currentUser.id, newLoan).catch(e => console.warn(e));
    }
  };

  const payLoanInstallment = (id: string) => {
    const loan = loans.find(l => l.id === id);
    if (!loan || loan.paidInstallments >= loan.totalInstallments) return;

    const updatedPaid = loan.paidInstallments + 1;
    const updatedLoan = { ...loan, paidInstallments: updatedPaid };
    setLoans(prev => prev.map(l => l.id === id ? updatedLoan : l));
    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreSaveLoan(currentUser.id, updatedLoan).catch(e => console.warn(e));
    }

    // Record transaction
    if (loan.accountId) {
      addTransaction({
        type: 'expense',
        amount: loan.monthlyPayment,
        categoryId: 'cat-installment',
        accountId: loan.accountId,
        date: getTodayISO(),
        jalaliDate: getTodayJalali(),
        description: `پرداخت قسط ${updatedPaid}/${loan.totalInstallments} ${loan.title}`,
      });
    }
  };

  const deleteLoan = (id: string) => {
    setLoans(prev => prev.filter(l => l.id !== id));
    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreDeleteLoan(currentUser.id, id).catch(e => console.warn(e));
    }
  };

  // Goals Handlers
  const addGoal = (goal: Omit<SavingGoal, 'id'>) => {
    const newGoal: SavingGoal = {
      ...goal,
      id: generateUniqueId('goal'),
    };
    setGoals(prev => [newGoal, ...prev]);
    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreSaveGoal(currentUser.id, newGoal).catch(e => console.warn(e));
    }
  };

  const addFundsToGoal = (id: string, amount: number, sourceAccountId?: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        const updated = {
          ...g,
          currentAmount: Math.min(g.targetAmount, g.currentAmount + amount),
        };
        if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
          firestoreSaveGoal(currentUser.id, updated).catch(e => console.warn(e));
        }
        return updated;
      }
      return g;
    }));

    if (sourceAccountId) {
      setAccounts(prev => prev.map(a => a.id === sourceAccountId ? { ...a, balance: a.balance - amount } : a));
    }
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreDeleteGoal(currentUser.id, id).catch(e => console.warn(e));
    }
  };

  // Category & Budget Handlers
  const updateCategoryBudget = (categoryId: string, monthlyLimit: number) => {
    setCategories(prev => {
      const next = prev.map(c => c.id === categoryId ? { ...c, budgetMonthly: monthlyLimit } : c);
      const target = next.find(c => c.id === categoryId);
      if (target && currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
        firestoreSaveCategory(currentUser.id, target).catch(e => console.warn(e));
      }
      return next;
    });
  };

  const updateCategory = (categoryId: string, updated: Partial<Category>) => {
    setCategories(prev => {
      const next = prev.map(c => c.id === categoryId ? { ...c, ...updated } : c);
      const target = next.find(c => c.id === categoryId);
      if (target && currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
        firestoreSaveCategory(currentUser.id, target).catch(e => console.warn(e));
      }
      return next;
    });
  };

  const resetToSampleData = () => {
    setAccounts(ensureUniqueIds(INITIAL_ACCOUNTS, 'acc'));
    setCategories(ensureUniqueIds(INITIAL_CATEGORIES, 'cat'));
    setTransactions(ensureUniqueIds(INITIAL_TRANSACTIONS, 'tx'));
    setChecks(ensureUniqueIds(INITIAL_CHECKS, 'chk'));
    setDebts(ensureUniqueIds(INITIAL_DEBTS, 'dbt'));
    setLoans(ensureUniqueIds(INITIAL_LOANS, 'loan'));
    setGoals(ensureUniqueIds(INITIAL_GOALS, 'goal'));
    setFamilyMembers(ensureUniqueIds(INITIAL_FAMILY_MEMBERS, 'mem'));
    setAllowanceRequests(INITIAL_ALLOWANCE_REQUESTS);
    setActiveMemberId('head');
    setCurrencyState('toman');
  };

  const importBackupData = (data: AppStateData) => {
    if (data.accounts) setAccounts(ensureUniqueIds(data.accounts, 'acc'));
    if (data.categories) setCategories(ensureUniqueIds(data.categories, 'cat'));
    if (data.transactions) setTransactions(ensureUniqueIds(data.transactions, 'tx'));
    if (data.checks) setChecks(ensureUniqueIds(data.checks, 'chk'));
    if (data.debts) setDebts(ensureUniqueIds(data.debts, 'dbt'));
    if (data.loans) setLoans(ensureUniqueIds(data.loans, 'loan'));
    if (data.goals) setGoals(ensureUniqueIds(data.goals, 'goal'));
    if (data.familyMembers) setFamilyMembers(ensureUniqueIds(data.familyMembers, 'mem'));
    if (data.allowanceRequests) setAllowanceRequests(data.allowanceRequests);
    if (data.currency) setCurrencyState(data.currency);
    if (data.language) setLanguageState(data.language);
  };

  // Family Handlers
  const addFamilyMember = (member: Omit<FamilyMember, 'id' | 'createdAt'>) => {
    const newMember: FamilyMember = {
      ...member,
      id: generateUniqueId('mem'),
      createdAt: getTodayISO(),
    };
    const nextMembers = [...familyMembers, newMember];
    setFamilyMembers(nextMembers);
    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreSaveFamilyMember(currentUser.id, newMember).catch(e => console.warn(e));
    }
    broadcastFamilyEvent({ type: 'MEMBER_UPDATED', members: nextMembers });
  };

  const updateFamilyMember = (id: string, updated: Partial<FamilyMember>) => {
    const nextMembers = familyMembers.map(m => {
      if (m.id === id) {
        const merged = { ...m, ...updated };
        if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
          firestoreSaveFamilyMember(currentUser.id, merged).catch(e => console.warn(e));
        }
        return merged;
      }
      return m;
    });
    setFamilyMembers(nextMembers);
    broadcastFamilyEvent({ type: 'MEMBER_UPDATED', members: nextMembers });
  };

  const deleteFamilyMember = (id: string) => {
    if (id === 'head') return; // Cannot delete primary head of family
    const nextMembers = familyMembers.filter(m => m.id !== id);
    setFamilyMembers(nextMembers);
    if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
      firestoreDeleteFamilyMember(currentUser.id, id).catch(e => console.warn(e));
    }
    broadcastFamilyEvent({ type: 'MEMBER_UPDATED', members: nextMembers });
    if (activeMemberId === id) {
      setActiveMemberId('head');
    }
  };

  const switchMemberProfile = (memberId: string, pinAttempt?: string): { success: boolean; error?: string } => {
    const target = familyMembers.find(m => m.id === memberId);
    if (!target) return { success: false, error: 'عضو مورد نظر در خانواده یافت نشد' };

    if (target.role === 'head' || target.id === 'head') {
      return exitToHeadProfile(pinAttempt);
    }

    if (target.pin && pinAttempt !== undefined && pinAttempt.trim() !== target.pin.trim()) {
      return { success: false, error: 'رمز عبور وارد شده برای این عضو اشتباه است' };
    }

    setActiveMemberId(memberId);
    setActiveMemberRoutineTab('entry');
    return { success: true };
  };

  const exitToHeadProfile = (headPinAttempt?: string): { success: boolean; error?: string } => {
    if (securityConfig.isEnabled && securityConfig.pinHash) {
      if (!headPinAttempt) {
        return { success: false, error: 'لطفاً رمز عبور امنیتی سرپرست را وارد فرمایید' };
      }
    }
    setActiveMemberId('head');
    setActiveTab('dashboard');
    return { success: true };
  };

  const openUserProfile = () => {
    setIsUserProfileModalOpen(true);
  };

  const updateUserProfile = async (updates: Partial<{ name: string; avatar: string; phone?: string }>): Promise<boolean> => {
    try {
      const current = currentUser || DEMO_USER;
      const updatedUser = updateUserAccountProfile(current.id, updates);
      if (updatedUser) {
        setCurrentUserState(updatedUser);
      } else if (currentUser) {
        setCurrentUserState({ ...currentUser, ...updates });
      }

      // Sync with active / head member in family list
      setFamilyMembers(prev => prev.map(m => {
        if (m.id === activeMemberId || m.id === 'head' || (m.role === 'head' && isHeadOfFamily)) {
          const next = {
            ...m,
            name: updates.name || m.name,
            avatar: updates.avatar || m.avatar,
            phone: updates.phone !== undefined ? updates.phone : m.phone,
          };
          if (currentUser?.id && !currentUser.isDemo && currentUser.id !== 'demo') {
            firestoreSaveFamilyMember(currentUser.id, next).catch(e => console.warn(e));
          }
          return next;
        }
        return m;
      }));

      return true;
    } catch (err) {
      console.error('Failed to update user profile in context:', err);
      return false;
    }
  };

  const submitAllowanceRequest = (amount: number, reason: string) => {
    if (amount <= 0) return;
    const newReq: FamilyAllowanceRequest = {
      id: generateUniqueId('req'),
      memberId: activeMember.id,
      memberName: activeMember.name,
      memberAvatar: activeMember.avatar,
      amount,
      reason: reason || 'درخواست وجه یا پول توجیبی',
      date: getTodayISO(),
      jalaliDate: getTodayJalali(),
      status: 'pending',
    };
    setAllowanceRequests(prev => [newReq, ...prev]);
    broadcastFamilyEvent({ type: 'REQUEST_SUBMITTED', request: newReq });
    syncRequestWithServer(newReq);
  };

  const approveAllowanceRequest = (requestId: string, sourceAccountId: string) => {
    const req = allowanceRequests.find(r => r.id === requestId);
    if (!req) return;

    // Deduct from head account
    setAccounts(prev => prev.map(a => a.id === sourceAccountId ? { ...a, balance: a.balance - req.amount } : a));

    // Register transaction on ledger
    const targetMember = familyMembers.find(m => m.id === req.memberId);
    const newTx: Transaction = {
      id: generateUniqueId('tx'),
      type: 'expense',
      amount: req.amount,
      categoryId: 'cat-allowance',
      accountId: sourceAccountId,
      date: getTodayISO(),
      jalaliDate: getTodayJalali(),
      description: `واریز پول توجیبی / شارژ حساب برای ${req.memberName}: ${req.reason}`,
      memberId: req.memberId,
      memberName: req.memberName,
      memberRole: targetMember?.role || 'child',
    };
    setTransactions(prev => [newTx, ...prev]);

    setAllowanceRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      status: 'approved',
      resolvedAt: getTodayISO(),
      sourceAccountId,
    } : r));

    broadcastFamilyEvent({ type: 'TX_ADDED', transaction: newTx });
    syncTransactionWithServer(newTx);
  };

  const rejectAllowanceRequest = (requestId: string) => {
    setAllowanceRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      status: 'rejected',
      resolvedAt: getTodayISO(),
    } : r));
  };

  const memberSpendingStats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    return familyMembers.map(member => {
      let spent = 0;
      let count = 0;

      transactions.forEach(t => {
        const isThisMember = (member.role === 'head' && (!t.memberId || t.memberId === 'head')) ||
                             t.memberId === member.id;
        if (isThisMember) {
          count++;
          const d = new Date(t.date);
          if (d >= thirtyDaysAgo && t.type === 'expense') {
            spent += t.amount;
          }
        }
      });

      const allowance = member.monthlyAllowance || 0;
      const allowancePercent = allowance > 0 ? Math.round((spent / allowance) * 100) : 0;

      return {
        memberId: member.id,
        memberName: member.name,
        memberRole: member.role,
        avatar: member.avatar,
        color: member.color,
        totalSpentThisMonth: spent,
        transactionCount: count,
        allowance,
        allowancePercent,
      };
    });
  }, [familyMembers, transactions]);

  // Computations
  const totalNetWorth = useMemo(() => {
    return accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
  }, [accounts]);

  const { monthlyIncome, monthlyExpense, monthlySavings } = useMemo(() => {
    // Current month transactions (e.g. within last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    let inc = 0;
    let exp = 0;

    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d >= thirtyDaysAgo) {
        if (t.type === 'income') inc += t.amount;
        if (t.type === 'expense') exp += t.amount;
      }
    });

    return {
      monthlyIncome: inc,
      monthlyExpense: exp,
      monthlySavings: inc - exp,
    };
  }, [transactions]);

  const { pendingIssuedChecks, pendingReceivedChecks } = useMemo(() => {
    let issued = 0;
    let received = 0;
    checks.forEach(c => {
      if (c.status === 'pending') {
        if (c.type === 'issued') issued += c.amount;
        if (c.type === 'received') received += c.amount;
      }
    });
    return { pendingIssuedChecks: issued, pendingReceivedChecks: received };
  }, [checks]);

  const { totalDebtsOwed, totalReceivablesOwed } = useMemo(() => {
    let debt = 0;
    let rec = 0;
    debts.forEach(d => {
      const remaining = Math.max(0, d.totalAmount - d.paidAmount);
      if (!d.isSettled) {
        if (d.type === 'debt') debt += remaining;
        if (d.type === 'receivable') rec += remaining;
      }
    });
    return { totalDebtsOwed: debt, totalReceivablesOwed: rec };
  }, [debts]);

  const financialHealthScore = useMemo(() => {
    // Score based on: savings rate (40%), liquidity vs debts (30%), budget discipline (30%)
    const savingsRatio = monthlyIncome > 0 ? Math.max(0, (monthlyIncome - monthlyExpense) / monthlyIncome) : 0;
    const debtRatio = totalNetWorth > 0 ? Math.min(1, totalDebtsOwed / totalNetWorth) : 0.5;
    
    let score = Math.round(
      (savingsRatio * 45) + 
      ((1 - debtRatio) * 35) + 
      (totalNetWorth > 10000000 ? 20 : 10)
    );
    return Math.min(99, Math.max(15, score));
  }, [monthlyIncome, monthlyExpense, totalNetWorth, totalDebtsOwed]);

  // Category Budget Alerts (categories approaching >=80% or exceeded >=100% of budget)
  const budgetAlerts = useMemo<BudgetAlert[]>(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const spentMap = new Map<string, number>();
    transactions.forEach(t => {
      if (t.type === 'expense') {
        const d = new Date(t.date);
        if (d >= thirtyDaysAgo) {
          spentMap.set(t.categoryId, (spentMap.get(t.categoryId) || 0) + t.amount);
        }
      }
    });

    const alerts: BudgetAlert[] = [];
    categories.forEach(cat => {
      if (cat.type === 'expense' && cat.budgetMonthly && cat.budgetMonthly > 0) {
        const spent = spentMap.get(cat.id) || 0;
        const limit = cat.budgetMonthly;
        const pct = Math.round((spent / limit) * 100);

        // Alert when approaching (>= 80%) or exceeding (>= 100%)
        if (pct >= 80) {
          alerts.push({
            categoryId: cat.id,
            categoryName: cat.name,
            categoryNameEn: cat.nameEn,
            icon: cat.icon,
            color: cat.color,
            limit,
            spent,
            percentage: pct,
            remaining: Math.max(0, limit - spent),
            isOver: spent >= limit,
            isApproaching: pct >= 80 && spent < limit,
          });
        }
      }
    });

    return alerts.sort((a, b) => b.percentage - a.percentage);
  }, [categories, transactions]);

  // Proactive Smart Budget Projection Alerts (analyzes run-rate & warns head before month ends)
  const allSmartBudgetAlerts = useMemo<SmartBudgetProjectionAlert[]>(() => {
    return analyzeSmartBudgetProjections(categories, transactions, currency);
  }, [categories, transactions, currency]);

  const smartBudgetAlerts = useMemo<SmartBudgetProjectionAlert[]>(() => {
    return allSmartBudgetAlerts.filter(a => !dismissedSmartBudgetAlertIds.includes(a.id));
  }, [allSmartBudgetAlerts, dismissedSmartBudgetAlertIds]);

  const dismissSmartBudgetAlert = (id: string) => {
    setDismissedSmartBudgetAlertIds(prev => [...prev, id]);
  };

  // Prioritized Notifications & Due Date Reminders
  const notifications = useMemo(() => {
    return generatePrioritizedNotifications(checks, loans, debts, currency, categories, transactions);
  }, [checks, loans, debts, currency, categories, transactions]);

  const activeNotifications = useMemo(() => {
    return notifications.filter(n => !dismissedNotificationIds.includes(n.id));
  }, [notifications, dismissedNotificationIds]);

  const dismissNotification = (id: string) => {
    setDismissedNotificationIds(prev => [...prev, id]);
  };

  const criticalNotificationsCount = useMemo(() => {
    return activeNotifications.filter(n => n.priority === 'critical' || n.priority === 'urgent').length;
  }, [activeNotifications]);

  const unreadNotificationsCount = activeNotifications.length;

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        categories,
        transactions,
        checks,
        debts,
        loans,
        goals,
        currency,
        language,
        theme,
        activeTab,
        // Family Hub & Routine Mode
        familyMembers,
        activeMemberId,
        activeMember,
        isHeadOfFamily,
        allowanceRequests,
        activeMemberRoutineTab,
        setActiveMemberRoutineTab,
        setActiveMemberId,
        addFamilyMember,
        updateFamilyMember,
        deleteFamilyMember,
        switchMemberProfile,
        exitToHeadProfile,
        submitAllowanceRequest,
        approveAllowanceRequest,
        rejectAllowanceRequest,
        isProfileSwitcherOpen,
        setIsProfileSwitcherOpen,
        isUserProfileModalOpen,
        setIsUserProfileModalOpen,
        openUserProfile,
        updateUserProfile,
        memberAccessModalFor,
        setMemberAccessModalFor,
        memberSpendingStats,
        // Modals & UI State
        isTransactionModalOpen,
        editingTransaction,
        openTransactionModal,
        openAddTransactionModal: openTransactionModal,
        closeTransactionModal,
        highValueAlertThreshold,
        setHighValueAlertThreshold,
        highValueAlerts,
        activeHighValueAlert,
        dismissHighValueAlert,
        clearAllHighValueAlerts,
        triggerTestHighValueAlert,
        currentUser,
        isFirestoreConnected,
        setCurrentUser,
        logout,
        loadDemoData,
        clearUserData,
        setCurrency,
        setLanguage,
        setTheme,
        toggleTheme,
        setActiveTab,
        addAccount,
        updateAccount,
        deleteAccount,
        transferBetweenAccounts,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCheck,
        updateCheckStatus,
        deleteCheck,
        addDebt,
        recordDebtPayment,
        deleteDebt,
        addLoan,
        payLoanInstallment,
        deleteLoan,
        addGoal,
        addFundsToGoal,
        deleteGoal,
        updateCategoryBudget,
        updateCategory,
        resetToSampleData,
        importBackupData,
        totalNetWorth,
        monthlyIncome,
        monthlyExpense,
        monthlySavings,
        pendingIssuedChecks,
        pendingReceivedChecks,
        totalDebtsOwed,
        totalReceivablesOwed,
        financialHealthScore,
        budgetAlerts,
        smartBudgetAlerts,
        dismissSmartBudgetAlert,
        notifications,
        activeNotifications,
        dismissNotification,
        criticalNotificationsCount,
        unreadNotificationsCount,
        securityConfig,
        isLocked,
        isSecuritySettingsOpen,
        setIsSecuritySettingsOpen,
        lockApp,
        unlockAppWithPin,
        unlockAppWithBiometric,
        updateSecurityConfig,
        setNewPin,
        isBiometricHardwareAvailable,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
