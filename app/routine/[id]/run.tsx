import { useCallback, useEffect, useState } from 'react';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Chip, EmptyState, Screen, SectionHeader } from '../../../components/ui';
import { getRoutineWithExercises } from '../../../db/repo';
import { RoutineWithExercises } from '../../../lib/types';
import { colors, fontSize, radius, spacing } from '../../../theme/theme';

export default function RunRoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    (async () => {
      const r = await getRoutineWithExercises(id);
      if (!active) return;
      setRoutine(r);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const toggle = useCallback((exerciseId: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  }, []);

  const exercises = routine?.exercises ?? [];
  const doneCount = exercises.filter((e) => completed.has(e.id)).length;

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: routine ? `Run: ${routine.name}` : 'Run' }} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !routine ? (
        <EmptyState title="Routine not found" subtitle="It may have been deleted." />
      ) : exercises.length === 0 ? (
        <EmptyState
          title="No exercises"
          subtitle="This routine has no exercises to run."
          action={<Button title="Back" variant="secondary" onPress={() => router.back()} />}
        />
      ) : (
        <>
          <Text style={styles.progress}>
            {doneCount} of {exercises.length} done
          </Text>

          <SectionHeader>Checklist</SectionHeader>

          {exercises.map((ex) => {
            const done = completed.has(ex.id);
            return (
              <Card key={ex.id} style={styles.card}>
                <Pressable onPress={() => toggle(ex.id)} hitSlop={6} style={styles.checkbox}>
                  <View style={[styles.checkBox, done && styles.checkBoxOn]}>
                    {done ? <Text style={styles.checkGlyph}>✓</Text> : null}
                  </View>
                </Pressable>

                <View style={styles.info}>
                  <Text style={[styles.name, done && styles.nameDone]}>{ex.name}</Text>
                  {ex.muscleGroup ? <Chip label={ex.muscleGroup} /> : null}
                </View>

                <Button
                  title="Log"
                  variant="secondary"
                  onPress={() => router.push(`/exercise/${ex.id}/edit-day`)}
                  style={styles.logButton}
                />
              </Card>
            );
          })}

          <View style={styles.spacer} />
          <Button title="Finish" onPress={() => router.back()} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  progress: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  checkbox: { padding: spacing.xs },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: colors.success, borderColor: colors.success },
  checkGlyph: { color: colors.primaryText, fontSize: fontSize.md, fontWeight: '800' },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  name: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  nameDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  logButton: { minHeight: 36, paddingHorizontal: spacing.md },
  spacer: { height: spacing.md },
});
