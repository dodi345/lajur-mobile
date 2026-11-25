import { SymbolView } from "expo-symbols";
import type { AndroidSymbol } from "expo-symbols";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { RADIUS, TOUCH, useTheme, type Theme } from "@/lib/theme";

// Komponen dasar. Semua warna lewat token tema (lib/theme.ts), tidak ada warna mentah di layar.

type Tone = "text" | "muted" | "primary" | "income" | "expense" | "transfer" | "warning" | "destructive" | "onHero" | "heroMuted";

const toneColor = (theme: Theme, tone: Tone) =>
  ({
    text: theme.text,
    muted: theme.textMuted,
    primary: theme.primary,
    income: theme.income,
    expense: theme.expense,
    transfer: theme.transfer,
    warning: theme.warning,
    destructive: theme.destructive,
    onHero: theme.onHero,
    heroMuted: theme.heroMuted,
  })[tone];

const VARIANTS = {
  hero: { fontSize: 34, fontWeight: "700", lineHeight: 40 },
  title: { fontSize: 22, fontWeight: "700", lineHeight: 28 },
  heading: { fontSize: 17, fontWeight: "600", lineHeight: 22 },
  body: { fontSize: 15, lineHeight: 21 },
  amount: { fontSize: 16, fontWeight: "600", lineHeight: 21 },
  label: { fontSize: 13, lineHeight: 18 },
} satisfies Record<string, TextStyle>;

export function AppText({
  variant = "body",
  tone = "text",
  numeric,
  style,
  ...props
}: TextProps & { variant?: keyof typeof VARIANTS; tone?: Tone; numeric?: boolean }) {
  const theme = useTheme();
  return (
    <Text
      {...props}
      style={[
        VARIANTS[variant],
        { color: toneColor(theme, tone) },
        // Nominal: digit sejajar (tabular-nums), seperti di web.
        numeric && { fontVariant: ["tabular-nums"] },
        style,
      ]}
    />
  );
}

export function Icon({ name, size = 22, color }: { name: AndroidSymbol; size?: number; color?: string }) {
  const theme = useTheme();
  return <SymbolView name={{ android: name, web: name }} size={size} tintColor={color ?? theme.text} />;
}

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: AndroidSymbol;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const background =
    variant === "primary" ? theme.primary : variant === "secondary" ? theme.card : "transparent";
  const foreground =
    variant === "primary" ? theme.onPrimary : variant === "destructive" ? theme.destructive : theme.primary;
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: inactive ? 0.55 : pressed ? 0.8 : 1 },
        variant === "secondary" && { borderWidth: 1, borderColor: theme.border },
        variant === "destructive" && { borderWidth: 1, borderColor: theme.destructive },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={foreground} /> : icon ? <Icon name={icon} size={20} color={foreground} /> : null}
      <Text style={[styles.buttonLabel, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
}

export function TextField({
  label,
  error,
  hint,
  style,
  ...props
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={theme.textMuted}
        accessibilityLabel={label}
        {...props}
        style={[
          styles.input,
          { backgroundColor: theme.card, color: theme.text, borderColor: error ? theme.destructive : theme.border },
          style,
        ]}
      />
      {error ? (
        <AppText variant="label" tone="destructive">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="label" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, style]}>{children}</View>
  );
}

/** Pilihan satu dari beberapa (jenis transaksi, filter). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.card, borderColor: theme.border }]} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.segmentLabel, { color: selected ? theme.onPrimary : theme.text }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Pilihan berbentuk chip (dompet, kategori, tanggal). */
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : theme.card },
      ]}
    >
      <Text style={[styles.chipLabel, { color: selected ? theme.onPrimary : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Loading() {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.primary} size="large" />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Icon name="error" size={32} />
      <AppText style={styles.centerText}>{message}</AppText>
      {onRetry && <Button label="Coba lagi" variant="secondary" onPress={onRetry} />}
    </View>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return (
    <View style={styles.center}>
      <AppText variant="heading" style={styles.centerText}>
        {title}
      </AppText>
      {message && (
        <AppText tone="muted" style={styles.centerText}>
          {message}
        </AppText>
      )}
      {action}
    </View>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <AppText variant="label" tone="destructive" accessibilityRole="alert">
      {message}
    </AppText>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: RADIUS,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonLabel: { fontSize: 16, fontWeight: "600" },
  field: { gap: 6 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: RADIUS, paddingHorizontal: 14, fontSize: 16 },
  card: { borderWidth: 1, borderRadius: RADIUS, padding: 16, gap: 12 },
  segmented: { flexDirection: "row", borderWidth: 1, borderRadius: RADIUS, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: TOUCH - 4, borderRadius: RADIUS - 4, alignItems: "center", justifyContent: "center" },
  segmentLabel: { fontSize: 14, fontWeight: "600" },
  chip: { minHeight: TOUCH - 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, justifyContent: "center" },
  chipLabel: { fontSize: 14, fontWeight: "500" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12, minHeight: 240 },
  centerText: { textAlign: "center" },
});
