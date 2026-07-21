import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '../theme/theme';

export function Screen({
  children,
  scroll = false,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const isFilled = variant === 'primary' || variant === 'danger';
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : variant === 'secondary'
          ? colors.card
          : 'transparent';
  const fg = isFilled ? colors.primaryText : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        variant === 'secondary' && styles.buttonBordered,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label?: string }) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export function SectionHeader({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionHeader}>{children}</Text>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
      {action ? <View style={{ marginTop: spacing.lg }}>{action}</View> : null}
    </View>
  );
}

/** Floating action button (bottom-right). */
export function Fab({ onPress, label = '+' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.8 : 1 }]}
    >
      <Text style={styles.fabText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonBordered: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  buttonText: { fontSize: fontSize.lg, fontWeight: '600' },
  fieldWrap: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.xs, fontWeight: '600' },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  chip: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
  sectionHeader: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },
  empty: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, flexGrow: 1 },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fabText: { color: colors.primaryText, fontSize: 30, fontWeight: '300', lineHeight: 34 },
});
