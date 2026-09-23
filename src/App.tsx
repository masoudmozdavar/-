import React from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { Navbar } from './components/Navbar';
import { Navigation } from './components/Navigation';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { TransactionManager } from './components/transactions/TransactionManager';
import { TransactionModal } from './components/transactions/TransactionModal';
import { AccountsManager } from './components/accounts/AccountsManager';
import { ChecksAndLoansManager } from './components/checks/ChecksAndLoansManager';
import { BudgetsAndGoalsManager } from './components/budgets/BudgetsAndGoalsManager';
import { AnalyticsReports } from './components/analytics/AnalyticsReports';
import { ToolsAndAdvisor } from './components/tools/ToolsAndAdvisor';
import { FamilyManager } from './components/family/FamilyManager';
import { FamilyMemberRoutineView } from './components/family/FamilyMemberRoutineView';
import { SecurityLockScreen } from './components/security/SecurityLockScreen';
import { SecuritySettingsModal } from './components/security/SecuritySettingsModal';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { GraphicAvatar } from './components/common/GraphicAvatar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Plus, Sparkles, Users, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getTodayJalali } from './utils/jalali';
import { toPersianDigits } from './utils/formatters';

const MainContent: React.FC = () => {
  const { 
    activeTab, 
    openTransactionModal, 
    openUserProfile,
    language, 
    isHeadOfFamily, 
    activeMember,
    currentUser,
    logout,
    loadDemoData
  } = useFinance();
  const isFa = language === 'fa';
  const todayJalali = getTodayJalali();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col selection:bg-blue-500/20 selection:text-blue-700 font-sans transition-colors duration-200">
      {/* Security App Lock Screen Overlay (Active when locked) */}
      <SecurityLockScreen />

      {/* Security Settings Modal */}
      <SecuritySettingsModal />

      {/* Top Navigation Bar */}
      <Navbar />

      {/* Secondary Tab Bar */}
      <Navigation />

      {/* Page Header / Welcome Banner */}
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-8 pt-5 pb-1">
        <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-5 sm:p-6 transition-all">
          {/* Subtle glowing ambient accents */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 -mb-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Left Content / User Info */}
            <div className="flex items-start sm:items-center gap-4">
              {/* Graphic Avatar with click-to-edit action */}
              <button
                type="button"
                onClick={() => openUserProfile()}
                className="shrink-0 relative group cursor-pointer focus:outline-none"
                title={isFa ? 'مدیریت و ویرایش کاراکتر گرافیکی' : 'Edit graphic character'}
              >
                <GraphicAvatar
                  avatarId={currentUser?.avatar || activeMember.avatar}
                  size="xl"
                  ring={true}
                  ringColor="#3b82f6"
                  showBadge={true}
                  className="group-hover:scale-105 transition-transform duration-200 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-blue-600 text-white text-[9px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles className="w-2.5 h-2.5" />
                </span>
              </button>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{isFa ? 'برخط و همگام' : 'Synced & Online'}</span>
                  </span>

                  <span className="text-xs text-slate-300 dark:text-slate-700">•</span>

                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {isFa ? `امروز ${toPersianDigits(todayJalali)}` : todayJalali}
                  </span>

                  {currentUser?.isDemo ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{isFa ? 'حالت دمو' : 'Demo Mode'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/70">
                      <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span>{isFa ? 'حساب اختصاصی' : 'Personal Cloud'}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isFa 
                      ? `خوش آمدید، ${currentUser?.name || activeMember.name || 'کاربر گرامی'}` 
                      : `Welcome back, ${currentUser?.name || activeMember.name || 'User'}`}
                  </h1>
                  <span className="text-xl select-none">👋</span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                  {currentUser?.isDemo 
                    ? (isFa 
                        ? 'در حال کاوش در نسخه نمایشی هستید. با کلیک بر روی کاراکتر خود می‌توانید ظاهر و نام را به دلخواه تنظیم کنید.'
                        : 'Exploring in demo mode. Click on your avatar anytime to customize your character and details.')
                    : isHeadOfFamily
                    ? (isFa
                        ? 'داشبورد جامع مدیریت دارایی‌ها، چک‌ها، اقساط وام و تراکنش‌های دخل و خرج خانواده.'
                        : 'Your complete dashboard for family assets, checks, loans, and expenses.')
                    : (isFa
                        ? 'پنل اختصاصی ثبت سریع تراکنش‌های روزمره متصل به حساب سرپرست خانواده.'
                        : 'Routine member panel connected to the family head workspace.')}
                </p>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openUserProfile()}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl transition-all cursor-pointer"
                title={isFa ? 'تنظیمات پروفایل و کاراکتر' : 'Profile & Character'}
              >
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="hidden sm:inline">{isFa ? 'پروفایل و کاراکتر' : 'Profile & Avatar'}</span>
              </button>

              <button
                type="button"
                onClick={() => openTransactionModal()}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isFa ? 'ثبت تراکنش جدید' : 'New Transaction'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 pb-24 md:pb-6">
        {!isHeadOfFamily ? (
          <motion.div
            key={activeMember.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <FamilyMemberRoutineView />
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {activeTab === 'dashboard' && <DashboardOverview />}
              {activeTab === 'family' && <FamilyManager />}
              {activeTab === 'transactions' && <TransactionManager />}
              {activeTab === 'accounts' && <AccountsManager />}
              {activeTab === 'checks_loans' && <ChecksAndLoansManager />}
              {activeTab === 'budgets_goals' && <BudgetsAndGoalsManager />}
              {activeTab === 'analytics' && <AnalyticsReports />}
              {activeTab === 'tools' && <ToolsAndAdvisor />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Global Transaction Modal */}
      <TransactionModal />

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Floating Action Button for Rapid Entry (Desktop Only) */}
      <button
        onClick={() => openTransactionModal()}
        className="hidden md:flex fixed bottom-6 left-6 z-30 items-center gap-2 px-4 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-600/30 active:scale-95 transition-all cursor-pointer group"
        title={isFa ? 'ثبت سریع تراکنش جدید' : 'New Transaction'}
      >
        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
        <span className="text-xs font-bold hidden sm:inline">
          {isFa ? 'تراکنش جدید' : 'New Entry'}
        </span>
      </button>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-5 pb-24 md:pb-5 px-4 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium">
            {isFa
              ? 'سامانه جامع مدیریت مالی شخصی و خانواده (جیبینو - Jibino)'
              : 'Jibino - Personal & Family Wealth Management'}
          </span>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="text-[11px]">
              {isFa ? 'سیستم حسابداری خانوادگی و تجمیع خودکار' : 'Multi-user Family System'}
            </span>
            <span>•</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              {isFa ? 'همگام‌سازی فعال' : 'Sync Active'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { currentUser, setCurrentUser } = useFinance();

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  return <MainContent />;
};

export default function App() {
  return (
    <FinanceProvider>
      <MainApp />
    </FinanceProvider>
  );
}
