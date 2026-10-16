import raw from './pokedex.json';

export type PokeType =
  | 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

export interface Species {
  id: number;
  name: string;
  types: PokeType[];
  /** 3 (legendaries) … 255 (Pidgey) — doubles as a rarity weight. */
  captureRate: number;
  legendary: boolean;
  baby: boolean;
}

export const pokedex = raw as Species[];

const byId = new Map(pokedex.map((s) => [s.id, s]));

export function getSpecies(id: number): Species {
  const s = byId.get(id);
  if (!s) throw new Error(`Unknown species ${id}`);
  return s;
}

/** HGSS starters offered on first launch. */
export const STARTERS = [152, 155, 158] as const;
