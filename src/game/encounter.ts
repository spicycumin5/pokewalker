import { BIOME_TYPES, type Biome } from '@/data/biomes';
import { pokedex, type PokeType, type Species } from '@/data/pokedex';
import { randInt, seededRng, weightedPick, type Rng } from './rng';

/** How many "local" species of each type live at a spot on a given day. */
export const LOCALS_PER_TYPE = 5;
/** Chance per search of a type-matching legendary instead of a local. */
export const LEGENDARY_CHANCE = 1 / 500;

export interface Encounter {
  speciesId: number;
  level: number;
  biome: Biome;
}

const commons = pokedex.filter((s) => !s.legendary && !s.baby);
const legendaries = pokedex.filter((s) => s.legendary);

function ofType(list: Species[], type: PokeType) {
  return list.filter((s) => s.types.includes(type));
}

/**
 * The stable cast of species at a geohash cell for a day, grouped by type.
 * Same spot + same day → same locals, so a park feels consistent.
 */
export function localCast(biome: Biome, geohash: string, day: string): Map<PokeType, Species[]> {
  const cast = new Map<PokeType, Species[]>();
  for (const type of Object.keys(BIOME_TYPES[biome]) as PokeType[]) {
    const rng = seededRng(`${geohash}|${day}|${type}`);
    const pool = [...ofType(commons, type)];
    const picked: Species[] = [];
    while (picked.length < LOCALS_PER_TYPE && pool.length > 0) {
      const s = weightedPick(pool, (p) => p.captureRate, rng);
      picked.push(s);
      pool.splice(pool.indexOf(s), 1);
    }
    if (picked.length > 0) cast.set(type, picked);
  }
  return cast;
}

export function encounterLevel(leadLevel: number | undefined, rng: Rng): number {
  if (leadLevel === undefined) return randInt(3, 8, rng);
  return Math.max(2, Math.min(100, leadLevel + randInt(-4, 2, rng)));
}

export function rollEncounter(opts: {
  biome: Biome;
  geohash: string;
  day: string;
  leadLevel?: number;
  rng?: Rng;
}): Encounter {
  const rng = opts.rng ?? Math.random;
  const typeWeights = BIOME_TYPES[opts.biome];
  const level = encounterLevel(opts.leadLevel, rng);

  if (rng() < LEGENDARY_CHANCE) {
    const matching = legendaries.filter((s) => s.types.some((t) => t in typeWeights));
    if (matching.length > 0) {
      const s = matching[Math.floor(rng() * matching.length)];
      return { speciesId: s.id, level: Math.max(level, 40), biome: opts.biome };
    }
  }

  const cast = localCast(opts.biome, opts.geohash, opts.day);
  const types = [...cast.keys()];
  const type = weightedPick(types, (t) => typeWeights[t] ?? 0, rng);
  const species = weightedPick(cast.get(type)!, (s) => s.captureRate, rng);
  return { speciesId: species.id, level, biome: opts.biome };
}
