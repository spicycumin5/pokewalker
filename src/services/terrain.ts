import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { Biome } from '@/data/biomes';
import { classifyBiome, type OsmElement } from '@/game/classify-biome';

/**
 * Main server first, then a mirror: both rate-limit and 502 now and then. The
 * mirror has no area index (is_in fails with a 500), so it gets the query
 * without the containing-area part.
 */
const OVERPASS_SERVERS = [
  { url: 'https://overpass-api.de/api/interpreter', areas: true },
  { url: 'https://overpass.private.coffee/api/interpreter', areas: false },
];
/**
 * overpass-api.de answers 406 to requests without a descriptive User-Agent.
 * Browsers turn a custom User-Agent into a CORS preflight that mirrors reject,
 * so it is only sent from native.
 */
const HEADERS: Record<string, string> = {
  'Content-Type': 'application/x-www-form-urlencoded',
  ...(Platform.OS === 'web' ? {} : { 'User-Agent': 'PokeWalker/0.1 (personal hobby app)' }),
};
const REQUEST_TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RADIUS_M = 100;
const SMALL_RADIUS_M = 25;

export interface TerrainResult {
  biome: Biome;
  source: 'cache' | 'network' | 'fallback';
}

/**
 * Features within RADIUS_M; small features (a plaza garden, a church, a grass
 * verge, a stream) only within SMALL_RADIUS_M, so one flowerbed doesn't turn
 * Times Square into a meadow. Plus any area the point sits inside: `around`
 * alone misses the middle of a large park whose edges are far away.
 */
function buildQuery(lat: number, lon: number, areas: boolean): string {
  const near = `(around:${RADIUS_M},${lat},${lon})`;
  const close = `(around:${SMALL_RADIUS_M},${lat},${lon})`;
  return `[out:json][timeout:15];
(
  nwr${near}[natural];
  nwr${near}[waterway~"^(river|canal)$"];
  nwr${near}[landuse][landuse!=grass];
  nwr${near}[leisure][leisure!~"^(garden|pitch)$"];
  nwr${near}[power~"^(plant|substation|generator)$"];
  nwr${close}[waterway=stream];
  nwr${close}[landuse=grass];
  nwr${close}[leisure~"^(garden|pitch)$"];
  nwr${close}[amenity~"^(grave_yard|place_of_worship)$"];
);
out tags;${areas ? containingAreas(lat, lon) : ''}`;
}

function containingAreas(lat: number, lon: number): string {
  return `
is_in(${lat},${lon})->.a;
area.a[~"^(natural|landuse|leisure|amenity)$"~"."];
out tags;`;
}

const cacheKey = (geohash: string) => `terrain:${geohash}`;

export async function lookupBiome(
  lat: number,
  lon: number,
  geohash: string,
  fallback: Biome = 'urban',
): Promise<TerrainResult> {
  try {
    const cached = await AsyncStorage.getItem(cacheKey(geohash));
    if (cached) {
      const { biome, at } = JSON.parse(cached) as { biome: Biome; at: number };
      if (Date.now() - at < CACHE_TTL_MS) return { biome, source: 'cache' };
    }
  } catch {
    // Corrupt cache entry — fall through to a fresh lookup.
  }

  for (const { url, areas } of OVERPASS_SERVERS) {
    try {
      const body = `data=${encodeURIComponent(buildQuery(lat, lon, areas))}`;
      const elements = await queryOverpass(url, body);
      const biome = classifyBiome(elements, fallback);
      await AsyncStorage.setItem(cacheKey(geohash), JSON.stringify({ biome, at: Date.now() }));
      return { biome, source: 'network' };
    } catch {
      // Try the next server.
    }
  }
  return { biome: fallback, source: 'fallback' };
}

async function queryOverpass(url: string, body: string): Promise<OsmElement[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: HEADERS,
      body,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Overpass ${res.status}`);
    const json = (await res.json()) as { elements: OsmElement[] };
    return json.elements;
  } finally {
    clearTimeout(timer);
  }
}
