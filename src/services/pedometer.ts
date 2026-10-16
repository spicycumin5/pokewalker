import { Pedometer } from 'expo-sensors';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { create } from 'zustand';

import { useGame } from '@/store/use-game';

/** Core Motion keeps about 7 days of history. */
const IOS_HISTORY_MS = 7 * 24 * 60 * 60 * 1000;

export type PedometerStatus = 'starting' | 'active' | 'unavailable' | 'denied';

export const usePedometerStatus = create<{ status: PedometerStatus }>(() => ({ status: 'starting' }));
const setStatus = (status: PedometerStatus) => usePedometerStatus.setState({ status });

/**
 * iOS: credits steps from Core Motion history (lastSync → now), so steps
 * walked while the app was closed still count.
 * Android: getStepCountAsync is iOS-only, so only steps walked while the app is
 * open count, as deltas from watchStepCount's running total. Background history
 * needs Health Connect (milestone 5).
 */
export function usePedometer(): void {
  useEffect(() => {
    let cancelled = false;
    let subscription: { remove: () => void } | null = null;
    let appStateSub: { remove: () => void } | null = null;
    let syncing = false;

    const syncIos = async () => {
      if (syncing) return;
      syncing = true;
      try {
        const { lastStepSyncAt, setLastStepSyncAt, addSteps } = useGame.getState();
        const now = Date.now();
        if (lastStepSyncAt === null) {
          setLastStepSyncAt(now);
          return;
        }
        const start = Math.max(lastStepSyncAt, now - IOS_HISTORY_MS);
        if (now - start < 1000) return;
        const { steps } = await Pedometer.getStepCountAsync(new Date(start), new Date(now));
        addSteps(steps);
        setLastStepSyncAt(now);
      } catch {
        // Transient Core Motion errors: retry on the next tick.
      } finally {
        syncing = false;
      }
    };

    (async () => {
      // Crediting before the persisted state loads would be overwritten by it.
      if (!useGame.persist.hasHydrated()) {
        await new Promise<void>((resolve) => {
          const unsub = useGame.persist.onFinishHydration(() => {
            unsub();
            resolve();
          });
        });
      }
      const available = await Pedometer.isAvailableAsync().catch(() => false);
      if (cancelled) return;
      if (!available) return setStatus('unavailable');

      const perm = await Pedometer.requestPermissionsAsync().catch(() => null);
      if (cancelled) return;
      if (!perm?.granted) return setStatus('denied');

      if (Platform.OS === 'ios') {
        await syncIos();
        if (cancelled) return;
        subscription = Pedometer.watchStepCount(() => void syncIos());
        appStateSub = AppState.addEventListener('change', (next) => {
          if (next === 'active') void syncIos();
        });
      } else {
        let lastTotal = 0;
        subscription = Pedometer.watchStepCount(({ steps }) => {
          const delta = steps - lastTotal;
          lastTotal = steps;
          useGame.getState().addSteps(delta);
        });
      }
      if (!cancelled) setStatus('active');
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
      appStateSub?.remove();
    };
  }, []);
}
