import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import { GraphicAvatar } from '../common/GraphicAvatar';
import { GraphicCharacterPicker } from '../common/GraphicCharacterPicker';
import { getGraphicCharacter } from '../../utils/graphicAvatars';
import { toPersianDigits } from '../../utils/formatters';
import { 
  X, 
  User, 
  Sparkles, 
  Crown, 
  ShieldCheck, 
  Check, 
  Save, 
  Users, 
  Lock, 
  ChevronLeft,
  LogOut,
  Fingerprint
} from 'lucide-react';

export const UserProfileModal: React.FC = () => {
  const { 
    currentUser, 
    activeMember, 
    activeMemberId,
    familyMembers,
    isHeadOfFamily,
    isUserProfileModalOpen, 
    setIsUserProfileModalOpen,
    updateUserProfile,
    switchMemberProfile,
    exitToHeadProfile,
    securityConfig,
    setIsSecuritySettingsOpen,
    accounts,
    transactions,
    language,
    logout,
    setActiveTab
  } = useFinance();

  const isFa = language === 'fa';
  const [mounted, setMounted] = useState(false);

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'switcher' | 'security'>('profile');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState('char_masoud');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Switcher PIN prompt
  const [selectedSwitchMember, setSelectedSwitchMember] = useState<any | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [switcherError, setSwitcherError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state when modal opens
  useEffect(() => {
    if (isUserProfileModalOpen) {
      setDisplayName(currentUser?.name || activeMember.name || '');
      setPhoneNumber(currentUser?.phone || activeMember.phone || '');
      setSelectedAvatarId(currentUser?.avatar || activeMember.avatar || 'char_masoud');
      setSaveSuccess(false);
      setSelectedSwitchMember(null);
      setSwitcherError(null);
      setEnteredPin('');
      setActiveSubTab('profile');
    }
  }, [isUserProfileModalOpen, currentUser, activeMember]);

  if (!mounted || !isUserProfileModalOpen) return null;

  const currentCharacter = getGraphicCharacter(selectedAvatarId);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSaving(true);
    try {
      await updateUserProfile({
        name: displayName.trim(),
        avatar: selectedAvatarId,
        phone: phoneNumber.trim() || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchMember = (member: any) => {
    setSwitcherError(null);
    if (member.id === activeMemberId) {
      setIsUserProfileModalOpen(false);
      return;
    }

    if (member.role === 'head') {
      if (securityConfig.isEnabled && securityConfig.pinHash) {
        setSelectedSwitchMember(member);
        setEnteredPin('');
        return;
      }
      exitToHeadProfile();
      setIsUserProfileModalOpen(false);
      return;
    }

    if (member.pin) {
      setSelectedSwitchMember(member);
      setEnteredPin('');
      return;
    }

    const res = switchMemberProfile(member.id);
    if (res.success) {
      setIsUserProfileModalOpen(false);
    } else {
      setSwitcherError(res.error || 'خطا در تغییر حساب');
    }
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSwitchMember) return;

    if (selectedSwitchMember.role === 'head') {
      const res = exitToHeadProfile(enteredPin);
      if (res.success) {
        setIsUserProfileModalOpen(false);
        setSelectedSwitchMember(null);
      } else {
        setSwitcherError(res.error || 'رمز اشتباه است');
      }
    } else {
      const res = switchMemberProfile(selectedSwitchMember.id, enteredPin);
      if (res.success) {
        setIsUserProfileModalOpen(false);
        setSelectedSwitchMember(null);
      } else {
        setSwitcherError(res.error || 'رمز اشتباه است');
      }
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 transition-opacity"
        onClick={() => setIsUserProfileModalOpen(false)}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Hero Banner */}
        <div className="relative px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shrink-0 overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-cyan-400/15 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              {/* Graphic Avatar with ring */}
              <div className="relative shrink-0">
                <GraphicAvatar
                  avatarId={selectedAvatarId}
                  size="xl"
                  ring={true}
                  ringColor="#ffffff"
                  showBadge={true}
                  className="shadow-xl"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                    {displayName || currentUser?.name || activeMember.name}
                  </h3>
                  {isHeadOfFamily ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400/25 text-amber-200 border border-amber-300/40">
                      <Crown className="w-3 h-3 text-amber-300" />
                      <span>{isFa ? 'سرپرست' : 'Head'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/20 text-white border border-white/30">
                      <span>{isFa ? 'عضو خانواده' : 'Member'}</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[11px] text-blue-100 font-medium">
                    {currentCharacter.nameFa} • {currentCharacter.titleFa}
                  </span>
                  <span className={`text-[9px] px-2 py-0.2 rounded-full font-bold ${
                    currentUser?.isDemo 
                      ? 'bg-amber-400/30 text-amber-100 border border-amber-300/40' 
                      : 'bg-emerald-400/30 text-emerald-100 border border-emerald-300/40'
                  }`}>
                    {currentUser?.isDemo 
                      ? (isFa ? 'کاربر دمو' : 'Demo')
                      : (isFa ? 'همگام با ابر' : 'Cloud')}
                  </span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsUserProfileModalOpen(false)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
              aria-label={isFa ? 'بستن' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1.5 mt-3.5 p-1 bg-black/20 backdrop-blur-md rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('profile');
                setSelectedSwitchMember(null);
              }}
              className={`flex-1 py-1.5 sm:py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === 'profile'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{isFa ? 'مشخصات و کاراکتر' : 'Profile & Avatar'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSubTab('switcher');
                setSelectedSwitchMember(null);
              }}
              className={`flex-1 py-1.5 sm:py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === 'switcher'
                  ? 'bg-white text-purple-600 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isFa ? 'تغییر کاربر' : 'Family Switch'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSubTab('security');
                setSelectedSwitchMember(null);
              }}
              className={`flex-1 py-1.5 sm:py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === 'security'
                  ? 'bg-white text-emerald-600 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isFa ? 'امنیت و آمار' : 'Security & Stats'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body with internal scrolling */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: Edit Profile & Graphic Character */}
          {activeSubTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Character Picker Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span>{isFa ? 'انتخاب کاراکتر اختصاصی' : 'Select Graphic Character'}</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {isFa ? '۱۲ کاراکتر گرافیکی' : '12 characters'}
                  </span>
                </div>

                <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl">
                  <GraphicCharacterPicker
                    selectedId={selectedAvatarId}
                    onSelect={(id) => setSelectedAvatarId(id)}
                    language={language}
                  />
                </div>
              </div>

              {/* Personal Info Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isFa ? 'نام و نام خانوادگی' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={isFa ? 'مثال: مسعود مزدآور' : 'e.g. Masoud'}
                    className="w-full text-xs font-bold py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isFa ? 'شماره تماس همراه' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={isFa ? '۰۹۱۲۳۴۵۶۷۸۹' : '0912...'}
                    className="w-full text-xs font-bold py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Success Notification */}
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{isFa ? 'مشخصات و کاراکتر با موفقیت ذخیره و به‌روزرسانی شد!' : 'Profile updated successfully!'}</span>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? (isFa ? 'در حال ذخیره‌سازی...' : 'Saving...') : (isFa ? 'ذخیره تغییرات پروفایل' : 'Save Changes')}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Family Profile Switcher */}
          {activeSubTab === 'switcher' && (
            <div className="space-y-4">
              {selectedSwitchMember ? (
                /* PIN Prompt */
                <form onSubmit={handleConfirmPin} className="space-y-4">
                  <div className="text-center py-2">
                    <div className="flex justify-center mb-3">
                      <GraphicAvatar
                        avatarId={selectedSwitchMember.avatar}
                        size="2xl"
                        ring={true}
                        ringColor={selectedSwitchMember.color || '#3b82f6'}
                      />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedSwitchMember.name}
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

                  {switcherError && (
                    <p className="text-xs text-rose-500 font-medium text-center bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40">
                      {switcherError}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSwitchMember(null);
                        setSwitcherError(null);
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
                /* Members List with Graphic Avatars */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isFa 
                        ? 'انتخاب کنید می‌خواهید با کدام پروفایل خانواده وارد برنامه شوید:' 
                        : 'Select which family profile you want to operate as:'}
                    </p>
                  </div>

                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {familyMembers.map((member) => {
                      const isActive = member.id === activeMemberId;
                      const isHead = member.role === 'head';

                      return (
                        <button
                          key={`user-prof-switch-${member.id}`}
                          type="button"
                          onClick={() => handleSwitchMember(member)}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer text-right rtl:text-right ltr:text-left ${
                            isActive
                              ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-xs'
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
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {member.name}
                                </span>
                                {isHead ? (
                                  <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                    <Crown className="w-2.5 h-2.5" />
                                    {isFa ? 'سرپرست' : 'Head'}
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                    {member.role === 'spouse' ? 'همسر' : member.role === 'child' ? 'فرزند' : 'عضو'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {isHead
                                  ? (isFa ? 'دسترسی کامل مدیریتی' : 'Full Admin & Control')
                                  : (isFa ? 'ثبت سریع تراکنش روتین' : 'Routine tasks only')}
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
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
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

                  {/* Manage Family shortcut */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserProfileModalOpen(false);
                        setActiveTab('family');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      <span>{isFa ? 'مدیریت کامل اعضای خانواده و پول‌توجیبی' : 'Manage Family Members & Allowances'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Security & Account Stats */}
          {activeSubTab === 'security' && (
            <div className="space-y-4">
              {/* Account Overview Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {isFa ? 'تعداد حساب‌ها و کارت‌ها' : 'Accounts & Cards'}
                  </div>
                  <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-1">
                    {isFa ? `${toPersianDigits(accounts.length)} حساب` : `${accounts.length} accounts`}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {isFa ? 'تراکنش‌های ثبت‌شده' : 'Transactions Logged'}
                  </div>
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {isFa ? `${toPersianDigits(transactions.length)} مورد` : `${transactions.length} items`}
                  </div>
                </div>
              </div>

              {/* Account Info Details */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">{isFa ? 'ایمیل یا شناسه کاربری' : 'Email / User ID'}</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">{currentUser?.email || 'user@jibino.app'}</span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">{isFa ? 'وضعیت پایگاه داده ابری' : 'Database Status'}</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{isFa ? 'همگام‌سازی ابری متصل' : 'Cloud Connected'}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{isFa ? 'قفل بیومتریک و پین' : 'Biometric & PIN Lock'}</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    securityConfig.isEnabled
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {securityConfig.isEnabled ? (isFa ? 'فعال' : 'Active') : (isFa ? 'غیرفعال' : 'Disabled')}
                  </span>
                </div>
              </div>

              {/* Action Shortcuts */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserProfileModalOpen(false);
                    setIsSecuritySettingsOpen(true);
                  }}
                  className="w-full py-2.5 px-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-purple-500" />
                    <span>{isFa ? 'تنظیمات قفل امنیتی، پین و بیومتریک' : 'Security, PIN & Biometric Settings'}</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(isFa ? 'آیا مایل به خروج از حساب کاربری هستید؟' : 'Log out of current account?')) {
                      setIsUserProfileModalOpen(false);
                      logout();
                    }
                  }}
                  className="w-full py-2.5 px-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>{isFa ? 'خروج از حساب کاربری فعلی' : 'Log Out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
