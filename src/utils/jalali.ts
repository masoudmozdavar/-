/**
 * Accurate Gregorian <-> Jalali (Shamsi) Date Conversion Engine
 */

export const JALALI_MONTH_NAMES_FA = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

export const JALALI_MONTH_NAMES_EN = [
  'Farvardin', 'Ordibehesht', 'Khordad',
  'Tir', 'Mordad', 'Shahrivar',
  'Mehr', 'Aban', 'Azar',
  'Dey', 'Bahman', 'Esfand'
];

export const JALALI_WEEK_DAYS_FA = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'
];

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export interface GregorianDate {
  gy: number;
  gm: number;
  gd: number;
}

// Convert Gregorian to Jalali
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }

  return { jy, jm, jd };
}

// Convert Jalali to Gregorian
export function jalaliToGregorian(jy: number, jm: number, jd: number): GregorianDate {
  jy = jy - 979;
  let j_day_no = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4);
  for (let i = 0; i < jm - 1; ++i) {
    if (i < 6) j_day_no += 31;
    else j_day_no += 30;
  }
  j_day_no += jd - 1;

  let g_day_no = j_day_no + 79;

  let gy = 1600 + 400 * Math.floor(g_day_no / 146097); /* 146097 = 365*400 + 400/4 - 400/100 + 400/400 */
  g_day_no = g_day_no % 146097;

  let leap = true;
  if (g_day_no >= 36525) { /* 36525 = 365*100 + 100/4 */
    g_day_no--;
    gy += 100 * Math.floor(g_day_no / 36524); /* 36524 = 365*100 + 100/4 - 100/100 */
    g_day_no = g_day_no % 36524;

    if (g_day_no >= 365) {
      g_day_no++;
    } else {
      leap = false;
    }
  }

  gy += 4 * Math.floor(g_day_no / 1461); /* 1461 = 365*4 + 4/4 */
  g_day_no %= 1461;

  if (g_day_no >= 366) {
    leap = false;
    g_day_no--;
    gy += Math.floor(g_day_no / 365);
    g_day_no = g_day_no % 365;
  }

  const g_days_in_month = [31, (leap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 12 && g_day_no >= g_days_in_month[gm]) {
    g_day_no -= g_days_in_month[gm];
    gm++;
  }
  gm++;
  let gd = g_day_no + 1;

  return { gy, gm, gd };
}

// Convert Date object to formatted string YYYY/MM/DD
export function formatToJalali(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const mm = String(j.jm).padStart(2, '0');
  const dd = String(j.jd).padStart(2, '0');
  return `${j.jy}/${mm}/${dd}`;
}

export function formatToGregorianISO(jy: number, jm: number, jd: number): string {
  const g = jalaliToGregorian(jy, jm, jd);
  const mm = String(g.gm).padStart(2, '0');
  const dd = String(g.gd).padStart(2, '0');
  return `${g.gy}-${mm}-${dd}`;
}

export function getTodayJalali(): string {
  return formatToJalali(new Date());
}

export function getTodayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Parse string "1403/06/15" or "1403-06-15"
export function parseJalaliString(str: string): JalaliDate | null {
  if (!str) return null;
  const parts = str.split(/[/ -]/).map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return null;
  }
  return { jy: parts[0], jm: parts[1], jd: parts[2] };
}

// Human readable Persian date: ۱۵ شهریور ۱۴۰۳
export function formatJalaliHuman(jalaliStr: string, isEnglish: boolean = false): string {
  const parsed = parseJalaliString(jalaliStr);
  if (!parsed) return jalaliStr;
  const monthName = isEnglish 
    ? JALALI_MONTH_NAMES_EN[parsed.jm - 1] 
    : JALALI_MONTH_NAMES_FA[parsed.jm - 1];
  return `${parsed.jd} ${monthName} ${parsed.jy}`;
}

// Calculate days remaining to a target ISO date
export function getDaysRemaining(isoDate: string): number {
  if (!isoDate) return 0;
  const target = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Check if a Jalali year is a leap year (کبیسه)
export function isJalaliLeapYear(jy: number): boolean {
  // Traditional 33-year cycle leap rule
  const r = (jy % 33);
  return [1, 5, 9, 13, 17, 22, 26, 30].includes(r);
}

// Get number of days in a given Jalali month (31, 30, or 29/30)
export function getJalaliMonthDays(jy: number, jm: number): number {
  if (jm >= 1 && jm <= 6) return 31;
  if (jm >= 7 && jm <= 11) return 30;
  if (jm === 12) return isJalaliLeapYear(jy) ? 30 : 29;
  return 30;
}

// Day of week index: 0 = شنبه (Saturday), 1 = یکشنبه, ... 6 = جمعه (Friday)
export function getJalaliDayOfWeek(jy: number, jm: number, jd: number): number {
  const g = jalaliToGregorian(jy, jm, jd);
  const date = new Date(g.gy, g.gm - 1, g.gd);
  const jsDay = date.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  return (jsDay + 1) % 7;
}

export function getNextJalaliMonth(jy: number, jm: number): { jy: number; jm: number } {
  if (jm === 12) {
    return { jy: jy + 1, jm: 1 };
  }
  return { jy, jm: jm + 1 };
}

export function getPrevJalaliMonth(jy: number, jm: number): { jy: number; jm: number } {
  if (jm === 1) {
    return { jy: jy - 1, jm: 12 };
  }
  return { jy, jm: jm - 1 };
}

