import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Device } from '@/ui/device';
import { LcdText } from '@/ui/lcd-text';

const ITEMS: { label: string; href: Href }[] = [
  { label: 'POKéDEX', href: '/dex' },
  { label: 'TOOLS', href: '/tools' },
];

export default function Menu() {
  const [cursor, setCursor] = useState(0);

  return (
    <Device
      buttons={[
        { label: 'BACK', onPress: () => router.back() },
        { label: 'OK', onPress: () => router.push(ITEMS[cursor].href) },
        { label: 'NEXT', onPress: () => setCursor((c) => (c + 1) % ITEMS.length) },
      ]}
    >
      <LcdText size="sm" dim>MENU</LcdText>
      <View style={styles.list}>
        {ITEMS.map((item, i) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={() => router.push(item.href)}
            hitSlop={6}
          >
            <LcdText size="lg">
              {i === cursor ? '> ' : '  '}
              {item.label}
            </LcdText>
          </Pressable>
        ))}
      </View>
    </Device>
  );
}

const styles = StyleSheet.create({
  list: { gap: 18, marginTop: 24 },
});
