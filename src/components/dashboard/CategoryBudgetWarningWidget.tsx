import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatNumber, toPersianDigits } from '../../utils/formatters';
import { IconRenderer } from '../common/IconRenderer';
import { 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  SlidersHorizontal, 
  ArrowRight, 
  Search, 
  TrendingUp,
  Flame,
  ShieldAlert,
  Edit3,
  X,
  Plus
} from 'lucide-react';

export const CategoryBudgetWarningWidget: React.FC = () => {
  const {
    categories,
    transactions,
    currency,
    language,
    setActiveTab,
    openTransactionModal,
    updateCategoryBudget
  } = useFinance();

  const isFa = language === 'fa';
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [newBudgetInput, setNewBudgetInput] = useState<string>('');

  // Calculate current month's spending per category
  const categorySpendingAnalysis = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const spentMap = new Map<string, { total: number; count: number; recentTxs: typeof transactions }>();

    transactions.forEach(t => {
      if (t.type === 'expense') {
        const d = new Date(t.date);
        if (d >= thirtyDaysAgo) {
          const curr = spentMap.get(t.categoryId) || { total: 0, count: 0, recentTxs: [] };
          curr.total += t.amount;
          curr.count += 1;
          if (curr.recentTxs.length < 3) curr.recentTxs.push(t);
          spentMap.set(t.categoryId, curr);
        }
      }
    });

    const items = categories
      .filter(c => c.type === 'expense' && (c.budgetMonthly || 0) > 0)
      .map(c => {
        const spentData = spentMap.get(c.id) || { total: 0, count: 0, recentTxs: [] };
        const spent = spentData.total;
        const limit = c.budgetMonthly || 0;
        const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        const remaining = limit - spent;
        const isExceeded = spent >= limit;
        const isApproaching = percentage >= 80 && !isExceeded;

        return {
          category: c,
          spent,
          limit,
          percentage,
          remaining: Math.max(0, remaining),
          excess: Math.max(0, spent - limit),
          isExceeded,
          isApproaching,
          isCritical: percentage >= 80,
          txCount: spentData.count,
          recentTxs: spentData.recentTxs,
        };
      });

    // Sort by percentage descending
    items.sort((a, b) => b.percentage - a.percentage);

    const criticalItems = items.filter(i => i.isCritical);
    const safeItems = items.filter(i => !i.isCritical);

    return {
      all: items,
      critical: criticalItems,
      safe: safeItems,
      hasAnyBudgetDefined: items.length > 0,
      totalExceededCount: items.filter(i => i.isExceeded).length,
      totalApproachingCount: items.filter(i => i.isApproaching).length,
    };
  }, [categories, transactions]);

  const handleStartEdit = (catId: string, currentLimit: number) => {
    setEditingCatId(catId);
    setNewBudgetInput(currentLimit.toString());
  };

  const handleSaveBudget = (catId: string) => {
    const val = Number(newBudgetInput.replace(/,/g, ''));
    if (!isNaN(val) && val >= 0) {
      updateCategoryBudget(catId, val);
    }
    setEditingCatId(null);
  };

  if (!categorySpendingAnalysis.hasAnyBudgetDefined) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-900/60 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {isFa ? 'سیستم پایش لحظه‌ای سقف بودجه (هشدار ۸۰٪)' : 'Real-time Budget Threshold Monitor (80% Warning)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isFa 
                  ? 'هنوز برای دسته‌های هزینه سقف ماهانه تعیین نشده است. با تعیین سقف، هنگام عبور از ۸۰٪ هشدار دریافت کنید.' 
                  : 'No monthly limits set yet. Set limits to receive real-time warnings upon reaching 80% spending.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('budgets_goals')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>{isFa ? 'تعریف سقف بودجه برای دسته‌ها' : 'Set Category Budgets'}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Alert Header Banner if any category reached >= 80% */}
      {categorySpendingAnalysis.critical.length > 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-orange-500/10 dark:from-amber-950/40 dark:via-rose-950/40 dark:to-orange-950/30 border border-amber-300/80 dark:border-amber-700/60 rounded-3xl p-5 sm:p-6 shadow-sm backdrop-blur-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                categorySpendingAnalysis.totalExceededCount > 0
                  ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse'
                  : 'bg-amber-500 text-white shadow-amber-500/30'
              }`}>
                {categorySpendingAnalysis.totalExceededCount > 0 ? (
                  <AlertOctagon className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                    {isFa ? 'هشدار لحظه‌ای سقف بودجه دسته‌ها' : 'Real-time Category Budget Warning'}
                  </h3>
                  {categorySpendingAnalysis.totalExceededCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-black flex items-center gap-1">
                      <Flame className="w-3 h-3 text-rose-500" />
                      {isFa ? `${toPersianDigits(categorySpendingAnalysis.totalExceededCount)} دسته مازاد بر ۱۰۰٪` : `${categorySpendingAnalysis.totalExceededCount} Exceeded`}
                    </span>
                  )}
                  {categorySpendingAnalysis.totalApproachingCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-black">
                      {isFa ? `${toPersianDigits(categorySpendingAnalysis.totalApproachingCount)} دسته در مرز خطر (بالای ۸۰٪)` : `${categorySpendingAnalysis.totalApproachingCount} over 80%`}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {isFa
                    ? 'سامانه هوشمند جیبینو مصرف شما را پایش کرده است؛ مخارج دسته‌های زیر از مرز ۸۰٪ بودجه ماهانه عبور کرده و نیاز به مدیریت دارند:'
                    : 'System detected spending in the following categories has reached or exceeded 80% of your allocated monthly cap:'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setActiveTab('budgets_goals')}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                <span>{isFa ? 'مدیریت کل بودجه‌ها' : 'Budget Manager'}</span>
              </button>
            </div>
          </div>

          {/* Cards Grid for Critical Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
            {categorySpendingAnalysis.critical.map((item) => {
              const isOver = item.isExceeded;
              const isEditing = editingCatId === item.category.id;

              return (
                <div
                  key={`budget-warn-${item.category.id}`}
                  className={`rounded-2xl p-4 border transition-all duration-200 ${
                    isOver 
                      ? 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/70 shadow-xs' 
                      : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: item.category.color || '#3b82f6' }}
                      >
                        <IconRenderer name={item.category.icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {isFa ? item.category.name : item.category.nameEn}
                        </h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isFa ? `${toPersianDigits(item.txCount)} تراکنش ثبت‌شده` : `${item.txCount} txs`}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                      isOver 
                        ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                        : 'bg-amber-500 text-white border-amber-600'
                    }`}>
                      {isFa ? `${toPersianDigits(item.percentage)}٪ مصرف‌شده` : `${item.percentage}% used`}
                    </span>
                  </div>

                  {/* Visual Progress Bar with 80% Needle Mark */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="relative w-full h-3 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                      {/* 80% Safe Threshold Marker Needle */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-600 dark:bg-amber-400 z-10"
                        style={{ left: isFa ? undefined : '80%', right: isFa ? '80%' : undefined }}
                        title="مرز هشدار ۸۰ درصد"
                      />
                      
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver 
                            ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                            : 'bg-gradient-to-r from-amber-400 to-orange-500'
                        }`}
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <span>۰</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {isFa ? 'مرز هشدار (۸۰٪)' : '80% Warning Limit'}
                      </span>
                      <span>{isFa ? 'سقف ۱۰۰٪' : '100%'}</span>
                    </div>
                  </div>

                  {/* Financial Stats Details */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{isFa ? 'مصرف‌شده تا کنون:' : 'Spent:'}</span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {formatCurrency(item.spent, currency, isFa)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {isOver ? (isFa ? 'مبلغ مازاد (اضافه خرج):' : 'Overspent:') : (isFa ? 'باقیمانده تا سقف:' : 'Remaining:')}
                      </span>
                      <span className={`font-black ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isOver 
                          ? `+${formatCurrency(item.excess, currency, isFa)}` 
                          : formatCurrency(item.remaining, currency, isFa)}
                      </span>
                    </div>
                  </div>

                  {/* Quick Budget Inline Adjuster */}
                  {isEditing ? (
                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                      <input
                        type="number"
                        value={newBudgetInput}
                        onChange={(e) => setNewBudgetInput(e.target.value)}
                        placeholder="سقف جدید..."
                        className="w-full text-xs font-bold py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveBudget(item.category.id)}
                        className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 cursor-pointer shrink-0"
                        title="ذخیره"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 cursor-pointer shrink-0"
                        title="انصراف"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleStartEdit(item.category.id, item.limit)}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isFa ? 'تعدیل سقف بودجه' : 'Adjust Cap'}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('transactions')}
                        className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>{isFa ? 'مشاهده تراکنش‌ها' : 'View Transactions'}</span>
                        <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Safe Status Card when all categories are below 80% */
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-emerald-950 dark:text-emerald-200 block">
                {isFa ? 'وضعیت بودجه دسته‌بندی‌ها در شرایط مطلوب و امن (زیر ۸۰٪)' : 'All Category Budgets are within Safe Limits (<80%)'}
              </span>
              <span className="text-xs text-emerald-800/80 dark:text-emerald-300/70">
                {isFa 
                  ? `تمام ${toPersianDigits(categorySpendingAnalysis.all.length)} دسته دارای بودجه ماهانه، با انضباط مالی و به دور از مرز خطر مصرف شده‌اند.` 
                  : `All ${categorySpendingAnalysis.all.length} budgeted categories are strictly controlled.`}
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('budgets_goals')}
            className="px-3 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-800 dark:text-emerald-200 text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            {isFa ? 'مشاهده جزئیات' : 'View Budgets'}
          </button>
        </div>
      )}
    </div>
  );
};
