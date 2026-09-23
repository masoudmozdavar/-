import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { TransactionType, Category } from '../../types';
import { formatCurrency, toPersianDigits } from '../../utils/formatters';
import { getTodayISO, getTodayJalali } from '../../utils/jalali';
import { GraphicAvatar } from '../common/GraphicAvatar';
import { 
  Plus, 
  Send, 
  Wallet, 
  CheckCircle2, 
  Sparkles, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  AlertCircle, 
  Lock, 
  Clock, 
  Coins, 
  Receipt, 
  ChevronRight,
  RefreshCw,
  LogOut,
  Calendar,
  Layers
} from 'lucide-react';

export const FamilyMemberRoutineView: React.FC = () => {
  const { 
    activeMember, 
    accounts, 
    categories, 
    transactions, 
    currency, 
    language, 
    addTransaction, 
    deleteTransaction,
    allowanceRequests,
    submitAllowanceRequest,
    exitToHeadProfile,
    setIsProfileSwitcherOpen
  } = useFinance();

  const isFa = language === 'fa';

  // Routine Transaction Form State
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('cat-food');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || 'acc-meli');
  const [description, setDescription] = useState<string>('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastLoggedTxAmount, setLastLoggedTxAmount] = useState<number>(0);

  // Allowance Request State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestSubmittedSuccess, setRequestSubmittedSuccess] = useState(false);

  // Filter allowed accounts if restricted
  const availableAccounts = activeMember.allowedAccountIds && activeMember.allowedAccountIds.length > 0
    ? accounts.filter(a => activeMember.allowedAccountIds!.includes(a.id))
    : accounts;

  // Filter categories by type
  const availableCategories = categories.filter(c => c.type === type);

  // Transactions registered by this member
  const myTransactions = transactions.filter(t => t.memberId === activeMember.id);

  // Calculate total spent this month by this member
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const myMonthlySpent = myTransactions.reduce((acc, t) => {
    const d = new Date(t.date);
    if (d >= thirtyDaysAgo && t.type === 'expense') {
      return acc + t.amount;
    }
    return acc;
  }, 0);

  const allowance = activeMember.monthlyAllowance || 0;
  const allowanceRemaining = Math.max(0, allowance - myMonthlySpent);
  const allowancePercent = allowance > 0 ? Math.min(100, Math.round((myMonthlySpent / allowance) * 100)) : 0;

  // Pending requests of this member
  const myPendingRequests = allowanceRequests.filter(r => r.memberId === activeMember.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) return;

    addTransaction({
      type,
      amount: numAmount,
      categoryId,
      accountId: accountId || accounts[0]?.id,
      date: getTodayISO(),
      jalaliDate: getTodayJalali(),
      description: description.trim() || (type === 'expense' ? 'خرید روزمره' : 'دریافت وجه'),
      memberId: activeMember.id,
      memberName: activeMember.name,
      memberRole: activeMember.role,
    });

    setLastLoggedTxAmount(numAmount);
    setIsSuccessModalOpen(true);
    setAmount('');
    setDescription('');
  };

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseFloat(amount.replace(/,/g, '')) || 0;
    setAmount((current + addValue).toString());
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(requestAmount.replace(/,/g, ''));
    if (!num || isNaN(num) || num <= 0) return;

    submitAllowanceRequest(num, requestReason.trim() || 'درخواست شارژ یا پول توجیبی');
    setRequestSubmittedSuccess(true);
    setTimeout(() => {
      setRequestSubmittedSuccess(false);
      setIsRequestModalOpen(false);
      setRequestAmount('');
      setRequestReason('');
    }, 1800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Member Header & Synchronization Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <GraphicAvatar
              avatarId={activeMember.avatar}
              size="xl"
              ring={true}
              ringColor={activeMember.color || '#3b82f6'}
              showBadge={true}
              className="shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">{activeMember.name}</h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-white/15 text-indigo-200 border border-white/20">
                  {activeMember.role === 'spouse' ? 'همسر' : activeMember.role === 'child' ? 'فرزند' : 'عضو خانواده'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>همگام با حساب اصلی سرپرست (مسعود مزدآور)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setIsProfileSwitcherOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isFa ? 'تغییر کاربر' : 'Switch'}</span>
            </button>
            <button
              onClick={() => exitToHeadProfile()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-bold text-rose-200 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isFa ? 'خروج به حساب سرپرست' : 'Exit to Head'}</span>
            </button>
          </div>
        </div>

        {/* Member Allowance Tracker Card */}
        {allowance > 0 && (
          <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-300 block mb-0.5">{isFa ? 'سقف هزینه ماهانه' : 'Monthly Allowance'}</span>
              <span className="text-sm font-bold text-white">{formatCurrency(allowance, currency, isFa)}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-300 block mb-0.5">{isFa ? 'خرج شده این ماه' : 'Spent This Month'}</span>
              <span className="text-sm font-bold text-amber-300">{formatCurrency(myMonthlySpent, currency, isFa)}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-300 block mb-0.5">{isFa ? 'مانده سهمیه' : 'Remaining'}</span>
              <span className={`text-sm font-bold ${allowanceRemaining > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {formatCurrency(allowanceRemaining, currency, isFa)}
              </span>
            </div>

            <div className="sm:col-span-3 mt-1">
              <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1">
                <span>{isFa ? 'میزان مصرف از بودجه' : 'Budget utilization'}</span>
                <span>{isFa ? toPersianDigits(allowancePercent) : allowancePercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    allowancePercent > 90 ? 'bg-rose-500' : allowancePercent > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${allowancePercent}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Routine Task: Fast Transaction Entry Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isFa ? 'ثبت سریع تراکنش روزمره' : 'Quick Transaction Entry'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFa ? 'ثبت هزینه یا خرید روزمره و ارسال مستقیم به حساب اصلی' : 'Record routine expense to family ledger'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{isFa ? 'درخواست پول توجیبی' : 'Request Allowance'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type Toggle */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategoryId('cat-food'); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{isFa ? 'هزینه و خرید' : 'Expense'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategoryId('cat-allowance'); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{isFa ? 'درآمد یا دریافت پول' : 'Income'}</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isFa ? `مبلغ (${currency === 'toman' ? 'تومان' : currency === 'rial' ? 'ریال' : '$'})` : 'Amount'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="۰"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-2xl font-black px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono text-left rtl:text-right"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400">{isFa ? 'مبالغ سریع:' : 'Quick add:'}</span>
              {[20000, 50000, 100000, 200000, 500000].map((val, idx) => (
                <button
                  key={`routine-quick-amt-${val}-${idx}`}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 text-slate-600 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer"
                >
                  +{formatCurrency(val, currency, isFa)}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Grid / Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {isFa ? 'دسته‌بندی' : 'Category'}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableCategories.slice(0, 8).map((cat, idx) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={`routine-cat-${cat.id}-${idx}`}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xl">{cat.icon || '🛍️'}</span>
                    <span className="text-xs font-semibold truncate w-full">{isFa ? (cat.name || cat.nameEn) : cat.nameEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Selector & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isFa ? 'حساب یا کارت بانکی پرداخت' : 'Paid from Account'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {availableAccounts.map((acc, idx) => (
                  <option key={`routine-acc-opt-${acc.id}-${idx}`} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance, currency, isFa)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isFa ? 'توضیحات و بابت (اختیاری)' : 'Description / Note'}
              </label>
              <input
                type="text"
                placeholder={isFa ? 'مثال: خرید از سوپرمارکت، کرایه اسنپ، کتاب...' : 'e.g. groceries, books...'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!amount || parseFloat(amount.replace(/,/g, '')) <= 0}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-98 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isFa ? 'ثبت و ارسال به حساب سرپرست' : 'Submit & Sync with Head Account'}</span>
          </button>
        </form>
      </div>

      {/* Member's History of Registered Transactions */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {isFa ? 'تراکنش‌های ثبت‌شده توسط من' : 'My Registered Transactions'}
            </h4>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
            {isFa ? toPersianDigits(myTransactions.length) : myTransactions.length} {isFa ? 'مورد' : 'records'}
          </span>
        </div>

        {myTransactions.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-40 stroke-1" />
            <p className="text-xs">{isFa ? 'هنوز تراکنشی توسط شما ثبت نشده است.' : 'No transactions recorded yet.'}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {myTransactions.slice(0, 10).map((t, idx) => {
              const cat = categories.find(c => c.id === t.categoryId);
              return (
                <div 
                  key={`routine-my-tx-${t.id}-${idx}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-lg shadow-xs">
                      {cat?.icon || (t.type === 'income' ? '💰' : '💳')}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {t.description || (isFa ? (cat?.name || cat?.nameEn) : cat?.nameEn)}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{t.jalaliDate}</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">همگام با سرپرست</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right rtl:text-left">
                    <div className={`text-xs font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency, isFa)}
                    </div>
                    <button
                      onClick={() => deleteTransaction(t.id)}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold mt-0.5 cursor-pointer"
                    >
                      {isFa ? 'حذف' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Success Notification Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 text-center border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">
              {isFa ? 'تراکنش با موفقیت ثبت شد' : 'Transaction Logged!'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isFa
                ? `مبلغ ${formatCurrency(lastLoggedTxAmount, currency, isFa)} در حساب شما ثبت شد و فوراً در حساب اصلی سرپرست خانواده اضافه و همگام گردید.`
                : `Successfully recorded and aggregated to head account.`}
            </p>
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="mt-5 w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              {isFa ? 'متوجه شدم' : 'Got it'}
            </button>
          </div>
        </div>
      )}

      {/* Allowance Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div 
            className="fixed inset-0"
            onClick={() => setIsRequestModalOpen(false)}
          />
          <div className="relative w-full max-w-md my-auto max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-purple-600" />
                <span>{isFa ? 'ارسال درخواست وجه یا پول توجیبی' : 'Request Allowance'}</span>
              </h4>
              <button 
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            </div>

            {requestSubmittedSuccess ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 animate-bounce" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {isFa ? 'درخواست شما برای سرپرست خانواده ارسال شد' : 'Request submitted successfully'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {isFa ? 'سرپرست می‌تواند با یک کلیک آن را تایید و به حسابتان واریز کند.' : 'Head of family can approve it.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isFa ? 'مبلغ مورد نیاز' : 'Requested Amount'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ۱۰۰,۰۰۰"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full text-lg font-bold px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isFa ? 'علت یا بابت' : 'Reason / Note'}
                  </label>
                  <input
                    type="text"
                    placeholder={isFa ? 'مثال: خرید کتاب درسی، کرایه، اردو مدرسه...' : 'Reason for request...'}
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    {isFa ? 'انصراف' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={!requestAmount}
                    className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                  >
                    {isFa ? 'ارسال درخواست' : 'Send Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
