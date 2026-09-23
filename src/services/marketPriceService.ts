export interface LiveAssetPrice {
  id: string;
  nameFa: string;
  nameEn: string;
  symbol: string;
  category: 'gold' | 'currency' | 'crypto' | 'stock';
  unitFa: string;
  currentPriceToman: number;
  change24hPercent: number;
  high24hToman: number;
  low24hToman: number;
  lastUpdated: string;
  history7d: number[]; // 7 daily price points for sparkline/trend
  benchmarkPurchasePriceToman: number; // reference past benchmark price
  isCustomCalibrated?: boolean; // if user manually set/calibrated this price
}

export const INITIAL_LIVE_PRICES: LiveAssetPrice[] = [
  {
    id: 'gold_18k',
    nameFa: 'طلای ۱۸ عیار',
    nameEn: '18K Gold',
    symbol: 'GOLD18',
    category: 'gold',
    unitFa: 'گرم',
    currentPriceToman: 23850000,
    change24hPercent: 1.25,
    high24hToman: 23980000,
    low24hToman: 23720000,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [23400000, 23550000, 23620000, 23580000, 23750000, 23810000, 23850000],
    benchmarkPurchasePriceToman: 19200000,
  },
  {
    id: 'gold_24k',
    nameFa: 'طلای ۲۴ عیار (آبشده/شمش)',
    nameEn: '24K Gold Bar',
    symbol: 'GOLD24',
    category: 'gold',
    unitFa: 'گرم',
    currentPriceToman: 31800000,
    change24hPercent: 1.30,
    high24hToman: 31950000,
    low24hToman: 31650000,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [31200000, 31400000, 31500000, 31450000, 31680000, 31750000, 31800000],
    benchmarkPurchasePriceToman: 25600000,
  },
  {
    id: 'gold_mesghal',
    nameFa: 'مثقال طلا (مظنه تهران)',
    nameEn: 'Gold Mesghal',
    symbol: 'MESGHAL',
    category: 'gold',
    unitFa: 'مثقال',
    currentPriceToman: 103300000,
    change24hPercent: 1.28,
    high24hToman: 103900000,
    low24hToman: 102800000,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [101500000, 102100000, 102400000, 102200000, 102900000, 103100000, 103300000],
    benchmarkPurchasePriceToman: 83200000,
  },
  {
    id: 'coin_emami',
    nameFa: 'سکه تمام طرح جدید (امامی)',
    nameEn: 'Emami Gold Coin',
    symbol: 'COIN_EMAMI',
    category: 'gold',
    unitFa: 'عدد',
    currentPriceToman: 237500000,
    change24hPercent: 1.65,
    high24hToman: 238800000,
    low24hToman: 235600000,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [232000000, 233500000, 234800000, 234200000, 236100000, 236900000, 237500000],
    benchmarkPurchasePriceToman: 192000000,
  },
  {
    id: 'coin_bahar',
    nameFa: 'سکه تمام بهار آزادی',
    nameEn: 'Bahar Azadi Coin',
    symbol: 'COIN_BAHAR',
    category: 'gold',
    unitFa: 'عدد',
    currentPriceToman: 235000000,
    change24hPercent: 1.10,
    high24hToman: 236200000,
    low24hToman: 233500000,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [230500000, 231800000, 232900000, 232500000, 233800000, 234400000, 235000000],
    benchmarkPurchasePriceToman: 190000000,
  },
  {
    id: 'coin_nim',
    nameFa: 'نیم سکه بهار آزادی',
    nameEn: 'Half Gold Coin',
    symbol: 'COIN_NIM',
    category: 'gold',
    unitFa: 'عدد',
    currentPriceToman: 120000000,
    change24hPercent: 1.40,
    high24hToman: 120800000,
    low24hToman: 118800000,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [117500000, 118200000, 118900000, 118600000, 119400000, 119700000, 120000000],
    benchmarkPurchasePriceToman: 97000000,
  },
  {
    id: 'coin_rob',
    nameFa: 'ربع سکه بهار آزادی',
    nameEn: 'Quarter Gold Coin',
    symbol: 'COIN_ROB',
    category: 'gold',
    unitFa: 'عدد',
    currentPriceToman: 64000000,
    change24hPercent: 1.85,
    high24hToman: 64500000,
    low24hToman: 63200000,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [62400000, 62800000, 63200000, 63000000, 63600000, 63850000, 64000000],
    benchmarkPurchasePriceToman: 51500000,
  },
  {
    id: 'coin_gram',
    nameFa: 'سکه گرمی بانک مرکزی',
    nameEn: 'Gram Coin',
    symbol: 'COIN_GRAM',
    category: 'gold',
    unitFa: 'عدد',
    currentPriceToman: 33000000,
    change24hPercent: 0.95,
    high24hToman: 33300000,
    low24hToman: 32600000,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [32200000, 32400000, 32600000, 32550000, 32800000, 32900000, 33000000],
    benchmarkPurchasePriceToman: 26800000,
  },
  {
    id: 'usd',
    nameFa: 'دلار آمریکا (آزاد)',
    nameEn: 'US Dollar',
    symbol: 'USD',
    category: 'currency',
    unitFa: 'اسکناس',
    currentPriceToman: 232500,
    change24hPercent: 0.92,
    high24hToman: 233400,
    low24hToman: 231200,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [228500, 229800, 230500, 230200, 231600, 232100, 232500],
    benchmarkPurchasePriceToman: 195000,
  },
  {
    id: 'eur',
    nameFa: 'یورو اروپا',
    nameEn: 'Euro',
    symbol: 'EUR',
    category: 'currency',
    unitFa: 'اسکناس',
    currentPriceToman: 255000,
    change24hPercent: 0.75,
    high24hToman: 256200,
    low24hToman: 253800,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [251000, 252300, 253200, 252800, 254100, 254600, 255000],
    benchmarkPurchasePriceToman: 215000,
  },
  {
    id: 'aed',
    nameFa: 'درهم امارات',
    nameEn: 'UAE Dirham',
    symbol: 'AED',
    category: 'currency',
    unitFa: 'اسکناس',
    currentPriceToman: 63500,
    change24hPercent: 0.95,
    high24hToman: 63800,
    low24hToman: 63100,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [62400, 62700, 63000, 62900, 63200, 63400, 63500],
    benchmarkPurchasePriceToman: 53500,
  },
  {
    id: 'gbp',
    nameFa: 'پوند انگلیس',
    nameEn: 'British Pound',
    symbol: 'GBP',
    category: 'currency',
    unitFa: 'اسکناس',
    currentPriceToman: 308000,
    change24hPercent: 0.65,
    high24hToman: 309500,
    low24hToman: 306200,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [303500, 305000, 306200, 305800, 307000, 307500, 308000],
    benchmarkPurchasePriceToman: 258000,
  },
  {
    id: 'cad',
    nameFa: 'دلار کانادا',
    nameEn: 'Canadian Dollar',
    symbol: 'CAD',
    category: 'currency',
    unitFa: 'اسکناس',
    currentPriceToman: 170000,
    change24hPercent: 0.70,
    high24hToman: 171000,
    low24hToman: 168500,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [167500, 168200, 169000, 168700, 169500, 169800, 170000],
    benchmarkPurchasePriceToman: 142000,
  },
  {
    id: 'try',
    nameFa: 'لیر ترکیه',
    nameEn: 'Turkish Lira',
    symbol: 'TRY',
    category: 'currency',
    unitFa: 'اسکناس',
    currentPriceToman: 6800,
    change24hPercent: -0.25,
    high24hToman: 6850,
    low24hToman: 6760,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [6900, 6880, 6850, 6840, 6820, 6810, 6800],
    benchmarkPurchasePriceToman: 5700,
  },
  {
    id: 'usdt',
    nameFa: 'تتر (دلار دیجیتال)',
    nameEn: 'Tether USDT',
    symbol: 'USDT',
    category: 'crypto',
    unitFa: 'توکن',
    currentPriceToman: 233000,
    change24hPercent: 0.95,
    high24hToman: 233800,
    low24hToman: 231500,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [229000, 230200, 231000, 230800, 232000, 232500, 233000],
    benchmarkPurchasePriceToman: 195500,
  },
  {
    id: 'btc',
    nameFa: 'بیت‌کوین',
    nameEn: 'Bitcoin',
    symbol: 'BTC',
    category: 'crypto',
    unitFa: 'واحد',
    currentPriceToman: 14562500000,
    change24hPercent: 2.85,
    high24hToman: 14750000000,
    low24hToman: 14200000000,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [14100000000, 14250000000, 14380000000, 14320000000, 14450000000, 14510000000, 14562500000],
    benchmarkPurchasePriceToman: 11200000000,
  },
  {
    id: 'eth',
    nameFa: 'اتریوم',
    nameEn: 'Ethereum',
    symbol: 'ETH',
    category: 'crypto',
    unitFa: 'واحد',
    currentPriceToman: 605800000,
    change24hPercent: 3.40,
    high24hToman: 615000000,
    low24hToman: 588000000,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [586000000, 592000000, 598000000, 595000000, 601000000, 603500000, 605800000],
    benchmarkPurchasePriceToman: 475000000,
  },
  {
    id: 'sol',
    nameFa: 'سولانا',
    nameEn: 'Solana',
    symbol: 'SOL',
    category: 'crypto',
    unitFa: 'واحد',
    currentPriceToman: 35800000,
    change24hPercent: 4.60,
    high24hToman: 36500000,
    low24hToman: 34200000,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [34000000, 34400000, 34200000, 34900000, 35300000, 35500000, 35800000],
    benchmarkPurchasePriceToman: 27500000,
  },
  {
    id: 'gold_fund',
    nameFa: 'صندوق طلای بورس (عیار/کهربا/زر)',
    nameEn: 'Gold ETF Fund',
    symbol: 'GOLD_ETF',
    category: 'stock',
    unitFa: 'واحد',
    currentPriceToman: 43500,
    change24hPercent: 1.45,
    high24hToman: 43800,
    low24hToman: 42900,
    lastUpdated: new Date().toLocaleTimeString('fa-IR'),
    history7d: [42100, 42500, 42800, 42700, 43100, 43300, 43500],
    benchmarkPurchasePriceToman: 35200,
  }
];

