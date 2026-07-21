import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ProgressChart, ChartPoint } from '../../../components/ProgressChart';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Screen,
} from '../../../components/ui';
import {
  deleteDay,
  deleteExercise,
  getExercise,
  listDaysForExercise,
  updateExercise,
} from '../../../db/repo';
import { computeDayMetrics, DayMetrics } from '../../../lib/prs';
import {
  Exercise,
  MUSCLE_GROUPS,
  MuscleGroup,
  WorkoutDayWithSets,
} from '../../../lib/types';
import { convertWeight, formatWeight } from '../../../lib/units';
import { useSettings } from '../../../store/useSettings';
import { colors, fontSize, radius, spacing } from '../../../theme/theme';

type Tab = 'history' | 'progress';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Parse a 'YYYY-MM-DD' string into a local Date (no timezone shift). */
function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}

/** "Mon, Jul 21" */
function formatNice(iso: string): string {
  const d = parseISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "M/D" */
function formatShort(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string; dayId?: string }>();
  const unit = useSettings((s) => s.unit);

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [days, setDays] = useState<WorkoutDayWithSets[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('history');

  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGroup, setEditGroup] = useState<MuscleGroup | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    const [ex, ds] = await Promise.all([
      getExercise(id),
      listDaysForExercise(id),
    ]);
    setExercise(ex);
    setDays(ds);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Metrics keyed by dayId for quick lookup (computed ascending internally).
  const metricsByDay = useMemo(() => {
    const map = new Map<string, DayMetrics>();
    for (const m of computeDayMetrics(days)) map.set(m.dayId, m);
    return map;
  }, [days]);

  const openEdit = useCallback(() => {
    if (!exercise) return;
    setEditName(exercise.name);
    setEditGroup(exercise.muscleGroup);
    setEditVisible(true);
  }, [exercise]);

  const saveEdit = useCallback(async () => {
    const name = editName.trim();
    if (!name) return;
    setSavingEdit(true);
    try {
      await updateExercise(id, { name, muscleGroup: editGroup });
      setEditVisible(false);
      await load();
    } finally {
      setSavingEdit(false);
    }
  }, [id, editName, editGroup, load]);

  const removeExercise = useCallback(async () => {
    await deleteExercise(id);
    setEditVisible(false);
    router.back();
  }, [id]);

  const removeDay = useCallback(
    async (dayId: string) => {
      await deleteDay(dayId);
      await load();
    },
    [load]
  );

  return (
    <Screen scroll>
      <Stack.Screen
        options={{
          title: exercise?.name ?? 'Exercise',
          headerRight: () => (
            <Pressable onPress={openEdit} hitSlop={8}>
              <Text style={styles.headerBtn}>Edit</Text>
            </Pressable>
          ),
        }}
      />

      <View style={styles.segment}>
        <SegmentButton
          label="History"
          active={tab === 'history'}
          onPress={() => setTab('history')}
        />
        <SegmentButton
          label="Progress"
          active={tab === 'progress'}
          onPress={() => setTab('progress')}
        />
      </View>

      {loading ? null : tab === 'history' ? (
        <HistoryTab
          id={id}
          days={days}
          metricsByDay={metricsByDay}
          onDeleteDay={removeDay}
        />
      ) : (
        <ProgressTab days={days} metricsByDay={metricsByDay} unit={unit} />
      )}

      <Modal
        visible={editVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit exercise</Text>

            <Field
              label="Name"
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={styles.groupLabel}>Muscle group</Text>
            <View style={styles.groupRow}>
              <SelectableChip
                label="None"
                selected={editGroup === null}
                onPress={() => setEditGroup(null)}
              />
              {MUSCLE_GROUPS.map((g) => (
                <SelectableChip
                  key={g}
                  label={g}
                  selected={editGroup === g}
                  onPress={() => setEditGroup(g)}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setEditVisible(false)}
                style={styles.flexBtn}
              />
              <Button
                title="Save"
                onPress={saveEdit}
                disabled={!editName.trim()}
                loading={savingEdit}
                style={styles.flexBtn}
              />
            </View>
            <Button
              title="Delete exercise"
              variant="danger"
              onPress={removeExercise}
              style={styles.deleteBtn}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function HistoryTab({
  id,
  days,
  metricsByDay,
  onDeleteDay,
}: {
  id: string;
  days: WorkoutDayWithSets[];
  metricsByDay: Map<string, DayMetrics>;
  onDeleteDay: (dayId: string) => void;
}) {
  return (
    <View>
      <Button
        title="＋ Add Day"
        onPress={() => router.push(`/exercise/${id}/edit-day`)}
        style={styles.addDay}
      />

      {days.length === 0 ? (
        <EmptyState
          title="No days logged"
          subtitle="Add your first workout day for this exercise."
        />
      ) : (
        days.map((day) => {
          const m = metricsByDay.get(day.id);
          const isPR = !!m && (m.isWeightPR || m.is1RMPR);
          return (
            <Pressable
              key={day.id}
              onPress={() =>
                router.push(`/exercise/${id}/edit-day?dayId=${day.id}`)
              }
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Card style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayDate}>{formatNice(day.date)}</Text>
                  {isPR ? (
                    <View style={styles.prBadge}>
                      <Text style={styles.prBadgeText}>PR</Text>
                    </View>
                  ) : null}
                </View>

                {day.sets.length === 0 ? (
                  <Text style={styles.emptySets}>No sets</Text>
                ) : (
                  day.sets.map((s, i) => (
                    <Text key={s.id} style={styles.setLine}>
                      Set {i + 1}  {s.reps} × {formatWeight(s.weight, s.unit)}
                    </Text>
                  ))
                )}

                <Pressable
                  onPress={() => onDeleteDay(day.id)}
                  hitSlop={8}
                  style={styles.deleteDay}
                >
                  <Text style={styles.deleteDayText}>Delete</Text>
                </Pressable>
              </Card>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

function ProgressTab({
  days,
  metricsByDay,
  unit,
}: {
  days: WorkoutDayWithSets[];
  metricsByDay: Map<string, DayMetrics>;
  unit: 'kg' | 'lb';
}) {
  // Ascending-by-date metrics for the chart.
  const metrics = useMemo(() => computeDayMetrics(days), [days]);

  const points: ChartPoint[] = useMemo(
    () =>
      metrics.map((m) => ({
        label: formatShort(m.date),
        value: Math.round(convertWeight(m.best1RMkg, 'kg', unit)),
        highlight: m.is1RMPR,
      })),
    [metrics, unit]
  );

  const stats = useMemo(() => {
    let best1RMkg = 0;
    let heaviestKg = 0;
    for (const m of metrics) {
      if (m.best1RMkg > best1RMkg) best1RMkg = m.best1RMkg;
      if (m.topSetKg > heaviestKg) heaviestKg = m.topSetKg;
    }
    return { best1RMkg, heaviestKg, totalDays: metrics.length };
  }, [metrics]);

  if (days.length === 0) {
    return (
      <EmptyState
        title="No data yet"
        subtitle="Log workout days to see your progress."
      />
    );
  }

  return (
    <View>
      <Card>
        <ProgressChart title={`Est. 1RM (${unit})`} points={points} />
      </Card>

      <View style={styles.statsRow}>
        <StatTile
          label="Best 1RM"
          value={formatWeight(convertWeight(stats.best1RMkg, 'kg', unit), unit)}
        />
        <StatTile
          label="Heaviest set"
          value={formatWeight(convertWeight(stats.heaviestKg, 'kg', unit), unit)}
        />
        <StatTile label="Total days" value={String(stats.totalDays)} />
      </View>
    </View>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segBtn, active && styles.segBtnActive]}
    >
      <Text style={[styles.segText, active && styles.segTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SelectableChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.selChip,
        selected && styles.selChipActive,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.selChipText, selected && styles.selChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerBtn: { color: colors.primary, fontSize: fontSize.lg, fontWeight: '600' },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  segBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segBtnActive: { backgroundColor: colors.primary },
  segText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textMuted },
  segTextActive: { color: colors.primaryText },
  addDay: { marginBottom: spacing.lg },
  dayCard: { marginBottom: spacing.md },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dayDate: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  prBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  prBadgeText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  setLine: { fontSize: fontSize.md, color: colors.text, marginTop: 2 },
  emptySets: { fontSize: fontSize.md, color: colors.textMuted },
  deleteDay: { alignSelf: 'flex-start', marginTop: spacing.sm },
  deleteDayText: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  statTile: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  groupLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  groupRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  selChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  selChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  selChipText: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  selChipTextActive: { color: colors.primaryText },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  flexBtn: { flex: 1 },
  deleteBtn: { marginTop: spacing.md },
});
