import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getSpecies } from '@/data/pokedex';
import {
  battleStep,
  startBattle,
  type BattleAction,
  type BattleContext,
  type BattleState,
} from '@/game/battle';
import type { Encounter } from '@/game/encounter';
import { TEAM_SIZE, useGame, type Mon } from '@/store/use-game';
import { Device } from '@/ui/device';
import { HpPips } from '@/ui/hp-pips';
import { LcdText } from '@/ui/lcd-text';
import { PixelSprite } from '@/ui/pixel-sprite';
import { LCD } from '@/ui/theme';

export default function Battle() {
  // Snapshot on mount: finishing clears the store's encounter, and that must
  // not bounce this screen through a second redirect.
  const [encounter] = useState(() => useGame.getState().encounter);
  const lead = useGame((s) => s.team[0]);

  if (!encounter || !lead) return <Redirect href="/" />;
  return <BattleView encounter={encounter} lead={lead} />;
}

function BattleView({ encounter, lead }: { encounter: Encounter; lead: Mon }) {
  const teamFull = useGame((s) => s.team.length >= TEAM_SIZE);
  const endEncounter = useGame((s) => s.endEncounter);

  const wild = getSpecies(encounter.speciesId);
  const leadSpecies = getSpecies(lead.speciesId);
  const ctx = useMemo<BattleContext>(
    () => ({
      wildName: wild.name.toUpperCase(),
      leadName: leadSpecies.name.toUpperCase(),
      captureRate: wild.captureRate,
      leadLevel: lead.level,
      wildLevel: encounter.level,
    }),
    [wild, leadSpecies, lead.level, encounter.level],
  );
  const [state, setState] = useState<BattleState>(() => startBattle(ctx));

  const act = (action: BattleAction) => setState((s) => battleStep(s, action, ctx));

  const finish = () => {
    endEncounter(state.outcome === 'caught');
    router.replace('/');
  };

  const log =
    state.outcome === 'caught'
      ? [...state.log, teamFull ? 'Sent to the Box.' : 'Joined your team!']
      : state.log;

  return (
    <Device
      buttons={
        state.outcome
          ? [null, { label: 'OK', onPress: finish }, null]
          : [
              { label: 'ATTACK', onPress: () => act('attack') },
              { label: 'EVADE', onPress: () => act('evade') },
              { label: 'CATCH', onPress: () => act('catch') },
            ]
      }
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <LcdText size="sm">{ctx.wildName}</LcdText>
          <LcdText size="sm" dim>Lv.{encounter.level}</LcdText>
          <HpPips hp={state.wildHp} />
        </View>
        <View style={state.outcome === 'caught' || state.outcome === 'fled' || state.outcome === 'knockedOut' ? styles.gone : null}>
          <PixelSprite speciesId={wild.id} scale={1.5} />
        </View>
      </View>

      <View style={styles.row}>
        <PixelSprite speciesId={lead.speciesId} scale={1} flip />
        <View style={[styles.info, styles.alignEnd]}>
          <LcdText size="sm">{ctx.leadName}</LcdText>
          <LcdText size="sm" dim>Lv.{lead.level}</LcdText>
          <HpPips hp={state.playerHp} />
        </View>
      </View>

      <View style={styles.logBox}>
        {log.map((line, i) => (
          <LcdText key={i} size="sm">
            {line}
          </LcdText>
        ))}
      </View>
    </Device>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { gap: 4, flexShrink: 1 },
  alignEnd: { alignItems: 'flex-end' },
  gone: { opacity: 0 },
  logBox: {
    flex: 1,
    marginTop: 8,
    borderWidth: 2,
    borderColor: LCD.ink,
    borderRadius: 4,
    padding: 8,
    gap: 4,
    justifyContent: 'flex-start',
  },
});
