import { useState } from 'react';
import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Button, Divider, Field, Screen, SectionHeader, SegmentedControl } from '../../components/ui';
import { exportAll } from '../../db/repo';
import { syncWidget } from '../../lib/widgetSync';
import { useSettings } from '../../store/useSettings';
import { QuickAddPreset, Unit } from '../../lib/types';
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
  const {
    unit,
    restTimerSeconds,
    calorieTarget,
    proteinTarget,
    presets,
    setUnit,
    setRestTimerSeconds,
    setCalorieTarget,
    setProteinTarget,
    setPresets,
  } = useSettings();
  const [exporting, setExporting] = useState<null | 'json' | 'csv'>(null);

  const [targetModal, setTargetModal] = useState(false);
  const [tCal, setTCal] = useState('');
  const [tProtein, setTProtein] = useState('');

  const [presetModal, setPresetModal] = useState(false);
  const [pId, setPId] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  const [pCal, setPCal] = useState('');
  const [pProtein, setPProtein] = useState('');

  const openTargets = () => {
    setTCal(String(calorieTarget));
    setTProtein(String(proteinTarget));
    setTargetModal(true);
  };

  const saveTargets = async () => {
    await setCalorieTarget(Math.max(0, Math.round(parseFloat(tCal) || 0)));
    await setProteinTarget(Math.max(0, Math.round(parseFloat(tProtein) || 0)));
    setTargetModal(false);
    syncWidget();
  };

  const openPreset = (preset: QuickAddPreset) => {
    setPId(preset.id);
    setPName(preset.name);
    setPCal(String(preset.calories));
    setPProtein(String(preset.protein));
    setPresetModal(true);
  };

  const savePreset = async () => {
    const name = pName.trim();
    if (!name || !pId) return;
    const next = presets.map((p) =>
      p.id === pId
        ? {
            ...p,
            name,
            calories: Math.max(0, Math.round(parseFloat(pCal) || 0)),
            protein: Math.max(0, Math.round(parseFloat(pProtein) || 0)),
          }
        : p
    );
    await setPresets(next);
    setPresetModal(false);
    syncWidget();
  };

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

      <SectionHeader>Nutrition targets</SectionHeader>
      <View style={styles.targetRow}>
        <Text style={styles.targetLabel}>Calories</Text>
        <Text style={styles.targetValue}>{calorieTarget} kcal</Text>
      </View>
      <View style={styles.targetRow}>
        <Text style={styles.targetLabel}>Protein</Text>
        <Text style={styles.targetValue}>{proteinTarget} g</Text>
      </View>
      <Button title="Edit targets" variant="secondary" onPress={openTargets} />

      <SectionHeader>Widget quick-add</SectionHeader>
      <Text style={styles.note}>
        These presets appear as one-tap buttons on the Home Screen widget.
      </Text>
      {presets.map((p) => (
        <Pressable key={p.id} onPress={() => openPreset(p)} style={styles.targetRow}>
          <Text style={styles.targetLabel}>{p.name}</Text>
          <Text style={styles.targetValue}>
            {p.calories} kcal · {p.protein} g
          </Text>
        </Pressable>
      ))}

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

      <Modal visible={targetModal} animationType="slide" transparent onRequestClose={() => setTargetModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Daily targets</Text>
            <View style={styles.macroRow}>
              <View style={styles.macroCol}>
                <Field label="Calories" mono keyboardType="numeric" value={tCal} onChangeText={setTCal} placeholder="2000" />
              </View>
              <View style={styles.macroCol}>
                <Field label="Protein (g)" mono keyboardType="numeric" value={tProtein} onChangeText={setTProtein} placeholder="160" />
              </View>
            </View>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setTargetModal(false)} style={styles.flexBtn} />
              <Button title="Save" onPress={saveTargets} style={styles.flexBtn} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={presetModal} animationType="slide" transparent onRequestClose={() => setPresetModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Quick-add preset</Text>
            <Field label="Name" value={pName} onChangeText={setPName} autoFocus placeholder="e.g. Snack" />
            <View style={styles.macroRow}>
              <View style={styles.macroCol}>
                <Field label="Calories" mono keyboardType="numeric" value={pCal} onChangeText={setPCal} placeholder="0" />
              </View>
              <View style={styles.macroCol}>
                <Field label="Protein (g)" mono keyboardType="numeric" value={pProtein} onChangeText={setPProtein} placeholder="0" />
              </View>
            </View>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setPresetModal(false)} style={styles.flexBtn} />
              <Button title="Save" onPress={savePreset} disabled={!pName.trim()} style={styles.flexBtn} />
            </View>
          </View>
        </View>
      </Modal>
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
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  targetLabel: { fontSize: fontSize.md, fontFamily: font.medium, color: colors.text },
  targetValue: { fontSize: fontSize.md, fontFamily: font.monoMedium, color: colors.text, letterSpacing: letterSpacing.tight },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(24,24,27,0.35)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  modalTitle: { fontSize: fontSize.xl, fontFamily: font.bold, color: colors.text, marginBottom: spacing.lg },
  macroRow: { flexDirection: 'row', gap: spacing.md },
  macroCol: { flex: 1 },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  flexBtn: { flex: 1 },
});
