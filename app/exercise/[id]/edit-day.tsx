import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RestTimerBar } from '../../../components/RestTimer';
import { Button, Card, Field, Screen } from '../../../components/ui';
import { ChevronDown, Close } from '../../../components/icons';
import {
  createDay,
  getDay,
  getLastDayForExercise,
  replaceSetsForDay,
  todayISODate,
  updateDay,
} from '../../../db/repo';
import { NewSetInput, Unit, WorkoutDayWithSets } from '../../../lib/types';
import { formatWeight } from '../../../lib/units';
import { useRestTimer } from '../../../store/useRestTimer';
import { useSettings } from '../../../store/useSettings';
import { colors, font, fontSize, letterSpacing, radius, spacing } from '../../../theme/theme';

interface SetRow {
  reps: string;
  weight: string;
  unit: Unit;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Build 'YYYY-MM-DD' from a JS Date using local fields (no tz shift). */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatNice(iso: string): string {
  const d = parseISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function rowsFromSets(day: WorkoutDayWithSets): SetRow[] {
  return day.sets.map((s) => ({
    reps: String(s.reps),
    weight: String(s.weight),
    unit: s.unit,
  }));
}

function summarizeSets(day: WorkoutDayWithSets): string {
  if (day.sets.length === 0) return 'no sets';
  return day.sets
    .map((s) => `${s.reps} × ${formatWeight(s.weight, s.unit)}`)
    .join(', ');
}

/** Parse editable rows into valid NewSetInput[] (requires reps > 0). */
function parseRows(rows: SetRow[]): NewSetInput[] {
  const out: NewSetInput[] = [];
  for (const r of rows) {
    const reps = parseInt(r.reps, 10);
    const weight = parseFloat(r.weight);
    if (!Number.isFinite(reps) || reps <= 0) continue;
    out.push({
      reps,
      weight: Number.isFinite(weight) ? weight : 0,
      unit: r.unit,
    });
  }
  return out;
}

export default function EditDayScreen() {
  const { id, dayId } = useLocalSearchParams<{ id: string; dayId?: string }>();
  const defaultUnit = useSettings((s) => s.unit);
  const restTimerSeconds = useSettings((s) => s.restTimerSeconds);
  const startRest = useRestTimer((s) => s.start);

  const isEdit = !!dayId;

  const [date, setDate] = useState<string>(todayISODate());
  const [rows, setRows] = useState<SetRow[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState<boolean>(isEdit);
  const [saving, setSaving] = useState(false);
  const [lastSession, setLastSession] = useState<WorkoutDayWithSets | null>(null);

  // Load existing day (edit mode) + last-session reference (both modes).
  useEffect(() => {
    let active = true;
    (async () => {
      if (dayId) {
        const day = await getDay(dayId);
        if (active && day) {
          setDate(day.date);
          setRows(rowsFromSets(day));
        }
        if (active) setLoading(false);
      }
      const last = await getLastDayForExercise(id, dayId);
      if (active) setLastSession(last);
    })();
    return () => {
      active = false;
    };
  }, [id, dayId]);

  const addSet = useCallback(() => {
    setRows((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        {
          reps: last ? last.reps : '',
          weight: last ? last.weight : '',
          unit: last ? last.unit : defaultUnit,
        },
      ];
    });
  }, [defaultUnit]);

  const updateRow = useCallback(
    (index: number, patch: Partial<SetRow>) => {
      setRows((prev) =>
        prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
      );
    },
    []
  );

  const removeRow = useCallback((index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const copyLast = useCallback(async () => {
    const last = await getLastDayForExercise(id, dayId);
    if (last) setRows(rowsFromSets(last));
  }, [id, dayId]);

  const onPickerChange = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      setShowPicker(false);
      if (event.type === 'set' && selected) {
        setDate(toISODate(selected));
      }
    },
    []
  );

  const parsed = parseRows(rows);
  const canSave = parsed.length > 0 && !saving;

  const save = useCallback(async () => {
    const sets = parseRows(rows);
    if (sets.length === 0) return;
    setSaving(true);
    try {
      if (dayId) {
        await updateDay(dayId, { date });
        await replaceSetsForDay(dayId, sets);
      } else {
        await createDay({ exerciseId: id, date, sets });
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }, [rows, dayId, date, id]);

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: isEdit ? 'Edit Day' : 'Add Day' }} />

      {loading ? null : (
        <View>
          {/* Date */}
          <Text style={styles.label}>Date</Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            style={({ pressed }) => [styles.dateRow, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.dateText}>{formatNice(date)}</Text>
            <ChevronDown size={18} color={colors.faint} />
          </Pressable>
          {showPicker ? (
            <DateTimePicker
              value={parseISODate(date)}
              mode="date"
              onChange={onPickerChange}
            />
          ) : null}

          {/* Sets */}
          <Text style={[styles.label, styles.setsLabel]}>Sets</Text>
          {rows.map((row, i) => (
            <Card key={i} style={styles.setCard}>
              <Text style={styles.setNum}>Set {i + 1}</Text>
              <View style={styles.setInputs}>
                <View style={styles.inputCol}>
                  <Field
                    label="Reps"
                    mono
                    keyboardType="numeric"
                    value={row.reps}
                    onChangeText={(t) => updateRow(i, { reps: t })}
                    placeholder="0"
                  />
                </View>
                <View style={styles.inputCol}>
                  <Field
                    label="Weight"
                    mono
                    keyboardType="numeric"
                    value={row.weight}
                    onChangeText={(t) => updateRow(i, { weight: t })}
                    placeholder="0"
                  />
                </View>
                <Pressable
                  onPress={() =>
                    updateRow(i, { unit: row.unit === 'kg' ? 'lb' : 'kg' })
                  }
                  style={styles.unitBtn}
                >
                  <Text style={styles.unitBtnText}>{row.unit}</Text>
                </Pressable>
                <Pressable
                  onPress={() => removeRow(i)}
                  hitSlop={8}
                  style={styles.removeBtn}
                >
                  <Close size={18} color={colors.faint} />
                </Pressable>
              </View>
            </Card>
          ))}

          <Button
            title="Add set"
            variant="secondary"
            onPress={addSet}
            style={styles.addSet}
          />

          {lastSession ? (
            <Text style={styles.lastSession}>
              Last session: {summarizeSets(lastSession)}
            </Text>
          ) : null}

          <View style={styles.actionRow}>
            <Button
              title="Copy last session"
              variant="ghost"
              onPress={copyLast}
              disabled={!lastSession}
              style={styles.flexBtn}
            />
            <Button
              title={`Start rest (${restTimerSeconds}s)`}
              variant="ghost"
              onPress={() => startRest(restTimerSeconds)}
              style={styles.flexBtn}
            />
          </View>

          <Button
            title="Save"
            onPress={save}
            disabled={!canSave}
            loading={saving}
            style={styles.saveBtn}
          />
        </View>
      )}

      <RestTimerBar />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontFamily: font.semibold,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  setsLabel: { marginTop: spacing.lg },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  dateText: { fontSize: fontSize.lg, color: colors.text, fontFamily: font.medium },
  setCard: { marginBottom: spacing.md },
  setNum: {
    fontSize: fontSize.xs,
    fontFamily: font.semibold,
    color: colors.faint,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  setInputs: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  inputCol: { flex: 1 },
  unitBtn: {
    minWidth: 48,
    height: 50,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  unitBtnText: {
    fontSize: fontSize.sm,
    fontFamily: font.monoMedium,
    color: colors.text,
    textTransform: 'uppercase',
  },
  removeBtn: {
    width: 40,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  addSet: { marginBottom: spacing.md },
  lastSession: {
    fontSize: fontSize.sm,
    color: colors.faint,
    fontFamily: font.mono,
    letterSpacing: letterSpacing.tight,
    marginBottom: spacing.md,
  },
  actionRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  flexBtn: { flex: 1 },
  saveBtn: { marginBottom: spacing.xl * 2 },
});
