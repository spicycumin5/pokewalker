import { StyleSheet, Text, type TextProps } from 'react-native';

import { FONT, LCD } from './theme';

const SIZES = { sm: 8, md: 10, lg: 14, xl: 20 } as const;

export function LcdText({
  size = 'md',
  dim = false,
  style,
  ...rest
}: TextProps & { size?: keyof typeof SIZES; dim?: boolean }) {
  const fontSize = SIZES[size];
  return (
    <Text
      style={[styles.base, { fontSize, lineHeight: fontSize * 1.6, color: dim ? LCD.dark : LCD.ink }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { fontFamily: FONT },
});
