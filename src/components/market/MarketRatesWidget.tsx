import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { MarketItem, INITIAL_MARKET_RATES } from '../../data/marketRates';
import { marketPriceService, LiveAssetPrice } from '../../services/marketPriceService';
import { formatCurrency, formatNumber, fromPersianDigits, toPersianDigits } from '../../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Search, 
  Coins, 
  DollarSign, 
  Bitcoin, 
  BarChart2, 
  ArrowRightLeft,
  Flame,
  Sparkles,
  Info,
  Clock,
  Layers,
  ChevronRight,
  Calculator,
  SlidersHorizontal,
  Check,
  RotateCcw,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MarketRatesWidgetProps {
  isCompact?: boolean;
}

export const MarketRatesWidget: React.FC<MarketRatesWidgetProps> = ({ isCompact = false }) => {
  const { language, currency } = useFinance();
  const isFa = language === 'fa';

  const [rates, setRates] = useState<MarketItem[]>(INITIAL_MARKET_RATES);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'gold_coin' | 'currency' | 'crypto' | 'stock_macro'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Rate Calibration Modal
  const [showCalibrateModal, setShowCalibrateModal] = useState(false);
  const [editPriceMap, setEditPriceMap] = useState<Record<string, string>>({});
  const [calibrateSuccess, setCalibrateSuccess] = useState(false);

  // Converter state
  const [converterItem, setConverterItem] = useState<string>('gold_18k');
  const [converterAmount, setConverterAmount] = useState<string>('10');

  // Load custom prices from localStorage if any
  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartfinance_calibrated_asset_prices');
      if (saved) {
        const customMap: Record<string, { price: number; change?: number }> = JSON.parse(saved);
        setRates(prev => prev.map(item => {
          // match by id or short symbol
          const matchingCustom = customMap[item.id] || customMap[item.symbol.toLowerCase()] || customMap[item.id.replace('curr_', '').replace('crypto_', '').replace('stock_', '')];
          if (matchingCustom) {
            return {
              ...item,
              priceToman: matchingCustom.price,
              change24h: matchingCustom.change !== undefined ? matchingCustom.change : item.change24h,
            };
          }
          return item;
        }));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Simulate periodic or manual live ticks
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRates(prev => prev.map(item => {
        // Random micro tick between -0.2% and +0.2%
        const deltaFactor = 1 + (Math.random() * 0.004 - 0.002);
        const newPrice = Math.round(item.priceToman * deltaFactor);
        const changeDelta = (Math.random() * 0.2 - 0.1);
        const newChange = Number((item.change24h + changeDelta).toFixed(2));
        
        const lastSpark = item.sparkline[item.sparkline.length - 1];
        const newSparkVal = Number((lastSpark * deltaFactor).toFixed(1));
        const updatedSparkline = [...item.sparkline.slice(1), newSparkVal];

        return {
          ...item,
          priceToman: newPrice,
          change24h: newChange,
          sparkline: updatedSparkline,
        };
      }));
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 600);
  };

  // Online API Live Sync for Crypto and Currencies
  const handleOnlineSync = async () => {
    setIsSyncingApi(true);
    try {
      await marketPriceService.fetchOnlineCryptoRates();
      const updatedServicePrices = marketPriceService.getPrices();
      
      setRates(prev => prev.map(item => {
        const svcItem = updatedServicePrices.find(p => p.id === item.id || item.id.includes(p.id) || p.id.includes(item.id));
        if (svcItem) {
          return {
            ...item,
            priceToman: svcItem.currentPriceToman,
            change24h: svcItem.change24hPercent,
          };
        }
        return item;
      }));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('API sync error', err);
    } finally {
      setIsSyncingApi(false);
    }
  };

  // Open calibration modal
  const openCalibrateModal = () => {
    const map: Record<string, string> = {};
    rates.forEach(r => {
      map[r.id] = String(r.priceToman);
    });
    setEditPriceMap(map);
    setShowCalibrateModal(true);
    setCalibrateSuccess(false);
  };

  // Save manual calibrated prices
  const handleSaveCalibratedPrices = () => {
    const customMap: Record<string, { price: number; change?: number }> = {};

    const updatedRates = rates.map(r => {
      const inputVal = editPriceMap[r.id];
      if (inputVal !== undefined) {
        const numPrice = Number(fromPersianDigits(inputVal.replace(/,/g, '')));
        if (!isNaN(numPrice) && numPrice > 0) {
          customMap[r.id] = { price: numPrice, change: r.change24h };
          // also update in marketPriceService
          marketPriceService.calibrateAssetPrice(r.id.replace('curr_', '').replace('crypto_', '').replace('stock_', ''), numPrice, r.change24h);
          return {
            ...r,
            priceToman: numPrice,
          };
        }
      }
      return r;
    });

    setRates(updatedRates);
    localStorage.setItem('smartfinance_calibrated_asset_prices', JSON.stringify(customMap));
    setCalibrateSuccess(true);
    setTimeout(() => {
      setShowCalibrateModal(false);
      setCalibrateSuccess(false);
    }, 1000);
  };

  // Reset to accurate market benchmark rates
  const handleResetBenchmark = () => {
    setRates(INITIAL_MARKET_RATES);
    marketPriceService.resetToDefaults();
    localStorage.removeItem('smartfinance_calibrated_asset_prices');
    setShowCalibrateModal(false);
  };

  const filteredRates = useMemo(() => {
    return rates.filter(item => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchQuery = !searchQuery.trim() || 
        item.nameFa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [rates, selectedCategory, searchQuery]);

  // Converter calculation
  const selectedConvertRate = useMemo(() => {
    return rates.find(r => r.id === converterItem) || rates[0];
  }, [rates, converterItem]);

  const convertedTotalToman = useMemo(() => {
    const qty = Number(fromPersianDigits(converterAmount.replace(/,/g, ''))) || 0;
    return qty * (selectedConvertRate?.priceToman || 0);
  }, [converterAmount, selectedConvertRate]);

  // Mini Sparkline SVG Renderer
  const renderSparkline = (points: number[], isPositive: boolean) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 64;
    const height = 24;

    const coords = points.map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    }).join(' ');

    const strokeColor = isPositive ? '#10b981' : '#f43f5e';

    return (
      <svg width={width} height={height} className="overflow-visible">
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
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header with Title, Live Badge, and Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isFa ? 'تابلوی نرخ لحظه‌ای بازار (طلا، ارز، رمزارز و بورس)' : 'Live Market Rates (Gold, Forex, Crypto & Stocks)'}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>{isFa ? 'زنده' : 'Live'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{isFa ? `آخرین استعلام و تسویه: ${toPersianDigits(lastUpdated.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))}` : `Updated: ${lastUpdated.toLocaleTimeString()}`}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            onClick={openCalibrateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="تنظیم دستی قیمت‌ها"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isFa ? 'تنظیم دستی نرخ‌ها' : 'Calibrate Rates'}</span>
          </button>

          <button
            onClick={handleOnlineSync}
            disabled={isSyncingApi}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="همگام‌سازی زنده رمزارز و ارز با API جهانی"
          >
            <Globe className={`w-3.5 h-3.5 ${isSyncingApi ? 'animate-spin' : ''}`} />
            <span>{isFa ? 'همگام‌سازی آنلاین' : 'Sync Online'}</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isFa ? 'بروزرسانی' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Quick Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pill Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          {[
            { id: 'all', labelFa: 'همه بازارها', labelEn: 'All Markets', icon: Layers },
            { id: 'gold_coin', labelFa: 'طلا و مسکوکات', labelEn: 'Gold & Coins', icon: Coins },
            { id: 'currency', labelFa: 'ارزهای جهانی', labelEn: 'Currencies', icon: DollarSign },
            { id: 'crypto', labelFa: 'رمزارزها', labelEn: 'Crypto', icon: Bitcoin },
            { id: 'stock_macro', labelFa: 'بورس و شاخص', labelEn: 'Stocks & Macro', icon: BarChart2 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={`mkt-tab-${tab.id}`}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{isFa ? tab.labelFa : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isFa ? 'جستجوی نماد، طلا، سکه یا ارز...' : 'Search rates...'}
            className="w-full text-xs py-2 px-9 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Rates Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {filteredRates.map((item) => {
          const isPositive = item.change24h >= 0;

          return (
            <div
              key={`mkt-rate-${item.id}`}
              className="bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 hover:border-blue-300 dark:hover:border-blue-800 rounded-2xl p-4 transition-all duration-200 shadow-xs group"
            >
              {/* Top Row: Symbol, Name and Change Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${item.iconBg} text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0`}>
                    {item.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {isFa ? item.nameFa : item.nameEn}
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {item.symbol} • {isFa ? item.unitFa : item.unitEn}
                    </span>
                  </div>
                </div>

                <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
                  isPositive
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{isFa ? toPersianDigits(Math.abs(item.change24h)) : Math.abs(item.change24h)}٪</span>
                </div>
              </div>

              {/* Price Row & Sparkline */}
              <div className="flex items-end justify-between mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{isFa ? 'قیمت فعلی' : 'Price'}</span>
                  <div className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                    {formatNumber(item.priceToman, isFa)}
                    <span className="text-[10px] text-slate-500 font-normal mr-1">{isFa ? 'تومان' : 'TMN'}</span>
                  </div>
                  {item.priceUsd && (
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">
                      ≈ ${formatNumber(item.priceUsd, false)}
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end">
                  {renderSparkline(item.sparkline, isPositive)}
                  <span className="text-[9px] text-slate-400 mt-1">{isFa ? 'روند ۲۴ ساعت' : '24h trend'}</span>
                </div>
              </div>

              {/* Coin Bubble Metric if available */}
              {item.bubbleToman && (
                <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{isFa ? 'حباب سکه:' : 'Bubble:'}</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                    {formatNumber(item.bubbleToman, isFa)} {isFa ? 'تومان' : 'TMN'} ({isFa ? toPersianDigits(item.bubblePercent || 0) : item.bubblePercent}٪)
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Market Quick Converter Calculator */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-indigo-900/50 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-sm sm:text-base text-white">
                {isFa ? 'ماشین‌حساب و مبدل زنده طلا، ارز و مسکوکات' : 'Live Gold & Currency Converter'}
              </h4>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {isFa ? 'محاسبه سریع ارزش دارایی یا تبدیل مقدار طلا، سکه و ارز به تومان با نرخ لحظه‌ای' : 'Convert real-time gold grams, coins, or currencies to Toman instantly'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {/* Amount input */}
            <div className="flex-1 sm:w-32">
              <label className="text-[10px] text-indigo-200 block mb-1">{isFa ? 'تعداد / مقدار:' : 'Quantity:'}</label>
              <input
                type="text"
                value={converterAmount}
                onChange={(e) => setConverterAmount(e.target.value)}
                className="w-full text-sm font-bold py-2 px-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:border-indigo-400"
              />
            </div>

            {/* Asset selector */}
            <div className="flex-1 sm:w-48">
              <label className="text-[10px] text-indigo-200 block mb-1">{isFa ? 'نوع دارایی:' : 'Asset Type:'}</label>
              <select
                value={converterItem}
                onChange={(e) => setConverterItem(e.target.value)}
                className="w-full text-xs font-bold py-2 px-3 rounded-xl bg-slate-800 border border-white/20 text-white focus:outline-none focus:border-indigo-400"
              >
                {rates.map(r => (
                  <option key={`conv-opt-${r.id}`} value={r.id}>
                    {isFa ? r.nameFa : r.nameEn} ({r.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Result display */}
            <div className="bg-indigo-600/30 border border-indigo-400/40 rounded-2xl p-2.5 px-4 shrink-0">
              <span className="text-[10px] text-indigo-200 block">{isFa ? 'ارزش معادل ریالی:' : 'Equivalent Value:'}</span>
              <div className="text-base sm:text-lg font-black text-amber-300 tracking-tight">
                {formatNumber(convertedTotalToman, isFa)}
                <span className="text-xs text-white font-normal mr-1">{isFa ? 'تومان' : 'TMN'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                      {isFa ? 'تنظیم و کالیبراسیون دستی قیمت‌ها' : 'Manual Market Rate Calibration'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isFa ? 'می‌توانید نرخ‌های خرید/فروش طلا، دلار، سکه یا ارزها را طبق مظنه دقیق صرافی یا طلافروشی خود تنظیم کنید.' : 'Calibrate asset spot prices according to your local exchange or jeweler.'}
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
                  <span>{isFa ? 'نرخ‌ها با موفقیت بروزرسانی و ذخیره شدند.' : 'Rates calibrated and saved successfully.'}</span>
                </div>
              )}

              {/* Scrollable list of items */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rates.map(item => (
                    <div key={`calib-${item.id}`} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{isFa ? item.nameFa : item.nameEn}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.symbol}</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={editPriceMap[item.id] !== undefined ? editPriceMap[item.id] : String(item.priceToman)}
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
                  <span>{isFa ? 'بازنشانی به نرخ‌های پیش‌فرض روز' : 'Reset to Defaults'}</span>
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
                    {isFa ? 'ذخیره نرخ‌های جدید' : 'Save Rates'}
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
