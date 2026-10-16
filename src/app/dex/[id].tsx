import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { BIOME_LABEL } from '@/data/biomes';
import { getSpecies, pokedex } from '@/data/pokedex';
import { dexNumber, habitatsOf, rarityOf } from '@/game/dex';
import { useGame } from '@/store/use-game';
import { Device } from '@/ui/device';
import { LcdText } from '@/ui/lcd-text';
import { PixelSprite } from '@/ui/pixel-sprite';

export default function DexEntry() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const speciesId = Number(id);
  const { seen, caught, owned } = useGame(
    useShallow((s) => ({
      seen: s.seen,
      caught: s.caught.includes(speciesId),
      owned: [...s.team, ...s.box].filter((m) => m.speciesId === speciesId).length,
    })),
  );

  if (!seen.includes(speciesId)) return <Redirect href="/dex" />;

  const species = getSpecies(speciesId);
  const habitats = habitatsOf(species);

  // < and > step through seen entries only, like flipping through a real dex.
  const seenIds = pokedex.map((s) => s.id).filter((i) => seen.includes(i));
  const pos = seenIds.indexOf(speciesId);
  const go = (offset: number) => {
    const next = seenIds[pos + offset];
    if (next !== undefined) router.setParams({ id: String(next) });
  };

  return (
    <Device
      buttons={[
        { label: '<', onPress: () => go(-1), disabled: pos <= 0 },
        { label: 'BACK', onPress: () => router.back() },
        { label: '>', onPress: () => go(1), disabled: pos >= seenIds.length - 1 },
      ]}
    >
      <View style={styles.top}>
        <LcdText size="sm" dim>{dexNumber(species.id)}</LcdText>
        <LcdText size="sm">{caught ? 'CAUGHT' : 'SEEN'}</LcdText>
      </View>

      <View style={styles.stage}>
        <PixelSprite speciesId={species.id} scale={2} />
        <LcdText size="lg">{species.name.toUpperCase()}</LcdText>
        <LcdText size="sm" dim>{species.types.join(' / ').toUpperCase()}</LcdText>
      </View>

      <View style={styles.facts}>
        <Fact label="RARITY" value={rarityOf(species)} />
        {caught && <Fact label="OWNED" value={String(owned)} />}
        <Fact
          label="FOUND"
          value={
            habitats.length === 0
              ? 'NOT IN THE WILD'
              : habitats.slice(0, 3).map((b) => BIOME_LABEL[b].toUpperCase()).join(', ')
          }
        />
      </View>
    </Device>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <LcdText size="sm" dim style={styles.factLabel}>{label}</LcdText>
      <LcdText size="sm" style={styles.factValue}>{value}</LcdText>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  facts: { gap: 8 },
  fact: { flexDirection: 'row', gap: 8 },
  factLabel: { width: 64 },
  factValue: { flex: 1 },
});
