import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import { FinanceNotification, NotificationPriority } from '../../types';
import { formatCurrency, toPersianDigits } from '../../utils/formatters';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  X, 
  ExternalLink,
  ShieldCheck,
  Check,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  CalendarClock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);
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
    highValueAlerts,
    dismissHighValueAlert,
    smartBudgetAlerts,
    dismissSmartBudgetAlert,
    isHeadOfFamily,
  } = useFinance();

  const isFa = language === 'fa';
  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'checks' | 'loans' | 'high_value' | 'budget_alerts'>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const unreadHighValueCount = (highValueAlerts || []).filter(a => !a.isRead).length;
  const smartBudgetAlertsCount = isHeadOfFamily ? (smartBudgetAlerts || []).length : 0;

  const filtered = activeNotifications.filter(n => {
    if (activeFilter === 'urgent') return n.priority === 'critical' || n.priority === 'urgent';
    if (activeFilter === 'checks') return n.category === 'check_issued' || n.category === 'check_received';
    if (activeFilter === 'loans') return n.category === 'loan_installment' || n.category === 'debt_payment' || n.category === 'receivable_collection';
    if (activeFilter === 'high_value') return false; // Handled separately
    if (activeFilter === 'budget_alerts') return n.category === 'budget_warning';
    return true;
  });

  const getBadge = (p: NotificationPriority) => {
    switch (p) {
      case 'critical':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
          dot: 'bg-rose-500',
          label: isFa ? 'بسیار فوری' : 'Critical',
        };
      case 'urgent':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
          dot: 'bg-amber-500',
          label: isFa ? 'امروز' : 'Today',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
          dot: 'bg-yellow-500',
          label: isFa ? 'هشدار ۸۰٪' : 'Warning',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
          dot: 'bg-blue-500',
          label: isFa ? 'هفته جاری' : 'This Week',
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
      onClose();
    }
  };

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <div key="notification-drawer-wrapper">
          {/* Backdrop */}
          <motion.div 
            key="notification-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99998] bg-slate-900/60 backdrop-blur-xs transition-opacity cursor-pointer" 
            onClick={onClose} 
          />

          {/* Drawer / Popover container */}
          <motion.div
            key="notification-drawer-panel"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className={`fixed top-16 z-[99999] w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
              isFa ? 'left-4 sm:left-12' : 'right-4 sm:right-12'
            }`}
          >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isFa ? 'مرکز اعلان‌ها و یادآوری‌ها' : 'Notifications & Alerts'}
                </h3>
                {activeNotifications.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/70 text-rose-700 dark:text-rose-300">
                    {isFa ? `${toPersianDigits(activeNotifications.length)} مورد` : `${activeNotifications.length}`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isFa ? 'یادآوری سررسید چک‌ها، اقساط و بدهی‌ها' : 'Pending dues and payments'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isFa ? 'همه' : 'All'}
          </button>
          <button
            onClick={() => setActiveFilter('urgent')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'urgent'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isFa ? 'فوری و امروز' : 'Urgent & Today'}
          </button>
          <button
            onClick={() => setActiveFilter('checks')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'checks'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isFa ? 'چک‌ها' : 'Checks'}
          </button>
          <button
            onClick={() => setActiveFilter('loans')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'loans'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isFa ? 'اقساط و بدهی' : 'Loans & Debts'}
          </button>
          {isHeadOfFamily && (
            <button
              onClick={() => setActiveFilter('high_value')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === 'high_value'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{isFa ? 'مخارج سنگین اعضا' : 'High-Value'}</span>
              {unreadHighValueCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                  {toPersianDigits(unreadHighValueCount)}
                </span>
              )}
            </button>
          )}
          {isHeadOfFamily && (
            <button
              onClick={() => setActiveFilter('budget_alerts')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === 'budget_alerts'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{isFa ? 'پیش‌بینی بودجه' : 'Budget Alerts'}</span>
              {smartBudgetAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950">
                  {toPersianDigits(smartBudgetAlertsCount)}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Notifications Scroll List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* High-value alerts block if activeFilter is high_value or all */}
          {isHeadOfFamily && (activeFilter === 'high_value' || activeFilter === 'all') && (highValueAlerts || []).length > 0 && (
            <div className="space-y-2.5 pb-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400 px-1">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  تراکنش‌های با مبلغ بالا ثبت‌شده توسط اعضا
                </span>
                <span className="text-[11px] font-normal text-slate-400">
                  {toPersianDigits(highValueAlerts.length)} تراکنش
                </span>
              </div>

              {highValueAlerts.map((alert, idx) => (
                <div
                  key={`drawer-high-alert-${alert.id}-${idx}`}
                  className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/30 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{alert.memberAvatar || '👤'}</span>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{alert.memberName}</span>
                          <span className="px-1.5 py-0.2 text-[10px] rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold">
                            هشدار سقف مبلغ
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {alert.jalaliDate}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => dismissHighValueAlert(alert.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title="بستن"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {alert.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-xs">
                    <span className="font-black text-rose-600 dark:text-rose-400">
                      {formatCurrency(alert.amount, currency, isFa)}
                    </span>
                    <button
                      onClick={() => {
                        setActiveTab('transactions');
                        onClose();
                      }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      مشاهده در تراکنش‌ها
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Smart Budget Projection alerts block if activeFilter is budget_alerts or all */}
          {isHeadOfFamily && (activeFilter === 'budget_alerts' || activeFilter === 'all') && (smartBudgetAlerts || []).length > 0 && (
            <div className="space-y-2.5 pb-2">
              <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-400 px-1">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  پیش‌بینی عبور از سقف بودجه (هشدار هوشمند)
                </span>
                <span className="text-[11px] font-normal text-slate-400">
                  {toPersianDigits(smartBudgetAlerts.length)} دسته
                </span>
              </div>

              {smartBudgetAlerts.map((alert, idx) => (
                <div
                  key={`drawer-smart-budget-${alert.categoryId}-${idx}`}
                  className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/30 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs"
                        style={{ backgroundColor: alert.color }}
                      >
                        ⚠️
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{isFa ? alert.categoryName : alert.categoryNameEn}</span>
                          <span className={`px-1.5 py-0.2 text-[10px] rounded font-bold ${
                            alert.isAlreadyExceeded 
                              ? 'bg-rose-600 text-white' 
                              : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                          }`}>
                            {alert.isAlreadyExceeded 
                              ? (isFa ? 'سقف رد شده' : 'Over limit') 
                              : (isFa ? `پیش‌بینی: ${toPersianDigits(alert.projectedPercentage)}٪` : `${alert.projectedPercentage}%`)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isFa 
                            ? `سقف مصوب: ${formatCurrency(alert.monthlyLimit, currency, isFa)} | روزانه: ${formatCurrency(alert.dailyAverage, currency, isFa)}`
                            : `Budget: ${formatCurrency(alert.monthlyLimit, currency, isFa)} | Daily: ${formatCurrency(alert.dailyAverage, currency, isFa)}`}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => dismissSmartBudgetAlert(alert.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title={isFa ? 'بستن' : 'Dismiss'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                    {alert.isAlreadyExceeded
                      ? (isFa ? `سقف بودجه این دسته با ${formatCurrency(alert.currentSpent, currency, isFa)} هزینه پر شده است.` : `Budget already exhausted.`)
                      : (isFa 
                          ? `با سرعت فعلی تا پایان ماه به ${formatCurrency(alert.projectedEndMonthSpent, currency, isFa)} خواهد رسید (${alert.projectedDaysUntilBreach !== null ? `اتمام بودجه تا ${toPersianDigits(alert.projectedDaysUntilBreach)} روز دیگر` : ''}).`
                          : `Projected to reach ${formatCurrency(alert.projectedEndMonthSpent, currency, isFa)} before month ends.`)}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-rose-500/20 text-xs">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      {alert.recommendedDailyCap > 0 
                        ? (isFa ? `سقف پیشنهادی روزانه: ${formatCurrency(alert.recommendedDailyCap, currency, isFa)}` : `Cap: ${formatCurrency(alert.recommendedDailyCap, currency, isFa)}/day`)
                        : (isFa ? 'سقف بودجه پایان یافته' : 'Ceiling reached')}
                    </span>
                    <button
                      onClick={() => {
                        setActiveTab('budgets_goals');
                        onClose();
                      }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {isFa ? 'مدیریت سقف بودجه' : 'Manage Budget'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeFilter !== 'high_value' && activeFilter !== 'budget_alerts' && filtered.length === 0 && (highValueAlerts || []).length === 0 && (smartBudgetAlerts || []).length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isFa ? 'هیچ اعلان فعالی وجود ندارد' : 'No active notifications'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                {isFa 
                  ? 'تمامی سررسیدها پرداخت یا تسویه شده‌اند.' 
                  : 'All due items are settled and up to date.'}
              </p>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const b = getBadge(item.priority);
              return (
                <div
                  key={`drawer-item-${item.id}-${idx}`}
                  className={`p-3.5 rounded-2xl border transition-all ${b.bg}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${b.dot}`} />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {isFa ? item.title : item.titleEn}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${b.bg}`}>
                        {b.label}
                      </span>
                      <button
                        onClick={() => dismissNotification(item.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title={isFa ? 'بستن' : 'Dismiss'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    {isFa ? item.description : item.descriptionEn}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {formatCurrency(item.amount, currency, isFa)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          handleQuickAction(item);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-[11px] font-bold shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          {item.actionType === 'clear_check' 
                            ? (isFa ? 'وصول' : 'Clear') 
                            : item.actionType === 'pay_loan' 
                            ? (isFa ? 'پرداخت' : 'Pay') 
                            : (isFa ? 'تسویه' : 'Settle')}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('checks_loans');
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-[11px] font-medium transition-colors"
                        title={isFa ? 'مشاهده جزئیات' : 'View'}
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{isFa ? 'مشاهده' : 'View'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-center">
          <button
            onClick={() => {
              setActiveTab('checks_loans');
              onClose();
            }}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isFa ? 'ورود به صفحه مدیریت چک، وام و بدهی‌ها' : 'Go to Checks, Loans & Debts'}
          </button>
        </div>
      </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(drawerContent, document.body);
};
