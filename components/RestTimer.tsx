import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRestTimer } from '../store/useRestTimer';
import { colors, fontSize, radius, spacing } from '../theme/theme';

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Floating rest-timer bar. Renders nothing when the timer is idle.
 * Mount once near the bottom of any screen where logging happens.
 */
export function RestTimerBar() {
  const { running, remaining, stop, addTime } = useRestTimer();
  if (!running) return null;

  return (
    <View style={styles.bar}>
      <Text style={styles.label}>Rest</Text>
      <Text style={styles.time}>{fmt(remaining)}</Text>
      <View style={styles.actions}>
        <Pressable onPress={() => addTime(15)} style={styles.action}>
          <Text style={styles.actionText}>+15s</Text>
        </Pressable>
        <Pressable onPress={stop} style={styles.action}>
          <Text style={styles.actionText}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  label: { color: colors.card, fontSize: fontSize.md, fontWeight: '600' },
  time: {
    color: colors.card,
    fontSize: fontSize.xl,
    fontWeight: '800',
    marginLeft: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  actions: { flexDirection: 'row', marginLeft: 'auto', gap: spacing.sm },
  action: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionText: { color: colors.card, fontSize: fontSize.sm, fontWeight: '700' },
});
