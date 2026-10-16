import { BIOME_PRIORITY, OSM_TAG_BIOMES, type Biome } from '@/data/biomes';

export interface OsmElement {
  tags?: Record<string, string>;
}

/** Picks the highest-priority biome found among nearby OSM features. */
export function classifyBiome(elements: OsmElement[], fallback: Biome = 'urban'): Biome {
  const found = new Set<Biome>();
  for (const el of elements) {
    if (!el.tags) continue;
    for (const [key, value] of Object.entries(el.tags)) {
      const biome = OSM_TAG_BIOMES[key]?.[value];
      if (biome) found.add(biome);
    }
  }
  return BIOME_PRIORITY.find((b) => found.has(b)) ?? fallback;
}
