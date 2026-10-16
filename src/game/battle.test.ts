import { battleStep, catchChance, MAX_HP, startBattle, type BattleContext } from './battle';
import type { Rng } from './rng';

const ctx: BattleContext = {
  wildName: 'PIDGEY',
  leadName: 'CHIKORITA',
  captureRate: 255,
  leadLevel: 5,
  wildLevel: 5,
};

/** Returns the given rolls in order, then repeats the last one. */
const rolls = (...values: number[]): Rng => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};

describe('battleStep', () => {
  it('attack deals 1 damage; a quiet wild turn changes nothing else', () => {
    const s = battleStep(startBattle(ctx), 'attack', ctx, rolls(0.5, 0.99));
    expect(s.wildHp).toBe(MAX_HP - 1);
    expect(s.playerHp).toBe(MAX_HP);
    expect(s.outcome).toBeNull();
  });

  it('critical hits deal 2', () => {
    const s = battleStep(startBattle(ctx), 'attack', ctx, rolls(0.01, 0.99));
    expect(s.wildHp).toBe(MAX_HP - 2);
    expect(s.log).toContain('A critical hit!');
  });

  it('knocking the wild out ends the battle without a catch', () => {
    const s = battleStep({ ...startBattle(ctx), wildHp: 1 }, 'attack', ctx, rolls(0.5));
    expect(s.outcome).toBe('knockedOut');
  });

  it('wild counters can tire out the lead', () => {
    const s = battleStep({ ...startBattle(ctx), playerHp: 1 }, 'attack', ctx, rolls(0.5, 0.2));
    expect(s.playerHp).toBe(0);
    expect(s.outcome).toBe('fainted');
  });

  it('evade never takes damage and can distract', () => {
    const s = battleStep({ ...startBattle(ctx), playerHp: 1 }, 'evade', ctx, rolls(0.1, 0.5));
    expect(s.playerHp).toBe(1);
    expect(s.distracted).toBe(true);
    expect(s.outcome).toBeNull();
  });

  it('a successful catch ends in caught', () => {
    expect(battleStep(startBattle(ctx), 'catch', ctx, rolls(0)).outcome).toBe('caught');
  });

  it('a failed catch can make the wild flee', () => {
    const hard = { ...ctx, captureRate: 3 };
    expect(battleStep(startBattle(hard), 'catch', hard, rolls(0.99, 0.1)).outcome).toBe('fled');
  });

  it('is a no-op once the battle is over', () => {
    const over = { ...startBattle(ctx), outcome: 'caught' as const };
    expect(battleStep(over, 'attack', ctx, rolls(0))).toBe(over);
  });
});

describe('catchChance', () => {
  const hard = { ...ctx, captureRate: 45 };
  const base = startBattle(hard);

  it('rises as wild HP drops', () => {
    expect(catchChance({ ...base, wildHp: 1 }, hard)).toBeGreaterThan(catchChance(base, hard));
  });

  it('rises when the wild is distracted', () => {
    expect(catchChance({ ...base, distracted: true }, hard)).toBeGreaterThan(catchChance(base, hard));
  });

  it('stays within [0.03, 1]', () => {
    expect(catchChance(base, { ...ctx, captureRate: 3, leadLevel: 1, wildLevel: 99 })).toBe(0.03);
    expect(catchChance({ ...base, wildHp: 1, distracted: true }, ctx)).toBe(1);
  });
});
