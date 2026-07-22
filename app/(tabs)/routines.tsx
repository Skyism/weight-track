import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card, EmptyState, Fab, Field, Screen } from '../../components/ui';
import { createRoutine, listRoutines } from '../../db/repo';
import { Routine } from '../../lib/types';
import { colors, font, fontSize, radius, spacing } from '../../theme/theme';

export default function RoutinesScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const rows = await listRoutines();
    setRoutines(rows);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openCreate = useCallback(() => {
    setName('');
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const created = await createRoutine(trimmed);
      setModalVisible(false);
      setName('');
      router.push(`/routine/${created.id}`);
    } finally {
      setSaving(false);
    }
  }, [name, saving]);

  return (
    <Screen scroll>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : routines.length === 0 ? (
        <EmptyState
          title="No routines yet"
          subtitle="Group your exercises into a routine you can run in one go."
          action={<Button title="Create routine" onPress={openCreate} />}
        />
      ) : (
        routines.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => router.push(`/routine/${r.id}`)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginBottom: spacing.md })}
          >
            <Card>
              <Text style={styles.routineName}>{r.name}</Text>
            </Card>
          </Pressable>
        ))
      )}

      {!loading && routines.length > 0 ? <Fab onPress={openCreate} /> : null}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New routine</Text>
            <Field
              label="Name"
              placeholder="e.g. Push day"
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                title="Save"
                onPress={handleSave}
                disabled={!name.trim()}
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

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  routineName: { fontSize: fontSize.lg, fontFamily: font.semibold, color: colors.text },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(24,24,27,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontFamily: font.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  modalButton: { flex: 1 },
});
