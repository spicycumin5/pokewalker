import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONT, LCD, SHELL } from './theme';

export interface DeviceButton {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}

type ButtonSlots = [DeviceButton | null, DeviceButton | null, DeviceButton | null];

/**
 * The Pokéwalker shell: an LCD screen above three round buttons (left, centre,
 * right). Each screen decides what the buttons do; labels sit on the LCD's
 * bottom row like the original.
 */
export function Device({ children, buttons }: { children: ReactNode; buttons: ButtonSlots }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.shell, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.bezel}>
        <View style={styles.screen}>
          <View style={styles.content}>{children}</View>
          <View style={styles.labelRow}>
            {buttons.map((b, i) => (
              <Text key={i} style={[styles.label, b?.disabled && styles.labelDisabled]} numberOfLines={1}>
                {b?.label ?? ''}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.buttonRow}>
        {buttons.map((b, i) => (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={b?.label}
            disabled={!b || b.disabled || !b.onPress}
            onPress={b?.onPress}
            style={({ pressed }) => [
              styles.button,
              i === 1 && styles.buttonCenter,
              pressed && styles.buttonPressed,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: SHELL.body,
    paddingHorizontal: 16,
  },
  bezel: {
    flex: 1,
    backgroundColor: SHELL.bezel,
    borderRadius: 28,
    padding: 14,
    borderBottomWidth: 6,
    borderBottomColor: SHELL.accent,
  },
  screen: {
    flex: 1,
    backgroundColor: LCD.screen,
    borderRadius: 10,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 14,
  },
  labelRow: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: LCD.ink,
    paddingVertical: 8,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONT,
    fontSize: 9,
    color: LCD.ink,
  },
  labelDisabled: {
    color: LCD.mid,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingTop: 24,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: SHELL.button,
    borderBottomWidth: 4,
    borderBottomColor: SHELL.buttonPressed,
  },
  buttonCenter: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  buttonPressed: {
    backgroundColor: SHELL.buttonPressed,
    borderBottomWidth: 0,
    transform: [{ translateY: 3 }],
  },
});
