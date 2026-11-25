import type { ReactNode } from "react";
import { Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { AppText } from "@/components/ui";
import { APP_LOGO } from "@/components/wallet-logo";
import { TOUCH, useTheme } from "@/lib/theme";

// Halaman masuk/daftar = components/auth/auth-shell.tsx web: px-6 pt-16 pb-8 gap-7, logo 52px,
// label "Lajur - Catat Uangmu", judul 28 bold + subjudul 15, footer di bagian bawah.

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 32 }]}
      >
        <View style={styles.header}>
          <Image source={APP_LOGO} style={styles.logo} accessibilityIgnoresInvertColors accessibilityLabel="Lajur" />
          <AppText size={13} weight={600} tone="mutedForeground" style={styles.eyebrow}>
            Lajur - Catat Uangmu
          </AppText>
          <View style={styles.titles}>
            <AppText size={28} weight={700} lineHeight={35} accessibilityRole="header">
              {title}
            </AppText>
            <AppText size={15} tone="mutedForeground" lineHeight={22.5}>
              {subtitle}
            </AppText>
          </View>
        </View>
        {children}
        <View style={styles.footer}>{footer}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Checkbox bawaan browser (accent-primary, 20px). */
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.checkRow}
    >
      <View
        style={[
          styles.box,
          checked ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.mutedForeground },
        ]}
      >
        {checked ? (
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill={theme.primaryForeground} />
          </Svg>
        ) : null}
      </View>
      <AppText size={14} weight={500} lineHeight={20}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, gap: 28 },
  header: { gap: 16 },
  logo: { width: 52, height: 52 },
  eyebrow: { letterSpacing: 0.325 },
  titles: { gap: 6 },
  footer: { marginTop: "auto", alignItems: "center" },
  checkRow: { minHeight: TOUCH, flexDirection: "row", alignItems: "center", gap: 8 },
  box: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, alignItems: "center", justifyContent: "center" },
});
