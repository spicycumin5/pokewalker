import * as Location from 'expo-location';

import type { DebugLocation } from '@/store/use-game';

export class LocationDeniedError extends Error {}

/** The spot to search from: a Tools-screen override, else a one-shot GPS fix. */
export async function getSearchLocation(override: DebugLocation | null): Promise<{ lat: number; lon: number }> {
  if (override) return { lat: override.lat, lon: override.lon };

  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) throw new LocationDeniedError('Location permission denied');

  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { lat: pos.coords.latitude, lon: pos.coords.longitude };
}
