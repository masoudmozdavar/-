import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CheckItem, CheckStatus, CheckType, DebtItem, DebtType, LoanItem } from '../../types';
import { formatCurrency, fromPersianDigits, toPersianDigits } from '../../utils/formatters';
import { formatJalaliHuman, getDaysRemaining, getTodayISO, getTodayJalali } from '../../utils/jalali';
import { PersianDatePicker } from '../common/PersianDatePicker';
import { 
  FileCheck2, 
  CreditCard, 
  HandCoins, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  X,
  Phone,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChecksCalendarView } from './ChecksCalendarView';
import { AutoSaveIndicator } from '../common/AutoSaveIndicator';
import { useFormDraft } from '../../hooks/useAutoSave';

export const ChecksAndLoansManager: React.FC = () => {
  const {
    checks,
    addCheck,
    updateCheckStatus,
    deleteCheck,
    loans,
    addLoan,
    payLoanInstallment,
    deleteLoan,
    debts,
    addDebt,
    recordDebtPayment,
    deleteDebt,
    accounts,
    currency,
    language,
    pendingIssuedChecks,
    pendingReceivedChecks,
    totalDebtsOwed,
    totalReceivablesOwed,
  } = useFinance();

  const isFa = language === 'fa';

  const [subTab, setSubTab] = useState<'checks' | 'loans' | 'debts'>('checks');
  const [checksViewMode, setChecksViewMode] = useState<'calendar' | 'list'>('calendar');

  // Check Modals
  const [isAddCheckOpen, setIsAddCheckOpen] = useState(false);
  const [checkType, setCheckType] = useState<CheckType>('issued');
  const [checkNumber, setCheckNumber] = useState('');
  const [sayadId, setSayadId] = useState('');
  const [checkBank, setCheckBank] = useState('');
  const [checkAmountStr, setCheckAmountStr] = useState('');
  const [recipient, setRecipient] = useState('');
  const [checkJalaliDate, setCheckJalaliDate] = useState(getTodayJalali());
  const [checkIsoDate, setCheckIsoDate] = useState(getTodayISO());
  const [checkAccountId, setCheckAccountId] = useState(accounts[0]?.id || '');
  const [checkNotes, setCheckNotes] = useState('');

  // Check Form Auto-Save
  const checkDraftData = React.useMemo(() => ({
    checkType,
    checkNumber,
    sayadId,
    checkBank,
    checkAmountStr,
    recipient,
    checkJalaliDate,
    checkIsoDate,
    checkAccountId,
    checkNotes,
  }), [checkType, checkNumber, sayadId, checkBank, checkAmountStr, recipient, checkJalaliDate, checkIsoDate, checkAccountId, checkNotes]);

  const {
    hasDraft: hasCheckDraft,
    lastSavedAt: checkDraftSavedAt,
    clearDraft: clearCheckDraft
  } = useFormDraft('check_form_draft', checkDraftData, {
    enabled: isAddCheckOpen,
    isEmpty: (v) => !v.checkNumber && !v.checkAmountStr && !v.recipient,
    onRestore: (saved) => {
      if (saved.checkType) setCheckType(saved.checkType);
      if (saved.checkNumber) setCheckNumber(saved.checkNumber);
      if (saved.sayadId) setSayadId(saved.sayadId);
      if (saved.checkBank) setCheckBank(saved.checkBank);
      if (saved.checkAmountStr) setCheckAmountStr(saved.checkAmountStr);
      if (saved.recipient) setRecipient(saved.recipient);
      if (saved.checkJalaliDate) setCheckJalaliDate(saved.checkJalaliDate);
      if (saved.checkIsoDate) setCheckIsoDate(saved.checkIsoDate);
      if (saved.checkAccountId) setCheckAccountId(saved.checkAccountId);
      if (saved.checkNotes) setCheckNotes(saved.checkNotes);
    }
  });

  // Loan Modals
  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);
  const [loanTitle, setLoanTitle] = useState('');
  const [loanBank, setLoanBank] = useState('');
  const [principalStr, setPrincipalStr] = useState('');
  const [totalLoanStr, setTotalLoanStr] = useState('');
  const [interestRate, setInterestRate] = useState(23);
  const [totalInstallments, setTotalInstallments] = useState(24);
  const [paidInstallments, setPaidInstallments] = useState(0);
  const [monthlyPaymentStr, setMonthlyPaymentStr] = useState('');
  const [loanJalaliDate, setLoanJalaliDate] = useState(getTodayJalali());
  const [loanIsoDate, setLoanIsoDate] = useState(getTodayISO());
  const [loanAccountId, setLoanAccountId] = useState(accounts[0]?.id || '');

  // Loan Form Auto-Save
  const loanDraftData = React.useMemo(() => ({
    loanTitle,
    loanBank,
    principalStr,
    totalLoanStr,
    interestRate,
    totalInstallments,
    paidInstallments,
    monthlyPaymentStr,
    loanJalaliDate,
    loanIsoDate,
    loanAccountId,
  }), [loanTitle, loanBank, principalStr, totalLoanStr, interestRate, totalInstallments, paidInstallments, monthlyPaymentStr, loanJalaliDate, loanIsoDate, loanAccountId]);

  const {
    hasDraft: hasLoanDraft,
    lastSavedAt: loanDraftSavedAt,
    clearDraft: clearLoanDraft
  } = useFormDraft('loan_form_draft', loanDraftData, {
    enabled: isAddLoanOpen,
    isEmpty: (v) => !v.loanTitle && !v.principalStr,
    onRestore: (saved) => {
      if (saved.loanTitle) setLoanTitle(saved.loanTitle);
      if (saved.loanBank) setLoanBank(saved.loanBank);
      if (saved.principalStr) setPrincipalStr(saved.principalStr);
      if (saved.totalLoanStr) setTotalLoanStr(saved.totalLoanStr);
      if (saved.interestRate) setInterestRate(saved.interestRate);
      if (saved.totalInstallments) setTotalInstallments(saved.totalInstallments);
      if (saved.paidInstallments !== undefined) setPaidInstallments(saved.paidInstallments);
      if (saved.monthlyPaymentStr) setMonthlyPaymentStr(saved.monthlyPaymentStr);
      if (saved.loanJalaliDate) setLoanJalaliDate(saved.loanJalaliDate);
      if (saved.loanIsoDate) setLoanIsoDate(saved.loanIsoDate);
      if (saved.loanAccountId) setLoanAccountId(saved.loanAccountId);
    }
  });

  // Debt Modals
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [debtType, setDebtType] = useState<DebtType>('debt');
  const [debtPerson, setDebtPerson] = useState('');
  const [debtPhone, setDebtPhone] = useState('');
  const [debtAmountStr, setDebtAmountStr] = useState('');
  const [debtJalaliDate, setDebtJalaliDate] = useState(getTodayJalali());
  const [debtIsoDate, setDebtIsoDate] = useState(getTodayISO());
  const [debtNotes, setDebtNotes] = useState('');

  // Debt Form Auto-Save
  const debtDraftData = React.useMemo(() => ({
    debtType,
    debtPerson,
    debtPhone,
    debtAmountStr,
    debtJalaliDate,
    debtIsoDate,
    debtNotes,
  }), [debtType, debtPerson, debtPhone, debtAmountStr, debtJalaliDate, debtIsoDate, debtNotes]);

  const {
    hasDraft: hasDebtDraft,
    lastSavedAt: debtDraftSavedAt,
    clearDraft: clearDebtDraft
  } = useFormDraft('debt_form_draft', debtDraftData, {
    enabled: isAddDebtOpen,
    isEmpty: (v) => !v.debtPerson && !v.debtAmountStr,
    onRestore: (saved) => {
      if (saved.debtType) setDebtType(saved.debtType);
      if (saved.debtPerson) setDebtPerson(saved.debtPerson);
      if (saved.debtPhone) setDebtPhone(saved.debtPhone);
      if (saved.debtAmountStr) setDebtAmountStr(saved.debtAmountStr);
      if (saved.debtJalaliDate) setDebtJalaliDate(saved.debtJalaliDate);
      if (saved.debtIsoDate) setDebtIsoDate(saved.debtIsoDate);
      if (saved.debtNotes) setDebtNotes(saved.debtNotes);
    }
  });

  // Settle Debt Modal
  const [settlingDebt, setSettlingDebt] = useState<DebtItem | null>(null);
  const [settleAmountStr, setSettleAmountStr] = useState('');

  // Check form submit
  const handleSaveCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmt = Number(fromPersianDigits(checkAmountStr.replace(/,/g, ''))) || 0;
    if (rawAmt <= 0 || !checkNumber) return;

    addCheck({
      type: checkType,
      checkNumber,
      sayadId,
      bankName: checkBank || 'بانک',
      amount: rawAmt,
      recipientOrPayer: recipient || (checkType === 'issued' ? 'طرف حساب' : 'پرداخت کننده'),
      dueDate: checkIsoDate,
      dueJalaliDate: checkJalaliDate,
      status: 'pending',
      accountId: checkAccountId,
      notes: checkNotes,
    });

    setIsAddCheckOpen(false);
    clearCheckDraft();
    setCheckAmountStr('');
    setCheckNumber('');
    setSayadId('');
    setRecipient('');
    setCheckNotes('');
  };

  // Loan form submit
  const handleSaveLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const rawPrincipal = Number(fromPersianDigits(principalStr.replace(/,/g, ''))) || 0;
    const rawTotal = Number(fromPersianDigits(totalLoanStr.replace(/,/g, ''))) || rawPrincipal;
    const rawMonthly = Number(fromPersianDigits(monthlyPaymentStr.replace(/,/g, ''))) || Math.round(rawTotal / totalInstallments);

    if (rawPrincipal <= 0 || !loanTitle) return;

    addLoan({
      title: loanTitle,
      bankName: loanBank || 'بانک',
      principalAmount: rawPrincipal,
      totalAmount: rawTotal,
      interestRate,
      totalInstallments,
      paidInstallments,
      monthlyPayment: rawMonthly,
      startDate: loanIsoDate,
      startJalaliDate: loanJalaliDate,
      dueDayOfMonth: 15,
      accountId: loanAccountId,
    });

    setIsAddLoanOpen(false);
    clearLoanDraft();
    setLoanTitle('');
    setPrincipalStr('');
    setTotalLoanStr('');
    setMonthlyPaymentStr('');
  };

  // Debt form submit
  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmt = Number(fromPersianDigits(debtAmountStr.replace(/,/g, ''))) || 0;
    if (rawAmt <= 0 || !debtPerson) return;

    addDebt({
      type: debtType,
      personName: debtPerson,
      phone: debtPhone,
      totalAmount: rawAmt,
      paidAmount: 0,
      dueDate: debtIsoDate,
      dueJalaliDate: debtJalaliDate,
      isSettled: false,
      notes: debtNotes,
    });

    setIsAddDebtOpen(false);
    clearDebtDraft();
    setDebtPerson('');
    setDebtPhone('');
    setDebtAmountStr('');
    setDebtNotes('');
  };

  const handleSettlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingDebt) return;
    const rawAmt = Number(fromPersianDigits(settleAmountStr.replace(/,/g, ''))) || 0;
    if (rawAmt <= 0) return;

    recordDebtPayment(settlingDebt.id, rawAmt);
    setSettlingDebt(null);
    setSettleAmountStr('');
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
            {isFa ? 'دفتر چک، وام‌ها و تعهدات مالی' : 'Checks, Loans & Debts Hub'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isFa ? 'تقویم هوشمند سررسید، مدیریت چک‌های صیادی، اقساط وام‌های بانکی و مطالبات' : 'Track Sayad checks, bank loan installments and debts in a unified calendar'}
          </p>
        </div>

        {/* Sub-tab segment */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl backdrop-blur-md">
          <button
            onClick={() => setSubTab('checks')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'checks'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>{isFa ? 'دفتر چک' : 'Checks'}</span>
          </button>

          <button
            onClick={() => setSubTab('loans')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'loans'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{isFa ? 'وام و اقساط' : 'Loans'}</span>
          </button>

          <button
            onClick={() => setSubTab('debts')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'debts'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HandCoins className="w-4 h-4" />
            <span>{isFa ? 'بدهی و طلب' : 'Debts'}</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: CHECKS */}
      {subTab === 'checks' && (
        <div className="space-y-5">
          {/* Summary Badges with Frosted Glass Look */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card rounded-3xl p-5 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold shadow-xs">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isFa ? 'چک‌های صادره در انتظار پاس شدن' : 'Pending Issued Checks'}</div>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 font-mono-num">
                    {formatCurrency(pendingIssuedChecks, currency, isFa)}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-5 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold shadow-xs">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isFa ? 'چک‌های دریافتی در انتظار وصول' : 'Pending Received Checks'}</div>
                  <div className="text-xl font-black text-teal-600 dark:text-teal-400 mt-0.5 font-mono-num">
                    {formatCurrency(pendingReceivedChecks, currency, isFa)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">{isFa ? 'مدیریت و سررسید چک‌ها' : 'Checks Management'}</h3>
              
              {/* View Switcher: Calendar vs List */}
              <div className="flex items-center p-1 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setChecksViewMode('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    checksViewMode === 'calendar'
                      ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs border border-slate-200/60 dark:border-slate-800'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{isFa ? 'تقویم هوشمند مالی' : 'Smart Calendar'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChecksViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    checksViewMode === 'list'
                      ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs border border-slate-200/60 dark:border-slate-800'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isFa ? 'فهرست کارتی' : 'List View'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsAddCheckOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isFa ? 'ثبت چک جدید' : 'Add Check'}</span>
            </button>
          </div>

          {/* Interactive Calendar View or Card List */}
          {checksViewMode === 'calendar' ? (
            <ChecksCalendarView
              checks={checks}
              currency={currency}
              language={language}
              onUpdateStatus={updateCheckStatus}
              onAddNewCheckForDate={(jDate) => {
                setCheckJalaliDate(jDate);
                setIsAddCheckOpen(true);
              }}
            />
          ) : (
            /* Checks Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checks.map((chk, idx) => {
                const days = getDaysRemaining(chk.dueDate);
                const isPast = days < 0;
                const isToday = days === 0;
                const isCleared = chk.status === 'cleared';
                const isBounced = chk.status === 'bounced';

                return (
                  <div
                    key={`checks-mgr-card-${chk.id}-${idx}`}
                    className={`bg-white border rounded-3xl p-5 shadow-sm relative overflow-hidden transition-all ${
                      isCleared ? 'opacity-70 border-slate-200' : isBounced ? 'border-rose-300' : 'border-slate-200/90 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                          chk.type === 'issued' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-teal-50 text-teal-700 border border-teal-200'
                        }`}>
                          {chk.type === 'issued' ? (isFa ? 'چک صادره' : 'Issued') : (isFa ? 'چک دریافتی' : 'Received')}
                        </span>
                        <span className="font-mono text-xs text-slate-500 font-bold">
                          #{chk.checkNumber}
                        </span>
                      </div>

                      <select
                        value={chk.status}
                        onChange={(e) => updateCheckStatus(chk.id, e.target.value as CheckStatus)}
                        aria-label="وضعیت چک"
                        className={`text-[11px] font-bold rounded-xl px-2.5 py-1 border focus:outline-none cursor-pointer ${
                          isCleared ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          isBounced ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          chk.status === 'cancelled' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="pending">{isFa ? 'در انتظار وصول' : 'Pending'}</option>
                        <option value="cleared">{isFa ? 'وصول شد (پاس شده)' : 'Cleared'}</option>
                        <option value="bounced">{isFa ? 'برگشت خورده' : 'Bounced'}</option>
                        <option value="cancelled">{isFa ? 'باطل شده' : 'Cancelled'}</option>
                      </select>
                    </div>

                    {/* Amount & Recipient */}
                    <div className="my-2">
                      <div className="text-xl font-black text-slate-900">
                        {formatCurrency(chk.amount, currency, isFa)}
                      </div>
                      <div className="text-xs text-slate-600 font-medium mt-1">
                        <span className="text-slate-400">{chk.type === 'issued' ? (isFa ? 'در وجه: ' : 'To: ') : (isFa ? 'از طرف: ' : 'From: ')}</span>
                        <span className="font-bold text-slate-800">{chk.recipientOrPayer}</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="text-[11px] text-slate-500 space-y-1.5 my-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex justify-between">
                        <span>{isFa ? 'بانک صادرکننده:' : 'Bank:'}</span>
                        <span className="text-slate-800 font-bold">{chk.bankName}</span>
                      </div>
                      {chk.sayadId && (
                        <div className="flex justify-between font-mono">
                          <span>{isFa ? 'شناسه صیادی:' : 'Sayad ID:'}</span>
                          <span className="text-slate-700 font-bold">{chk.sayadId}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>{isFa ? 'تاریخ سررسید:' : 'Due Date:'}</span>
                        <span className="text-slate-800 font-bold">{formatJalaliHuman(chk.dueJalaliDate, !isFa)}</span>
                      </div>
                    </div>

                    {/* Footer & Countdown */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      {!isCleared && chk.status === 'pending' ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPast ? 'bg-rose-50 text-rose-700 border border-rose-200' : isToday ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isPast ? (isFa ? `${toPersianDigits(Math.abs(days))} روز گذشته` : `${Math.abs(days)}d overdue`)
                           : isToday ? (isFa ? 'سررسید امروز!' : 'Due today')
                           : (isFa ? `${toPersianDigits(days)} روز تا سررسید` : `${days}d left`)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold text-[11px]">
                          {isFa ? 'تکمیل و ثبت شده' : 'Processed'}
                        </span>
                      )}

                      <button
                        onClick={() => deleteCheck(chk.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={isFa ? 'حذف چک' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: LOANS */}
      {subTab === 'loans' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">{isFa ? 'وام‌های بانکی و جدول اقساط' : 'Bank Loans & Installments'}</h3>
            <button
              onClick={() => setIsAddLoanOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isFa ? 'ثبت وام جدید' : 'Add Loan'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loans.map((loan, idx) => {
              const progressPct = Math.round((loan.paidInstallments / loan.totalInstallments) * 100);
              const remainingInstallments = loan.totalInstallments - loan.paidInstallments;
              const isCompleted = remainingInstallments === 0;

              return (
                <div key={`loan-mgr-card-${loan.id}-${idx}`} className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-base text-slate-900">{loan.title}</h4>
                      <span className="text-xs text-slate-500">{loan.bankName} • {isFa ? `${toPersianDigits(loan.interestRate)}% سود` : `${loan.interestRate}% interest`}</span>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                      {isFa ? `قسط: ${formatCurrency(loan.monthlyPayment, currency, isFa)}` : `${formatCurrency(loan.monthlyPayment, currency, isFa)}/mo`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-bold">
                      <span className="text-slate-500">
                        {isFa ? `پرداخت شده: ${toPersianDigits(loan.paidInstallments)} از ${toPersianDigits(loan.totalInstallments)} قسط` : `Paid ${loan.paidInstallments} of ${loan.totalInstallments} installments`}
                      </span>
                      <span className="text-blue-600">{isFa ? toPersianDigits(progressPct) : progressPct}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Amounts Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">{isFa ? 'کل بازپرداخت' : 'Total Repayment'}</div>
                      <div className="font-black text-slate-900 text-sm mt-0.5">{formatCurrency(loan.totalAmount, currency, isFa)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">{isFa ? 'اقساط باقیمانده' : 'Remaining'}</div>
                      <div className="font-black text-amber-600 text-sm mt-0.5">
                        {isFa ? `${toPersianDigits(remainingInstallments)} قسط` : `${remainingInstallments} installments`}
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      onClick={() => payLoanInstallment(loan.id)}
                      disabled={isCompleted}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isCompleted ? (isFa ? 'تسویه کامل شد' : 'Fully Paid') : (isFa ? 'ثبت پرداخت قسط جاری' : 'Pay Next Installment')}</span>
                    </button>

                    <button
                      onClick={() => deleteLoan(loan.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title={isFa ? 'حذف وام' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: DEBTS & RECEIVABLES */}
      {subTab === 'debts' && (
        <div className="space-y-5">
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-bold">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isFa ? 'مجموع بدهی‌های من به دیگران' : 'Total Debts I Owe'}</div>
                  <div className="text-lg font-black text-rose-600 mt-0.5">
                    {formatCurrency(totalDebtsOwed, currency, isFa)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isFa ? 'مجموع مطالبات من از دیگران' : 'Total Receivables (Owed to Me)'}</div>
                  <div className="text-lg font-black text-emerald-600 mt-0.5">
                    {formatCurrency(totalReceivablesOwed, currency, isFa)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">{isFa ? 'فهرست بدهی‌ها و مطالبات اشخاص' : 'Debts & Receivables'}</h3>
            <button
              onClick={() => setIsAddDebtOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isFa ? 'ثبت بدهی / طلب جدید' : 'Add Debt / Receivable'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.map((d, idx) => {
              const remaining = Math.max(0, d.totalAmount - d.paidAmount);
              const progress = Math.round((d.paidAmount / d.totalAmount) * 100);

              return (
                <div key={`debt-mgr-card-${d.id}-${idx}`} className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-bold mb-1.5 ${
                        d.type === 'debt' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {d.type === 'debt' ? (isFa ? 'بدهی من' : 'My Debt') : (isFa ? 'طلب من' : 'My Receivable')}
                      </span>
                      <h4 className="font-bold text-base text-slate-900">{d.personName}</h4>
                      {d.phone && <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium"><Phone className="w-3.5 h-3.5" />{d.phone}</div>}
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-slate-900">{formatCurrency(d.totalAmount, currency, isFa)}</div>
                      <div className="text-xs text-slate-500 font-medium">
                        {isFa ? `باقیمانده: ${formatCurrency(remaining, currency, isFa)}` : `Remaining: ${formatCurrency(remaining, currency, isFa)}`}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {d.notes && <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">{d.notes}</p>}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSettlingDebt(d);
                        setSettleAmountStr(String(remaining));
                      }}
                      disabled={d.isSettled}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {d.isSettled ? (isFa ? 'تسویه کامل شده' : 'Settled') : (isFa ? 'ثبت پرداخت / تسویه' : 'Record Payment')}
                    </button>

                    <button
                      onClick={() => deleteDebt(d.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title={isFa ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Check Modal */}
      <AnimatePresence>
        {isAddCheckOpen && (
          <div key="modal-add-check-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              key="add-check-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddCheckOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              key="add-check-modal-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg my-auto max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{isFa ? 'ثبت برگه چک جدید' : 'Add New Check'}</h3>
                  <AutoSaveIndicator hasDraft={hasCheckDraft} lastSavedAt={checkDraftSavedAt} onClearDraft={clearCheckDraft} isFa={isFa} />
                </div>
                <button onClick={() => setIsAddCheckOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCheck} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckType('issued')}
                    className={`py-2.5 rounded-2xl font-bold border transition-all cursor-pointer ${
                      checkType === 'issued' ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {isFa ? 'چک صادره من' : 'Issued Check'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckType('received')}
                    className={`py-2.5 rounded-2xl font-bold border transition-all cursor-pointer ${
                      checkType === 'received' ? 'bg-teal-50 text-teal-700 border-teal-300 shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {isFa ? 'چک دریافتی' : 'Received Check'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'شماره چک' : 'Check #'}</label>
                    <input
                      type="text"
                      required
                      placeholder="12345678"
                      value={checkNumber}
                      onChange={(e) => setCheckNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'بانک' : 'Bank'}</label>
                    <input
                      type="text"
                      placeholder={isFa ? 'ملت، صادرات و...' : 'Bank'}
                      value={checkBank}
                      onChange={(e) => setCheckBank(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'شناسه ۱۶ رقمی صیاد' : '16-Digit Sayad ID'}</label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="14039827361928"
                    value={sayadId}
                    onChange={(e) => setSayadId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'مبلغ چک (تومان)' : 'Amount (Toman)'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isFa ? 'مثال: ۵۰,۰۰۰,۰۰۰' : '50,000,000'}
                    value={checkAmountStr ? toPersianDigits(Number(fromPersianDigits(checkAmountStr.replace(/,/g, ''))).toLocaleString('en-US')) : ''}
                    onChange={(e) => setCheckAmountStr(fromPersianDigits(e.target.value).replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'در وجه / دریافت از' : 'Recipient / Payer'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isFa ? 'نام شخص یا شرکت' : 'Person or Company Name'}
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <PersianDatePicker
                    label={isFa ? 'تاریخ سررسید چک' : 'Due Date'}
                    valueJalali={checkJalaliDate}
                    onChange={(j, i) => {
                      setCheckJalaliDate(j);
                      setCheckIsoDate(i);
                    }}
                    isPersianLang={isFa}
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddCheckOpen(false)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {isFa ? 'انصراف' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    {isFa ? 'ثبت چک' : 'Save Check'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Loan Modal */}
      <AnimatePresence>
        {isAddLoanOpen && (
          <div key="modal-add-loan-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              key="add-loan-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddLoanOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              key="add-loan-modal-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg my-auto max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{isFa ? 'ثبت وام و تسهیلات بانکی' : 'Add Bank Loan'}</h3>
                  <AutoSaveIndicator hasDraft={hasLoanDraft} lastSavedAt={loanDraftSavedAt} onClearDraft={clearLoanDraft} isFa={isFa} />
                </div>
                <button onClick={() => setIsAddLoanOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveLoan} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'عنوان وام' : 'Loan Title'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isFa ? 'مثلا: وام مسکن، خرید خودرو' : 'e.g. Home Loan'}
                    value={loanTitle}
                    onChange={(e) => setLoanTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'بانک وام دهنده' : 'Bank Name'}</label>
                    <input
                      type="text"
                      placeholder={isFa ? 'بانک ملی، ملت...' : 'Bank'}
                      value={loanBank}
                      onChange={(e) => setLoanBank(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'درصد سود سالانه (%)' : 'Interest Rate (%)'}</label>
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'مبلغ کل بازپرداخت' : 'Total Repayment'}</label>
                    <input
                      type="text"
                      required
                      placeholder="120,000,000"
                      value={totalLoanStr ? toPersianDigits(Number(fromPersianDigits(totalLoanStr.replace(/,/g, ''))).toLocaleString('en-US')) : ''}
                      onChange={(e) => setTotalLoanStr(fromPersianDigits(e.target.value).replace(/\D/g, ''))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'مبلغ هر قسط' : 'Monthly Payment'}</label>
                    <input
                      type="text"
                      placeholder="5,000,000"
                      value={monthlyPaymentStr ? toPersianDigits(Number(fromPersianDigits(monthlyPaymentStr.replace(/,/g, ''))).toLocaleString('en-US')) : ''}
                      onChange={(e) => setMonthlyPaymentStr(fromPersianDigits(e.target.value).replace(/\D/g, ''))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'تعداد کل اقساط' : 'Total Months'}</label>
                    <input
                      type="number"
                      value={totalInstallments}
                      onChange={(e) => setTotalInstallments(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'اقساط پرداخت شده' : 'Paid Installments'}</label>
                    <input
                      type="number"
                      value={paidInstallments}
                      onChange={(e) => setPaidInstallments(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddLoanOpen(false)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {isFa ? 'انصراف' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    {isFa ? 'ذخیره وام' : 'Save Loan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Debt Modal */}
      <AnimatePresence>
        {isAddDebtOpen && (
          <div key="modal-add-debt-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              key="add-debt-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddDebtOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              key="add-debt-modal-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg my-auto max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{isFa ? 'ثبت بدهی یا طلب شخص' : 'Add Debt / Receivable'}</h3>
                  <AutoSaveIndicator hasDraft={hasDebtDraft} lastSavedAt={debtDraftSavedAt} onClearDraft={clearDebtDraft} isFa={isFa} />
                </div>
                <button onClick={() => setIsAddDebtOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDebt} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDebtType('debt')}
                    className={`py-2.5 rounded-2xl font-bold border transition-all cursor-pointer ${
                      debtType === 'debt' ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {isFa ? 'بدهی من (باید بپردازم)' : 'I Owe (Debt)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebtType('receivable')}
                    className={`py-2.5 rounded-2xl font-bold border transition-all cursor-pointer ${
                      debtType === 'receivable' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {isFa ? 'طلب من (باید بگیرم)' : 'Owed to Me'}
                  </button>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'نام طرف حساب' : 'Person Name'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isFa ? 'نام و نام خانوادگی' : 'Name'}
                    value={debtPerson}
                    onChange={(e) => setDebtPerson(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'مبلغ کل (تومان)' : 'Amount (Toman)'}</label>
                    <input
                      type="text"
                      required
                      placeholder="10,000,000"
                      value={debtAmountStr ? toPersianDigits(Number(fromPersianDigits(debtAmountStr.replace(/,/g, ''))).toLocaleString('en-US')) : ''}
                      onChange={(e) => setDebtAmountStr(fromPersianDigits(e.target.value).replace(/\D/g, ''))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'شماره تماس' : 'Phone Number'}</label>
                    <input
                      type="text"
                      placeholder="0912..."
                      value={debtPhone}
                      onChange={(e) => setDebtPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'توضیحات و بابت' : 'Notes'}</label>
                  <input
                    type="text"
                    placeholder={isFa ? 'مثلا: قرض بابت خرید لوازم' : 'Notes'}
                    value={debtNotes}
                    onChange={(e) => setDebtNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddDebtOpen(false)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {isFa ? 'انصراف' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    {isFa ? 'ذخیره' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settle Debt Modal */}
      <AnimatePresence>
        {settlingDebt && (
          <div key="modal-settle-debt-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              key="settle-debt-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettlingDebt(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              key="settle-debt-modal-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md my-auto max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{isFa ? 'ثبت پرداخت یا تسویه حساب' : 'Record Payment'}</h3>
                <button onClick={() => setSettlingDebt(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSettlePayment} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-slate-500 font-medium">{isFa ? 'طرف حساب:' : 'Person:'} <strong className="text-slate-900">{settlingDebt.personName}</strong></div>
                  <div className="text-slate-500 font-medium mt-1">
                    {isFa ? 'مبلغ باقیمانده:' : 'Remaining:'} <strong className="text-emerald-600 font-black">{formatCurrency(Math.max(0, settlingDebt.totalAmount - settlingDebt.paidAmount), currency, isFa)}</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-bold">{isFa ? 'مبلغ پرداختی این مرحله (تومان)' : 'Payment Amount'}</label>
                  <input
                    type="text"
                    required
                    value={settleAmountStr ? toPersianDigits(Number(fromPersianDigits(settleAmountStr.replace(/,/g, ''))).toLocaleString('en-US')) : ''}
                    onChange={(e) => setSettleAmountStr(fromPersianDigits(e.target.value).replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-black text-base focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSettlingDebt(null)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {isFa ? 'انصراف' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    {isFa ? 'ثبت پرداخت' : 'Confirm Payment'}
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
