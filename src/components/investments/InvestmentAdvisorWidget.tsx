import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatNumber, fromPersianDigits, toPersianDigits } from '../../utils/formatters';
import { 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Compass, 
  Coins, 
  Flame, 
  Send, 
  Bot, 
  User, 
  PieChart as PieChartIcon, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Target,
  BarChart3,
  Lightbulb,
  Zap
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { GoogleGenAI } from '@google/genai';

export type RiskProfileType = 'conservative' | 'balanced' | 'aggressive';

interface AssetAllocationItem {
  nameFa: string;
  nameEn: string;
  percentage: number;
  color: string;
  category: string;
  descriptionFa: string;
  instrumentsFa: string[];
}

export const InvestmentAdvisorWidget: React.FC = () => {
  const {
    totalNetWorth,
    monthlyIncome,
    monthlyExpense,
    monthlySavings,
    totalDebtsOwed,
    currency,
    language,
    financialHealthScore,
  } = useFinance();

  const isFa = language === 'fa';

  const [riskProfile, setRiskProfile] = useState<RiskProfileType>('balanced');
  const [initialCapitalStr, setInitialCapitalStr] = useState<string>(() => {
    return Math.max(10000000, Math.round(totalNetWorth * 0.4)).toString();
  });
  const [monthlyContributionStr, setMonthlyContributionStr] = useState<string>(() => {
    return Math.max(2000000, Math.max(0, monthlySavings)).toString();
  });

  // AI Advisor Chat State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState<{ sender: 'user' | 'ai'; text: string; time: string }[]>([
    {
      sender: 'ai',
      text: isFa
        ? `سلام! من مشاور هوشمند سرمایه‌گذاری جیبینو هستم. وضعیت دارایی شما شامل ارزش خالص ${formatCurrency(totalNetWorth, currency, true)} و مازاد پس‌انداز ماهانه ${formatCurrency(monthlySavings, currency, true)} را بررسی کردم. بر اساس اهدافتان چطور می‌توانم در چینش پورتفوی یا خرید طلا، سهام و رمزارز راهنماییتان کنم؟`
        : `Hello! I am Jibino's AI Investment Advisor. I've analyzed your financial health and cashflow. How can I help optimize your asset allocation and investment strategy today?`,
      time: 'هم‌اکنون',
    },
  ]);

  const initialCapital = useMemo(() => {
    return Number(fromPersianDigits(initialCapitalStr.replace(/,/g, ''))) || 0;
  }, [initialCapitalStr]);

  const monthlyContribution = useMemo(() => {
    return Number(fromPersianDigits(monthlyContributionStr.replace(/,/g, ''))) || 0;
  }, [monthlyContributionStr]);

  // Strategy Allocations
  const allocations: Record<RiskProfileType, AssetAllocationItem[]> = {
    conservative: [
      {
        nameFa: 'صندوق درآمد ثابت و سپرده ویژه',
        nameEn: 'Fixed Income & High-Yield Deposits',
        percentage: 55,
        color: '#3b82f6',
        category: 'fixed_income',
        descriptionFa: 'سود روزشمار مطمئن بدون ریسک نوسان برای حفظ نقدینگی',
        instrumentsFa: ['صندوق‌های درآمد ثابت بورسی', 'سپرده بانکی ویژه', 'اوراق گام و اخزا'],
      },
      {
        nameFa: 'طلای آبشده و صندوق طلا',
        nameEn: 'Gold Funds & Physical Gold',
        percentage: 30,
        color: '#eab308',
        category: 'gold',
        descriptionFa: 'پوشش ریسک تورم و کاهش ارزش پول با نقدشوندگی عالی',
        instrumentsFa: ['صندوق‌های طلای بورس (عیار، کهربا، طلا)', 'طلای ۱۸ عیار بدون اجرت'],
      },
      {
        nameFa: 'صندوق درآمد ثابت دلاری / تتر',
        nameEn: 'USD Tether / Stablecoins',
        percentage: 15,
        color: '#10b981',
        category: 'stablecoin',
        descriptionFa: 'حفظ ارزش دارایی به دلار با نوسان صفر',
        instrumentsFa: ['تتر (USDT)', 'سپرده ارزی'],
      },
    ],
    balanced: [
      {
        nameFa: 'طلا، شمش و صندوق‌های طلا',
        nameEn: 'Gold, Bullion & Gold ETFs',
        percentage: 40,
        color: '#eab308',
        category: 'gold',
        descriptionFa: 'ستون اصلی حفظ ارزش دارایی و سپر تورمی در ایران',
        instrumentsFa: ['صندوق‌های طلا (عیار، لوتوس، زر)', 'شمش طلا در بورس کالا', 'سکه تمام'],
      },
      {
        nameFa: 'صندوق‌های سهامی و شاخصی بورس',
        nameEn: 'Stock Index & Equity Funds',
        percentage: 30,
        color: '#6366f1',
        category: 'equity',
        descriptionFa: 'کسب بازدهی از رشد شرکت‌های بنیادی و صادرکننده',
        instrumentsFa: ['صندوق‌های شاخصی ۳۰ شرکت بزرگ', 'صندوق‌های بخشی پتروشیمی/فلزات'],
      },
      {
        nameFa: 'صندوق درآمد ثابت و اخزا',
        nameEn: 'Fixed Income Funds',
        percentage: 20,
        color: '#06b6d4',
        category: 'fixed_income',
        descriptionFa: 'جریان درآمدی ثابت برای خرید در اصلاح‌های قیمتی',
        instrumentsFa: ['صندوق‌های درآمد ثابت با بازده ۲۸-۳۱٪', 'اوراق مرابحه و اخزا'],
      },
      {
        nameFa: 'رمزارزهای اصلی (بیت‌کوین و اتریوم)',
        nameEn: 'Top Cryptos (BTC / ETH)',
        percentage: 10,
        color: '#f97316',
        category: 'crypto',
        descriptionFa: 'سرمایه‌گذاری در تکنولوژی مالی بین‌المللی با رشد بلندمدت',
        instrumentsFa: ['بیت‌کوین (BTC)', 'اتریوم (ETH)'],
      },
    ],
    aggressive: [
      {
        nameFa: 'ارزهای دیجیتال (BTC, ETH, SOL)',
        nameEn: 'Crypto Assets (BTC, ETH, SOL)',
        percentage: 35,
        color: '#f97316',
        category: 'crypto',
        descriptionFa: 'پتانسیل بازدهی ماکزیمم با پذیرش نوسانات قیمتی بالا',
        instrumentsFa: ['بیت‌کوین', 'اتریوم', 'سولانا', 'تون کوین'],
      },
      {
        nameFa: 'طلا، شمش و سکه بهار آزادی',
        nameEn: 'Gold Bars & Coins',
        percentage: 30,
        color: '#eab308',
        category: 'gold',
        descriptionFa: 'تثبیت سودهای پرریسک در دارایی سخت و بدون ریسک طرف مقابل',
        instrumentsFa: ['گواهی شمش طلا بورس کالا', 'سکه امامی', 'صندوق طلا'],
      },
      {
        nameFa: 'صندوق‌های اهرمی و سهام رشد بالا',
        nameEn: 'Leveraged & High-Beta Funds',
        percentage: 25,
        color: '#a855f7',
        category: 'leveraged',
        descriptionFa: 'بهره‌برداری چندبرابری از روندهای صعودی بازار سرمایه',
        instrumentsFa: ['صندوق‌های اهرمی (کاریزما، شتاب، جهش)', 'سهام کوچک با پی‌به‌ای مناسب'],
      },
      {
        nameFa: 'نقدینگی استراتژیک و شکار فرصت‌ها',
        nameEn: 'Strategic Cash Reserves',
        percentage: 10,
        color: '#10b981',
        category: 'cash',
        descriptionFa: 'نقدینگی در دسترس برای خرید در ریزش‌های شارپ بازار',
        instrumentsFa: ['تتر نقد', 'صندوق درآمد ثابت نقدشونده فوری'],
      },
    ],
  };

  const currentAllocation = allocations[riskProfile];

  // Calculated values per allocation item
  const allocationBreakdown = useMemo(() => {
    return currentAllocation.map(item => {
      const initialAmount = (initialCapital * item.percentage) / 100;
      const monthlyAmount = (monthlyContribution * item.percentage) / 100;
      return {
        ...item,
        initialAmount,
        monthlyAmount,
      };
    });
  }, [currentAllocation, initialCapital, monthlyContribution]);

  // Projected Return Scenarios (1 Year & 3 Years)
  const projectionResults = useMemo(() => {
    const annualRate = riskProfile === 'conservative' ? 0.32 : riskProfile === 'balanced' ? 0.48 : 0.68;
    
    // Future Value after 1 year: FV = PV*(1+r) + PMT * [((1+r/12)^12 - 1)/(r/12)]
    const monthlyRate = annualRate / 12;
    const months12 = 12;
    const months36 = 36;

    const fv1Year = initialCapital * Math.pow(1 + monthlyRate, months12) +
      monthlyContribution * ((Math.pow(1 + monthlyRate, months12) - 1) / monthlyRate);

    const fv3Year = initialCapital * Math.pow(1 + monthlyRate, months36) +
      monthlyContribution * ((Math.pow(1 + monthlyRate, months36) - 1) / monthlyRate);

    const totalInvested1Y = initialCapital + monthlyContribution * 12;
    const totalInvested3Y = initialCapital + monthlyContribution * 36;

    return {
      annualRatePercent: Math.round(annualRate * 100),
      fv1Year: Math.round(fv1Year),
      profit1Year: Math.max(0, Math.round(fv1Year - totalInvested1Y)),
      fv3Year: Math.round(fv3Year),
      profit3Year: Math.max(0, Math.round(fv3Year - totalInvested3Y)),
    };
  }, [initialCapital, monthlyContribution, riskProfile]);

  // Handle AI Advisor consultation
  const handleSendAiPrompt = async (promptToSend?: string) => {
    const query = promptToSend || aiPrompt;
    if (!query.trim() || isAiLoading) return;

    const userMsg = {
      sender: 'user' as const,
      text: query,
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };

    setAiChatHistory(prev => [...prev, userMsg]);
    setAiPrompt('');
    setIsAiLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY || (window as any).GEMINI_API_KEY || '';
      let replyText = '';

      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `شما مشاور ارشد و خبره مدیریت ثروت و سرمایه‌گذاری در سامانه مالی جیبینو هستید.
اطلاعات مالی کاربر:
- کل ارزش دارایی: ${totalNetWorth.toLocaleString('fa-IR')} تومان
- مازاد پس‌انداز ماهانه: ${monthlySavings.toLocaleString('fa-IR')} تومان
- کل بدهی‌ها: ${totalDebtsOwed.toLocaleString('fa-IR')} تومان
- استراتژی ریسک انتخابی: ${riskProfile}
پاسخ‌های کاربردی، هوشمند، مبتنی بر اقتصاد ایران (تورم، طلا، صندوق طلا در بورس، تتر، سهام، درآمد ثابت) بدهید. پاسخ را ساختاریافته، با لحن محترمانه، همراه با تیترهای کوتاه و راهکارهای شفاف بنویسید.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: query,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        replyText = response.text || '';
      }

      if (!replyText) {
        // High quality rule-based response fallback
        if (query.includes('طلا') || query.includes('سکه')) {
          replyText = `📌 **تحلیل سرمایه‌گذاری در طلا و سکه:**\n\n۱. **صندوق‌های طلای بورس (ETF):** بهترین گزینه برای سرمایه‌گذاری خرد و منظم با مبالغ بالای ۱۰۰ هزار تومان هستند (بدون ریسک سرقت و بدون اجرت ساخت).\n۲. **طلای آبشده و شمش:** برای مبالغ سنگین‌تر جهت فرار از حباب سکه و مالیات مناسب‌ترین انتخاب است.\n۳. **سکه:** با توجه به حباب فعلی، ربع سکه حباب بالاتری دارد؛ لذا برای افق کمتر از یک سال، صندوق طلا یا طلای آبشده کم‌ریسک‌تر است.`;
        } else if (query.includes('حقوق') || query.includes('ماهانه') || query.includes('مازاد')) {
          replyText = `💡 **استراتژی تخصیص مازاد پس‌انداز ماهانه:**\n\nبا توجه به مازاد ماهانه شما (${formatCurrency(monthlyContribution, currency, isFa)}):\n- **۴۰٪ (طلا/صندوق طلا):** خرید پله‌ای واحدهای صندوق‌های طلا در ابتدای هر ماه.\n- **۳۰٪ (صندوق‌های شاخصی و درآمد ثابت):** ایجاد جریان درآمدی و بهره‌مندی از فرصت‌های بورس.\n- **۲۰٪ (پس‌انداز احتیاطی):** نگهداری در حساب متصل به سود یا درآمد ثابت برای هزینه‌های پیش‌بینی‌نشده.\n- **۱۰٪ (ارز دیجیتال/تتر):** خرید پله‌ای بیت‌کوین و تتر برای تنوع‌بخشی بین‌المللی.`;
        } else {
          replyText = `🎯 **پیشنهاد مشاور جیبینو بر اساس مشخصات مالی شما:**\n\nبا توجه به ارزش خالص دارایی (${formatCurrency(totalNetWorth, currency, isFa)}) و مازاد نقدینگی ماهانه شما، استراتژی پیشنهادی بر پایه **«تنوع‌بخشی ضدتورمی»** استوار است.\n\n۱. **خرید پله‌ای (DCA):** از ورود یکباره با تمام سرمایه در سقف‌ها خودداری کرده و خریدها را در ۴ نوبت ماهانه تقسیم کنید.\n۲. **سپر طلایی:** حداقل ۳۵ تا ۴۰ درصد سرمایه را در سبد طلا و صندوق‌های طلا تثبیت کنید تا قدرت خرید در برابر نوسانات ارزی حفظ شود.\n۳. **صندوق‌های درآمد ثابت:** سود ماهانه دریافتی را مجدداً به دارایی‌های رشدپذیر تبدیل کنید (اثر سود مرکب).`;
        }
      }

      setAiChatHistory(prev => [
        ...prev,
        {
          sender: 'ai',
          text: replyText,
          time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.warn('AI Advisor call failed, using rule engine', err);
      setAiChatHistory(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `📌 بر اساس تحلیل هوشمند سبد دارایی شما، توصیه می‌شود با تقسیم سرمایه به نسبت ۴۰٪ طلا، ۳۰٪ صندوق‌های سهامی، ۲۰٪ درآمد ثابت و ۱۰٪ رمزارز، ریسک نوسانات را به حداقل رسانده و بازدهی بالاتری از نرخ تورم کسب نمایید.`,
          time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const quickQuestions = isFa ? [
    'بهترین روش سرمایه‌گذاری مازاد حقوق ماهانه چیست؟',
    'آیا خرید صندوق طلا بهتر از سکه فیزیکی است؟',
    'چگونه دارایی‌هایم را در برابر تورم بیمه کنم؟',
    'استراتژی خرید پله‌ای ارز دیجیتال چطور کار می‌کند؟',
  ] : [
    'How should I invest my monthly salary surplus?',
    'Is a Gold ETF better than physical gold coins?',
    'How can I hedge against inflation?',
    'What is the dollar-cost averaging strategy?',
  ];

  return (
    <div className="space-y-6">
      {/* Top Hero Card: Portfolio Diagnostics & Strategy Selector */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isFa ? 'هوش مصنوعی مدیریت ثروت و دارایی جیبینو' : 'Jibino Smart Wealth Advisor'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isFa ? 'پیشنهاد سبد بهینه سرمایه‌گذاری و رشد دارایی' : 'Optimized Investment Portfolio & Asset Growth'}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/90 mt-2 leading-relaxed">
              {isFa
                ? 'تحلیلگر هوشمند وضعیت تراز مالی، نقدینگی و پس‌انداز ماهانه شما را سنجیده و بهترین ترکیب تنوع‌بخشی به دارایی‌ها (طلا، سهام، ارز دیجیتال و درآمد ثابت) را پیشنهاد می‌دهد.'
                : 'Intelligent diagnostic evaluates your cashflow and surplus to formulate the ideal inflation-hedged allocation across Gold, Equities, Crypto, and Fixed Income.'}
            </p>
          </div>

          {/* Quick Summary Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center gap-4 shrink-0">
            <div>
              <span className="text-[11px] text-indigo-200 block">{isFa ? 'ارزش دارایی پایه:' : 'Net Worth:'}</span>
              <span className="text-base sm:text-lg font-black text-amber-300">
                {formatCurrency(totalNetWorth, currency, isFa)}
              </span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <span className="text-[11px] text-indigo-200 block">{isFa ? 'مازاد پس‌انداز ماه:' : 'Monthly Surplus:'}</span>
              <span className="text-base sm:text-lg font-black text-emerald-400">
                {formatCurrency(monthlySavings, currency, isFa)}
              </span>
            </div>
          </div>
        </div>

        {/* Strategy Selector Pills */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-indigo-500/30">
          {[
            {
              id: 'conservative',
              titleFa: 'محافظه‌کار (امن و کم‌ریسک)',
              titleEn: 'Conservative (Low Risk)',
              descFa: 'تمرکز بر سود ثابت، طلای آبشده و حفظ اصل سرمایه',
              icon: ShieldCheck,
              accent: 'from-blue-600 to-cyan-600',
              border: 'border-blue-400',
            },
            {
              id: 'balanced',
              titleFa: 'متعادل (پوشش تورم و رشد - پیشنهادی)',
              titleEn: 'Balanced (Inflation Hedge)',
              descFa: 'ترکیب هوشمند طلا، صندوق‌های سهامی، درآمد ثابت و بیت‌کوین',
              icon: Target,
              accent: 'from-indigo-600 to-purple-600',
              border: 'border-indigo-400',
            },
            {
              id: 'aggressive',
              titleFa: 'جسورانه (رشد بالا و پرریسک)',
              titleEn: 'Aggressive (High Growth)',
              descFa: 'بیشینه‌سازی سود با رمزارزها، صندوق‌های اهرمی و طلا',
              icon: Flame,
              accent: 'from-amber-600 to-rose-600',
              border: 'border-rose-400',
            },
          ].map(strat => {
            const Icon = strat.icon;
            const isSelected = riskProfile === strat.id;

            return (
              <button
                key={`strat-btn-${strat.id}`}
                onClick={() => setRiskProfile(strat.id as RiskProfileType)}
                className={`p-4 rounded-2xl border text-right rtl:text-right ltr:text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? `bg-gradient-to-r ${strat.accent} border-white text-white shadow-lg shadow-indigo-500/25 scale-[1.02]`
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-indigo-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs sm:text-sm">{isFa ? strat.titleFa : strat.titleEn}</span>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-300' : 'text-indigo-300'}`} />
                </div>
                <p className="text-[11px] text-indigo-200/80 mt-1.5 leading-relaxed">
                  {isFa ? strat.descFa : strat.descFa}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Capital Customization & Target Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Top (Inputs & Donut Chart) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>{isFa ? 'تخصیص درصد و مبالغ سبد' : 'Target Asset Allocation'}</span>
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
              {isFa ? '۱۰۰٪ توزیع‌شده' : '100% Allocated'}
            </span>
          </div>

          {/* Amount Inputs */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                {isFa ? 'سرمایه اولیه ورود به سبد (تومان):' : 'Initial Investment Capital (TMN):'}
              </label>
              <input
                type="text"
                value={initialCapitalStr}
                onChange={(e) => setInitialCapitalStr(e.target.value)}
                className="w-full text-sm font-bold py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                {isFa ? 'تزریق پس‌انداز ماهانه جدید (تومان):' : 'Monthly Recurring Contribution (TMN):'}
              </label>
              <input
                type="text"
                value={monthlyContributionStr}
                onChange={(e) => setMonthlyContributionStr(e.target.value)}
                className="w-full text-sm font-bold py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Recharts Donut */}
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentAllocation}
                  dataKey="percentage"
                  nameKey="nameFa"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {currentAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${toPersianDigits(value)}٪`, 'سهم سبد']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right (Detailed Asset Cards & Instruments) */}
        <div className="lg:col-span-7 space-y-3.5">
          {allocationBreakdown.map((item, idx) => (
            <div
              key={`alloc-item-${idx}`}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:border-indigo-300 dark:hover:border-indigo-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span 
                    className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {isFa ? item.nameFa : item.nameEn}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isFa ? item.descriptionFa : item.descriptionFa}
                    </p>
                  </div>
                </div>

                <div className="text-right rtl:text-right ltr:text-left shrink-0">
                  <span 
                    className="text-xs sm:text-sm font-black px-2.5 py-1 rounded-xl text-white shadow-xs inline-block"
                    style={{ backgroundColor: item.color }}
                  >
                    {isFa ? toPersianDigits(item.percentage) : item.percentage}٪
                  </span>
                </div>
              </div>

              {/* Exact Suggested Investment Amounts */}
              <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">{isFa ? 'مبلغ ورود اولیه:' : 'Initial Allocation:'}</span>
                  <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                    {formatCurrency(item.initialAmount, currency, isFa)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{isFa ? 'سهم از پس‌انداز هر ماه:' : 'Monthly Top-up:'}</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                    {formatCurrency(item.monthlyAmount, currency, isFa)}
                  </span>
                </div>
              </div>

              {/* Suggested Real Market Instruments */}
              <div className="mt-3 pt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400">{isFa ? 'ابزارهای پیشنهادی:' : 'Instruments:'}</span>
                {item.instrumentsFa.map((inst, i) => (
                  <span
                    key={`inst-${i}`}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    {inst}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Return Projections & Compounding Forecast */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-3xl p-6 text-white shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-white">
              {isFa ? 'پیش‌بینی بازدهی و ارزش آتی پورتفوی با محاسبه سود مرکب' : 'Compounding Growth & Future Valuation'}
            </h3>
            <p className="text-xs text-emerald-200/70 mt-0.5">
              {isFa ? `برآورد بازدهی سالانه سبد انتخابی: حدود ${toPersianDigits(projectionResults.annualRatePercent)}٪` : `Estimated annual growth: ~${projectionResults.annualRatePercent}%`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <span className="text-xs text-slate-400 block">{isFa ? 'ارزش تخمینی سبد بعد از ۱ سال:' : '1-Year Projected Value:'}</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">
              {formatCurrency(projectionResults.fv1Year, currency, isFa)}
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
              {isFa ? `+${formatCurrency(projectionResults.profit1Year, currency, isFa)} بازدهی ناخالص پیش‌بینی‌شده` : `+${formatCurrency(projectionResults.profit1Year, currency, false)} profit`}
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <span className="text-xs text-slate-400 block">{isFa ? 'ارزش تخمینی سبد بعد از ۳ سال (اثر سود مرکب):' : '3-Year Projected Value (Compounded):'}</span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
              {formatCurrency(projectionResults.fv3Year, currency, isFa)}
            </div>
            <span className="text-[11px] text-amber-400 font-semibold block mt-1">
              {isFa ? `+${formatCurrency(projectionResults.profit3Year, currency, isFa)} خلق ثروت و پوشش کامل تورم` : `+${formatCurrency(projectionResults.profit3Year, currency, false)} net gain`}
            </span>
          </div>
        </div>
      </div>

      {/* AI Financial Advisor Interactive Assistant */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {isFa ? 'گفت‌وگو با هوش مصنوعی مشاور سرمایه‌گذاری جیبینو' : 'Consult AI Financial Advisor'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isFa ? 'پاسخ هوشمند به سؤالات تخصصی در مورد خرید طلا، بورس، صندوق‌ها و مدیریت سرمایه' : 'Ask questions about gold, stocks, ETFs, crypto, and saving strategies'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {quickQuestions.map((q, idx) => (
            <button
              key={`q-chip-${idx}`}
              onClick={() => handleSendAiPrompt(q)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1 bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
          {aiChatHistory.map((msg, idx) => (
            <div
              key={`ai-msg-${idx}`}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-xs rounded-tl-none'
              }`}>
                {msg.text}
                <span className={`block text-[10px] mt-1.5 opacity-60 ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {isAiLoading && (
            <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 p-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>{isFa ? 'مشاور هوش مصنوعی در حال بررسی داده‌های بازار و تحلیل سبد است...' : 'AI Advisor is analyzing market conditions...'}</span>
            </div>
          )}
        </div>

        {/* Input Prompt Form */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendAiPrompt()}
            placeholder={isFa ? 'سؤال یا نیاز سرمایه‌گذاری خود را بنویسید (مثلاً: الان طلا بخرم یا صندوق درآمد ثابت؟)...' : 'Ask an investment question...'}
            className="flex-1 text-xs sm:text-sm py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => handleSendAiPrompt()}
            disabled={!aiPrompt.trim() || isAiLoading}
            className="p-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4 rtl:rotate-180" />
            <span className="hidden sm:inline">{isFa ? 'ارسال' : 'Send'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
