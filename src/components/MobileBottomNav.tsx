import React, { useState } from 'react';
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
  Plus,
  Grid,
  X,
  ShieldCheck,
  Download,
  HelpCircle,
  Sparkles,
  Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GraphicAvatar } from './common/GraphicAvatar';

interface MobileBottomNavProps {
  onOpenMoreMenu?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = () => {
  const { 
    activeTab, 
    setActiveTab, 
    openTransactionModal, 
    openUserProfile,
    activeMember,
    currentUser,
    language, 
    checks, 
    loans, 
    isHeadOfFamily, 
    allowanceRequests, 
    smartBudgetAlerts,
    setIsSecuritySettingsOpen
  } = useFinance();

  const isFa = language === 'fa';
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const pendingChecksCount = checks.filter(c => c.status === 'pending').length;
  const activeLoansCount = loans.filter(l => l.paidInstallments < l.totalInstallments).length;
  const pendingRequestsCount = allowanceRequests.filter(r => r.status === 'pending').length;
  const smartBudgetAlertsCount = isHeadOfFamily ? (smartBudgetAlerts || []).length : 0;
  const totalSecondaryBadges = pendingChecksCount + activeLoansCount + pendingRequestsCount + smartBudgetAlertsCount;

  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsMoreSheetOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Fixed Bottom Navigation Bar for Mobile */}
      <nav 
        id="mobile-bottom-navigation" 
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 border-t border-slate-800/90 backdrop-blur-xl px-2 py-1.5 shadow-2xl safe-area-bottom select-none"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {/* Tab 1: Dashboard */}
          <button
            type="button"
            onClick={() => handleSelectTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-blue-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <LayoutDashboard className={`w-5 h-5 transition-transform ${activeTab === 'dashboard' ? 'scale-110' : ''}`} />
              {activeTab === 'dashboard' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">
              {isFa ? 'داشبورد' : 'Home'}
            </span>
          </button>

          {/* Tab 2: Transactions */}
          <button
            type="button"
            onClick={() => handleSelectTab('transactions')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'text-blue-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <ArrowLeftRight className={`w-5 h-5 transition-transform ${activeTab === 'transactions' ? 'scale-110' : ''}`} />
              {activeTab === 'transactions' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">
              {isFa ? 'تراکنش‌ها' : 'Activity'}
            </span>
          </button>

          {/* Center Elevated Action: Quick Add Transaction */}
          <div className="flex-1 flex justify-center -mt-5">
            <button
              type="button"
              onClick={() => openTransactionModal()}
              className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 active:scale-95 transition-all cursor-pointer border-2 border-slate-900 group"
              title={isFa ? 'ثبت سریع درآمد یا هزینه' : 'New Transaction'}
            >
              <Plus className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" />
            </button>
          </div>

          {/* Tab 4: Accounts */}
          <button
            type="button"
            onClick={() => handleSelectTab('accounts')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'accounts'
                ? 'text-blue-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <CreditCard className={`w-5 h-5 transition-transform ${activeTab === 'accounts' ? 'scale-110' : ''}`} />
              {activeTab === 'accounts' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">
              {isFa ? 'حساب‌ها' : 'Cards'}
            </span>
          </button>

          {/* Tab 5: More (Bottom Sheet Opener) */}
          <button
            type="button"
            onClick={() => setIsMoreSheetOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer relative ${
              ['family', 'checks_loans', 'budgets_goals', 'analytics', 'tools'].includes(activeTab)
                ? 'text-blue-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Grid className={`w-5 h-5 transition-transform ${['family', 'checks_loans', 'budgets_goals', 'analytics', 'tools'].includes(activeTab) ? 'scale-110' : ''}`} />
              {totalSecondaryBadges > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse ring-2 ring-slate-900" />
              )}
              {['family', 'checks_loans', 'budgets_goals', 'analytics', 'tools'].includes(activeTab) && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">
              {isFa ? 'بیشتر' : 'More'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile More Tabs Bottom Sheet */}
      <AnimatePresence>
        {isMoreSheetOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreSheetOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            />

            {/* Bottom Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl z-10 text-white max-h-[80vh] overflow-y-auto"
            >
              {/* Grabber handle */}
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Grid className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-black text-white">
                    {isFa ? 'سایر بخش‌ها و امکانات جیبینو' : 'More Features'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMoreSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Profile Card Button */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  openUserProfile();
                }}
                className="w-full p-3.5 mb-3.5 rounded-2xl bg-gradient-to-r from-blue-900/50 via-indigo-900/40 to-slate-800/80 hover:from-blue-900/70 border border-blue-500/40 flex items-center justify-between text-right rtl:text-right ltr:text-left transition-all cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-3">
                  <GraphicAvatar
                    avatarId={currentUser?.avatar || activeMember.avatar}
                    size="md"
                    ring={true}
                    ringColor="#3b82f6"
                    showBadge={true}
                  />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{currentUser?.name || activeMember.name}</span>
                      {isHeadOfFamily && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="text-[10px] text-blue-300 mt-0.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-300" />
                      <span>{isFa ? 'ویرایش مشخصات و انتخاب کاراکتر' : 'Edit profile & character'}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-blue-600 text-white shadow-xs">
                  {isFa ? 'پروفایل' : 'Profile'}
                </span>
              </button>

              {/* Grid of secondary sections */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Family Hub */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('family')}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-center gap-3 cursor-pointer ${
                    activeTab === 'family'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{isFa ? 'مدیریت خانواده' : 'Family Hub'}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {pendingRequestsCount > 0 
                        ? (isFa ? `${toPersianDigits(pendingRequestsCount)} درخواست منتظر` : `${pendingRequestsCount} request(s)`)
                        : (isFa ? 'اعضا و پول‌توجیبی' : 'Allowance & Sync')}
                    </div>
                  </div>
                </button>

                {/* Checks & Loans */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('checks_loans')}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-center gap-3 cursor-pointer ${
                    activeTab === 'checks_loans'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{isFa ? 'چک، وام و بدهی' : 'Checks & Loans'}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {pendingChecksCount > 0
                        ? (isFa ? `${toPersianDigits(pendingChecksCount)} چک سررسید` : `${pendingChecksCount} check(s)`)
                        : (isFa ? 'مدیریت اقساط و طلب' : 'Installments')}
                    </div>
                  </div>
                </button>

                {/* Budgets & Goals */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('budgets_goals')}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-center gap-3 cursor-pointer ${
                    activeTab === 'budgets_goals'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{isFa ? 'بودجه و اهداف' : 'Budgets & Goals'}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {smartBudgetAlertsCount > 0
                        ? (isFa ? `${toPersianDigits(smartBudgetAlertsCount)} هشدار سقف` : 'Alerts')
                        : (isFa ? 'سقف مخارج و قلک' : 'Savings')}
                    </div>
                  </div>
                </button>

                {/* Analytics */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('analytics')}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-center gap-3 cursor-pointer ${
                    activeTab === 'analytics'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{isFa ? 'نمودارها و تحلیل' : 'Analytics'}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {isFa ? 'جریان نقدینگی و سهم مخارج' : 'Cashflow & stats'}
                    </div>
                  </div>
                </button>

                {/* Tools & Advisor */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('tools')}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-center gap-3 cursor-pointer col-span-2 ${
                    activeTab === 'tools'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>{isFa ? 'ابزارها و دستیار هوش مصنوعی' : 'Tools & AI Advisor'}</span>
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {isFa ? 'محاسبه‌گر وام، سود سپرده و مشاوره مالی هوشمند' : 'Loan calculators & advisor'}
                    </div>
                  </div>
                </button>
              </div>

              {/* Quick Settings Shortcut */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    setIsSecuritySettingsOpen(true);
                  }}
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-white py-2"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>{isFa ? 'تنظیمات امنیت و رمز عبور' : 'Security Settings'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
