import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatNumber, toPersianDigits } from '../../utils/formatters';
import { 
  ShieldCheck, 
  Wallet, 
  Coins, 
  Landmark, 
  PieChart as PieIcon, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  ArrowUpRight, 
  CheckCircle2, 
  Layers, 
  Info,
  SlidersHorizontal,
  ChevronLeft
} from 'lucide-react';

export interface LiquidityCategoryItem {
  id: 'fully_liquid' | 'semi_liquid' | 'non_liquid';
  labelFa: string;
  labelEn: string;
  descriptionFa: string;
  amount: number;
  percentage: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  icon: typeof Wallet;
  items: { name: string; amount: number; type: string }[];
  accessTimeFa: string;
}

export const D3LiquidityDonutWidget: React.FC = () => {
  const { accounts, totalNetWorth, monthlyExpense, currency, language, setActiveTab } = useFinance();
  const isFa = language === 'fa';
  
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedSlice, setSelectedSlice] = useState<LiquidityCategoryItem | null>(null);
  const [viewMode, setViewMode] = useState<'amount' | 'percent'>('amount');

  // Compute liquidity buckets based on real user accounts & net worth
  const liquidityData = useMemo(() => {
    let liquidSum = 0;
    let semiLiquidSum = 0;
    let nonLiquidSum = 0;

    const liquidItems: { name: string; amount: number; type: string }[] = [];
    const semiLiquidItems: { name: string; amount: number; type: string }[] = [];
    const nonLiquidItems: { name: string; amount: number; type: string }[] = [];

    accounts.forEach(acc => {
      const lowerName = acc.name.toLowerCase();
      if (acc.type === 'cash' || (acc.type === 'bank' && !lowerName.includes('مدت‌دار') && !lowerName.includes('سپرده'))) {
        liquidSum += acc.balance;
        liquidItems.push({ name: acc.name, amount: acc.balance, type: 'نقد / بانکی' });
      } else if (acc.type === 'gold' || acc.type === 'crypto' || lowerName.includes('ارز') || lowerName.includes('دلار')) {
        semiLiquidSum += acc.balance;
        semiLiquidItems.push({ name: acc.name, amount: acc.balance, type: 'طلا / ارز / رمزارز' });
      } else {
        nonLiquidSum += acc.balance;
        nonLiquidItems.push({ name: acc.name, amount: acc.balance, type: 'سرمایه‌ای / مدت‌دار' });
      }
    });

    const calculatedTotal = liquidSum + semiLiquidSum + nonLiquidSum;
    const effectiveTotal = calculatedTotal > 0 ? calculatedTotal : Math.max(1, totalNetWorth);

    // Fallback distribution if accounts are empty but net worth exists
    if (calculatedTotal === 0 && totalNetWorth > 0) {
      liquidSum = Math.round(totalNetWorth * 0.35);
      semiLiquidSum = Math.round(totalNetWorth * 0.45);
      nonLiquidSum = Math.round(totalNetWorth * 0.20);
      liquidItems.push({ name: 'حساب‌های جاری و کارت بانکی', amount: liquidSum, type: 'نقد' });
      semiLiquidItems.push({ name: 'طلا و ارزهای ذخیره', amount: semiLiquidSum, type: 'شبه‌نقد' });
      nonLiquidItems.push({ name: 'سپرده‌ها و سهام', amount: nonLiquidSum, type: 'مدت‌دار' });
    }

    const liquidPct = Number(((liquidSum / effectiveTotal) * 100).toFixed(1));
    const semiPct = Number(((semiLiquidSum / effectiveTotal) * 100).toFixed(1));
    const nonPct = Number(Math.max(0, 100 - liquidPct - semiPct).toFixed(1));

    const categories: LiquidityCategoryItem[] = [
      {
        id: 'fully_liquid',
        labelFa: 'دارایی‌های کاملاً نقد',
        labelEn: 'Fully Liquid Cash',
        descriptionFa: 'اسکناس، کارت‌های بانکی، کیف پول و حساب‌های جاری با دسترسی آنی',
        amount: liquidSum,
        percentage: liquidPct,
        color: '#10B981', // Emerald
        gradientFrom: '#10B981',
        gradientTo: '#059669',
        icon: Wallet,
        items: liquidItems,
        accessTimeFa: 'دسترسی آنی (لحظه‌ای)',
      },
      {
        id: 'semi_liquid',
        labelFa: 'دارایی‌های شبه‌نقد و ارزی',
        labelEn: 'Semi-Liquid & Market Assets',
        descriptionFa: 'طلا و مسکوکات، دلار، یورو، تتر و رمزارزهای با قابلیت نقدشوندگی سریع',
        amount: semiLiquidSum,
        percentage: semiPct,
        color: '#F59E0B', // Amber
        gradientFrom: '#F59E0B',
        gradientTo: '#D97706',
        icon: Coins,
        items: semiLiquidItems,
        accessTimeFa: 'نقدشوندگی ظرف چند ساعت',
      },
      {
        id: 'non_liquid',
        labelFa: 'دارایی‌های غیرنقد و سرمایه‌ای',
        labelEn: 'Fixed & Non-Liquid Assets',
        descriptionFa: 'صندوق‌های سرمایه‌گذاری، سپرده‌های بلندمدت و دارایی‌های تثبیت‌شده',
        amount: nonLiquidSum,
        percentage: nonPct,
        color: '#6366F1', // Indigo
        gradientFrom: '#6366F1',
        gradientTo: '#4F46E5',
        icon: Landmark,
        items: nonLiquidItems,
        accessTimeFa: 'چند روز یا مدت‌دار',
      }
    ];

    // Runway: How many months of average expense the liquid + semi-liquid can cover
    const monthlyBurn = monthlyExpense > 0 ? monthlyExpense : 15000000;
    const emergencyRunwayMonths = Number(((liquidSum + semiLiquidSum * 0.9) / monthlyBurn).toFixed(1));

    return {
      categories,
      total: effectiveTotal,
      liquidSum,
      semiLiquidSum,
      nonLiquidSum,
      emergencyRunwayMonths,
      healthStatus: emergencyRunwayMonths >= 6 ? 'excellent' : emergencyRunwayMonths >= 3 ? 'good' : 'warning',
    };
  }, [accounts, totalNetWorth, monthlyExpense]);

  // Set default selected slice
  useEffect(() => {
    if (!selectedSlice && liquidityData.categories.length > 0) {
      setSelectedSlice(liquidityData.categories[0]);
    }
  }, [liquidityData.categories, selectedSlice]);

  // D3 Rendering Hook
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 280;
    const height = 280;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.62;
    const outerRadius = radius * 0.92;
    const cornerRadius = 6;
    const padAngle = 0.035;

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('class', 'w-full h-full max-w-[280px] max-h-[280px] mx-auto overflow-visible select-none');

    // Gradient Definitions
    const defs = svg.append('defs');

    // Ambient drop shadow filter
    const filter = defs.append('filter')
      .attr('id', 'd3-donut-glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');
    filter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // Slice Linear Gradients
    liquidityData.categories.forEach(cat => {
      const grad = defs.append('linearGradient')
        .attr('id', `grad-${cat.id}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', cat.gradientFrom);
      grad.append('stop').attr('offset', '100%').attr('stop-color', cat.gradientTo);
    });

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // D3 Pie Generator
    const pie = d3.pie<LiquidityCategoryItem>()
      .value(d => Math.max(1, d.amount))
      .sort(null)
      .padAngle(padAngle);

    // Normal Arc
    const arc = d3.arc<d3.PieArcDatum<LiquidityCategoryItem>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(cornerRadius);

    // Hover / Active Arc (Expanded)
    const activeArc = d3.arc<d3.PieArcDatum<LiquidityCategoryItem>>()
      .innerRadius(innerRadius - 3)
      .outerRadius(outerRadius + 8)
      .cornerRadius(cornerRadius + 2);

    const pieData = pie(liquidityData.categories);

    // Draw Slices
    const paths = g.selectAll('path')
      .data(pieData)
      .enter()
      .append('path')
      .attr('d', d => {
        const isSel = selectedSlice?.id === d.data.id;
        return (isSel ? activeArc(d) : arc(d)) || '';
      })
      .attr('fill', d => `url(#grad-${d.data.id})`)
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)')
      .attr('filter', d => selectedSlice?.id === d.data.id ? 'url(#d3-donut-glow)' : null);

    // Interactions
    paths.on('mouseenter', function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('d', activeArc(d) || '')
        .attr('filter', 'url(#d3-donut-glow)');
      setSelectedSlice(d.data);
    })
    .on('mouseleave', function (event, d) {
      const isStillSelected = selectedSlice?.id === d.data.id;
      if (!isStillSelected) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc(d) || '')
          .attr('filter', null);
      }
    })
    .on('click', (event, d) => {
      setSelectedSlice(d.data);
    });

  }, [liquidityData, selectedSlice]);

  return (
    <div className="card-pro p-5 sm:p-6 relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 border border-slate-200/80 dark:border-slate-800 shadow-sm">
      {/* Background ambient decorative light */}
      <div className="absolute top-0 left-0 -mt-10 -ml-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 -mb-10 -mr-10 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <PieIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                {isFa ? 'تحلیل گرافیکی نقدینگی و ساختار دارایی‌ها (D3.js)' : 'Asset Liquidity Breakdown (D3.js)'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                D3 Interactive
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isFa ? 'تفکیک هوشمند دارایی‌های نقد، شبه‌نقد (طلا و ارز) و دارایی‌های سرمایه‌ای با ارزیابی سپر اضطراری' : 'Interactive donut chart visualizing cash, semi-liquid (gold/forex) and fixed assets'}
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
          <button
            onClick={() => setViewMode('amount')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'amount'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isFa ? 'مبالغ (تومان)' : 'Amount'}
          </button>
          <button
            onClick={() => setViewMode('percent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'percent'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isFa ? 'درصد (٪)' : 'Percent'}
          </button>
        </div>
      </div>

      {/* Main Grid: D3 Donut Chart + Category Breakdown Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mt-5">
        
        {/* Left/Center Column: D3.js Vector SVG Chart with Dynamic Center Badge */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-2">
          <div className="relative w-[280px] h-[280px] flex items-center justify-center">
            <svg ref={svgRef} className="w-full h-full" />

            {/* Interactive Center Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {selectedSlice ? (isFa ? selectedSlice.labelFa : selectedSlice.labelEn) : (isFa ? 'کل دارایی‌ها' : 'Total Wealth')}
              </span>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5" style={{ color: selectedSlice?.color }}>
                {viewMode === 'amount'
                  ? formatCurrency(selectedSlice ? selectedSlice.amount : liquidityData.total, currency, isFa)
                  : `${isFa ? toPersianDigits(selectedSlice ? selectedSlice.percentage : 100) : (selectedSlice ? selectedSlice.percentage : 100)}٪`}
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedSlice ? selectedSlice.accessTimeFa : (isFa ? 'تراز کل ثروت' : 'Net Liquidity')}
              </span>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 text-center">
            {isFa ? 'برای مشاهده جزئیات حساب‌ها روی قطاع‌های نمودار کلیک یا هاور کنید' : 'Hover or tap donut slices to inspect liquidity sub-accounts'}
          </span>
        </div>

        {/* Right Column: Detailed Liquidity Breakdown Cards */}
        <div className="lg:col-span-7 space-y-3">
          {liquidityData.categories.map(cat => {
            const isSelected = selectedSlice?.id === cat.id;
            const IconComponent = cat.icon;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedSlice(cat)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-slate-800/90 border-slate-300 dark:border-slate-600 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          {isFa ? cat.labelFa : cat.labelEn}
                        </h4>
                        <span 
                          className="text-[11px] font-black px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: cat.color }}
                        >
                          {isFa ? toPersianDigits(cat.percentage) : cat.percentage}٪
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {isFa ? cat.descriptionFa : cat.labelEn}
                      </p>
                    </div>
                  </div>

                  <div className="text-right rtl:text-right ltr:text-left shrink-0">
                    <div className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                      {formatCurrency(cat.amount, currency, isFa)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {cat.accessTimeFa}
                    </span>
                  </div>
                </div>

                {/* Expanded Sub-accounts List if Selected */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 animate-fadeIn">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
                      <span>{isFa ? 'حساب‌ها و دارایی‌های این بخش:' : 'Sub-Holdings:'}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); setActiveTab('accounts'); }}>
                        {isFa ? 'مدیریت حساب‌ها ←' : 'Manage Accounts →'}
                      </span>
                    </div>

                    {cat.items.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cat.items.map((item, idx) => (
                          <div 
                            key={`item-${idx}`}
                            className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs"
                          >
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                              {item.name}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white shrink-0">
                              {formatCurrency(item.amount, currency, isFa)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        {isFa ? 'هنوز حسابی در این دسته تعریف نشده است.' : 'No direct accounts in this tier.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Emergency Fund Runway & Liquidity Safety Gauge Banner */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Metric 1: Emergency Runway */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">
              {isFa ? 'سپر اضطراری خانواده (Runway):' : 'Emergency Runway:'}
            </span>
            <div className="text-base font-black text-emerald-950 dark:text-emerald-200 flex items-baseline gap-1">
              <span>{isFa ? toPersianDigits(liquidityData.emergencyRunwayMonths) : liquidityData.emergencyRunwayMonths}</span>
              <span className="text-xs font-normal">{isFa ? 'ماه پوشش هزینه' : 'months'}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Liquid vs Non-Liquid Ratio */}
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 block">
              {isFa ? 'ضریب نقدشوندگی کل دارایی:' : 'Total Liquidity Ratio:'}
            </span>
            <div className="text-base font-black text-indigo-950 dark:text-indigo-200 flex items-baseline gap-1">
              <span>{isFa ? toPersianDigits((liquidityData.categories[0].percentage + liquidityData.categories[1].percentage).toFixed(1)) : (liquidityData.categories[0].percentage + liquidityData.categories[1].percentage).toFixed(1)}٪</span>
              <span className="text-xs font-normal text-slate-500">{isFa ? 'در دسترس سریع' : 'liquid'}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Health Status & Recommendation */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">
              {isFa ? 'وضعیت سلامت نقدینگی:' : 'Liquidity Health:'}
            </span>
            <span className="text-xs font-bold text-amber-950 dark:text-amber-200 block">
              {liquidityData.emergencyRunwayMonths >= 6
                ? (isFa ? 'بسیار مطلوب و امن (سپر ۶+ ماه)' : 'Optimal Security')
                : liquidityData.emergencyRunwayMonths >= 3
                ? (isFa ? 'استاندارد و متعادل (۳ تا ۶ ماه)' : 'Standard Safety')
                : (isFa ? 'نیاز به تقویت نقدینگی اضطراری' : 'Needs Top-up')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
