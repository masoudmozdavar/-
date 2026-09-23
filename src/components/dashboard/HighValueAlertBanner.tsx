import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { 
  AlertTriangle, 
  X, 
  ExternalLink, 
  Sliders, 
  CheckCircle2, 
  Sparkles,
  Volume2
} from 'lucide-react';

export const HighValueAlertBanner: React.FC = () => {
  const { 
    activeHighValueAlert, 
    dismissHighValueAlert, 
    highValueAlertThreshold, 
    setHighValueAlertThreshold,
    currency, 
    language,
    setActiveTab,
    triggerTestHighValueAlert,
    highValueAlerts,
    clearAllHighValueAlerts,
    isHeadOfFamily,
    accounts,
    transactions
  } = useFinance();

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [customThreshold, setCustomThreshold] = useState<number>(highValueAlertThreshold);

  if (!isHeadOfFamily) {
    return null;
  }

  // Hide banner if user has zero accounts and zero transactions yet (clean initial state)
  if (accounts.length === 0 && transactions.length === 0 && !activeHighValueAlert) {
    return null;
  }

  const unreadAlerts = highValueAlerts.filter(a => !a.isRead);

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    if (customThreshold > 0) {
      setHighValueAlertThreshold(customThreshold);
      setIsConfigOpen(false);
    }
  };

  return (
    <section aria-label="اعلانات تراکنش‌های با مبلغ بالا" className="space-y-3 mb-6">
      {/* Active Instant Alert Toast/Banner */}
      {activeHighValueAlert && (
        <aside 
          role="alert"
          id="high-value-realtime-alert-banner"
          aria-live="assertive"
          className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 p-4 sm:p-5 shadow-lg shadow-amber-500/10 backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4"
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xl shadow-inner">
                  {activeHighValueAlert.memberAvatar || '👤'}
                </div>
                <span className="absolute -bottom-1 -left-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white dark:border-slate-900 items-center justify-center text-[9px] text-white">!</span>
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    هشدار لحظه‌ای: تراکنش سنگین
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {activeHighValueAlert.jalaliDate}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400/90 bg-white/60 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border border-amber-200/50 dark:border-amber-800/40">
                    <Volume2 className="w-3 h-3 text-amber-500" />
                    اعلان فوری سرپرست
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  عضو خانواده <span className="text-amber-700 dark:text-amber-300 font-bold">«{activeHighValueAlert.memberName}»</span> هزینه‌ای با مبلغ{' '}
                  <span className="text-base font-extrabold text-rose-600 dark:text-rose-400 mx-1">
                    {formatCurrency(activeHighValueAlert.amount, currency, language)}
                  </span>
                  ثبت نمود.
                </p>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                  <span>بابت: <strong className="text-slate-700 dark:text-slate-300">{activeHighValueAlert.description}</strong></span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span>دسته‌بندی: <strong>{activeHighValueAlert.categoryName}</strong></span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span>حساب: <strong>{activeHighValueAlert.accountName}</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end">
              <button
                id="btn-view-alert-transactions"
                type="button"
                onClick={() => {
                  dismissHighValueAlert(activeHighValueAlert.id);
                  setActiveTab('transactions');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs transition-all shadow-sm active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                مشاهده در تراکنش‌ها
              </button>

              <button
                id="btn-dismiss-realtime-alert"
                type="button"
                onClick={() => dismissHighValueAlert(activeHighValueAlert.id)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-amber-500/20 transition-colors"
                title="بستن اعلان"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Control Strip for Head: Threshold info & Quick simulation button */}
      <div 
        id="high-value-settings-strip"
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-sm"
      >
        <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>پایش لحظه‌ای مخارج اعضای خانواده:</span>
          <span className="font-bold text-slate-900 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            حد آستانه هشدار: {formatCurrency(highValueAlertThreshold, currency, language)}
          </span>
          {unreadAlerts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white">
              {unreadAlerts.length} تراکنش بالا
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-simulate-high-value-alert"
            type="button"
            onClick={triggerTestHighValueAlert}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/70 dark:border-amber-800/60 transition-all active:scale-95"
            title="تست ارسال لحظه‌ای تراکنش بالای یک میلیون تومان"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            تست اعلان لحظه‌ای
          </button>

          <button
            id="btn-configure-high-value-threshold"
            type="button"
            onClick={() => {
              setCustomThreshold(highValueAlertThreshold);
              setIsConfigOpen(!isConfigOpen);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            تنظیم سقف هشدار
          </button>

          {unreadAlerts.length > 0 && (
            <button
              id="btn-clear-all-high-alerts"
              type="button"
              onClick={clearAllHighValueAlerts}
              className="text-[11px] text-slate-400 hover:text-rose-500 px-2 py-1 transition-colors"
            >
              پاکسازی همه
            </button>
          )}
        </div>
      </div>

      {/* Threshold Modal / Inline Configuration */}
      {isConfigOpen && (
        <form 
          id="form-configure-threshold"
          onSubmit={handleSaveThreshold}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md animate-in fade-in duration-200 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-500" />
              تنظیم حد آستانه اعلان تراکنش با مبلغ بالا برای سرپرست
            </h4>
            <button
              type="button"
              onClick={() => setIsConfigOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            هر زمان اعضای خانواده تراکنشی با مبلغی بالاتر از این سقف ثبت کنند، اعلان هشدار با صدای ملایم فورا در داشبورد شما به نمایش در می‌آید.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {[500000, 1000000, 2000000, 3000000, 5000000].map((val, idx) => (
              <button
                key={`hva-threshold-${val}-${idx}`}
                type="button"
                onClick={() => setCustomThreshold(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  customThreshold === val
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                {formatCurrency(val, 'toman', language)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="relative flex-1">
              <input
                id="input-custom-threshold"
                type="number"
                min="100000"
                step="50000"
                value={customThreshold}
                onChange={e => setCustomThreshold(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                placeholder="مبلغ دلخواه به تومان..."
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                تومان
              </span>
            </div>

            <button
              id="btn-save-threshold"
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              ذخیره سقف هشدار
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
