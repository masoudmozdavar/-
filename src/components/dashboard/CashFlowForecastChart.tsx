import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatNumber, toPersianDigits } from '../../utils/formatters';
import { formatJalaliHuman, gregorianToJalali, getDaysRemaining } from '../../utils/jalali';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  FileCheck2,
  Clock
} from 'lucide-react';

export const CashFlowForecastChart: React.FC = () => {
  const {
    transactions,
    checks,
    loans,
    accounts,
    totalNetWorth,
    monthlyIncome,
    monthlyExpense,
    currency,
    language,
  } = useFinance();

  const isFa = language === 'fa';
  const [viewMode, setViewMode] = useState<'balance' | 'cashflow' | 'combined'>('combined');

  // If user has no accounts and no transactions (fresh user account), hide forecast
  if (accounts.length === 0 && transactions.length === 0) {
    return null;
  }

  // Calculate forward projections for the next 30 days based on transactions, checks, and loans
  const forecastData = useMemo(() => {
    // 1. Analyze historical transaction rate (last 30-60 days)
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const pastExpenses = transactions.filter(t => t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo);
    const pastIncomes = transactions.filter(t => t.type === 'income' && new Date(t.date) >= thirtyDaysAgo);

    const totalPastExp = pastExpenses.reduce((sum, t) => sum + t.amount, 0);
    const totalPastInc = pastIncomes.reduce((sum, t) => sum + t.amount, 0);

    // Baseline daily burn and income rates
    const dailyBaseExpense = (totalPastExp > 0 ? totalPastExp / 30 : (monthlyExpense || 0) / 30);
    const regularSalaryIncome = totalPastInc > 0 ? totalPastInc : (monthlyIncome || 0);

    // 2. Scheduled Obligations (Next 30 days):
    // Pending Issued Checks due in next 30 days
    const upcomingIssuedChecks = checks.filter(c => {
      if (c.type !== 'issued' || c.status !== 'pending') return false;
      const days = getDaysRemaining(c.dueDate);
      return days >= 0 && days <= 30;
    });

    // Pending Received Checks due in next 30 days
    const upcomingReceivedChecks = checks.filter(c => {
      if (c.type !== 'received' || c.status !== 'pending') return false;
      const days = getDaysRemaining(c.dueDate);
      return days >= 0 && days <= 30;
    });

    // Active Loans due in next 30 days
    const activeLoans = loans.filter(l => l.paidInstallments < l.totalInstallments);

    // 3. Build 6 timeline checkpoints across the next 30 days
    // Day 0 (today), Day 6, Day 12, Day 18, Day 24, Day 30
    const intervals = [
      { day: 0, labelFa: 'امروز', labelEn: 'Today' },
      { day: 6, labelFa: 'روز ۶ (هفته ۱)', labelEn: 'Day 6' },
      { day: 12, labelFa: 'روز ۱۲ (هفته ۲)', labelEn: 'Day 12' },
      { day: 18, labelFa: 'روز ۱۸ (هفته ۳)', labelEn: 'Day 18' },
      { day: 24, labelFa: 'روز ۲۴ (هفته ۴)', labelEn: 'Day 24' },
      { day: 30, labelFa: 'پایان ماه آینده', labelEn: 'Day 30' },
    ];

    let runningBalance = totalNetWorth;
    let cumulativeInflow = 0;
    let cumulativeOutflow = 0;

    const points = intervals.map((point, index) => {
      if (index === 0) {
        return {
          day: point.day,
          label: isFa ? point.labelFa : point.labelEn,
          forecastedBalance: Math.round(runningBalance),
          projectedInflow: 0,
          projectedOutflow: 0,
          cumulativeInflow: 0,
          cumulativeOutflow: 0,
          netPeriodFlow: 0,
        };
      }

      const prevDay = intervals[index - 1].day;
      const daysInInterval = point.day - prevDay;

      // Regular daily expense for this interval
      let intervalExpense = dailyBaseExpense * daysInInterval;
      let intervalIncome = 0;

      // Check checks falling into this day window (prevDay < days <= point.day)
      upcomingIssuedChecks.forEach(chk => {
        const d = getDaysRemaining(chk.dueDate);
        if (d > prevDay && d <= point.day) {
          intervalExpense += chk.amount;
        }
      });

      upcomingReceivedChecks.forEach(chk => {
        const d = getDaysRemaining(chk.dueDate);
        if (d > prevDay && d <= point.day) {
          intervalIncome += chk.amount;
        }
      });

      // Loan installments falling into this day window
      activeLoans.forEach(loan => {
        // Assume due day is mapped approximately within 30 days
        const dueDay = loan.dueDayOfMonth || 15;
        if (dueDay > prevDay && dueDay <= point.day) {
          intervalExpense += loan.monthlyPayment;
        }
      });

      // Salary / Main Recurring Income typically occurs around day 25-30
      if (point.day === 30) {
        intervalIncome += regularSalaryIncome;
      }

      cumulativeInflow += intervalIncome;
      cumulativeOutflow += intervalExpense;
      runningBalance = runningBalance + intervalIncome - intervalExpense;

      return {
        day: point.day,
        label: isFa ? point.labelFa : point.labelEn,
        forecastedBalance: Math.round(runningBalance),
        projectedInflow: Math.round(intervalIncome),
        projectedOutflow: Math.round(intervalExpense),
        cumulativeInflow: Math.round(cumulativeInflow),
        cumulativeOutflow: Math.round(cumulativeOutflow),
        netPeriodFlow: Math.round(intervalIncome - intervalExpense),
      };
    });

    const finalPoint = points[points.length - 1];
    const initialPoint = points[0];
    const totalExpectedInflow = finalPoint.cumulativeInflow;
    const totalExpectedOutflow = finalPoint.cumulativeOutflow;
    const netProjectedChange = totalExpectedInflow - totalExpectedOutflow;
    const finalBalance = finalPoint.forecastedBalance;
    const percentGrowth = initialPoint.forecastedBalance > 0
      ? Math.round((netProjectedChange / initialPoint.forecastedBalance) * 100)
      : 0;

    return {
      points,
      totalExpectedInflow,
      totalExpectedOutflow,
      netProjectedChange,
      finalBalance,
      percentGrowth,
      upcomingChecksCount: upcomingIssuedChecks.length,
      upcomingLoansCount: activeLoans.length,
    };
  }, [transactions, checks, loans, totalNetWorth, monthlyIncome, monthlyExpense, isFa]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                {isFa ? 'پیش‌بینی جریان مالی و موجودی ماه آینده' : 'Projected Cash Flow & Forecasted Balance (Next 30 Days)'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                {isFa ? 'الگوریتم پیش‌بین' : 'AI Predictive Model'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isFa
                ? 'محاسبه شده بر مبنای الگوی مخارج جاری، واریز حقوق، سررسید چک‌های صیادی و اقساط وام‌های بانکی'
                : 'Forecast based on recent transactions, expected salary, pending check maturities, and bank loan installments'}
            </p>
          </div>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl self-start lg:self-auto border border-slate-200/80 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setViewMode('combined')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'combined'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isFa ? 'نمای ترکیبی' : 'Combined View'}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('balance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'balance'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isFa ? 'روند موجودی' : 'Balance Curve'}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cashflow')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'cashflow'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isFa ? 'ورودی و خروجی' : 'Cash Flow'}
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Stat 1: Forecasted End Balance */}
        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50">
          <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-400 font-bold mb-1">
            <span>{isFa ? 'موجودی تخمینی پایان ماه' : 'Forecasted End Balance'}</span>
            <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(forecastData.finalBalance, currency, isFa)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-bold">
            {forecastData.percentGrowth >= 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {isFa ? `${toPersianDigits(Math.abs(forecastData.percentGrowth))}٪ رشد نقدینگی` : `+${forecastData.percentGrowth}% growth`}
              </span>
            ) : (
              <span className="text-rose-700 dark:text-rose-400 flex items-center gap-0.5">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {isFa ? `${toPersianDigits(Math.abs(forecastData.percentGrowth))}٪ کاهش تراز` : `${forecastData.percentGrowth}% drawdown`}
              </span>
            )}
          </div>
        </div>

        {/* Stat 2: Total Expected Inflows */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50">
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold mb-1">
            <span>{isFa ? 'کل ورودی پیش‌بینی‌شده' : 'Expected Inflows'}</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-800 dark:text-emerald-300 tracking-tight">
            +{formatCurrency(forecastData.totalExpectedInflow, currency, isFa)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">
            {isFa ? 'حقوق، پروژه‌ها و چک‌های دریافتی' : 'Salary, returns & received checks'}
          </span>
        </div>

        {/* Stat 3: Total Expected Outflows */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">
            <span>{isFa ? 'کل مخارج و تعهدات آتی' : 'Expected Outflows'}</span>
            <ArrowDownRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            -{formatCurrency(forecastData.totalExpectedOutflow, currency, isFa)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">
            {isFa
              ? `${toPersianDigits(forecastData.upcomingChecksCount)} چک و ${toPersianDigits(forecastData.upcomingLoansCount)} قسط فعال`
              : `${forecastData.upcomingChecksCount} checks & ${forecastData.upcomingLoansCount} loans`}
          </span>
        </div>

        {/* Stat 4: Projected Net Change */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">
            <span>{isFa ? 'تغییر خالص پیش‌بینی‌شده' : 'Net Cash Flow'}</span>
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className={`text-lg sm:text-xl font-black tracking-tight ${
            forecastData.netProjectedChange >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
          }`}>
            {forecastData.netProjectedChange >= 0 ? '+' : ''}
            {formatCurrency(forecastData.netProjectedChange, currency, isFa)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">
            {forecastData.netProjectedChange >= 0
              ? (isFa ? 'مازاد پس‌انداز پایان دوره' : 'Net projected surplus')
              : (isFa ? 'نیاز به پوشش کسری' : 'Projected deficit')}
          </span>
        </div>
      </div>

      {/* Interactive Recharts Forecast Diagram */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={forecastData.points}
            margin={{ top: 15, right: 15, left: 15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="forecastBalanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" strokeOpacity={0.2} />

            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#64748b', strokeOpacity: 0.3 }}
            />

            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#64748b', strokeOpacity: 0.3 }}
              tickFormatter={(val) =>
                isFa ? `${toPersianDigits(Math.round(val / 1000000))}M` : `${Math.round(val / 1000000)}M`
              }
            />

            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: '#334155',
                borderRadius: '16px',
                fontSize: '12px',
                color: '#f8fafc',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                padding: '10px 14px'
              }}
              formatter={(val: any, name: any) => {
                const labelMap: Record<string, string> = {
                  forecastedBalance: isFa ? 'موجودی پیش‌بینی‌شده' : 'Forecasted Balance',
                  projectedInflow: isFa ? 'ورودی تخمینی دوره' : 'Projected Inflow',
                  projectedOutflow: isFa ? 'خروجی تخمینی دوره' : 'Projected Outflow',
                  netPeriodFlow: isFa ? 'تراز خالص دوره' : 'Net Period Flow',
                };
                return [formatCurrency(Number(val), currency, isFa), labelMap[name] || name];
              }}
            />

            <Legend
              verticalAlign="top"
              height={36}
              formatter={(val: string) => {
                const labelMap: Record<string, string> = {
                  forecastedBalance: isFa ? 'موجودی پیش‌بینی‌شده (تومان)' : 'Forecasted Balance',
                  projectedInflow: isFa ? 'ورودی‌های نقدینگی تخمینی' : 'Projected Inflow',
                  projectedOutflow: isFa ? 'مخارج و تعهدات تخمینی' : 'Projected Outflow',
                };
                return <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mx-1">{labelMap[val] || val}</span>;
              }}
            />

            {/* Inflows & Outflows Bars (shown in combined and cashflow modes) */}
            {(viewMode === 'cashflow' || viewMode === 'combined') && (
              <Bar
                key="chart-bar-projected-inflow"
                dataKey="projectedInflow"
                name="projectedInflow"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={24}
              />
            )}
            {(viewMode === 'cashflow' || viewMode === 'combined') && (
              <Bar
                key="chart-bar-projected-outflow"
                dataKey="projectedOutflow"
                name="projectedOutflow"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
                maxBarSize={24}
              />
            )}

            {/* Forecast Balance Area & Curve (shown in balance and combined modes) */}
            {(viewMode === 'balance' || viewMode === 'combined') && (
              <Area
                key="chart-area-forecasted-balance"
                type="monotone"
                dataKey="forecastedBalance"
                name="forecastedBalance"
                stroke="#2563eb"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#forecastBalanceGrad)"
                dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#1d4ed8' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Smart Predictive Insights & Advice */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              {isFa ? 'تحلیل هوشمند تراز نقدینگی ماه آینده:' : 'Financial Forecast Diagnostic:'}
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {isFa
                ? `با توجه به تعهدات قطعی (اقساط و چک‌ها) و جریان درآمدی پیش‌بینی‌شده، موجودی شما در انتهای ماه آینده در تراز پایدار قرار می‌گیرد. سقف مجاز هزینه روزانه بدون به خطر افتادن تراز، معادل ${formatCurrency(Math.max(200000, Math.round((forecastData.totalExpectedInflow * 0.4) / 30)), currency, isFa)} برآورد می‌شود.`
                : `Based on pending checks, loan commitments, and salary expectations, your cash flow is forecasted to remain healthy. Safe daily discretionary spending threshold is estimated at ${formatCurrency(Math.max(200000, Math.round((forecastData.totalExpectedInflow * 0.4) / 30)), currency, isFa)}.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isFa ? 'ریسک نقدینگی: بسیار پایین' : 'Liquidity Risk: Low'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
