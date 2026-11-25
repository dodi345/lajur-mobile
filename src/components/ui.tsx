import { Children, Fragment, isValidElement, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Icon, type BoxIconName } from "@/components/icon";
import { font, RADIUS, TALL, TOUCH, useTheme, type Theme, type Weight } from "@/lib/theme";

// Komponen dasar = komponen web Lajur (components/ui/*, form-field, money-input) dengan ukuran persis.

export type Tone = keyof Pick<
  Theme,
  | "foreground"
  | "mutedForeground"
  | "primary"
  | "primaryForeground"
  | "income"
  | "expense"
  | "transfer"
  | "warning"
  | "destructive"
  | "heroForeground"
  | "heroMuted"
>;

/** Teks Inter. size/weight/lineHeight sama dengan kelas Tailwind web (line-height bawaan 1.5). */
export function AppText({
  size = 16,
  weight = 400,
  tone = "foreground",
  lineHeight,
  numeric,
  style,
  ...props
}: TextProps & { size?: number; weight?: Weight; tone?: Tone; lineHeight?: number; numeric?: boolean }) {
  const theme = useTheme();
  return (
    <Text
      {...props}
      style={[
        font(size, weight, lineHeight ?? size * 1.5),
        { color: theme[tone] },
        numeric && styles.tabular,
        style,
      ]}
    />
  );
}

type ButtonVariant = "default" | "outline" | "destructive" | "ghost";

/**
 * Button web: h-11 (44) px-4 text-sm medium, radius 16.8 (rounded-xl yang dipakai app).
 * `big` = h-13 (52) text-base semibold (tombol utama form). Ikon di dalam tombol selalu 16px.
 */
