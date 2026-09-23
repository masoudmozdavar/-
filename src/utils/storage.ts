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
  ThemeMode,
  FamilyMember,
  FamilyAllowanceRequest
} from '../types';
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
} from './initialData';

export function getUserStorageKeys(userId?: string) {
  const prefix = (userId && userId !== 'demo') ? `jibino_${userId}_` : 'smart_finance_';
  return {
    ACCOUNTS: `${prefix}accounts_v1`,
    CATEGORIES: `${prefix}categories_v1`,
    TRANSACTIONS: `${prefix}transactions_v1`,
    CHECKS: `${prefix}checks_v1`,
    DEBTS: `${prefix}debts_v1`,
    LOANS: `${prefix}loans_v1`,
    GOALS: `${prefix}goals_v1`,
    CURRENCY: `${prefix}currency_v1`,
    LANGUAGE: `${prefix}language_v1`,
    THEME: `${prefix}theme_v1`,
    FAMILY_MEMBERS: `${prefix}family_members_v1`,
    FAMILY_REQUESTS: `${prefix}family_requests_v1`,
    ACTIVE_MEMBER_ID: `${prefix}active_member_id_v1`,
    HIGH_VALUE_THRESHOLD: `${prefix}high_value_threshold_v1`,
    HIGH_VALUE_ALERTS: `${prefix}high_value_alerts_v1`,
  };
}

export interface AppStateData {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  checks: CheckItem[];
  debts: DebtItem[];
  loans: LoanItem[];
  goals: SavingGoal[];
  familyMembers?: FamilyMember[];
  allowanceRequests?: FamilyAllowanceRequest[];
  activeMemberId?: string;
  highValueAlertThreshold?: number;
  highValueAlerts?: any[];
  currency: CurrencyType;
  language: LanguageType;
  theme?: ThemeMode;
}

