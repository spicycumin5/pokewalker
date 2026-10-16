export type Rng = () => number;

/** 32-bit string hash (cyrb53, truncated) — stable seed from any string. */
export function hashString(str: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  return h1 >>> 0;
}

/** Deterministic PRNG (mulberry32) returning floats in [0, 1). */
export function seededRng(seed: number | string): Rng {
  let a = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Picks one item with probability proportional to its weight. */
export function weightedPick<T>(items: readonly T[], weight: (item: T) => number, rng: Rng): T {
  const total = items.reduce((sum, item) => sum + Math.max(0, weight(item)), 0);
  if (items.length === 0 || total <= 0) throw new Error('weightedPick: nothing to pick');
  let roll = rng() * total;
  for (const item of items) {
    roll -= Math.max(0, weight(item));
    if (roll < 0) return item;
  }
  return items[items.length - 1];
}

export function randInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
}
