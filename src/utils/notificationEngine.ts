import { 
  CheckItem, 
  LoanItem, 
  DebtItem, 
  Category,
  Transaction,
  FinanceNotification, 
  NotificationPriority,
  CurrencyType
} from '../types';
import { getDaysRemaining, gregorianToJalali, getJalaliMonthDays, formatToGregorianISO } from './jalali';
import { formatCurrency, toPersianDigits } from './formatters';

const PRIORITY_SCORES: Record<NotificationPriority, number> = {
  critical: 4,
  urgent: 3,
  warning: 2,
  info: 1,
};

export function generatePrioritizedNotifications(
  checks: CheckItem[],
  loans: LoanItem[],
  debts: DebtItem[],
  currency: CurrencyType = 'toman',
  categories?: Category[],
  transactions?: Transaction[]
): FinanceNotification[] {
  const notifications: FinanceNotification[] = [];
  const now = new Date();
  const jToday = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());

  // 1. Category Monthly Budget 80% & 100% Real-time Warning Alerts
  if (categories && transactions) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const spentMap = new Map<string, number>();
    transactions.forEach(t => {
      if (t.type === 'expense') {
        const d = new Date(t.date);
        if (d >= thirtyDaysAgo) {
          spentMap.set(t.categoryId, (spentMap.get(t.categoryId) || 0) + t.amount);
        }
      }
    });

    categories.forEach(cat => {
      if (cat.type === 'expense' && cat.budgetMonthly && cat.budgetMonthly > 0) {
        const spent = spentMap.get(cat.id) || 0;
        const limit = cat.budgetMonthly;
        const pct = Math.round((spent / limit) * 100);

        if (pct >= 80) {
          const isOver = spent >= limit;
          const priority: NotificationPriority = isOver ? 'critical' : 'urgent';
          const excess = spent - limit;

          notifications.push({
            id: `notif-budget-${cat.id}`,
            category: 'budget_warning',
            priority,
            title: isOver 
              ? `تجاوز از سقف بودجه: ${cat.name} (${toPersianDigits(pct)}٪)`
              : `هشدار مصرف بیش از ۸۰٪ بودجه: ${cat.name} (${toPersianDigits(pct)}٪)`,
            titleEn: isOver 
              ? `Budget Exceeded: ${cat.nameEn || cat.name} (${pct}%)`
              : `Budget Warning (80%+): ${cat.nameEn || cat.name} (${pct}%)`,
            description: isOver
              ? `مجموع مخارج دسته «${cat.name}» به ${formatCurrency(spent, currency, true)} رسیده و ${formatCurrency(excess, currency, true)} از سقف تعیین‌شده بیشتر است!`
              : `مخارج دسته «${cat.name}» به ${formatCurrency(spent, currency, true)} (${toPersianDigits(pct)}٪ از سقف ${formatCurrency(limit, currency, true)}) رسیده است. با احتیاط خرج کنید.`,
            descriptionEn: isOver
              ? `Spending in ${cat.nameEn || cat.name} is ${formatCurrency(spent, currency, false)}, exceeding limit by ${formatCurrency(excess, currency, false)}.`
              : `Spending in ${cat.nameEn || cat.name} reached ${pct}% of monthly limit (${formatCurrency(spent, currency, false)} / ${formatCurrency(limit, currency, false)}).`,
            amount: spent,
            dueDate: new Date().toISOString(),
            dueJalaliDate: `${jToday.jy}/${String(jToday.jm).padStart(2, '0')}/${String(jToday.jd).padStart(2, '0')}`,
            daysDiff: 0,
            relatedEntityId: cat.id,
            actionType: 'view_budget',
            actionTargetTab: 'dashboard',
          });
        }
      }
    });
  }

  // 1. Checks Notifications
  checks.forEach((chk) => {
    if (chk.status !== 'pending') return;

    const days = getDaysRemaining(chk.dueDate);
    const isIssued = chk.type === 'issued';
    const typeTitleFa = isIssued ? 'چک صادره' : 'چک دریافتی';
    const typeTitleEn = isIssued ? 'Issued Check' : 'Received Check';

    let priority: NotificationPriority | null = null;
    let titleFa = '';
    let titleEn = '';
    let descFa = '';
    let descEn = '';

    if (days < 0) {
      priority = 'critical';
      const absDays = Math.abs(days);
      titleFa = `چک سررسید گذشته (${typeTitleFa})`;
      titleEn = `Overdue ${typeTitleEn}`;
      descFa = `چک به مبلغ ${formatCurrency(chk.amount, currency, true)} نزد ${chk.bankName} (${chk.recipientOrPayer}) ${toPersianDigits(absDays)} روز پیش سررسید شده و هنوز تعیین‌تکلیف نشده است!`;
      descEn = `${typeTitleEn} of ${formatCurrency(chk.amount, currency, false)} at ${chk.bankName} was due ${absDays} days ago!`;
    } else if (days === 0) {
      priority = 'urgent';
      titleFa = `سررسید امروز (${typeTitleFa})`;
      titleEn = `Due Today: ${typeTitleEn}`;
      descFa = `سررسید چک به مبلغ ${formatCurrency(chk.amount, currency, true)} (${chk.recipientOrPayer}) امروز است. موجودی حساب را کنترل نمایید.`;
      descEn = `${typeTitleEn} of ${formatCurrency(chk.amount, currency, false)} is due today!`;
    } else if (days <= 3) {
      priority = 'warning';
      titleFa = `سررسید نزدیک (${typeTitleFa} - ${toPersianDigits(days)} روز دیگر)`;
      titleEn = `Upcoming in ${days} days: ${typeTitleEn}`;
      descFa = `چک شماره ${chk.checkNumber} به مبلغ ${formatCurrency(chk.amount, currency, true)} تا ${toPersianDigits(days)} روز دیگر (${chk.dueJalaliDate}) موعد وصول دارد.`;
      descEn = `${typeTitleEn} of ${formatCurrency(chk.amount, currency, false)} is due in ${days} days.`;
    } else if (days <= 7) {
      priority = 'info';
      titleFa = `یادآوری ${typeTitleFa} هفته جاری`;
      titleEn = `Upcoming this week: ${typeTitleEn}`;
      descFa = `چک ${chk.recipientOrPayer} به مبلغ ${formatCurrency(chk.amount, currency, true)} تا ${toPersianDigits(days)} روز دیگر سررسید می‌شود.`;
      descEn = `${typeTitleEn} of ${formatCurrency(chk.amount, currency, false)} is due in ${days} days.`;
    }

    if (priority) {
      notifications.push({
        id: `notif-chk-${chk.id}`,
        category: isIssued ? 'check_issued' : 'check_received',
        priority,
        title: titleFa,
        titleEn,
        description: descFa,
        descriptionEn: descEn,
        amount: chk.amount,
        dueDate: chk.dueDate,
        dueJalaliDate: chk.dueJalaliDate,
        daysDiff: days,
        relatedEntityId: chk.id,
        actionType: 'clear_check',
        actionTargetTab: 'checks_loans',
      });
    }
  });

  // 2. Loans Installments Notifications
  loans.forEach((loan) => {
    if (loan.paidInstallments >= loan.totalInstallments) return;

    const maxDays = getJalaliMonthDays(jToday.jy, jToday.jm);
    const targetDay = Math.min(loan.dueDayOfMonth, maxDays);
    const targetIsoDate = formatToGregorianISO(jToday.jy, jToday.jm, targetDay);
    const days = getDaysRemaining(targetIsoDate);

    let priority: NotificationPriority | null = null;
    let titleFa = '';
    let titleEn = '';
    let descFa = '';
    let descEn = '';

    if (days < 0 && days >= -14) {
      priority = 'critical';
      const absDays = Math.abs(days);
      titleFa = `قسط معوقه وام ${loan.bankName}`;
      titleEn = `Overdue Installment - ${loan.bankName}`;
      descFa = `موعد قسط ${toPersianDigits(loan.paidInstallments + 1)} از ${toPersianDigits(loan.totalInstallments)} وام "${loan.title}" (${formatCurrency(loan.monthlyPayment, currency, true)}) ${toPersianDigits(absDays)} روز پیش بوده است.`;
      descEn = `Installment ${loan.paidInstallments + 1}/${loan.totalInstallments} of "${loan.title}" (${formatCurrency(loan.monthlyPayment, currency, false)}) was due ${absDays} days ago.`;
    } else if (days === 0) {
      priority = 'urgent';
      titleFa = `سررسید قسط وام امروز (${loan.title})`;
      titleEn = `Loan Installment Due Today`;
      descFa = `امروز موعد پرداخت قسط به مبلغ ${formatCurrency(loan.monthlyPayment, currency, true)} نزد ${loan.bankName} می‌باشد.`;
      descEn = `Loan installment of ${formatCurrency(loan.monthlyPayment, currency, false)} is due today.`;
    } else if (days > 0 && days <= 3) {
      priority = 'warning';
      titleFa = `موعد قسط وام (${toPersianDigits(days)} روز دیگر)`;
      titleEn = `Loan Installment in ${days} days`;
      descFa = `قسط ماهیانه وام "${loan.title}" به مبلغ ${formatCurrency(loan.monthlyPayment, currency, true)} تا ${toPersianDigits(days)} روز دیگر باید واریز شود.`;
      descEn = `Installment of ${formatCurrency(loan.monthlyPayment, currency, false)} for "${loan.title}" is due in ${days} days.`;
    } else if (days > 3 && days <= 7) {
      priority = 'info';
      titleFa = `یادآوری قسط وام ${loan.bankName}`;
      titleEn = `Upcoming Loan Installment`;
      descFa = `سررسید قسط وام "${loan.title}" به مبلغ ${formatCurrency(loan.monthlyPayment, currency, true)} تا ${toPersianDigits(days)} روز آینده است.`;
      descEn = `Installment for "${loan.title}" is due in ${days} days.`;
    }

    if (priority) {
      notifications.push({
        id: `notif-loan-${loan.id}`,
        category: 'loan_installment',
        priority,
        title: titleFa,
        titleEn,
        description: descFa,
        descriptionEn: descEn,
        amount: loan.monthlyPayment,
        dueDate: targetIsoDate,
        dueJalaliDate: `${jToday.jy}/${String(jToday.jm).padStart(2, '0')}/${String(targetDay).padStart(2, '0')}`,
        daysDiff: days,
        relatedEntityId: loan.id,
        actionType: 'pay_loan',
        actionTargetTab: 'checks_loans',
      });
    }
  });

  // 3. Debts & Receivables Notifications
  debts.forEach((debt) => {
    if (debt.isSettled) return;
    if (!debt.dueDate) return;

    const days = getDaysRemaining(debt.dueDate);
    const isPayable = debt.type === 'debt';
    const remainingAmount = Math.max(0, debt.totalAmount - debt.paidAmount);
    const typeFa = isPayable ? 'بدهی به' : 'طلب از';
    const typeEn = isPayable ? 'Debt to' : 'Receivable from';

    let priority: NotificationPriority | null = null;
    let titleFa = '';
    let titleEn = '';
    let descFa = '';
    let descEn = '';

    if (days < 0) {
      priority = 'critical';
      const absDays = Math.abs(days);
      titleFa = `سررسید گذشته: ${typeFa} ${debt.personName}`;
      titleEn = `Overdue: ${typeEn} ${debt.personName}`;
      descFa = `موعد ${isPayable ? 'تسویه بدهی' : 'وصول طلب'} به مبلغ مانده ${formatCurrency(remainingAmount, currency, true)} ${toPersianDigits(absDays)} روز پیش گذشته است.`;
      descEn = `${typeEn} ${debt.personName} of ${formatCurrency(remainingAmount, currency, false)} was due ${absDays} days ago.`;
    } else if (days === 0) {
      priority = 'urgent';
      titleFa = `موعد ${isPayable ? 'پرداخت بدهی' : 'وصول طلب'} امروز`;
      titleEn = `Due Today: ${typeEn} ${debt.personName}`;
      descFa = `امروز موعد ${isPayable ? 'پرداخت' : 'دریافت'} مبلغ ${formatCurrency(remainingAmount, currency, true)} مربوط به ${debt.personName} است.`;
      descEn = `Due today: ${formatCurrency(remainingAmount, currency, false)} for ${debt.personName}.`;
    } else if (days <= 3) {
      priority = 'warning';
      titleFa = `سررسید نزدیک: ${typeFa} ${debt.personName}`;
      titleEn = `Due in ${days} days: ${typeEn} ${debt.personName}`;
      descFa = `تا ${toPersianDigits(days)} روز دیگر موعد تسویه ${formatCurrency(remainingAmount, currency, true)} با ${debt.personName} فرا می‌رسد.`;
      descEn = `${formatCurrency(remainingAmount, currency, false)} with ${debt.personName} is due in ${days} days.`;
    } else if (days <= 7) {
      priority = 'info';
      titleFa = `یادآوری ${isPayable ? 'بدهی' : 'طلب'} هفته جاری`;
      titleEn = `Upcoming this week: ${typeEn} ${debt.personName}`;
      descFa = `موعد ${formatCurrency(remainingAmount, currency, true)} تا ${toPersianDigits(days)} روز آینده می‌باشد (${debt.dueJalaliDate || ''}).`;
      descEn = `Upcoming in ${days} days: ${formatCurrency(remainingAmount, currency, false)}.`;
    }

    if (priority) {
      notifications.push({
        id: `notif-debt-${debt.id}`,
        category: isPayable ? 'debt_payment' : 'receivable_collection',
        priority,
        title: titleFa,
        titleEn,
        description: descFa,
        descriptionEn: descEn,
        amount: remainingAmount,
        dueDate: debt.dueDate,
        dueJalaliDate: debt.dueJalaliDate,
        daysDiff: days,
        relatedEntityId: debt.id,
        actionType: 'pay_debt',
        actionTargetTab: 'checks_loans',
      });
    }
  });

  // Sort by priority descending (critical first), then by daysDiff ascending, then by amount descending
  return notifications.sort((a, b) => {
    const pA = PRIORITY_SCORES[a.priority];
    const pB = PRIORITY_SCORES[b.priority];
    if (pA !== pB) return pB - pA;
    if (a.daysDiff !== b.daysDiff) return a.daysDiff - b.daysDiff;
    return b.amount - a.amount;
  });
}
