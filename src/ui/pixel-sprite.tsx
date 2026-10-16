import { Image } from 'expo-image';

import { sprites } from '@/data/sprites';
import { SPRITE_SOURCE_PX } from './theme';

/** scale is relative to the original 80px sprite (1 = 80px, 2 = 160px). */
export function PixelSprite({
  speciesId,
  scale = 1,
  flip = false,
}: {
  speciesId: number;
  scale?: number;
  flip?: boolean;
}) {
  const size = SPRITE_SOURCE_PX * scale;
  return (
    <Image
      source={sprites[speciesId]}
      style={{ width: size, height: size, transform: flip ? [{ scaleX: -1 }] : undefined }}
      contentFit="contain"
      cachePolicy="memory"
    />
  );
}
