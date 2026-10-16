import type { PokeType } from './pokedex';

export type Biome =
  | 'water'
  | 'beach'
  | 'mountain'
  | 'forest'
  | 'wetland'
  | 'grassland'
  | 'farmland'
  | 'cemetery'
  | 'industrial'
  | 'urban';

/**
 * Highest priority first: the first biome present nearby wins. Beach outranks
 * water because every beach has sea next to it.
 */
export const BIOME_PRIORITY: Biome[] = [
  'beach',
  'water',
  'mountain',
  'forest',
  'wetland',
  'grassland',
  'farmland',
  'cemetery',
  'industrial',
  'urban',
];

export const BIOME_LABEL: Record<Biome, string> = {
  water: 'Lakeside',
  beach: 'Beach',
  mountain: 'Rocky Hills',
  forest: 'Forest',
  wetland: 'Marsh',
  grassland: 'Meadow',
  farmland: 'Farmland',
  cemetery: 'Old Grounds',
  industrial: 'Power Plant',
  urban: 'Town',
};

export const BIOME_TYPES: Record<Biome, Partial<Record<PokeType, number>>> = {
  water: { water: 60, flying: 20, ice: 8, normal: 8, dragon: 2 },
  beach: { water: 40, rock: 20, ground: 20, flying: 15, ice: 5 },
  mountain: { rock: 35, ground: 30, fighting: 15, steel: 10, ice: 5, dragon: 5 },
  forest: { bug: 35, grass: 30, poison: 10, normal: 10, flying: 10, dark: 5 },
  wetland: { water: 30, poison: 25, grass: 20, bug: 15, ground: 10 },
  grassland: { grass: 30, bug: 25, normal: 25, fairy: 10, flying: 10 },
  farmland: { normal: 35, grass: 20, ground: 20, bug: 15, fire: 10 },
  cemetery: { ghost: 40, dark: 25, poison: 20, psychic: 15 },
  industrial: { electric: 35, steel: 25, poison: 20, fire: 15, fighting: 5 },
  urban: { normal: 35, psychic: 15, fighting: 15, poison: 15, electric: 10, fire: 10 },
};

/**
 * OSM tag value → biome. Only listed values count, so ubiquitous tags such as
 * natural=tree don't turn every city block into a forest. natural=sand is left
 * out on purpose: it's mostly baseball infields and playgrounds.
 *
 * Small features (gardens, pitches, grass verges, churches, streams) only count
 * within a few metres — see the query in services/terrain.ts.
 */
export const OSM_TAG_BIOMES: Record<string, Record<string, Biome>> = {
  natural: {
    water: 'water',
    bay: 'water',
    spring: 'water',
    beach: 'beach',
    coastline: 'beach',
    peak: 'mountain',
    cave_entrance: 'mountain',
    cliff: 'mountain',
    bare_rock: 'mountain',
    scree: 'mountain',
    ridge: 'mountain',
    wood: 'forest',
    wetland: 'wetland',
    grassland: 'grassland',
    scrub: 'grassland',
    heath: 'grassland',
  },
  waterway: {
    river: 'water',
    stream: 'water',
    canal: 'water',
  },
  landuse: {
    reservoir: 'water',
    basin: 'water',
    quarry: 'mountain',
    forest: 'forest',
    meadow: 'grassland',
    grass: 'grassland',
    recreation_ground: 'grassland',
    village_green: 'grassland',
    farmland: 'farmland',
    farmyard: 'farmland',
    orchard: 'farmland',
    vineyard: 'farmland',
    allotments: 'farmland',
    cemetery: 'cemetery',
    industrial: 'industrial',
    railway: 'industrial',
    construction: 'industrial',
    residential: 'urban',
    commercial: 'urban',
    retail: 'urban',
  },
  leisure: {
    park: 'grassland',
    garden: 'grassland',
    nature_reserve: 'grassland',
    pitch: 'grassland',
    golf_course: 'grassland',
    beach_resort: 'beach',
    marina: 'water',
  },
  amenity: {
    grave_yard: 'cemetery',
    place_of_worship: 'cemetery',
  },
  power: {
    plant: 'industrial',
    substation: 'industrial',
    generator: 'industrial',
  },
};
