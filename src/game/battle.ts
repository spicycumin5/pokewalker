import type { Rng } from './rng';

export const MAX_HP = 4;
const CRIT_CHANCE = 1 / 8;

export type BattleAction = 'attack' | 'evade' | 'catch';
export type BattleOutcome = 'caught' | 'fled' | 'fainted' | 'knockedOut';

export interface BattleState {
  playerHp: number;
  wildHp: number;
  /** Set by a successful Evade; boosts the next catch attempt. */
  distracted: boolean;
  outcome: BattleOutcome | null;
  /** Messages produced by the last turn, shown in order on the LCD. */
  log: string[];
}

export interface BattleContext {
  wildName: string;
  leadName: string;
  captureRate: number;
  leadLevel: number;
  wildLevel: number;
}

export function startBattle(ctx: BattleContext): BattleState {
  return {
    playerHp: MAX_HP,
    wildHp: MAX_HP,
    distracted: false,
    outcome: null,
    log: [`A wild ${ctx.wildName} appeared!`],
  };
}

/** Simplified Gen-3 catch formula on the 4-HP scale, as a probability. */
export function catchChance(state: BattleState, ctx: BattleContext): number {
  const a = ((3 * MAX_HP - 2 * state.wildHp) * ctx.captureRate) / (3 * MAX_HP);
  const levelBonus = Math.min(1.2, Math.max(0.8, 1 + (ctx.leadLevel - ctx.wildLevel) * 0.02));
  const distractBonus = state.distracted ? 1.5 : 1;
  return Math.min(1, Math.max(0.03, (a / 255) * levelBonus * distractBonus));
}

/** The wild Pokémon's turn: it may counter-attack or run. */
function wildTurn(
  s: BattleState,
  ctx: BattleContext,
  rng: Rng,
  odds: { counter: number; flee: number },
): BattleState {
  const roll = rng();
  if (roll < odds.flee) {
    return { ...s, outcome: 'fled', log: [...s.log, `${ctx.wildName} ran away!`] };
  }
  if (roll < odds.flee + odds.counter) {
    const playerHp = s.playerHp - 1;
    const log = [...s.log, `${ctx.wildName} attacked!`];
    if (playerHp <= 0) {
      return { ...s, playerHp: 0, outcome: 'fainted', log: [...log, `${ctx.leadName} is tired out...`] };
    }
    return { ...s, playerHp, log };
  }
  return s;
}

export function battleStep(
  state: BattleState,
  action: BattleAction,
  ctx: BattleContext,
  rng: Rng = Math.random,
): BattleState {
  if (state.outcome) return state;
  const s: BattleState = { ...state, log: [] };

  switch (action) {
    case 'attack': {
      const crit = rng() < CRIT_CHANCE;
      const wildHp = Math.max(0, s.wildHp - (crit ? 2 : 1));
      const log = [`${ctx.leadName} attacked!`, ...(crit ? ['A critical hit!'] : [])];
      if (wildHp === 0) {
        return { ...s, wildHp, distracted: false, outcome: 'knockedOut', log: [...log, `${ctx.wildName} fainted!`] };
      }
      return wildTurn({ ...s, wildHp, distracted: false, log }, ctx, rng, { counter: 0.45, flee: 0.1 });
    }

    case 'evade': {
      const distracted = rng() < 0.5;
      const log = [`${ctx.leadName} dodged!`, ...(distracted ? [`${ctx.wildName} is distracted!`] : [])];
      return wildTurn({ ...s, distracted, log }, ctx, rng, { counter: 0, flee: 0.05 });
    }

    case 'catch': {
      const chance = catchChance(state, ctx);
      if (rng() < chance) {
        return { ...s, outcome: 'caught', log: ['You threw a Poké Ball...', `Gotcha! ${ctx.wildName} was caught!`] };
      }
      return wildTurn(
        { ...s, distracted: false, log: ['You threw a Poké Ball...', 'Oh no! It broke free!'] },
        ctx,
        rng,
        { counter: 0.3, flee: 0.25 },
      );
    }
  }
}
