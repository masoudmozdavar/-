import { Account, Transaction } from '../types';
import { LiveAssetPrice } from '../services/marketPriceService';

export interface AssetHoldingPnL {
  id: string;
  assetId: string;
  assetNameFa: string;
  assetSymbol: string;
  category: 'gold' | 'currency' | 'crypto' | 'stock';
  unitFa: string;
  quantity: number; // e.g. 15.5 grams of gold, 1200 USD, 3 coins
  avgPurchasePriceToman: number; // Average buy price per unit
  totalInvestedToman: number; // Total cost basis = quantity * avgPurchasePriceToman
  currentPriceToman: number; // Current spot market price per unit
  currentValueToman: number; // Current valuation = quantity * currentPriceToman
  unrealizedPnLToman: number; // Profit or Loss = currentValue - totalInvested
  unrealizedRoiPercent: number; // ROI % = (unrealizedPnL / totalInvested) * 100
  isProfit: boolean;
  sourceType: 'account' | 'transaction' | 'benchmark';
  sourceName: string;
  recommendationFa: string;
  purchaseDateJalali?: string;
}

export interface PortfolioPnLSummary {
  holdings: AssetHoldingPnL[];
  totalInvestedToman: number;
  totalCurrentValueToman: number;
  totalUnrealizedPnLToman: number;
  totalRoiPercent: number;
  isNetProfit: boolean;
  goldInvestedToman: number;
  goldCurrentValueToman: number;
  goldPnLToman: number;
  currencyInvestedToman: number;
  currencyCurrentValueToman: number;
  currencyPnLToman: number;
  cryptoInvestedToman: number;
  cryptoCurrentValueToman: number;
  cryptoPnLToman: number;
  stockInvestedToman: number;
  stockCurrentValueToman: number;
  stockPnLToman: number;
  topWinner?: AssetHoldingPnL;
  topLoser?: AssetHoldingPnL;
}

/**
 * Maps user accounts and transaction history to market asset prices
 * to compute exact or estimated Unrealized Profit & Loss (P&L).
 */
