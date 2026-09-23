import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  BookOpen, 
  Lock, 
  Users, 
  CreditCard, 
  Receipt, 
  PieChart, 
  CalendarClock, 
  Download, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  KeyRound,
  CheckCircle2,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const { language } = useFinance();
  const isFa = language === 'fa';
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const guideSections = [
    {
      id: 'auth_security',
      title: isFa ? '۱. نحوه ورود، خروج و امنیت حساب' : '1. Login, Logout & App Security',
      icon: Lock,
      color: 'indigo',
      badge: isFa ? 'پاسخ به سوال شما' : 'Key Question',
      content: (
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            {isFa 
              ? 'در این اپلیکیشن امنیت و ورود/خروج در دو سطح مهندسی شده است:' 
              : 'App security and login/logout operate at two distinct levels:'}
          </p>

          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300">
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>{isFa ? 'سطح اول: قفل و ورود امن به کل اپلیکیشن (App Lock & PIN)' : 'Level 1: Master Lock & PIN'}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isFa
                ? 'از آیکون سه‌نقطه بالای صفحه > «تنظیمات قفل و اثر انگشت»، یک رمز ۴ یا ۶ رقمی (و در صورت پشتیبانی گوشی یا لپ‌تاپ، سنسور اثر انگشت) فعال کنید. پس از فعال‌سازی، با زدن آیکون قفل 🔒 بالای صفحه یا بستن برنامه، صفحه قفل ظاهر شده و بدون رمز یا اثر انگشت هیچ‌کس امکان ورود ندارد.'
                : 'Enable a 4 or 6-digit PIN and biometrics via the menu. Tap the lock icon to instantly lock the application.'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-purple-700 dark:text-purple-300">
              <Users className="w-4 h-4 shrink-0" />
              <span>{isFa ? 'سطح دوم: سوییچ و خروج بین اعضای خانواده (Profile Switcher)' : 'Level 2: Family Profile Switching'}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isFa
                ? 'با کلیک روی نام و آواتار کاربر در هدر بالای صفحه (کنار دکمه زبان)، پنجره انتخاب کاربر باز می‌شود. می‌توانید به عنوان سرپرست (Head) یا هر یک از اعضای خانواده (مانند همسر یا فرزند) وارد شوید. برای جلوگیری از دسترسی فرزندان به پنل سرپرست، می‌توانید برای سرپرست و هر عضو رمز عبور مجزا تعیین کنید.'
                : 'Click your profile chip at the top to switch between the head of family and other members. Separate PINs ensure private member separation.'}
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'accounts_setup',
      title: isFa ? '۲. راه‌اندازی اولیه حساب‌ها و کارت‌های بانکی' : '2. Bank Accounts & Cards Setup',
      icon: CreditCard,
      color: 'blue',
      badge: isFa ? 'قدم اول' : 'Step 1',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            {isFa
              ? 'پیش از ثبت هزینه‌ها، ابتدا باید حساب‌های واقعی خود را تعریف کنید:'
              : 'Before recording expenses, set up your real accounts and cards:'}
          </p>
          <ul className="space-y-2 list-disc list-inside text-xs">
            <li>
              <strong className="text-slate-800 dark:text-slate-100">{isFa ? 'رفتن به تب حساب‌ها:' : 'Go to Accounts tab:'}</strong>{' '}
              {isFa ? 'از منوی تب‌ها، گزینه «حساب‌ها و کارت‌ها» را انتخاب کنید.' : 'Open the Accounts & Cards tab.'}
            </li>
            <li>
              <strong className="text-slate-800 dark:text-slate-100">{isFa ? 'افزودن حساب جدید:' : 'Add New Account:'}</strong>{' '}
              {isFa ? 'کارت‌های بانکی (ملی، ملت، سامان و...)، کیف پول نقدی، یا حساب پس‌انداز طلا/ارز را با موجودی واقعی وارد نمایید.' : 'Add your debit cards, cash wallets, or savings accounts with their current balance.'}
            </li>
            <li>
              <strong className="text-slate-800 dark:text-slate-100">{isFa ? 'تخصیص به عضو:' : 'Assign to Member:'}</strong>{' '}
              {isFa ? 'مشخص کنید کدام حساب متعلق به سرپرست است و کدام کارت در اختیار همسر یا فرزند قرار دارد.' : 'Specify which card belongs to the head and which is assigned to a member.'}
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'transactions',
      title: isFa ? '۳. ثبت دخل‌وخرج و پیامک بانکی هوشمند' : '3. Logging Transactions & SMS Parser',
      icon: Receipt,
      color: 'emerald',
      badge: isFa ? 'استفاده روزمره' : 'Daily Use',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            {isFa
              ? 'برای ثبت هزینه‌ها یا درآمدهای روزانه دو روش سریع در اختیار دارید:'
              : 'Record your daily income and expenses via two streamlined methods:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                {isFa ? 'روش ۱: دکمه ثبت سریع (+)' : 'Method 1: Quick Add (+)'}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFa 
                  ? 'دکمه آبی «تراکنش جدید» در هدر یا گوشه پایین صفحه را بزنید؛ مبلغ، دسته‌بندی و حساب مبدا را انتخاب کنید.'
                  : 'Tap the blue New Transaction button, select amount, category, and source account.'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <span className="font-bold text-purple-700 dark:text-purple-300 block mb-1">
                {isFa ? 'روش ۲: ماژول تحلیل هوشمند با جمنای (Gemini AI)' : 'Method 2: AI Bank SMS Auto-Parser'}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isFa 
                  ? 'دکمه «تحلیل پیامک بانکی (AI)» را بزنید و متن پیامک را بچسبانید؛ هوش مصنوعی جمنای مبلغ، نام پذیرنده و تاریخ را استخراج کرده و به صورت خودکار در دیتابیس ثبت می‌کند.'
                  : 'Tap AI SMS Parser to paste bank SMS; Gemini extracts amounts, merchants, dates and saves them directly.'}
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'family_control',
      title: isFa ? '۴. مدیریت مالی خانواده و سقف خرید اعضا' : '4. Family Budget & Member Allowance',
      icon: Users,
      color: 'amber',
      badge: isFa ? 'ویژه سرپرست' : 'Head Feature',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            {isFa
              ? 'سرپرست خانواده می‌تواند هزینه‌های فرزندان یا سایر اعضا را مدیریت کند:'
              : 'The head of household can oversee member expenses and monthly allowances:'}
          </p>
          <ul className="space-y-2 list-disc list-inside text-xs">
            <li>
              <strong className="text-slate-800 dark:text-slate-100">{isFa ? 'تعریف سقف مجاز ماهانه:' : 'Monthly Allowance Limit:'}</strong>{' '}
              {isFa ? 'برای هر عضو سقف خرج‌کرد در ماه معین کنید (مثلاً ۲ میلیون تومان برای فرزند).' : 'Set a maximum spending limit for each member.'}
            </li>
            <li>
              <strong className="text-slate-800 dark:text-slate-100">{isFa ? 'هشدار مبالغ بالا:' : 'High-Value Alerts:'}</strong>{' '}
              {isFa ? 'اگر عضوی خریدی با مبلغ بالا انجام دهد، آیکون زنگوله بالای صفحه زرد شده و به سرپرست هشدار می‌دهد.' : 'Alert notifications notify the head when a large purchase is made.'}
            </li>
            <li>
              <strong className="text-slate-800 dark:text-slate-100">{isFa ? 'نمودار مقایسه مخارج:' : 'Spending Comparison:'}</strong>{' '}
              {isFa ? 'در تب داشبورد و تحلیل، مقایسه سهم هر عضو از هزینه‌های ماهانه به صورت نموداری نمایش داده می‌شود.' : 'Visual breakdown of each member\'s contribution to total expenses.'}
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'checks_loans',
      title: isFa ? '۵. مدیریت چک‌ها، وام‌ها و تعهدات اقساطی' : '5. Checks, Loans & Installments',
      icon: CalendarClock,
      color: 'rose',
      badge: isFa ? 'پیشرفته' : 'Advanced',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            {isFa
              ? 'از تب «چک و تسهیلات» می‌توانید تعهدات آینده را برنامه‌ریزی کنید:'
              : 'Track future financial obligations in the Checks & Loans tab:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                {isFa ? 'چک‌های صیادی' : 'Checks'}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFa ? 'ثبت چک‌های دریافتی یا پرداختی به همراه تاریخ سررسید و شماره صیاد و اعلان روزهای باقیمانده.' : 'Track issued and received checks with due dates.'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                {isFa ? 'وام و اقساط ماهانه' : 'Loans & Installments'}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFa ? 'محاسبه گر اقساط و ثبت وام‌های فعال با کسر خودکار اقساط پرداختی از باقی‌مانده بدهی.' : 'Track remaining loan balance and installment deadlines.'}
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'smart_budget_alert',
      title: isFa ? '۶. سیستم هشدار هوشمند پیش‌بینی بودجه' : '6. Smart Budget Forecast & Alerts',
      icon: ShieldAlert,
      color: 'rose',
      badge: isFa ? 'هوشمند' : 'AI Forecast',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            {isFa
              ? 'این سیستم پیشگیرانه به شکل اختصاصی برای سرپرست خانواده طراحی شده است:'
              : 'This proactive system is exclusively designed for the head of family:'}
          </p>
          <ul className="space-y-1.5 list-disc list-inside text-xs">
            <li><strong className="text-slate-800 dark:text-slate-100">{isFa ? 'تحلیل ریتم مخارج روزانه:' : 'Daily Burn Rate Analysis:'}</strong> {isFa ? 'سیستم با محاسبه میانگین خرج روزانه در ماه جاری، رقم نهایی پایان ماه را پیش‌بینی می‌کند.' : 'Calculates daily velocity and projects end-of-month total.'}</li>
            <li><strong className="text-slate-800 dark:text-slate-100">{isFa ? 'هشدار زودهنگام قبل از اتمام ماه:' : 'Early Warning:'}</strong> {isFa ? 'قبل از اینکه بودجه دسته‌ای تمام شود، تعداد روزهای باقیمانده تا اتمام سقف را هشدار می‌دهد.' : 'Alerts you days before the budget is projected to run out.'}</li>
            <li><strong className="text-slate-800 dark:text-slate-100">{isFa ? 'سقف توصیه‌شده روزانه:' : 'Recommended Daily Cap:'}</strong> {isFa ? 'مبلغ دقیق روزانه‌ای را که خانواده باید رعایت کند تا به کسری نخورد پیشنهاد می‌دهد.' : 'Recommends exact daily spending limits to stay on track.'}</li>
            <li><strong className="text-slate-800 dark:text-slate-100">{isFa ? 'تفکیک سهم اعضا:' : 'Member Contribution Breakdown:'}</strong> {isFa ? 'مشخص می‌کند کدام عضو خانواده چه میزان در هر دسته هزینه کرده است.' : 'Shows which family members contributed to the expenses.'}</li>
          </ul>
        </div>
      )
    },
    {
      id: 'backup_restore',
      title: isFa ? '۷. خروجی اکسل و پشتیبان‌گیری ایمن (Backup)' : '7. Excel Export & Data Backup',
      icon: Download,
      color: 'teal',
      badge: isFa ? 'بسیار مهم' : 'Crucial',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
            {isFa 
              ? 'اطلاعات شما در مرورگر محلی به شکل امن نگهداری می‌شود. جهت جلوگیری از پاک‌شدن اطلاعات با پاک کردن حافظه مرورگر، توصیه می‌شود به صورت دوره‌ای فایل پشتیبان تهیه کنید.'
              : 'Your data is securely stored in your local browser. Take regular JSON backups.'}
          </div>
          <p>
            {isFa ? 'از منوی سه‌نقطه بالای صفحه گزینه‌های زیر در دسترس است:' : 'Available in the top-right menu:'}
          </p>
          <ul className="space-y-1.5 list-disc list-inside text-xs">
            <li><strong className="text-slate-800 dark:text-slate-100">{isFa ? 'خروجی اکسل (CSV):' : 'Export CSV:'}</strong> {isFa ? 'دانلود تمامی تراکنش‌ها برای تحلیل در نرم‌افزار Excel.' : 'Download transaction spreadsheet.'}</li>
            <li><strong className="text-slate-800 dark:text-slate-100">{isFa ? 'پشتیبان‌گیری (Backup JSON):' : 'Backup JSON:'}</strong> {isFa ? 'ذخیره کل داده‌ها در یک فایل با یک کلیک.' : 'Download full database snapshot.'}</li>
            <li><strong className="text-slate-800 dark:text-slate-100">{isFa ? 'بازیابی پشتیبان:' : 'Restore Backup:'}</strong> {isFa ? 'بارگذاری فایل پشتیبان در هر مرورگر یا دستگاه دیگر.' : 'Restore your database anytime.'}</li>
          </ul>
        </div>
      )
    }
  ];

  const guideContent = (
    <AnimatePresence>
      <div key="user-guide-modal-overlay" className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          key="user-guide-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          key="user-guide-window"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{isFa ? 'راهنمای جامع کار با اپلیکیشن جیبینو' : 'Complete Jibino User Guide'}</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isFa ? 'آموزش گام‌به‌گام ورود/خروج، مدیریت حساب‌ها و کنترل دخل‌وخرج خانواده' : 'Step-by-step guide to accounts, family, and login'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content with Tabs */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Step Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {guideSections.map((sec, idx) => {
                const Icon = sec.icon;
                const isActive = activeStep === idx;
                return (
                  <button
                    key={`guide-sec-${sec.id}-${idx}`}
                    onClick={() => setActiveStep(idx)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold truncate">{sec.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Section Card */}
            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                    {activeStep + 1}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {guideSections[activeStep].title}
                  </h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  {guideSections[activeStep].badge}
                </span>
              </div>

              {guideSections[activeStep].content}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
            <button
              onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
              disabled={activeStep === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeStep === 0
                  ? 'opacity-40 cursor-not-allowed text-slate-400'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
              <span>{isFa ? 'بخش قبلی' : 'Previous'}</span>
            </button>

            <span className="text-xs text-slate-400 font-mono">
              {activeStep + 1} / {guideSections.length}
            </span>

            {activeStep < guideSections.length - 1 ? (
              <button
                onClick={() => setActiveStep(prev => Math.min(guideSections.length - 1, prev + 1))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>{isFa ? 'بخش بعدی' : 'Next'}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isFa ? 'شروع استفاده از برنامه' : 'Got it, let\'s start'}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(guideContent, document.body);
};