export function Button({
  label,
  onPress,
  variant = "default",
  big,
  icon,
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  big?: boolean;
  icon?: BoxIconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const colors: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    default: { bg: theme.primary, fg: theme.primaryForeground, border: "transparent" },
    outline: { bg: theme.outlineBg, fg: theme.foreground, border: theme.border },
    destructive: { bg: theme.destructiveButton, fg: theme.destructive, border: "transparent" },
    ghost: { bg: "transparent", fg: theme.destructive, border: "transparent" },
  };
  const { bg, fg, border } = colors[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        big && styles.buttonBig,
        { backgroundColor: bg, borderColor: border, opacity: inactive ? 0.5 : 1 },
        pressed && styles.pressedDown,
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : icon ? <Icon name={icon} size={16} color={fg} /> : null}
      <Text style={[big ? font(16, 600) : font(14, 500, 20), { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/** Tautan teks primary (h-11, semibold), mis. "Kelola", "Lihat semua", "Lupa password?". */
export function TextLink({ label, onPress, size = 14, style }: { label: string; onPress: () => void; size?: number; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }, style]} hitSlop={4}>
      <Text style={[font(size, 600, size === 14 ? 20 : size * 1.5), { color: theme.primary }]}>{label}</Text>
    </Pressable>
  );
}

/** Label 13 medium muted → kontrol → petunjuk/error 13px (FormField web, jarak 6px). */
export function FormField({ label, hint, error, children }: { label?: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      {label ? (
        <AppText size={13} weight={500} tone="mutedForeground">
          {label}
        </AppText>
      ) : null}
      {children}
      {error ? (
        <AppText size={13} tone="destructive" accessibilityRole="alert">
          {error}
        </AppText>
      ) : hint ? (
        <AppText size={13} tone="mutedForeground">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

/**
 * Cincin fokus web (focus:border-primary + ring-3 primary/50, atau destructive/20 kalau tidak valid).
 * Ring di web tidak menggeser tata letak, jadi pembungkusnya memakai margin negatif 3px.
 */
function FocusRing({ focused, invalid, radius, children }: { focused: boolean; invalid?: boolean; radius: number; children: ReactNode }) {
  const theme = useTheme();
  const ring = invalid ? `${theme.destructive}33` : focused ? `${theme.primary}80` : "transparent";
  return <View style={[styles.ring, { borderRadius: radius + 3, borderColor: ring }]}>{children}</View>;
}

/** Tanpa garis fokus bawaan browser di versi web (pratinjau); di Android tidak berpengaruh. */
const noOutline: TextStyle | null = Platform.OS === "web" ? { outlineWidth: 0 } : null;

/** Input h-13 rounded-xl px-4 text-base, latar muted (gelap: input/30). */
export function Input({
  invalid,
  style,
  onBackground,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { invalid?: boolean; onBackground?: boolean }) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <FocusRing focused={focused} invalid={invalid} radius={RADIUS.xl}>
      <TextInput
        placeholderTextColor={theme.mutedForeground}
        selectionColor={theme.primary}
        {...props}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          font(16, 400, 22),
          noOutline,
          {
            backgroundColor: onBackground ? theme.background : theme.inputBg,
            color: theme.foreground,
            borderColor: invalid ? theme.destructive : focused ? theme.primary : theme.border,
          },
          style,
        ]}
      />
    </FocusRing>
  );
}

/** MoneyInput web: "Rp" 16 muted + angka 18 semibold tabular, h-13, latar muted. */
export function MoneyInput({
  value,
  onChangeText,
  invalid,
  autoFocus,
  accessibilityLabel,
}: {
  value: string;
  onChangeText: (text: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
  accessibilityLabel: string;
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <FocusRing focused={focused} invalid={invalid} radius={RADIUS.xl}>
      <View
        style={[
          styles.money,
          { backgroundColor: theme.muted, borderColor: invalid ? theme.destructive : focused ? theme.primary : theme.border },
        ]}
      >
        <AppText size={16} tone="mutedForeground">
          Rp
        </AppText>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={theme.mutedForeground}
          selectionColor={theme.primary}
          autoFocus={autoFocus}
          accessibilityLabel={accessibilityLabel}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.moneyText, font(18, 600, 28), styles.tabular, noOutline, { color: theme.foreground }]}
        />
      </View>
    </FocusRing>
  );
}

/** Chip pilihan (radio): min-h-11 rounded-xl border, terpilih = garis primary + latar primary 5% + teks primary. */
export function ChoiceChip({
  selected,
  onPress,
  label,
  children,
  style,
  accessibilityLabel,
  disabled,
  onLayout,
}: {
  selected: boolean;
  onPress: () => void;
  label?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Tidak bisa dipilih (web: input radio disabled); tampilannya diatur pemanggil (mis. opacity 60%). */
  disabled?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: Boolean(disabled) }}
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onLayout={onLayout}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: selected ? theme.primary : theme.border,
          backgroundColor: selected ? theme.primary5 : theme.background,
        },
        pressed && styles.pressedDown,
        style,
      ]}
    >
      {children ?? <Text style={[font(14, 500, 20), { color: selected ? theme.primary : theme.foreground }]}>{label}</Text>}
    </Pressable>
  );
}

