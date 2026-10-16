import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BIOME_LABEL, type Biome } from '@/data/biomes';
import { rollEncounter } from '@/game/encounter';
import { localDayKey, SEARCH_COST } from '@/game/watts';
import { encodeGeohash } from '@/services/geohash';
import { getSearchLocation, LocationDeniedError } from '@/services/locate';
import { lookupBiome } from '@/services/terrain';
import { useGame } from '@/store/use-game';
import { Device } from '@/ui/device';
import { LcdText } from '@/ui/lcd-text';
import { useFrame } from '@/ui/use-frame';

type Phase =
  | { kind: 'locating' }
  | { kind: 'scanning'; biome: Biome }
  | { kind: 'found' }
  | { kind: 'error'; message: string };

const REVEAL_MS = 1400;

export default function Search() {
  const [phase, setPhase] = useState<Phase>({ kind: 'locating' });
  const started = useRef(false);
  const cancelled = useRef(false);
  const dots = useFrame(4, 350);

  useEffect(() => {
    // Effects run twice in dev Strict Mode; a search must only charge once.
    if (started.current) return;
    started.current = true;

    (async () => {
      const game = useGame.getState();
      if (game.watts < SEARCH_COST) {
        setPhase({ kind: 'error', message: `You need ${SEARCH_COST}W to search. Keep walking!` });
        return;
      }

      try {
        const { lat, lon } = await getSearchLocation(game.debugLocation);
        const geohash = encodeGeohash(lat, lon);
        const { biome } = await lookupBiome(lat, lon, geohash, game.lastBiome ?? 'urban');
        if (cancelled.current) return;
        setPhase({ kind: 'scanning', biome });

        const encounter = rollEncounter({
          biome,
          geohash,
          day: localDayKey(new Date()),
          leadLevel: game.team[0]?.level,
        });
        await new Promise((r) => setTimeout(r, 900));
        if (cancelled.current) return;

        const { spendWatts, startEncounter } = useGame.getState();
        if (!spendWatts(SEARCH_COST)) {
          setPhase({ kind: 'error', message: 'Not enough watts.' });
          return;
        }
        startEncounter(encounter);
        setPhase({ kind: 'found' });
        setTimeout(() => {
          if (!cancelled.current) router.replace('/battle');
        }, REVEAL_MS);
      } catch (err) {
        if (cancelled.current) return;
        setPhase({
          kind: 'error',
          message:
            err instanceof LocationDeniedError
              ? 'Allow location access so wild Pokémon can find you.'
              : 'Could not get your location. Try again outside.',
        });
      }
    })();
  }, []);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  const busy = phase.kind === 'locating' || phase.kind === 'scanning';
  const ellipsis = '.'.repeat(dots);

  return (
    <Device
      buttons={[
        null,
        phase.kind === 'found' ? null : { label: busy ? 'CANCEL' : 'BACK', onPress: () => router.back() },
        null,
      ]}
    >
      <View style={styles.center}>
        {phase.kind === 'locating' && <LcdText size="md">Looking around{ellipsis}</LcdText>}
        {phase.kind === 'scanning' && (
          <>
            <LcdText size="sm" dim>{BIOME_LABEL[phase.biome].toUpperCase()}</LcdText>
            <LcdText size="md">Rustle rustle{ellipsis}</LcdText>
          </>
        )}
        {phase.kind === 'found' && (
          <>
            <LcdText size="xl" style={styles.bang}>!</LcdText>
            <LcdText size="md">Something appeared!</LcdText>
          </>
        )}
        {phase.kind === 'error' && (
          <LcdText size="md" style={styles.message}>
            {phase.message}
          </LcdText>
        )}
      </View>
    </Device>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  bang: { fontSize: 48, lineHeight: 64 },
  message: { textAlign: 'center' },
});
