import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Screen,
  SectionHeader,
  SegmentedControl,
} from '../../components/ui';
import { ChevronLeft, ChevronRight } from '../../components/icons';
import { ProgressChart, ChartPoint } from '../../components/ProgressChart';
import {
  addFood,
  deleteFood,
  listDailyNutrition,
  listFoodForDate,
  todayISODate,
  updateFood,
} from '../../db/repo';
import { DailyNutrition, FoodEntry } from '../../lib/types';
import { syncWidget } from '../../lib/widgetSync';
import { useSettings } from '../../store/useSettings';
import { colors, font, fontSize, letterSpacing, radius, spacing } from '../../theme/theme';

type Tab = 'today' | 'trends';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function shiftDate(iso: string, delta: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}
function formatNice(iso: string): string {
  const d = parseISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
function formatShort(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
function round(n: number): number {
  return Math.round(n);
}

export default function NutritionScreen() {
  const { calorieTarget, proteinTarget, setCalorieTarget, setProteinTarget } = useSettings();

  const [tab, setTab] = useState<Tab>('today');
  const [date, setDate] = useState<string>(todayISODate());
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [daily, setDaily] = useState<DailyNutrition[]>([]);

  // food add/edit modal
  const [foodModal, setFoodModal] = useState(false);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [fName, setFName] = useState('');
  const [fCalories, setFCalories] = useState('');
  const [fProtein, setFProtein] = useState('');

  // targets modal
  const [targetModal, setTargetModal] = useState(false);
  const [tCal, setTCal] = useState('');
  const [tProtein, setTProtein] = useState('');

  const today = todayISODate();
  const isToday = date === today;

  const load = useCallback(async () => {
    const [rows, agg] = await Promise.all([listFoodForDate(date), listDailyNutrition()]);
    setEntries(rows);
    setDaily(agg);
    syncWidget();
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    for (const e of entries) {
      calories += e.calories;
      protein += e.protein;
    }
    return { calories, protein };
  }, [entries]);

  const openAdd = useCallback(() => {
    setEditing(null);
    setFName('');
    setFCalories('');
    setFProtein('');
    setFoodModal(true);
  }, []);

  const openEdit = useCallback((entry: FoodEntry) => {
    setEditing(entry);
    setFName(entry.name);
    setFCalories(String(entry.calories));
    setFProtein(String(entry.protein));
    setFoodModal(true);
  }, []);

  const saveFood = useCallback(async () => {
    const name = fName.trim();
    if (!name) return;
    const calories = parseFloat(fCalories) || 0;
    const protein = parseFloat(fProtein) || 0;
    if (editing) {
      await updateFood(editing.id, { name, calories, protein });
    } else {
      await addFood(date, { name, calories, protein });
    }
    setFoodModal(false);
    await load();
  }, [fName, fCalories, fProtein, editing, date, load]);

  const removeFood = useCallback(async () => {
    if (!editing) return;
    await deleteFood(editing.id);
    setFoodModal(false);
    await load();
  }, [editing, load]);

  const openTargets = useCallback(() => {
    setTCal(String(calorieTarget));
    setTProtein(String(proteinTarget));
    setTargetModal(true);
  }, [calorieTarget, proteinTarget]);

  const saveTargets = useCallback(async () => {
    await setCalorieTarget(Math.max(0, Math.round(parseFloat(tCal) || 0)));
    await setProteinTarget(Math.max(0, Math.round(parseFloat(tProtein) || 0)));
    setTargetModal(false);
    syncWidget();
  }, [tCal, tProtein, setCalorieTarget, setProteinTarget]);

  return (
    <Screen scroll>
      <View style={styles.segmentWrap}>
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { label: 'Today', value: 'today' },
            { label: 'Trends', value: 'trends' },
          ]}
        />
      </View>

      {tab === 'today' ? (
        <>
          <View style={styles.dateNav}>
            <Pressable onPress={() => setDate(shiftDate(date, -1))} hitSlop={8} style={styles.navBtn}>
              <ChevronLeft size={22} color={colors.text} />
            </Pressable>
            <View style={styles.dateCenter}>
              <Text style={styles.dateLabel}>{isToday ? 'TODAY' : formatNice(date).toUpperCase()}</Text>
              {!isToday ? <Text style={styles.dateSub}>{formatNice(date)}</Text> : null}
            </View>
            <Pressable
              onPress={() => setDate(shiftDate(date, 1))}
              disabled={isToday}
              hitSlop={8}
              style={styles.navBtn}
            >
              <ChevronRight size={22} color={isToday ? colors.border : colors.text} />
            </Pressable>
          </View>

          <Meter
            label="Calories"
            value={totals.calories}
            target={calorieTarget}
            suffix="kcal"
            overIsBad
          />
          <View style={{ height: spacing.md }} />
          <Meter label="Protein" value={totals.protein} target={proteinTarget} suffix="g" />

          <View style={styles.actionRow}>
            <Button title="Edit targets" variant="secondary" onPress={openTargets} style={styles.flexBtn} />
            <Button title="Add food" onPress={openAdd} style={styles.flexBtn} />
          </View>

          {entries.length === 0 ? (
            <EmptyState title="Nothing logged" subtitle="Add what you ate to track calories and protein." />
          ) : (
            entries.map((e) => (
              <Pressable
                key={e.id}
                onPress={() => openEdit(e)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Card style={styles.foodRow}>
                  <Text style={styles.foodName} numberOfLines={1}>
                    {e.name}
                  </Text>
                  <View style={styles.foodMacros}>
                    <Text style={styles.foodProtein}>{round(e.protein)}g</Text>
                    <Text style={styles.foodCals}>{round(e.calories)} kcal</Text>
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </>
      ) : (
        <TrendsTab daily={daily} calorieTarget={calorieTarget} proteinTarget={proteinTarget} />
      )}

      {/* Add / edit food */}
      <Modal visible={foodModal} animationType="slide" transparent onRequestClose={() => setFoodModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editing ? 'Edit food' : 'Add food'}</Text>
            <Field label="Name" placeholder="e.g. Chicken & rice" value={fName} onChangeText={setFName} autoFocus />
            <View style={styles.macroRow}>
              <View style={styles.macroCol}>
                <Field label="Calories" mono keyboardType="numeric" value={fCalories} onChangeText={setFCalories} placeholder="0" />
              </View>
              <View style={styles.macroCol}>
                <Field label="Protein (g)" mono keyboardType="numeric" value={fProtein} onChangeText={setFProtein} placeholder="0" />
              </View>
            </View>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setFoodModal(false)} style={styles.flexBtn} />
              <Button title="Save" onPress={saveFood} disabled={!fName.trim()} style={styles.flexBtn} />
            </View>
            {editing ? (
              <Button title="Delete" variant="danger" onPress={removeFood} style={styles.deleteBtn} />
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Edit targets */}
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
    </Screen>
  );
}

function Meter({
  label,
  value,
  target,
  suffix,
  overIsBad = false,
}: {
  label: string;
  value: number;
  target: number;
  suffix: string;
  overIsBad?: boolean;
}) {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  const over = target > 0 && value > target;
  const fillColor = over && overIsBad ? colors.accent : colors.text;
  const remaining = round(target - value);

  return (
    <Card>
      <View style={styles.meterHead}>
        <Text style={styles.meterLabel}>{label}</Text>
        <Text style={styles.meterRemaining}>
          {remaining >= 0 ? `${remaining} ${suffix} left` : `${Math.abs(remaining)} ${suffix} over`}
        </Text>
      </View>
      <View style={styles.meterValueRow}>
        <Text style={styles.meterValue}>{round(value)}</Text>
        <Text style={styles.meterTarget}>
          {' '}
          / {round(target)} {suffix}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: fillColor }]} />
      </View>
    </Card>
  );
}

function TrendsTab({
  daily,
  calorieTarget,
  proteinTarget,
}: {
  daily: DailyNutrition[];
  calorieTarget: number;
  proteinTarget: number;
}) {
  const recent = useMemo(() => daily.slice(-30), [daily]);

  const caloriePoints: ChartPoint[] = useMemo(
    () => recent.map((d) => ({ label: formatShort(d.date), value: round(d.calories) })),
    [recent]
  );
  const proteinPoints: ChartPoint[] = useMemo(
    () => recent.map((d) => ({ label: formatShort(d.date), value: round(d.protein) })),
    [recent]
  );

  const stats = useMemo(() => {
    if (recent.length === 0) return { avgCal: 0, avgProtein: 0, onTarget: 0 };
    let cal = 0;
    let protein = 0;
    let onTarget = 0;
    for (const d of recent) {
      cal += d.calories;
      protein += d.protein;
      if (proteinTarget > 0 && d.protein >= proteinTarget) onTarget += 1;
    }
    return {
      avgCal: round(cal / recent.length),
      avgProtein: round(protein / recent.length),
      onTarget,
    };
  }, [recent, proteinTarget]);

  if (daily.length === 0) {
    return <EmptyState title="No data yet" subtitle="Log food across a few days to see your trends." />;
  }

  return (
    <View>
      <Card style={styles.chartCard}>
        <ProgressChart title="Calories / day" points={caloriePoints} reference={calorieTarget} />
      </Card>
      <View style={{ height: spacing.md }} />
      <Card style={styles.chartCard}>
        <ProgressChart title="Protein / day (g)" points={proteinPoints} reference={proteinTarget} />
      </Card>

      <SectionHeader>Last {recent.length} days</SectionHeader>
      <View style={styles.statsRow}>
        <Stat label="Avg kcal" value={String(stats.avgCal)} />
        <Stat label="Avg protein" value={`${stats.avgProtein}g`} />
        <Stat label="Protein hit" value={String(stats.onTarget)} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  segmentWrap: { marginBottom: spacing.lg },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dateCenter: { alignItems: 'center' },
  dateLabel: { fontSize: fontSize.sm, fontFamily: font.semibold, color: colors.text, letterSpacing: letterSpacing.wide },
  dateSub: { fontSize: fontSize.xs, fontFamily: font.regular, color: colors.faint, marginTop: 2 },
  meterHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  meterLabel: {
    fontSize: fontSize.xs,
    fontFamily: font.semibold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
  },
  meterRemaining: { fontSize: fontSize.sm, fontFamily: font.mono, color: colors.faint, letterSpacing: letterSpacing.tight },
  meterValueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.md },
  meterValue: { fontSize: fontSize.xxl, fontFamily: font.monoMedium, color: colors.text, letterSpacing: letterSpacing.tight },
  meterTarget: { fontSize: fontSize.md, fontFamily: font.mono, color: colors.faint, letterSpacing: letterSpacing.tight },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  actionRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, marginBottom: spacing.lg },
  foodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  foodName: { flex: 1, fontSize: fontSize.md, fontFamily: font.medium, color: colors.text, marginRight: spacing.md },
  foodMacros: { alignItems: 'flex-end' },
  foodProtein: { fontSize: fontSize.md, fontFamily: font.monoMedium, color: colors.text, letterSpacing: letterSpacing.tight },
  foodCals: { fontSize: fontSize.sm, fontFamily: font.mono, color: colors.faint, letterSpacing: letterSpacing.tight, marginTop: 2 },
  chartCard: {},
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  statTile: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: fontSize.lg, fontFamily: font.monoMedium, color: colors.text, letterSpacing: letterSpacing.tight },
  statLabel: {
    fontSize: fontSize.xs,
    fontFamily: font.medium,
    color: colors.faint,
    marginTop: spacing.xs,
    textAlign: 'center',
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
  },
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
  deleteBtn: { marginTop: spacing.md },
});
