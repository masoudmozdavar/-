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
  BadgePercent
} from 'lucide-react';

interface UnrealizedPnLWidgetProps {
  isCompact?: boolean;
}

export const UnrealizedPnLWidget: React.FC<UnrealizedPnLWidgetProps> = ({ isCompact = false }) => {
  const { accounts, transactions, currency, language, setActiveTab } = useFinance();
  const isFa = language === 'fa';

  const [livePrices, setLivePrices] = useState<LiveAssetPrice[]>(marketPriceService.getPrices());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'gold' | 'currency' | 'crypto' | 'stock'>('all');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toLocaleTimeString('fa-IR'));

  // Custom simulator modal/drawer
  const [showSimulator, setShowSimulator] = useState(false);
  const [simAssetId, setSimAssetId] = useState('gold_18k');
  const [simQty, setSimQty] = useState('20');
  const [simBuyPrice, setSimBuyPrice] = useState('4200000');

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

  // Compute portfolio P&L
  const pnlSummary: PortfolioPnLSummary = useMemo(() => {
    return calculatePortfolioPnL(accounts, transactions, livePrices);
  }, [accounts, transactions, livePrices]);

  const filteredHoldings = useMemo(() => {
    if (selectedFilter === 'all') return pnlSummary.holdings;
    return pnlSummary.holdings.filter(h => h.category === selectedFilter);
  }, [pnlSummary.holdings, selectedFilter]);

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

  return (
    <div className="card-pro p-5 sm:p-6 bg-gradient-to-br from-white via-slate-50 to-amber-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
      {/* Header Bar with Live Price Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                {isFa ? 'پایش سود و زیان فرضی دارایی‌ها (طلا، ارز، رمزارز)' : 'Unrealized P&L & Investment Gain/Loss Tracker'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isFa ? 'قیمت زنده بازار' : 'Live Spot Rate'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isFa ? 'مقایسه هوشمند بهای خرید گذشته دارایی‌ها با نرخ لحظه‌ای بازار طلا و ارز برای محاسبه سود یا زیان تحقق‌نیافته' : 'Calculates real-time unrealized capital gains/losses based on acquisition cost'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-500" />
            <span>{isFa ? (showSimulator ? 'بستن شبیه‌ساز' : 'شبیه‌ساز سود') : 'Simulator'}</span>
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="بروزرسانی نرخ‌های لحظه‌ای بازار"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isFa ? 'بروزرسانی نرخ‌ها' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Aggregate Portfolio P&L Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Unrealized P&L */}
        <div className={`p-4 rounded-2xl border transition-all ${
          pnlSummary.isNetProfit 
            ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-300/80 dark:border-emerald-800/60' 
            : 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border-rose-300/80 dark:border-rose-800/60'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="font-semibold">{isFa ? 'کل سود / زیان فرضی پورتفوی:' : 'Total Unrealized P&L:'}</span>
            {pnlSummary.isNetProfit ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <div className={`text-xl sm:text-2xl font-black ${
            pnlSummary.isNetProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {pnlSummary.isNetProfit ? '+' : ''}{formatCurrency(pnlSummary.totalUnrealizedPnLToman, currency, isFa)}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
              pnlSummary.isNetProfit ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}>
              {pnlSummary.isNetProfit ? '+' : ''}{isFa ? toPersianDigits(pnlSummary.totalRoiPercent) : pnlSummary.totalRoiPercent}٪ بازدهی
            </span>
            <span className="text-[10px] text-slate-400">{isFa ? 'نسبت به بهای تمام‌شده' : 'ROI'}</span>
          </div>
        </div>

        {/* Total Cost Basis vs Current Value */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="font-semibold">{isFa ? 'ارزش روز دارایی‌ها:' : 'Current Spot Value:'}</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(pnlSummary.totalCurrentValueToman, currency, isFa)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
            <span>{isFa ? 'مجموع بهای خرید:' : 'Invested:'}</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {formatCurrency(pnlSummary.totalInvestedToman, currency, isFa)}
            </span>
          </div>
        </div>

        {/* Gold & Coin P&L */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50">
          <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 mb-1.5">
            <span className="font-semibold">{isFa ? 'سود دارایی‌های طلا و سکه:' : 'Gold & Coins P&L:'}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
              طلا
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            +{formatCurrency(pnlSummary.goldPnLToman, currency, isFa)}
          </div>
          <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1.5">
            {isFa ? `ارزش روز: ${formatCurrency(pnlSummary.goldCurrentValueToman, currency, isFa)}` : 'Gold asset value'}
          </div>
        </div>

        {/* Currency & Crypto P&L */}
        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50">
          <div className="flex items-center justify-between text-xs text-blue-800 dark:text-blue-300 mb-1.5">
            <span className="font-semibold">{isFa ? 'سود ارز و رمزارز (دلار/تتر):' : 'Forex & Crypto P&L:'}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-200/80 dark:bg-blue-900/80 text-blue-900 dark:text-blue-200">
              ارز
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
            +{formatCurrency(pnlSummary.currencyPnLToman + pnlSummary.cryptoPnLToman, currency, isFa)}
          </div>
          <div className="text-[11px] text-blue-700/80 dark:text-blue-400/80 mt-1.5">
            {isFa ? `ارزش روز: ${formatCurrency(pnlSummary.currencyCurrentValueToman + pnlSummary.cryptoCurrentValueToman, currency, isFa)}` : 'Foreign currency & crypto'}
          </div>
        </div>
      </div>

      {/* Simulator Drawer (Collapsible) */}
      {showSimulator && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-white to-amber-50/40 dark:from-slate-800/90 dark:via-slate-900 dark:to-slate-800/90 border border-indigo-200 dark:border-indigo-800/60 shadow-md animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {isFa ? 'شبیه‌ساز آنلاین سود / ضرر فرضی دارایی شخصی' : 'Custom Asset Profit/Loss Simulator'}
              </h4>
            </div>
            <span className="text-xs text-slate-400">
              {isFa ? `آخرین بروزرسانی نرخ: ${toPersianDigits(lastRefreshedAt)}` : lastRefreshedAt}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                {isFa ? 'انتخاب دارایی:' : 'Select Asset:'}
              </label>
              <select
                value={simAssetId}
                onChange={(e) => {
                  const sel = livePrices.find(p => p.id === e.target.value);
                  setSimAssetId(e.target.value);
                  if (sel) {
                    setSimBuyPrice(sel.benchmarkPurchasePriceToman.toString());
                  }
                }}
                className="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                {livePrices.map(p => (
                  <option key={`sim-opt-${p.id}`} value={p.id}>
                    {p.nameFa} ({p.symbol}) - نرخ روز: {formatCurrency(p.currentPriceToman, currency, false)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                {isFa ? `مقدار / تعداد (${simResult.asset.unitFa}):` : 'Quantity:'}
              </label>
              <input
                type="text"
                value={simQty}
                onChange={(e) => setSimQty(e.target.value)}
                placeholder="مثلاً: 25.5"
                className="w-full text-xs font-bold py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                {isFa ? 'قیمت خرید واحد در گذشته (تومان):' : 'Historical Buy Price (Toman):'}
              </label>
              <input
                type="text"
                value={simBuyPrice}
                onChange={(e) => setSimBuyPrice(e.target.value)}
                placeholder="مثلاً: 4,200,000"
                className="w-full text-xs font-bold py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Simulation Output Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-indigo-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block">{isFa ? 'کل بهای خرید اولیه:' : 'Total Cost:'}</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {formatCurrency(simResult.totalCost, currency, isFa)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">{isFa ? 'ارزش فعلی به نرخ بازار:' : 'Current Market Value:'}</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {formatCurrency(simResult.totalVal, currency, isFa)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">{isFa ? 'میزان سود / زیان فرضی:' : 'Unrealized P&L:'}</span>
              <span className={`font-black text-sm ${simResult.isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                {simResult.isProfit ? '+' : ''}{formatCurrency(simResult.pnl, currency, isFa)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">{isFa ? 'درصد بازدهی (ROI):' : 'ROI:'}</span>
              <span className={`font-black text-sm px-2 py-0.5 rounded-lg inline-block text-white ${simResult.isProfit ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                {simResult.isProfit ? '+' : ''}{isFa ? toPersianDigits(simResult.roi) : simResult.roi}٪
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {isFa ? `همه دارایی‌ها (${toPersianDigits(pnlSummary.holdings.length)})` : 'All'}
          </button>
          <button
            onClick={() => setSelectedFilter('gold')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'gold'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {isFa ? 'طلا و سکه' : 'Gold & Coins'}
          </button>
          <button
            onClick={() => setSelectedFilter('currency')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'currency'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {isFa ? 'ارزهای خارجی' : 'Forex'}
          </button>
          <button
            onClick={() => setSelectedFilter('crypto')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'crypto'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {isFa ? 'تتر و رمزارز' : 'Crypto'}
          </button>
        </div>

        <span className="text-xs text-slate-400">
          {isFa ? `آخرین بروزرسانی بازار: ${toPersianDigits(lastRefreshedAt)}` : `Updated ${lastRefreshedAt}`}
        </span>
      </div>

      {/* Asset Holdings Breakdown Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredHoldings.map((h) => {
          const isProfitable = h.isProfit;

          return (
            <div
              key={h.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-3.5"
            >
              {/* Asset Title & Badges */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0 ${
                    h.category === 'gold' 
                      ? 'bg-gradient-to-br from-amber-500 to-yellow-600'
                      : h.category === 'currency'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                  }`}>
                    {h.category === 'gold' ? <Coins className="w-5 h-5" /> : h.category === 'currency' ? <DollarSign className="w-5 h-5" /> : <Bitcoin className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                        {h.assetNameFa}
                      </h4>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {h.assetSymbol}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                      {isFa ? `موجودی پایش‌شده: ${toPersianDigits(h.quantity)} ${h.unitFa}` : `Holding: ${h.quantity} ${h.unitFa}`}
                    </span>
                  </div>
                </div>

                {/* ROI Badge */}
                <div className="text-right rtl:text-right ltr:text-left shrink-0">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl text-white shadow-xs inline-flex items-center gap-1 ${
                    isProfitable ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}>
                    {isProfitable ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{isProfitable ? '+' : ''}{isFa ? toPersianDigits(h.unrealizedRoiPercent) : h.unrealizedRoiPercent}٪</span>
                  </span>
                </div>
              </div>

              {/* Price & Valuation Metrics Comparison */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">{isFa ? 'بهای خرید میانگین واحد:' : 'Avg Buy Price:'}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {formatCurrency(h.avgPurchasePriceToman, currency, isFa)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">{isFa ? 'نرخ لحظه‌ای روز بازار:' : 'Live Spot Price:'}</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">
                    {formatCurrency(h.currentPriceToman, currency, isFa)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">{isFa ? 'کل بهای تمام‌شده خرید:' : 'Total Invested:'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(h.totalInvestedToman, currency, isFa)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">{isFa ? 'ارزش روز کل موجودی:' : 'Current Value:'}</span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {formatCurrency(h.currentValueToman, currency, isFa)}
                  </span>
                </div>
              </div>

              {/* Unrealized Gain Amount Highlight */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  {isFa ? 'سود فرضی تحقق‌نیافته:' : 'Unrealized Gain:'}
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(h.unrealizedPnLToman, currency, isFa)}
                </span>
              </div>

              {/* AI Strategy & Recommendation */}
              <div className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/60 p-2.5 rounded-xl">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{h.recommendationFa}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