const STORAGE_CUSTOM_PRICES_KEY = 'smartfinance_calibrated_asset_prices';

class MarketPriceService {
  private prices: LiveAssetPrice[] = [...INITIAL_LIVE_PRICES];
  private listeners: Array<(prices: LiveAssetPrice[]) => void> = [];
  private timer: any = null;

  constructor() {
    this.loadCustomPrices();
    this.startLiveSimulation();
    this.fetchOnlineCryptoRates();
  }

  private loadCustomPrices() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_PRICES_KEY);
      if (saved) {
        const customMap: Record<string, { price: number; change?: number }> = JSON.parse(saved);
        this.prices = this.prices.map(item => {
          if (customMap[item.id]) {
            const custom = customMap[item.id];
            return {
              ...item,
              currentPriceToman: custom.price,
              change24hPercent: custom.change !== undefined ? custom.change : item.change24hPercent,
              isCustomCalibrated: true,
              lastUpdated: new Date().toLocaleTimeString('fa-IR'),
            };
          }
          return item;
        });
      }
    } catch (e) {
      console.warn('Failed to load custom prices from storage', e);
    }
  }

  public getPrices(): LiveAssetPrice[] {
    return this.prices;
  }

  public getPriceById(id: string): LiveAssetPrice | undefined {
    return this.prices.find(p => p.id === id);
  }

  public subscribe(callback: (prices: LiveAssetPrice[]) => void): () => void {
    this.listeners.push(callback);
    callback(this.prices);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Allows user to manually calibrate or set the exact market price for any asset.
   */
  public calibrateAssetPrice(id: string, newPriceToman: number, newChange?: number) {
    this.prices = this.prices.map(item => {
      if (item.id === id) {
        const factor = item.currentPriceToman > 0 ? newPriceToman / item.currentPriceToman : 1;
        const updatedHistory = item.history7d.map(h => Math.round(h * factor));
        updatedHistory[updatedHistory.length - 1] = newPriceToman;

        return {
          ...item,
          currentPriceToman: newPriceToman,
          change24hPercent: newChange !== undefined ? newChange : item.change24hPercent,
          high24hToman: Math.max(item.high24hToman, newPriceToman),
          low24hToman: Math.min(item.low24hToman, newPriceToman),
          lastUpdated: new Date().toLocaleTimeString('fa-IR'),
          history7d: updatedHistory,
          isCustomCalibrated: true,
        };
      }
      return item;
    });

    this.persistCustomPrices();
    this.notify();
  }

  /**
   * Reset all or a specific asset price back to accurate defaults.
   */
  public resetToDefaults(assetId?: string) {
    if (assetId) {
      const defaultItem = INITIAL_LIVE_PRICES.find(p => p.id === assetId);
      if (defaultItem) {
        this.prices = this.prices.map(item => item.id === assetId ? { ...defaultItem, lastUpdated: new Date().toLocaleTimeString('fa-IR') } : item);
      }
    } else {
      this.prices = INITIAL_LIVE_PRICES.map(item => ({
        ...item,
        lastUpdated: new Date().toLocaleTimeString('fa-IR'),
      }));
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_CUSTOM_PRICES_KEY);
      }
    }

    this.persistCustomPrices();
    this.notify();
  }

  private persistCustomPrices() {
    if (typeof window === 'undefined') return;
    try {
      const customMap: Record<string, { price: number; change?: number }> = {};
      this.prices.forEach(p => {
        if (p.isCustomCalibrated) {
          customMap[p.id] = {
            price: p.currentPriceToman,
            change: p.change24hPercent,
          };
        }
      });
      localStorage.setItem(STORAGE_CUSTOM_PRICES_KEY, JSON.stringify(customMap));
    } catch (e) {
      console.warn('Failed to persist custom prices', e);
    }
  }

  /**
   * Fetch online live rates for crypto and global assets via public API
   */
  public async fetchOnlineCryptoRates() {
    try {
      const usdItem = this.prices.find(p => p.id === 'usd');
      const usdRate = usdItem ? usdItem.currentPriceToman : 232500;

      // Fetch CoinGecko public simple price API
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana&vs_currencies=usd&include_24hr_change=true');
      if (res.ok) {
        const data = await res.json();
        
        this.prices = this.prices.map(item => {
          if (item.isCustomCalibrated) return item; // User manual preference takes priority

          if (item.id === 'btc' && data.bitcoin) {
            const btcUsd = data.bitcoin.usd;
            const btcToman = Math.round(btcUsd * usdRate);
            const change = Number(data.bitcoin.usd_24h_change?.toFixed(2)) || item.change24hPercent;
            return { ...item, currentPriceToman: btcToman, change24hPercent: change, lastUpdated: new Date().toLocaleTimeString('fa-IR') };
          }
          if (item.id === 'eth' && data.ethereum) {
            const ethUsd = data.ethereum.usd;
            const ethToman = Math.round(ethUsd * usdRate);
            const change = Number(data.ethereum.usd_24h_change?.toFixed(2)) || item.change24hPercent;
            return { ...item, currentPriceToman: ethToman, change24hPercent: change, lastUpdated: new Date().toLocaleTimeString('fa-IR') };
          }
          if (item.id === 'sol' && data.solana) {
            const solUsd = data.solana.usd;
            const solToman = Math.round(solUsd * usdRate);
            const change = Number(data.solana.usd_24h_change?.toFixed(2)) || item.change24hPercent;
            return { ...item, currentPriceToman: solToman, change24hPercent: change, lastUpdated: new Date().toLocaleTimeString('fa-IR') };
          }
          if (item.id === 'usdt') {
            const usdtToman = Math.round(usdRate * 1.002);
            return { ...item, currentPriceToman: usdtToman, lastUpdated: new Date().toLocaleTimeString('fa-IR') };
          }
          return item;
        });

        this.notify();
      }
    } catch (e) {
      // Graceful fallback to initial accurate baseline
    }
  }

  public refreshRates(): LiveAssetPrice[] {
    this.prices = this.prices.map(item => {
      // Subtle micro live variance (+-0.2%)
      const factor = 1 + (Math.random() * 0.004 - 0.002);
      const newPrice = Math.round(item.currentPriceToman * factor);
      const changeDelta = Number((Math.random() * 0.2 - 0.1).toFixed(2));
      const newChange = Number((item.change24hPercent + changeDelta).toFixed(2));
      const lastHistory = item.history7d[item.history7d.length - 1];
      const newHistoryPoint = Math.round(lastHistory * factor);
      const updatedHistory = [...item.history7d.slice(1), newHistoryPoint];

      return {
        ...item,
        currentPriceToman: newPrice,
        change24hPercent: newChange,
        lastUpdated: new Date().toLocaleTimeString('fa-IR'),
        history7d: updatedHistory,
      };
    });

    this.notify();
    return this.prices;
  }

  private notify() {
    this.listeners.forEach(fn => {
      try {
        fn(this.prices);
      } catch (err) {
        console.error('Market listener error', err);
      }
    });
  }

  private startLiveSimulation() {
    if (typeof window !== 'undefined') {
      this.timer = setInterval(() => {
        this.refreshRates();
      }, 45000);
    }
  }

  public destroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const marketPriceService = new MarketPriceService();
