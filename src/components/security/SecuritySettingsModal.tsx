import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import { toPersianDigits } from '../../utils/formatters';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Fingerprint, 
  KeyRound, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { registerBiometric } from '../../utils/security';

export const SecuritySettingsModal: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const {
    isSecuritySettingsOpen,
    setIsSecuritySettingsOpen,
    securityConfig,
    updateSecurityConfig,
    setNewPin,
    unlockAppWithPin,
    lockApp,
    isBiometricHardwareAvailable,
    language
  } = useFinance();

  const isFa = language === 'fa';

  // Form states
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPinState] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRegisteringBiometric, setIsRegisteringBiometric] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isSecuritySettingsOpen) return null;

  const handleToggleLockEnabled = async () => {
    setStatusMsg(null);
    if (securityConfig.isEnabled) {
      // If disabling, confirm
      updateSecurityConfig({ isEnabled: false });
      setStatusMsg({
        type: 'success',
        text: isFa ? 'قفل برنامه غیرفعال شد.' : 'App lock disabled.'
      });
    } else {
      updateSecurityConfig({ isEnabled: true });
      setStatusMsg({
        type: 'success',
        text: isFa ? 'قفل برنامه با موفقیت فعال شد.' : 'App lock activated.'
      });
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    // Verify current PIN if PIN is already set
    if (securityConfig.pinHash) {
      const isOldValid = await unlockAppWithPin(currentPin);
      if (!isOldValid) {
        setStatusMsg({
          type: 'error',
          text: isFa ? 'رمز عبور فعلی نادرست است.' : 'Current PIN is incorrect.'
        });
        return;
      }
    }

    if (newPin.length < 4) {
      setStatusMsg({
        type: 'error',
        text: isFa ? 'رمز عبور جدید باید حداقل ۴ رقم باشد.' : 'New PIN must be at least 4 digits.'
      });
      return;
    }

    if (newPin !== confirmPin) {
      setStatusMsg({
        type: 'error',
        text: isFa ? 'تکرار رمز عبور جدید مطابقت ندارد.' : 'PIN confirmation does not match.'
      });
      return;
    }

    await setNewPin(newPin);
    setStatusMsg({
      type: 'success',
      text: isFa ? 'رمز عبور جدید با موفقیت ذخیره شد.' : 'New PIN saved successfully.'
    });
    setIsChangingPin(false);
    setCurrentPin('');
    setNewPinState('');
    setConfirmPin('');
  };

  const handleEnrollBiometric = async () => {
    setIsRegisteringBiometric(true);
    setStatusMsg(null);
    try {
      const credId = await registerBiometric('کاربر مالی');
      if (credId) {
        updateSecurityConfig({
          hasBiometric: true,
          biometricCredentialId: credId,
        });
        setStatusMsg({
          type: 'success',
          text: isFa ? 'احراز هویت بیومتریک و اثر انگشت با موفقیت ثبت شد.' : 'Biometric fingerprint successfully enrolled.'
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: isFa ? 'ثبت بیومتریک لغو شد یا در این مرورگر پشتیبانی نمی‌شود.' : 'Biometric setup cancelled or not supported.'
        });
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: isFa ? 'خطا در برقراری ارتباط با حسگر بیومتریک.' : 'Error communicating with biometric sensor.'
      });
    } finally {
      setIsRegisteringBiometric(false);
    }
  };

  const content = (
    <div className="fixed inset-0 z-[99999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {isFa ? 'تنظیمات امنیت و قفل برنامه' : 'Security & App Lock'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFa ? 'محافظت از حریم خصوصی دارایی‌ها و اطلاعات بانکی' : 'Protect your financial portfolio and bank data'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSecuritySettingsOpen(false)}
            className="w-8 h-8 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Status Message */}
          {statusMsg && (
            <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2 font-bold ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}>
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Setting 1: App Lock Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mt-0.5 ${
                securityConfig.isEnabled
                  ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>
                {securityConfig.isEnabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isFa ? 'قفل ورود به برنامه (App Lock)' : 'Enable App Lock'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isFa
                    ? 'هنگام باز شدن برنامه، برای نمایش حساب‌ها احراز هویت درخواست شود'
                    : 'Prompt for authentication before unlocking financial views'}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securityConfig.isEnabled}
                onChange={handleToggleLockEnabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Setting 2: Biometrics / Fingerprint (WebAuthn) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {isFa ? 'احراز هویت با اثر انگشت یا چهره' : 'Biometric / Touch ID'}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isBiometricHardwareAvailable
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {isBiometricHardwareAvailable
                        ? (isFa ? 'حسگر آماده' : 'Sensor Ready')
                        : (isFa ? 'عدم شناسایی حسگر' : 'Unavailable')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isFa
                      ? 'استفاده از سنسور اثر انگشت یا قفل بیومتریک دستگاه (Touch ID / Windows Hello / Android)'
                      : 'Use device platform biometrics for fast and secure unlocking'}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isBiometricHardwareAvailable}
                  checked={securityConfig.hasBiometric && isBiometricHardwareAvailable}
                  onChange={(e) => {
                    updateSecurityConfig({ hasBiometric: e.target.checked });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {isBiometricHardwareAvailable && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex justify-end">
                <button
                  type="button"
                  onClick={handleEnrollBiometric}
                  disabled={isRegisteringBiometric}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>{isRegisteringBiometric ? (isFa ? 'در حال ارتباط با حسگر...' : 'Connecting...') : (isFa ? 'آزمایش و ثبت اثر انگشت' : 'Test / Enroll Biometrics')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Setting 3: Change PIN */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isFa ? 'رمز عبور (PIN Code)' : 'Passcode / PIN'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isFa ? 'رمز پیش‌فرض فعلی: ۱۲۳۴' : 'Current default PIN: 1234'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsChangingPin(!isChangingPin)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
              >
                {isChangingPin ? (isFa ? 'انصراف' : 'Cancel') : (isFa ? 'تغییر رمز' : 'Change PIN')}
              </button>
            </div>

            {isChangingPin && (
              <form onSubmit={handleChangePinSubmit} className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isFa ? 'رمز عبور فعلی:' : 'Current PIN:'}
                  </label>
                  <input
                    type="password"
                    maxLength={8}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="۱۲۳۴"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono tracking-widest focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isFa ? 'رمز جدید (حداقل ۴ رقم):' : 'New PIN (4+ digits):'}
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      value={newPin}
                      onChange={(e) => setNewPinState(e.target.value)}
                      placeholder="****"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono tracking-widest focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isFa ? 'تکرار رمز جدید:' : 'Confirm New PIN:'}
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="****"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono tracking-widest focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {isFa ? 'ثبت و ذخیره رمز جدید' : 'Save New PIN'}
                </button>
              </form>
            )}
          </div>

          {/* Setting 4: Auto-Lock Policy */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isFa ? 'زمان قفل خودکار (Auto-Lock)' : 'Auto-Lock Timeout'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isFa ? 'تعیین زمان قفل شدن برنامه پس از عدم فعالیت' : 'Lock interval when idle'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {[
                { val: 0, label: isFa ? 'بلافاصله' : 'Immediately' },
                { val: 2, label: isFa ? '۲ دقیقه' : '2 min' },
                { val: 5, label: isFa ? '۵ دقیقه' : '5 min' },
                { val: 15, label: isFa ? '۱۵ دقیقه' : '15 min' },
              ].map((opt) => (
                <button
                  key={`auto-lock-opt-${opt.val}`}
                  type="button"
                  onClick={() => updateSecurityConfig({ autoLockMinutes: opt.val })}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    securityConfig.autoLockMinutes === opt.val
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setIsSecuritySettingsOpen(false);
              lockApp();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isFa ? 'قفل فوری برنامه' : 'Lock App Now'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSecuritySettingsOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
          >
            {isFa ? 'بستن' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
