import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatNumber, maskCardNumber, toPersianDigits } from '../../utils/formatters';
import { formatJalaliHuman, getDaysRemaining } from '../../utils/jalali';
import { IconRenderer } from '../common/IconRenderer';
import { PrioritizedAlertsBanner } from '../notifications/PrioritizedAlertsBanner';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Plus, 
  ArrowLeftRight,
  CheckCircle2,
  CalendarDays,
  Target,
  ShieldCheck,
  CreditCard,
  BellRing,
  SlidersHorizontal,
  AlertTriangle,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { CashFlowForecastChart } from './CashFlowForecastChart';
import { HighValueAlertBanner } from './HighValueAlertBanner';
import { SmartBudgetAlertsBanner } from './SmartBudgetAlertsBanner';
import { CategoryBudgetWarningWidget } from './CategoryBudgetWarningWidget';
import { D3LiquidityDonutWidget } from './D3LiquidityDonutWidget';
import { UnrealizedPnLWidget } from '../investments/UnrealizedPnLWidget';
import { MarketRatesWidget } from '../market/MarketRatesWidget';
import { FamilyExpensesBarWidget } from './FamilyExpensesBarWidget';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const DashboardOverview: React.FC = () => {
  const {
    totalNetWorth,
    monthlyIncome,
    monthlyExpense,
    monthlySavings,
    pendingIssuedChecks,
    pendingReceivedChecks,
    accounts,
    transactions,
    categories,
    checks,
    loans,
    goals,
    currency,
    language,
    openTransactionModal,
    setActiveTab,
    financialHealthScore,
    budgetAlerts,
    currentUser,
  } = useFinance();

  const isFa = language === 'fa';

  // Savings rate calculation
  const savingsRate = monthlyIncome > 0 
    ? Math.round((monthlySavings / monthlyIncome) * 100) 
    : 0;

  // Recent 6 transactions
  const recentTransactions = transactions.slice(0, 6);

  // Category expense breakdown for donut chart
  const categoryExpenses = React.useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach(t => {
      if (t.type === 'expense') {
        map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
      }
    });

    return Array.from(map.entries()).map(([catId, amount], idx) => {
      const cat = categories.find(c => c.id === catId);
      return {
        id: catId || `cat-exp-${idx}`,
        name: cat ? (isFa ? cat.name : cat.nameEn) : (isFa ? `سایر (${idx + 1})` : `Other (${idx + 1})`),
        amount,
        color: cat?.color || '#3b82f6',
        icon: cat?.icon || 'ShoppingBag',
      };
    }).sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [transactions, categories, isFa]);

  // Cashflow recent data for bar chart
  const cashflowData = React.useMemo(() => {
    if (transactions.length === 0) return [];
    return [
      { month: isFa ? 'ماه جاری' : 'Current Month', income: monthlyIncome, expense: monthlyExpense },
    ];
  }, [transactions.length, monthlyIncome, monthlyExpense, isFa]);

  // Pending Checks coming up in next 30 days
  const upcomingChecks = checks
    .filter(c => c.status === 'pending')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Real-time High Value Transaction Alerts for Head */}
      <HighValueAlertBanner />

      {/* Proactive Smart Budget Alerts & Forecast Warnings for Head of Family */}
      <SmartBudgetAlertsBanner />

      {/* Top Prioritized Due Dates & Financial Alerts Banner */}
      <PrioritizedAlertsBanner />

      {/* Empty State Onboarding Card for New Users / Clean Workspace */}
      {accounts.length === 0 && (
        <div className="p-6 sm:p-8 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-blue-200/70 dark:border-blue-900/50 rounded-3xl relative overflow-hidden shadow-xs">
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>{isFa ? 'فضای حسابداری اختصاصی آماده است' : 'Personal Finance Space Ready'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isFa 
                  ? `به جیبینو خوش آمدید${currentUser?.name ? `، ${currentUser.name}` : ''}!`
                  : `Welcome to Jibino${currentUser?.name ? `, ${currentUser.name}` : ''}!`}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {isFa
                  ? 'سامانه آماده ثبت امور مالی شماست. برای شروع، ابتدا کارت‌ها یا حساب‌های بانکی خود را تعریف کنید و سپس تراکنش‌های دخل و خرجتان را وارد نمایید.'
                  : 'Your workspace is ready. To begin tracking your personal finances, define your bank accounts or cards, then log your daily transactions.'}
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveTab('accounts')}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isFa ? 'گام ۱: تعریف حساب بانکی' : 'Step 1: Add Account'}</span>
              </button>
              <button
                onClick={() => openTransactionModal()}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>{isFa ? 'گام ۲: ثبت تراکنش' : 'Step 2: Add Transaction'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top 4 KPI Metric Cards (Modern sleek layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Net Worth (Sleek Indigo Stat Card) */}
        <div className="card-stat-indigo card-pro-hover p-6 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {isFa ? 'ارزش کل دارایی‌ها' : 'CURRENT BALANCE'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2.5 tracking-tight">
              {formatCurrency(totalNetWorth, currency, isFa)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            <ArrowUpRight className="w-4 h-4" />
            <span>{isFa ? `${toPersianDigits(accounts.length)} حساب و کارت بانکی فعال` : `${accounts.length} active accounts`}</span>
          </div>
        </div>

        {/* Card 2: Monthly Cashflow Hero (Sleek Dark Hero Card) */}
        <div className="card-dark-hero p-6 flex flex-col justify-between text-white relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-gradient-to-br from-indigo-500/30 to-purple-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                {isFa ? 'جریان نقدینگی ماه' : 'MONTHLY CASHFLOW'}
              </span>
              <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                {savingsRate >= 20 ? (isFa ? 'تراز مطلوب' : 'Surplus') : (isFa ? 'تراز عادی' : 'Balanced')}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <span className="text-[11px] text-slate-400 block">{isFa ? 'درآمد کل' : 'Income'}</span>
                <span className="text-base sm:text-lg font-black text-emerald-400">
                  {formatCurrency(monthlyIncome, currency, isFa)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">{isFa ? 'مخارج کل' : 'Expense'}</span>
                <span className="text-base sm:text-lg font-black text-rose-400">
                  {formatCurrency(monthlyExpense, currency, isFa)}
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between pt-3 border-t border-slate-700/60 mt-2 text-xs text-slate-300">
            <span>{isFa ? 'نرخ پس‌انداز ماه:' : 'Savings Rate:'}</span>
            <span className="font-bold text-indigo-300">{isFa ? toPersianDigits(savingsRate) : savingsRate}%</span>
          </div>
        </div>

        {/* Card 3: Monthly Net Savings (Sleek Emerald Stat Card) */}
        <div className="card-stat-emerald card-pro-hover p-6 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {isFa ? 'پس‌انداز خالص ماه' : 'NET SAVINGS'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                <PiggyBank className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2.5 tracking-tight">
              {formatCurrency(monthlySavings, currency, isFa)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{isFa ? `افزوده‌شده به ذخایر دارایی` : `Added to capital reserves`}</span>
          </div>
        </div>

        {/* Card 4: Financial Health Score (Sleek Pro Card) */}
        <div className="card-pro card-pro-hover p-6 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {isFa ? 'امتیاز سلامت مالی' : 'HEALTH SCORE'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2.5 tracking-tight flex items-baseline gap-1">
              <span>{isFa ? toPersianDigits(financialHealthScore) : financialHealthScore}</span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">/100</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${financialHealthScore}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Family Member Spending Comparison Bar Widget (Requested) */}
      <FamilyExpensesBarWidget />

      {/* D3.js Liquid vs Non-Liquid Donut Chart & Emergency Runway Widget */}
      <D3LiquidityDonutWidget />

      {/* Unrealized Profit & Loss (P&L) Tracker for Gold & Foreign Currencies */}
      <UnrealizedPnLWidget />

      {/* Real-time Category Budget Warning System (80% and 100% Threshold Monitor) */}
      <CategoryBudgetWarningWidget />

      {/* Live Market Rates & Converter Widget */}
      <MarketRatesWidget />

      {/* Main Grid: Charts & Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Bar Chart (2 columns on large) */}
        <div className="lg:col-span-2 card-pro p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {isFa ? 'روند جریان نقدینگی (درآمد و هزینه)' : 'Cash Flow Trend'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isFa ? 'مقایسه ۵ ماه اخیر بر مبنای ورودی و خروجی نقدینگی' : '5-month income vs expense performance'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span className="text-slate-600 dark:text-slate-300">{isFa ? 'درآمد' : 'Income'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-600 dark:text-slate-300">{isFa ? 'هزینه' : 'Expense'}</span>
              </div>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mb-3">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {isFa ? 'نمودار جریان نقدینگی خالی است' : 'No Cash Flow Data'}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mb-4">
                {isFa ? 'با ثبت درآمدهای ماهانه و هزینه‌های روزانه، مقایسه جریان نقدینگی در این نمودار نمایش داده می‌شود.' : 'Log your income and expenses to track cash flow.'}
              </p>
              <button
                onClick={() => openTransactionModal()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                {isFa ? '+ ثبت اولین تراکنش واقعی' : '+ Record First Transaction'}
              </button>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis 
                    dataKey="month" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={{ stroke: '#64748b', strokeOpacity: 0.3 }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#64748b', strokeOpacity: 0.3 }}
                    tickFormatter={(val) => isFa ? `${toPersianDigits(Math.round(val / 1000000))}M` : `${Math.round(val / 1000000)}M`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderColor: '#334155', 
                      borderRadius: '16px',
                      fontSize: '12px',
                      color: '#f8fafc',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val), currency, isFa), '']}
                  />
                  <Bar key="dash-bar-income" dataKey="income" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={28} />
                  <Bar key="dash-bar-expense" dataKey="expense" fill="#f43f5e" radius={[8, 8, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Expense Category Donut Distribution */}
        <div className="card-pro p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              {isFa ? 'بیشترین سرفصل‌های هزینه' : 'Spending by Category'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {isFa ? 'تفکیک مخارج ماه جاری به تفکیک دسته' : 'Monthly expense distribution'}
            </p>

            {categoryExpenses.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {isFa ? 'هنوز هزینه‌ای در این ماه ثبت نشده است' : 'No expenses recorded yet'}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
                  {isFa ? 'با ثبت اولین هزینه، سهم هر دسته‌بندی مشخص می‌شود.' : 'Categorized expense distribution will appear here.'}
                </span>
              </div>
            ) : (
              <div className="h-44 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryExpenses}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={4}
                    >
                      {categoryExpenses.map((entry, index) => (
                        <Cell key={`dash-pie-cell-${entry.id || entry.name}-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                        borderColor: '#334155', 
                        borderRadius: '16px',
                        fontSize: '12px',
                        color: '#f8fafc',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                      }}
                      formatter={(val: any) => [formatCurrency(Number(val), currency, isFa), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase">{isFa ? 'کل مخارج' : 'Total'}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {formatCurrency(monthlyExpense, currency, isFa)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          {categoryExpenses.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              {categoryExpenses.map((item, idx) => (
                <div key={`dash-legend-${item.id || item.name}-${idx}`} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.amount, currency, isFa)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Predictive Cash Flow & Forecasted Balance for Next Month */}
      <CashFlowForecastChart />

      {/* Secondary Row: Bank Accounts Preview & Upcoming Due Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts & Cards Preview */}
        <div className="lg:col-span-2 card-pro p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {isFa ? 'کارت‌ها و حساب‌های بانکی' : 'Accounts & Cards'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {isFa ? `${toPersianDigits(accounts.length)} حساب` : `${accounts.length} accounts`}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('accounts')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>{isFa ? 'مدیریت و کارت جدید' : 'Manage All'}</span>
              <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>

          {/* Cards Grid */}
          {accounts.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2.5">
                <CreditCard className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isFa ? 'هیچ حساب یا کارت بانکی تعریف نشده است' : 'No accounts or cards defined yet'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-3">
                {isFa ? 'برای شروع مدیریت مالی، اولین حساب یا کارت خود را اضافه کنید.' : 'Add your first account to begin managing your money.'}
              </p>
              <button
                onClick={() => setActiveTab('accounts')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {isFa ? '+ تعریف اولین حساب بانکی' : '+ Add First Account'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {accounts.slice(0, 3).map((acc, idx) => (
                <div
                  key={`dash-acc-${acc.id}-${idx}`}
                  className={`bg-gradient-to-br ${acc.color || 'from-slate-800 to-slate-900'} p-4 rounded-2xl shadow-md text-white relative overflow-hidden flex flex-col justify-between h-36`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white tracking-wide truncate max-w-[130px]">
                      {acc.name}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-white/90 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
                      {acc.type === 'bank' ? 'بانکی' : acc.type === 'gold' ? 'طلا' : acc.type === 'crypto' ? 'کریپتو' : 'نقدی'}
                    </span>
                  </div>

                  <div className="my-1">
                    <div className="text-[10px] text-white/70">{isFa ? 'موجودی فعلی' : 'Balance'}</div>
                    <div className="text-lg font-black text-white tracking-tight">
                      {formatCurrency(acc.balance, currency, isFa)}
                    </div>
                  </div>

                  <div className="text-[10px] text-white/80 font-mono tracking-wider">
                    {acc.cardNumber ? maskCardNumber(acc.cardNumber) : acc.bankName || 'حساب نقدی'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Due Dates (Checks & Installments) */}
        <div className="card-pro p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {isFa ? 'سررسید چک‌ها و اقساط' : 'Upcoming Due Dates'}
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('checks_loans')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold cursor-pointer"
              >
                {isFa ? 'مشاهده همه' : 'View all'}
              </button>
            </div>

            {upcomingChecks.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
                {isFa ? 'هیچ چک در انتظار وصلی وجود ندارد.' : 'No pending checks found.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingChecks.map((chk, idx) => {
                  const days = getDaysRemaining(chk.dueDate);
                  const isPast = days < 0;
                  const isToday = days === 0;

                  return (
                    <div
                      key={`dash-upcoming-chk-${chk.id}-${idx}`}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[10px] ${
                          chk.type === 'issued' ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900' : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                        }`}>
                          {chk.type === 'issued' ? 'صادر' : 'دریافت'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                            {chk.recipientOrPayer}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {formatJalaliHuman(chk.dueJalaliDate, !isFa)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right rtl:text-right ltr:text-left">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(chk.amount, currency, isFa)}
                        </div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isPast ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300' : isToday ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {isPast 
                            ? (isFa ? `${toPersianDigits(Math.abs(days))} روز گذشته` : `${Math.abs(days)}d past`) 
                            : isToday 
                            ? (isFa ? 'سررسید امروز!' : 'Due today') 
                            : (isFa ? `${toPersianDigits(days)} روز مانده` : `${days}d left`)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick saving goal preview */}
          {goals[0] && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">{goals[0].title}</span>
                </div>
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {isFa ? toPersianDigits(Math.round((goals[0].currentAmount / goals[0].targetAmount) * 100)) : Math.round((goals[0].currentAmount / goals[0].targetAmount) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${Math.min(100, (goals[0].currentAmount / goals[0].targetAmount) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Feed */}
      <div className="card-pro p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {isFa ? 'آخرین تراکنش‌های ثبت‌شده' : 'Recent Transactions'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isFa ? 'تاریخچه فوری گردش‌های مالی حساب‌ها' : 'Latest financial activities'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{isFa ? 'مشاهده همه تراکنش‌ها' : 'View All'}</span>
            <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              {isFa ? 'هنوز تراکنشی ثبت نشده است.' : 'No transactions recorded yet.'}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 max-w-xs">
              {isFa ? 'با ثبت درآمدهای ماهانه یا مخارج روزمره، گزارش‌ها و تاریخچه گردش‌های مالی فعال خواهند شد.' : 'Record your daily income or expenses to start building your transaction history.'}
            </p>
            <button
              onClick={() => openTransactionModal()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              {isFa ? '+ ثبت اولین تراکنش واقعی' : '+ Record First Transaction'}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.map((tx, idx) => {
              const cat = categories.find(c => c.id === tx.categoryId);
              const acc = accounts.find(a => a.id === tx.accountId);
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={`dash-tx-recent-${tx.id}-${idx}`}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 px-2 rounded-2xl transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center border font-bold shrink-0"
                      style={{
                        backgroundColor: isTransfer ? '#eff6ff' : isIncome ? '#ecfdf5' : '#fef2f2',
                        borderColor: isTransfer ? '#bfdbfe' : isIncome ? '#a7f3d0' : '#fecaca',
                        color: isTransfer ? '#2563eb' : isIncome ? '#059669' : '#dc2626',
                      }}
                    >
                      <IconRenderer name={cat?.icon || (isTransfer ? 'ArrowLeftRight' : 'CreditCard')} size={18} />
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {tx.description || (cat ? (isFa ? cat.name : cat.nameEn) : 'تراکنش')}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-medium">{cat ? (isFa ? cat.name : cat.nameEn) : ''}</span>
                        <span>•</span>
                        <span>{acc?.name || 'حساب'}</span>
                        <span>•</span>
                        <span>{isFa ? toPersianDigits(tx.jalaliDate) : tx.date}</span>
                        {tx.memberName && (
                          <>
                            <span>•</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">
                              👤 {tx.memberName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right rtl:text-right ltr:text-left">
                    <div className={`font-black text-sm ${
                      isTransfer ? 'text-blue-600 dark:text-blue-400' : isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(tx.amount, currency, isFa)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
