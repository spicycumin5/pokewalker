import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Biome } from '@/data/biomes';
import type { Encounter } from '@/game/encounter';
import { creditSteps, localDayKey, type StepLedger } from '@/game/watts';

export const TEAM_SIZE = 6;

export interface DebugLocation {
  label: string;
  lat: number;
  lon: number;
}

export interface Mon {
  uid: string;
  speciesId: number;
  level: number;
  caughtAt: number;
  biome: Biome | 'starter';
}

interface GameState {
  watts: number;
  ledger: StepLedger;
  /** iOS: end of the last range credited via getStepCountAsync. */
  lastStepSyncAt: number | null;
  team: Mon[];
  box: Mon[];
  seen: number[];
  caught: number[];
  encounter: Encounter | null;
  lastBiome: Biome | null;
  /** Tools screen: search from a preset spot instead of real GPS. */
  debugLocation: DebugLocation | null;

  addSteps: (steps: number) => void;
  setLastStepSyncAt: (at: number) => void;
  spendWatts: (cost: number) => boolean;
  chooseStarter: (speciesId: number) => void;
  startEncounter: (encounter: Encounter) => void;
  endEncounter: (caught: boolean) => Mon | null;
  setLead: (uid: string) => void;
  moveToBox: (uid: string) => void;
  moveToTeam: (uid: string) => void;
  release: (uid: string) => void;
  setDebugLocation: (loc: DebugLocation | null) => void;
  grantWatts: (amount: number) => void;
}

const newUid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const addUnique = (list: number[], id: number) => (list.includes(id) ? list : [...list, id]);

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      watts: 0,
      ledger: { day: localDayKey(new Date()), todaySteps: 0, totalSteps: 0, wattsToday: 0, stepRemainder: 0 },
      lastStepSyncAt: null,
      team: [],
      box: [],
      seen: [],
      caught: [],
      encounter: null,
      lastBiome: null,
      debugLocation: null,

      addSteps: (steps) => {
        if (steps <= 0) return;
        const { ledger, wattsEarned } = creditSteps(get().ledger, steps, localDayKey(new Date()));
        set((s) => ({ ledger, watts: s.watts + wattsEarned }));
      },

      setLastStepSyncAt: (at) => set({ lastStepSyncAt: at }),

      spendWatts: (cost) => {
        if (get().watts < cost) return false;
        set((s) => ({ watts: s.watts - cost }));
        return true;
      },

      chooseStarter: (speciesId) => {
        if (get().team.length > 0) return;
        const mon: Mon = { uid: newUid(), speciesId, level: 5, caughtAt: Date.now(), biome: 'starter' };
        set((s) => ({ team: [mon], seen: addUnique(s.seen, speciesId), caught: addUnique(s.caught, speciesId) }));
      },

      startEncounter: (encounter) =>
        set((s) => ({ encounter, lastBiome: encounter.biome, seen: addUnique(s.seen, encounter.speciesId) })),

      endEncounter: (caught) => {
        const enc = get().encounter;
        if (!enc) return null;
        if (!caught) {
          set({ encounter: null });
          return null;
        }
        const mon: Mon = {
          uid: newUid(),
          speciesId: enc.speciesId,
          level: enc.level,
          caughtAt: Date.now(),
          biome: enc.biome,
        };
        set((s) => ({
          encounter: null,
          caught: addUnique(s.caught, enc.speciesId),
          ...(s.team.length < TEAM_SIZE ? { team: [...s.team, mon] } : { box: [mon, ...s.box] }),
        }));
        return mon;
      },

      setLead: (uid) =>
        set((s) => {
          const mon = s.team.find((m) => m.uid === uid);
          return mon ? { team: [mon, ...s.team.filter((m) => m.uid !== uid)] } : {};
        }),

      moveToBox: (uid) =>
        set((s) => {
          const mon = s.team.find((m) => m.uid === uid);
          if (!mon || s.team.length <= 1) return {};
          return { team: s.team.filter((m) => m.uid !== uid), box: [mon, ...s.box] };
        }),

      moveToTeam: (uid) =>
        set((s) => {
          const mon = s.box.find((m) => m.uid === uid);
          if (!mon || s.team.length >= TEAM_SIZE) return {};
          return { box: s.box.filter((m) => m.uid !== uid), team: [...s.team, mon] };
        }),

      release: (uid) =>
        set((s) => {
          if (s.box.some((m) => m.uid === uid)) return { box: s.box.filter((m) => m.uid !== uid) };
          if (s.team.length <= 1) return {};
          return { team: s.team.filter((m) => m.uid !== uid) };
        }),

      setDebugLocation: (debugLocation) => set({ debugLocation }),

      grantWatts: (amount) => set((s) => ({ watts: s.watts + amount })),
    }),
    {
      name: 'pokewalker-game',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const useLead = () => useGame((s) => s.team[0]);

const subscribeHydration = (onChange: () => void) => useGame.persist.onFinishHydration(onChange);
const getHydrated = () => useGame.persist.hasHydrated();

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeHydration, getHydrated);
}
