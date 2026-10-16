import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { pokedex, type Species } from '@/data/pokedex';
import { dexNumber } from '@/game/dex';
import { useGame } from '@/store/use-game';
import { Device } from '@/ui/device';
import { LcdText } from '@/ui/lcd-text';
import { PixelSprite } from '@/ui/pixel-sprite';
import { LCD } from '@/ui/theme';

const FILTERS = ['ALL', 'SEEN', 'CAUGHT'] as const;
type Filter = (typeof FILTERS)[number];

const ROW_HEIGHT = 48;

export default function Dex() {
  const { seenList, caughtList } = useGame(useShallow((s) => ({ seenList: s.seen, caughtList: s.caught })));
  const [filter, setFilter] = useState<Filter>('ALL');

  const seen = useMemo(() => new Set(seenList), [seenList]);
  const caught = useMemo(() => new Set(caughtList), [caughtList]);
  const rows = useMemo(
    () =>
      pokedex.filter((s) =>
        filter === 'ALL' ? true : filter === 'SEEN' ? seen.has(s.id) : caught.has(s.id),
      ),
    [filter, seen, caught],
  );

  const nextFilter = () => setFilter((f) => FILTERS[(FILTERS.indexOf(f) + 1) % FILTERS.length]);

  return (
    <Device
      buttons={[
        { label: 'BACK', onPress: () => router.back() },
        { label: filter, onPress: nextFilter },
        null,
      ]}
    >
      <View style={styles.header}>
        <LcdText size="sm" dim>SEEN {seen.size}</LcdText>
        <LcdText size="sm" dim>CAUGHT {caught.size}</LcdText>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(s) => String(s.id)}
        getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
        initialNumToRender={14}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <DexRow species={item} seen={seen.has(item.id)} caught={caught.has(item.id)} />}
        ListEmptyComponent={
          <LcdText size="sm" dim style={styles.empty}>
            {filter === 'CAUGHT' ? 'Nothing caught yet.' : 'Nothing seen yet.'}
          </LcdText>
        }
      />
    </Device>
  );
}

function DexRow({ species, seen, caught }: { species: Species; seen: boolean; caught: boolean }) {
  return (
    <Pressable
      disabled={!seen}
      onPress={() => router.push({ pathname: '/dex/[id]', params: { id: String(species.id) } })}
      accessibilityRole="button"
      accessibilityLabel={seen ? `${species.name}${caught ? ', caught' : ', seen'}` : `${dexNumber(species.id)}, unknown`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.sprite}>{seen && <PixelSprite speciesId={species.id} scale={0.5} />}</View>
      <LcdText size="sm" dim={!seen} style={styles.number}>
        {dexNumber(species.id)}
      </LcdText>
      <LcdText size="sm" dim={!seen} style={styles.name} numberOfLines={1}>
        {seen ? species.name.toUpperCase() : '----------'}
      </LcdText>
      {caught && <View style={styles.ball} accessibilityElementsHidden />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  row: { height: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pressed: { backgroundColor: LCD.mid },
  sprite: { width: 40, height: 40 },
  number: { width: 44 },
  name: { flex: 1 },
  ball: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: LCD.ink,
    backgroundColor: LCD.ink,
    marginRight: 4,
  },
  empty: { marginTop: 16, textAlign: 'center' },
});
