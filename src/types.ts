export type CurrencyType = 'toman' | 'rial' | 'usd' | 'eur';
export type LanguageType = 'fa' | 'en';
export type ThemeMode = 'light' | 'dark';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type AccountType = 'bank' | 'cash' | 'gold' | 'crypto' | 'investment';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bankName?: string;
  cardNumber?: string;
  accountNumber?: string;
  balance: number;
  color: string;
  iconName?: string;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  budgetMonthly?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string; // Source account
  toAccountId?: string; // For transfers
  date: string; // YYYY-MM-DD (ISO Gregorian for robust storage)
  jalaliDate: string; // YYYY/MM/DD
  description: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  receiptImage?: string; // Data URL of receipt or photo
  memberId?: string; // ID of family member or 'head'
  memberName?: string; // Name of member, e.g. "سارا"
  memberRole?: FamilyRole; // Role e.g. 'child' | 'spouse' | 'head'
}

export type FamilyRole = 'head' | 'spouse' | 'child' | 'parent' | 'other';

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyRole;
  avatar: string; // Emoji avatar e.g. 👨, 👩, 👧, 👦, 👵
  color: string; // Tailored color badge e.g. 'blue', 'rose', 'emerald', 'purple'
  assignedAccountIds?: string[]; // Allowed account IDs (empty means all accounts)
  allowedAccountIds?: string[]; // Alias for assignedAccountIds
  monthlyAllowance?: number; // سقف هزینه ماهانه / سهمیه پول توجیبی
  pin?: string; // 4-digit PIN for access
  isActive: boolean;
  createdAt: string;
  phone?: string;
  notes?: string;
}

export interface FamilyAllowanceRequest {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  amount: number;
  reason: string;
  date: string;
  jalaliDate: string;
  status: 'pending' | 'approved' | 'rejected';
  resolvedAt?: string;
  sourceAccountId?: string;
}

export type FamilyMemberRoutineTab = 'entry' | 'history' | 'allowance' | 'requests';

export type CheckStatus = 'pending' | 'cleared' | 'bounced' | 'cancelled';
export type CheckType = 'issued' | 'received'; // صادره یا دریافتی

export interface CheckItem {
  id: string;
  type: CheckType;
  checkNumber: string;
  sayadId?: string;
  bankName: string;
  amount: number;
  recipientOrPayer: string;
  dueDate: string; // YYYY-MM-DD
  dueJalaliDate: string; // YYYY/MM/DD
  status: CheckStatus;
  accountId?: string;
  notes?: string;
}

export type DebtType = 'debt' | 'receivable'; // بدهی (باید بدهم) یا طلب (باید بگیرم)

export interface DebtItem {
  id: string;
  type: DebtType;
  personName: string;
  phone?: string;
  totalAmount: number;
  paidAmount: number;
  dueDate?: string;
  dueJalaliDate?: string;
  isSettled: boolean;
  notes?: string;
  createdAt: string;
}

export interface LoanItem {
  id: string;
  title: string;
  bankName: string;
  totalAmount: number; // کل مبلغ بازپرداخت
  principalAmount: number; // اصل وام
  interestRate: number; // درصد سود
  totalInstallments: number; // تعداد کل اقساط
  paidInstallments: number; // اقساط پرداخت شده
  monthlyPayment: number; // مبلغ هر قسط
  startDate: string;
  startJalaliDate: string;
  dueDayOfMonth: number; // روز سررسید در ماه (1 تا 31)
  accountId?: string;
}

export interface SavingGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  targetJalaliDate: string;
  category: string;
  color: string;
  icon: string;
  notes?: string;
}

export interface BudgetGoal {
  categoryId: string;
  monthlyLimit: number;
  spent: number;
  month: string; // YYYY-MM
}

export interface BudgetAlert {
  categoryId: string;
  categoryName: string;
  categoryNameEn: string;
  icon: string;
  color: string;
  limit: number;
  spent: number;
  percentage: number;
  remaining: number;
  isOver: boolean;
  isApproaching: boolean;
}

export interface SmartBudgetProjectionAlert {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryNameEn: string;
  icon: string;
  color: string;
  monthlyLimit: number;
  currentSpent: number;
  currentPercentage: number;
  dailyAverage: number;
  projectedEndMonthSpent: number;
  projectedExcessAmount: number;
  projectedPercentage: number;
  daysRemainingInMonth: number;
  currentDayOfMonth: number;
  totalDaysInMonth: number;
  projectedDaysUntilBreach: number | null;
  projectedBreachDayOfMonth: number | null;
  recommendedDailyCap: number;
  severity: 'critical' | 'warning' | 'info';
  isAlreadyExceeded: boolean;
  topContributingMembers: {
    memberId: string;
    memberName: string;
    amount: number;
    percentage: number;
  }[];
}

export type NavigationTab = 
  | 'dashboard'
  | 'transactions'
  | 'accounts'
  | 'family'
  | 'checks_loans'
  | 'budgets_goals'
  | 'analytics'
  | 'tools';

export type NotificationPriority = 'critical' | 'urgent' | 'warning' | 'info';

export type NotificationCategory = 
  | 'check_issued' 
  | 'check_received' 
  | 'loan_installment' 
  | 'debt_payment' 
  | 'receivable_collection' 
  | 'budget_warning';

export interface FinanceNotification {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority; // critical (overdue), urgent (today), warning (1-3 days), info (4-7 days)
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  amount: number;
  dueDate: string;
  dueJalaliDate?: string;
  daysDiff: number; // < 0 overdue, 0 today, > 0 days remaining
  relatedEntityId: string;
  actionType: 'clear_check' | 'pay_loan' | 'pay_debt' | 'view_budget';
  actionTargetTab: NavigationTab;
  isDismissed?: boolean;
}

export interface SecurityLockConfig {
  isEnabled: boolean;
  pinHash: string;
  hasBiometric: boolean;
  biometricCredentialId?: string;
  autoLockMinutes: number; // 0 = always on launch/reload, 1, 5, 15, 30
  lastUnlockedAt?: number;
}

export interface HighValueTransactionAlert {
  id: string;
  transactionId: string;
  amount: number;
  threshold: number;
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  categoryName?: string;
  accountName?: string;
  date: string;
  jalaliDate: string;
  description: string;
  timestamp: number;
  isRead: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  username?: string;
  passwordHash: string;
  salt?: string;
  recoveryCode?: string;
  recoveryExpires?: number;
  name: string;
  role: 'head' | 'member';
  avatar?: string;
  phone?: string;
  createdAt: string;
  isDemo?: boolean;
  syncedWithFirestore?: boolean;
}

