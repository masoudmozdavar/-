import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Category, SavingGoal } from '../../types';
import { formatCurrency, fromPersianDigits, toPersianDigits } from '../../utils/formatters';
import { formatJalaliHuman, getDaysRemaining, getTodayISO, getTodayJalali } from '../../utils/jalali';
import { PersianDatePicker } from '../common/PersianDatePicker';
import { IconRenderer } from '../common/IconRenderer';
import confetti from 'canvas-confetti';
import { 
  Target, 
  PiggyBank, 
  Plus, 
  Trash2, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Coins, 
  Calendar, 
  X,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  SlidersHorizontal,
  Pencil,
  BellRing,
  AlertOctagon,
  Info,
  ShieldAlert,
  CalendarClock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const BudgetsAndGoalsManager: React.FC = () => {
  const {
    categories,
    transactions,
    goals,
    addGoal,
    addFundsToGoal,
    deleteGoal,
    updateCategoryBudget,
    budgetAlerts,
    smartBudgetAlerts,
    isHeadOfFamily,
    setActiveTab,
    accounts,
    currency,
    language,
  } = useFinance();

  const isFa = language === 'fa';

  // Modals state
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [fundingGoal, setFundingGoal] = useState<SavingGoal | null>(null);
  const [fundingAmountStr, setFundingAmountStr] = useState('');
  const [fundingAccountId, setFundingAccountId] = useState(accounts[0]?.id || '');

  // Category Budget Management Modal state
  const [isManageBudgetsOpen, setIsManageBudgetsOpen] = useState(false);
  const [selectedCatIdForEdit, setSelectedCatIdForEdit] = useState<string>('');
  const [catLimitStr, setCatLimitStr] = useState<string>('');

  // Add goal state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState('پس‌انداز');
  const [goalTargetStr, setGoalTargetStr] = useState('');
  const [goalCurrentStr, setGoalCurrentStr] = useState('0');
  const [goalJalaliDate, setGoalJalaliDate] = useState(getTodayJalali());
  const [goalIsoDate, setGoalIsoDate] = useState(getTodayISO());
  const [goalNotes, setGoalNotes] = useState('');

  // Calculate monthly spent per category
  const categoryBudgets = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const spentMap = new Map<string, number>();
    transactions.forEach(t => {
      if (t.type === 'expense') {
        const d = new Date(t.date);
        if (d >= thirtyDaysAgo) {
          spentMap.set(t.categoryId, (spentMap.get(t.categoryId) || 0) + t.amount);
        }
      }
    });

    return categories
      .filter(c => c.type === 'expense' && (c.budgetMonthly || 0) > 0)
      .map(cat => {
        const spent = spentMap.get(cat.id) || 0;
        const limit = cat.budgetMonthly || 1;
        const pct = Math.min(100, Math.round((spent / limit) * 100));
        const isOver = spent > limit;
        return {
          ...cat,
          spent,
          limit,
          pct,
          isOver,
        };
      }).sort((a, b) => b.pct - a.pct);
  }, [categories, transactions]);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const rawTarget = Number(fromPersianDigits(goalTargetStr.replace(/,/g, ''))) || 0;
    const rawCurrent = Number(fromPersianDigits(goalCurrentStr.replace(/,/g, ''))) || 0;

    if (rawTarget <= 0 || !goalTitle) return;

    addGoal({
      title: goalTitle,
      category: goalCategory,
      targetAmount: rawTarget,
      currentAmount: rawCurrent,
      targetDate: goalIsoDate,
      targetJalaliDate: goalJalaliDate,
      color: '#3b82f6',
      icon: 'Target',
      notes: goalNotes,
    });

    setIsAddGoalOpen(false);
    setGoalTitle('');
    setGoalTargetStr('');
    setGoalCurrentStr('0');
    setGoalNotes('');
  };

  const handleDepositToGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundingGoal) return;
    const rawAmt = Number(fromPersianDigits(fundingAmountStr.replace(/,/g, ''))) || 0;
    if (rawAmt <= 0) return;

    addFundsToGoal(fundingGoal.id, rawAmt, fundingAccountId || undefined);

    // If reaches 100%, trigger confetti
    if (fundingGoal.currentAmount + rawAmt >= fundingGoal.targetAmount) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }

    setFundingGoal(null);
    setFundingAmountStr('');
  };

  const handleOpenEditCategoryBudget = (catId?: string) => {
    const defaultCat = catId 
      ? categories.find(c => c.id === catId)
      : categories.find(c => c.type === 'expense');
    if (defaultCat) {
      setSelectedCatIdForEdit(defaultCat.id);
      setCatLimitStr(defaultCat.budgetMonthly ? String(defaultCat.budgetMonthly) : '');
    }
    setIsManageBudgetsOpen(true);
  };

  const handleSaveCategoryBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatIdForEdit) return;
    const rawLimit = Number(fromPersianDigits(catLimitStr.replace(/,/g, ''))) || 0;
    updateCategoryBudget(selectedCatIdForEdit, rawLimit);
    setIsManageBudgetsOpen(false);
  };

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {isFa ? 'بودجه‌بندی ماهانه و اهداف پس‌انداز' : 'Budgets & Financial Goals'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isFa ? 'پایش سقف هزینه‌های ماهانه به تفکیک دسته و برنامه‌ریزی اهداف خرید و سرمایه‌گذاری' : 'Control spending limits and achieve long-term savings goals'}
          </p>
        </div>

        <button
          onClick={() => setIsAddGoalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isFa ? 'هدف پس‌انداز جدید' : 'New Savings Goal'}</span>
        </button>
      </div>

      {/* SECTION 1: SAVING GOALS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">{isFa ? 'اهداف و صندوق‌های پس‌انداز' : 'Savings Goals'}</h3>
          </div>
        </div>

        {goals.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
            {isFa ? 'هنوز هدفی تعریف نکرده‌اید. با ایجاد هدف، انگیزه پس‌انداز خود را چند برابر کنید.' : 'No active savings goals. Create one to get started!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {goals.map((g, idx) => {
              const rawPct = Math.round((g.currentAmount / g.targetAmount) * 100);
              const pct = Math.min(100, rawPct);
              const remaining = Math.max(0, g.targetAmount - g.currentAmount);
              const days = getDaysRemaining(g.targetDate);
              const isCompleted = g.currentAmount >= g.targetAmount;

              return (
                <div
                  key={`goal-item-${g.id}-${idx}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                          {g.category}
                        </span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{isFa ? 'هدف محقق شد!' : 'Achieved!'}</span>
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">{g.title}</h4>
                      {g.notes && <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">{g.notes}</p>}
                    </div>

                    <button
                      onClick={() => deleteGoal(g.id)}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                      title={isFa ? 'حذف هدف' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* VISUAL PROGRESS BAR (نمای بصری پیشرفت درصد تحقق هدف) */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{isFa ? 'میزان پیشرفت هدف' : 'Target Progress'}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-black flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                          : pct >= 50
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                          : 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                      }`}>
                        {isCompleted && <Sparkles className="w-3 h-3" />}
                        <span>{isFa ? toPersianDigits(rawPct) : rawPct}٪</span>
                      </span>
                    </div>

                    {/* Progress Bar with Milestone Markers */}
                    <div className="relative w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700/60 overflow-hidden shadow-inner p-0.5">
                      {/* Milestone indicators at 25%, 50%, 75% */}
                      <div className="absolute top-0 bottom-0 left-1/4 w-[1px] bg-white/40 dark:bg-slate-600 z-10 pointer-events-none" />
                      <div className="absolute top-0 bottom-0 left-2/4 w-[1px] bg-white/40 dark:bg-slate-600 z-10 pointer-events-none" />
                      <div className="absolute top-0 bottom-0 left-3/4 w-[1px] bg-white/40 dark:bg-slate-600 z-10 pointer-events-none" />

                      <div
                        className={`h-full rounded-full transition-all duration-700 relative ${
                          isCompleted
                            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400'
                            : pct >= 50
                            ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500'
                            : 'bg-gradient-to-r from-amber-500 via-orange-500 to-blue-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Milestone and Remaining text */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>
                        {isCompleted
                          ? (isFa ? '۱۰۰٪ هدف تکمیل شده است' : '100% completed')
                          : isFa
                          ? `باقیمانده: ${formatCurrency(remaining, currency, isFa)}`
                          : `Remaining: ${formatCurrency(remaining, currency, isFa)}`}
                      </span>
                      <span className="font-bold text-[10px]">
                        {days > 0 
                          ? (isFa ? `${toPersianDigits(days)} روز مانده` : `${days}d left`)
                          : (isFa ? 'موعد گذشته' : 'Due passed')}
                      </span>
                    </div>
                  </div>

                  {/* Amounts Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{isFa ? 'پس‌انداز شده' : 'Saved'}</div>
                      <div className="font-black text-slate-900 dark:text-white text-sm mt-0.5">{formatCurrency(g.currentAmount, currency, isFa)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{isFa ? 'مبلغ هدف' : 'Target'}</div>
                      <div className="font-black text-blue-600 dark:text-blue-400 text-sm mt-0.5">{formatCurrency(g.targetAmount, currency, isFa)}</div>
                    </div>
                  </div>

                  {/* Target Date & Deposit Button */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                      <span>{formatJalaliHuman(g.targetJalaliDate, !isFa)}</span>
                    </div>

                    <button
                      onClick={() => {
                        setFundingGoal(g);
                        setFundingAmountStr('');
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>{isFa ? 'واریز پس‌انداز' : 'Add Funds'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: CATEGORY MONTHLY BUDGETS & SMART ALERTS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-base text-slate-900">{isFa ? 'سقف بودجه‌بندی ماهانه دسته‌ها' : 'Monthly Category Budgets'}</h3>
              <p className="text-xs text-slate-500">
                {isFa ? 'هشدار خودکار هنگام رسیدن هزینه به ۸۰٪ و فراتر از سقف بودجه' : 'Automated warnings when spending reaches 80% and over budget limit'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenEditCategoryBudget()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{isFa ? 'تنظیم و ویرایش سقف بودجه دسته‌ها' : 'Set & Manage Budgets'}</span>
          </button>
        </div>

        {/* PROACTIVE SMART BUDGET PROJECTIONS BANNER FOR HEAD */}
        {isHeadOfFamily && smartBudgetAlerts && smartBudgetAlerts.length > 0 && (
          <div className="bg-gradient-to-br from-rose-50 via-amber-50 to-white border border-rose-200/90 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 text-rose-950 font-black text-xs sm:text-sm">
                <div className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <ShieldAlert className="w-4 h-4 animate-pulse" />
                </div>
                <span>{isFa ? 'هشدار هوشمند پیش‌بینی کسری بودجه (ویژه سرپرست)' : 'Smart Budget Forecast Warnings (Head of Family)'}</span>
              </div>
              <span className="text-[11px] font-extrabold text-rose-800 bg-rose-100/90 px-3 py-0.5 rounded-full border border-rose-300">
                {isFa ? `${toPersianDigits(smartBudgetAlerts.length)} دسته در معرض عبور از بودجه` : `${smartBudgetAlerts.length} Categories at risk`}
              </span>
            </div>

            <p className="text-xs text-rose-800/90 leading-relaxed font-medium">
              {isFa
                ? 'سیستم هوشمند با بررسی سرعت مخارج روزانه، پیش‌بینی می‌کند این دسته‌ها پیش از پایان ماه از سقف مجاز بودجه فراتر روند:'
                : 'Based on current daily burn rate, spending in these categories is projected to exceed the monthly budget before month end:'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {smartBudgetAlerts.map((alert, idx) => (
                <div
                  key={`smart-budget-grid-${alert.categoryId}-${idx}`}
                  className="p-3.5 rounded-2xl bg-white border border-rose-200/90 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-white shadow-xs"
                        style={{ backgroundColor: alert.color }}
                      >
                        <IconRenderer name={alert.icon} size={15} />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{isFa ? alert.categoryName : alert.categoryNameEn}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${
                            alert.isAlreadyExceeded 
                              ? 'bg-rose-600 text-white' 
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {alert.isAlreadyExceeded 
                              ? (isFa ? 'سقف رد شد!' : 'Exceeded!') 
                              : (isFa ? `پیش‌بینی عبور: ${toPersianDigits(alert.projectedPercentage)}٪` : `Projected: ${alert.projectedPercentage}%`)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {isFa ? `سقف مصوب: ${formatCurrency(alert.monthlyLimit, currency, isFa)}` : `Budget: ${formatCurrency(alert.monthlyLimit, currency, isFa)}`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEditCategoryBudget(alert.categoryId)}
                      className="px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>{isFa ? 'اصلاح سقف' : 'Edit'}</span>
                    </button>
                  </div>

                  {/* Stat pill indicators */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-500 font-bold block">{isFa ? 'پیش‌بینی پایان ماه:' : 'Projected Total:'}</span>
                      <span className="text-xs font-black text-rose-700 mt-0.5 block">
                        {formatCurrency(alert.projectedEndMonthSpent, currency, isFa)}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200/80">
                      <span className="text-emerald-800 font-bold block">{isFa ? 'سقف روزانه توصیه‌شده:' : 'Recommended Cap:'}</span>
                      <span className="text-xs font-black text-emerald-700 mt-0.5 block">
                        {formatCurrency(alert.recommendedDailyCap, currency, isFa)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE BUDGET ALERTS BANNER (when categories reach >=80% or exceed budget) */}
        {budgetAlerts.length > 0 && (
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-3xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                <BellRing className="w-4 h-4 text-amber-600 animate-bounce" />
                <span>{isFa ? `هشدارهای سقف بودجه (${toPersianDigits(budgetAlerts.length)} دسته در آستانه یا مازاد)` : `Active Budget Alerts (${budgetAlerts.length} Categories)`}</span>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                {isFa ? 'هشدار خودکار' : 'System Alert'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {budgetAlerts.map((alert, idx) => (
                <div
                  key={`budget-alert-${alert.categoryId}-${idx}`}
                  className={`p-3 rounded-2xl border flex items-start justify-between gap-3 text-xs ${
                    alert.isOver
                      ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                      : 'bg-white border-amber-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold"
                      style={{ backgroundColor: `${alert.color}20`, color: alert.color }}
                    >
                      <IconRenderer name={alert.icon} size={15} />
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{isFa ? alert.categoryName : alert.categoryNameEn}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                          alert.isOver ? 'bg-rose-200/80 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {alert.isOver ? (isFa ? 'تجاوز از سقف!' : 'Over Limit') : `${toPersianDigits(alert.percentage)}٪`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {alert.isOver
                          ? (isFa ? `مخارج (${formatCurrency(alert.spent, currency, isFa)}) از سقف (${formatCurrency(alert.limit, currency, isFa)}) رد شده است.` : `Exceeded limit of ${formatCurrency(alert.limit, currency, isFa)}`)
                          : (isFa ? `در آستانه سقف بودجه! تنها ${formatCurrency(alert.remaining, currency, isFa)} باقیمانده مجاز است.` : `Approaching limit! Only ${formatCurrency(alert.remaining, currency, isFa)} remaining.`)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEditCategoryBudget(alert.categoryId)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors shrink-0 cursor-pointer"
                    title={isFa ? 'ویرایش سقف این دسته' : 'Edit category limit'}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORY BUDGET CARDS GRID */}
        {categoryBudgets.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-600 font-bold">
              {isFa ? 'هنوز سقف بودجه‌ای برای دسته‌بندی‌ها تعیین نشده است.' : 'No category budgets have been set yet.'}
            </p>
            <button
              type="button"
              onClick={() => handleOpenEditCategoryBudget()}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isFa ? 'تعیین سقف بودجه برای دسته‌ها' : 'Set Category Budgets'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryBudgets.map((cat, idx) => {
              const isOver = cat.spent >= cat.limit;
              const isApproaching = cat.pct >= 80 && !isOver;
              const remaining = Math.max(0, cat.limit - cat.spent);

              return (
                <div
                  key={`cat-budget-card-${cat.id}-${idx}`}
                  className={`bg-white border rounded-3xl p-5 shadow-sm space-y-3 transition-all ${
                    isOver
                      ? 'border-rose-300 bg-rose-50/20 shadow-rose-100/50'
                      : isApproaching
                      ? 'border-amber-300 bg-amber-50/15 shadow-amber-100/50'
                      : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center border font-bold"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          borderColor: `${cat.color}30`,
                          color: cat.color,
                        }}
                      >
                        <IconRenderer name={cat.icon} size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-slate-900">{isFa ? cat.name : cat.nameEn}</h4>
                          <button
                            type="button"
                            onClick={() => handleOpenEditCategoryBudget(cat.id)}
                            className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title={isFa ? 'ویرایش سقف بودجه' : 'Edit Budget Limit'}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {isFa ? `سقف بودجه: ${formatCurrency(cat.limit, currency, isFa)}` : `Budget: ${formatCurrency(cat.limit, currency, isFa)}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 ${
                        isOver
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : isApproaching
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isOver ? (
                          <>
                            <AlertOctagon className="w-3 h-3 text-rose-600" />
                            <span>{isFa ? 'تجاوز از سقف!' : 'Over budget'}</span>
                          </>
                        ) : isApproaching ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>{isFa ? `${toPersianDigits(cat.pct)}٪ (هشدار)` : `${cat.pct}% (Warning)`}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{`${isFa ? toPersianDigits(cat.pct) : cat.pct}%`}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar with Contextual Warning Colors */}
                  <div className="space-y-1.5">
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-rose-500' : isApproaching ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, cat.pct)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-medium pt-1">
                      <span className="text-slate-600">
                        {isFa ? `مصرف شده: ${formatCurrency(cat.spent, currency, isFa)}` : `Spent: ${formatCurrency(cat.spent, currency, isFa)}`}
                      </span>
                      <span className={isOver ? 'text-rose-600 font-bold' : isApproaching ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                        {isOver
                          ? (isFa ? `مازاد: ${formatCurrency(cat.spent - cat.limit, currency, isFa)}` : `Excess: ${formatCurrency(cat.spent - cat.limit, currency, isFa)}`)
                          : (isFa ? `باقیمانده: ${formatCurrency(remaining, currency, isFa)}` : `Remaining: ${formatCurrency(remaining, currency, isFa)}`)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {isAddGoalOpen && (
          <div key="modal-add-goal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              key="add-goal-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddGoalOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              key="add-goal-modal-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg my-auto max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{isFa ? 'هدف پس‌انداز جدید' : 'New Savings Goal'}</h3>
                <button onClick={() => setIsAddGoalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveGoal} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'عنوان هدف' : 'Goal Title'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isFa ? 'مثلا: خرید مسکن، تعویض لپ‌تاپ، سفر' : 'e.g. New Laptop'}
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'مبلغ هدف (تومان)' : 'Target Amount'}</label>
                    <input
                      type="text"
                      required
                      placeholder="100,000,000"
                      value={goalTargetStr ? toPersianDigits(Number(fromPersianDigits(goalTargetStr.replace(/,/g, ''))).toLocaleString('en-US')) : ''}
                      onChange={(e) => setGoalTargetStr(fromPersianDigits(e.target.value).replace(/\D/g, ''))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'موجودی اولیه (تومان)' : 'Initial Saved'}</label>
                    <input
                      type="text"
                      placeholder="0"
                      value={goalCurrentStr ? toPersianDigits(Number(fromPersianDigits(goalCurrentStr.replace(/,/g, ''))).toLocaleString('en-US')) : ''}
                      onChange={(e) => setGoalCurrentStr(fromPersianDigits(e.target.value).replace(/\D/g, ''))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-slate-900 font-bold text-base focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <PersianDatePicker
                    label={isFa ? 'تاریخ هدف وصول' : 'Target Date'}
                    valueJalali={goalJalaliDate}
                    onChange={(j, i) => {
                      setGoalJalaliDate(j);
                      setGoalIsoDate(i);
                    }}
                    isPersianLang={isFa}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'یادداشت یا توضیحات' : 'Notes'}</label>
                  <input
                    type="text"
                    placeholder={isFa ? 'برنامه‌ریزی پس‌انداز ماهانه' : 'Monthly plan'}
                    value={goalNotes}
                    onChange={(e) => setGoalNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddGoalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {isFa ? 'انصراف' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    {isFa ? 'ایجاد هدف' : 'Create Goal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deposit to Goal Modal */}
      <AnimatePresence>
        {fundingGoal && (
          <div key="modal-funding-goal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              key="funding-goal-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFundingGoal(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              key="funding-goal-modal-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg my-auto max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{isFa ? `واریز به ${fundingGoal.title}` : `Deposit to ${fundingGoal.title}`}</h3>
                <button onClick={() => setFundingGoal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDepositToGoal} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'مبلغ واریز به پس‌انداز (تومان)' : 'Amount (Toman)'}</label>
                  <input
                    type="text"
                    required
                    placeholder="5,000,000"
                    value={fundingAmountStr ? toPersianDigits(Number(fromPersianDigits(fundingAmountStr.replace(/,/g, ''))).toLocaleString('en-US')) : ''}
                    onChange={(e) => setFundingAmountStr(fromPersianDigits(e.target.value).replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'کسر از حساب / کارت (اختیاری)' : 'Deduct From Account (Optional)'}</label>
                  <select
                    value={fundingAccountId}
                    onChange={(e) => setFundingAccountId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer font-medium"
                  >
                    <option value="">{isFa ? 'فقط ثبت در هدف (بدون کسر حساب)' : 'Do not deduct balance'}</option>
                    {accounts.map((acc, idx) => (
                      <option key={`goal-funding-acc-${acc.id}-${idx}`} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.balance, currency, isFa)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setFundingGoal(null)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {isFa ? 'انصراف' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    {isFa ? 'ثبت واریز' : 'Confirm Deposit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Set & Manage Category Budget Modal */}
      <AnimatePresence>
        {isManageBudgetsOpen && (
          <div key="modal-manage-budgets-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              key="manage-budgets-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManageBudgetsOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              key="manage-budgets-modal-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg my-auto max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {isFa ? 'تنظیم سقف بودجه ماهانه دسته‌بندی' : 'Set Category Monthly Budget'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isFa ? 'تعیین سقف هشدار برای مدیریت دقیق مصارف' : 'Set automated threshold warnings for expenses'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManageBudgetsOpen(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCategoryBudget} className="p-6 overflow-y-auto space-y-4 text-xs">
                {/* Category Selection */}
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">
                    {isFa ? 'انتخاب دسته‌بندی هزینه' : 'Select Expense Category'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1">
                    {categories
                      .filter(c => c.type === 'expense')
                      .map((cat, idx) => {
                        const isSelected = selectedCatIdForEdit === cat.id;
                        return (
                          <button
                            key={`cat-budget-picker-${cat.id}-${idx}`}
                            type="button"
                            onClick={() => {
                              setSelectedCatIdForEdit(cat.id);
                              setCatLimitStr(cat.budgetMonthly ? String(cat.budgetMonthly) : '');
                            }}
                            className={`flex items-center gap-2 p-2 rounded-2xl border text-right transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <div
                              className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-bold"
                              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                            >
                              <IconRenderer name={cat.icon} size={14} />
                            </div>
                            <span className="truncate text-xs">{isFa ? cat.name : cat.nameEn}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Amount Limit Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-slate-700 font-bold">
                      {isFa ? 'سقف بودجه ماهانه (تومان)' : 'Monthly Budget Limit (Toman)'}
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {isFa ? '۰ برای غیرفعال‌سازی سقف' : '0 to disable limit'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={isFa ? 'مثال: ۵,۰۰۰,۰۰۰' : 'e.g. 5,000,000'}
                      value={catLimitStr ? toPersianDigits(Number(fromPersianDigits(catLimitStr.replace(/,/g, ''))).toLocaleString('en-US')) : ''}
                      onChange={(e) => {
                        const raw = fromPersianDigits(e.target.value).replace(/\D/g, '');
                        setCatLimitStr(raw);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-black text-lg focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                      {currency === 'rial' ? (isFa ? 'ریال' : 'IRR') : (isFa ? 'تومان' : 'Toman')}
                    </span>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[11px] text-slate-400 font-medium ml-1">
                      {isFa ? 'میانبرها:' : 'Presets:'}
                    </span>
                    {[
                      { labelFa: '+۱ م', labelEn: '+1M', val: 1000000 },
                      { labelFa: '+۲ م', labelEn: '+2M', val: 2000000 },
                      { labelFa: '+۵ م', labelEn: '+5M', val: 5000000 },
                      { labelFa: '+۱۰ م', labelEn: '+10M', val: 10000000 },
                      { labelFa: '+۲۰ م', labelEn: '+20M', val: 20000000 },
                    ].map((preset, idx) => (
                      <button
                        key={`budget-preset-val-${preset.val}-${idx}`}
                        type="button"
                        onClick={() => {
                          const current = Number(fromPersianDigits(catLimitStr.replace(/,/g, ''))) || 0;
                          setCatLimitStr(String(current + preset.val));
                        }}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        {isFa ? preset.labelFa : preset.labelEn}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCatLimitStr('0')}
                      className="px-2 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {isFa ? 'حذف سقف' : 'Clear'}
                    </button>
                  </div>
                </div>

                {/* Automation Alert Information */}
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                  <BellRing className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {isFa
                      ? 'مکانیزم هشدار هوشمند: با رسیدن مجموع مخارج ماه جاری به ۸۰٪ از این سقف، سیستم به‌صورت خودکار هشدار زرد رنگ (نزدیک به سقف) و در صورت رد شدن از سقف، هشدار قرمز نمایش می‌دهد.'
                      : 'Smart proximity trigger: When expenses in this category reach 80% of this limit, an automated warning will be displayed across dashboard and transaction forms.'}
                  </p>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsManageBudgetsOpen(false)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {isFa ? 'انصراف' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isFa ? 'ذخیره سقف بودجه' : 'Save Budget Limit'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
