import { getTodayJalali, gregorianToJalali } from './jalali';

export interface ParsedSmsResult {
  amount: number; // in Tomans
  originalAmountString?: string;
  currencyUnit: 'toman' | 'rial';
  type: 'expense' | 'income' | 'transfer';
  merchantName: string;
  bankName: string;
  cardOrAccount?: string;
  jalaliDate: string; // YYYY/MM/DD
  gregorianDate: string; // YYYY-MM-DD
  time?: string; // HH:mm
  trackingCode?: string;
  balanceAfter?: number; // in Tomans
  suggestedCategoryId?: string;
  suggestedCategoryNameFa?: string;
  description: string;
  confidence: number; // 0 to 1
  source: 'gemini-ai' | 'smart-heuristic';
}

// Convert Persian and Arabic digits to English digits
export function normalizePersianDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[۰-۹]/g, d => String.fromCharCode(d.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, d => String.fromCharCode(d.charCodeAt(0) - 1584))
    .replace(/٬/g, ',')
    .replace(/،/g, ',');
}

// Bank names dictionary in Persian
export const KNOWN_BANKS = [
  { name: 'بانک ملت', keywords: ['ملت', 'mellat', 'بانک ملت'] },
  { name: 'بانک ملی', keywords: ['ملی', 'melli', 'بانک ملی', 'بام ملی'] },
  { name: 'بانک سامان', keywords: ['سامان', 'saman', 'بانک سامان'] },
  { name: 'بانک پاسارگاد', keywords: ['پاسارگاد', 'pasargad', 'بانک پاسارگاد'] },
  { name: 'بلو بانک', keywords: ['بلو', 'blubank', 'blu', 'بلو بانک', 'بلوبانک'] },
  { name: 'بانک تجارت', keywords: ['تجارت', 'tejarat', 'بانک تجارت'] },
  { name: 'بانک صادرات', keywords: ['صادرات', 'saderat', 'بانک صادرات'] },
  { name: 'بانک رسالت', keywords: ['رسالت', 'resalat', 'قرض الحسنه رسالت'] },
  { name: 'بانک مهر ایران', keywords: ['مهر ایران', 'qmb', 'بانک مهر'] },
  { name: 'بانک کشاورزی', keywords: ['کشاورزی', 'keshavarzi', 'بانک کشاورزی'] },
  { name: 'بانک سپه', keywords: ['سپه', 'sepah', 'انصار', 'کوثر', 'حکمت'] },
  { name: 'بانک پارسیان', keywords: ['پارسیان', 'parsian', 'بانک پارسیان'] },
  { name: 'بانک شهر', keywords: ['شهر', 'shahr', 'بانک شهر'] },
  { name: 'بانک آینده', keywords: ['آینده', 'ayandeh', 'بانک آینده'] },
  { name: 'بانک رفاه', keywords: ['رفاه', 'refah', 'رفاه کارگران'] },
  { name: 'بانک مسکن', keywords: ['مسکن', 'maskan', 'بانک مسکن'] },
  { name: 'بانک سینا', keywords: ['سینا', 'sina', 'بانک سینا'] },
  { name: 'بانک دی', keywords: ['دی', 'dey', 'بانک دی'] },
  { name: 'بانک خاورمیانه', keywords: ['خاورمیانه', 'middle east'] },
  { name: 'بانک کارآفرین', keywords: ['کارآفرین', 'karafarin'] },
  { name: 'بانک سرمایه', keywords: ['سرمایه', 'sarmayeh'] },
  { name: 'پست بانک', keywords: ['پست بانک', 'post bank'] },
  { name: 'بانک گردشگری', keywords: ['گردشگری', 'tourism'] },
];

// Sample test SMS templates for Iranian banks
export const SAMPLE_BANK_SMS = [
  {
    id: 'saman-purchase',
    bank: 'بانک سامان (خرید فروشگاهی)',
    text: `بانک سامان
برداشت خرید
مبلغ: 485,000 ریال
از کارت: 8219-***-6219
مانده: 14,200,000 ریال
فروشگاه: افق کوروش سعادت‌آباد
1403/07/02 18:24
پیگیری: 492810`
  },
  {
    id: 'blu-supermarket',
    bank: 'بلو بانک (خرید آنلاین/سوپرمارکت)',
    text: `بلو
خرید از سوپرمارکت بهار
مبلغ: 135,000 تومان
مانده: 4,850,000 تومان
1403/07/03 21:15
کد پیگیری: 884729`
  },
  {
    id: 'mellat-transfer',
    bank: 'بانک ملت (انتقال کارت به کارت)',
    text: `بانک ملت
برداشت انتقال به حساب
مبلغ: 2,500,000 ریال
از کارت: 6104****4820
به کارت: 6037****1190
پذیرنده: علی رضایی
1403/07/04 12:40
کد رهگیری: 918237`
  },
  {
    id: 'melli-salary',
    bank: 'بانک ملی (واریز حقوق/درآمد)',
    text: `بانک ملی ایران
واریز حقوق
مبلغ: 350,000,000 ریال
به حساب: 0102***82
مانده: 410,000,000 ریال
1403/07/01 09:15
شناسه: 382910`
  },
  {
    id: 'pasargad-snapp',
    bank: 'بانک پاسارگاد (اسنپ / حمل‌ونقل)',
    text: `بانک پاسارگاد
برداشت اینترنتی
مبلغ: 85,000 ریال
کارت: 5022****9912
پذیرنده: شرکت اسنپ
1403/07/05 22:10
پیگیری: 104820`
  },
  {
    id: 'resalat-debt',
    bank: 'بانک رسالت (قسط وام)',
    text: `قرض‌الحسنه رسالت
برداشت قسط تسهیلات
مبلغ: 1,850,000 تومان
از حساب: 10.2394.88
مانده: 3,120,000 تومان
1403/07/06 08:30`
  }
];

