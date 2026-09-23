import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { FinanceNotification, NotificationPriority } from '../../types';
import { formatCurrency, toPersianDigits } from '../../utils/formatters';
import { 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  ArrowRight, 
  X, 
  ChevronDown, 
  ChevronUp, 
  BellRing,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PrioritizedAlertsBanner: React.FC = () => {
  const {
    activeNotifications,
    criticalNotificationsCount,
    dismissNotification,
    updateCheckStatus,
    payLoanInstallment,
    recordDebtPayment,
    setActiveTab,
    currency,
    language,
    accounts,
    checks,
    loans,
    debts
  } = useFinance();

  const isFa = language === 'fa';
  const [filter, setFilter] = useState<'all' | 'critical' | 'checks' | 'loans_debts' | 'budgets'>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // If user has zero financial records, don't clutter the onboarding screen
  if (accounts.length === 0 && checks.length === 0 && loans.length === 0 && debts.length === 0 && activeNotifications.length === 0) {
    return null;
  }

  if (activeNotifications.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold">
              {isFa ? 'وضعیت بودجه‌ها و سررسیدها منظم و عالی است' : 'All Budgets & Due Dates on Track'}
            </h4>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400/80 mt-0.5">
              {isFa 
                ? 'هیچ تجاوز از بودجه، چک معوقه، قسط پرداخت‌نشده یا موعد بدهی فوری در حال حاضر وجود ندارد.' 
                : 'No budget warnings, overdue checks, installments or urgent debts found.'}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
          {isFa ? 'همه منظم' : 'All Clear'}
        </span>
      </div>
    );
  }

  // Filter items
  const filteredNotifications = activeNotifications.filter((item) => {
    if (filter === 'critical') return item.priority === 'critical' || item.priority === 'urgent';
    if (filter === 'checks') return item.category === 'check_issued' || item.category === 'check_received';
    if (filter === 'loans_debts') return item.category === 'loan_installment' || item.category === 'debt_payment' || item.category === 'receivable_collection';
    if (filter === 'budgets') return item.category === 'budget_warning';
    return true;
  });

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300',
          indicator: 'bg-rose-500 ring-rose-300 dark:ring-rose-900',
          label: isFa ? 'بسیار فوری / هشدار بودجه' : 'Critical / Budget Warning',
          icon: AlertTriangle,
          iconColor: 'text-rose-600 dark:text-rose-400',
        };
      case 'urgent':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300',
          indicator: 'bg-amber-500 ring-amber-300 dark:ring-amber-900',
          label: isFa ? 'هشدار مصرف ۸۰٪' : '80%+ Budget Warning',
          icon: AlertCircle,
          iconColor: 'text-amber-600 dark:text-amber-400',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800/70 text-yellow-800 dark:text-yellow-300',
          indicator: 'bg-yellow-500 ring-yellow-300 dark:ring-yellow-900',
          label: isFa ? '۱ تا ۳ روز آینده' : 'Due in 1-3 Days',
          icon: Clock,
          iconColor: 'text-yellow-600 dark:text-yellow-400',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/70 text-blue-800 dark:text-blue-300',
          indicator: 'bg-blue-500 ring-blue-300 dark:ring-blue-900',
          label: isFa ? 'هفته جاری' : 'Upcoming This Week',
          icon: BellRing,
          iconColor: 'text-blue-600 dark:text-blue-400',
        };
    }
  };

  const handleQuickAction = (item: FinanceNotification) => {
    if (item.actionType === 'clear_check') {
      updateCheckStatus(item.relatedEntityId, 'cleared');
    } else if (item.actionType === 'pay_loan') {
      payLoanInstallment(item.relatedEntityId);
    } else if (item.actionType === 'pay_debt') {
      recordDebtPayment(item.relatedEntityId, item.amount);
    } else if (item.actionType === 'view_budget') {
      setActiveTab('budgets_goals');
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-slate-100/60 to-slate-50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 border-b border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            {criticalNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-600 rounded-full ring-2 ring-white dark:ring-slate-900 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {isFa ? 'هشدارهای سررسید چک، وام و بدهی' : 'Due Date Alerts & Reminders'}
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                {isFa ? `${toPersianDigits(activeNotifications.length)} مورد` : `${activeNotifications.length} items`}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isFa
                ? 'سررسیدهای بر اساس اولویت زمانی و اضطرار مرتب شده‌اند تا هیچ موعد مالی از قلم نیفتد.'
                : 'Prioritized schedule of pending checks, loan installments, and debts.'}
            </p>
          </div>
        </div>

        {/* Filter Chips & Expand/Collapse Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="hidden md:flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isFa ? 'همه' : 'All'}
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === 'critical'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400'
              }`}
            >
              {isFa ? 'فوری و امروز' : 'Critical & Today'}
            </button>
            <button
              onClick={() => setFilter('checks')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === 'checks'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isFa ? 'چک‌ها' : 'Checks'}
            </button>
            <button
              onClick={() => setFilter('loans_debts')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === 'loans_debts'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isFa ? 'وام و بدهی' : 'Loans & Debts'}
            </button>
            <button
              onClick={() => setFilter('budgets')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === 'budgets'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isFa ? 'هشدار بودجه' : 'Budgets'}
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? (isFa ? 'جمع کردن' : 'Collapse') : (isFa ? 'باز کردن' : 'Expand')}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Alerts List */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="prioritized-alerts-collapsible-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-5 space-y-3">
              {filteredNotifications.slice(0, 4).map((item, idx) => {
                const pStyle = getPriorityBadge(item.priority);
                const IconComponent = pStyle.icon;

                return (
                  <div
                    key={`alert-banner-item-${item.id}-${idx}`}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5 ${pStyle.bg}`}
                  >
                    {/* Left details */}
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 ${pStyle.iconColor}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {isFa ? item.title : item.titleEn}
                          </span>

                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${pStyle.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${pStyle.indicator} ring-2`} />
                            {pStyle.label}
                          </span>

                          {item.dueJalaliDate && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              <Calendar className="w-3 h-3" />
                              {item.dueJalaliDate}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {isFa ? item.description : item.descriptionEn}
                        </p>
                      </div>
                    </div>

                    {/* Right side: Amount & Action buttons */}
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-right rtl:text-right ltr:text-left">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {isFa ? 'مبلغ مورد نظر' : 'Amount'}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {formatCurrency(item.amount, currency, isFa)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Quick action button */}
                        <button
                          onClick={() => handleQuickAction(item)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-slate-600 text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                          title={isFa ? 'اقدام و ثبت سریع' : 'Quick Action'}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>
                            {item.actionType === 'clear_check' 
                              ? (isFa ? 'وصول شد' : 'Mark Cleared')
                              : item.actionType === 'pay_loan'
                              ? (isFa ? 'پرداخت قسط' : 'Pay Installment')
                              : (isFa ? 'تسویه شد' : 'Settle')}
                          </span>
                        </button>

                        {/* Navigate to Checks & Loans Tab */}
                        <button
                          onClick={() => setActiveTab('checks_loans')}
                          className="p-1.5 rounded-xl bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title={isFa ? 'مشاهده در بخش چک‌ها و وام‌ها' : 'View in Checks & Loans'}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {/* Dismiss notification */}
                        <button
                          onClick={() => dismissNotification(item.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          title={isFa ? 'پنهان کردن موقت این اعلان' : 'Dismiss'}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* View all button if more than 4 items */}
              {activeNotifications.length > 4 && (
                <div className="text-center pt-1">
                  <button
                    onClick={() => setActiveTab('checks_loans')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>
                      {isFa 
                        ? `مشاهده تمام ${toPersianDigits(activeNotifications.length)} مورد سررسید در صفحه چک و وام` 
                        : `View all ${activeNotifications.length} due items in Checks & Loans`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
