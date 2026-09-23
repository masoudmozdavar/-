import React, { useState, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CurrencyType } from '../types';
import { formatCurrency, toPersianDigits } from '../utils/formatters';
import { exportBackupJSON, exportTransactionsCSV } from '../utils/storage';
import { NotificationDrawer } from './notifications/NotificationDrawer';
import { FamilyProfileSwitcherModal } from './family/FamilyProfileSwitcherModal';
import { UserProfileModal } from './profile/UserProfileModal';
import { GraphicAvatar } from './common/GraphicAvatar';
import { 
  Plus, 
  Wallet, 
  Download, 
  Upload, 
  RotateCcw, 
  FileSpreadsheet, 
  Globe, 
  MoreVertical, 
  ShieldCheck,
  Bell,
  Sun,
  Moon,
  Lock,
  Fingerprint,
  Users,
  RefreshCw,
  Crown,
  Sparkles,
  HelpCircle,
  BookOpen,
  LogOut,
  Trash2,
  User,
  Menu,
  X,
  Database,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserGuideModal } from './common/UserGuideModal';

export const Navbar: React.FC = () => {
  const {
    totalNetWorth,
    currency,
    setCurrency,
    language,
    setLanguage,
    theme,
    toggleTheme,
    openTransactionModal,
    resetToSampleData,
    importBackupData,
    accounts,
    categories,
    transactions,
    checks,
    debts,
    loans,
    goals,
    familyMembers,
    allowanceRequests,
    activeMember,
    isHeadOfFamily,
    setIsProfileSwitcherOpen,
    openUserProfile,
    setActiveTab,
    financialHealthScore,
    activeNotifications,
    criticalNotificationsCount,
    unreadNotificationsCount,
    highValueAlerts,
    smartBudgetAlerts,
    securityConfig,
    lockApp,
    setIsSecuritySettingsOpen,
    currentUser,
    isFirestoreConnected,
    logout,
    loadDemoData,
    clearUserData,
  } = useFinance();

  const isFa = language === 'fa';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unreadHighValueCount = isHeadOfFamily 
    ? (highValueAlerts || []).filter(a => !a.isRead).length 
    : 0;

  const smartBudgetCount = isHeadOfFamily ? (smartBudgetAlerts || []).length : 0;

  const handleExportJSON = () => {
    exportBackupJSON({
      accounts,
      categories,
      transactions,
      checks,
      debts,
      loans,
      goals,
      familyMembers,
      allowanceRequests,
      currency,
      language,
    });
    setIsMenuOpen(false);
  };

  const handleExportCSV = () => {
    exportTransactionsCSV(transactions, categories, accounts);
    setIsMenuOpen(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.data) {
          importBackupData(json.data);
        } else if (json.accounts || json.transactions) {
          importBackupData(json);
        }
        alert(isFa ? 'داده‌ها با موفقیت بازیابی شدند.' : 'Data imported successfully.');
      } catch (err) {
        alert(isFa ? 'فایل نامعتبر است!' : 'Invalid backup file format.');
      }
    };
    reader.readAsText(file);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-white/10 text-slate-100 px-4 lg:px-8 py-3.5 shadow-md transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Net Worth Summary */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Jibino Brand Logo & Title */}
          <div className="flex items-center gap-3 select-none">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/25 shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                <Wallet className="w-5 h-5 text-white drop-shadow-sm" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-black tracking-tight text-base sm:text-lg font-sans">
                  {isFa ? 'جیبینو' : 'Jibino'}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold hidden xs:inline tracking-wider">
                  JIBINO
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
                  <span>{isFa ? 'هوشمند' : 'Smart'}</span>
                </span>
              </div>
              <span className="text-slate-400 text-[10px] mt-0.5 font-medium truncate max-w-[140px] sm:max-w-none">
                {isFa ? 'مدیریت هوشمند مالی و دخل‌وخرج خانواده' : 'Smart Family Wealth & Finance'}
              </span>
            </div>
          </div>

          {/* Quick Net Worth Badge */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-[11px] text-slate-400">{isFa ? 'ارزش کل دارایی:' : 'Net Worth:'}</span>
            <span className="text-xs font-bold text-emerald-400">
              {formatCurrency(totalNetWorth, currency, isFa)}
            </span>
          </div>

          {/* Health Score Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] text-slate-400">{isFa ? 'سلامت مالی:' : 'Health:'}</span>
            <span className="font-bold text-blue-300">
              {isFa ? toPersianDigits(financialHealthScore) : financialHealthScore}%
            </span>
          </div>

          {/* Firestore Cloud Sync Badge */}
          {currentUser && !currentUser.isDemo && (
            <div 
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs"
              title={isFirestoreConnected ? (isFa ? 'همگام‌سازی لحظه‌ای با Firestore فعال است' : 'Realtime Firestore Sync Active') : (isFa ? 'در انتظار اتصال ابری' : 'Connecting to Firestore...')}
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] text-slate-400">{isFa ? 'پایگاه ابری:' : 'Database:'}</span>
              <span className={`flex items-center gap-1 font-bold ${isFirestoreConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isFirestoreConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {isFirestoreConnected ? (isFa ? 'متصل' : 'Connected') : (isFa ? 'درحال اتصال' : 'Syncing')}
              </span>
            </div>
          )}
        </div>

        {/* Desktop Actions & Settings */}
        <div className="hidden md:flex items-center gap-2 sm:gap-2.5">
          {/* Quick Add Transaction Button */}
          <button
            onClick={() => openTransactionModal()}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">{isFa ? 'تراکنش جدید' : 'New Transaction'}</span>
          </button>

          {/* Notification Bell Button */}
          <div className="relative">
            <button
              id="btn-notification-bell"
              onClick={() => setIsNotificationDrawerOpen(true)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl shadow-sm transition-all cursor-pointer relative ${
                unreadHighValueCount > 0 || smartBudgetCount > 0
                  ? 'bg-amber-950/70 border border-amber-500/60 text-amber-300 ring-2 ring-amber-500/20 shadow-amber-500/20' 
                  : 'bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={
                unreadHighValueCount > 0
                  ? (isFa ? `هشدار: ${toPersianDigits(unreadHighValueCount)} تراکنش با مبلغ بالا ثبت شده` : `Alert: ${unreadHighValueCount} high-value transaction(s)`)
                  : smartBudgetCount > 0
                  ? (isFa ? `هشدار هوشمند بودجه: ${toPersianDigits(smartBudgetCount)} دسته در خطر عبور از سقف` : `Smart Budget Alert: ${smartBudgetCount} category(s) at risk`)
                  : (isFa ? 'اعلان‌ها و یادآوری‌ها' : 'Notifications')
              }
            >
              <Bell className={`w-4 h-4 ${unreadHighValueCount > 0 || smartBudgetCount > 0 ? 'text-amber-400 animate-bounce' : ''}`} />
              {(unreadNotificationsCount > 0 || unreadHighValueCount > 0 || smartBudgetCount > 0) && (
                <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center text-white ring-2 ring-slate-900 ${
                  unreadHighValueCount > 0 
                    ? 'bg-amber-500 animate-pulse' 
                    : smartBudgetCount > 0
                    ? 'bg-rose-500 animate-pulse'
                    : criticalNotificationsCount > 0 
                    ? 'bg-rose-500 animate-pulse' 
                    : 'bg-indigo-600'
                }`}>
                  {isFa ? toPersianDigits(unreadNotificationsCount + unreadHighValueCount + smartBudgetCount) : (unreadNotificationsCount + unreadHighValueCount + smartBudgetCount)}
                </span>
              )}
            </button>
          </div>

          {/* Quick App Lock Button */}
          <button
            onClick={lockApp}
            className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-400 rounded-xl shadow-sm transition-all cursor-pointer relative"
            title={isFa ? 'قفل فوری برنامه' : 'Lock Application'}
            aria-label="قفل فوری برنامه"
          >
            <Lock className="w-4 h-4" />
            {securityConfig.isEnabled && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            )}
          </button>

          {/* Quick Help & User Guide Button */}
          <button
            onClick={() => setIsUserGuideOpen(true)}
            className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-400 rounded-xl shadow-sm transition-all cursor-pointer relative"
            title={isFa ? 'راهنمای جامع کار با برنامه' : 'User Guide'}
            aria-label="راهنمای جامع کار با برنامه"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-amber-300 rounded-xl shadow-sm transition-all cursor-pointer"
            title={theme === 'dark' ? (isFa ? 'تغییر به تم روشن' : 'Switch to Light Mode') : (isFa ? 'تغییر به تم تیره' : 'Switch to Dark Mode')}
            aria-label="تغییر تم تیره و روشن"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300 transition-transform -rotate-12 hover:rotate-0" />
            )}
          </button>

          {/* Currency Switcher */}
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyType)}
              aria-label="انتخاب واحد پول"
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="toman">{isFa ? 'تومان' : 'Toman'}</option>
              <option value="rial">{isFa ? 'ریال' : 'Rial'}</option>
              <option value="usd">{isFa ? 'دلار ($)' : 'USD ($)'}</option>
              <option value="eur">{isFa ? 'یورو (€)' : 'EUR (€)'}</option>
            </select>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-600 transition-colors cursor-pointer"
            title="تغییر زبان | Change Language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{language === 'fa' ? 'FA' : 'EN'}</span>
          </button>

          {/* Interactive Family User Profile Snippet */}
          <button
            onClick={() => openUserProfile()}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer group shadow-sm"
            title={isFa ? 'پروفایل و انتخاب کاراکتر / سوییچ خانواده' : 'Profile, Graphic Character & Family Switcher'}
          >
            <GraphicAvatar
              avatarId={activeMember.avatar || currentUser?.avatar}
              size="sm"
              ring={true}
              ringColor="#3b82f6"
            />
            <div className="flex flex-col text-right rtl:text-right ltr:text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white leading-tight">{activeMember.name}</span>
                {isHeadOfFamily ? (
                  <Crown className="w-3 h-3 text-amber-400" />
                ) : (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                    روتین
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-blue-300 transition-colors flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                <span>{isFa ? 'پروفایل و کاراکتر' : 'Profile & Character'}</span>
              </span>
            </div>
          </button>

          {/* Quick Logout Button */}
          <button
            onClick={() => {
              if (confirm(isFa ? 'آیا مایل به خروج از حساب کاربری هستید؟' : 'Log out of current account?')) {
                logout();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-600/50 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-all cursor-pointer"
            title={isFa ? `خروج از حساب (${currentUser?.name || ''})` : 'Logout'}
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden xl:inline">{isFa ? 'خروج' : 'Logout'}</span>
          </button>

          {/* More actions dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors cursor-pointer"
              title="امکانات و تنظیمات"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div 
                  key="nav-dropdown-backdrop"
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsMenuOpen(false)} 
                />
                <div 
                  key="nav-dropdown-menu"
                  className={`absolute top-full mt-2 z-50 w-64 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 text-xs ${isFa ? 'left-0' : 'right-0'}`}
                >
                  {/* User Profile Card (Interactive) */}
                  <button
                    onClick={() => {
                      openUserProfile();
                      setIsMenuOpen(false);
                    }}
                    className="w-full p-2.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-transparent dark:from-slate-800/90 dark:via-indigo-950/30 dark:to-slate-800/60 hover:border-blue-500/50 rounded-xl mb-2 flex items-center justify-between border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer group text-right rtl:text-right ltr:text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <GraphicAvatar
                        avatarId={currentUser?.avatar || activeMember.avatar}
                        size="sm"
                        ring={true}
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {currentUser?.name || (isFa ? 'کاربر گرامی' : 'User')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isFa ? 'ویرایش مشخصات و کاراکتر' : 'Edit profile & avatar'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      currentUser?.isDemo 
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-500/30' 
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {currentUser?.isDemo ? (isFa ? 'دمو' : 'Demo') : (isFa ? 'حساب اصلی' : 'Real')}
                    </span>
                  </button>

                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
                    {isFa ? 'تنظیمات ظاهری و تم' : 'Appearance'}
                  </div>

                  <button
                    onClick={() => {
                      setIsUserGuideOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors text-right cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      <span>{isFa ? 'راهنمای جامع کار با برنامه' : 'Complete User Guide'}</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      {isFa ? 'آموزش' : 'Guide'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      toggleTheme();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-right cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Moon className="w-4 h-4 text-blue-500" />
                      )}
                      <span>{isFa ? 'حالت نمایش تیره / روشن' : 'Dark / Light Mode'}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {theme === 'dark' ? (isFa ? 'تیره' : 'Dark') : (isFa ? 'روشن' : 'Light')}
                    </span>
                  </button>

                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 my-1">
                    {isFa ? 'امنیت و قفل برنامه' : 'Security & App Lock'}
                  </div>

                  <button
                    onClick={() => {
                      setIsSecuritySettingsOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors text-right cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-purple-500" />
                      <span>{isFa ? 'تنظیمات قفل و اثر انگشت' : 'Security & Biometrics'}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      securityConfig.isEnabled ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {securityConfig.isEnabled ? (isFa ? 'فعال' : 'Active') : (isFa ? 'غیرفعال' : 'Off')}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      lockApp();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-right cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-rose-500" />
                    <span>{isFa ? 'قفل فوری برنامه' : 'Lock Application Now'}</span>
                  </button>

                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 my-1">
                    {isFa ? 'مدیریت داده‌ها و خروجی' : 'Data & Exports'}
                  </div>

                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 transition-colors text-right cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>{isFa ? 'خروجی اکسل (CSV)' : 'Export CSV (Excel)'}</span>
                  </button>

                  <button
                    onClick={handleExportJSON}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors text-right cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>{isFa ? 'پشتیبان‌گیری (Backup JSON)' : 'Backup Data (JSON)'}</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors text-right cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>{isFa ? 'بازیابی از فایل پشتیبان' : 'Restore Backup'}</span>
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                  {currentUser?.isDemo ? (
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold transition-colors text-right cursor-pointer mb-1"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span>{isFa ? 'ثبت‌نام و شروع حساب واقعی' : 'Register Real Account'}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200/60 dark:bg-blue-800/60 font-black">
                        {isFa ? 'خروج از دمو' : 'Exit Demo'}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (confirm(isFa ? 'آیا مایلید داده‌های آزمایشی استاندارد جایگزین شوند؟' : 'Reset to sample data?')) {
                          resetToSampleData();
                          setIsMenuOpen(false);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-800 dark:text-amber-300 transition-colors text-right cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-600" />
                      <span>{isFa ? 'بارگذاری داده‌های پیش‌فرض دمو' : 'Load Demo Sample Data'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(isFa ? 'آیا از پاکسازی تمام تراکنش‌ها، حساب‌ها و داده‌های مالی خود اطمینان دارید؟' : 'Clear all finance data?')) {
                        clearUserData();
                        setIsMenuOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 transition-colors text-right cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>{isFa ? 'پاکسازی کامل اطلاعات مالی' : 'Clear All Data'}</span>
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                  <button
                    onClick={() => {
                      if (confirm(isFa ? 'آیا می‌خواهید از حساب کاربری فعلی خارج شوید؟' : 'Log out of current account?')) {
                        logout();
                        setIsMenuOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold transition-colors text-right cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>{isFa ? 'خروج از حساب کاربری' : 'Log Out'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Header Actions (Compact, Touch-friendly) */}
        <div className="flex md:hidden items-center gap-1.5">
          {/* Mobile Notification Bell */}
          <button
            onClick={() => setIsNotificationDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 relative cursor-pointer active:scale-95"
            title={isFa ? 'اعلان‌ها' : 'Notifications'}
          >
            <Bell className="w-4 h-4" />
            {(unreadNotificationsCount > 0 || unreadHighValueCount > 0 || smartBudgetCount > 0) && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse ring-2 ring-slate-900" />
            )}
          </button>

          {/* Member Profile Avatar Pill */}
          <button
            onClick={() => openUserProfile()}
            className="w-9 h-9 rounded-xl flex items-center justify-center p-0.5 border border-slate-700 bg-slate-800 active:scale-95 transition-all cursor-pointer overflow-hidden shadow-xs"
            title={activeMember.name}
          >
            <GraphicAvatar
              avatarId={activeMember.avatar || currentUser?.avatar}
              size="xs"
              ring={true}
              ringColor="#3b82f6"
            />
          </button>

          {/* Mobile Main Menu Button */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 hover:text-white active:scale-95 transition-all cursor-pointer"
            title={isFa ? 'منوی تنظیمات و مدیریت' : 'Menu'}
          >
            <Menu className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportFile}
          accept=".json"
          className="hidden"
        />
      </div>
    </header>

      {/* Global Slide-over Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
      />

      {/* User Profile & Graphic Character Modal */}
      <UserProfileModal />

      {/* Family Profile Switcher Modal */}
      <FamilyProfileSwitcherModal />

      {/* Interactive Step-by-Step User Guide Modal */}
      <UserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
      />

      {/* Mobile Off-Canvas Drawer */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: isFa ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isFa ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative z-10 w-full max-w-[320px] h-full bg-slate-900 text-slate-100 border-l border-slate-800 flex flex-col shadow-2xl overflow-y-auto p-4"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{isFa ? 'منوی جیبینو' : 'Jibino Menu'}</h3>
                    <span className="text-[10px] text-slate-400">{currentUser?.name || ''}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="بستن منو"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Profile Card in Drawer */}
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  openUserProfile();
                }}
                className="w-full p-3 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-800/80 hover:from-blue-900/60 hover:to-slate-800 border border-blue-500/30 rounded-2xl mb-4 flex items-center justify-between transition-all cursor-pointer text-right rtl:text-right ltr:text-left"
              >
                <div className="flex items-center gap-2.5">
                  <GraphicAvatar
                    avatarId={currentUser?.avatar || activeMember.avatar}
                    size="md"
                    ring={true}
                    ringColor="#3b82f6"
                  />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{currentUser?.name || activeMember.name}</span>
                      {isHeadOfFamily && <Crown className="w-3 h-3 text-amber-400" />}
                    </div>
                    <div className="text-[10px] text-blue-300 mt-0.5 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{isFa ? 'ویرایش پروفایل و کاراکتر' : 'Edit profile & character'}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {isFa ? 'مشاهده' : 'View'}
                </span>
              </button>

              {/* Data Storage Informational Card */}
              <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-2xl mb-4 text-right">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs mb-1.5">
                  <HardDrive className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{isFa ? 'محل ذخیره اطلاعات شما' : 'Data Storage Location'}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                  {isFa
                    ? 'اطلاعات، حساب‌ها و تراکنش‌های شما به صورت امن و ۱۰۰٪ خصوصی روی حافظه مرورگر همین گوشی (Local Storage) نگهداری می‌شوند و به سرور ناشناسی منتقل نمی‌گردند. می‌توانید همیشه با دکمه پشتیبان‌گیری فایل خروجی دریافت کنید.'
                    : 'All your financial records are privately saved in this device’s local browser storage.'}
                </p>
              </div>

              {/* Quick Settings Grid */}
              <div className="space-y-3 flex-1">
                {/* Theme & Currency Row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={toggleTheme}
                    className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-slate-700 transition-colors text-xs font-semibold"
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-300" />
                    )}
                    <span className="text-[11px]">{theme === 'dark' ? (isFa ? 'تم روشن' : 'Light') : (isFa ? 'تم تیره' : 'Dark')}</span>
                  </button>

                  <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[10px] text-slate-400">{isFa ? 'واحد پول' : 'Currency'}</span>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as CurrencyType)}
                      className="bg-transparent text-white text-xs font-bold text-center focus:outline-none cursor-pointer"
                    >
                      <option value="toman" className="bg-slate-900">{isFa ? 'تومان' : 'Toman'}</option>
                      <option value="rial" className="bg-slate-900">{isFa ? 'ریال' : 'Rial'}</option>
                      <option value="usd" className="bg-slate-900">{isFa ? 'دلار ($)' : 'USD ($)'}</option>
                      <option value="eur" className="bg-slate-900">{isFa ? 'یورو (€)' : 'EUR (€)'}</option>
                    </select>
                  </div>
                </div>

                {/* Language Switch */}
                <button
                  onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-slate-700 text-xs font-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span>{isFa ? 'تغییر زبان' : 'Language'}</span>
                  </div>
                  <span className="text-xs font-bold text-cyan-400">{language === 'fa' ? 'فارسی (FA)' : 'English (EN)'}</span>
                </button>

                {/* User Guide Button */}
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    setIsUserGuideOpen(true);
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  <span>{isFa ? 'راهنمای کار با برنامه' : 'User Guide'}</span>
                </button>

                {/* Security Settings */}
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    setIsSecuritySettingsOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-emerald-400" />
                    <span>{isFa ? 'امنیت و قفل اثر انگشت' : 'Security & Lock'}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    securityConfig.isEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {securityConfig.isEnabled ? (isFa ? 'فعال' : 'Active') : (isFa ? 'غیرفعال' : 'Off')}
                  </span>
                </button>

                {/* Lock Application Button */}
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    lockApp();
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-rose-950/40 text-rose-300 text-xs font-medium transition-colors"
                >
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span>{isFa ? 'قفل فوری صفحه' : 'Lock Screen Now'}</span>
                </button>

                {/* Data Backup Section */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isFa ? 'پشتیبان‌گیری و خروجی' : 'Backup & Export'}
                  </span>

                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>{isFa ? 'خروجی فایل اکسل (CSV)' : 'Export CSV (Excel)'}</span>
                  </button>

                  <button
                    onClick={handleExportJSON}
                    className="w-full flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors"
                  >
                    <Download className="w-4 h-4 text-blue-400" />
                    <span>{isFa ? 'دانلود نسخه پشتیبان (JSON)' : 'Download Backup'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span>{isFa ? 'بازیابی از فایل پشتیبان' : 'Restore Backup'}</span>
                  </button>
                </div>

                {/* Demo / Reset data */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  {currentUser?.isDemo ? (
                    <button
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span>{isFa ? 'شروع حساب کاربری واقعی' : 'Start Real Account'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (confirm(isFa ? 'آیا مایل به بارگذاری داده‌های آزمایشی هستید؟' : 'Load sample demo data?')) {
                          resetToSampleData();
                          setIsMobileDrawerOpen(false);
                        }
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 hover:bg-amber-950/40 border border-slate-700 text-xs text-amber-300 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      <span>{isFa ? 'بارگذاری داده‌های دمو' : 'Load Demo Data'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(isFa ? 'آیا از پاکسازی تمام اطلاعات مالی خود اطمینان دارید؟' : 'Clear all financial data?')) {
                        clearUserData();
                        setIsMobileDrawerOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 hover:bg-rose-950/40 border border-slate-700 text-xs text-rose-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>{isFa ? 'پاکسازی کامل داده‌ها' : 'Clear All Data'}</span>
                  </button>
                </div>
              </div>

              {/* Drawer Footer / Logout */}
              <div className="pt-3 border-t border-slate-800 mt-3">
                <button
                  onClick={() => {
                    if (confirm(isFa ? 'آیا مایل به خروج از حساب کاربری هستید؟' : 'Log out of current account?')) {
                      setIsMobileDrawerOpen(false);
                      logout();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-300 font-bold text-xs hover:bg-rose-900/60 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isFa ? 'خروج از حساب کاربری' : 'Log Out'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
