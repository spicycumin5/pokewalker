export const STEPS_PER_WATT = 20;
export const DAILY_WATT_CAP = 10_000;
export const SEARCH_COST = 10;

export interface StepLedger {
  /** Local date (YYYY-MM-DD) the daily counters belong to. */
  day: string;
  todaySteps: number;
  totalSteps: number;
  wattsToday: number;
  /** Steps not yet converted into a whole watt. */
  stepRemainder: number;
}

export function localDayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/**
 * Credits a batch of new steps. Callers pass deltas only (never cumulative
 * totals), so the same steps can never be counted twice.
 */
export function creditSteps(
  ledger: StepLedger,
  newSteps: number,
  today: string,
): { ledger: StepLedger; wattsEarned: number } {
  const steps = Math.max(0, Math.floor(newSteps));
  const base: StepLedger =
    ledger.day === today ? ledger : { ...ledger, day: today, todaySteps: 0, wattsToday: 0 };

  const pool = base.stepRemainder + steps;
  const rawWatts = Math.floor(pool / STEPS_PER_WATT);
  const wattsEarned = Math.min(rawWatts, Math.max(0, DAILY_WATT_CAP - base.wattsToday));

  return {
    wattsEarned,
    ledger: {
      day: today,
      todaySteps: base.todaySteps + steps,
      totalSteps: base.totalSteps + steps,
      wattsToday: base.wattsToday + wattsEarned,
      stepRemainder: pool % STEPS_PER_WATT,
    },
  };
}
