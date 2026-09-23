import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatNumber, toPersianDigits } from '../../utils/formatters';
import { exportTransactionsCSV } from '../../utils/storage';
import { IconRenderer } from '../common/IconRenderer';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  Download, 
  Calendar, 
  Wallet, 
  Coins, 
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export const AnalyticsReports: React.FC = () => {
  const {
    transactions,
    categories,
    accounts,
    currency,
    language,
    totalNetWorth,
    monthlyIncome,
    monthlyExpense,
    monthlySavings,
  } = useFinance();

  const isFa = language === 'fa';

  const [timeRange, setTimeRange] = useState<'30' | '90' | '365' | 'all'>('30');

  // Filter transactions by selected range
  const filteredTxs = useMemo(() => {
    if (timeRange === 'all') return transactions;
    const days = Number(timeRange);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return transactions.filter(t => new Date(t.date) >= cutoff);
  }, [transactions, timeRange]);

  // Expenses by Category
  const expenseByCategory = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    let totalExp = 0;

    filteredTxs.forEach(t => {
      if (t.type === 'expense') {
        totalExp += t.amount;
        const curr = map.get(t.categoryId) || { amount: 0, count: 0 };
        map.set(t.categoryId, { amount: curr.amount + t.amount, count: curr.count + 1 });
      }
    });

    return categories
      .filter(c => c.type === 'expense')
      .map(cat => {
        const data = map.get(cat.id) || { amount: 0, count: 0 };
        const share = totalExp > 0 ? (data.amount / totalExp) * 100 : 0;
        return {
          id: cat.id,
          name: isFa ? cat.name : cat.nameEn,
          color: cat.color,
          icon: cat.icon,
          amount: data.amount,
          count: data.count,
          share: Math.round(share),
          avg: data.count > 0 ? Math.round(data.amount / data.count) : 0,
        };
      })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTxs, categories, isFa]);

  // Incomes by Category
  const incomeByCategory = useMemo(() => {
    const map = new Map<string, number>();
    let totalInc = 0;

    filteredTxs.forEach(t => {
      if (t.type === 'income') {
        totalInc += t.amount;
        map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
      }
    });

    return categories
      .filter(c => c.type === 'income')
      .map(cat => {
        const amount = map.get(cat.id) || 0;
        const share = totalInc > 0 ? Math.round((amount / totalInc) * 100) : 0;
        return {
          id: cat.id,
          name: isFa ? cat.name : cat.nameEn,
          color: cat.color,
          icon: cat.icon,
          amount,
          share,
        };
      })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTxs, categories, isFa]);

  // Asset allocation by account type
  const assetAllocation = useMemo(() => {
    const map = new Map<string, number>();
    accounts.forEach(a => {
      const typeKey = a.type;
      map.set(typeKey, (map.get(typeKey) || 0) + a.balance);
    });

    const labels: Record<string, { fa: string; en: string; color: string }> = {
      bank: { fa: 'سپرده و کارت‌های بانکی', en: 'Bank Accounts', color: '#3b82f6' },
      cash: { fa: 'کیف پول و نقدینگی', en: 'Cash', color: '#10b981' },
      gold: { fa: 'صندوق طلا و سکه', en: 'Gold & Coins', color: '#f59e0b' },
      crypto: { fa: 'ارز دیجیتال و تتر', en: 'Crypto', color: '#8b5cf6' },
      investment: { fa: 'بورس و سرمایه‌گذاری', en: 'Investments', color: '#ec4899' },
    };

    return Array.from(map.entries()).map(([type, amount], idx) => {
      const info = labels[type] || { fa: 'سایر', en: 'Other', color: '#64748b' };
      const share = totalNetWorth > 0 ? Math.round((amount / totalNetWorth) * 100) : 0;
      return {
        id: `asset-${type}-${idx}`,
        name: isFa ? info.fa : info.en,
        amount,
        share,
        color: info.color,
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [accounts, totalNetWorth, isFa]);

  // Trend comparison monthly
  const monthlyBarData = useMemo(() => {
    return [
      { name: isFa ? 'فروردین' : 'Farvardin', income: 42000000, expense: 28000000, savings: 14000000 },
      { name: isFa ? 'اردیبهشت' : 'Ordibehesht', income: 38000000, expense: 29000000, savings: 9000000 },
      { name: isFa ? 'خرداد' : 'Khordad', income: 45000000, expense: 31000000, savings: 14000000 },
      { name: isFa ? 'تیر' : 'Tir', income: 41000000, expense: 34000000, savings: 7000000 },
      { name: isFa ? 'مرداد' : 'Mordad', income: 55000000, expense: 38000000, savings: 17000000 },
      { name: isFa ? 'شهریور' : 'Shahrivar', income: monthlyIncome || 63000000, expense: monthlyExpense || 26500000, savings: monthlySavings || 36500000 },
    ];
  }, [monthlyIncome, monthlyExpense, monthlySavings, isFa]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {isFa ? 'گزارش‌های تحلیلی و ترازنامه' : 'Financial Reports & Analytics'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isFa ? 'دید همه‌جانبه بر رفتار مالی، نرخ پس‌انداز و ترکیب دارایی‌ها' : 'Deep insights into your spending habits and asset composition'}
          </p>
        </div>

        {/* Time Range Selector & CSV Export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 text-xs shadow-sm">
            <button
              onClick={() => setTimeRange('30')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                timeRange === '30' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isFa ? '۳۰ روز' : '30 Days'}
            </button>
            <button
              onClick={() => setTimeRange('90')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                timeRange === '90' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isFa ? '۹۰ روز' : '90 Days'}
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                timeRange === 'all' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isFa ? 'همه زمان‌ها' : 'All Time'}
            </button>
          </div>

          <button
            onClick={() => exportTransactionsCSV(filteredTxs, categories, accounts)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">{isFa ? 'دریافت خروجی' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* Row 1: Monthly Trend Bar Chart */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              {isFa ? 'ترازنامه و مقایسه ۶ ماهه (درآمد، هزینه و پس‌انداز)' : '6-Month Balance Sheet & Cashflow'}
            </h3>
            <p className="text-xs text-slate-500">
              {isFa ? 'بررسی روند رشد درآمدی و پایداری هزینه‌ها' : 'Tracking income growth and expense stability'}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {isFa ? 'درآمد' : 'Income'}</span>
            <span className="flex items-center gap-1.5 text-rose-600"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> {isFa ? 'هزینه' : 'Expense'}</span>
            <span className="flex items-center gap-1.5 text-blue-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> {isFa ? 'پس‌انداز' : 'Savings'}</span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyBarData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false}
                tickFormatter={(val) => isFa ? `${toPersianDigits(Math.round(val / 1000000))}M` : `${Math.round(val / 1000000)}M`}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#e2e8f0', 
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                  color: '#0f172a',
                  fontWeight: 600
                }}
                formatter={(val: any) => [formatCurrency(Number(val), currency, isFa), '']}
              />
              <Bar key="analytics-bar-income" dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={22} />
              <Bar key="analytics-bar-expense" dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={22} />
              <Bar key="analytics-bar-savings" dataKey="savings" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Asset Allocation & Income Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              {isFa ? 'ترکیب دارایی‌ها و سرمایه (Asset Allocation)' : 'Asset Allocation'}
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {formatCurrency(totalNetWorth, currency, isFa)}
            </span>
          </div>

          <div className="space-y-3.5">
            {assetAllocation.map((item, idx) => (
              <div key={`analytics-asset-${item.id || item.name}-${idx}`} className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 font-bold">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{formatCurrency(item.amount, currency, isFa)}</span>
                    <span className="text-[11px] text-slate-400 font-mono">({isFa ? toPersianDigits(item.share) : item.share}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.share}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Income Sources Breakdown */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              {isFa ? 'سهم منابع درآمدی' : 'Income Sources'}
            </h3>
            <span className="text-xs text-emerald-600 font-black">
              {formatCurrency(monthlyIncome, currency, isFa)}
            </span>
          </div>

          <div className="space-y-3.5">
            {incomeByCategory.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">{isFa ? 'درآمدی در این بازه ثبت نشده است.' : 'No income recorded.'}</div>
            ) : (
              incomeByCategory.map((item, idx) => (
                <div key={`analytics-inc-cat-${item.id}-${idx}`} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 font-bold">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">{formatCurrency(item.amount, currency, isFa)}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({isFa ? toPersianDigits(item.share) : item.share}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.share}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Expense Detailed Breakdown Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm sm:text-base text-slate-900">
            {isFa ? 'جدول تحلیل هزینه‌ها به تفکیک سرفصل' : 'Expense Category Matrix'}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 pb-2 font-bold">
                <th className="py-3 px-3">{isFa ? 'سرفصل هزینه' : 'Category'}</th>
                <th className="py-3 px-3">{isFa ? 'مجموع پرداختی' : 'Total Spent'}</th>
                <th className="py-3 px-3">{isFa ? 'سهم از کل' : 'Share (%)'}</th>
                <th className="py-3 px-3">{isFa ? 'تعداد دفعات' : 'Count'}</th>
                <th className="py-3 px-3">{isFa ? 'میانگین هر خرید' : 'Average Per Transaction'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenseByCategory.map((cat, idx) => (
                <tr key={`analytics-exp-cat-${cat.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                      >
                        <IconRenderer name={cat.icon} size={15} />
                      </div>
                      <span className="font-bold text-slate-800">{cat.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-black text-slate-900">
                    {formatCurrency(cat.amount, currency, isFa)}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                      {isFa ? toPersianDigits(cat.share) : cat.share}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-500 font-medium">
                    {isFa ? `${toPersianDigits(cat.count)} بار` : `${cat.count} times`}
                  </td>
                  <td className="py-3.5 px-3 font-bold text-slate-700">
                    {formatCurrency(cat.avg, currency, isFa)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
