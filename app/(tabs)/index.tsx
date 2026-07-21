import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Fab,
  Field,
  Screen,
} from '../../components/ui';
import { createExercise, listExercises } from '../../db/repo';
import { Exercise, MUSCLE_GROUPS, MuscleGroup } from '../../lib/types';
import { colors, fontSize, radius, spacing } from '../../theme/theme';

// "None" sentinel for the muscle-group selector in the create modal.
type GroupSelection = MuscleGroup | null;

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState<GroupSelection>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const rows = await listExercises();
    setExercises(rows);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((ex) => {
      const name = ex.name.toLowerCase();
      const group = (ex.muscleGroup ?? '').toLowerCase();
      return name.includes(q) || group.includes(q);
    });
  }, [exercises, query]);

  const openModal = useCallback(() => {
    setNewName('');
    setNewGroup(null);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  const save = useCallback(async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      await createExercise({ name, muscleGroup: newGroup });
      setModalVisible(false);
      await load();
    } finally {
      setSaving(false);
    }
  }, [newName, newGroup, load]);

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <Pressable
        onPress={() => router.push(`/exercise/${item.id}`)}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        <Card style={styles.row}>
          <Text style={styles.exName}>{item.name}</Text>
          {item.muscleGroup ? <Chip label={item.muscleGroup} /> : null}
        </Card>
      </Pressable>
    ),
    []
  );

  return (
    <Screen>
      <View style={styles.container}>
        <Field
          placeholder="Search exercises"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />

        {loading ? null : filtered.length === 0 ? (
          <EmptyState
            title={query.trim() ? 'No matches' : 'No exercises yet'}
            subtitle={
              query.trim()
                ? 'Try a different search.'
                : 'Add your first exercise to start tracking.'
            }
            action={
              query.trim() ? undefined : (
                <Button title="Add exercise" onPress={openModal} />
              )
            }
          />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

      <Fab onPress={openModal} />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New exercise</Text>

            <Field
              label="Name"
              placeholder="e.g. Bench Press"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <Text style={styles.groupLabel}>Muscle group</Text>
            <View style={styles.groupRow}>
              <SelectableChip
                label="None"
                selected={newGroup === null}
                onPress={() => setNewGroup(null)}
              />
              {MUSCLE_GROUPS.map((g) => (
                <SelectableChip
                  key={g}
                  label={g}
                  selected={newGroup === g}
                  onPress={() => setNewGroup(g)}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={closeModal}
                style={styles.modalButton}
              />
              <Button
                title="Save"
                onPress={save}
                disabled={!newName.trim()}
                loading={saving}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
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
  container: { flex: 1, padding: spacing.lg },
  listContent: { paddingBottom: spacing.xl * 3 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, flexShrink: 1 },
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
  modalButton: { flex: 1 },
});
