import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types';
import { formatCurrency, formatNumber, toPersianDigits } from '../../utils/formatters';
import { exportTransactionsCSV } from '../../utils/storage';
import { IconRenderer } from '../common/IconRenderer';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Trash2, 
  Edit3, 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowLeftRight,
  Calendar,
  Layers,
  ArrowUpDown,
  Paperclip,
  Eye,
  Sparkles
} from 'lucide-react';
import { ReceiptViewerModal } from './ReceiptViewerModal';
import { BankSmsAiParserModal } from './BankSmsAiParserModal';

export const TransactionManager: React.FC = () => {
  const {
    transactions,
    categories,
    accounts,
    familyMembers,
    currency,
    language,
    openTransactionModal,
    deleteTransaction,
  } = useFinance();

  const isFa = language === 'fa';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | TransactionType>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const [isSmsParserOpen, setIsSmsParserOpen] = useState(false);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Member Filter
      if (selectedMember !== 'all') {
        if (selectedMember === 'head' && t.memberId && t.memberId !== 'head') return false;
        if (selectedMember !== 'head' && t.memberId !== selectedMember) return false;
      }
      // Type
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      // Account
      if (selectedAccount !== 'all' && t.accountId !== selectedAccount && t.toAccountId !== selectedAccount) return false;
      // Category
      if (selectedCategory !== 'all' && t.categoryId !== selectedCategory) return false;
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const cat = categories.find(c => c.id === t.categoryId);
        const acc = accounts.find(a => a.id === t.accountId);
        const matchDesc = t.description?.toLowerCase().includes(term);
        const matchCat = cat?.name.toLowerCase().includes(term) || cat?.nameEn.toLowerCase().includes(term);
        const matchAcc = acc?.name.toLowerCase().includes(term);
        const matchAmount = String(t.amount).includes(term);
        const matchMember = t.memberName?.toLowerCase().includes(term);
        if (!matchDesc && !matchCat && !matchAcc && !matchAmount && !matchMember) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'highest') return b.amount - a.amount;
      if (sortBy === 'lowest') return a.amount - b.amount;
      return 0;
    });
  }, [transactions, categories, accounts, selectedType, selectedAccount, selectedCategory, selectedMember, searchTerm, sortBy]);

  // Filtered totals
  const { totalIn, totalOut, netDiff } = useMemo(() => {
    let inAmt = 0;
    let outAmt = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') inAmt += t.amount;
      if (t.type === 'expense') outAmt += t.amount;
    });
    return {
      totalIn: inAmt,
      totalOut: outAmt,
      netDiff: inAmt - outAmt,
    };
  }, [filteredTransactions]);

  const handleDelete = (id: string) => {
    if (confirm(isFa ? 'آیا از حذف این تراکنش مطمئن هستید؟ موجودی حساب به‌طور خودکار اصلاح خواهد شد.' : 'Delete this transaction?')) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {isFa ? 'مدیریت و ثبت تراکنش‌ها' : 'Transactions Manager'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isFa ? 'مشاهده، فیلتر و جستجوی تمام درآمدها، مخارج و انتقالات حساب‌ها' : 'Search, filter, and review all cash operations'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => setIsSmsParserOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 dark:from-indigo-950/40 dark:to-blue-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 shadow-xs transition-all cursor-pointer"
            title={isFa ? 'تحلیل خودکار پیامک بانک با هوش مصنوعی جمنای' : 'AI Bank SMS Parser'}
          >
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{isFa ? 'تحلیل پیامک بانکی (AI)' : 'AI SMS Parser'}</span>
          </button>

          <button
            onClick={() => exportTransactionsCSV(filteredTransactions, categories, accounts)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
            title="دانلود گزارش اکسل فیلتر شده"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>{isFa ? 'خروجی اکسل' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => openTransactionModal()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isFa ? 'تراکنش جدید' : 'New Transaction'}</span>
          </button>
        </div>
      </div>

      {/* Filtered Balance Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isFa ? 'مجموع درآمد فیلترشده' : 'Filtered Inflow'}</div>
              <div className="text-base font-black text-emerald-600 mt-0.5">
                {formatCurrency(totalIn, currency, isFa)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-bold">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isFa ? 'مجموع هزینه فیلترشده' : 'Filtered Outflow'}</div>
              <div className="text-base font-black text-rose-600 mt-0.5">
                {formatCurrency(totalOut, currency, isFa)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isFa ? 'تراز خالص (سود / زیان)' : 'Net Difference'}</div>
              <div className={`text-base font-black mt-0.5 ${netDiff >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                {formatCurrency(netDiff, currency, isFa)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2 md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 rtl:right-3.5 ltr:left-3.5" />
            <input
              type="text"
              placeholder={isFa ? 'جستجو در توضیحات، مبلغ یا اعضا...' : 'Search description, category, amount...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-10 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Family Member Filter */}
          <div>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer font-medium"
            >
              <option value="all">{isFa ? 'همه اعضای خانواده' : 'All Family'}</option>
              {familyMembers.map(m => (
                <option key={`tx-filter-m-${m.id}`} value={m.id}>
                  {m.avatar} {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer font-medium"
            >
              <option value="all">{isFa ? 'همه حساب‌ها' : 'All Accounts'}</option>
              {accounts.map((acc, idx) => (
                <option key={`tx-filter-acc-${acc.id}-${idx}`} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer font-medium"
            >
              <option value="all">{isFa ? 'همه دسته‌بندی‌ها' : 'All Categories'}</option>
              {categories.map((cat, idx) => (
                <option key={`tx-filter-cat-${cat.id}-${idx}`} value={cat.id}>{isFa ? cat.name : cat.nameEn}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Type & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Type Toggle Chips */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isFa ? 'همه' : 'All'}
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedType === 'expense'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isFa ? 'مخارج' : 'Expenses'}
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedType === 'income'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isFa ? 'درآمدها' : 'Incomes'}
            </button>
            <button
              onClick={() => setSelectedType('transfer')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedType === 'transfer'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isFa ? 'انتقالات' : 'Transfers'}
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">{isFa ? 'مرتب‌سازی:' : 'Sort:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none cursor-pointer font-medium"
            >
              <option value="newest">{isFa ? 'جدیدترین تاریخ' : 'Newest'}</option>
              <option value="oldest">{isFa ? 'قدیمی‌ترین تاریخ' : 'Oldest'}</option>
              <option value="highest">{isFa ? 'بیشترین مبلغ' : 'Highest Amount'}</option>
              <option value="lowest">{isFa ? 'کمترین مبلغ' : 'Lowest Amount'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Records List */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            {isFa ? 'هیچ تراکنشی مطابق با فیلترهای انتخابی یافت نشد.' : 'No transactions matched your filter criteria.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx, idx) => {
              const cat = categories.find(c => c.id === tx.categoryId);
              const acc = accounts.find(a => a.id === tx.accountId);
              const toAcc = tx.toAccountId ? accounts.find(a => a.id === tx.toAccountId) : null;
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={`tx-row-item-${tx.id}-${idx}`}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Category Icon */}
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 font-bold"
                      style={{
                        backgroundColor: isTransfer ? '#eff6ff' : isIncome ? '#ecfdf5' : '#fef2f2',
                        borderColor: isTransfer ? '#bfdbfe' : isIncome ? '#a7f3d0' : '#fecaca',
                        color: isTransfer ? '#2563eb' : isIncome ? '#059669' : '#dc2626',
                      }}
                    >
                      <IconRenderer name={cat?.icon || (isTransfer ? 'ArrowLeftRight' : 'CreditCard')} size={20} />
                    </div>

                    {/* Details */}
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {tx.description || (cat ? (isFa ? cat.name : cat.nameEn) : 'تراکنش')}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {cat ? (isFa ? cat.name : cat.nameEn) : (isFa ? 'انتقال' : 'Transfer')}
                        </span>
                        <span>•</span>
                        <span>
                          {isTransfer ? `${acc?.name} ⬅ ${toAcc?.name}` : acc?.name}
                        </span>
                        <span>•</span>
                        <span>{isFa ? toPersianDigits(tx.jalaliDate) : tx.date}</span>
                        {tx.memberName && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800 text-[10px]">
                              <span>👤</span>
                              <span>{tx.memberName}</span>
                            </span>
                          </>
                        )}
                        {tx.receiptImage && (
                          <>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingReceiptUrl(tx.receiptImage || null);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold border border-blue-200 transition-colors cursor-pointer"
                              title={isFa ? 'مشاهده رسید' : 'View receipt'}
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>{isFa ? 'رسید' : 'Receipt'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount and Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    {tx.receiptImage && (
                      <button
                        type="button"
                        onClick={() => setViewingReceiptUrl(tx.receiptImage || null)}
                        className="w-9 h-9 rounded-xl border border-slate-200 overflow-hidden hover:border-blue-400 transition-colors shrink-0 shadow-xs cursor-pointer group"
                        title={isFa ? 'مشاهده تصویر رسید' : 'View Receipt'}
                      >
                        <img 
                          src={tx.receiptImage} 
                          alt="Receipt" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                        />
                      </button>
                    )}

                    <div className="text-right">
                      <div className={`text-base font-black ${
                        isTransfer ? 'text-blue-600' : isIncome ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(tx.amount, currency, isFa)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 border-r border-slate-200 pr-2 rtl:border-r-0 rtl:border-l rtl:pr-0 rtl:pl-2">
                      <button
                        onClick={() => openTransactionModal(tx)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title={isFa ? 'ویرایش' : 'Edit'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={isFa ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Receipt Viewer Modal */}
      <ReceiptViewerModal
        key="tx-mgr-receipt-viewer-modal"
        isOpen={!!viewingReceiptUrl}
        onClose={() => setViewingReceiptUrl(null)}
        imageUrl={viewingReceiptUrl}
        isFa={isFa}
        title={isFa ? 'رسید تراکنش' : 'Transaction Receipt'}
      />

      {/* AI Bank SMS Parser Modal */}
      <BankSmsAiParserModal
        key="tx-mgr-sms-parser-modal"
        isOpen={isSmsParserOpen}
        onClose={() => setIsSmsParserOpen(false)}
      />
    </div>
  );
};
