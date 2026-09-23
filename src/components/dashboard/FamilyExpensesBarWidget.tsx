import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { 
  Users, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  Filter, 
  PlusCircle,
  Sparkles
} from 'lucide-react';

const MEMBER_PALETTE = [
  '#6366F1', // Indigo
  '#EC4899', // Pink/Rose
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
];

export const FamilyExpensesBarWidget: React.FC = () => {
  const { 
    familyMembers, 
    transactions, 
    currency, 
    language,
    setActiveTab,
    openAddTransactionModal,
    addTransaction,
    accounts,
    categories,
    isHeadOfFamily
  } = useFinance();

  const [timeframe, setTimeframe] = useState<'month' | '30days' | 'all'>('month');

  // Compute spending per member according to selected timeframe
  const chartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filteredTxs = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      const txDate = new Date(t.date);
      if (timeframe === 'month') {
        return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
      }
      if (timeframe === '30days') {
        return txDate >= thirtyDaysAgo;
      }
      return true; // 'all'
    });

    const memberMap = new Map<string, { total: number; count: number }>();
    familyMembers.forEach(m => {
      memberMap.set(m.id, { total: 0, count: 0 });
    });

    filteredTxs.forEach(tx => {
      const targetId = tx.memberId || 'head';
      const current = memberMap.get(targetId) || { total: 0, count: 0 };
      current.total += tx.amount;
      current.count += 1;
      memberMap.set(targetId, current);
    });

    const totalFamilyExpenses = Array.from(memberMap.values()).reduce((sum, item) => sum + item.total, 0);

    return familyMembers.map((member, index) => {
      const stats = memberMap.get(member.id) || { total: 0, count: 0 };
      const percentage = totalFamilyExpenses > 0 
        ? Math.round((stats.total / totalFamilyExpenses) * 100) 
        : 0;

      const allowance = member.monthlyAllowance || 0;
      const allowancePercent = allowance > 0 
        ? Math.round((stats.total / allowance) * 100) 
        : 0;

      return {
        id: member.id,
        name: member.name,
        avatar: member.avatar || '👤',
        role: member.role,
        roleLabel: member.role === 'head' ? 'سرپرست' : member.role === 'spouse' ? 'همسر' : member.role === 'child' ? 'فرزند' : 'عضو',
        totalSpent: stats.total,
        txCount: stats.count,
        percentage,
        allowance,
        allowancePercent,
        color: member.color || MEMBER_PALETTE[index % MEMBER_PALETTE.length],
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [familyMembers, transactions, timeframe]);

  const totalFamilySpent = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.totalSpent, 0);
  }, [chartData]);

  const highestSpender = useMemo(() => {
    if (chartData.length === 0 || chartData[0].totalSpent === 0) return null;
    return chartData[0];
  }, [chartData]);

  // Handler to seed a quick sample expense for a member if empty
  const handleSeedSampleExpense = () => {
    const member = familyMembers.find(m => m.role !== 'head') || familyMembers[0];
    const cat = categories[0];
    const acc = accounts[0];
    if (!acc || !cat) return;

    addTransaction({
      type: 'expense',
      amount: currency === 'rial' ? 12000000 : 1200000,
      categoryId: cat.id,
      accountId: acc.id,
      date: new Date().toISOString().slice(0, 10),
      jalaliDate: '۱۴۰۳/۰۶/۱۵',
      description: `خرید اقلام آموزشی و شخصی توسط ${member.name}`,
      memberId: member.id,
      memberName: member.name,
      memberRole: member.role,
    });
  };

  if (!isHeadOfFamily) {
    return null;
  }

  // If user is alone and has no transactions yet, don't show the widget on clean workspace
  if (familyMembers.length <= 1 && transactions.length === 0) {
    return null;
  }

  return (
    <div 
      id="family-expenses-bar-widget"
      className="card-pro overflow-hidden p-5 sm:p-6 transition-all duration-300 hover:shadow-xl group"
    >
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              مقایسه مخارج اعضای خانواده
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              ویجت سرپرست
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            مجموع هزینه‌های ثبت‌شده توسط هر یک از اعضا برای بررسی الگوهای مصرف و مقایسه شفاف
          </p>
        </div>

        {/* Filters and Timeframe Toggle */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setTimeframe('month')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                timeframe === 'month'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ماه جاری
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('30days')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                timeframe === '30days'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ۳۰ روز اخیر
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                timeframe === 'all'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              همه دوره‌ها
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>کل هزینه‌های این دوره:</span>
            <Wallet className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalFamilySpent, currency, language)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>تعداد کل اعضا:</span>
            <Users className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <span>{familyMembers.length} نفر</span>
            <span className="text-xs font-medium text-slate-400">
              ({chartData.filter(m => m.totalSpent > 0).length} فعال با ثبت هزینه)
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>بیشترین سهم هزینه:</span>
            <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {highestSpender ? (
              <>
                <span className="text-base">{highestSpender.avatar}</span>
                <span className="text-indigo-600 dark:text-indigo-400">{highestSpender.name}</span>
                <span className="text-xs text-slate-500">({highestSpender.percentage}٪ از کل)</span>
              </>
            ) : (
              <span className="text-slate-400 font-normal">بدون هزینه ثبت شده</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Bar Chart Section */}
      {totalFamilySpent === 0 ? (
        <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 my-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 mx-auto flex items-center justify-center text-indigo-500 mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            هنوز هزینه‌ای توسط اعضا در این بازه زمانی ثبت نشده است
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            به محض ثبت اولین تراکنش خرید توسط هر یک از اعضای خانواده، مقایسه میله‌ای مخارج به شکل زنده در اینجا نمایش می‌یابد.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              id="btn-seed-sample-family-expense"
              type="button"
              onClick={handleSeedSampleExpense}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              افزودن نمونه هزینه برای اعضا
            </button>
            <button
              type="button"
              onClick={() => openAddTransactionModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              ثبت تراکنش جدید
            </button>
          </div>
        </div>
      ) : (
        <div className="my-4">
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 15, right: 10, left: 10, bottom: 25 }}
              >
                <XAxis 
                  dataKey="name" 
                  tickLine={false}
                  axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.3 }}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  interval={0}
                />
                <YAxis 
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${Math.round(val / 1000)}k`;
                    return String(val);
                  }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white/95 dark:bg-slate-900/95 p-3.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 backdrop-blur-md text-xs space-y-2 min-w-[200px]">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{data.avatar}</span>
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {data.name}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {data.roleLabel}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                              <span>مجموع مخارج:</span>
                              <strong className="text-rose-600 dark:text-rose-400 font-extrabold text-sm">
                                {formatCurrency(data.totalSpent, currency, language)}
                              </strong>
                            </div>
                            <div className="flex justify-between text-slate-500">
                              <span>سهم از کل هزینه‌ها:</span>
                              <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                                {data.percentage}٪
                              </strong>
                            </div>
                            <div className="flex justify-between text-slate-500">
                              <span>تعداد تراکنش‌ها:</span>
                              <strong className="text-slate-700 dark:text-slate-300">
                                {data.txCount} مورد
                              </strong>
                            </div>
                            {data.allowance > 0 && (
                              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between text-[11px] mb-1">
                                  <span>سقف ماهانه ({formatCurrency(data.allowance, currency, language)}):</span>
                                  <span className={data.allowancePercent > 100 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                                    {data.allowancePercent}٪
                                  </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all ${
                                      data.allowancePercent > 100 
                                        ? 'bg-rose-500' 
                                        : data.allowancePercent > 75 
                                        ? 'bg-amber-500' 
                                        : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(data.allowancePercent, 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="totalSpent" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                >
                  {chartData.map((entry, idx) => (
                    <Cell 
                      key={`fam-bar-cell-${entry.id || idx}-${idx}`} 
                      fill={entry.color} 
                      className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Member Detailed Comparison Cards Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            {chartData.map((member, idx) => (
              <div
                key={`fam-bar-member-card-${member.id || idx}-${idx}`}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all group/item shadow-xs hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base shadow-xs"
                      style={{ backgroundColor: `${member.color}20`, border: `1px solid ${member.color}50` }}
                    >
                      {member.avatar}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{member.name}</span>
                        <span className="text-[10px] font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                          {member.roleLabel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {member.txCount} تراکنش ثبت‌شده
                      </div>
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                      {formatCurrency(member.totalSpent, currency, language)}
                    </div>
                    <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {member.percentage}٪ از کل مخارج
                    </div>
                  </div>
                </div>

                {/* Allowance bar if defined */}
                {member.allowance > 0 ? (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                      <span>بودجه ماهانه: {formatCurrency(member.allowance, currency, language)}</span>
                      <span className={member.allowancePercent > 100 ? 'text-rose-500 font-bold' : 'text-slate-600 font-semibold'}>
                        {member.allowancePercent}٪ مصرف
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          member.allowancePercent > 100 
                            ? 'bg-rose-500' 
                            : member.allowancePercent > 75 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(member.allowancePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>بدون سقف ماهانه تعیین شده</span>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('family')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      مدیریت
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer link to Family Management */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>برای تعیین سقف مخارج یا مشاهده جزییات حساب‌های اختصاصی هر عضو:</span>
        <button
          id="btn-goto-family-manager-from-bar"
          type="button"
          onClick={() => setActiveTab('family')}
          className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          <span>مدیریت اعضای خانواده و روال‌ها</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
