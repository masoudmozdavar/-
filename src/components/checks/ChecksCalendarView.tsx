import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CheckItem, CheckStatus, CheckType, CurrencyType, LanguageType, LoanItem, DebtItem } from '../../types';
import { formatCurrency, toPersianDigits } from '../../utils/formatters';
import { 
  JALALI_MONTH_NAMES_FA, 
  JALALI_MONTH_NAMES_EN, 
  JALALI_WEEK_DAYS_FA, 
  getJalaliMonthDays, 
  getJalaliDayOfWeek, 
  getNextJalaliMonth, 
  getPrevJalaliMonth, 
  parseJalaliString, 
  getTodayJalali,
  getDaysRemaining,
  formatJalaliHuman 
} from '../../utils/jalali';
import { 
  ChevronRight, 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  X, 
  CreditCard,
  HandCoins,
  Filter,
  Plus,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChecksCalendarViewProps {
  checks?: CheckItem[];
  currency?: CurrencyType;
  language?: LanguageType;
  onUpdateStatus?: (id: string, status: CheckStatus) => void;
  onAddNewCheckForDate?: (jalaliDate: string) => void;
}

export type CalendarEventFilter = 'all' | 'issued' | 'received' | 'loans' | 'debts';

export const ChecksCalendarView: React.FC<ChecksCalendarViewProps> = ({
  checks: propsChecks,
  currency: propsCurrency,
  language: propsLanguage,
  onUpdateStatus: propsOnUpdateStatus,
  onAddNewCheckForDate,
}) => {
  const financeContext = useFinance();
  const checks = propsChecks || financeContext.checks;
  const loans = financeContext.loans || [];
  const debts = financeContext.debts || [];
  const currency = propsCurrency || financeContext.currency;
  const language = propsLanguage || financeContext.language;
  const onUpdateStatus = propsOnUpdateStatus || financeContext.updateCheckStatus;
  const payLoanInstallment = financeContext.payLoanInstallment;
  const recordDebtPayment = financeContext.recordDebtPayment;

  const isFa = language === 'fa';
  const todayJalali = getTodayJalali();
  const parsedToday = parseJalaliString(todayJalali) || { jy: 1403, jm: 6, jd: 15 };

  // Current calendar month navigation state
  const [currentYear, setCurrentYear] = useState<number>(parsedToday.jy);
  const [currentMonth, setCurrentMonth] = useState<number>(parsedToday.jm);

  // Filter: all | issued | received | loans | debts
  const [filterType, setFilterType] = useState<CalendarEventFilter>('all');

  // Selected Day Modal
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);

  // Next / Prev Month Navigation
  const handleNextMonth = () => {
    const next = getNextJalaliMonth(currentYear, currentMonth);
    setCurrentYear(next.jy);
    setCurrentMonth(next.jm);
  };

  const handlePrevMonth = () => {
    const prev = getPrevJalaliMonth(currentYear, currentMonth);
    setCurrentYear(prev.jy);
    setCurrentMonth(prev.jm);
  };

  const handleGoToToday = () => {
    setCurrentYear(parsedToday.jy);
    setCurrentMonth(parsedToday.jm);
  };

  const monthDaysCount = getJalaliMonthDays(currentYear, currentMonth);
  const firstDayOfWeek = getJalaliDayOfWeek(currentYear, currentMonth, 1); // 0=Sat, 6=Fri

  // Map of day -> events
  const eventsByDay = useMemo(() => {
    const map = new Map<number, {
      checks: CheckItem[];
      loans: LoanItem[];
      debts: DebtItem[];
    }>();

    for (let d = 1; d <= monthDaysCount; d++) {
      map.set(d, { checks: [], loans: [], debts: [] });
    }

    // 1. Checks matching this Jalali Year and Month
    checks.forEach((chk) => {
      const parsed = parseJalaliString(chk.dueJalaliDate);
      if (parsed && parsed.jy === currentYear && parsed.jm === currentMonth) {
        if (parsed.jd >= 1 && parsed.jd <= monthDaysCount) {
          const entry = map.get(parsed.jd);
          if (entry) entry.checks.push(chk);
        }
      }
    });

    // 2. Loans active with installment on this day of month
    loans.forEach((loan) => {
      if (loan.paidInstallments < loan.totalInstallments) {
        const dueDay = Math.min(loan.dueDayOfMonth, monthDaysCount);
        if (dueDay >= 1 && dueDay <= monthDaysCount) {
          const entry = map.get(dueDay);
          if (entry) entry.loans.push(loan);
        }
      }
    });

    // 3. Debts & Receivables due this month
    debts.forEach((debt) => {
      if (!debt.isSettled && debt.dueJalaliDate) {
        const parsed = parseJalaliString(debt.dueJalaliDate);
        if (parsed && parsed.jy === currentYear && parsed.jm === currentMonth) {
          if (parsed.jd >= 1 && parsed.jd <= monthDaysCount) {
            const entry = map.get(parsed.jd);
            if (entry) entry.debts.push(debt);
          }
        }
      }
    });

    return map;
  }, [checks, loans, debts, currentYear, currentMonth, monthDaysCount]);

  // Monthly stats computation
  const monthlyStats = useMemo(() => {
    let issuedSum = 0;
    let receivedSum = 0;
    let loanSum = 0;
    let debtOwedSum = 0;
    let receivableSum = 0;
    let totalEventsCount = 0;

    for (let d = 1; d <= monthDaysCount; d++) {
      const entry = eventsByDay.get(d);
      if (!entry) continue;

      entry.checks.forEach((c) => {
        totalEventsCount++;
        if (c.type === 'issued') issuedSum += c.amount;
        if (c.type === 'received') receivedSum += c.amount;
      });

      entry.loans.forEach((l) => {
        totalEventsCount++;
        loanSum += l.monthlyPayment;
      });

      entry.debts.forEach((db) => {
        totalEventsCount++;
        const remaining = db.totalAmount - db.paidAmount;
        if (db.type === 'debt') debtOwedSum += remaining;
        else receivableSum += remaining;
      });
    }

    const totalOutflow = issuedSum + loanSum + debtOwedSum;
    const totalInflow = receivedSum + receivableSum;

    return {
      issuedSum,
      receivedSum,
      loanSum,
      debtOwedSum,
      receivableSum,
      totalOutflow,
      totalInflow,
      netDiff: totalInflow - totalOutflow,
      totalEventsCount,
    };
  }, [eventsByDay, monthDaysCount]);

  const selectedDayEntry = selectedDayNumber !== null 
    ? eventsByDay.get(selectedDayNumber) 
    : null;

  const selectedDayDateStr = selectedDayNumber !== null 
    ? `${currentYear}/${String(currentMonth).padStart(2, '0')}/${String(selectedDayNumber).padStart(2, '0')}`
    : '';

  const monthName = isFa 
    ? JALALI_MONTH_NAMES_FA[currentMonth - 1] 
    : JALALI_MONTH_NAMES_EN[currentMonth - 1];

  return (
    <div className="space-y-4">
      {/* Calendar Header Bar with Frosted Glass Look */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 transition-all duration-300 relative overflow-hidden">
        {/* Ambient Top Glow Orbs */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Month Title & Nav */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600/15 via-indigo-600/15 to-emerald-600/15 border border-white/40 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shadow-xs">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display">
                  {monthName} {isFa ? toPersianDigits(currentYear) : currentYear}
                </h3>
                {(currentYear !== parsedToday.jy || currentMonth !== parsedToday.jm) && (
                  <button
                    type="button"
                    onClick={handleGoToToday}
                    className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all cursor-pointer border border-blue-200/60 dark:border-blue-800/60"
                  >
                    {isFa ? 'رفتن به امروز' : 'Today'}
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {isFa 
                    ? `تقویم هوشمند تعهدات: ${toPersianDigits(monthlyStats.totalEventsCount)} رویداد مالی در این ماه` 
                    : `Financial Schedule: ${monthlyStats.totalEventsCount} scheduled events this month`}
                </span>
              </p>
            </div>
          </div>

          {/* Controls: Filter Pills & Nav Chevrons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Toggle Pills */}
            <div className="flex items-center p-1 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl text-xs font-bold backdrop-blur-md">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isFa ? 'همه' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setFilterType('issued')}
                className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                  filterType === 'issued'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-rose-600'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                <span>{isFa ? 'چک صادره' : 'Issued'}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('received')}
                className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                  filterType === 'received'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-teal-600'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-teal-500" />
                <span>{isFa ? 'چک دریافتی' : 'Received'}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('loans')}
                className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                  filterType === 'loans'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                <span>{isFa ? 'اقساط وام' : 'Loans'}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('debts')}
                className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                  filterType === 'debts'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-amber-600'
                }`}
              >
                <HandCoins className="w-3.5 h-3.5 text-amber-500" />
                <span>{isFa ? 'بدهی/طلب' : 'Debts'}</span>
              </button>
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-9 h-9 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
                title={isFa ? 'ماه قبل' : 'Previous month'}
              >
                {isFa ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-9 h-9 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
                title={isFa ? 'ماه بعد' : 'Next month'}
              >
                {isFa ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Financial Flow Strip for Month with Glass Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-200/70 dark:border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 backdrop-blur-md flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>{isFa ? 'کل پرداختی‌های موعد ماه' : 'Total Outflow Due'}</span>
              </div>
              <div className="text-base font-black text-rose-700 dark:text-rose-300 mt-1 font-mono-num tracking-tight">
                {formatCurrency(monthlyStats.totalOutflow, currency, isFa)}
              </div>
              <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                {isFa 
                  ? `چک: ${formatCurrency(monthlyStats.issuedSum, currency, isFa)} + قسط: ${formatCurrency(monthlyStats.loanSum, currency, isFa)}`
                  : `Checks: ${formatCurrency(monthlyStats.issuedSum, currency, isFa)}`}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 backdrop-blur-md flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{isFa ? 'کل دریافتی‌های موعد ماه' : 'Total Inflow Due'}</span>
              </div>
              <div className="text-base font-black text-teal-700 dark:text-teal-300 mt-1 font-mono-num tracking-tight">
                {formatCurrency(monthlyStats.totalInflow, currency, isFa)}
              </div>
              <div className="text-[10px] text-teal-600/80 dark:text-teal-400/80 mt-0.5">
                {isFa 
                  ? `چک وصولی: ${formatCurrency(monthlyStats.receivedSum, currency, isFa)}`
                  : `Received: ${formatCurrency(monthlyStats.receivedSum, currency, isFa)}`}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-500/10 border border-slate-500/20 backdrop-blur-md flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {isFa ? 'تراز پیش‌بینی شده نقدینگی' : 'Net Flow Forecast'}
              </div>
              <div className={`text-base font-black mt-1 font-mono-num tracking-tight ${
                monthlyStats.netDiff >= 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {monthlyStats.netDiff > 0 ? '+' : ''}
                {formatCurrency(monthlyStats.netDiff, currency, isFa)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {monthlyStats.netDiff >= 0 
                  ? (isFa ? 'وضعیت تراز ماهانه: مازاد مثبت' : 'Surplus') 
                  : (isFa ? 'نیاز به تأمین نقدینگی' : 'Deficit')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid Canvas with Translucent Glass Panels */}
      <div className="glass-panel rounded-3xl p-3 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Weekdays Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-black">
          {JALALI_WEEK_DAYS_FA.map((dayName, idx) => {
            const isFriday = idx === 6;
            return (
              <div 
                key={`cal-weekday-${dayName}-${idx}`} 
                className={`py-2 rounded-xl backdrop-blur-md transition-colors ${
                  isFriday 
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-500/15 border border-rose-500/20' 
                    : 'text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50'
                }`}
              >
                {isFa ? dayName : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][idx]}
              </div>
            );
          })}
        </div>

        {/* Days Cells Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Start offset empty cells */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div
              key={`cal-offset-empty-${currentYear}-${currentMonth}-${idx}`}
              className="min-h-[88px] sm:min-h-[110px] rounded-2xl bg-slate-100/30 dark:bg-slate-800/20 border border-transparent p-1.5 opacity-25"
            />
          ))}

          {/* Month Day Cells */}
          {Array.from({ length: monthDaysCount }).map((_, idx) => {
            const dayNum = idx + 1;
            const dayEntry = eventsByDay.get(dayNum) || { checks: [], loans: [], debts: [] };

            // Apply active filter
            let filteredChecks = dayEntry.checks;
            let filteredLoans = dayEntry.loans;
            let filteredDebts = dayEntry.debts;

            if (filterType === 'issued') {
              filteredChecks = filteredChecks.filter(c => c.type === 'issued');
              filteredLoans = [];
              filteredDebts = [];
            } else if (filterType === 'received') {
              filteredChecks = filteredChecks.filter(c => c.type === 'received');
              filteredLoans = [];
              filteredDebts = [];
            } else if (filterType === 'loans') {
              filteredChecks = [];
              filteredDebts = [];
            } else if (filterType === 'debts') {
              filteredChecks = [];
              filteredLoans = [];
            }

            const totalEvents = filteredChecks.length + filteredLoans.length + filteredDebts.length;
            const hasEvents = totalEvents > 0;

            const isToday = 
              currentYear === parsedToday.jy && 
              currentMonth === parsedToday.jm && 
              dayNum === parsedToday.jd;

            const dayOfWeek = (firstDayOfWeek + dayNum - 1) % 7;
            const isFriday = dayOfWeek === 6;

            const issuedChecks = filteredChecks.filter(c => c.type === 'issued');
            const receivedChecks = filteredChecks.filter(c => c.type === 'received');

            // Day monetary sum
            const daySum = 
              filteredChecks.reduce((acc, c) => acc + c.amount, 0) +
              filteredLoans.reduce((acc, l) => acc + l.monthlyPayment, 0) +
              filteredDebts.reduce((acc, d) => acc + (d.totalAmount - d.paidAmount), 0);

            return (
              <div
                key={`cal-day-box-${currentYear}-${currentMonth}-${dayNum}`}
                onClick={() => setSelectedDayNumber(dayNum)}
                className={`min-h-[88px] sm:min-h-[110px] rounded-2xl p-1.5 sm:p-2 border transition-all duration-200 flex flex-col justify-between cursor-pointer select-none relative group ${
                  isToday
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10'
                    : isFriday
                    ? 'border-rose-200/70 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20 hover:border-rose-400'
                    : hasEvents
                    ? 'border-slate-200/90 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
                    : 'border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800/80 hover:border-slate-300'
                } backdrop-blur-md`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono-num ${
                      isToday
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : isFriday
                        ? 'text-rose-600 dark:text-rose-400 font-black'
                        : hasEvents
                        ? 'text-slate-900 dark:text-white font-black'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isFa ? toPersianDigits(dayNum) : dayNum}
                  </span>

                  {isToday && (
                    <span className="hidden sm:inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                      {isFa ? 'امروز' : 'Today'}
                    </span>
                  )}

                  {!isToday && totalEvents > 0 && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </div>

                {/* Event Pills Area */}
                <div className="space-y-1 my-1 overflow-hidden">
                  {/* Checks Issued */}
                  {issuedChecks.length > 0 && (
                    <div className="px-1.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 text-[10px] font-bold flex items-center justify-between truncate">
                      <span className="flex items-center gap-0.5 truncate">
                        <ArrowDownRight className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{isFa ? 'چک صادره' : 'Issued'}</span>
                      </span>
                      <span className="font-mono-num text-[9px] shrink-0 mr-1">
                        {isFa ? toPersianDigits(issuedChecks.length) : issuedChecks.length}
                      </span>
                    </div>
                  )}

                  {/* Checks Received */}
                  {receivedChecks.length > 0 && (
                    <div className="px-1.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/80 text-[10px] font-bold flex items-center justify-between truncate">
                      <span className="flex items-center gap-0.5 truncate">
                        <ArrowUpRight className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{isFa ? 'چک دریافتی' : 'Recv'}</span>
                      </span>
                      <span className="font-mono-num text-[9px] shrink-0 mr-1">
                        {isFa ? toPersianDigits(receivedChecks.length) : receivedChecks.length}
                      </span>
                    </div>
                  )}

                  {/* Loans */}
                  {filteredLoans.length > 0 && (
                    <div className="px-1.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 text-[10px] font-bold flex items-center justify-between truncate">
                      <span className="flex items-center gap-0.5 truncate">
                        <CreditCard className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{isFa ? 'قسط وام' : 'Loan'}</span>
                      </span>
                      <span className="font-mono-num text-[9px] shrink-0 mr-1">
                        {isFa ? toPersianDigits(filteredLoans.length) : filteredLoans.length}
                      </span>
                    </div>
                  )}

                  {/* Debts */}
                  {filteredDebts.length > 0 && (
                    <div className="px-1.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 text-[10px] font-bold flex items-center justify-between truncate">
                      <span className="flex items-center gap-0.5 truncate">
                        <HandCoins className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{isFa ? 'بدهی/طلب' : 'Debt'}</span>
                      </span>
                      <span className="font-mono-num text-[9px] shrink-0 mr-1">
                        {isFa ? toPersianDigits(filteredDebts.length) : filteredDebts.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Day Total Amount Footnote */}
                {daySum > 0 ? (
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono-num truncate text-left dir-ltr font-semibold">
                    {formatCurrency(daySum, currency, isFa)}
                  </div>
                ) : (
                  <div className="h-3" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Glass Detail Modal / Sheet */}
      <AnimatePresence>
        {selectedDayNumber !== null && (
          <div key="modal-financial-calendar-overlay" className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              key="modal-financial-calendar-content"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 6 }}
              className="bg-white/95 dark:bg-slate-900/95 border border-white/60 dark:border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] backdrop-blur-2xl text-slate-800 dark:text-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/70 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {isFa 
                        ? `رویدادهای مالی روز ${formatJalaliHuman(selectedDayDateStr, false)}` 
                        : `Events on ${selectedDayDateStr}`}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isFa ? 'چک‌ها، اقساط وام و تعهدات سررسید شده در این تاریخ' : 'Checks, loans and debts due'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDayNumber(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body: Events List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {(!selectedDayEntry || 
                  (selectedDayEntry.checks.length === 0 && 
                   selectedDayEntry.loans.length === 0 && 
                   selectedDayEntry.debts.length === 0)) ? (
                  <div className="text-center py-10 text-slate-400 space-y-3">
                    <Clock className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-semibold">
                      {isFa ? 'برای این تاریخ هیچ چک، قسط یا بدهی ثبت نشده است.' : 'No items due on this date.'}
                    </p>
                    {onAddNewCheckForDate && (
                      <button
                        type="button"
                        onClick={() => {
                          onAddNewCheckForDate(selectedDayDateStr);
                          setSelectedDayNumber(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isFa ? 'ثبت چک در این تاریخ' : 'Add check for this date'}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Checks on this day */}
                    {selectedDayEntry.checks.map((chk, idx) => {
                      const daysRemaining = getDaysRemaining(chk.dueDate);
                      const isCleared = chk.status === 'cleared';
                      const isBounced = chk.status === 'bounced';

                      return (
                        <div
                          key={`cal-modal-check-${chk.id}-${idx}`}
                          className={`p-4 rounded-2xl border transition-all ${
                            isCleared 
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 opacity-80' 
                              : isBounced 
                              ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800' 
                              : 'bg-white dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700/80 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                                chk.type === 'issued'
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200'
                                  : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200'
                              }`}>
                                {chk.type === 'issued' ? (isFa ? 'چک صادره' : 'Issued') : (isFa ? 'چک دریافتی' : 'Received')}
                              </span>
                              <span className="font-mono-num text-xs font-bold text-slate-500">
                                #{chk.checkNumber}
                              </span>
                            </div>

                            <select
                              value={chk.status}
                              onChange={(e) => onUpdateStatus(chk.id, e.target.value as CheckStatus)}
                              className="text-xs font-bold rounded-xl px-2.5 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none cursor-pointer"
                            >
                              <option value="pending">{isFa ? 'در انتظار وصول' : 'Pending'}</option>
                              <option value="cleared">{isFa ? 'وصول شد (پاس شده)' : 'Cleared'}</option>
                              <option value="bounced">{isFa ? 'برگشت خورده' : 'Bounced'}</option>
                              <option value="cancelled">{isFa ? 'باطل شده' : 'Cancelled'}</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between my-2">
                            <div>
                              <div className="text-lg font-black text-slate-900 dark:text-white font-mono-num">
                                {formatCurrency(chk.amount, currency, isFa)}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                <span className="text-slate-400">
                                  {chk.type === 'issued' ? (isFa ? 'در وجه: ' : 'To: ') : (isFa ? 'از طرف: ' : 'From: ')}
                                </span>
                                <span className="font-bold">{chk.recipientOrPayer}</span>
                                <span className="text-slate-400 mr-2">({chk.bankName})</span>
                              </div>
                            </div>

                            <span className={`text-[11px] font-bold px-2 py-1 rounded-xl ${
                              daysRemaining < 0
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : daysRemaining === 0
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                              {daysRemaining === 0
                                ? (isFa ? 'سررسید امروز' : 'Due today')
                                : daysRemaining < 0
                                ? (isFa ? `${toPersianDigits(Math.abs(daysRemaining))} روز گذشته` : `${Math.abs(daysRemaining)}d overdue`)
                                : (isFa ? `${toPersianDigits(daysRemaining)} روز مانده` : `${daysRemaining}d left`)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Loan Installments on this day */}
                    {selectedDayEntry.loans.map((loan, idx) => (
                      <div
                        key={`cal-modal-loan-${loan.id}-${idx}`}
                        className="p-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/30 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                              {isFa ? 'قسط وام بانکی' : 'Loan Installment'}
                            </span>
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                              {loan.title} ({loan.bankName})
                            </span>
                          </div>
                          <div className="text-base font-black text-indigo-700 dark:text-indigo-300 mt-1.5 font-mono-num">
                            {formatCurrency(loan.monthlyPayment, currency, isFa)}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {isFa 
                              ? `قسط ${toPersianDigits(loan.paidInstallments + 1)} از ${toPersianDigits(loan.totalInstallments)}` 
                              : `Installment ${loan.paidInstallments + 1} of ${loan.totalInstallments}`}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            payLoanInstallment(loan.id);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          {isFa ? 'ثبت پرداخت قسط' : 'Mark Paid'}
                        </button>
                      </div>
                    ))}

                    {/* Debts on this day */}
                    {selectedDayEntry.debts.map((debt, idx) => {
                      const remaining = debt.totalAmount - debt.paidAmount;
                      return (
                        <div
                          key={`cal-modal-debt-${debt.id}-${idx}`}
                          className="p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/30 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                                {debt.type === 'debt' ? (isFa ? 'بدهی موعددار' : 'Debt') : (isFa ? 'طلب موعددار' : 'Receivable')}
                              </span>
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                {debt.personName}
                              </span>
                            </div>
                            <div className="text-base font-black text-amber-700 dark:text-amber-300 mt-1.5 font-mono-num">
                              {formatCurrency(remaining, currency, isFa)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              recordDebtPayment(debt.id, remaining);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            {isFa ? 'ثبت تسویه' : 'Settle'}
                          </button>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                {onAddNewCheckForDate && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddNewCheckForDate(selectedDayDateStr);
                      setSelectedDayNumber(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isFa ? 'ثبت چک در این تاریخ' : 'Add check here'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDayNumber(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer mr-auto"
                >
                  {isFa ? 'بستن' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
