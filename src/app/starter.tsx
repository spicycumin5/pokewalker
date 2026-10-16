import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getSpecies, STARTERS } from '@/data/pokedex';
import { useGame } from '@/store/use-game';
import { Device } from '@/ui/device';
import { LcdText } from '@/ui/lcd-text';
import { PixelSprite } from '@/ui/pixel-sprite';

export default function Starter() {
  const hasTeam = useGame((s) => s.team.length > 0);
  const chooseStarter = useGame((s) => s.chooseStarter);
  const [index, setIndex] = useState(0);

  if (hasTeam) return <Redirect href="/" />;

  const species = getSpecies(STARTERS[index]);
  const cycle = (dir: number) => setIndex((i) => (i + dir + STARTERS.length) % STARTERS.length);

  return (
    <Device
      buttons={[
        { label: '<', onPress: () => cycle(-1) },
        {
          label: 'CHOOSE',
          onPress: () => {
            chooseStarter(species.id);
            router.replace('/');
          },
        },
        { label: '>', onPress: () => cycle(1) },
      ]}
    >
      <LcdText size="md">Choose a partner to walk with!</LcdText>
      <View style={styles.stage}>
        <PixelSprite speciesId={species.id} scale={2} />
        <LcdText size="lg">{species.name.toUpperCase()}</LcdText>
        <LcdText size="sm" dim>{species.types.join(' / ').toUpperCase()}</LcdText>
      </View>
      <LcdText size="sm" dim style={styles.center}>
        {index + 1} / {STARTERS.length}
      </LcdText>
    </Device>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  center: { textAlign: 'center' },
});
