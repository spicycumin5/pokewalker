import { BIOME_PRIORITY, BIOME_TYPES, type Biome } from '@/data/biomes';
import type { Species } from '@/data/pokedex';

export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'VERY RARE' | 'LEGENDARY';

/** Capture rate doubles as encounter weight, so it maps straight to rarity. */
export function rarityOf(species: Species): Rarity {
  if (species.legendary) return 'LEGENDARY';
  if (species.captureRate >= 190) return 'COMMON';
  if (species.captureRate >= 100) return 'UNCOMMON';
  if (species.captureRate >= 45) return 'RARE';
  return 'VERY RARE';
}

/**
 * Biomes where a species can turn up, best odds first: any biome that weights
 * one of its types. Babies never appear in the wild (see encounter.ts).
 */
export function habitatsOf(species: Species): Biome[] {
  if (species.baby) return [];
  const score = (biome: Biome) =>
    Math.max(0, ...species.types.map((t) => BIOME_TYPES[biome][t] ?? 0));
  return BIOME_PRIORITY.filter((b) => score(b) > 0).sort((a, b) => score(b) - score(a));
}

export function dexNumber(id: number): string {
  return `#${String(id).padStart(3, '0')}`;
}
