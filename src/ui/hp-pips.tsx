import { StyleSheet, View } from 'react-native';

import { MAX_HP } from '@/game/battle';
import { LCD } from './theme';

export function HpPips({ hp }: { hp: number }) {
  return (
    <View style={styles.row} accessibilityLabel={`HP ${hp} of ${MAX_HP}`}>
      {Array.from({ length: MAX_HP }, (_, i) => (
        <View key={i} style={[styles.pip, i < hp ? styles.full : styles.empty]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  pip: { width: 14, height: 8, borderWidth: 2, borderColor: LCD.ink },
  full: { backgroundColor: LCD.ink },
  empty: { backgroundColor: 'transparent' },
});