/** Segmented: track muted p-1 gap-1 rounded-xl; segmen h-11 rounded-lg; terpilih latar background + teks primary. */
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
    <View style={[styles.segmented, { backgroundColor: theme.muted }]} accessibilityRole="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: theme.background }]}
          >
            <Text style={[font(14, 500, 20), { color: selected ? theme.primary : theme.mutedForeground }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Kartu daftar ala iOS: latar muted, rounded-xl, garis 1px di antara baris (tanpa inset). */
export function InsetCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <View style={[styles.insetCard, { backgroundColor: theme.muted }, style]}>
      {items.map((child, index) => (
        <Fragment key={child.key ?? index}>
          {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

/** Lingkaran ikon 40px (atau 32px), glyph 20px. Di dalam kartu muted latarnya = background. */
export function IconChip({
  name,
  size = 40,
  color,
  background,
}: {
  name: BoxIconName;
  size?: 40 | 32;
  color?: string;
  background?: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.iconChip, { width: size, height: size, backgroundColor: background ?? theme.muted }]}>
      <Icon name={name} size={20} color={color ?? theme.mutedForeground} />
    </View>
  );
}

/** Judul bagian (h2 16 semibold) + tautan kanan (14 semibold primary, h-11). */
export function SectionHeader({ title, link, onLink }: { title: string; link?: string; onLink?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText size={16} weight={600} style={styles.flex} accessibilityRole="header">
        {title}
      </AppText>
      {link && onLink ? <TextLink label={link} onPress={onLink} style={styles.sectionLink} /> : null}
    </View>
  );
}

/** Pesan form: garis destructive/30 + AlertCircle (error) atau garis border + CheckCircle hijau (sukses). */
export function FormMessage({ message, success }: { message: string; success?: boolean }) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[styles.formMessage, { borderColor: success ? theme.border : theme.destructive30 }]}
    >
      <Icon name={success ? "CheckCircle" : "AlertCircle"} size={20} color={success ? theme.income : theme.destructive} />
      <AppText size={14} lineHeight={20} tone={success ? "foreground" : "destructive"} style={styles.flex}>
        {message}
      </AppText>
    </View>
  );
}

export function Loading({ label = "Memuat…" }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.state}>
      <ActivityIndicator color={theme.primary} />
      <AppText size={14} lineHeight={20} tone="mutedForeground">
        {label}
      </AppText>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.state}>
      <FormMessage message={message} />
      {onRetry ? <Button label="Coba lagi" variant="outline" onPress={onRetry} style={styles.retry} /> : null}
    </View>
  );
}

/** Kosong: judul semibold + teks 14 muted + tautan primary, rata tengah (py-10). */
export function EmptyState({ title, message, link, onLink }: { title?: string; message: string; link?: string; onLink?: () => void }) {
  return (
    <View style={styles.empty}>
      {title ? (
        <AppText size={16} weight={600}>
          {title}
        </AppText>
      ) : null}
      <AppText size={14} lineHeight={20} tone="mutedForeground" style={styles.center}>
        {message}
      </AppText>
      {link && onLink ? <TextLink label={link} onPress={onLink} size={16} /> : null}
    </View>
  );
}

export function usePressedRow() {
  const theme = useTheme();
  return ({ pressed }: { pressed: boolean }): ViewStyle => (pressed ? { backgroundColor: theme.pressedRow } : {});
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: "center" },
  tabular: { fontVariant: ["tabular-nums"] } satisfies TextStyle,
  pressedDown: { transform: [{ translateY: 1 }] },
  button: {
    minHeight: TOUCH,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  buttonBig: { minHeight: TALL },
  link: { minHeight: TOUCH, justifyContent: "center", paddingHorizontal: 4 },
  field: { gap: 6 },
  ring: { margin: -3, borderWidth: 3 },
  input: { height: TALL, borderWidth: 1, borderRadius: RADIUS.xl, paddingHorizontal: 16 },
  money: {
    height: TALL,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moneyText: { flex: 1, height: "100%", padding: 0 },
  chip: {
    minHeight: TOUCH,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  segmented: { flexDirection: "row", borderRadius: RADIUS.xl, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: TOUCH, borderRadius: RADIUS.lg, alignItems: "center", justifyContent: "center" },
  insetCard: { borderRadius: RADIUS.xl, overflow: "hidden" },
  // 1px CSS di web = 1dp.
  divider: { height: 1 },
  iconChip: { borderRadius: RADIUS.full, alignItems: "center", justifyContent: "center" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionLink: { marginRight: -4 },
  formMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  state: { paddingVertical: 40, alignItems: "center", gap: 12 },
  retry: { alignSelf: "stretch" },
  empty: { alignItems: "center", gap: 8, paddingVertical: 40 },
});
