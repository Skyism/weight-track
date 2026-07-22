import { useCallback, useState } from 'react';
import {
  Stack,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Screen,
  SectionHeader,
} from '../../../components/ui';
import {
  deleteRoutine,
  getRoutineWithExercises,
  listExercises,
  setRoutineExercises,
  updateRoutine,
} from '../../../db/repo';
import { Exercise, RoutineWithExercises } from '../../../lib/types';
import { Check, ChevronDown, ChevronUp, Close } from '../../../components/icons';
import { colors, font, fontSize, letterSpacing, radius, spacing } from '../../../theme/theme';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [routine, setRoutine] = useState<RoutineWithExercises | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const [renameVisible, setRenameVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const [addVisible, setAddVisible] = useState(false);
  const [available, setAvailable] = useState<Exercise[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const r = await getRoutineWithExercises(id);
    setRoutine(r);
    setExercises(r?.exercises ?? []);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const persist = useCallback(
    async (next: Exercise[]) => {
      setExercises(next);
      await setRoutineExercises(
        id,
        next.map((e) => e.id)
      );
    },
    [id]
  );

  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const next = [...exercises];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      persist(next);
    },
    [exercises, persist]
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index >= exercises.length - 1) return;
      const next = [...exercises];
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
      persist(next);
    },
    [exercises, persist]
  );

  const remove = useCallback(
    (exerciseId: string) => {
      persist(exercises.filter((e) => e.id !== exerciseId));
    },
    [exercises, persist]
  );

  const openRename = useCallback(() => {
    setRenameValue(routine?.name ?? '');
    setRenameVisible(true);
  }, [routine]);

  const handleRename = useCallback(async () => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    await updateRoutine(id, { name: trimmed });
    setRenameVisible(false);
    setRoutine((prev) => (prev ? { ...prev, name: trimmed } : prev));
  }, [id, renameValue]);

  const handleDelete = useCallback(async () => {
    await deleteRoutine(id);
    router.back();
  }, [id]);

  const openAdd = useCallback(async () => {
    const all = await listExercises();
    const inRoutine = new Set(exercises.map((e) => e.id));
    setAvailable(all.filter((e) => !inRoutine.has(e.id)));
    setSelectedIds(new Set());
    setAddVisible(true);
  }, [exercises]);

  const toggleSelect = useCallback((exerciseId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  }, []);

  const confirmAdd = useCallback(async () => {
    const toAdd = available.filter((e) => selectedIds.has(e.id));
    if (toAdd.length === 0) {
      setAddVisible(false);
      return;
    }
    const next = [...exercises, ...toAdd];
    await persist(next);
    setAddVisible(false);
  }, [available, selectedIds, exercises, persist]);

  const title = routine?.name ?? 'Routine';

  return (
    <Screen scroll>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <Pressable onPress={openRename} hitSlop={8}>
              <Text style={styles.headerButton}>Rename</Text>
            </Pressable>
          ),
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !routine ? (
        <EmptyState title="Routine not found" subtitle="It may have been deleted." />
      ) : (
        <>
          <Button
            title="Start routine"
            onPress={() => router.push(`/routine/${id}/run`)}
            disabled={exercises.length === 0}
          />

          <SectionHeader>Exercises in this routine</SectionHeader>

          {exercises.length === 0 ? (
            <EmptyState
              title="No exercises yet"
              subtitle="Add exercises to build out this routine."
            />
          ) : (
            exercises.map((ex, index) => (
              <Card key={ex.id} style={styles.exerciseCard}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  {ex.muscleGroup ? <Chip label={ex.muscleGroup} /> : null}
                </View>
                <View style={styles.controls}>
                  <Pressable
                    onPress={() => moveUp(index)}
                    disabled={index === 0}
                    hitSlop={6}
                    style={styles.controlBtn}
                  >
                    <ChevronUp size={20} color={index === 0 ? colors.border : colors.text} />
                  </Pressable>
                  <Pressable
                    onPress={() => moveDown(index)}
                    disabled={index === exercises.length - 1}
                    hitSlop={6}
                    style={styles.controlBtn}
                  >
                    <ChevronDown
                      size={20}
                      color={index === exercises.length - 1 ? colors.border : colors.text}
                    />
                  </Pressable>
                  <Pressable onPress={() => remove(ex.id)} hitSlop={6} style={styles.controlBtn}>
                    <Close size={18} color={colors.faint} />
                  </Pressable>
                </View>
              </Card>
            ))
          )}

          <View style={styles.spacer} />
          <Button title="Add exercises" variant="secondary" onPress={openAdd} />

          <View style={styles.spacer} />
          <Button title="Delete routine" variant="danger" onPress={handleDelete} />
        </>
      )}

      {/* Rename modal */}
      <Modal
        visible={renameVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRenameVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename routine</Text>
            <Field
              label="Name"
              value={renameValue}
              onChangeText={setRenameValue}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleRename}
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setRenameVisible(false)}
                style={styles.modalButton}
              />
              <Button
                title="Save"
                onPress={handleRename}
                disabled={!renameValue.trim()}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Add exercises modal */}
      <Modal
        visible={addVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <Text style={styles.modalTitle}>Add exercises</Text>
            {available.length === 0 ? (
              <EmptyState
                title="Nothing to add"
                subtitle="All your exercises are already in this routine, or you have none yet."
              />
            ) : (
              <ScrollView style={styles.addScroll} contentContainerStyle={styles.addList}>
                {available.map((ex) => {
                  const selected = selectedIds.has(ex.id);
                  return (
                    <Pressable
                      key={ex.id}
                      onPress={() => toggleSelect(ex.id)}
                      style={({ pressed }) => [
                        styles.addRow,
                        selected && styles.addRowSelected,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{ex.name}</Text>
                        {ex.muscleGroup ? <Chip label={ex.muscleGroup} /> : null}
                      </View>
                      <View style={styles.checkSlot}>
                        {selected ? <Check size={20} color={colors.text} /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setAddVisible(false)}
                style={styles.modalButton}
              />
              <Button
                title={selectedIds.size > 0 ? `Add (${selectedIds.size})` : 'Add'}
                onPress={confirmAdd}
                disabled={selectedIds.size === 0}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  headerButton: { color: colors.text, fontSize: fontSize.md, fontFamily: font.medium },
  spacer: { height: spacing.md },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  exerciseInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  exerciseName: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.text },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginLeft: spacing.sm },
  controlBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(24,24,27,0.35)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  modalCardLarge: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontFamily: font.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  modalButton: { flex: 1 },
  addScroll: { flexGrow: 0 },
  addList: { gap: spacing.sm },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  addRowSelected: { borderColor: colors.text },
  checkSlot: { width: 24, alignItems: 'center', marginLeft: spacing.sm },
});
