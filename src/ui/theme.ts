/** 4-shade LCD palette, darkest to lightest. Keep in sync with scripts/build-pokedex.mjs. */
export const LCD = {
  ink: '#1e2a1e',
  dark: '#4a5d43',
  mid: '#8a9a73',
  screen: '#c9d3b0',
} as const;

export const SHELL = {
  body: '#e9e5dc',
  bodyShade: '#cfc9bc',
  bezel: '#2f3130',
  accent: '#d0342c',
  button: '#3a3c3b',
  buttonPressed: '#1f2120',
  label: '#6b675f',
} as const;

export const FONT = 'PressStart2P_400Regular';

/** Sprites are bundled at 4× their 80px source; display at whole multiples of 40. */
export const SPRITE_SOURCE_PX = 80;
