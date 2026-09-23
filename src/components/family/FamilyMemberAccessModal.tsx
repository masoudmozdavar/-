import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { FamilyMember } from '../../types';
import { formatCurrency, toPersianDigits } from '../../utils/formatters';
import { getMemberDirectURL } from '../../utils/familySync';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  ShieldCheck, 
  KeyRound, 
  Wallet,
  Users
} from 'lucide-react';

interface Props {
  member: FamilyMember | null;
  onClose: () => void;
}

export const FamilyMemberAccessModal: React.FC<Props> = ({ member, onClose }) => {
  const { currency, language, switchMemberProfile } = useFinance();
  const [copied, setCopied] = useState(false);
  const isFa = language === 'fa';

  if (!member) return null;

  const directUrl = getMemberDirectURL(member.id);

  const handleCopy = () => {
    navigator.clipboard.writeText(directUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSwitchNow = () => {
    switchMemberProfile(member.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-md my-auto max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-xs" style={{ backgroundColor: `${member.color}20` }}>
              {member.avatar}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{member.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {member.role === 'head' ? 'سرپرست' : member.role === 'spouse' ? 'همسر' : member.role === 'child' ? 'فرزند' : 'عضو'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFa ? 'اطلاعات اتصال و لینک اختصاصی حساب' : 'Member access details & link'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Explanation banner */}
          <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              {isFa
                ? `این لینک را برای ${member.name} ارسال کنید تا در گوشی یا مرورگر خود باز کند. او فقط دسترسی روتین (ثبت سریع تراکنش و مشاهده سهمیه) خواهد داشت و تمام مخارج او مستقیماً در حساب شما تجمیع می‌شود.`
                : `Send this link to ${member.name} to open on their device. They will only have routine permissions (record expenses & pocket money).`}
            </div>
          </div>

          {/* Direct URL Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isFa ? 'لینک ورود اختصاصی عضو' : 'Direct Access Link'}
            </label>
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <input 
                type="text" 
                readOnly 
                value={directUrl} 
                className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 px-2 font-mono outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 shadow-xs transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isFa ? 'کپی شد' : 'Copied') : (isFa ? 'کپی لینک' : 'Copy')}</span>
              </button>
            </div>
          </div>

          {/* Member Settings Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isFa ? 'سقف هزینه ماهانه' : 'Monthly Allowance'}</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {member.monthlyAllowance && member.monthlyAllowance > 0
                  ? formatCurrency(member.monthlyAllowance, currency, isFa)
                  : (isFa ? 'نامحدود' : 'Unlimited')}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>{isFa ? 'رمز عبور اختصاصی' : 'PIN Protection'}</span>
              </div>
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                {member.pin ? (isFa ? toPersianDigits(member.pin) : member.pin) : (isFa ? 'بدون رمز' : 'No PIN')}
              </div>
            </div>
          </div>

          {/* Simulated Quick Action buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleSwitchNow}
              className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{isFa ? `ورود فوری و تست محیط کاربری ${member.name}` : `Switch to ${member.name}'s view`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
