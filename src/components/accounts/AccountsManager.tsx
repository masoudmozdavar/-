import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../types';
import { formatCardNumber, formatCurrency, fromPersianDigits, maskCardNumber, toPersianDigits } from '../../utils/formatters';
import { 
  CreditCard, 
  Plus, 
  ArrowLeftRight, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Coins, 
  Wallet, 
  CircleDollarSign,
  TrendingUp,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const BANK_COLOR_PALETTES = [
  { name: 'بلو بانک (سامان)', color: 'from-blue-600 to-indigo-800' },
  { name: 'بانک ملت', color: 'from-rose-600 to-red-950' },
  { name: 'بانک ملی ایران', color: 'from-amber-600 to-yellow-900' },
  { name: 'بانک پاسارگاد', color: 'from-amber-500 to-slate-900' },
  { name: 'بانک صادرات', color: 'from-blue-800 to-slate-900' },
  { name: 'بانک رسالت', color: 'from-teal-600 to-emerald-900' },
  { name: 'کیف نقدی سبز', color: 'from-emerald-600 to-teal-800' },
  { name: 'صندوق طلا', color: 'from-yellow-500 to-amber-700' },
  { name: 'کیف پول کریپتو', color: 'from-purple-600 to-indigo-950' },
];

export const AccountsManager: React.FC = () => {
  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    transferBetweenAccounts,
    currency,
    language,
    totalNetWorth,
  } = useFinance();

  const isFa = language === 'fa';

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Add/Edit form state
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [cardNumber, setCardNumber] = useState('');
  const [balanceStr, setBalanceStr] = useState('');
  const [colorGradient, setColorGradient] = useState(BANK_COLOR_PALETTES[0].color);

  // Transfer form state
  const [fromAccId, setFromAccId] = useState(accounts[0]?.id || '');
  const [toAccId, setToAccId] = useState(accounts[1]?.id || '');
  const [transferAmountStr, setTransferAmountStr] = useState('');
  const [transferNote, setTransferNote] = useState('');

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCard = (cardNo: string, id: string) => {
    navigator.clipboard.writeText(cardNo.replace(/\D/g, ''));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setName('');
    setBankName('');
    setType('bank');
    setCardNumber('');
    setBalanceStr('');
    setColorGradient(BANK_COLOR_PALETTES[0].color);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setBankName(acc.bankName || '');
    setType(acc.type);
    setCardNumber(acc.cardNumber || '');
    setBalanceStr(String(acc.balance));
    setColorGradient(acc.color || BANK_COLOR_PALETTES[0].color);
    setIsAddModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const rawBalance = Number(fromPersianDigits(balanceStr.replace(/,/g, ''))) || 0;
    if (!name.trim()) return;

    if (editingAccount) {
      updateAccount(editingAccount.id, {
        name,
        bankName,
        type,
        cardNumber,
        balance: rawBalance,
        color: colorGradient,
      });
    } else {
      addAccount({
        name,
        bankName,
        type,
        cardNumber,
        balance: rawBalance,
        color: colorGradient,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmt = Number(fromPersianDigits(transferAmountStr.replace(/,/g, ''))) || 0;
    if (rawAmt <= 0 || fromAccId === toAccId) return;

    transferBetweenAccounts(fromAccId, toAccId, rawAmt, transferNote);
    setIsTransferModalOpen(false);
    setTransferAmountStr('');
    setTransferNote('');
  };

  const handleDeleteAccount = (id: string) => {
    if (confirm(isFa ? 'آیا از حذف این حساب اطمینان دارید؟' : 'Delete this account?')) {
      deleteAccount(id);
    }
  };

  const sourceAccount = accounts.find(a => a.id === fromAccId);
  const rawTransferAmt = Number(fromPersianDigits(transferAmountStr.replace(/,/g, ''))) || 0;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {isFa ? 'کیف‌پول‌ها و کارت‌های بانکی' : 'Accounts & Wallets'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isFa ? 'مدیریت موجودی کارت‌های شتاب، حساب‌های ریالی، طلا و ارزهای دیجیتال' : 'Manage your debit cards, cash, gold and investments'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-blue-600" />
            <span>{isFa ? 'انتقال بین‌حسابی' : 'Transfer Funds'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isFa ? 'افزودن حساب جدید' : 'Add Account'}</span>
          </button>
        </div>
      </div>

      {/* Accounts Cards Grid */}
      {accounts.length === 0 ? (
        <div className="card-pro p-10 text-center flex flex-col items-center justify-center my-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
            {isFa ? 'هنوز هیچ حساب یا کارت بانکی تعریف نشده است' : 'No accounts defined yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
            {isFa 
              ? 'اطلاعات پیش‌فرض دمو پاک شده است. برای محاسبه دقیق موجودی کل و ثبت تراکنش‌ها، کارت‌های بانکی، حساب‌های جاری، پس‌انداز یا کیف پول نقدی خود را اضافه کنید.'
              : 'Add your bank cards, cash wallets, or savings accounts to start tracking your finances.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{isFa ? 'تعریف اولین حساب یا کارت بانکی' : 'Add First Account'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc, idx) => {
            const isCopied = copiedId === acc.id;

            return (
              <div
                key={`acc-card-${acc.id}-${idx}`}
                className={`bg-gradient-to-br ${acc.color || 'from-slate-800 to-slate-900'} rounded-3xl p-6 shadow-xl border border-white/20 relative overflow-hidden flex flex-col justify-between h-60 transition-transform hover:-translate-y-1`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-lg text-white tracking-wide">
                      {acc.name}
                    </h3>
                    <span className="text-xs text-white/80 font-medium">
                      {acc.bankName || (acc.type === 'bank' ? 'بانک' : 'کیف پول')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-black/25 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/15 text-[11px] text-white font-bold">
                    {acc.type === 'bank' && <CreditCard className="w-3.5 h-3.5" />}
                    {acc.type === 'cash' && <Wallet className="w-3.5 h-3.5" />}
                    {acc.type === 'gold' && <Coins className="w-3.5 h-3.5" />}
                    {acc.type === 'crypto' && <CircleDollarSign className="w-3.5 h-3.5" />}
                    <span>
                      {acc.type === 'bank' ? (isFa ? 'کارت بانکی' : 'Bank') :
                       acc.type === 'gold' ? (isFa ? 'طلا و سکه' : 'Gold') :
                       acc.type === 'crypto' ? (isFa ? 'ارز دیجیتال' : 'Crypto') : (isFa ? 'نقدی' : 'Cash')}
                    </span>
                  </div>
                </div>

                {/* Card Middle: Balance */}
                <div className="my-2">
                  <div className="text-xs text-white/80 font-medium mb-0.5">
                    {isFa ? 'موجودی حساب' : 'Current Balance'}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {formatCurrency(acc.balance, currency, isFa)}
                  </div>
                </div>

                {/* Card Footer: Number & Action Icons */}
                <div className="flex items-center justify-between pt-3 border-t border-white/15">
                  {acc.cardNumber ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-white font-bold tracking-widest" dir="ltr">
                        {formatCardNumber(acc.cardNumber)}
                      </span>
                      <button
                        onClick={() => handleCopyCard(acc.cardNumber!, acc.id)}
                        className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-white transition-colors cursor-pointer"
                        title={isFa ? 'کپی شماره کارت' : 'Copy Card Number'}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-white/90" />}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-white/70 font-medium">
                      {acc.type === 'cash' ? (isFa ? 'وجه نقد در دسترس' : 'Cash on Hand') : (isFa ? 'بدون شماره کارت' : 'No card number')}
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      className="p-2 rounded-xl bg-black/25 hover:bg-black/45 text-white transition-colors cursor-pointer"
                      title={isFa ? 'ویرایش' : 'Edit'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="p-2 rounded-xl bg-black/25 hover:bg-rose-600/80 text-white transition-colors cursor-pointer"
                      title={isFa ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Account Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div key="modal-add-account-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              key="add-account-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              key="add-account-modal-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg my-auto max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingAccount
                    ? (isFa ? 'ویرایش حساب / کارت' : 'Edit Account')
                    : (isFa ? 'افزودن حساب یا کارت جدید' : 'Add New Account')}
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAccount} className="p-6 overflow-y-auto space-y-4 text-xs">
                {/* Account Type */}
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'نوع حساب' : 'Account Type'}</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer font-medium"
                  >
                    <option value="bank">{isFa ? 'کارت / حساب بانکی' : 'Bank Card / Account'}</option>
                    <option value="cash">{isFa ? 'کیف پول نقدی' : 'Cash Wallet'}</option>
                    <option value="gold">{isFa ? 'صندوق طلا و سکه' : 'Gold & Coins'}</option>
                    <option value="crypto">{isFa ? 'ارز دیجیتال / تتر' : 'Crypto / Tether'}</option>
                    <option value="investment">{isFa ? 'بورس و سرمایه‌گذاری' : 'Investment'}</option>
                  </select>
                </div>

                {/* Account Name */}
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'عنوان حساب' : 'Account Title'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isFa ? 'مثلا: بلو بانک شخصی، حساب مسکن ملت' : 'e.g. Blu Bank, Cash'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'نام بانک / موسسه' : 'Bank Name'}</label>
                  <input
                    type="text"
                    placeholder={isFa ? 'مثلا: بانک ملت، سامان، رسالت' : 'e.g. Mellat Bank'}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Card Number */}
                {type === 'bank' && (
                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'شماره ۱۶ رقمی کارت' : '16-Digit Card Number'}</label>
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="6037-xxxx-xxxx-xxxx"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      dir="ltr"
                    />
                  </div>
                )}

                {/* Initial Balance */}
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'موجودی (تومان)' : 'Balance (Toman)'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isFa ? 'مثال: ۲۵,۰۰۰,۰۰۰' : 'e.g. 25,000,000'}
                    value={balanceStr ? toPersianDigits(Number(fromPersianDigits(balanceStr.replace(/,/g, ''))).toLocaleString('en-US')) : ''}
                    onChange={(e) => setBalanceStr(fromPersianDigits(e.target.value).replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Color Palette Choice */}
                <div>
                  <label className="block text-slate-700 mb-2 font-bold">{isFa ? 'تم رنگ کارت' : 'Card Color Theme'}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {BANK_COLOR_PALETTES.map((p, idx) => (
                      <button
                        key={`bank-palette-${p.name}-${idx}`}
                        type="button"
                        onClick={() => setColorGradient(p.color)}
                        className={`h-9 rounded-xl bg-gradient-to-r ${p.color} border transition-all flex items-center justify-center cursor-pointer ${
                          colorGradient === p.color ? 'border-white ring-2 ring-blue-500 shadow-md' : 'border-transparent opacity-85 hover:opacity-100'
                        }`}
                        title={p.name}
                      >
                        {colorGradient === p.color && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {isFa ? 'انصراف' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    {isFa ? 'ذخیره حساب' : 'Save Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer Funds Modal */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <div key="modal-transfer-funds-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              key="transfer-funds-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTransferModalOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              key="transfer-funds-modal-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg my-auto max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {isFa ? 'انتقال وجه بین حساب‌ها' : 'Transfer Between Accounts'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsTransferModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExecuteTransfer} className="p-6 overflow-y-auto space-y-4 text-xs">
                {/* From Account */}
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'حساب مبدأ (کسر موجودی)' : 'Source Account'}</label>
                  <select
                    value={fromAccId}
                    onChange={(e) => setFromAccId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer font-medium"
                  >
                    {accounts.map((acc, idx) => (
                      <option key={`transfer-from-acc-${acc.id}-${idx}`} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.balance, currency, isFa)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* To Account */}
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'حساب مقصد (افزایش موجودی)' : 'Destination Account'}</label>
                  <select
                    value={toAccId}
                    onChange={(e) => setToAccId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer font-medium"
                  >
                    {accounts.filter(a => a.id !== fromAccId).map((acc, idx) => (
                      <option key={`transfer-to-acc-${acc.id}-${idx}`} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.balance, currency, isFa)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'مبلغ انتقال (تومان)' : 'Amount (Toman)'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isFa ? 'مثال: ۲,۰۰۰,۰۰۰' : 'e.g. 2,000,000'}
                    value={transferAmountStr ? toPersianDigits(Number(fromPersianDigits(transferAmountStr.replace(/,/g, ''))).toLocaleString('en-US')) : ''}
                    onChange={(e) => setTransferAmountStr(fromPersianDigits(e.target.value).replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                  {sourceAccount && rawTransferAmt > sourceAccount.balance && (
                    <div className="text-[11px] text-rose-600 font-bold mt-1">
                      {isFa ? 'هشدار: مبلغ بیشتر از موجودی حساب مبدأ است!' : 'Warning: Exceeds source balance!'}
                    </div>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'توضیحات انتقال' : 'Note'}</label>
                  <input
                    type="text"
                    placeholder={isFa ? 'مثلا: انتقال جهت خرید، تسویه کارت' : 'e.g. Card balance refill'}
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {isFa ? 'انصراف' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={rawTransferAmt <= 0}
                    className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isFa ? 'تایید انتقال' : 'Transfer Now'}
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
