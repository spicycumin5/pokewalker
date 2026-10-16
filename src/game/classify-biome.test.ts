import { encodeGeohash } from '@/services/geohash';
import { classifyBiome, type OsmElement } from './classify-biome';

describe('classifyBiome', () => {
  it('falls back when nothing matches', () => {
    expect(classifyBiome([])).toBe('urban');
    expect(classifyBiome([{ tags: { natural: 'tree' } }], 'forest')).toBe('forest');
  });

  it('ignores ubiquitous tags like single trees', () => {
    expect(classifyBiome([{ tags: { natural: 'tree' } }, { tags: { landuse: 'residential' } }])).toBe('urban');
  });

  it('picks the highest-priority biome present', () => {
    const park: OsmElement[] = [{ tags: { leisure: 'park' } }, { tags: { landuse: 'residential' } }];
    expect(classifyBiome(park)).toBe('grassland');
    expect(classifyBiome([...park, { tags: { natural: 'water', water: 'pond' } }])).toBe('water');
  });

  it('does not treat sand (ball fields, playgrounds) as beach', () => {
    expect(classifyBiome([{ tags: { natural: 'sand' } }, { tags: { leisure: 'park' } }])).toBe('grassland');
  });

  // Tag sets recorded from real Overpass responses (Oct 2026).
  it('classifies recorded real-world spots', () => {
    const coneyIsland: OsmElement[] = [
      { tags: { natural: 'beach' } },
      { tags: { leisure: 'beach_resort' } },
      { tags: { landuse: 'commercial' } },
      { tags: { natural: 'coastline' } },
      { tags: { natural: 'bay' } },
    ];
    const greenWood: OsmElement[] = [{ tags: { natural: 'tree' } }, { tags: { landuse: 'cemetery' } }];
    const reservoir: OsmElement[] = [{ tags: { natural: 'water', water: 'reservoir' } }, { tags: { leisure: 'park' } }];
    expect(classifyBiome(coneyIsland)).toBe('beach');
    expect(classifyBiome(greenWood)).toBe('cemetery');
    expect(classifyBiome(reservoir)).toBe('water');
  });

  it('recognises cemeteries and power infrastructure', () => {
    expect(classifyBiome([{ tags: { landuse: 'cemetery' } }])).toBe('cemetery');
    expect(classifyBiome([{ tags: { power: 'substation' } }, { tags: { landuse: 'retail' } }])).toBe('industrial');
  });
});

describe('encodeGeohash', () => {
  it('matches the reference hash', () => {
    expect(encodeGeohash(57.64911, 10.40744, 11)).toBe('u4pruydqqvj');
  });

  it('puts points ~20 m apart in the same 7-char cell', () => {
    expect(encodeGeohash(40.7581, -73.9853)).toBe(encodeGeohash(40.7582, -73.9854));
  });
});
