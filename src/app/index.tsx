import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { BIOME_LABEL } from '@/data/biomes';
import { getSpecies } from '@/data/pokedex';
import { SEARCH_COST } from '@/game/watts';
import { usePedometerStatus } from '@/services/pedometer';
import { useGame } from '@/store/use-game';
import { Device } from '@/ui/device';
import { LcdText } from '@/ui/lcd-text';
import { PixelSprite } from '@/ui/pixel-sprite';
import { useFrame } from '@/ui/use-frame';

const STATUS_HINT = {
  starting: null,
  active: null,
  unavailable: 'NO STEP SENSOR',
  denied: 'ALLOW MOTION ACCESS',
} as const;

export default function Home() {
  const { lead, watts, todaySteps, lastBiome } = useGame(
    useShallow((s) => ({
      lead: s.team[0],
      watts: s.watts,
      todaySteps: s.ledger.todaySteps,
      lastBiome: s.lastBiome,
    })),
  );
  const pedometer = usePedometerStatus((s) => s.status);
  const frame = useFrame();

  if (!lead) return <Redirect href="/starter" />;

  const species = getSpecies(lead.speciesId);
  const canSearch = watts >= SEARCH_COST;
  const hint = STATUS_HINT[pedometer];

  return (
    <Device
      buttons={[
        { label: 'TEAM', onPress: () => router.push('/team') },
        { label: 'SEARCH', onPress: () => router.push('/search'), disabled: !canSearch },
        { label: 'TOOLS', onPress: () => router.push('/tools') },
      ]}
    >
      <View style={styles.topRow}>
        <View>
          <LcdText size="sm" dim>WATTS</LcdText>
          <LcdText size="lg">{watts.toLocaleString()}W</LcdText>
        </View>
        <View style={styles.right}>
          <LcdText size="sm" dim>STEPS</LcdText>
          <LcdText size="lg">{todaySteps.toLocaleString()}</LcdText>
        </View>
      </View>

      <View style={styles.stage}>
        <View style={{ transform: [{ translateY: frame === 0 ? 0 : -6 }] }}>
          <PixelSprite speciesId={lead.speciesId} scale={2} flip />
        </View>
        <LcdText size="md">{species.name.toUpperCase()}</LcdText>
        <LcdText size="sm" dim>Lv.{lead.level}</LcdText>
      </View>

      <View style={styles.footer}>
        <LcdText size="sm" dim>
          ROUTE: {lastBiome ? BIOME_LABEL[lastBiome].toUpperCase() : '???'}
        </LcdText>
        <LcdText size="sm" dim>
          {hint ?? (canSearch ? `SEARCH COSTS ${SEARCH_COST}W` : `WALK TO EARN ${SEARCH_COST}W`)}
        </LcdText>
      </View>
    </Device>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  right: { alignItems: 'flex-end' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  footer: { gap: 6 },
});
