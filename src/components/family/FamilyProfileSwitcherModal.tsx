import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import { FamilyMember } from '../../types';
import { GraphicAvatar } from '../common/GraphicAvatar';
import { 
  X, 
  UserCheck, 
  Crown, 
  Lock, 
  Users, 
  ChevronLeft
} from 'lucide-react';

export const FamilyProfileSwitcherModal: React.FC = () => {
  const { 
    familyMembers, 
    activeMemberId, 
    switchMemberProfile, 
    exitToHeadProfile, 
    isProfileSwitcherOpen, 
    setIsProfileSwitcherOpen, 
    setActiveTab, 
    language,
    securityConfig 
  } = useFinance();

  const [mounted, setMounted] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isFa = language === 'fa';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isProfileSwitcherOpen) return null;

  const handleSelect = (member: FamilyMember) => {
    setErrorMessage(null);
    if (member.id === activeMemberId) {
      setIsProfileSwitcherOpen(false);
      return;
    }

    if (member.role === 'head') {
      if (securityConfig.isEnabled && securityConfig.pinHash) {
        setSelectedMember(member);
        setEnteredPin('');
        return;
      }
      exitToHeadProfile();
      setIsProfileSwitcherOpen(false);
      return;
    }

    if (member.pin) {
      setSelectedMember(member);
      setEnteredPin('');
      return;
    }

    const res = switchMemberProfile(member.id);
    if (res.success) {
      setIsProfileSwitcherOpen(false);
    } else {
      setErrorMessage(res.error || 'خطا در تغییر حساب');
    }
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    if (selectedMember.role === 'head') {
      const res = exitToHeadProfile(enteredPin);
      if (res.success) {
        setIsProfileSwitcherOpen(false);
        setSelectedMember(null);
        setEnteredPin('');
      } else {
        setErrorMessage(res.error || 'رمز اشتباه است');
      }
    } else {
      const res = switchMemberProfile(selectedMember.id, enteredPin);
      if (res.success) {
        setIsProfileSwitcherOpen(false);
        setSelectedMember(null);
        setEnteredPin('');
      } else {
        setErrorMessage(res.error || 'رمز اشتباه است');
      }
    }
  };

  const content = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="fixed inset-0 transition-opacity" 
        onClick={() => {
          setIsProfileSwitcherOpen(false);
          setSelectedMember(null);
          setErrorMessage(null);
        }} 
      />
      <div className="relative w-full max-w-md my-auto max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isFa ? 'تغییر پروفایل خانواده' : 'Switch Family Profile'}
            </h3>
          </div>
          <button 
            type="button"
            onClick={() => {
              setIsProfileSwitcherOpen(false);
              setSelectedMember(null);
              setErrorMessage(null);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {selectedMember ? (
            /* PIN Prompt Screen */
            <form onSubmit={handleConfirmPin} className="space-y-4">
              <div className="text-center py-2">
                <div className="flex justify-center mb-3">
                  <GraphicAvatar
                    avatarId={selectedMember.avatar}
                    size="2xl"
                    ring={true}
                    ringColor={selectedMember.color || '#3b82f6'}
                    showBadge={true}
                  />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedMember.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isFa ? 'لطفاً رمز عبور اختصاصی را وارد نمایید:' : 'Please enter security PIN:'}
                </p>
              </div>

              <div>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="• • • •"
                  className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-rose-500 font-medium text-center bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40">
                  {errorMessage}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMember(null);
                    setErrorMessage(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  {isFa ? 'بازگشت' : 'Back'}
                </button>
                <button
                  type="submit"
                  disabled={!enteredPin}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  {isFa ? 'تأیید و ورود' : 'Confirm'}
                </button>
              </div>
            </form>
          ) : (
            /* Members List */
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {isFa 
                  ? 'انتخاب کنید می‌خواهید با حساب سرپرست یا کدام عضو خانواده وارد برنامه شوید:' 
                  : 'Select which family member account you want to use:'}
              </p>

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {familyMembers.map((member, idx) => {
                  const isActive = member.id === activeMemberId;
                  const isHead = member.role === 'head';

                  return (
                    <button
                      key={`switcher-mem-${member.id}-${idx}`}
                      onClick={() => handleSelect(member)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-right rtl:text-right ltr:text-left ${
                        isActive
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/80 shadow-xs'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <GraphicAvatar
                          avatarId={member.avatar}
                          size="md"
                          ring={isActive}
                          ringColor={member.color || '#3b82f6'}
                          showBadge={true}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {member.name}
                            </span>
                            {isHead ? (
                              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                <Crown className="w-2.5 h-2.5" />
                                {isFa ? 'سرپرست اصلی' : 'Head of Family'}
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {member.role === 'spouse' ? 'همسر' : member.role === 'child' ? 'فرزند' : 'عضو خانواده'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {isHead
                              ? (isFa ? 'دسترسی کامل مدیریتی و نظارتی' : 'Full Admin & Control')
                              : (isFa ? 'دسترسی روتین (ثبت سریع تراکنش)' : 'Routine tasks only')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {member.pin && (
                          <span title="دارای رمز اختصاصی" className="p-1 text-slate-400">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {isActive ? (
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <UserCheck className="w-4 h-4" />
                            {isFa ? 'فعال' : 'Active'}
                          </span>
                        ) : (
                          <ChevronLeft className="w-4 h-4 text-slate-400 rtl:rotate-0 ltr:rotate-180" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Manage Members Link (Available for Head) */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileSwitcherOpen(false);
                    setActiveTab('family');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>{isFa ? 'مدیریت و افزودن اعضای جدید خانواده' : 'Manage Family Members'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
