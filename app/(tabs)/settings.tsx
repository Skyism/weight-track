import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Button, Divider, Screen, SectionHeader, SegmentedControl } from '../../components/ui';
import { exportAll } from '../../db/repo';
import { useSettings } from '../../store/useSettings';
import { Unit } from '../../lib/types';
import { colors, font, fontSize, letterSpacing, radius, spacing } from '../../theme/theme';

const REST_PRESETS = [60, 90, 120, 180];
const MIN_REST = 15;

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function csvField(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function SettingsScreen() {
  const { unit, restTimerSeconds, setUnit, setRestTimerSeconds } = useSettings();
  const [exporting, setExporting] = useState<null | 'json' | 'csv'>(null);

  const shareText = async (title: string, message: string) => {
    try {
      await Share.share({ title, message });
    } catch {
      // user dismissed or share unavailable — no-op
    }
  };

  const exportJson = async () => {
    setExporting('json');
    try {
      const bundle = await exportAll();
      await shareText('Weight Track backup', JSON.stringify(bundle, null, 2));
    } finally {
      setExporting(null);
    }
  };

  const exportCsv = async () => {
    setExporting('csv');
    try {
      const bundle = await exportAll();
      const exName = new Map(bundle.exercises.map((e) => [e.id, e.name]));
      const day = new Map(bundle.workoutDays.map((d) => [d.id, d]));
      const rows = [...bundle.setEntries].sort((a, b) => a.orderIndex - b.orderIndex);
      const lines = ['exercise,date,set,reps,weight,unit'];
      for (const s of rows) {
        const d = day.get(s.workoutDayId);
        if (!d) continue;
        lines.push(
          [
            csvField(exName.get(d.exerciseId) ?? ''),
            csvField(d.date),
            s.orderIndex + 1,
            s.reps,
            s.weight,
            s.unit,
          ].join(',')
        );
      }
      await shareText('Weight Track backup (CSV)', lines.join('\n'));
    } finally {
      setExporting(null);
    }
  };

  return (
    <Screen scroll>
      <SectionHeader>Units</SectionHeader>
      <SegmentedControl<Unit>
        value={unit}
        onChange={setUnit}
        options={[
          { label: 'Kilograms', value: 'kg' },
          { label: 'Pounds', value: 'lb' },
        ]}
      />

      <SectionHeader>Rest timer</SectionHeader>
      <Text style={styles.current}>
        Default <Text style={styles.currentValue}>{fmtDuration(restTimerSeconds)}</Text>
      </Text>
      <View style={styles.presetRow}>
        {REST_PRESETS.map((sec) => {
          const active = restTimerSeconds === sec;
          return (
            <Pressable
              key={sec}
              onPress={() => setRestTimerSeconds(sec)}
              style={[styles.preset, active && styles.presetActive]}
            >
              <Text style={[styles.presetText, active && styles.presetTextActive]}>
                {fmtDuration(sec)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.adjustRow}>
        <Button
          title="-15s"
          variant="secondary"
          onPress={() => setRestTimerSeconds(Math.max(MIN_REST, restTimerSeconds - 15))}
          style={styles.adjustBtn}
        />
        <Button
          title="+15s"
          variant="secondary"
          onPress={() => setRestTimerSeconds(restTimerSeconds + 15)}
          style={styles.adjustBtn}
        />
      </View>

      <SectionHeader>Data</SectionHeader>
      <Text style={styles.note}>
        Your workouts are stored only on this device. Export a backup regularly so you don&apos;t
        lose your history.
      </Text>
      <Button
        title="Back up data (JSON)"
        onPress={exportJson}
        loading={exporting === 'json'}
        disabled={exporting !== null}
      />
      <View style={{ height: spacing.sm }} />
      <Button
        title="Export as CSV"
        variant="secondary"
        onPress={exportCsv}
        loading={exporting === 'csv'}
        disabled={exporting !== null}
      />

      <Divider />
      <SectionHeader>About</SectionHeader>
      <Text style={styles.aboutTitle}>Weight Track</Text>
      <Text style={styles.note}>Log your lifts, track sets and reps, watch your strength grow.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  current: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: spacing.md, fontFamily: font.regular },
  currentValue: { fontFamily: font.monoMedium, color: colors.text, letterSpacing: letterSpacing.tight },
  presetRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  preset: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  presetActive: { backgroundColor: colors.text, borderColor: colors.text },
  presetText: { fontSize: fontSize.md, fontFamily: font.mono, color: colors.text, letterSpacing: letterSpacing.tight },
  presetTextActive: { color: colors.bg },
  adjustRow: { flexDirection: 'row', gap: spacing.sm },
  adjustBtn: { flex: 1 },
  note: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 21, fontFamily: font.regular },
  aboutTitle: { fontSize: fontSize.lg, fontFamily: font.semibold, color: colors.text, marginBottom: spacing.xs },
});
