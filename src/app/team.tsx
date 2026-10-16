import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { BIOME_LABEL } from '@/data/biomes';
import { getSpecies } from '@/data/pokedex';
import { TEAM_SIZE, useGame, type Mon } from '@/store/use-game';
import { Device, type DeviceButton } from '@/ui/device';
import { LcdText } from '@/ui/lcd-text';
import { PixelSprite } from '@/ui/pixel-sprite';
import { LCD } from '@/ui/theme';

export default function Team() {
  const { team, box, setLead, moveToBox, moveToTeam, release } = useGame(
    useShallow((s) => ({
      team: s.team,
      box: s.box,
      setLead: s.setLead,
      moveToBox: s.moveToBox,
      moveToTeam: s.moveToTeam,
      release: s.release,
    })),
  );
  const [selectedUid, setSelectedUid] = useState<string | undefined>(team[0]?.uid);
  const [confirmRelease, setConfirmRelease] = useState(false);

  const teamIndex = team.findIndex((m) => m.uid === selectedUid);
  const inTeam = teamIndex >= 0;
  const selected: Mon | undefined = inTeam ? team[teamIndex] : box.find((m) => m.uid === selectedUid);
  const canRelease = selected && (!inTeam || team.length > 1);

  const select = (uid: string) => {
    setSelectedUid(uid);
    setConfirmRelease(false);
  };

  const onRelease = () => {
    if (!selected || !canRelease) return;
    if (!confirmRelease) return setConfirmRelease(true);
    release(selected.uid);
    setConfirmRelease(false);
    setSelectedUid(team.find((m) => m.uid !== selected.uid)?.uid);
  };

  let center: DeviceButton | null = null;
  let right: DeviceButton | null = null;
  if (selected && inTeam) {
    center = { label: 'LEAD', disabled: teamIndex === 0, onPress: () => setLead(selected.uid) };
    right = { label: 'TO BOX', disabled: team.length <= 1, onPress: () => moveToBox(selected.uid) };
  } else if (selected) {
    center = { label: 'TO TEAM', disabled: team.length >= TEAM_SIZE, onPress: () => moveToTeam(selected.uid) };
  }

  return (
    <Device buttons={[{ label: 'BACK', onPress: () => router.back() }, center, right]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <LcdText size="sm" dim>TEAM {team.length}/{TEAM_SIZE}</LcdText>
        <View style={styles.teamGrid}>
          {Array.from({ length: TEAM_SIZE }, (_, i) => {
            const mon = team[i];
            return (
              <Pressable
                key={mon?.uid ?? `empty-${i}`}
                disabled={!mon}
                onPress={() => mon && select(mon.uid)}
                style={[styles.teamCell, mon?.uid === selectedUid && styles.selected]}
              >
                {mon ? (
                  <>
                    <PixelSprite speciesId={mon.speciesId} scale={1} />
                    <LcdText size="sm">{i === 0 ? '★' : ''}Lv{mon.level}</LcdText>
                  </>
                ) : (
                  <LcdText size="sm" dim>--</LcdText>
                )}
              </Pressable>
            );
          })}
        </View>

        {selected && (
          <View style={styles.detail}>
            <LcdText size="md">{getSpecies(selected.speciesId).name.toUpperCase()}</LcdText>
            <LcdText size="sm" dim>
              Lv.{selected.level} · {getSpecies(selected.speciesId).types.join('/').toUpperCase()}
            </LcdText>
            <LcdText size="sm" dim>
              MET: {selected.biome === 'starter' ? 'PARTNER' : BIOME_LABEL[selected.biome].toUpperCase()}
            </LcdText>
            {canRelease && (
              <Pressable onPress={onRelease} accessibilityRole="button" hitSlop={8}>
                <LcdText size="sm" style={styles.release}>
                  {confirmRelease ? '> SURE? TAP AGAIN' : '> RELEASE'}
                </LcdText>
              </Pressable>
            )}
          </View>
        )}

        <LcdText size="sm" dim>BOX {box.length}</LcdText>
        <View style={styles.boxGrid}>
          {box.length === 0 && <LcdText size="sm" dim>Empty. Catch more!</LcdText>}
          {box.map((mon) => (
            <Pressable
              key={mon.uid}
              onPress={() => select(mon.uid)}
              style={[styles.boxCell, mon.uid === selectedUid && styles.selected]}
            >
              <PixelSprite speciesId={mon.speciesId} scale={0.5} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Device>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 10, paddingBottom: 8 },
  teamGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 6 },
  teamCell: {
    width: '32%',
    alignItems: 'center',
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 4,
    minHeight: 104,
    justifyContent: 'center',
  },
  selected: { borderColor: LCD.ink },
  detail: { gap: 4, borderTopWidth: 2, borderBottomWidth: 2, borderColor: LCD.mid, paddingVertical: 8 },
  release: { marginTop: 4 },
  boxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  boxCell: { borderWidth: 2, borderColor: 'transparent', borderRadius: 4 },
});
