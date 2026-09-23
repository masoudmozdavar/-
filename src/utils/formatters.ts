import { CurrencyType } from '../types';

export function toPersianDigits(n: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/[0-9]/g, (w) => persianDigits[+w]);
}

export function fromPersianDigits(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(persianDigits[i], String(i)).replaceAll(arabicDigits[i], String(i));
  }
  return res;
}

export function formatNumber(num: number, isPersianLang: boolean = true): string {
  if (isNaN(num)) return '0';
  const formatted = Math.round(num).toLocaleString('en-US');
  return isPersianLang ? toPersianDigits(formatted) : formatted;
}

export function formatCurrency(
  amount: number,
  currency: CurrencyType = 'toman',
  isPersianLang: boolean = true
): string {
  let displayAmount = amount;
  let unitName = 'تومان';

  switch (currency) {
    case 'rial':
      displayAmount = amount * 10; // Assuming base store is in Toman
      unitName = isPersianLang ? 'ریال' : 'IRR';
      break;
    case 'usd':
      displayAmount = amount;
      return isPersianLang 
        ? `${toPersianDigits(displayAmount.toLocaleString('en-US'))} دلار`
        : `$${displayAmount.toLocaleString('en-US')}`;
    case 'eur':
      displayAmount = amount;
      return isPersianLang
        ? `${toPersianDigits(displayAmount.toLocaleString('en-US'))} یورو`
        : `€${displayAmount.toLocaleString('en-US')}`;
    case 'toman':
    default:
      displayAmount = amount;
      unitName = isPersianLang ? 'تومان' : 'Toman';
      break;
  }

  const numStr = formatNumber(displayAmount, isPersianLang);
  return `${numStr} ${unitName}`;
}

export function formatCompactToman(amount: number, isPersianLang: boolean = true): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    const val = (amount / 1_000_000_000).toFixed(2).replace(/\.00$/, '');
    return isPersianLang ? `${toPersianDigits(val)} میلیارد ت` : `${val}B Toman`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    const val = (amount / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return isPersianLang ? `${toPersianDigits(val)} میلیون ت` : `${val}M Toman`;
  }
  if (Math.abs(amount) >= 1_000) {
    const val = (amount / 1_000).toFixed(0);
    return isPersianLang ? `${toPersianDigits(val)} هزار ت` : `${val}K Toman`;
  }
  return formatCurrency(amount, 'toman', isPersianLang);
}

export function formatCardNumber(cardNo?: string): string {
  if (!cardNo) return '';
  const clean = cardNo.replace(/\D/g, '');
  const matched = clean.match(/.{1,4}/g);
  return matched ? matched.join(' - ') : cardNo;
}

export function maskCardNumber(cardNo?: string): string {
  if (!cardNo) return '';
  const clean = cardNo.replace(/\D/g, '');
  if (clean.length < 16) return cardNo;
  return `${clean.slice(0, 4)} **** **** ${clean.slice(12)}`;
}
