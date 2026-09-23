import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { SmartBudgetProjectionAlert } from '../../types';
import { formatCurrency, toPersianDigits } from '../../utils/formatters';
import { 
  AlertTriangle, 
  TrendingUp, 
  CalendarClock, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  SlidersHorizontal,
  Lightbulb,
  X
} from 'lucide-react';
import { IconRenderer } from '../common/IconRenderer';
import { motion, AnimatePresence } from 'motion/react';

export const SmartBudgetAlertsBanner: React.FC = () => {
  const {
    smartBudgetAlerts,
    dismissSmartBudgetAlert,
    setActiveTab,
    isHeadOfFamily,
    currency,
    language
  } = useFinance();

  const isFa = language === 'fa';
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [isSectionCollapsed, setIsSectionCollapsed] = useState<boolean>(false);

  // This proactive alert system is designed specifically for head of family
  if (!isHeadOfFamily || !smartBudgetAlerts || smartBudgetAlerts.length === 0) {
    return null;
  }

  const criticalCount = smartBudgetAlerts.filter(a => a.severity === 'critical' || a.isAlreadyExceeded).length;
  const projectedBreachCount = smartBudgetAlerts.filter(a => !a.isAlreadyExceeded && a.projectedEndMonthSpent > a.monthlyLimit).length;

  const toggleExpand = (id: string) => {
    setExpandedAlertId(prev => prev === id ? null : id);
  };

  return (
    <div className="rounded-3xl border border-rose-300/80 dark:border-rose-900/60 bg-gradient-to-br from-rose-50/95 via-amber-50/50 to-white dark:from-slate-900 dark:via-rose-950/20 dark:to-slate-900/80 p-4 sm:p-5 shadow-sm space-y-3.5 transition-all">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/25 shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-rose-950 dark:text-rose-100 flex items-center gap-1.5">
                <span>{isFa ? 'هشدار هوشمند پیش‌بینی سقف بودجه' : 'Smart Budget Forecast Warning'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-200/90 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
                  {isFa ? 'ویژه سرپرست' : 'Head of Family'}
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-rose-700/90 dark:text-rose-300/90 mt-0.5">
              {isFa
                ? `تحلیل ریتم و سرعت مخارج نشان می‌دهد ${toPersianDigits(smartBudgetAlerts.length)} دسته قبل از اتمام ماه جاری از سقف بودجه عبور خواهند کرد.`
                : `Historical spending pace projects ${smartBudgetAlerts.length} category(s) will exceed monthly limit before month end.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {projectedBreachCount > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-100/90 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span>{isFa ? `${toPersianDigits(projectedBreachCount)} دسته در خطر اضافه مخارج` : `${projectedBreachCount} projected breach`}</span>
            </span>
          )}

          <button
            onClick={() => setIsSectionCollapsed(!isSectionCollapsed)}
            className="p-1.5 rounded-xl bg-rose-100/70 dark:bg-slate-800 hover:bg-rose-200/80 text-rose-800 dark:text-rose-300 text-xs transition-colors cursor-pointer"
            title={isSectionCollapsed ? (isFa ? 'نمایش جزییات' : 'Expand') : (isFa ? 'بستن موقت' : 'Collapse')}
          >
            {isSectionCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible content */}
      {!isSectionCollapsed && (
        <div className="space-y-3 pt-1">
          {smartBudgetAlerts.map((alert, idx) => {
            const isExpanded = expandedAlertId === alert.id;
            const isCritical = alert.severity === 'critical' || alert.isAlreadyExceeded;

            return (
              <div
                key={`smart-proj-alert-${alert.categoryId}-${idx}`}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isCritical
                    ? 'bg-white dark:bg-slate-900/90 border-rose-300 dark:border-rose-900/70 shadow-xs'
                    : 'bg-white dark:bg-slate-900/80 border-amber-300 dark:border-amber-900/60 shadow-xs'
                }`}
              >
                {/* Alert summary bar */}
                <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: alert.color }}
                    >
                      <IconRenderer name={alert.icon} size={18} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {isFa ? alert.categoryName : alert.categoryNameEn}
                        </span>

                        {alert.isAlreadyExceeded ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white animate-pulse">
                            {isFa ? 'سقف رد شده!' : 'Over Budget!'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-slate-950 flex items-center gap-1">
                            <CalendarClock className="w-3 h-3" />
                            {isFa 
                              ? `پیش‌بینی عبور تا ${alert.projectedDaysUntilBreach !== null ? toPersianDigits(alert.projectedDaysUntilBreach) : '۰'} روز دیگر`
                              : `Breach projected in ${alert.projectedDaysUntilBreach} days`}
                          </span>
                        )}

                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {isFa 
                            ? `مصرف فعلی: ${toPersianDigits(alert.currentPercentage)}٪ (${formatCurrency(alert.currentSpent, currency, isFa)})`
                            : `Current: ${alert.currentPercentage}% (${formatCurrency(alert.currentSpent, currency, isFa)})`}
                        </span>
                      </div>

                      {/* Forecast highlight text */}
                      <p className="text-[11px] sm:text-xs text-rose-800 dark:text-rose-300 font-semibold mt-1">
                        {alert.isAlreadyExceeded ? (
                          isFa
                            ? `مخارج این دسته ${formatCurrency(alert.currentSpent - alert.monthlyLimit, currency, isFa)} از بودجه مصوب (${formatCurrency(alert.monthlyLimit, currency, isFa)}) فراتر رفته است.`
                            : `Exceeded monthly ceiling by ${formatCurrency(alert.currentSpent - alert.monthlyLimit, currency, isFa)}.`
                        ) : (
                          isFa
                            ? `با ریتم روزانه فعلی (${formatCurrency(alert.dailyAverage, currency, isFa)} در روز)، کل مخارج تا پایان ماه به ${formatCurrency(alert.projectedEndMonthSpent, currency, isFa)} (${toPersianDigits(alert.projectedPercentage)}٪) خواهد رسید!`
                            : `At current burn rate (${formatCurrency(alert.dailyAverage, currency, isFa)}/day), spending is projected to reach ${formatCurrency(alert.projectedEndMonthSpent, currency, isFa)} (${alert.projectedPercentage}%) before month ends!`
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions & expand toggle */}
                  <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => toggleExpand(alert.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isExpanded ? (isFa ? 'بستن تحلیل' : 'Hide') : (isFa ? 'تحلیل و راهکار' : 'AI Analysis')}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => setActiveTab('budgets_goals')}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isFa ? 'اصلاح سقف بودجه' : 'Adjust Budget'}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>

                    <button
                      onClick={() => dismissSmartBudgetAlert(alert.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={isFa ? 'بستن این هشدار' : 'Dismiss'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar visual comparison */}
                <div className="px-3.5 sm:px-4 pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{isFa ? `روز ${toPersianDigits(alert.currentDayOfMonth)} از ${toPersianDigits(alert.totalDaysInMonth)} ماه` : `Day ${alert.currentDayOfMonth} of ${alert.totalDaysInMonth}`}</span>
                      <span>{isFa ? `پیش‌بینی کل: ${formatCurrency(alert.projectedEndMonthSpent, currency, isFa)}` : `Projected: ${formatCurrency(alert.projectedEndMonthSpent, currency, isFa)}`}</span>
                    </div>

                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative border border-slate-200 dark:border-slate-700/60">
                      {/* 100% threshold marker line */}
                      <div className="absolute top-0 bottom-0 left-[75%] sm:left-[80%] w-0.5 bg-slate-400 dark:bg-slate-500 z-10" title="سقف مجاز ۱۰۰٪" />
                      
                      {/* Current Spent Progress */}
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          alert.isAlreadyExceeded ? 'bg-rose-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, alert.currentPercentage)}%` }}
                      />

                      {/* Projected extension line if not already full */}
                      {!alert.isAlreadyExceeded && alert.projectedPercentage > alert.currentPercentage && (
                        <div
                          className="h-full bg-rose-400/50 dark:bg-rose-500/40 absolute top-0 rounded-r-full transition-all duration-500 border-l border-dashed border-rose-600"
                          style={{
                            left: `${Math.min(100, alert.currentPercentage)}%`,
                            width: `${Math.min(100 - alert.currentPercentage, alert.projectedPercentage - alert.currentPercentage)}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Deep Dive & Recommendation Drawer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 sm:p-5 space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Box 1: Velocity & Days */}
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                          <span className="text-[11px] text-slate-500 font-bold block">{isFa ? 'میانگین مخارج روزانه:' : 'Daily Burn Rate:'}</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">
                            {formatCurrency(alert.dailyAverage, currency, isFa)}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            {isFa ? `${toPersianDigits(alert.daysRemainingInMonth)} روز تا پایان ماه مانده` : `${alert.daysRemainingInMonth} days left in month`}
                          </span>
                        </div>

                        {/* Box 2: Projected Excess */}
                        <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
                          <span className="text-[11px] text-rose-700 dark:text-rose-300 font-bold block">{isFa ? 'پیش‌بینی مازاد مخارج:' : 'Projected Overrun:'}</span>
                          <span className="text-sm font-black text-rose-700 dark:text-rose-300 mt-1 block">
                            +{formatCurrency(alert.projectedExcessAmount, currency, isFa)}
                          </span>
                          <span className="text-[10px] text-rose-600/80 dark:text-rose-400 mt-0.5 block">
                            {alert.projectedBreachDayOfMonth 
                              ? (isFa ? `احتمال اتمام سقف در روز ${toPersianDigits(alert.projectedBreachDayOfMonth)} ماه` : `Breach expected around day ${alert.projectedBreachDayOfMonth}`)
                              : (isFa ? 'سقف اکنون رد شده است' : 'Already exceeded')}
                          </span>
                        </div>

                        {/* Box 3: Recommended Daily Cap */}
                        <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                          <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold block">{isFa ? 'سقف روزانه توصیه‌شده:' : 'Recommended Daily Cap:'}</span>
                          <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 mt-1 block">
                            {formatCurrency(alert.recommendedDailyCap, currency, isFa)}
                          </span>
                          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400 mt-0.5 block">
                            {isFa ? 'برای حفظ بودجه تا آخر ماه' : 'To finish month on budget'}
                          </span>
                        </div>
                      </div>

                      {/* Family members who spent in this category */}
                      {alert.topContributingMembers && alert.topContributingMembers.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{isFa ? 'سهم اعضای خانواده در هزینه‌های این دسته:' : 'Family Member Breakdown:'}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {alert.topContributingMembers.map((member, mIdx) => (
                              <div
                                key={`mem-contr-${member.memberId}-${mIdx}`}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs"
                              >
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {member.memberName}
                                </span>
                                <div className="text-right">
                                  <span className="font-bold text-slate-900 dark:text-white block">
                                    {formatCurrency(member.amount, currency, isFa)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">
                                    {toPersianDigits(member.percentage)}٪ کل
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actionable recommendation advice */}
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block mb-0.5">{isFa ? 'توصیه هوشمند سیستم برای سرپرست خانواده:' : 'Proactive Advice for Head of Family:'}</span>
                          <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                            {isFa ? (
                              alert.recommendedDailyCap > 0
                                ? `برای جلوگیری از کسری بودجه، میانگین خرید در دسته «${alert.categoryName}» را به حداکثر ${formatCurrency(alert.recommendedDailyCap, currency, isFa)} در روز محدود کنید یا در جلسه خانواده به اعضا یادآوری فرمایید.`
                                : `سقف بودجه این دسته تکمیل شده است. می‌توانید سقف بودجه ماهانه را از بخش «بودجه و اهداف» افزایش دهید یا خریدهای غیرضروری این دسته را تا پایان ماه به تعویق بیندازید.`
                            ) : (
                              alert.recommendedDailyCap > 0
                                ? `To prevent budget deficit, cap daily expenses in '${alert.categoryNameEn}' to ${formatCurrency(alert.recommendedDailyCap, currency, isFa)}/day or notify family members.`
                                : `Budget ceiling is exhausted. Consider adjusting the limit in Budgets & Goals or pausing discretionary purchases until next month.`
                            )}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
