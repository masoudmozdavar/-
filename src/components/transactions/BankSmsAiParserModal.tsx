import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Receipt,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  CreditCard,
  Tag,
  Users,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ArrowLeftRight,
  ChevronDown,
  Loader2,
  Layers,
  HelpCircle,
  FileText
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { SAMPLE_BANK_SMS, parseBankSmsLocally, ParsedSmsResult } from '../../utils/bankSmsParser';
import { playAlertSound } from '../../utils/audioAlert';

interface BankSmsAiParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNavigate?: () => void;
}

export const BankSmsAiParserModal: React.FC<BankSmsAiParserModalProps> = ({
  isOpen,
  onClose,
  onSuccessNavigate
}) => {
  const {
    addTransaction,
    accounts,
    categories,
    familyMembers,
    activeMember,
    currency,
    language
  } = useFinance();

  const isFa = language === 'fa';

  const [smsInput, setSmsInput] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSmsResult | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(activeMember.id);
  const [customDescription, setCustomDescription] = useState<string>('');
  const [customMerchant, setCustomMerchant] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [customType, setCustomType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);
  const [savedTxId, setSavedTxId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-match bank name or card with an existing account
  const matchAccountFromSms = (bankName: string, cardOrAccount?: string): string => {
    if (!accounts.length) return '';
    
    // First try by card number suffix
    if (cardOrAccount) {
      const cleanDigits = cardOrAccount.replace(/[^0-9]/g, '');
      if (cleanDigits.length >= 4) {
        const suffix = cleanDigits.slice(-4);
        const matchByCard = accounts.find(a => 
          (a.cardNumber && a.cardNumber.endsWith(suffix)) || 
          (a.accountNumber && a.accountNumber.endsWith(suffix))
        );
        if (matchByCard) return matchByCard.id;
      }
    }

    // Try by bank name keywords
    const lowerBank = bankName.toLowerCase();
    const matchByName = accounts.find(a => {
      const aName = a.name.toLowerCase();
      const aBank = (a.bankName || '').toLowerCase();
      return (
        aName.includes(lowerBank) || 
        lowerBank.includes(aName) ||
        (aBank && (aBank.includes(lowerBank) || lowerBank.includes(aBank)))
      );
    });

    if (matchByName) return matchByName.id;

    // Default to the first account
    return accounts[0].id;
  };

  // Auto-match category
  const matchCategoryFromSuggestion = (catId?: string, type: 'expense' | 'income' | 'transfer' = 'expense'): string => {
    if (type === 'income') {
      const incomeCat = categories.find(c => c.type === 'income');
      return incomeCat ? incomeCat.id : (categories[0]?.id || '');
    }

    if (catId) {
      const exactMatch = categories.find(c => c.id === catId);
      if (exactMatch) return exactMatch.id;
    }

    const firstExpense = categories.find(c => c.type === 'expense');
    return firstExpense ? firstExpense.id : (categories[0]?.id || '');
  };

  // Perform AI Analysis via Server Gemini Endpoint
  const handleAnalyzeSms = async (textToAnalyze?: string) => {
    const text = (textToAnalyze || smsInput).trim();
    if (!text) {
      setAnalysisError(isFa ? 'لطفاً متن پیامک بانکی را وارد کنید.' : 'Please enter the SMS text.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setIsSavedSuccess(false);

    try {
      const response = await fetch('/api/gemini/parse-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smsText: text })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const resData = await response.json();
      if (!resData.success || !resData.data) {
        throw new Error(resData.error || 'Failed to parse SMS');
      }

      const result: ParsedSmsResult = resData.data;
      setParsedData(result);
      setCustomAmount(result.amount.toString());
      setCustomMerchant(result.merchantName || '');
      setCustomType(result.type);
      setCustomDescription(result.description || '');

      // Auto match account & category
      const matchedAcc = matchAccountFromSms(result.bankName, result.cardOrAccount);
      setSelectedAccountId(matchedAcc);

      const matchedCat = matchCategoryFromSuggestion(result.suggestedCategoryId, result.type);
      setSelectedCategoryId(matchedCat);
    } catch (err: any) {
      console.warn('Gemini endpoint error, falling back to client smart parser:', err);
      // Fallback locally
      const localResult = parseBankSmsLocally(text);
      setParsedData(localResult);
      setCustomAmount(localResult.amount.toString());
      setCustomMerchant(localResult.merchantName || '');
      setCustomType(localResult.type);
      setCustomDescription(localResult.description || '');

      const matchedAcc = matchAccountFromSms(localResult.bankName, localResult.cardOrAccount);
      setSelectedAccountId(matchedAcc);

      const matchedCat = matchCategoryFromSuggestion(localResult.suggestedCategoryId, localResult.type);
      setSelectedCategoryId(matchedCat);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Paste from clipboard
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSmsInput(text);
        handleAnalyzeSms(text);
      }
    } catch (e) {
      setAnalysisError(isFa ? 'دسترسی به کلیپ‌بورد مقدور نیست. لطفاً متن را دستی پیست کنید.' : 'Cannot read clipboard.');
    }
  };

  // Apply Sample SMS
  const handleApplySample = (sampleText: string) => {
    setSmsInput(sampleText);
    handleAnalyzeSms(sampleText);
  };

  // Save to Database
  const handleSaveToTransactions = () => {
    if (!parsedData) return;

    const amountNum = parseFloat(customAmount) || parsedData.amount;
    if (amountNum <= 0) {
      setAnalysisError(isFa ? 'مبلغ تراکنش نامعتبر است.' : 'Invalid transaction amount.');
      return;
    }

    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }

    const txId = `tx_sms_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Add transaction to database
    addTransaction({
      amount: amountNum,
      type: customType,
      categoryId: selectedCategoryId || (categories[0]?.id || 'cat_other'),
      accountId: selectedAccountId || (accounts[0]?.id || 'acc_1'),
      memberId: selectedMemberId || activeMember.id,
      date: parsedData.gregorianDate || new Date().toISOString().split('T')[0],
      jalaliDate: parsedData.jalaliDate,
      time: parsedData.time || new Date().toTimeString().slice(0, 5),
      description: customDescription || `${customType === 'income' ? 'واریز از' : 'خرید از'} ${customMerchant || parsedData.merchantName}`,
      merchant: customMerchant || parsedData.merchantName,
      trackingCode: parsedData.trackingCode,
      notes: `ثبت خودکار از پیامک ${parsedData.bankName} (تحلیلگر هوشمند جمنای)`,
      status: 'completed',
    });

    // Audio cue
    playAlertSound('success');

    setIsSavedSuccess(true);
    setSavedTxId(txId);
  };

  // Reset to analyze another SMS
  const handleResetForNext = () => {
    setSmsInput('');
    setParsedData(null);
    setIsSavedSuccess(false);
    setSavedTxId(null);
    setAnalysisError(null);
  };

  return (
    <div key="bank-sms-parser-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        key="bank-sms-parser-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md cursor-pointer"
      />

      {/* Main Dialog Window */}
      <motion.div
        key="bank-sms-parser-window"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-3xl my-auto max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isFa ? 'تحلیل خودکار پیامک بانکی با هوش مصنوعی جمنای' : 'AI Bank SMS Auto-Parser'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isFa 
                  ? 'استخراج خودکار مبلغ، نام پذیرنده، تاریخ و ثبت فوری در دیتابیس تراکنش‌ها' 
                  : 'Automatically extracts amounts, merchants, dates and saves to transactions'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* If already saved successfully */}
          {isSavedSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-10 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  {isFa ? 'تراکنش با موفقیت در دیتابیس ذخیره شد!' : 'Transaction Successfully Recorded!'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {isFa 
                    ? `مبلغ ${formatCurrency(parseFloat(customAmount) || 0, currency, isFa)} بابت ${customMerchant || 'تراکنش'} در حساب کسر/افزوده شد.` 
                    : `Amount recorded and synced with your family accounts.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  onClick={handleResetForNext}
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isFa ? 'تحلیل پیامک بعدی' : 'Parse Another SMS'}</span>
                </button>

                {onSuccessNavigate && (
                  <button
                    onClick={() => {
                      onClose();
                      onSuccessNavigate();
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{isFa ? 'مشاهده در لیست تراکنش‌ها' : 'View Transactions'}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <>
              {/* Input Area */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>{isFa ? 'متن پیامک بانکی را وارد کنید:' : 'Paste Bank SMS Message:'}</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isFa ? 'چسباندن (Paste)' : 'Paste'}</span>
                    </button>
                    {smsInput && (
                      <button
                        type="button"
                        onClick={() => { setSmsInput(''); setParsedData(null); }}
                        className="text-[11px] text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isFa ? 'پاک کردن' : 'Clear'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={smsInput}
                    onChange={(e) => setSmsInput(e.target.value)}
                    placeholder={isFa ? 'متن پیامک واریز یا برداشت بانک (ملت، سامان، ملی، بلو، پاسارگاد و...) را اینجا کپی و جای‌گذاری کنید...' : 'Paste transaction SMS from your bank here...'}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-mono leading-relaxed"
                  />
                </div>

                {/* Preset sample buttons */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span>{isFa ? 'نمونه‌های آماده پیامک بانک‌ها برای تست سریع:' : 'Quick test samples:'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_BANK_SMS.map((sample, idx) => (
                      <button
                        key={`sample-sms-${sample.id}-${idx}`}
                        type="button"
                        onClick={() => handleApplySample(sample.text)}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        {sample.bank}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Analyze Trigger Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleAnalyzeSms()}
                    disabled={isAnalyzing || !smsInput.trim()}
                    className={`w-full py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      isAnalyzing || !smsInput.trim()
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-blue-500/20 active:scale-[0.99]'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isFa ? 'در حال استخراج اطلاعات با هوش مصنوعی جمنای...' : 'Analyzing with Gemini AI...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>{isFa ? 'تحلیل هوشمند پیامک با جمنای (Gemini AI)' : 'Analyze with Gemini AI'}</span>
                      </>
                    )}
                  </button>
                </div>

                {analysisError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{analysisError}</span>
                  </div>
                )}
              </div>

              {/* Analysis Result & Edit Form */}
              {parsedData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800"
                >
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        {isFa 
                          ? `اطلاعات با موفقیت استخراج شد (${parsedData.source === 'gemini-ai' ? 'مدل Gemini 3.8 Flash' : 'موتور هوشمند محلی'})` 
                          : `Successfully parsed (${parsedData.source === 'gemini-ai' ? 'Gemini 3.8 Flash' : 'Smart Heuristics'})`}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {parsedData.bankName}
                    </span>
                  </div>

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Amount */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {isFa ? 'مبلغ استخراج‌شده (تومان):' : 'Amount (Toman):'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {isFa ? 'تومان' : 'Toman'}
                        </span>
                      </div>
                      {parsedData.originalAmountString && (
                        <p className="text-[10px] text-slate-400">
                          {isFa ? `متن پیامک: ${parsedData.originalAmountString}` : `Original: ${parsedData.originalAmountString}`}
                        </p>
                      )}
                    </div>

                    {/* Transaction Type */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {isFa ? 'نوع تراکنش:' : 'Transaction Type:'}
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCustomType('expense')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            customType === 'expense'
                              ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700'
                              : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}
                        >
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>{isFa ? 'برداشت/هزینه' : 'Expense'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCustomType('income')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            customType === 'income'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                              : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>{isFa ? 'واریز/درآمد' : 'Income'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCustomType('transfer')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            customType === 'transfer'
                              ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700'
                              : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>{isFa ? 'انتقال' : 'Transfer'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Merchant / Payee */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {isFa ? 'نام پذیرنده / فروشگاه / مقصد:' : 'Merchant / Payee:'}
                      </label>
                      <input
                        type="text"
                        value={customMerchant}
                        onChange={(e) => setCustomMerchant(e.target.value)}
                        placeholder={isFa ? 'مثلاً افق کوروش، اسنپ...' : 'Merchant name'}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Target Bank Account */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                        <span>{isFa ? 'حساب مبدأ / مقصد در برنامه:' : 'Account in App:'}</span>
                      </label>
                      <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {accounts.map((acc, idx) => (
                          <option key={`sms-target-acc-${acc.id}-${idx}`} value={acc.id}>
                            {acc.name} ({formatCurrency(acc.balance, currency, isFa)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{isFa ? 'دسته‌بندی خودکار:' : 'Category:'}</span>
                      </label>
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {categories
                          .filter(c => customType === 'income' ? c.type === 'income' : c.type === 'expense')
                          .map((cat, idx) => (
                            <option key={`sms-cat-opt-${cat.id}-${idx}`} value={cat.id}>
                              {isFa ? cat.name : cat.nameEn}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Family Member */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-purple-500" />
                        <span>{isFa ? 'عضو خانواده (صاحب تراکنش):' : 'Family Member:'}</span>
                      </label>
                      <select
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {familyMembers.map((m, idx) => (
                          <option key={`sms-mem-opt-${m.id}-${idx}`} value={m.id}>
                            {m.avatar} {m.name} ({m.role === 'head' ? (isFa ? 'سرپرست' : 'Head') : (isFa ? 'عضو' : 'Member')})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Jalali Date & Time */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>{isFa ? 'تاریخ و ساعت استخراج‌شده:' : 'Extracted Date & Time:'}</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800/80 px-3 py-2 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {parsedData.jalaliDate}
                        </div>
                        {parsedData.time && (
                          <div className="w-24 bg-slate-100 dark:bg-slate-800/80 px-3 py-2 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{parsedData.time}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tracking Code & Balance After */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {isFa ? 'کد پیگیری و مانده حساب:' : 'Tracking & Balance:'}
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800/80 px-3 py-2 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {parsedData.trackingCode ? `پیگیری: ${parsedData.trackingCode}` : (isFa ? 'کد پیگیری ندارد' : 'No code')}
                        </div>
                        {parsedData.balanceAfter !== undefined && (
                          <div className="bg-slate-100 dark:bg-slate-800/80 px-3 py-2 rounded-xl text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700">
                            {formatCurrency(parsedData.balanceAfter, currency, isFa)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary / Description */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      {isFa ? 'شرح تراکنش جهت ذخیره:' : 'Transaction Description:'}
                    </label>
                    <input
                      type="text"
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveToTransactions}
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isFa ? 'ثبت خودکار این تراکنش در دیتابیس' : 'Auto-Save to Database'}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
