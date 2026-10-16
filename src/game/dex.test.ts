import { getSpecies } from '@/data/pokedex';
import { dexNumber, habitatsOf, rarityOf } from './dex';

describe('rarityOf', () => {
  it('maps capture rate to rarity', () => {
    expect(rarityOf(getSpecies(16))).toBe('COMMON'); // Pidgey, 255
    expect(rarityOf(getSpecies(17))).toBe('UNCOMMON'); // Pidgeotto, 120
    expect(rarityOf(getSpecies(3))).toBe('RARE'); // Venusaur, 45
    expect(rarityOf(getSpecies(113))).toBe('VERY RARE'); // Chansey, 30
    expect(rarityOf(getSpecies(150))).toBe('LEGENDARY'); // Mewtwo
  });
});

describe('habitatsOf', () => {
  it('lists biomes that weight the species types, best first', () => {
    const magikarp = habitatsOf(getSpecies(129));
    expect(magikarp[0]).toBe('water');
    expect(magikarp).toContain('beach');
    expect(magikarp).not.toContain('cemetery');
  });

  it('covers both types of dual-type species', () => {
    const gastly = habitatsOf(getSpecies(92)); // ghost/poison
    expect(gastly[0]).toBe('cemetery');
    expect(gastly).toContain('industrial'); // via poison
  });

  it('is empty for babies, which never appear in the wild', () => {
    expect(habitatsOf(getSpecies(172))).toEqual([]); // Pichu
  });
});

it('dexNumber pads to three digits', () => {
  expect(dexNumber(7)).toBe('#007');
  expect(dexNumber(493)).toBe('#493');
});
