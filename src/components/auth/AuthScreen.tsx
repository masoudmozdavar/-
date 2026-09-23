import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  Lock, 
  User, 
  Mail,
  ArrowLeft, 
  Sparkles, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  PlayCircle,
  ShieldCheck,
  Zap,
  KeyRound,
  Database,
  Send,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { 
  registerUser, 
  loginUser, 
  loginAsDemo, 
  requestPasswordRecovery, 
  confirmPasswordRecovery 
} from '../../utils/auth';
import { UserAccount } from '../../types';

interface AuthScreenProps {
  onAuthSuccess: (user: UserAccount) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'recovery'>('login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Password Recovery State
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify'>('request');
  const [simulatedEmailSentCode, setSimulatedEmailSentCode] = useState<string | null>(null);

  // Status & Errors
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!loginEmail.trim()) {
      setErrorMsg('لطفاً آدرس ایمیل خود را وارد کنید.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('لطفاً رمز عبور را وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginUser(loginEmail.trim(), loginPassword);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
      } else {
        setErrorMsg(res.error || 'ورود ناموفق بود.');
      }
    } catch {
      setErrorMsg('خطایی رخ داد، لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!regName.trim()) {
      setErrorMsg('لطفاً نام و نام خانوادگی خود را وارد کنید.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regEmail.trim() || !emailRegex.test(regEmail.trim())) {
      setErrorMsg('لطفاً یک آدرس ایمیل معتبر وارد کنید (مثال: name@example.com).');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setErrorMsg('رمز عبور باید حداقل ۴ رقم یا کاراکتر باشد.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('تکرار رمز عبور با رمز عبور مطابقت ندارد.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerUser({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: 'head'
      });

      if (res.success && res.user) {
        onAuthSuccess(res.user);
      } else {
        setErrorMsg(res.error || 'ثبت‌نام انجام نشد.');
      }
    } catch {
      setErrorMsg('خطا در فرآیند ثبت‌نام رخ داد.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setSimulatedEmailSentCode(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recoveryEmail.trim() || !emailRegex.test(recoveryEmail.trim())) {
      setErrorMsg('لطفاً یک آدرس ایمیل معتبر وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestPasswordRecovery(recoveryEmail.trim());
      if (res.success) {
        setSuccessMsg(res.message || 'کد تایید بازیابی صادر شد.');
        setSimulatedEmailSentCode(res.simulatedOtp || null);
        setRecoveryStep('verify');
      } else {
        setErrorMsg(res.message || 'کاربری با این ایمیل یافت نشد.');
      }
    } catch {
      setErrorMsg('خطا در ارسال کد بازیابی.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!recoveryCode.trim() || recoveryCode.trim().length !== 6) {
      setErrorMsg('لطفاً کد تایید ۶ رقمی را به درستی وارد کنید.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('رمز عبور جدید باید حداقل ۴ رقم یا کاراکتر باشد.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('تکرار رمز عبور جدید یکسان نیست.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await confirmPasswordRecovery(recoveryEmail.trim(), recoveryCode.trim(), newPassword);
      if (res.success) {
        setSuccessMsg('رمز عبور شما با موفقیت تغییر کرد! اکنون با رمز جدید وارد شوید.');
        setLoginEmail(recoveryEmail.trim());
        setLoginPassword(newPassword);
        setActiveTab('login');
        setRecoveryStep('request');
        setRecoveryCode('');
        setNewPassword('');
        setConfirmNewPassword('');
        setSimulatedEmailSentCode(null);
      } else {
        setErrorMsg(res.message || 'کد تایید اشتباه یا منقضی شده است.');
      }
    } catch {
      setErrorMsg('خطا در فرآیند تغییر رمز عبور.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    clearMessages();
    const demoUser = loginAsDemo();
    onAuthSuccess(demoUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden select-none">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md my-auto z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-1 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 shadow-xl shadow-cyan-500/20 mb-3">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white drop-shadow-md" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              جیبینو
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              JIBINO
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            سامانه جامع مدیریت هوشمند دارایی، دخل‌وخرج و تراز مالی خانواده
          </p>

          {/* Cloud Database Badge */}
          <div className="mt-2.5 flex items-center justify-center gap-2 flex-wrap text-[10px]">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>پایگاه داده ابری Firebase Firestore</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300">
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              <span>رمزنگاری PBKDF2</span>
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
          {/* Tab Selector: Login vs Register vs Recovery */}
          <div className="flex rounded-2xl bg-slate-950/70 p-1 border border-slate-800/60 mb-5">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); clearMessages(); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ورود
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); clearMessages(); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ثبت‌نام جدید
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('recovery'); clearMessages(); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'recovery'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              بازیابی رمز
            </button>
          </div>

          {/* Error Message Notice */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message Notice */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Simulated Email Dispatch Code Notification (For Fast Testing) */}
          <AnimatePresence>
            {simulatedEmailSentCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-4 p-3.5 rounded-2xl bg-amber-950/50 border border-amber-600/60 text-amber-200 text-xs space-y-1.5"
              >
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>پیام شبیه‌ساز ایمیل (کد بازیابی صادر شد):</span>
                </div>
                <div className="flex items-center justify-between bg-slate-950/60 px-3 py-2 rounded-xl border border-amber-600/30">
                  <span className="text-slate-300 text-[11px]">کد تایید ۶ رقمی:</span>
                  <span className="font-mono text-base font-black tracking-widest text-amber-300">
                    {simulatedEmailSentCode}
                  </span>
                </div>
                <p className="text-[10px] text-amber-400/80">
                  کد بالا به ایمیل ارسال شده و به مدت ۱۵ دقیقه اعتبار دارد.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forms */}
          {activeTab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>آدرس ایمیل:</span>
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-left"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>رمز عبور:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryEmail(loginEmail);
                      setActiveTab('recovery');
                      clearMessages();
                    }}
                    className="text-[10px] text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    فراموشی رمز عبور؟
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="رمز عبور خود را وارد کنید"
                    dir="ltr"
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-left pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-blue-600/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'در حال بررسی...' : 'ورود به حساب کاربری'}
              </button>
            </form>
          ) : activeTab === 'register' ? (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>نام و نام خانوادگی (سرپرست):</span>
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="مثال: مسعود مزدآور"
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-right"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>آدرس ایمیل (شناسه ورود اختصاصی):</span>
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="مثال: mozdavar.seyedmasoud@gmail.com"
                  dir="ltr"
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-left"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>رمز عبور:</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="حداقل ۴ کاراکتر"
                      dir="ltr"
                      className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-left pl-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تکرار رمز عبور:</span>
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="تکرار رمز"
                    dir="ltr"
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-left"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-200/90 leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>با ثبت‌نام، حساب اختصاصی شما در پایگاه داده امن ایجاد شده و تمام داده‌ها در <strong>Firebase Firestore</strong> به طور دائمی ذخیره و همگام می‌شوند.</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-cyan-600/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'در حال ثبت‌نام و ساخت پایگاه...' : 'ایجاد حساب کاربری و ذخیره در Firestore'}
              </button>
            </form>
          ) : (
            /* Password Recovery Form */
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 text-[11px] text-indigo-200 flex items-start gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>برای بازیابی رمز عبور، آدرس ایمیل ثبت‌نامی خود را وارد کنید تا کد تایید ۶ رقمی صادر شود.</span>
              </div>

              {recoveryStep === 'request' ? (
                <form onSubmit={handleRequestRecovery} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      <span>آدرس ایمیل حساب کاربری:</span>
                    </label>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="name@example.com"
                      dir="ltr"
                      className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-left"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isLoading ? 'در حال صدور کد...' : 'دریافت کد تایید بازیابی'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>کد تایید ۶ رقمی دریافتی:</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => { setRecoveryStep('request'); clearMessages(); }}
                        className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                      >
                        تغییر ایمیل
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="123456"
                      dir="ltr"
                      className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-3.5 py-2 text-center font-mono font-black text-lg tracking-widest text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>رمز عبور جدید:</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="حداقل ۴ رقم"
                          dir="ltr"
                          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-left pl-8"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>تکرار رمز جدید:</span>
                      </label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="تکرار رمز جدید"
                        dir="ltr"
                        className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-left"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'در حال ثبت رمز جدید...' : 'تغییر و ذخیره رمز عبور در پایگاه داده'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-slate-900 px-3 text-slate-500 font-bold">
                یا برای مشاهده و تست فوری
              </span>
            </div>
          </div>

          {/* Quick Demo Access Button */}
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent hover:from-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-200 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span>ورود سریع با داده‌های نمونه (حالت دمو)</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  مشاهده نمودارهای مالی، پیامک‌های بانکی و امکانات بدون نیاز به ثبت‌نام
                </div>
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-4 text-[11px] text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>پایگاه داده ابری امن Firestore + رمزنگاری PBKDF2 و سالت اختصاصی</span>
        </div>
      </motion.div>
    </div>
  );
};