// Heuristic fallback parser in case Gemini API is temporarily offline or experiencing high demand
export function parseBankSmsLocally(smsText: string): ParsedSmsResult {
  const normalized = normalizePersianDigits(smsText);
  const cleanText = normalized.replace(/\r\n/g, '\n');

  // 1. Detect Bank
  let detectedBank = 'بانک نامشخص';
  for (const b of KNOWN_BANKS) {
    if (b.keywords.some(k => cleanText.toLowerCase().includes(k.toLowerCase()))) {
      detectedBank = b.name;
      break;
    }
  }

  // 2. Detect Type (Income, Expense, Transfer)
  let type: 'expense' | 'income' | 'transfer' = 'expense';
  const isIncome = /(واریز|دریافت|شارژ شد|افزایش موجودی|حقوق)/.test(cleanText);
  const isTransfer = /(انتقال به|کارت به کارت به|پایا به|ساتنا به|واریز به)/.test(cleanText);
  
  if (isIncome && !/(واریز به حساب دیگری|واریز شد به کارت)/.test(cleanText)) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  } else {
    type = 'expense';
  }

  // 3. Detect Currency Unit (Toman vs Rial)
  const isToman = /(تومان|تومَن|toman)/i.test(cleanText);
  const currencyUnit: 'toman' | 'rial' = isToman ? 'toman' : 'rial';

  // 4. Extract Amount
  let amount = 0;
  let originalAmountString = '';
  
  // Look for "مبلغ:" or "مبلغ" followed by digits
  const amountMatch = cleanText.match(/مبلغ\s*[:=\-]?\s*([0-9,.]+)/);
  if (amountMatch && amountMatch[1]) {
    originalAmountString = amountMatch[1];
    const rawVal = parseInt(amountMatch[1].replace(/[,.]/g, ''), 10);
    if (!isNaN(rawVal)) {
      amount = isToman ? rawVal : Math.round(rawVal / 10);
    }
  } else {
    // Look for any 4+ digit number with commas e.g. 450,000
    const numbersWithCommas = Array.from(cleanText.matchAll(/([0-9]{1,3}(?:,[0-9]{3})+)/g));
    if (numbersWithCommas.length > 0) {
      originalAmountString = numbersWithCommas[0][1];
      const rawVal = parseInt(originalAmountString.replace(/,/g, ''), 10);
      if (!isNaN(rawVal)) {
        amount = isToman ? rawVal : Math.round(rawVal / 10);
      }
    }
  }

  // 5. Extract Balance After (مانده)
  let balanceAfter: number | undefined;
  const balanceMatch = cleanText.match(/(?:مانده|موجودی)\s*[:=\-]?\s*([0-9,.]+)/);
  if (balanceMatch && balanceMatch[1]) {
    const rawBal = parseInt(balanceMatch[1].replace(/[,.]/g, ''), 10);
    if (!isNaN(rawBal)) {
      balanceAfter = isToman ? rawBal : Math.round(rawBal / 10);
    }
  }

  // 6. Extract Card / Account Number
  let cardOrAccount = '';
  const cardMatch = cleanText.match(/(?:کارت|حساب|از|به)\s*[:=\-]?\s*([0-9*xX\-]{4,20})/);
  if (cardMatch && cardMatch[1]) {
    cardOrAccount = cardMatch[1];
  }

  // 7. Extract Merchant / Payee / Store
  let merchantName = '';
  const merchantMatch = cleanText.match(/(?:فروشگاه|پذیرنده|خرید از|به نام|طرف حساب|دریافت‌کننده|ارسال‌کننده)\s*[:=\-]?\s*([^\n\r,]+)/);
  if (merchantMatch && merchantMatch[1]) {
    merchantName = merchantMatch[1].trim();
  } else {
    // Check known brands
    if (cleanText.includes('اسنپ') || cleanText.includes('snapp')) merchantName = 'اسنپ';
    else if (cleanText.includes('دیجی‌کالا') || cleanText.includes('دیجیکالا')) merchantName = 'دیجی‌کالا';
    else if (cleanText.includes('افق کوروش')) merchantName = 'افق کوروش';
    else if (cleanText.includes('هایپراستار') || cleanText.includes('هایپر استار')) merchantName = 'هایپراستار';
    else if (cleanText.includes('تپسی')) merchantName = 'تپسی';
    else if (cleanText.includes('داروخانه')) merchantName = 'داروخانه';
    else if (cleanText.includes('پمپ بنزین')) merchantName = 'جایگاه سوخت';
    else if (cleanText.includes('حقوق')) merchantName = 'حقوق و دستمزد';
    else if (cleanText.includes('قسط')) merchantName = 'قسط تسهیلات';
    else {
      merchantName = type === 'income' ? 'واریز کننده' : 'پذیرنده بانکی';
    }
  }

  // 8. Extract Jalali Date
  let jalaliDate = getTodayJalali();
  const dateMatch = cleanText.match(/(14[0-9]{2}[/-][0-9]{1,2}[/-][0-9]{1,2})/);
  if (dateMatch && dateMatch[1]) {
    jalaliDate = dateMatch[1].replace(/-/g, '/');
  } else {
    // 2-digit year like 03/07/02
    const shortDateMatch = cleanText.match(/([0-9]{2})[/-]([0-9]{1,2})[/-]([0-9]{1,2})/);
    if (shortDateMatch && parseInt(shortDateMatch[1], 10) >= 0 && parseInt(shortDateMatch[1], 10) <= 20) {
      jalaliDate = `14${shortDateMatch[1]}/${shortDateMatch[2].padStart(2, '0')}/${shortDateMatch[3].padStart(2, '0')}`;
    }
  }

  // 9. Extract Time
  let time = '';
  const timeMatch = cleanText.match(/([0-2]?[0-9]:[0-5][0-9])/);
  if (timeMatch && timeMatch[1]) {
    time = timeMatch[1];
  }

  // 10. Extract Tracking Code
  let trackingCode = '';
  const trackingMatch = cleanText.match(/(?:پیگیری|رهگیری|کد پیگیری|شناسه|مرجع|ارجاع)\s*[:=\-]?\s*([0-9]+)/);
  if (trackingMatch && trackingMatch[1]) {
    trackingCode = trackingMatch[1];
  }

  // 11. Category Inference
  let suggestedCategoryId = 'cat_other';
  let suggestedCategoryNameFa = 'سایر هزینه‌ها';

  const mLower = (merchantName + ' ' + cleanText).toLowerCase();
  if (type === 'income') {
    suggestedCategoryId = 'cat_salary';
    suggestedCategoryNameFa = 'حقوق و دستمزد';
  } else if (/سوپرمارکت|کوروش|هایپر|میوه|نان|رستوران|کافه|پیتزا|فست فود|خوراک|قصابی|شیرینی/.test(mLower)) {
    suggestedCategoryId = 'cat_food';
    suggestedCategoryNameFa = 'خوراک و سوپرمارکت';
  } else if (/اسنپ|تپسی|بنزین|سوخت|تاکسی|مترو|اتوبوس|عوارضی|تعمیرگاه|مکانیکی/.test(mLower)) {
    suggestedCategoryId = 'cat_transport';
    suggestedCategoryNameFa = 'حمل و نقل و خودرو';
  } else if (/داروخانه|پزشک|دکتر|بیمارستان|آزمایشگاه|کلینیک|دندانپزشکی/.test(mLower)) {
    suggestedCategoryId = 'cat_health';
    suggestedCategoryNameFa = 'سلامت و درمان';
  } else if (/دیجی‌کالا|پوشاک|لباس|کفش|فروشگاه|خرید اینترنتی|پاساژ|لوازم/.test(mLower)) {
    suggestedCategoryId = 'cat_shopping';
    suggestedCategoryNameFa = 'خرید و بازار';
  } else if (/قبض|برق|آب|گاز|تلفن|اینترنت|همراه اول|ایرانسل|شارژ/.test(mLower)) {
    suggestedCategoryId = 'cat_bills';
    suggestedCategoryNameFa = 'قبوض و ارتباطات';
  } else if (/اجاره|شارژ ساختمان|تعمیرات خانه/.test(mLower)) {
    suggestedCategoryId = 'cat_housing';
    suggestedCategoryNameFa = 'مسکن و شارژ';
  } else if (/قسط|وام|صندوق|بیمه/.test(mLower)) {
    suggestedCategoryId = 'cat_installments';
    suggestedCategoryNameFa = 'اقساط و بیمه';
  }

  // 12. Gregorian Date approximate
  const now = new Date();
  const gregorianDate = now.toISOString().split('T')[0];

  const description = `${type === 'income' ? 'واریز از' : 'خرید از'} ${merchantName || detectedBank} (${detectedBank})`;

  return {
    amount,
    originalAmountString,
    currencyUnit,
    type,
    merchantName,
    bankName: detectedBank,
    cardOrAccount,
    jalaliDate,
    gregorianDate,
    time,
    trackingCode,
    balanceAfter,
    suggestedCategoryId,
    suggestedCategoryNameFa,
    description,
    confidence: 0.85,
    source: 'smart-heuristic'
  };
}
