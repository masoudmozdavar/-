import React, { useState } from 'react';
import { Delete, Check, RotateCcw, Sparkles, Percent, Divide, X as MultiplyIcon, Plus, Minus, Equal } from 'lucide-react';
import { formatCurrency, formatNumber, toPersianDigits, fromPersianDigits } from '../../utils/formatters';
import { CurrencyType, LanguageType } from '../../types';

interface TransactionCalculatorProps {
  initialValue?: number;
  currency: CurrencyType;
  language: LanguageType;
  onApply: (amount: number) => void;
  onClose?: () => void;
}

export const TransactionCalculator: React.FC<TransactionCalculatorProps> = ({
  initialValue = 0,
  currency,
  language,
  onApply,
  onClose,
}) => {
  const isFa = language === 'fa';
  const [expression, setExpression] = useState<string>(initialValue > 0 ? String(initialValue) : '');
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);

  // Safe arithmetic evaluator without using eval()
  const evaluateExpression = (expr: string): number => {
    if (!expr) return 0;
    try {
      // Normalize Persian numbers and operators
      let clean = fromPersianDigits(expr)
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/,/g, '')
        .replace(/\s+/g, '');

      // Replace percentage (e.g. 500000 * 10% -> 500000 * 0.1)
      clean = clean.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

      // If trailing operator, strip it for evaluation
      clean = clean.replace(/[\+\-\*\/]$/, '');

      // Tokenize and evaluate safely with standard operator precedence
      // Only allow digits, parentheses, and arithmetic operators
      if (!/^[0-9+\-*/(). ]+$/.test(clean)) return 0;

      // Safe Function evaluation of pure mathematical numbers
      const result = new Function(`"use strict"; return (${clean});`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Math.round(result);
      }
      return 0;
    } catch {
      return 0;
    }
  };

  const currentResult = evaluateExpression(expression);

  const handleAppend = (val: string) => {
    const isOperator = ['+', '-', '×', '÷'].includes(val);
    if (hasCalculated && !isOperator) {
      // Start fresh if user taps number after equals
      setExpression(val);
      setHasCalculated(false);
      return;
    }
    setHasCalculated(false);

    // Prevent duplicate adjacent operators
    if (isOperator) {
      if (!expression) {
        if (val === '-') setExpression('-');
        return;
      }
      const lastChar = expression.trim().slice(-1);
      if (['+', '-', '×', '÷'].includes(lastChar)) {
        setExpression(prev => prev.slice(0, -1) + val);
        return;
      }
    }

    setExpression(prev => prev + val);
  };

  const handleClear = () => {
    setExpression('');
    setHasCalculated(false);
  };

  const handleBackspace = () => {
    setExpression(prev => prev.slice(0, -1));
    setHasCalculated(false);
  };

  const handleEquals = () => {
    const res = evaluateExpression(expression);
    if (res >= 0) {
      setExpression(String(res));
      setHasCalculated(true);
    }
  };

  // Quick accounting modifiers
  const handleQuickAddPercent = (pct: number) => {
    const current = currentResult > 0 ? currentResult : (Number(expression) || 0);
    if (current <= 0) return;
    const modified = Math.round(current * (1 + pct / 100));
    setExpression(String(modified));
    setHasCalculated(true);
  };

  const handleQuickMultiply = (factor: number) => {
    const current = currentResult > 0 ? currentResult : (Number(expression) || 0);
    if (current <= 0) return;
    setExpression(String(current * factor));
    setHasCalculated(true);
  };

  const handleQuickDivide = (divisor: number) => {
    const current = currentResult > 0 ? currentResult : (Number(expression) || 0);
    if (current <= 0) return;
    setExpression(String(Math.round(current / divisor)));
    setHasCalculated(true);
  };

  const handleConfirm = () => {
    const finalVal = currentResult > 0 ? currentResult : (Number(expression) || 0);
    onApply(finalVal);
    if (onClose) onClose();
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-4 text-white shadow-xl space-y-3 select-none">
      {/* Calculator Header & Display */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 font-bold">
            <Sparkles className="w-3 h-3 text-amber-400" />
            {isFa ? 'ماشین‌حساب سریع مخارج' : 'Quick Calculator'}
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            {isFa ? 'واحد: تومان' : 'Currency: Toman'}
          </span>
        </div>

        {/* Expression string */}
        <div className="text-right text-xs text-slate-400 font-mono min-h-[1.25rem] truncate dir-ltr">
          {expression ? (isFa ? toPersianDigits(expression) : expression) : '0'}
        </div>

        {/* Evaluated Live Result */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-bold">{isFa ? 'حاصل:' : 'Result:'}</span>
          <span className="text-lg font-black text-emerald-400 font-mono tracking-wide">
            {formatCurrency(currentResult, currency, isFa)}
          </span>
        </div>
      </div>

      {/* Quick Financial Shortcuts Bar */}
      <div className="grid grid-cols-5 gap-1 text-[10px] font-bold">
        <button
          type="button"
          onClick={() => handleQuickAddPercent(10)}
          className="py-1 px-0.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700/50 transition-colors text-center cursor-pointer"
          title={isFa ? 'افزودن ۱۰٪ مالیات بر ارزش افزوده یا انعام' : 'Add 10% VAT / Tip'}
        >
          {isFa ? '+۱۰٪ مالیات' : '+10% VAT'}
        </button>

        <button
          type="button"
          onClick={() => handleQuickAddPercent(-10)}
          className="py-1 px-0.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700/50 transition-colors text-center cursor-pointer"
          title={isFa ? 'کسر ۱۰٪ تخفیف' : 'Apply 10% discount'}
        >
          {isFa ? '-۱۰٪ تخفیف' : '-10% Off'}
        </button>

        <button
          type="button"
          onClick={() => handleQuickDivide(2)}
          className="py-1 px-0.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700/50 transition-colors text-center cursor-pointer"
          title={isFa ? 'محاسبه دُنگ (تقسیم بر ۲)' : 'Split in half (/2)'}
        >
          {isFa ? '÷۲ دُنگ' : '/2 Split'}
        </button>

        <button
          type="button"
          onClick={() => handleQuickMultiply(1000)}
          className="py-1 px-0.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700/50 transition-colors text-center cursor-pointer"
          title={isFa ? 'ضرب در هزار (افزودن سه صفر)' : 'Multiply by 1,000'}
        >
          {isFa ? '×۱,۰۰۰' : 'x1K'}
        </button>

        <button
          type="button"
          onClick={() => handleQuickMultiply(1000000)}
          className="py-1 px-0.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700/50 transition-colors text-center cursor-pointer"
          title={isFa ? 'ضرب در میلیون (افزودن شش صفر)' : 'Multiply by 1,000,000'}
        >
          {isFa ? '×۱ میلیون' : 'x1M'}
        </button>
      </div>

      {/* Calculator Buttons Grid */}
      <div className="grid grid-cols-4 gap-1.5 text-xs font-bold font-mono">
        {/* Row 1 */}
        <button
          type="button"
          onClick={handleClear}
          className="py-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/50 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          <span>C</span>
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
        >
          <Delete className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleAppend('%')}
          className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700/50 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
        >
          <Percent className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleAppend('÷')}
          className="py-2.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/50 transition-all active:scale-95 flex items-center justify-center text-sm cursor-pointer"
        >
          ÷
        </button>

        {/* Row 2 */}
        <button
          type="button"
          onClick={() => handleAppend('7')}
          className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/40 transition-all active:scale-95 cursor-pointer text-sm"
        >
          {isFa ? toPersianDigits('7') : '7'}
        </button>
        <button
          type="button"
          onClick={() => handleAppend('8')}
          className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/40 transition-all active:scale-95 cursor-pointer text-sm"
        >
          {isFa ? toPersianDigits('8') : '8'}
        </button>
        <button
          type="button"
          onClick={() => handleAppend('9')}
          className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/40 transition-all active:scale-95 cursor-pointer text-sm"
        >
          {isFa ? toPersianDigits('9') : '9'}
        </button>
        <button
          type="button"
          onClick={() => handleAppend('×')}
          className="py-2.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/50 transition-all active:scale-95 flex items-center justify-center text-sm cursor-pointer"
        >
          ×
        </button>

        {/* Row 3 */}
        <button
          type="button"
          onClick={() => handleAppend('4')}
          className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/40 transition-all active:scale-95 cursor-pointer text-sm"
        >
          {isFa ? toPersianDigits('4') : '4'}
        </button>
        <button
          type="button"
          onClick={() => handleAppend('5')}
          className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/40 transition-all active:scale-95 cursor-pointer text-sm"
        >
          {isFa ? toPersianDigits('5') : '5'}
        </button>
        <button
          type="button"
          onClick={() => handleAppend('6')}
          className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/40 transition-all active:scale-95 cursor-pointer text-sm"
        >
          {isFa ? toPersianDigits('6') : '6'}
        </button>
        <button
          type="button"
          onClick={() => handleAppend('-')}
          className="py-2.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/50 transition-all active:scale-95 flex items-center justify-center text-sm cursor-pointer"
        >
          -
        </button>

        {/* Row 4 */}
        <button
          type="button"
          onClick={() => handleAppend('1')}
          className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/40 transition-all active:scale-95 cursor-pointer text-sm"
        >
          {isFa ? toPersianDigits('1') : '1'}
        </button>
        <button
          type="button"
          onClick={() => handleAppend('2')}
          className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/40 transition-all active:scale-95 cursor-pointer text-sm"
        >
          {isFa ? toPersianDigits('2') : '2'}
        </button>
        <button
          type="button"
          onClick={() => handleAppend('3')}
          className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/40 transition-all active:scale-95 cursor-pointer text-sm"
        >
          {isFa ? toPersianDigits('3') : '3'}
        </button>
        <button
          type="button"
          onClick={() => handleAppend('+')}
          className="py-2.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/50 transition-all active:scale-95 flex items-center justify-center text-sm cursor-pointer"
        >
          +
        </button>

        {/* Row 5 */}
        <button
          type="button"
          onClick={() => handleAppend('0')}
          className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/40 transition-all active:scale-95 cursor-pointer text-sm"
        >
          {isFa ? toPersianDigits('0') : '0'}
        </button>
        <button
          type="button"
          onClick={() => handleAppend('00')}
          className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/40 transition-all active:scale-95 cursor-pointer text-xs"
        >
          {isFa ? toPersianDigits('00') : '00'}
        </button>
        <button
          type="button"
          onClick={() => handleAppend('000')}
          className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700/40 transition-all active:scale-95 cursor-pointer text-xs font-bold"
        >
          {isFa ? toPersianDigits('000') : '000'}
        </button>
        <button
          type="button"
          onClick={handleEquals}
          className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md transition-all active:scale-95 flex items-center justify-center text-base cursor-pointer"
        >
          =
        </button>
      </div>

      {/* Confirmation & Apply Action */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            {isFa ? 'بستن' : 'Close'}
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={currentResult <= 0 && (!expression || expression === '0')}
          className="flex-[2] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-emerald-900/40 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>{isFa ? 'اعمال در مبلغ تراکنش' : 'Apply to Amount'}</span>
        </button>
      </div>
    </div>
  );
};
