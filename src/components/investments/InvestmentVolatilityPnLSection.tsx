import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { marketPriceService, LiveAssetPrice } from '../../services/marketPriceService';
import { calculatePortfolioPnL, AssetHoldingPnL, PortfolioPnLSummary } from '../../utils/investmentPnLService';
import { formatCurrency, formatNumber, fromPersianDigits, toPersianDigits } from '../../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Coins, 
  DollarSign, 
  Bitcoin, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Calculator,
  SlidersHorizontal,
  Layers,
  Clock,
  PlusCircle,
  HelpCircle,
  BadgePercent,
  Flame,
  Scale,
  Calendar,
  Activity,
  Zap,
  Target,
  BarChart3,
  PieChart as PieIcon,
  ArrowRight,
  Check,
  Plus,
  RotateCcw,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const InvestmentVolatilityPnLSection: React.FC = () => {
  const { 
    accounts, 
    transactions, 
    currency, 
    language, 
    setActiveTab, 
    addTransaction, 
    addAccount 
  } = useFinance();
  const isFa = language === 'fa';

  const [livePrices, setLivePrices] = useState<LiveAssetPrice[]>(marketPriceService.getPrices());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'gold' | 'currency' | 'crypto' | 'stock'>('all');
  const [sortBy, setSortBy] = useState<'roi' | 'pnl' | 'value' | 'volatility'>('roi');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toLocaleTimeString('fa-IR'));

  // Calibration Modal
  const [showCalibrateModal, setShowCalibrateModal] = useState(false);
  const [editPriceMap, setEditPriceMap] = useState<Record<string, string>>({});
  const [calibrateSuccess, setCalibrateSuccess] = useState(false);

  // Quick Purchase Logger Modal / Inline
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false);
  const [purchaseAssetId, setPurchaseAssetId] = useState('gold_18k');
  const [purchaseQty, setPurchaseQty] = useState('10');
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState('23850000');
  const [purchaseNote, setPurchaseNote] = useState('خرید طلا برای پس‌انداز');

  // Interactive Live Simulator
  const [showSimulator, setShowSimulator] = useState(false);
  const [simAssetId, setSimAssetId] = useState('gold_18k');
  const [simQty, setSimQty] = useState('15');
  const [simBuyPrice, setSimBuyPrice] = useState('19200000');

  // Subscribe to live price service
  useEffect(() => {
    const unsubscribe = marketPriceService.subscribe((prices) => {
      setLivePrices(prices);
      setLastRefreshedAt(new Date().toLocaleTimeString('fa-IR'));
    });
    return () => unsubscribe();
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      marketPriceService.refreshRates();
      setIsRefreshing(false);
    }, 600);
  };

  const handleOnlineSync = async () => {
    setIsSyncingApi(true);
    try {
      await marketPriceService.fetchOnlineCryptoRates();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingApi(false);
    }
  };

  const openCalibrateModal = () => {
    const map: Record<string, string> = {};
    livePrices.forEach(p => {
      map[p.id] = String(p.currentPriceToman);
    });
    setEditPriceMap(map);
    setShowCalibrateModal(true);
    setCalibrateSuccess(false);
  };

  const handleSaveCalibratedPrices = () => {
    livePrices.forEach(p => {
      const inputVal = editPriceMap[p.id];
      if (inputVal !== undefined) {
        const num = Number(fromPersianDigits(inputVal.replace(/,/g, '')));
        if (!isNaN(num) && num > 0) {
          marketPriceService.calibrateAssetPrice(p.id, num);
        }
      }
    });
    setCalibrateSuccess(true);
    setTimeout(() => {
      setShowCalibrateModal(false);
      setCalibrateSuccess(false);
    }, 1000);
  };

  const handleResetBenchmark = () => {
    marketPriceService.resetToDefaults();
    setShowCalibrateModal(false);
  };

  // Compute portfolio P&L
  const pnlSummary: PortfolioPnLSummary = useMemo(() => {
    return calculatePortfolioPnL(accounts, transactions, livePrices);
  }, [accounts, transactions, livePrices]);

  // Filter and Sort Holdings
  const displayHoldings = useMemo(() => {
    let list = pnlSummary.holdings;
    if (selectedFilter !== 'all') {
      list = list.filter(h => h.category === selectedFilter);
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'roi') return b.unrealizedRoiPercent - a.unrealizedRoiPercent;
      if (sortBy === 'pnl') return b.unrealizedPnLToman - a.unrealizedPnLToman;
      if (sortBy === 'value') return b.currentValueToman - a.currentValueToman;
      return 0;
    });
  }, [pnlSummary.holdings, selectedFilter, sortBy]);

  // Calculate Market Volatility Score
  const marketVolatilityStats = useMemo(() => {
    const goldChanges = livePrices.filter(p => p.category === 'gold').map(p => Math.abs(p.change24hPercent));
    const fxChanges = livePrices.filter(p => p.category === 'currency').map(p => Math.abs(p.change24hPercent));
    
    const avgGoldVol = goldChanges.length ? goldChanges.reduce((a, b) => a + b, 0) / goldChanges.length : 0;
    const avgFxVol = fxChanges.length ? fxChanges.reduce((a, b) => a + b, 0) / fxChanges.length : 0;
    const overallVol = (avgGoldVol + avgFxVol) / 2;

    let level: 'low' | 'moderate' | 'high' = 'moderate';
    let levelFa = 'متوسط';
    let levelColor = 'text-amber-500 bg-amber-500/10 border-amber-500/30';

    if (overallVol < 0.8) {
      level = 'low';
      levelFa = 'آرام و کم‌نوسان';
      levelColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    } else if (overallVol > 1.8) {
      level = 'high';
      levelFa = 'پرنوسان و حساس';
      levelColor = 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    }

    return {
      avgGoldVol: avgGoldVol.toFixed(2),
      avgFxVol: avgFxVol.toFixed(2),
      overallVol: overallVol.toFixed(2),
      level,
      levelFa,
      levelColor
    };
  }, [livePrices]);

  // Simulator calculation
  const simResult = useMemo(() => {
    const asset = livePrices.find(p => p.id === simAssetId) || livePrices[0];
    const qty = Number(fromPersianDigits(simQty.replace(/,/g, ''))) || 0;
    const buyPrice = Number(fromPersianDigits(simBuyPrice.replace(/,/g, ''))) || 0;
    const currentPrice = asset.currentPriceToman;

    const totalCost = qty * buyPrice;
    const totalVal = qty * currentPrice;
    const pnl = totalVal - totalCost;
    const roi = totalCost > 0 ? Number(((pnl / totalCost) * 100).toFixed(2)) : 0;

    return {
      asset,
      qty,
      buyPrice,
      currentPrice,
      totalCost,
      totalVal,
      pnl,
      roi,
      isProfit: pnl >= 0,
    };
  }, [simAssetId, simQty, simBuyPrice, livePrices]);

  // Handle logging a new asset purchase
  const handleSavePurchase = () => {
    const qty = Number(fromPersianDigits(purchaseQty.replace(/,/g, ''))) || 0;
    const unitPrice = Number(fromPersianDigits(purchaseUnitPrice.replace(/,/g, ''))) || 0;
    const totalSpent = qty * unitPrice;

    if (qty <= 0 || unitPrice <= 0) {
      alert(isFa ? 'لطفاً مقادیر معتبر وارد کنید.' : 'Please enter valid values.');
      return;
    }

    const selectedAsset = livePrices.find(p => p.id === purchaseAssetId);
    const assetName = selectedAsset ? (isFa ? selectedAsset.nameFa : selectedAsset.nameEn) : 'دارایی طلا/ارز';

    // Find or create account
    const existingAcc = accounts.find(a => 
      a.name.includes(assetName) || (selectedAsset?.category === 'gold' && a.type === 'gold')
    );
    const targetAccountId = existingAcc ? existingAcc.id : accounts[0]?.id || 'acc-1';

    addTransaction({
      amount: totalSpent,
      type: 'expense',
      categoryId: 'cat_invest',
      accountId: targetAccountId,
      date: new Date().toISOString().slice(0, 10),
      jalaliDate: '1405/06/01',
      description: `${purchaseNote || 'خرید دارایی'} - ${qty} ${selectedAsset?.unitFa || 'واحد'} ${assetName} (قیمت خرید: ${formatNumber(unitPrice)} تومان)`,
      tag: 'سرمایه‌گذاری',
    });

    setShowAddPurchaseModal(false);
    alert(isFa ? `خرید ${assetName} با موفقیت در تاریخچه مالی ثبت شد و سود/زیان بروزرسانی گردید.` : 'Asset purchase logged successfully.');
  };

  // Helper to render sparkline SVG
  const renderSparkline = (points: number[] = [], isUp: boolean) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 80;
    const height = 24;

    const coords = points.map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const strokeColor = isUp ? '#10b981' : '#f43f5e';
    const fillColor = isUp ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`grad-${isUp ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-6">
      {/* Top Banner: Volatility & Unrealized Gain/Loss Overview */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                    {isFa ? 'تحلیلگر نوسانات لحظه‌ای و درصد سود/زیان دارایی‌ها' : 'Live Volatility & Unrealized P&L Analytics'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>{isFa ? 'نرخ زنده بازار' : 'Live Ticker'}</span>
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {isFa 
                    ? 'محاسبه دقیق و مقایسه بهای خرید گذشته طلا، سکه، دلار، یورو و رمزارز با نرخ‌های لحظه‌ای روز جهت ارزیابی سود یا زیان تحقق‌نیافته و نوسانات بازار.'
                    : 'Real-time calculation comparing historical acquisition costs with live spot prices for gold, forex, and crypto.'}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => setShowAddPurchaseModal(true)}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isFa ? 'ثبت خرید جدید' : 'Log Asset Buy'}</span>
              </button>

              <button
                onClick={openCalibrateModal}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="تنظیم دستی نرخ‌های طلا و ارز"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isFa ? 'تنظیم دستی نرخ‌ها' : 'Calibrate'}</span>
              </button>

              <button
                onClick={handleOnlineSync}
                disabled={isSyncingApi}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="همگام‌سازی آنلاین قیمت‌ها با بازار جهانی"
              >
                <Globe className={`w-3.5 h-3.5 ${isSyncingApi ? 'animate-spin' : ''}`} />
                <span>{isFa ? 'همگام‌سازی آنلاین' : 'Sync'}</span>
              </button>

              <button
                onClick={() => setShowSimulator(!showSimulator)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                <span>{isFa ? (showSimulator ? 'بستن شبیه‌ساز' : 'شبیه‌ساز سود') : 'Simulator'}</span>
              </button>

              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="بروزرسانی نرخ‌ها"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total Portfolio Unrealized P&L */}
            <div className={`p-4 rounded-2xl border backdrop-blur-md ${
              pnlSummary.isNetProfit 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">
                  {isFa ? 'سود / زیان کل تحقق‌نیافته' : 'Net Unrealized P&L'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  pnlSummary.isNetProfit ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {pnlSummary.isNetProfit ? '+' : ''}{isFa ? toPersianDigits(pnlSummary.totalRoiPercent) : pnlSummary.totalRoiPercent}٪
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-2">
                {pnlSummary.isNetProfit ? '+' : ''}{formatCurrency(pnlSummary.totalUnrealizedPnLToman, currency, isFa)}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                {pnlSummary.isNetProfit ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span>
                  {isFa 
                    ? `بازدهی کل سبد طلا و ارز نسبت به بهای تمام‌شده` 
                    : `Total ROI based on acquisition cost`}
                </span>
              </div>
            </div>

            {/* KPI 2: Total Invested vs Current Valuation */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md text-white">
              <span className="text-xs font-bold text-slate-400 block">
                {isFa ? 'ارزش روز دارایی‌ها' : 'Current Market Value'}
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-400 mt-2">
                {formatCurrency(pnlSummary.totalCurrentValueToman, currency, isFa)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-700/60">
                <span>{isFa ? 'سرمایه اولیه خرید:' : 'Cost Basis:'}</span>
                <span className="font-bold text-slate-300">{formatCurrency(pnlSummary.totalInvestedToman, currency, isFa)}</span>
              </div>
            </div>

            {/* KPI 3: Market Volatility Index */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md text-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">
                  {isFa ? 'شاخص نوسان بازار (۲۴ساعته)' : '24h Market Volatility'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${marketVolatilityStats.levelColor}`}>
                  {isFa ? marketVolatilityStats.levelFa : marketVolatilityStats.level}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-2 flex items-baseline gap-1">
                <span>{isFa ? toPersianDigits(marketVolatilityStats.overallVol) : marketVolatilityStats.overallVol}٪</span>
                <span className="text-xs text-slate-400 font-normal">{isFa ? 'میانگین تغییر' : 'avg delta'}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between pt-2 border-t border-slate-700/60">
                <span>{isFa ? `طلا: ${toPersianDigits(marketVolatilityStats.avgGoldVol)}٪` : `Gold: ${marketVolatilityStats.avgGoldVol}%`}</span>
                <span>{isFa ? `ارز: ${toPersianDigits(marketVolatilityStats.avgFxVol)}٪` : `Forex: ${marketVolatilityStats.avgFxVol}%`}</span>
              </div>
            </div>

            {/* KPI 4: Top Performing Asset */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md text-white">
              <span className="text-xs font-bold text-slate-400 block">
                {isFa ? 'بیشترین سوددهی ثبت‌شده' : 'Top Performing Holding'}
              </span>
              <div className="text-base sm:text-lg font-black text-emerald-400 mt-2 truncate">
                {pnlSummary.topWinner ? pnlSummary.topWinner.assetNameFa : (isFa ? 'طلای ۱۸ عیار' : '18K Gold')}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-700/60">
                <span>{isFa ? 'درصد بازدهی:' : 'ROI:'}</span>
                <span className="font-black text-emerald-400">
                  +{pnlSummary.topWinner ? (isFa ? toPersianDigits(pnlSummary.topWinner.unrealizedRoiPercent) : pnlSummary.topWinner.unrealizedRoiPercent) : '۲۴.۸'}٪
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Simulator Bar (Collapsible) */}
      <AnimatePresence>
        {showSimulator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-amber-950/20 border border-amber-300 dark:border-amber-700/60 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {isFa ? 'شبیه‌ساز و محاسبه‌گر سود/زیان خرید فرضی' : 'Hypothetical Investment Gain/Loss Simulator'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isFa ? 'بررسی کنید اگر در تاریخی مشخص با قیمتی دلخواه خریده بودید، سود یا زیان شما امروز چقدر بود' : 'Simulate ROI based on custom buy price and current spot price'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSimulator(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {isFa ? 'بستن' : 'Close'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isFa ? 'نوع دارایی' : 'Asset'}
                  </label>
                  <select
                    value={simAssetId}
                    onChange={(e) => {
                      setSimAssetId(e.target.value);
                      const a = livePrices.find(p => p.id === e.target.value);
                      if (a) setSimBuyPrice(String(a.benchmarkPurchasePriceToman));
                    }}
                    className="w-full text-xs font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {livePrices.map(p => (
                      <option key={`sim-opt-${p.id}`} value={p.id}>
                        {isFa ? p.nameFa : p.nameEn} (قیمت فعلی: {formatNumber(p.currentPriceToman)} ت)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isFa ? `تعداد یا مقدار (${simResult.asset.unitFa})` : 'Quantity'}
                  </label>
                  <input
                    type="text"
                    value={simQty}
                    onChange={(e) => setSimQty(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isFa ? 'قیمت خرید هر واحد (تومان)' : 'Buy Price per Unit (Toman)'}
                  </label>
                  <input
                    type="text"
                    value={simBuyPrice}
                    onChange={(e) => setSimBuyPrice(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Simulation Result Box */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[11px] text-slate-400 block">{isFa ? 'سرمایه اولیه خرید:' : 'Total Invested:'}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatCurrency(simResult.totalCost, currency, isFa)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">{isFa ? 'ارزش روز لحظه‌ای:' : 'Current Value:'}</span>
                    <span className="text-sm font-bold text-amber-500">{formatCurrency(simResult.totalVal, currency, isFa)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">{isFa ? 'سود/زیان خالص:' : 'Net P&L:'}</span>
                    <span className={`text-base font-black ${simResult.isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {simResult.isProfit ? '+' : ''}{formatCurrency(simResult.pnl, currency, isFa)}
                    </span>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                    simResult.isProfit ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    {simResult.isProfit ? '+' : ''}{isFa ? toPersianDigits(simResult.roi) : simResult.roi}٪
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Sorting Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', labelFa: 'همه دارایی‌ها', labelEn: 'All Assets' },
            { id: 'gold', labelFa: 'طلا و مسکوکات', labelEn: 'Gold & Coins' },
            { id: 'currency', labelFa: 'ارزهای خارجی', labelEn: 'Currencies' },
            { id: 'crypto', labelFa: 'رمزارزها', labelEn: 'Crypto' },
          ].map(f => (
            <button
              key={`filter-${f.id}`}
              onClick={() => setSelectedFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === f.id
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isFa ? f.labelFa : f.labelEn}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-slate-400 font-medium">{isFa ? 'مرتب‌سازی بر اساس:' : 'Sort by:'}</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none"
          >
            <option value="roi">{isFa ? 'بیشترین درصد سود (ROI)' : 'Highest ROI %'}</option>
            <option value="pnl">{isFa ? 'بیشترین مبلغ سود (تومان)' : 'Highest Profit Amount'}</option>
            <option value="value">{isFa ? 'ارزش کل دارایی' : 'Total Market Value'}</option>
          </select>
        </div>
      </div>

      {/* Visual Status Cards Grid (کارتهای وضعیت بصری) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayHoldings.map((item) => {
          const isUp24h = item.unrealizedRoiPercent >= 0;
          const matchedLiveAsset = livePrices.find(p => p.id === item.assetId);
          const change24h = matchedLiveAsset ? matchedLiveAsset.change24hPercent : 1.2;
          const is24hPositive = change24h >= 0;

          // Performance Tier Badge
          let statusBadgeText = isFa ? 'سوددهی مطلوب' : 'Moderate Gain';
          let statusBadgeClass = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300';

          if (item.unrealizedRoiPercent >= 25) {
            statusBadgeText = isFa ? '🔥 سوددهی عالی (+۲۵٪)' : '🔥 High Return';
            statusBadgeClass = 'bg-emerald-600 text-white shadow-xs';
          } else if (item.unrealizedRoiPercent < 0) {
            statusBadgeText = isFa ? 'زیان فرضی' : 'Unrealized Loss';
            statusBadgeClass = 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300';
          } else if (item.unrealizedRoiPercent < 5) {
            statusBadgeText = isFa ? 'نزدیک به سربه‌سر' : 'Near Break-even';
            statusBadgeClass = 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300';
          }

          return (
            <div
              key={`holding-card-${item.id}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group"
            >
              {/* Card Top: Asset Header & 24h Ticker */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black shadow-xs shrink-0">
                      {item.category === 'gold' ? (
                        <Coins className="w-6 h-6" />
                      ) : item.category === 'crypto' ? (
                        <Bitcoin className="w-6 h-6" />
                      ) : (
                        <DollarSign className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          {item.assetNameFa}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                          {item.assetSymbol}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {isFa ? `موجودی: ${toPersianDigits(item.quantity)} ${item.unitFa}` : `Holdings: ${item.quantity} ${item.unitFa}`}
                      </span>
                    </div>
                  </div>

                  {/* Profit / Loss Tag */}
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${statusBadgeClass}`}>
                    {statusBadgeText}
                  </span>
                </div>

                {/* Price Comparison Row: Cost Basis vs Spot Rate */}
                <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      {isFa ? 'میانگین قیمت خرید:' : 'Avg Buy Price:'}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {formatCurrency(item.avgPurchasePriceToman, currency, isFa)}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {isFa ? 'نرخ لحظه‌ای بازار:' : 'Live Spot Rate:'}
                      </span>
                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                        is24hPositive ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {is24hPositive ? '+' : ''}{isFa ? toPersianDigits(change24h) : change24h}٪
                      </span>
                    </div>
                    <span className="font-black text-amber-600 dark:text-amber-400">
                      {formatCurrency(item.currentPriceToman, currency, isFa)}
                    </span>
                  </div>
                </div>

                {/* Visual Progress & P&L Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {isFa ? 'رشد ارزش نسبت به خرید:' : 'Valuation Growth:'}
                    </span>
                    <span className={`font-black ${item.isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {item.isProfit ? '+' : ''}{isFa ? toPersianDigits(item.unrealizedRoiPercent) : item.unrealizedRoiPercent}٪
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.isProfit 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                          : 'bg-gradient-to-r from-rose-500 to-red-600'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(15, Math.abs(item.unrealizedRoiPercent) * 2))}%` }}
                    />
                  </div>
                </div>

                {/* Financial Totals: Total Invested vs Current Valuation */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isFa ? 'کل بهای خرید:' : 'Total Cost:'}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {formatCurrency(item.totalInvestedToman, currency, isFa)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">{isFa ? 'سود/زیان خالص:' : 'Net Gain/Loss:'}</span>
                    <span className={`font-black text-sm ${item.isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {item.isProfit ? '+' : ''}{formatCurrency(item.unrealizedPnLToman, currency, isFa)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Recommendation & Trend Sparkline */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-[11px] font-medium truncate max-w-[180px]">
                    {item.recommendationFa}
                  </span>
                </div>

                {matchedLiveAsset?.history7d && (
                  <div className="shrink-0" title="روند ۷ روزه نرخ بازار">
                    {renderSparkline(matchedLiveAsset.history7d, is24hPositive)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Buy Logger Modal */}
      <AnimatePresence>
        {showAddPurchaseModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {isFa ? 'ثبت خرید دارایی طلا / ارز' : 'Record Gold or Forex Purchase'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isFa ? 'قیمت خرید را وارد کنید تا سود یا زیان شما با نرخ لحظه‌ای روز محاسبه شود' : 'Logs cost basis for real-time ROI tracking'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddPurchaseModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isFa ? 'نوع دارایی' : 'Asset Type'}
                  </label>
                  <select
                    value={purchaseAssetId}
                    onChange={(e) => {
                      setPurchaseAssetId(e.target.value);
                      const a = livePrices.find(p => p.id === e.target.value);
                      if (a) setPurchaseUnitPrice(String(a.currentPriceToman));
                    }}
                    className="w-full text-xs font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {livePrices.map(p => (
                      <option key={`buy-opt-${p.id}`} value={p.id}>
                        {isFa ? p.nameFa : p.nameEn} ({formatNumber(p.currentPriceToman)} ت)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {isFa ? 'مقدار یا تعداد' : 'Quantity'}
                    </label>
                    <input
                      type="text"
                      value={purchaseQty}
                      onChange={(e) => setPurchaseQty(e.target.value)}
                      placeholder="مثلاً ۱۰"
                      className="w-full text-xs font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {isFa ? 'قیمت واحد خرید (تومان)' : 'Unit Buy Price (Toman)'}
                    </label>
                    <input
                      type="text"
                      value={purchaseUnitPrice}
                      onChange={(e) => setPurchaseUnitPrice(e.target.value)}
                      placeholder="مثلاً ۴۸۵۰۰۰۰"
                      className="w-full text-xs font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isFa ? 'توضیحات و بابت' : 'Notes'}
                  </label>
                  <input
                    type="text"
                    value={purchaseNote}
                    onChange={(e) => setPurchaseNote(e.target.value)}
                    placeholder="مثلاً خرید طلای آبشده از طلافروشی..."
                    className="w-full text-xs font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between text-xs">
                  <span className="text-amber-800 dark:text-amber-300 font-bold">
                    {isFa ? 'مجموع مبلغ خرید:' : 'Total Cost Basis:'}
                  </span>
                  <span className="font-black text-amber-900 dark:text-amber-200 text-sm">
                    {formatCurrency(
                      (Number(fromPersianDigits(purchaseQty.replace(/,/g, ''))) || 0) * 
                      (Number(fromPersianDigits(purchaseUnitPrice.replace(/,/g, ''))) || 0),
                      currency,
                      isFa
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowAddPurchaseModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  {isFa ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  onClick={handleSavePurchase}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {isFa ? 'ثبت و محاسبه بازدهی' : 'Save & Calculate P&L'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Price Calibration Modal */}
      <AnimatePresence>
        {showCalibrateModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {isFa ? 'تنظیم و کالیبراسیون دستی نرخ‌های روز بازار' : 'Market Rate Calibration'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isFa ? 'می‌توانید نرخ‌های خرید/فروش طلا، دلار، سکه یا ارزها را طبق مظنه دقیق صرافی یا طلافروشی خود تنظیم کنید.' : 'Calibrate spot prices according to your local dealer quotes.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCalibrateModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {calibrateSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{isFa ? 'نرخ‌ها با موفقیت بروزرسانی و بازمحاسبه شدند.' : 'Rates calibrated successfully.'}</span>
                </div>
              )}

              {/* Scrollable list of items */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {livePrices.map(item => (
                    <div key={`calib-${item.id}`} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{isFa ? item.nameFa : item.nameEn}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.symbol}</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={editPriceMap[item.id] !== undefined ? editPriceMap[item.id] : String(item.currentPriceToman)}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditPriceMap(prev => ({ ...prev, [item.id]: val }));
                          }}
                          className="w-full text-xs font-bold py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                          {isFa ? 'تومان' : 'TMN'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleResetBenchmark}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isFa ? 'بازنشانی به نرخ‌های مرجع روز' : 'Reset to Benchmark'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCalibrateModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    {isFa ? 'انصراف' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleSaveCalibratedPrices}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    {isFa ? 'ذخیره و اعمال در سبد' : 'Save & Recalculate'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
