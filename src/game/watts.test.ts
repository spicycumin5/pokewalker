import { creditSteps, DAILY_WATT_CAP, localDayKey, STEPS_PER_WATT, type StepLedger } from './watts';

const fresh = (day = '2026-10-15'): StepLedger => ({
  day,
  todaySteps: 0,
  totalSteps: 0,
  wattsToday: 0,
  stepRemainder: 0,
});

describe('creditSteps', () => {
  it('converts steps to watts and carries the remainder', () => {
    const { ledger, wattsEarned } = creditSteps(fresh(), 45, '2026-10-15');
    expect(wattsEarned).toBe(2);
    expect(ledger.stepRemainder).toBe(5);

    const next = creditSteps(ledger, 15, '2026-10-15');
    expect(next.wattsEarned).toBe(1);
    expect(next.ledger.stepRemainder).toBe(0);
    expect(next.ledger.todaySteps).toBe(60);
  });

  it('many small deltas earn the same as one big one', () => {
    let ledger = fresh();
    let total = 0;
    for (let i = 0; i < 100; i++) {
      const r = creditSteps(ledger, 7, '2026-10-15');
      ledger = r.ledger;
      total += r.wattsEarned;
    }
    expect(total).toBe(Math.floor(700 / STEPS_PER_WATT));
  });

  it('resets daily counters on a new day but keeps totals', () => {
    const day1 = creditSteps(fresh(), 1000, '2026-10-15').ledger;
    const day2 = creditSteps(day1, 100, '2026-10-16').ledger;
    expect(day2.todaySteps).toBe(100);
    expect(day2.totalSteps).toBe(1100);
    expect(day2.wattsToday).toBe(5);
  });

  it('caps watts per day', () => {
    const { wattsEarned, ledger } = creditSteps(fresh(), STEPS_PER_WATT * (DAILY_WATT_CAP + 50), '2026-10-15');
    expect(wattsEarned).toBe(DAILY_WATT_CAP);
    expect(creditSteps(ledger, 1000, '2026-10-15').wattsEarned).toBe(0);
  });

  it('ignores negative or fractional deltas', () => {
    expect(creditSteps(fresh(), -50, '2026-10-15').ledger.todaySteps).toBe(0);
    expect(creditSteps(fresh(), 20.9, '2026-10-15').ledger.todaySteps).toBe(20);
  });
});

it('localDayKey pads month and day', () => {
  expect(localDayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
});
