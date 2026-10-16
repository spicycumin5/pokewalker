import { BIOME_PRIORITY, BIOME_TYPES } from '@/data/biomes';
import { getSpecies } from '@/data/pokedex';
import { localCast, LOCALS_PER_TYPE, rollEncounter } from './encounter';
import { seededRng } from './rng';

describe('localCast', () => {
  it('is stable for the same spot and day', () => {
    const a = localCast('grassland', 'dr5ru7c', '2026-10-15');
    const b = localCast('grassland', 'dr5ru7c', '2026-10-15');
    expect([...a].map(([t, l]) => [t, l.map((s) => s.id)])).toEqual([...b].map(([t, l]) => [t, l.map((s) => s.id)]));
  });

  it('changes between days', () => {
    const ids = (day: string) =>
      [...localCast('grassland', 'dr5ru7c', day).values()].flat().map((s) => s.id).join();
    expect(ids('2026-10-15')).not.toEqual(ids('2026-10-16'));
  });

  it.each(BIOME_PRIORITY)('%s: every listed type has locals of that type, no legendaries', (biome) => {
    const cast = localCast(biome, 'u4pruyd', '2026-10-15');
    for (const type of Object.keys(BIOME_TYPES[biome])) {
      const list = cast.get(type as never)!;
      expect(list.length).toBeGreaterThan(0);
      expect(list.length).toBeLessThanOrEqual(LOCALS_PER_TYPE);
      for (const s of list) {
        expect(s.types).toContain(type);
        expect(s.legendary).toBe(false);
      }
    }
  });
});

describe('rollEncounter', () => {
  it('mostly yields species of the biome’s weighted types', () => {
    const rng = seededRng(42);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 2000; i++) {
      const e = rollEncounter({ biome: 'water', geohash: 'dr5ruvq', day: '2026-10-15', leadLevel: 10, rng });
      for (const t of getSpecies(e.speciesId).types) counts[t] = (counts[t] ?? 0) + 1;
    }
    expect(counts.water).toBeGreaterThan(1000);
    expect(counts.fire ?? 0).toBeLessThan(counts.water / 10);
  });

  it('scales level to the lead and clamps to 2..100', () => {
    const rng = seededRng(7);
    for (let i = 0; i < 200; i++) {
      const e = rollEncounter({ biome: 'urban', geohash: 'x', day: 'd', leadLevel: 3, rng });
      expect(e.level).toBeGreaterThanOrEqual(2);
      expect(e.level).toBeLessThanOrEqual(100);
    }
  });
});
