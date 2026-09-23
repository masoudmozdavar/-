import { Category, Transaction, BudgetAlert, SmartBudgetProjectionAlert, CurrencyType } from '../types';
import { gregorianToJalali, getJalaliMonthDays } from './jalali';

/**
 * Smart Budget Forecast & Alert Engine
 * 
 * Analyzes historical daily run-rate within the current Jalali (or monthly) cycle
 * and projects end-of-month spending for every expense category.
 * 
 * If a category is projected to exceed its monthly limit before the month ends,
 * this engine generates a proactive warning alert with:
 * - Current spent vs monthly limit
 * - Projected total spent at the current spending velocity
 * - Estimated day when the budget will be breached
 * - Days remaining in the month
 * - Recommended daily spending cap to stay within budget
 * - Breakdown of spending contributions by family members
 */

export interface BudgetProjectionOptions {
  referenceDate?: Date;
}

export function analyzeSmartBudgetProjections(
  categories: Category[],
  transactions: Transaction[],
  currency: CurrencyType = 'toman',
  options?: BudgetProjectionOptions
): SmartBudgetProjectionAlert[] {
  const now = options?.referenceDate || new Date();
  const jNow = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  
  // Total days in current Jalali month (31, 30, or 29)
  const totalDaysInMonth = getJalaliMonthDays(jNow.jy, jNow.jm);
  // Current day elapsed in month (e.g., 21 if today is 21st)
  const currentDayOfMonth = Math.max(1, Math.min(jNow.jd, totalDaysInMonth));
  const daysRemainingInMonth = Math.max(0, totalDaysInMonth - currentDayOfMonth);

  // Consider transactions in the current 30-day window or current cycle
  const currentCycleStart = new Date(now);
  currentCycleStart.setDate(now.getDate() - currentDayOfMonth);
  currentCycleStart.setHours(0, 0, 0, 0);

  // Group expenses by category
  const categorySpentMap = new Map<string, number>();
  const categoryMemberContributions = new Map<string, Map<string, { memberName: string; amount: number; memberRole?: string }>>();

  transactions.forEach((tx) => {
    if (tx.type !== 'expense') return;
    const txDate = new Date(tx.date);
    
    // We analyze recent spending in the current month window (at least current day count or last 30 days)
    const daysAgo = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo >= 0 && daysAgo <= Math.max(30, currentDayOfMonth)) {
      const currentSpent = categorySpentMap.get(tx.categoryId) || 0;
      categorySpentMap.set(tx.categoryId, currentSpent + tx.amount);

      // Track family member contribution
      const memberId = tx.memberId || 'head';
      const memberName = tx.memberName || (memberId === 'head' ? 'سرپرست' : 'عضو خانواده');
      const memberRole = tx.memberRole || (memberId === 'head' ? 'head' : 'member');

      if (!categoryMemberContributions.has(tx.categoryId)) {
        categoryMemberContributions.set(tx.categoryId, new Map());
      }
      const memberMap = categoryMemberContributions.get(tx.categoryId)!;
      const prevContribution = memberMap.get(memberId) || { memberName, amount: 0, memberRole };
      prevContribution.amount += tx.amount;
      memberMap.set(memberId, prevContribution);
    }
  });

  const alerts: SmartBudgetProjectionAlert[] = [];

  categories.forEach((cat) => {
    // Only analyze expense categories with a configured positive monthly budget
    if (cat.type !== 'expense' || !cat.budgetMonthly || cat.budgetMonthly <= 0) {
      return;
    }

    const currentSpent = categorySpentMap.get(cat.id) || 0;
    const monthlyLimit = cat.budgetMonthly;
    const currentPercentage = Math.round((currentSpent / monthlyLimit) * 100);

    // Run-rate calculations
    // Effective days passed (at least 5 days to normalize early month spike noise)
    const effectiveDaysPassed = Math.max(5, currentDayOfMonth);
    const dailyAverage = currentSpent / effectiveDaysPassed;

    // Projected total spending by end of month:
    // currentSpent + (dailyAverage * daysRemaining)
    const projectedEndMonthSpent = Math.round(currentSpent + (dailyAverage * daysRemainingInMonth));
    const projectedExcessAmount = Math.max(0, projectedEndMonthSpent - monthlyLimit);
    const projectedPercentage = Math.round((projectedEndMonthSpent / monthlyLimit) * 100);

    // Days until limit breach:
    // If dailyAverage > 0, how many days will the remaining budget last?
    const remainingBudget = Math.max(0, monthlyLimit - currentSpent);
    let projectedDaysUntilBreach: number | null = null;
    let projectedBreachDayOfMonth: number | null = null;

    if (dailyAverage > 0 && remainingBudget > 0) {
      const daysToRunOut = Math.floor(remainingBudget / dailyAverage);
      projectedDaysUntilBreach = Math.max(1, daysToRunOut);
      projectedBreachDayOfMonth = Math.min(totalDaysInMonth, currentDayOfMonth + daysToRunOut);
    } else if (remainingBudget <= 0) {
      projectedDaysUntilBreach = 0;
      projectedBreachDayOfMonth = currentDayOfMonth;
    }

    // Recommended daily cap to finish month on budget
    const recommendedDailyCap = daysRemainingInMonth > 0 
      ? Math.max(0, Math.floor(remainingBudget / daysRemainingInMonth)) 
      : 0;

    // Determine alert status:
    // 1. 'exceeded': already past 100%
    // 2. 'projected_breach': not yet exceeded, but pace predicts it will breach (> 100%) before month ends
    // 3. 'high_burn': pace predicts >= 90% of budget will be consumed
    let isAlertEligible = false;
    let severity: 'critical' | 'warning' | 'info' = 'info';

    if (currentSpent >= monthlyLimit) {
      isAlertEligible = true;
      severity = 'critical';
    } else if (projectedEndMonthSpent > monthlyLimit && projectedDaysUntilBreach !== null && projectedDaysUntilBreach <= daysRemainingInMonth) {
      // Proactive warning: it WILL exceed before month end if velocity continues!
      isAlertEligible = true;
      severity = projectedDaysUntilBreach <= 5 ? 'critical' : 'warning';
    } else if (projectedPercentage >= 90) {
      // Proactive near-breach warning
      isAlertEligible = true;
      severity = 'warning';
    }

    if (!isAlertEligible) return;

    // Build member contributions list
    const memberMap = categoryMemberContributions.get(cat.id);
    const topMembers = memberMap 
      ? Array.from(memberMap.entries())
          .map(([id, info]) => ({
            memberId: id,
            memberName: info.memberName,
            amount: info.amount,
            percentage: currentSpent > 0 ? Math.round((info.amount / currentSpent) * 100) : 0,
          }))
          .sort((a, b) => b.amount - a.amount)
      : [];

    alerts.push({
      id: `smart-budget-${cat.id}`,
      categoryId: cat.id,
      categoryName: cat.name,
      categoryNameEn: cat.nameEn,
      icon: cat.icon,
      color: cat.color,
      monthlyLimit,
      currentSpent,
      currentPercentage,
      dailyAverage: Math.round(dailyAverage),
      projectedEndMonthSpent,
      projectedExcessAmount,
      projectedPercentage,
      daysRemainingInMonth,
      currentDayOfMonth,
      totalDaysInMonth,
      projectedDaysUntilBreach,
      projectedBreachDayOfMonth,
      recommendedDailyCap,
      severity,
      isAlreadyExceeded: currentSpent >= monthlyLimit,
      topContributingMembers: topMembers,
    });
  });

  // Sort by severity (critical first), then by projectedPercentage descending
  return alerts.sort((a, b) => {
    const sA = a.severity === 'critical' ? 3 : a.severity === 'warning' ? 2 : 1;
    const sB = b.severity === 'critical' ? 3 : b.severity === 'warning' ? 2 : 1;
    if (sA !== sB) return sB - sA;
    return b.projectedPercentage - a.projectedPercentage;
  });
}
