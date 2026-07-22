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
import { colors, font, fontSize, letterSpacing, radius, spacing } from '../theme/theme';
import { Plus } from './icons';

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
  const isFilled = variant === 'primary';
  const bg = variant === 'primary' ? colors.primary : colors.card;
  const fg =
    variant === 'primary'
      ? colors.primaryText
      : variant === 'danger'
        ? colors.danger
        : colors.text;
  const bordered = variant === 'secondary' || variant === 'danger';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: variant === 'ghost' ? 'transparent' : bg, opacity: disabled ? 0.35 : pressed ? 0.65 : 1 },
        bordered && styles.buttonBordered,
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
  mono = false,
  style,
  ...props
}: TextInputProps & { label?: string; mono?: boolean }) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.faint}
        style={[styles.input, mono && styles.inputMono, style]}
        {...props}
      />
    </View>
  );
}

export function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label.toUpperCase()}</Text>
    </View>
  );
}

export function SectionHeader({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionHeader}>{children}</Text>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

/** Minimal segmented control (2+ options). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.segment, style]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segItem, active && styles.segItemActive]}
          >
            <Text style={[styles.segText, active && styles.segTextActive]}>
              {opt.label.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
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
      {action ? <View style={{ marginTop: spacing.xl }}>{action}</View> : null}
    </View>
  );
}

/** Floating action button (bottom-right) — red circle with a line-icon plus. */
export function Fab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.85 : 1 }]}
    >
      <Plus size={24} color={colors.primaryText} strokeWidth={2} />
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
    minHeight: 50,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonBordered: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  buttonText: {
    fontFamily: font.semibold,
    fontSize: fontSize.md,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
  },
  fieldWrap: { marginBottom: spacing.md },
  label: {
    fontFamily: font.semibold,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSize.lg,
    fontFamily: font.regular,
    color: colors.text,
  },
  inputMono: { fontFamily: font.mono, letterSpacing: letterSpacing.tight },
  chip: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipText: {
    fontFamily: font.medium,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wide,
  },
  sectionHeader: {
    fontFamily: font.semibold,
    fontSize: fontSize.xs,
    color: colors.faint,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
  segment: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  segItem: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segItemActive: { backgroundColor: colors.text },
  segText: {
    fontFamily: font.semibold,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wide,
  },
  segTextActive: { color: colors.bg },
  empty: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, flexGrow: 1 },
  emptyTitle: {
    fontFamily: font.semibold,
    fontSize: fontSize.lg,
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: font.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 21,
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
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