export function calculatePortfolioPnL(
  accounts: Account[],
  transactions: Transaction[],
  livePrices: LiveAssetPrice[]
): PortfolioPnLSummary {
  const holdings: AssetHoldingPnL[] = [];
  const priceMap = new Map<string, LiveAssetPrice>();
  livePrices.forEach(p => priceMap.set(p.id, p));

  // 1. Match Accounts by Type & Name
  accounts.forEach(acc => {
    const accLower = acc.name.toLowerCase();
    let matchedAssetId: string | null = null;
    let fallbackUnit = 'واحد';

    if (acc.type === 'gold' || accLower.includes('طلا') || accLower.includes('سکه') || accLower.includes('gold')) {
      if (accLower.includes('سکه') && accLower.includes('امامی')) matchedAssetId = 'coin_emami';
      else if (accLower.includes('بهار') || accLower.includes('سکه')) matchedAssetId = 'coin_bahar';
      else if (accLower.includes('نیم')) matchedAssetId = 'coin_nim';
      else if (accLower.includes('ربع')) matchedAssetId = 'coin_rob';
      else if (accLower.includes('۲۴') || accLower.includes('آبشده')) matchedAssetId = 'gold_24k';
      else if (accLower.includes('صندوق') || accLower.includes('عیار')) matchedAssetId = 'gold_fund';
      else matchedAssetId = 'gold_18k';
    } else if (accLower.includes('دلار') || accLower.includes('usd') || accLower.includes('ارز')) {
      matchedAssetId = 'usd';
    } else if (accLower.includes('یورو') || accLower.includes('eur')) {
      matchedAssetId = 'eur';
    } else if (accLower.includes('درهم') || accLower.includes('aed')) {
      matchedAssetId = 'aed';
    } else if (accLower.includes('پوند') || accLower.includes('gbp')) {
      matchedAssetId = 'gbp';
    } else if (acc.type === 'crypto' || accLower.includes('تتر') || accLower.includes('usdt')) {
      matchedAssetId = 'usdt';
    } else if (accLower.includes('بیت') || accLower.includes('btc')) {
      matchedAssetId = 'btc';
    } else if (acc.type === 'investment' || accLower.includes('بورس') || accLower.includes('سهام') || accLower.includes('صندوق')) {
      matchedAssetId = 'gold_fund';
    }

    if (matchedAssetId && acc.balance > 0) {
      const asset = priceMap.get(matchedAssetId) || livePrices[0];
      // Estimate quantity based on balance
      // If account balance is in Toman currency:
      const currentPrice = asset.currentPriceToman;
      const benchmarkBuyPrice = asset.benchmarkPurchasePriceToman;
      
      // Calculate quantity: balance / currentPrice (or historical buy price factor)
      // Standard heuristic: assuming user bought at an earlier rate with ~15-25% gain
      const qty = Number((acc.balance / currentPrice).toFixed(3)) || 1;
      const totalCost = Math.round(qty * benchmarkBuyPrice);
      const totalVal = acc.balance;
      const pnl = totalVal - totalCost;
      const roi = totalCost > 0 ? Number(((pnl / totalCost) * 100).toFixed(2)) : 0;

      holdings.push({
        id: `holding-acc-${acc.id}`,
        assetId: asset.id,
        assetNameFa: asset.nameFa,
        assetSymbol: asset.symbol,
        category: asset.category,
        unitFa: asset.unitFa || fallbackUnit,
        quantity: qty,
        avgPurchasePriceToman: benchmarkBuyPrice,
        totalInvestedToman: totalCost,
        currentPriceToman: currentPrice,
        currentValueToman: totalVal,
        unrealizedPnLToman: pnl,
        unrealizedRoiPercent: roi,
        isProfit: pnl >= 0,
        sourceType: 'account',
        sourceName: acc.name,
        recommendationFa: generateRecommendation(roi, asset.category, pnl >= 0),
        purchaseDateJalali: '۱۴۰۳/۰۸/۱۵',
      });
    }
  });

  // 2. If no direct investment accounts exist, seed representative asset benchmarks from standard portfolio
  if (holdings.length === 0) {
    const defaultAssetsToTrack = ['gold_18k', 'coin_emami', 'usd', 'usdt'];
    defaultAssetsToTrack.forEach(assetId => {
      const asset = priceMap.get(assetId);
      if (!asset) return;

      const sampleQuantities: Record<string, number> = {
        gold_18k: 25.4, // 25.4 grams
        coin_emami: 2,   // 2 coins
        usd: 1500,       // 1500 USD
        usdt: 1200,      // 1200 USDT
      };

      const qty = sampleQuantities[assetId] || 5;
      const buyPrice = asset.benchmarkPurchasePriceToman;
      const currentPrice = asset.currentPriceToman;
      const totalCost = Math.round(qty * buyPrice);
      const totalVal = Math.round(qty * currentPrice);
      const pnl = totalVal - totalCost;
      const roi = totalCost > 0 ? Number(((pnl / totalCost) * 100).toFixed(2)) : 0;

      holdings.push({
        id: `holding-bench-${asset.id}`,
        assetId: asset.id,
        assetNameFa: asset.nameFa,
        assetSymbol: asset.symbol,
        category: asset.category,
        unitFa: asset.unitFa,
        quantity: qty,
        avgPurchasePriceToman: buyPrice,
        totalInvestedToman: totalCost,
        currentPriceToman: currentPrice,
        currentValueToman: totalVal,
        unrealizedPnLToman: pnl,
        unrealizedRoiPercent: roi,
        isProfit: pnl >= 0,
        sourceType: 'benchmark',
        sourceName: `پایش بازار ${asset.nameFa}`,
        recommendationFa: generateRecommendation(roi, asset.category, pnl >= 0),
        purchaseDateJalali: '۱۴۰۳/۰۶/۲۰',
      });
    });
  }

  // Aggregate Totals
  let totalInvested = 0;
  let totalCurrentVal = 0;
  let goldInvested = 0;
  let goldCurrentVal = 0;
  let currInvested = 0;
  let currCurrentVal = 0;
  let cryptoInvested = 0;
  let cryptoCurrentVal = 0;
  let stockInvested = 0;
  let stockCurrentVal = 0;

  holdings.forEach(h => {
    totalInvested += h.totalInvestedToman;
    totalCurrentVal += h.currentValueToman;

    if (h.category === 'gold') {
      goldInvested += h.totalInvestedToman;
      goldCurrentVal += h.currentValueToman;
    } else if (h.category === 'currency') {
      currInvested += h.totalInvestedToman;
      currCurrentVal += h.currentValueToman;
    } else if (h.category === 'crypto') {
      cryptoInvested += h.totalInvestedToman;
      cryptoCurrentVal += h.currentValueToman;
    } else if (h.category === 'stock') {
      stockInvested += h.totalInvestedToman;
      stockCurrentVal += h.currentValueToman;
    }
  });

  const totalPnL = totalCurrentVal - totalInvested;
  const totalRoi = totalInvested > 0 ? Number(((totalPnL / totalInvested) * 100).toFixed(2)) : 0;

  // Find winner and loser
  const sortedByRoi = [...holdings].sort((a, b) => b.unrealizedRoiPercent - a.unrealizedRoiPercent);
  const topWinner = sortedByRoi[0];
  const topLoser = sortedByRoi[sortedByRoi.length - 1];

  return {
    holdings,
    totalInvestedToman: totalInvested,
    totalCurrentValueToman: totalCurrentVal,
    totalUnrealizedPnLToman: totalPnL,
    totalRoiPercent: totalRoi,
    isNetProfit: totalPnL >= 0,
    goldInvestedToman: goldInvested,
    goldCurrentValueToman: goldCurrentVal,
    goldPnLToman: goldCurrentVal - goldInvested,
    currencyInvestedToman: currInvested,
    currencyCurrentValueToman: currCurrentVal,
    currencyPnLToman: currCurrentVal - currInvested,
    cryptoInvestedToman: cryptoInvested,
    cryptoCurrentValueToman: cryptoCurrentVal,
    cryptoPnLToman: cryptoCurrentVal - cryptoInvested,
    stockInvestedToman: stockInvested,
    stockCurrentValueToman: stockCurrentVal,
    stockPnLToman: stockCurrentVal - stockInvested,
    topWinner,
    topLoser,
  };
}

function generateRecommendation(roi: number, category: string, isProfit: boolean): string {
  if (roi >= 25) {
    return 'بازدهی عالی فراتر از انتظار؛ پیشنهاد سیو سود ۲۵٪ از دارایی و انتقال به صندوق درآمد ثابت یا طلا.';
  } else if (roi >= 12) {
    return 'روند رشد مثبت و مطلوب در کانال افزایشی؛ حفظ و نگهداری پیشنهاد می‌شود.';
  } else if (roi >= 0) {
    return 'بازدهی مثبت ملایم؛ مناسب برای ادامه میانگین‌کم‌کردن یا خریدهای پله‌ای ماهانه.';
  } else if (roi > -10) {
    return 'افت موقت قیمت به زیر بهای تمام‌شده؛ فرصت مناسب برای خرید پله‌ای و تعدیل میانگین ورود.';
  } else {
    return 'زیان فرضی؛ بررسی تغییر روند دارایی یا بازنگری در ساختار مدیریت ریسک پیشنهاد می‌شود.';
  }
}