export function loadStoredData(userId?: string, userName?: string): AppStateData & { theme: ThemeMode } {
  const keys = getUserStorageKeys(userId);
  const isRealRegisteredUser = !!(userId && userId !== 'demo');

  try {
    const accounts = localStorage.getItem(keys.ACCOUNTS);
    const categories = localStorage.getItem(keys.CATEGORIES);
    const transactions = localStorage.getItem(keys.TRANSACTIONS);
    const checks = localStorage.getItem(keys.CHECKS);
    const debts = localStorage.getItem(keys.DEBTS);
    const loans = localStorage.getItem(keys.LOANS);
    const goals = localStorage.getItem(keys.GOALS);
    const familyMembers = localStorage.getItem(keys.FAMILY_MEMBERS);
    const allowanceRequests = localStorage.getItem(keys.FAMILY_REQUESTS);
    const activeMemberId = localStorage.getItem(keys.ACTIVE_MEMBER_ID) || 'head';
    const rawThreshold = localStorage.getItem(keys.HIGH_VALUE_THRESHOLD);
    const highValueAlertThreshold = rawThreshold ? Number(rawThreshold) : 1000000; // 1,000,000 Tomans
    const rawAlerts = localStorage.getItem(keys.HIGH_VALUE_ALERTS);
    const highValueAlerts = rawAlerts ? JSON.parse(rawAlerts) : [];
    const currency = (localStorage.getItem(keys.CURRENCY) as CurrencyType) || 'toman';
    const language = (localStorage.getItem(keys.LANGUAGE) as LanguageType) || 'fa';
    const storedTheme = localStorage.getItem(keys.THEME) as ThemeMode;
    const theme: ThemeMode = storedTheme === 'dark' || storedTheme === 'light' 
      ? storedTheme 
      : (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    // If it's a real registered user, give them a CLEAN workspace with zero demo data
    if (isRealRegisteredUser) {
      const cleanHeadMember: FamilyMember = {
        id: 'head',
        name: userName || 'کاربر گرامی',
        role: 'head',
        avatar: '👨',
        color: 'blue',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      return {
        accounts: accounts ? JSON.parse(accounts) : [],
        categories: categories ? JSON.parse(categories) : INITIAL_CATEGORIES,
        transactions: transactions ? JSON.parse(transactions) : [],
        checks: checks ? JSON.parse(checks) : [],
        debts: debts ? JSON.parse(debts) : [],
        loans: loans ? JSON.parse(loans) : [],
        goals: goals ? JSON.parse(goals) : [],
        familyMembers: familyMembers ? JSON.parse(familyMembers) : [cleanHeadMember],
        allowanceRequests: allowanceRequests ? JSON.parse(allowanceRequests) : [],
        activeMemberId,
        highValueAlertThreshold,
        highValueAlerts,
        currency,
        language,
        theme,
      };
    }

    return {
      accounts: accounts ? JSON.parse(accounts) : INITIAL_ACCOUNTS,
      categories: categories ? JSON.parse(categories) : INITIAL_CATEGORIES,
      transactions: transactions ? JSON.parse(transactions) : INITIAL_TRANSACTIONS,
      checks: checks ? JSON.parse(checks) : INITIAL_CHECKS,
      debts: debts ? JSON.parse(debts) : INITIAL_DEBTS,
      loans: loans ? JSON.parse(loans) : INITIAL_LOANS,
      goals: goals ? JSON.parse(goals) : INITIAL_GOALS,
      familyMembers: familyMembers ? JSON.parse(familyMembers) : INITIAL_FAMILY_MEMBERS,
      allowanceRequests: allowanceRequests ? JSON.parse(allowanceRequests) : INITIAL_ALLOWANCE_REQUESTS,
      activeMemberId,
      highValueAlertThreshold,
      highValueAlerts,
      currency,
      language,
      theme,
    };
  } catch (error) {
    console.error('Failed to load local storage data', error);
    return {
      accounts: isRealRegisteredUser ? [] : INITIAL_ACCOUNTS,
      categories: INITIAL_CATEGORIES,
      transactions: isRealRegisteredUser ? [] : INITIAL_TRANSACTIONS,
      checks: isRealRegisteredUser ? [] : INITIAL_CHECKS,
      debts: isRealRegisteredUser ? [] : INITIAL_DEBTS,
      loans: isRealRegisteredUser ? [] : INITIAL_LOANS,
      goals: isRealRegisteredUser ? [] : INITIAL_GOALS,
      familyMembers: isRealRegisteredUser 
        ? [{ id: 'head', name: userName || 'کاربر گرامی', role: 'head', avatar: '👨', color: 'blue', isActive: true, createdAt: new Date().toISOString() }]
        : INITIAL_FAMILY_MEMBERS,
      allowanceRequests: [],
      activeMemberId: 'head',
      highValueAlertThreshold: 1000000,
      highValueAlerts: [],
      currency: 'toman',
      language: 'fa',
      theme: 'light',
    };
  }
}

export function saveStateToStorage(data: Partial<AppStateData>, userId?: string): void {
  const keys = getUserStorageKeys(userId);
  try {
    if (data.accounts !== undefined) localStorage.setItem(keys.ACCOUNTS, JSON.stringify(data.accounts));
    if (data.categories !== undefined) localStorage.setItem(keys.CATEGORIES, JSON.stringify(data.categories));
    if (data.transactions !== undefined) localStorage.setItem(keys.TRANSACTIONS, JSON.stringify(data.transactions));
    if (data.checks !== undefined) localStorage.setItem(keys.CHECKS, JSON.stringify(data.checks));
    if (data.debts !== undefined) localStorage.setItem(keys.DEBTS, JSON.stringify(data.debts));
    if (data.loans !== undefined) localStorage.setItem(keys.LOANS, JSON.stringify(data.loans));
    if (data.goals !== undefined) localStorage.setItem(keys.GOALS, JSON.stringify(data.goals));
    if (data.familyMembers !== undefined) localStorage.setItem(keys.FAMILY_MEMBERS, JSON.stringify(data.familyMembers));
    if (data.allowanceRequests !== undefined) localStorage.setItem(keys.FAMILY_REQUESTS, JSON.stringify(data.allowanceRequests));
    if (data.activeMemberId !== undefined) localStorage.setItem(keys.ACTIVE_MEMBER_ID, data.activeMemberId);
    if (data.highValueAlertThreshold !== undefined) localStorage.setItem(keys.HIGH_VALUE_THRESHOLD, String(data.highValueAlertThreshold));
    if (data.highValueAlerts !== undefined) localStorage.setItem(keys.HIGH_VALUE_ALERTS, JSON.stringify(data.highValueAlerts));
    if (data.currency) localStorage.setItem(keys.CURRENCY, data.currency);
    if (data.language) localStorage.setItem(keys.LANGUAGE, data.language);
    if (data.theme) localStorage.setItem(keys.THEME, data.theme);
  } catch (e) {
    console.error('Error saving state to localStorage', e);
  }
}

export function exportBackupJSON(state: AppStateData): void {
  const exportPayload = {
    version: '2.0.0',
    exportDate: new Date().toISOString(),
    appName: 'Smart Finance Hub',
    data: state,
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finance_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTransactionsCSV(
  transactions: Transaction[], 
  categories: Category[], 
  accounts: Account[]
): void {
  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const accMap = new Map(accounts.map(a => [a.id, a.name]));

  const headers = ['شناسه', 'نوع', 'مبلغ (تومان)', 'دسته‌بندی', 'حساب مبدا', 'حساب مقصد', 'تاریخ شمسی', 'تاریخ میلادی', 'توضیحات'];
  
  const rows = transactions.map(t => {
    const typeLabel = t.type === 'income' ? 'درآمد' : t.type === 'expense' ? 'هزینه' : 'انتقال';
    const catName = catMap.get(t.categoryId) || 'نامشخص';
    const accName = accMap.get(t.accountId) || 'نامشخص';
    const toAccName = t.toAccountId ? (accMap.get(t.toAccountId) || '') : '';
    
    return [
      `"${t.id}"`,
      `"${typeLabel}"`,
      `"${t.amount}"`,
      `"${catName}"`,
      `"${accName}"`,
      `"${toAccName}"`,
      `"${t.jalaliDate}"`,
      `"${t.date}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  // UTF-8 BOM for Persian Excel support
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions_report_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
