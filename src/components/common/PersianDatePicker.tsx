import React, { useState, useEffect, useRef } from 'react';
import { 
  JALALI_MONTH_NAMES_FA, 
  JALALI_MONTH_NAMES_EN, 
  JALALI_WEEK_DAYS_FA,
  gregorianToJalali, 
  formatToGregorianISO, 
  parseJalaliString,
  getTodayJalali,
  getTodayISO,
  getJalaliMonthDays,
  getJalaliDayOfWeek,
  getNextJalaliMonth,
  getPrevJalaliMonth
} from '../../utils/jalali';
import { toPersianDigits } from '../../utils/formatters';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PersianDatePickerProps {
  valueJalali: string; // YYYY/MM/DD
  onChange: (jalaliDate: string, isoDate: string) => void;
  isPersianLang?: boolean;
  label?: string;
  id?: string;
  placeholder?: string;
}

export const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  valueJalali,
  onChange,
  isPersianLang = true,
  label,
  id = 'persian-date-picker',
  placeholder = 'انتخاب تاریخ'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [openUpward, setOpenUpward] = useState(false);
  const [horizontalOffset, setHorizontalOffset] = useState<'right' | 'left' | 'center'>('right');

  const todayJalali = getTodayJalali();
  const parsedToday = parseJalaliString(todayJalali) || { jy: 1403, jm: 6, jd: 15 };

  const parsedValue = parseJalaliString(valueJalali);
  const initialYear = parsedValue ? parsedValue.jy : parsedToday.jy;
  const initialMonth = parsedValue ? parsedValue.jm : parsedToday.jm;
  const initialDay = parsedValue ? parsedValue.jd : parsedToday.jd;

  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);

  // Smart viewport collision detection
  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Check if bottom space is too small (< 380px) and top space is larger
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < 380 && spaceAbove > spaceBelow) {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }

    // Check horizontal space
    if (viewportWidth < 360) {
      setHorizontalOffset('center');
    } else if (isPersianLang) {
      // In RTL, prefer aligning with right edge unless it overflows right
      if (rect.right < 320 && rect.left + 320 < viewportWidth) {
        setHorizontalOffset('left');
      } else {
        setHorizontalOffset('right');
      }
    } else {
      if (rect.left + 320 > viewportWidth) {
        setHorizontalOffset('right');
      } else {
        setHorizontalOffset('left');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleResize = () => updatePosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize, true);
      };
    }
  }, [isOpen]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Keep view aligned with external value
  useEffect(() => {
    const p = parseJalaliString(valueJalali);
    if (p) {
      setViewYear(p.jy);
      setViewMonth(p.jm);
    }
  }, [valueJalali]);

  const monthDaysCount = getJalaliMonthDays(viewYear, viewMonth);
  const firstDayOffset = getJalaliDayOfWeek(viewYear, viewMonth, 1); // 0=Sat, 6=Fri

  const handleNextMonth = () => {
    const next = getNextJalaliMonth(viewYear, viewMonth);
    setViewYear(next.jy);
    setViewMonth(next.jm);
  };

  const handlePrevMonth = () => {
    const prev = getPrevJalaliMonth(viewYear, viewMonth);
    setViewYear(prev.jy);
    setViewMonth(prev.jm);
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const jalaliStr = `${viewYear}/${mm}/${dd}`;
    const isoStr = formatToGregorianISO(viewYear, viewMonth, day);
    onChange(jalaliStr, isoStr);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const todayJ = getTodayJalali();
    const todayISO = getTodayISO();
    const p = parseJalaliString(todayJ);
    if (p) {
      setViewYear(p.jy);
      setViewMonth(p.jm);
    }
    onChange(todayJ, todayISO);
    setIsOpen(false);
  };

  const handleSelectTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const j = gregorianToJalali(tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate());
    const mm = String(j.jm).padStart(2, '0');
    const dd = String(j.jd).padStart(2, '0');
    const jStr = `${j.jy}/${mm}/${dd}`;
    const isoStr = formatToGregorianISO(j.jy, j.jm, j.jd);
    setViewYear(j.jy);
    setViewMonth(j.jm);
    onChange(jStr, isoStr);
    setIsOpen(false);
  };

  const handleSelectEndOfMonth = () => {
    const maxDays = getJalaliMonthDays(viewYear, viewMonth);
    handleSelectDay(maxDays);
  };

  const currentMonthName = isPersianLang 
    ? JALALI_MONTH_NAMES_FA[viewMonth - 1] 
    : JALALI_MONTH_NAMES_EN[viewMonth - 1];

  const shortWeekDays = isPersianLang 
    ? ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
    : ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'];

  const yearsRange = Array.from({ length: 15 }, (_, i) => 1400 + i);

  return (
    <div className="relative w-full" id={id} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
          <span>{label}</span>
          {valueJalali && (
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
              {isPersianLang ? toPersianDigits(valueJalali) : valueJalali}
            </span>
          )}
        </label>
      )}

      {/* Trigger Button with Frosted Glass Aesthetics */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-white/95 dark:bg-slate-900/95 border-2 border-blue-500 shadow-md shadow-blue-500/10 dark:shadow-blue-500/20 text-slate-900 dark:text-white'
            : 'bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-blue-400/60 dark:hover:border-blue-500/50 shadow-xs text-slate-800 dark:text-slate-200'
        } backdrop-blur-md`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <CalendarIcon className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold tracking-wide">
            {valueJalali 
              ? (isPersianLang ? toPersianDigits(valueJalali) : valueJalali) 
              : placeholder}
          </span>
        </div>
        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-800/50 shrink-0">
          {currentMonthName}
        </span>
      </button>

      {/* Glassmorphic Dropdown Calendar Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: openUpward ? -8 : 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? -6 : 6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={`absolute z-50 w-[calc(100vw-2.5rem)] sm:w-[320px] max-w-[320px] rounded-3xl p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 text-slate-800 dark:text-slate-100 overflow-hidden ${
              openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
            } ${
              horizontalOffset === 'center'
                ? 'left-1/2 -translate-x-1/2'
                : horizontalOffset === 'left'
                ? 'left-0'
                : 'right-0'
            }`}
          >
            {/* Top Glowing Mesh Accent */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header: Month & Year Navigator */}
            <div className="flex items-center justify-between gap-1 mb-3.5 pb-2.5 border-b border-slate-200/70 dark:border-slate-800/80">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title={isPersianLang ? 'ماه قبل' : 'Previous month'}
              >
                {isPersianLang ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              <div className="flex items-center gap-1.5">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                >
                  {JALALI_MONTH_NAMES_FA.map((name, idx) => (
                    <option key={`jalali-dp-month-${idx + 1}`} value={idx + 1} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {isPersianLang ? name : JALALI_MONTH_NAMES_EN[idx]}
                    </option>
                  ))}
                </select>

                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-mono"
                >
                  {yearsRange.map((y) => (
                    <option key={`jalali-dp-year-${y}`} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {isPersianLang ? toPersianDigits(y) : y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title={isPersianLang ? 'ماه بعد' : 'Next month'}
              >
                {isPersianLang ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {shortWeekDays.map((w, idx) => (
                <div
                  key={`dp-weekday-hdr-${w}-${idx}`}
                  className={`py-1 text-[11px] font-black rounded-lg ${
                    idx === 6 
                      ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10' 
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Day Cells Grid with Exact Jalali Week Offset */}
            <div className="grid grid-cols-7 gap-1 text-center mb-3">
              {/* Start offset days */}
              {Array.from({ length: firstDayOffset }).map((_, idx) => (
                <div key={`dp-offset-${viewYear}-${viewMonth}-${idx}`} className="h-8 rounded-xl opacity-0 pointer-events-none" />
              ))}

              {/* Real month days */}
              {Array.from({ length: monthDaysCount }, (_, i) => i + 1).map((day) => {
                const mm = String(viewMonth).padStart(2, '0');
                const dd = String(day).padStart(2, '0');
                const thisDayStr = `${viewYear}/${mm}/${dd}`;
                const isSelected = valueJalali === thisDayStr;
                const isToday = todayJalali === thisDayStr;
                const dayOfWeek = (firstDayOffset + day - 1) % 7;
                const isFriday = dayOfWeek === 6;

                return (
                  <button
                    key={`dp-day-btn-${thisDayStr}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-8 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 scale-105 z-10'
                        : isToday
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-400/80 font-black'
                        : isFriday
                        ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{isPersianLang ? toPersianDigits(day) : day}</span>
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Action Presets */}
            <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-1 text-[11px] font-bold">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSelectToday}
                  className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer border border-blue-200/50 dark:border-blue-800/50"
                >
                  {isPersianLang ? 'امروز' : 'Today'}
                </button>
                <button
                  type="button"
                  onClick={handleSelectTomorrow}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {isPersianLang ? 'فردا' : 'Tomorrow'}
                </button>
                <button
                  type="button"
                  onClick={handleSelectEndOfMonth}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer hidden sm:inline-block"
                >
                  {isPersianLang ? 'آخر ماه' : 'End of Month'}
                </button>
              </div>

              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {currentMonthName} {isPersianLang ? toPersianDigits(viewYear) : viewYear}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

