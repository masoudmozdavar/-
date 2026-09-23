import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { TransactionType } from '../../types';
import { getTodayISO, getTodayJalali } from '../../utils/jalali';
import { formatCurrency, formatNumber, fromPersianDigits, toPersianDigits } from '../../utils/formatters';
import { PersianDatePicker } from '../common/PersianDatePicker';
import { IconRenderer } from '../common/IconRenderer';
import { TransactionCalculator } from './TransactionCalculator';
import { TransactionCategoryClassifier, CategorySuggestion } from '../../utils/categoryClassifier';
import { CameraScannerModal } from './CameraScannerModal';
import { ReceiptViewerModal } from './ReceiptViewerModal';
import { BankSmsAiParserModal } from './BankSmsAiParserModal';
import { AutoSaveIndicator } from '../common/AutoSaveIndicator';
import { useFormDraft } from '../../hooks/useAutoSave';
import { compressImage } from '../../utils/imageCompressor';
import { 
  X, 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  AlertOctagon, 
  Calculator, 
  ChevronDown, 
  ChevronUp, 
  BrainCircuit, 
  CheckCircle2, 
  Wand2,
  Camera,
  Image as ImageIcon,
  Eye,
  Trash2,
  Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const TransactionModal: React.FC = () => {
  const {
    isTransactionModalOpen,
    closeTransactionModal,
    editingTransaction,
    addTransaction,
    updateTransaction,
    accounts,
    categories,
    transactions,
    familyMembers,
    activeMemberId,
    currency,
    language,
  } = useFinance();

  const isFa = language === 'fa';

  const [type, setType] = useState<TransactionType>('expense');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(activeMemberId || 'head');
  const [amountStr, setAmountStr] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [jalaliDate, setJalaliDate] = useState<string>(getTodayJalali());
  const [isoDate, setIsoDate] = useState<string>(getTodayISO());
  const [description, setDescription] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [appliedAiCategoryNotification, setAppliedAiCategoryNotification] = useState<string | null>(null);

  // Modals for camera, receipt preview and AI SMS parser
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isReceiptViewerOpen, setIsReceiptViewerOpen] = useState<boolean>(false);
  const [isSmsParserOpen, setIsSmsParserOpen] = useState<boolean>(false);
  const fileUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-save form draft in localStorage
  const formDraftData = React.useMemo(() => ({
    type,
    amountStr,
    categoryId,
    accountId,
    toAccountId,
    jalaliDate,
    isoDate,
    description,
    receiptImage,
  }), [type, amountStr, categoryId, accountId, toAccountId, jalaliDate, isoDate, description, receiptImage]);

  const { hasDraft, lastSavedAt, clearDraft } = useFormDraft(
    'transaction_modal_draft',
    formDraftData,
    {
      enabled: isTransactionModalOpen && !editingTransaction,
      isEmpty: (v) => !v.amountStr && !v.description && !v.receiptImage,
      onRestore: (saved) => {
        if (!editingTransaction) {
          if (saved.type) setType(saved.type);
          if (saved.amountStr) setAmountStr(saved.amountStr);
          if (saved.categoryId) setCategoryId(saved.categoryId);
          if (saved.accountId) setAccountId(saved.accountId);
          if (saved.toAccountId) setToAccountId(saved.toAccountId);
          if (saved.jalaliDate) setJalaliDate(saved.jalaliDate);
          if (saved.isoDate) setIsoDate(saved.isoDate);
          if (saved.description) setDescription(saved.description);
          if (saved.receiptImage) setReceiptImage(saved.receiptImage);
        }
      },
    }
  );

  useEffect(() => {
    setShowCalculator(false);
    setAppliedAiCategoryNotification(null);
    if (editingTransaction) {
      setType(editingTransaction.type);
      setSelectedMemberId(editingTransaction.memberId || 'head');
      setAmountStr(String(editingTransaction.amount));
      setCategoryId(editingTransaction.categoryId);
      setAccountId(editingTransaction.accountId);
      setToAccountId(editingTransaction.toAccountId || '');
      setJalaliDate(editingTransaction.jalaliDate);
      setIsoDate(editingTransaction.date);
      setDescription(editingTransaction.description || '');
      setReceiptImage(editingTransaction.receiptImage || null);
    } else {
      setType('expense');
      setSelectedMemberId(activeMemberId || 'head');
      setAmountStr('');
      // Set default category for expense
      const defaultCat = categories.find(c => c.type === 'expense');
      setCategoryId(defaultCat ? defaultCat.id : (categories[0]?.id || ''));
      // Set default account
      const defaultAcc = accounts.find(a => a.isDefault) || accounts[0];
      setAccountId(defaultAcc ? defaultAcc.id : '');
      const secAcc = accounts.find(a => a.id !== defaultAcc?.id);
      setToAccountId(secAcc ? secAcc.id : '');
      setJalaliDate(getTodayJalali());
      setIsoDate(getTodayISO());
      setDescription('');
      setReceiptImage(null);
    }
  }, [editingTransaction, isTransactionModalOpen, categories, accounts]);

  const rawAmount = Number(fromPersianDigits(amountStr.replace(/,/g, ''))) || 0;

  const filteredCategories = categories.filter(c => {
    if (type === 'transfer') return false;
    return c.type === type;
  });

  // Machine Learning Model instance trained on user's past transactions
  const classifier = React.useMemo(() => {
    return new TransactionCategoryClassifier(transactions, categories);
  }, [transactions, categories]);

  // Predict category suggestions based on description, amount and transaction type
  const categorySuggestions = React.useMemo(() => {
    if (type === 'transfer') return [];
    return classifier.predict(description, rawAmount, type);
  }, [classifier, description, rawAmount, type]);

  const topSuggestion = categorySuggestions.length > 0 ? categorySuggestions[0] : null;

  // Proactive budget calculation for expense transactions
  const budgetImpact = React.useMemo(() => {
    if (type !== 'expense' || !categoryId) return null;
    const cat = categories.find(c => c.id === categoryId);
    if (!cat || !cat.budgetMonthly || cat.budgetMonthly <= 0) return null;

    const limit = cat.budgetMonthly;
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Current spent in this category (excluding currently editing transaction if modifying)
    const currentSpent = transactions
      .filter(t => t.type === 'expense' && t.categoryId === categoryId && (!editingTransaction || t.id !== editingTransaction.id) && new Date(t.date) >= thirtyDaysAgo)
      .reduce((sum, t) => sum + t.amount, 0);

    const newTotal = currentSpent + rawAmount;
    const pct = Math.round((newTotal / limit) * 100);
    const isExceeded = newTotal > limit;
    const isApproaching = pct >= 80 && !isExceeded;

    return {
      category: cat,
      limit,
      currentSpent,
      newTotal,
      pct,
      isExceeded,
      isApproaching,
      remaining: Math.max(0, limit - newTotal),
      excess: Math.max(0, newTotal - limit)
    };
  }, [type, categoryId, categories, transactions, rawAmount, editingTransaction]);

  const handleApplySuggestion = (sug: CategorySuggestion) => {
    setCategoryId(sug.category.id);
    setAppliedAiCategoryNotification(sug.category.id);
    setTimeout(() => {
      setAppliedAiCategoryNotification(null);
    }, 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rawAmount <= 0) return;
    if (!accountId) return;
    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) return;

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        type,
        amount: rawAmount,
        categoryId: type === 'transfer' ? 'cat-other-exp' : categoryId,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        date: isoDate,
        jalaliDate,
        description,
        receiptImage: receiptImage || undefined,
        memberId: selectedMemberId,
      });
    } else {
      addTransaction({
        type,
        amount: rawAmount,
        categoryId: type === 'transfer' ? 'cat-other-exp' : categoryId,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        date: isoDate,
        jalaliDate,
        description,
        receiptImage: receiptImage || undefined,
        memberId: selectedMemberId,
      });
      clearDraft();
    }

    closeTransactionModal();
  };

  return (
    <>
      <AnimatePresence>
        {isTransactionModalOpen && (
          <div key="modal-transaction-dialog-overlay" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            key="transaction-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeTransactionModal}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

        {/* Modal Window */}
        <motion.div
          key="transaction-modal-window"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100 max-h-[92vh] sm:max-h-[90vh] my-0 sm:my-auto flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {editingTransaction
                    ? (isFa ? 'ویرایش تراکنش' : 'Edit Transaction')
                    : (isFa ? 'ثبت تراکنش جدید' : 'New Transaction')}
                </h3>
                {!editingTransaction && (
                  <div className="mt-0.5">
                    <AutoSaveIndicator
                      hasDraft={hasDraft}
                      lastSavedAt={lastSavedAt}
                      onClearDraft={clearDraft}
                      isFa={isFa}
                    />
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={closeTransactionModal}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
            {/* Quick Bank SMS AI Extraction Banner */}
            {!editingTransaction && (
              <button
                type="button"
                onClick={() => setIsSmsParserOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 dark:from-slate-800 dark:to-slate-800/80 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 transition-all cursor-pointer shadow-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold block">
                      {isFa ? 'تحلیل خودکار پیامک بانک با جمنای (Gemini AI)' : 'Auto-record from Bank SMS (Gemini AI)'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isFa ? 'چسباندن متن پیامک و استخراج آنی مبلغ، پذیرنده و تاریخ' : 'Paste SMS to extract amount, merchant & date'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-[-2px] transition-transform rtl:group-hover:translate-x-[-2px]">
                  ←
                </span>
              </button>
            )}

            {/* Transaction Type Segmented Control */}
            <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 border border-slate-200/80 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  const cat = categories.find(c => c.type === 'expense');
                  if (cat) setCategoryId(cat.id);
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>{isFa ? 'هزینه' : 'Expense'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('income');
                  const cat = categories.find(c => c.type === 'income');
                  if (cat) setCategoryId(cat.id);
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{isFa ? 'درآمد' : 'Income'}</span>
              </button>

              <button
                type="button"
                onClick={() => setType('transfer')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  type === 'transfer'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>{isFa ? 'انتقال' : 'Transfer'}</span>
              </button>
            </div>

            {/* Family Member Assignment (Recorded by / for) */}
            {familyMembers.length > 1 && (
              <div className="bg-slate-50/80 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  {isFa ? 'عضو ثبت‌کننده (ثبت در حساب اصلی سرپرست):' : 'Registered by member:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {familyMembers.map((m, idx) => (
                    <button
                      key={`modal-member-${m.id}-${idx}`}
                      type="button"
                      onClick={() => setSelectedMemberId(m.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        selectedMemberId === m.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-sm">{m.avatar}</span>
                      <span>{m.name}</span>
                      {m.role === 'head' && (
                        <span className="text-[9px] px-1 py-0.2 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded font-normal">
                          {isFa ? 'سرپرست' : 'Head'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Amount Input & Quick Calculator */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  {isFa ? 'مبلغ تراکنش' : 'Amount'} ({isFa ? 'تومان' : 'Toman'})
                </label>
                <button
                  type="button"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    showCalculator
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Calculator className={`w-3.5 h-3.5 ${showCalculator ? 'text-white' : 'text-blue-600'}`} />
                  <span>{isFa ? 'ماشین‌حساب سریع' : 'Quick Calculator'}</span>
                  {showCalculator ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={isFa ? 'مثال: ۵۰۰,۰۰۰' : 'e.g. 500,000'}
                  value={amountStr ? toPersianDigits(Number(fromPersianDigits(amountStr.replace(/,/g, ''))).toLocaleString('en-US')) : ''}
                  onChange={(e) => {
                    const raw = fromPersianDigits(e.target.value).replace(/\D/g, '');
                    setAmountStr(raw);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-lg font-black text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                  {currency === 'rial' ? (isFa ? 'ریال' : 'IRR') : (isFa ? 'تومان' : 'Toman')}
                </span>
              </div>

              {rawAmount > 0 && !showCalculator && (
                <div className="mt-1 text-xs text-blue-600 font-bold">
                  {formatCurrency(rawAmount, currency, isFa)}
                </div>
              )}

              {/* Expandable Calculator Widget */}
              <AnimatePresence>
                {showCalculator && (
                  <motion.div
                    key="transaction-calculator-widget"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pt-1"
                  >
                    <TransactionCalculator
                      initialValue={rawAmount}
                      currency={currency}
                      language={language}
                      onApply={(val) => {
                        setAmountStr(String(val));
                        setShowCalculator(false);
                      }}
                      onClose={() => setShowCalculator(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Description & Note Input (Drives ML Classification) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {isFa ? 'شرح و بابت تراکنش' : 'Description & Note'}
                </label>
                <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                  <BrainCircuit className="w-3 h-3" />
                  {isFa ? 'پیشنهاد هوشمند دسته با مدل یادگیری ماشین' : 'ML Category Classifier'}
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isFa ? 'مثلا: اسنپ، سوپرمارکت، خرید میوه، کافه، واریز حقوق...' : 'e.g. Taxi, grocery, fruit, cafe, salary...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Quick tags to quickly test/fill description */}
              {!description && (
                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-medium ml-1">
                    {isFa ? 'میانبرها:' : 'Presets:'}
                  </span>
                  {[
                    { fa: 'اسنپ', en: 'Taxi' },
                    { fa: 'سوپرمارکت', en: 'Supermarket' },
                    { fa: 'کافه', en: 'Cafe' },
                    { fa: 'بنزین', en: 'Fuel' },
                    { fa: 'خرید لباس', en: 'Clothes' },
                    { fa: 'واریز حقوق', en: 'Salary' },
                    { fa: 'قسط وام', en: 'Loan' },
                  ].map((tag, idx) => (
                    <button
                      key={`tx-quick-tag-${tag.fa}-${idx}`}
                      type="button"
                      onClick={() => setDescription(isFa ? tag.fa : tag.en)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      {isFa ? tag.fa : tag.en}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Categories Grid (for Income/Expense) & ML Suggestions */}
            {type !== 'transfer' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    {isFa ? 'دسته‌بندی' : 'Category'}
                  </label>
                  {topSuggestion && (
                    <span className="text-[10px] text-slate-500 font-medium">
                      {isFa ? `${toPersianDigits(filteredCategories.length)} دسته` : `${filteredCategories.length} categories`}
                    </span>
                  )}
                </div>

                {/* Machine Learning Smart Suggestion Card */}
                {topSuggestion && (
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    categoryId === topSuggestion.category.id
                      ? 'bg-blue-50/90 border-blue-300 text-blue-950 shadow-xs'
                      : 'bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-slate-50 border-indigo-200/90 text-slate-800'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold border shadow-xs"
                          style={{
                            backgroundColor: `${topSuggestion.category.color}20`,
                            borderColor: `${topSuggestion.category.color}40`,
                            color: topSuggestion.category.color,
                          }}
                        >
                          <IconRenderer name={topSuggestion.category.icon} size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                              <BrainCircuit className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                              {isFa ? 'پیشنهاد هوشمند یادگیری ماشین' : 'ML Model Suggestion'}
                            </span>
                            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                              topSuggestion.confidence >= 80
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {isFa ? `${toPersianDigits(topSuggestion.confidence)}٪ اطمینان` : `${topSuggestion.confidence}% confidence`}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                            {isFa ? topSuggestion.category.name : topSuggestion.category.nameEn}
                          </h4>
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {isFa ? topSuggestion.reasonFa : topSuggestion.reasonEn}
                          </p>
                        </div>
                      </div>

                      {/* Apply button */}
                      <button
                        type="button"
                        onClick={() => handleApplySuggestion(topSuggestion)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                          categoryId === topSuggestion.category.id
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:scale-105'
                        }`}
                      >
                        {categoryId === topSuggestion.category.id ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isFa ? 'انتخاب شده' : 'Selected'}</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3.5 h-3.5" />
                            <span>{isFa ? 'انتخاب این دسته' : 'Apply'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Secondary Candidate Predictions */}
                    {categorySuggestions.length > 1 && (
                      <div className="flex items-center gap-1.5 pt-2.5 mt-2 border-t border-indigo-100/90 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-medium">
                          {isFa ? 'سایر احتمالات:' : 'Other predictions:'}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {categorySuggestions.slice(1, 3).map((alt, idx) => (
                            <button
                              key={`tx-sug-alt-${alt.category.id}-${idx}`}
                              type="button"
                              onClick={() => handleApplySuggestion(alt)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                                categoryId === alt.category.id
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white/90 hover:bg-white text-slate-700 border-slate-200'
                              }`}
                            >
                              <span>{isFa ? alt.category.name : alt.category.nameEn}</span>
                              <span className="text-[9px] opacity-75 font-mono">
                                ({isFa ? toPersianDigits(alt.confidence) : alt.confidence}%)
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                  {filteredCategories.map((cat, idx) => {
                    const isSelected = categoryId === cat.id;
                    const isTopSuggested = topSuggestion?.category.id === cat.id;
                    return (
                      <button
                        key={`tx-cat-btn-${cat.id}-${idx}`}
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className={`relative flex flex-col items-center gap-1.5 p-2 rounded-2xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-xs'
                            : isTopSuggested
                            ? 'bg-indigo-50/40 border-indigo-300 text-slate-800 hover:border-indigo-400'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                        }`}
                      >
                        {isTopSuggested && (
                          <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] p-0.5 rounded-full shadow-xs">
                            <Sparkles className="w-2.5 h-2.5" />
                          </span>
                        )}
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold"
                          style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                        >
                          <IconRenderer name={cat.icon} size={16} />
                        </div>
                        <span className="text-[11px] truncate w-full text-center">
                          {isFa ? cat.name : cat.nameEn}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Real-time Category Budget Alert Banner */}
                {budgetImpact && (budgetImpact.isApproaching || budgetImpact.isExceeded) && (
                  <div className={`mt-3 p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 transition-all ${
                    budgetImpact.isExceeded
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    {budgetImpact.isExceeded ? (
                      <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5 w-full">
                      <div className="font-bold flex items-center justify-between gap-1.5">
                        <span className="flex items-center gap-1.5">
                          {budgetImpact.isExceeded 
                            ? (isFa ? 'هشدار: عبور از سقف بودجه ماهانه!' : 'Budget Limit Exceeded!') 
                            : (isFa ? 'توجه: نزدیک شدن به سقف بودجه ماهانه' : 'Approaching Budget Limit')}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                          budgetImpact.isExceeded ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                        }`}>
                          {isFa ? `${toPersianDigits(budgetImpact.pct)}٪ از سقف` : `${budgetImpact.pct}% of limit`}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {budgetImpact.isExceeded
                          ? (isFa 
                              ? `با ثبت این هزینه، مجموع مخارج دسته «${budgetImpact.category.name}» به ${formatCurrency(budgetImpact.newTotal, currency, isFa)} می‌رسد و ${formatCurrency(budgetImpact.excess, currency, isFa)} از سقف مجاز (${formatCurrency(budgetImpact.limit, currency, isFa)}) فراتر خواهد رفت.`
                              : `Total category spending will reach ${formatCurrency(budgetImpact.newTotal, currency, isFa)}, exceeding the monthly budget by ${formatCurrency(budgetImpact.excess, currency, isFa)}.`)
                          : (isFa 
                              ? `با ثبت این مبلغ، تنها ${formatCurrency(budgetImpact.remaining, currency, isFa)} تا سقف ماهانه دسته «${budgetImpact.category.name}» باقی می‌ماند.`
                              : `With this amount, only ${formatCurrency(budgetImpact.remaining, currency, isFa)} remains before reaching the monthly budget limit.`)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Accounts Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {type === 'transfer' ? (isFa ? 'حساب مبدأ' : 'From Account') : (isFa ? 'حساب / کارت' : 'Account')}
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer font-medium"
                >
                  {accounts.map((acc, idx) => (
                    <option key={`tx-acc-from-opt-${acc.id}-${idx}`} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.balance, currency, isFa)})
                    </option>
                  ))}
                </select>
              </div>

              {type === 'transfer' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isFa ? 'حساب مقصد' : 'To Account'}
                  </label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer font-medium"
                  >
                    {accounts.filter(a => a.id !== accountId).map((acc, idx) => (
                      <option key={`tx-acc-to-opt-${acc.id}-${idx}`} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.balance, currency, isFa)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <PersianDatePicker
                    label={isFa ? 'تاریخ تراکنش (شمسی)' : 'Date (Shamsi)'}
                    valueJalali={jalaliDate}
                    onChange={(jDate, iDate) => {
                      setJalaliDate(jDate);
                      setIsoDate(iDate);
                    }}
                    isPersianLang={isFa}
                  />
                </div>
              )}
            </div>

            {type === 'transfer' && (
              <div>
                <PersianDatePicker
                  label={isFa ? 'تاریخ انتقال (شمسی)' : 'Transfer Date'}
                  valueJalali={jalaliDate}
                  onChange={(jDate, iDate) => {
                    setJalaliDate(jDate);
                    setIsoDate(iDate);
                  }}
                  isPersianLang={isFa}
                />
              </div>
            )}

            {/* Description / Memo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isFa ? 'توضیحات و بابت تراکنش' : 'Description / Memo'}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isFa ? 'مثلاً: خرید هفتگی سوپرمارکت، واریز حقوق، فاکتور شماره ۱۲' : 'e.g. Weekly grocery, Salary, Rent'}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Receipt Photo / Camera Attachment Section */}
            <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-800">
                    {isFa ? 'عکس یا رسید تراکنش' : 'Receipt / Invoice Photo'}
                  </span>
                </div>
                {receiptImage && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {isFa ? 'رسید ضمیمه است' : 'Attached'}
                  </span>
                )}
              </div>

              {receiptImage ? (
                /* Attached Photo Preview Card */
                <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div 
                    onClick={() => setIsReceiptViewerOpen(true)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0">
                      <img 
                        src={receiptImage} 
                        alt="Receipt thumbnail" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                        <span>{isFa ? 'تصویر رسید تراکنش' : 'Receipt Photo'}</span>
                        <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {isFa ? 'برای مشاهده اندازه کامل کلیک کنید' : 'Click to view full image'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsReceiptViewerOpen(true)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title={isFa ? 'مشاهده کامل' : 'View'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceiptImage(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title={isFa ? 'حذف رسید' : 'Remove'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Action buttons for camera or gallery */
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-xs font-bold text-slate-700 hover:text-blue-700 transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>{isFa ? 'عکس‌برداری با دوربین' : 'Camera Capture'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileUploadInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>{isFa ? 'انتخاب فایل از دستگاه' : 'Upload Image'}</span>
                  </button>
                </div>
              )}

              {/* Hidden file input for manual file selection */}
              <input
                ref={fileUploadInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const compressed = await compressImage(file, 1024, 1024, 0.8);
                      setReceiptImage(compressed);
                    } catch {
                      // ignore
                    }
                  }
                }}
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={closeTransactionModal}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isFa ? 'انصراف' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={rawAmount <= 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingTransaction ? (isFa ? 'ذخیره تغییرات' : 'Save Changes') : (isFa ? 'ثبت نهایی' : 'Submit Transaction')}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
      )}
    </AnimatePresence>

    {/* Camera Live Viewfinder Modal */}
    <CameraScannerModal
      key="modal-camera-scanner-viewfinder"
      isOpen={isCameraModalOpen}
      onClose={() => setIsCameraModalOpen(false)}
      onCapture={(img) => setReceiptImage(img)}
      isFa={isFa}
    />

    {/* Full-size Receipt Photo Viewer Modal */}
    <ReceiptViewerModal
      key="modal-receipt-viewer-photo"
      isOpen={isReceiptViewerOpen}
      onClose={() => setIsReceiptViewerOpen(false)}
      imageUrl={receiptImage}
      onRemove={() => setReceiptImage(null)}
      isFa={isFa}
      title={isFa ? 'تصویر رسید یا فاکتور تراکنش' : 'Transaction Receipt'}
    />

    {/* AI Bank SMS Parser Modal */}
    <BankSmsAiParserModal
      key="modal-bank-sms-parser-ai"
      isOpen={isSmsParserOpen}
      onClose={() => setIsSmsParserOpen(false)}
      onSuccessNavigate={closeTransactionModal}
    />
  </>
  );
};
