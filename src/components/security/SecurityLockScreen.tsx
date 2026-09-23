import React, { useState, useEffect, useCallback } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { toPersianDigits } from '../../utils/formatters';
import { 
  Lock, 
  Unlock, 
  Fingerprint, 
  ShieldCheck, 
  Delete, 
  AlertCircle, 
  CheckCircle2, 
  LogOut,
  ArrowRight,
  Eye,
  EyeOff,
  Keyboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SecurityLockScreen: React.FC = () => {
  const {
    isLocked,
    unlockAppWithPin,
    unlockAppWithBiometric,
    securityConfig,
    isBiometricHardwareAvailable,
    language,
    currentUser,
    logout
  } = useFinance();

  const isFa = language === 'fa';
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerifyingBiometric, setIsVerifyingBiometric] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Clear error after timeout
  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(null), 3500);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  // Attempt biometric authentication
  const handleBiometricAuth = useCallback(async () => {
    if (!securityConfig.hasBiometric || !isBiometricHardwareAvailable) {
      setErrorMsg(isFa ? 'حسگر بیومتریک در دسترس نیست. لطفاً رمز عبور را وارد کنید.' : 'Biometrics not available. Please enter PIN.');
      return;
    }

    setIsVerifyingBiometric(true);
    setErrorMsg(null);
    try {
      const success = await unlockAppWithBiometric();
      if (success) {
        setIsSuccess(true);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }
      } else {
        setErrorMsg(isFa ? 'احراز هویت بیومتریک ناموفق بود یا لغو شد.' : 'Biometric verification failed or was cancelled.');
      }
    } catch {
      setErrorMsg(isFa ? 'خطا در احراز هویت اثر انگشت.' : 'Biometric error occurred.');
    } finally {
      setIsVerifyingBiometric(false);
    }
  }, [securityConfig.hasBiometric, isBiometricHardwareAvailable, unlockAppWithBiometric, isFa]);

  // Submit PIN verification
  const submitPin = useCallback(async (pinToVerify: string) => {
    if (!pinToVerify || pinToVerify.length < 4) {
      setErrorMsg(isFa ? 'لطفاً رمز عبور خود (حداقل ۴ کاراکتر) را وارد کنید.' : 'Please enter at least 4 characters.');
      return;
    }
    setErrorMsg(null);

    const ok = await unlockAppWithPin(pinToVerify);
    if (ok) {
      setIsSuccess(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    } else {
      setIsShaking(true);
      setErrorMsg(isFa ? 'رمز عبور یا پین وارد شده نادرست است.' : 'Incorrect password/PIN. Please try again.');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 50, 80]);
      }
      setTimeout(() => {
        setIsShaking(false);
      }, 500);
    }
  }, [unlockAppWithPin, isFa]);

  // Handle key input
  const handleKeyClick = (digit: string) => {
    if (isSuccess) return;
    if (enteredPin.length < 16) {
      setEnteredPin(prev => prev + digit);
      setErrorMsg(null);
    }
  };

  const handleBackspace = () => {
    if (isSuccess) return;
    setEnteredPin(prev => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    if (isSuccess) return;
    setEnteredPin('');
    setErrorMsg(null);
  };

  // Physical keyboard listener
  useEffect(() => {
    if (!isLocked || isSuccess || isTextMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyClick(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        if (enteredPin.length >= 4) {
          submitPin(enteredPin);
        }
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, isSuccess, enteredPin, submitPin, isTextMode]);

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 text-slate-100 select-none animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center py-6">
        {/* App Logo & Vault Branding */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center text-center mb-5"
        >
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 border border-blue-400/30">
              {isSuccess ? (
                <Unlock className="w-8 h-8 text-emerald-300 animate-bounce" />
              ) : (
                <Lock className="w-8 h-8" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
            <span>{isFa ? 'قفل امنیتی جیبینو' : 'Jibino Security Vault'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-[280px] leading-relaxed">
            {isFa
              ? `سلام ${currentUser?.name || ''}، لطفاً رمز عبور یا پین اختصاصی خود را وارد نمایید.`
              : `Welcome ${currentUser?.name || ''}, please enter your account password or PIN.`}
          </p>
        </motion.div>

        {/* Input & Display Box */}
        <div className="w-full max-w-[280px] mb-3">
          {isTextMode ? (
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitPin(enteredPin);
                }}
                autoFocus
                placeholder={isFa ? 'رمز عبور را بنویسید...' : 'Type password...'}
                dir="ltr"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-center text-white text-sm focus:outline-none focus:border-blue-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <motion.div 
              className={`flex items-center justify-center gap-2 min-h-[50px] py-2 px-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner ${
                isShaking ? 'animate-shake border-rose-500/80 bg-rose-950/30' : ''
              }`}
              animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              {enteredPin.length === 0 ? (
                <span className="text-xs text-slate-500 font-medium">
                  {isFa ? 'رمز خود را شماره‌گیری کنید' : 'Enter your password/PIN'}
                </span>
              ) : (
                Array.from({ length: enteredPin.length }).map((_, idx) => (
                  <div
                    key={`pin-dot-${idx}`}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                      isSuccess
                        ? 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-500/50'
                        : 'bg-blue-500 scale-110 shadow-lg shadow-blue-500/50'
                    }`}
                  />
                ))
              )}
            </motion.div>
          )}
        </div>

        {/* Error or Success feedback */}
        <div className="h-6 flex items-center justify-center mb-3">
          <AnimatePresence mode="wait">
            {errorMsg ? (
              <motion.div
                key="security-lock-feedback-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="flex items-center gap-1.5 text-xs text-rose-400 font-bold bg-rose-950/60 px-3 py-1 rounded-full border border-rose-800/60"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            ) : isSuccess ? (
              <motion.div
                key="security-lock-feedback-success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{isFa ? 'احراز هویت موفق! خوش آمدید...' : 'Unlocked successfully!'}</span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Virtual Numeric Keypad (If not text mode) */}
        {!isTextMode && (
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={`keypad-digit-${digit}`}
                type="button"
                onClick={() => handleKeyClick(digit)}
                className="h-13 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-blue-600 border border-slate-800 hover:border-slate-700 text-white font-black text-xl flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 select-none"
              >
                {isFa ? toPersianDigits(digit) : digit}
              </button>
            ))}

            {/* Backspace */}
            <button
              type="button"
              onClick={handleBackspace}
              className="h-13 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-rose-950 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
              title={isFa ? 'پاک کردن' : 'Backspace'}
            >
              <Delete className="w-5 h-5 rtl:rotate-180" />
            </button>

            {/* Zero */}
            <button
              type="button"
              onClick={() => handleKeyClick('0')}
              className="h-13 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-blue-600 border border-slate-800 hover:border-slate-700 text-white font-black text-xl flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 select-none"
            >
              {isFa ? toPersianDigits('0') : '0'}
            </button>

            {/* Clear All */}
            <button
              type="button"
              onClick={handleClear}
              className="h-13 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs font-bold flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {isFa ? 'پاک' : 'C'}
            </button>
          </div>
        )}

        {/* Primary Submit Button */}
        <button
          type="button"
          onClick={() => submitPin(enteredPin)}
          disabled={enteredPin.length < 4}
          className="w-full max-w-[280px] mt-3.5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-98"
        >
          <Unlock className="w-4 h-4" />
          <span>{isFa ? 'تایید و باز کردن برنامه' : 'Unlock App'}</span>
        </button>

        {/* Secondary Options */}
        <div className="flex items-center justify-between w-full max-w-[280px] mt-4 pt-3 border-t border-slate-800/80 text-[11px]">
          {/* Toggle typing mode */}
          <button
            type="button"
            onClick={() => setIsTextMode(!isTextMode)}
            className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5 text-blue-400" />
            <span>{isTextMode ? (isFa ? 'کیپد عددی' : 'Keypad') : (isFa ? 'تایپ با کیبورد' : 'Type password')}</span>
          </button>

          {/* Biometric Trigger if supported */}
          {securityConfig.hasBiometric && isBiometricHardwareAvailable && (
            <button
              type="button"
              onClick={handleBiometricAuth}
              disabled={isVerifyingBiometric}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold cursor-pointer"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>{isFa ? 'اثر انگشت' : 'Fingerprint'}</span>
            </button>
          )}

          {/* Logout / Switch User */}
          <button
            type="button"
            onClick={() => {
              logout();
            }}
            className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isFa ? 'خروج از حساب' : 'Logout'}</span>
          </button>
        </div>

        {/* Helper Note for Demo mode only */}
        {currentUser?.isDemo && (
          <div className="mt-3 text-center">
            <span className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-full">
              {isFa ? 'در حالت دمو رمز عبور پیش‌فرض: ۱۲۳۴' : 'Demo Mode PIN: 1234'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
