import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatNumber, fromPersianDigits, toPersianDigits } from '../../utils/formatters';
import { 
  Calculator, 
  Sparkles, 
  Coins, 
  Percent, 
  DollarSign, 
  ShieldCheck, 
  Lightbulb, 
  CheckCircle2, 
  AlertCircle, 
  Plus,
  ArrowRightLeft,
  FileText,
  ArrowRight,
  TrendingUp,
  Compass,
  Layers,
  Bot
} from 'lucide-react';
import { BankSmsAiParserModal } from '../transactions/BankSmsAiParserModal';
import { InvestmentAdvisorWidget } from '../investments/InvestmentAdvisorWidget';
import { UnrealizedPnLWidget } from '../investments/UnrealizedPnLWidget';
import { InvestmentVolatilityPnLSection } from '../investments/InvestmentVolatilityPnLSection';
import { MarketRatesWidget } from '../market/MarketRatesWidget';

export type ToolsSubTab = 'investment_advisor' | 'unrealized_pnl' | 'market_rates' | 'sms_parser' | 'loan_calculator' | 'health_diagnostics';

export const ToolsAndAdvisor: React.FC = () => {
  const {
    totalNetWorth,
    monthlyIncome,
    monthlyExpense,
    monthlySavings,
    totalDebtsOwed,
    financialHealthScore,
    currency,
    language,
    addLoan,
  } = useFinance();

  const isFa = language === 'fa';
  const [activeSubTab, setActiveSubTab] = useState<ToolsSubTab>('investment_advisor');
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);

  // Loan Calculator State
  const [calcPrincipalStr, setCalcPrincipalStr] = useState('100000000');
  const [calcRate, setCalcRate] = useState(23);
  const [calcMonths, setCalcMonths] = useState(24);
  const [calcTitle, setCalcTitle] = useState('وام محاسبه شده');

  // Gold & Currency Calculator State
  const [goldGrams, setGoldGrams] = useState('10');
  const [goldGramPrice, setGoldGramPrice] = useState('4860000'); // 4.86M Toman per gram
  const [usdAmount, setUsdAmount] = useState('1000');
  const [usdRate, setUsdRate] = useState('76500'); // 76.5k Toman per USD

  // Central Bank Loan Calculation formula
  const loanCalcResults = useMemo(() => {
    const P = Number(fromPersianDigits(calcPrincipalStr.replace(/,/g, ''))) || 0;
    const r = calcRate / 100 / 12; // Monthly rate
    const n = calcMonths;

    if (P <= 0 || n <= 0) return { monthly: 0, totalInterest: 0, totalPayment: 0 };

    let monthly = 0;
    if (r === 0) {
      monthly = P / n;
    } else {
      // Standard Formula: PMT = P * r * (1+r)^n / ((1+r)^n - 1)
      monthly = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const totalPayment = monthly * n;
    const totalInterest = totalPayment - P;

    return {
      monthly: Math.round(monthly),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
      principal: P,
    };
  }, [calcPrincipalStr, calcRate, calcMonths]);

  // Convert calculated loan into actual loan tracker
  const handleAddCalculatedLoan = () => {
    if (loanCalcResults.principal <= 0) return;
    addLoan({
      title: calcTitle || 'وام جدید',
      bankName: 'بانک',
      principalAmount: loanCalcResults.principal,
      totalAmount: loanCalcResults.totalPayment,
      interestRate: calcRate,
      totalInstallments: calcMonths,
      paidInstallments: 0,
      monthlyPayment: loanCalcResults.monthly,
      startDate: new Date().toISOString().slice(0, 10),
      startJalaliDate: '1405/06/01',
      dueDayOfMonth: 1,
    });
    alert(isFa ? 'وام با موفقیت به بخش وام‌ها و اقساط افزوده شد.' : 'Loan added to your tracker.');
  };

  // Emergency Fund months covered
  const emergencyMonthsCovered = monthlyExpense > 0 
    ? (totalNetWorth / monthlyExpense).toFixed(1) 
    : '0';

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isFa ? 'ابزارهای مالی، نرخ بازار و هوش سرمایه‌گذاری' : 'Financial Tools, Market Rates & AI Advisor'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isFa ? 'پیشنهاد هوشمند سبد سرمایه‌گذاری، تابلوی زنده قیمت طلا و ارز، مبدل لحظه‌ای و تحلیلگر پیامک بانکی' : 'AI investment allocation, real-time gold & forex rates, loan calculator, and bank SMS parsing'}
          </p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
        {[
          { id: 'unrealized_pnl', labelFa: 'تحلیل نوسانات و درصد سود/زیان طلا و ارز', labelEn: 'Volatility & P&L Analytics', icon: TrendingUp },
          { id: 'investment_advisor', labelFa: 'پیشنهاد سبد و مشاور هوشمند سرمایه‌گذاری', labelEn: 'AI Investment Advisor', icon: Sparkles },
          { id: 'market_rates', labelFa: 'تابلوی نرخ زنده طلا، ارز و رمزارز', labelEn: 'Live Market Rates', icon: Coins },
          { id: 'sms_parser', labelFa: 'تحلیل خودکار پیامک بانکی', labelEn: 'Bank SMS AI', icon: FileText },
          { id: 'loan_calculator', labelFa: 'محاسبه‌گر وام و اقساط', labelEn: 'Loan Calculator', icon: Calculator },
          { id: 'health_diagnostics', labelFa: 'چکاپ و سلامت مالی', labelEn: 'Health Diagnostics', icon: ShieldCheck },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;

          return (
            <button
              key={`tools-subtab-${tab.id}`}
              onClick={() => setActiveSubTab(tab.id as ToolsSubTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{isFa ? tab.labelFa : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: REAL-TIME VOLATILITY & UNREALIZED P&L ANALYTICS */}
      {activeSubTab === 'unrealized_pnl' && (
        <InvestmentVolatilityPnLSection />
      )}

      {/* TAB 2: AI INVESTMENT ADVISOR */}
      {activeSubTab === 'investment_advisor' && (
        <InvestmentAdvisorWidget />
      )}

      {/* TAB 3: LIVE MARKET RATES & CONVERTER */}
      {activeSubTab === 'market_rates' && (
        <MarketRatesWidget />
      )}

      {/* TAB 3: BANK SMS AI PARSER */}
      {activeSubTab === 'sms_parser' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shrink-0 shadow-inner">
                <Sparkles className="w-8 h-8 animate-pulse text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg sm:text-xl">
                    {isFa ? 'تحلیل خودکار پیامک‌های بانکی با هوش مصنوعی جمنای' : 'AI Bank SMS Auto-Parser (Gemini)'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                    Google Gemini
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-100 mt-2 max-w-xl leading-relaxed">
                  {isFa
                    ? 'کافیست پیامک‌های تراکنش بانک (سامان، ملت، بلو، ملی، پاسارگاد و...) را بچسبانید تا هوش مصنوعی مبالغ، نام پذیرنده و تاریخ را استخراج کرده و به صورت خودکار در دیتابیس ثبت کند.'
                    : 'Paste any Iranian bank SMS; Gemini AI extracts amount, merchant, and dates and logs them automatically.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsSmsModalOpen(true)}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-blue-50 text-blue-700 font-bold text-sm shadow-lg shadow-black/10 active:scale-[0.98] transition-all flex items-center gap-2 shrink-0 cursor-pointer relative z-10"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>{isFa ? 'اجرای ماژول تحلیل پیامک' : 'Launch SMS Parser'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: LOAN CALCULATOR & MANUAL GOLD/CURRENCY CONVERTER */}
      {activeSubTab === 'loan_calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LOAN CALCULATOR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {isFa ? 'محاسبه‌گر وام بانکی (فرمول بانک مرکزی)' : 'Bank Loan Installment Calculator'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isFa ? 'محاسبه دقیق اقساط، سود کل و ثبت خودکار در سررسیدها' : 'Calculates PMT and adds directly to loans tracker'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isFa ? 'عنوان وام یا بانک' : 'Loan Title'}
                </label>
                <input
                  type="text"
                  value={calcTitle}
                  onChange={(e) => setCalcTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isFa ? 'مبلغ اصل وام (تومان)' : 'Principal (Toman)'}
                </label>
                <input
                  type="text"
                  value={toPersianDigits(Number(calcPrincipalStr).toLocaleString('en-US'))}
                  onChange={(e) => setCalcPrincipalStr(fromPersianDigits(e.target.value).replace(/\D/g, ''))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isFa ? 'نرخ سود سالانه (٪)' : 'Annual Interest (%)'}
                  </label>
                  <input
                    type="number"
                    value={calcRate}
                    onChange={(e) => setCalcRate(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isFa ? 'مدت بازپرداخت (ماه)' : 'Months'}
                  </label>
                  <input
                    type="number"
                    value={calcMonths}
                    onChange={(e) => setCalcMonths(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Loan Results */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-bold">{isFa ? 'مبلغ هر قسط ماهانه:' : 'Monthly Payment:'}</span>
                <span className="font-black text-sm text-blue-600 dark:text-blue-400">
                  {formatCurrency(loanCalcResults.monthly, currency, isFa)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-bold">{isFa ? 'کل سود بازپرداخت:' : 'Total Interest:'}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {formatCurrency(loanCalcResults.totalInterest, currency, isFa)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-200 font-black">{isFa ? 'کل مبلغ بازپرداخت:' : 'Total Payment:'}</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {formatCurrency(loanCalcResults.totalPayment, currency, isFa)}
                </span>
              </div>
            </div>

            <button
              onClick={handleAddCalculatedLoan}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isFa ? 'افزودن این وام به دفتر اقساط' : 'Add to Loan Tracker'}</span>
            </button>
          </div>

          {/* QUICK MANUAL CONVERTERS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {isFa ? 'محاسبه‌گر دستی ارزش طلا و دلار' : 'Manual Gold & Forex Calculator'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isFa ? 'محاسبه ارزش ریالی دارایی بر مبنای نرخ دلخواه' : 'Custom rate asset valuation'}
                </p>
              </div>
            </div>

            {/* Gold Calculator */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 space-y-3">
              <span className="font-bold text-amber-700 dark:text-amber-400 text-xs block">{isFa ? 'محاسبه ارزش طلا' : 'Gold Valuation'}</span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-bold">{isFa ? 'وزن (گرم)' : 'Weight (g)'}</label>
                  <input
                    type="text"
                    value={goldGrams}
                    onChange={(e) => setGoldGrams(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-bold">{isFa ? 'قیمت هر گرم (تومان)' : 'Price per g'}</label>
                  <input
                    type="text"
                    value={toPersianDigits(Number(goldGramPrice).toLocaleString('en-US'))}
                    onChange={(e) => setGoldGramPrice(fromPersianDigits(e.target.value).replace(/\D/g, ''))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-bold">{isFa ? 'ارزش کل طلا:' : 'Total:'}</span>
                <span className="font-black text-amber-600 dark:text-amber-400">
                  {formatCurrency((Number(goldGrams) || 0) * (Number(goldGramPrice) || 0), currency, isFa)}
                </span>
              </div>
            </div>

            {/* Currency Calculator */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 space-y-3">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs block">{isFa ? 'محاسبه ارزش دلار آمریکا' : 'USD Valuation'}</span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-bold">{isFa ? 'مبلغ به دلار ($)' : 'Amount ($)'}</label>
                  <input
                    type="text"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-bold">{isFa ? 'نرخ دلار (تومان)' : 'USD Rate'}</label>
                  <input
                    type="text"
                    value={toPersianDigits(Number(usdRate).toLocaleString('en-US'))}
                    onChange={(e) => setUsdRate(fromPersianDigits(e.target.value).replace(/\D/g, ''))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-bold">{isFa ? 'معادل تومانی:' : 'Equivalent:'}</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency((Number(usdAmount) || 0) * (Number(usdRate) || 0), currency, isFa)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FINANCIAL HEALTH DIAGNOSTICS */}
      {activeSubTab === 'health_diagnostics' && (
        <div className="bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/50 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-2xl shadow-xs">
                {isFa ? toPersianDigits(financialHealthScore) : financialHealthScore}
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                  {isFa ? 'چکاپ و ارزیابی جامع سلامت مالی خانواده' : 'Comprehensive Financial Health Checkup'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isFa 
                    ? `امتیاز شما بر اساس نرخ پس‌انداز ماهانه، نسبت نقدینگی و پوشش بدهی‌ها محاسبه شده است.` 
                    : `Score computed from savings rate, liquidity ratio, and debt coverage.`}
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 shrink-0 text-xs">
              <span className="text-emerald-700 dark:text-emerald-300 font-bold block">{isFa ? 'پوشش صندوق اضطراری:' : 'Emergency Fund Runway:'}</span>
              <span className="text-base font-black text-emerald-800 dark:text-emerald-200 mt-0.5 block">
                {isFa ? `${toPersianDigits(emergencyMonthsCovered)} ماه هزینه‌های زندگی` : `${emergencyMonthsCovered} months of living expenses`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">{isFa ? 'نرخ پس‌انداز ماهانه' : 'Monthly Savings Rate'}</span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {monthlyIncome > 0 ? toPersianDigits(Math.round((monthlySavings / monthlyIncome) * 100)) : 0}٪
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isFa ? (monthlySavings > 0 ? 'وضعیت مطلوب (پس‌انداز مثبت)' : 'نیاز به کنترل مخارج') : 'Savings health'}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">{isFa ? 'نسبت کل بدهی به دارایی' : 'Debt-to-Asset Ratio'}</span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {totalNetWorth > 0 ? toPersianDigits(Math.round((totalDebtsOwed / totalNetWorth) * 100)) : 0}٪
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isFa ? (totalDebtsOwed < totalNetWorth * 0.3 ? 'نسبت بدهی امن و مدیریت‌شده' : 'هشدار بدهی بالا') : 'Debt load'}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">{isFa ? 'تراز نقدینگی خالص' : 'Net Liquidity'}</span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalNetWorth - totalDebtsOwed, currency, isFa)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isFa ? 'دارایی خالص پس از تسویه تمام تعهدات' : 'Liquid Net Balance'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Bank SMS Parser Modal */}
      <BankSmsAiParserModal
        key="tools-bank-sms-parser-modal"
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
      />
    </div>
  );
};
