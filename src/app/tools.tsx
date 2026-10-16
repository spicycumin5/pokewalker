import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { BIOME_LABEL, BIOME_TYPES, type Biome } from '@/data/biomes';
import { localCast } from '@/game/encounter';
import { localDayKey } from '@/game/watts';
import { encodeGeohash } from '@/services/geohash';
import { getSearchLocation } from '@/services/locate';
import { lookupBiome, type TerrainResult } from '@/services/terrain';
import { useGame, type DebugLocation } from '@/store/use-game';
import { Device } from '@/ui/device';
import { LcdText } from '@/ui/lcd-text';
import { LCD } from '@/ui/theme';

/** Known spots for testing biome detection without walking there. */
const PRESETS: DebugLocation[] = [
  { label: 'Lake: CP Reservoir', lat: 40.7829, lon: -73.9654 },
  { label: 'Meadow: Sheep Mdw', lat: 40.7716, lon: -73.975 },
  { label: 'Town: Times Sq', lat: 40.758, lon: -73.9855 },
  { label: 'Beach: Coney Isl', lat: 40.5725, lon: -73.979 },
  { label: 'Grave: Green-Wood', lat: 40.6521, lon: -73.9905 },
  { label: 'Forest: Muir Woods', lat: 37.897, lon: -122.5811 },
  { label: 'Peak: Mt Washington', lat: 44.2706, lon: -71.3033 },
];

interface Peek {
  terrain: TerrainResult;
  geohash: string;
  cast: { type: string; weight: number; names: string[] }[];
}

export default function Tools() {
  const { debugLocation, setDebugLocation, grantWatts, lastBiome } = useGame(
    useShallow((s) => ({
      debugLocation: s.debugLocation,
      setDebugLocation: s.setDebugLocation,
      grantWatts: s.grantWatts,
      lastBiome: s.lastBiome,
    })),
  );
  const [peek, setPeek] = useState<Peek | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const runPeek = async () => {
    setStatus('Looking...');
    setPeek(null);
    try {
      const { lat, lon } = await getSearchLocation(debugLocation);
      const geohash = encodeGeohash(lat, lon);
      const terrain = await lookupBiome(lat, lon, geohash, lastBiome ?? 'urban');
      const weights = BIOME_TYPES[terrain.biome];
      const cast = [...localCast(terrain.biome, geohash, localDayKey(new Date()))].map(([type, list]) => ({
        type,
        weight: weights[type] ?? 0,
        names: list.map((s) => s.name),
      }));
      setPeek({ terrain, geohash, cast });
      setStatus(null);
    } catch {
      setStatus('Location unavailable.');
    }
  };

  const choose = (loc: DebugLocation | null) => {
    setDebugLocation(loc);
    setPeek(null);
  };

  return (
    <Device
      buttons={[
        { label: 'BACK', onPress: () => router.back() },
        { label: 'PEEK', onPress: runPeek },
        { label: '+100W', onPress: () => grantWatts(100) },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <LcdText size="sm" dim>SEARCH FROM</LcdText>
        <Option label="Real GPS" active={!debugLocation} onPress={() => choose(null)} />
        {PRESETS.map((p) => (
          <Option key={p.label} label={p.label} active={debugLocation?.label === p.label} onPress={() => choose(p)} />
        ))}

        <View style={styles.divider} />
        {status && <LcdText size="sm">{status}</LcdText>}
        {peek && (
          <View style={styles.peek}>
            <LcdText size="md">{BIOME_LABEL[peek.terrain.biome as Biome].toUpperCase()}</LcdText>
            <LcdText size="sm" dim>
              {peek.geohash} · {peek.terrain.source.toUpperCase()}
            </LcdText>
            {peek.cast.map((c) => (
              <LcdText key={c.type} size="sm">
                {c.type.toUpperCase()} {c.weight}%: {c.names.join(', ')}
              </LcdText>
            ))}
          </View>
        )}
        {!peek && !status && <LcdText size="sm" dim>PEEK shows today&apos;s locals here.</LcdText>}
      </ScrollView>
    </Device>
  );
}

function Option({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: active }} hitSlop={4}>
      <LcdText size="sm" dim={!active}>
        {active ? '> ' : '  '}
        {label}
      </LcdText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 8, paddingBottom: 8 },
  divider: { height: 2, backgroundColor: LCD.mid, marginVertical: 4 },
  peek: { gap: 6 },
});
