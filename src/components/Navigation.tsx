import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { NavigationTab } from '../types';
import { toPersianDigits } from '../utils/formatters';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  CreditCard, 
  FileCheck2, 
  Target, 
  BarChart3, 
  Calculator,
  Users,
  Send,
  History,
  Coins
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    language, 
    checks, 
    loans, 
    isHeadOfFamily, 
    allowanceRequests, 
    activeMember,
    smartBudgetAlerts
  } = useFinance();

  const isFa = language === 'fa';

  const pendingChecksCount = checks.filter(c => c.status === 'pending').length;
  const activeLoansCount = loans.filter(l => l.paidInstallments < l.totalInstallments).length;
  const pendingRequestsCount = allowanceRequests.filter(r => r.status === 'pending').length;
  const smartBudgetAlertsCount = isHeadOfFamily ? (smartBudgetAlerts || []).length : 0;

  // Head of family full nav
  const headNavItems: {
    id: NavigationTab;
    labelFa: string;
    labelEn: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      labelFa: 'داشبورد اصلی',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'family',
      labelFa: 'مدیریت خانواده',
      labelEn: 'Family Hub',
      icon: Users,
      badge: pendingRequestsCount,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300',
    },
    {
      id: 'transactions',
      labelFa: 'تراکنش‌ها و مخارج',
      labelEn: 'Transactions',
      icon: ArrowLeftRight,
    },
    {
      id: 'accounts',
      labelFa: 'حساب‌ها و کارت‌ها',
      labelEn: 'Accounts & Cards',
      icon: CreditCard,
    },
    {
      id: 'checks_loans',
      labelFa: 'چک، وام و بدهی',
      labelEn: 'Checks & Loans',
      icon: FileCheck2,
      badge: pendingChecksCount + activeLoansCount,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300',
    },
    {
      id: 'budgets_goals',
      labelFa: 'بودجه و اهداف',
      labelEn: 'Budgets & Goals',
      icon: Target,
      badge: smartBudgetAlertsCount > 0 ? smartBudgetAlertsCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/50 dark:text-rose-300',
    },
    {
      id: 'analytics',
      labelFa: 'نمودارها و تحلیل',
      labelEn: 'Analytics',
      icon: BarChart3,
    },
    {
      id: 'tools',
      labelFa: 'ابزارها و مشاور',
      labelEn: 'Tools & AI Advisor',
      icon: Calculator,
    },
  ];

  if (!isHeadOfFamily) {
    return (
      <nav className="bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/60 dark:border-slate-800/60 px-4 lg:px-8 py-2 sticky top-[65px] z-20 backdrop-blur-xl shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 py-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {isFa ? `حالت روتین عضو خانواده: ${activeMember.name}` : `Routine Task View: ${activeMember.name}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/50 px-3 py-1 rounded-xl border border-purple-200/70 dark:border-purple-800/50 backdrop-blur-md">
            <Send className="w-3 h-3 text-purple-500" />
            <span>{isFa ? 'ثبت مستقیم در حساب سرپرست' : 'Direct Sync to Head'}</span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="hidden md:block bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/60 dark:border-slate-800/60 px-4 lg:px-8 py-2.5 sticky top-[65px] z-20 backdrop-blur-xl shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {headNavItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer relative ${
                isActive
                  ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 dark:border-blue-400/30 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 shadow-xs shadow-blue-500" />
              )}
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>{isFa ? item.labelFa : item.labelEn}</span>

              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border font-mono-num ${item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                  {isFa ? toPersianDigits(item.badge) : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

