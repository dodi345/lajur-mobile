import { router } from "expo-router";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, Icon } from "@/components/ui";
import { useTheme } from "@/lib/theme";

/** Layar tab: judul, tarik ke bawah untuk memuat ulang, dan tombol "+" untuk mencatat. */
export function TabScreen({
  title,
  children,
  refreshing = false,
  onRefresh,
  top,
}: {
  title?: string;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Isi paling atas tanpa jarak samping (mis. blok hero Beranda). */
  top?: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: top ? 0 : insets.top }]}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
          ) : undefined
        }
      >
        {top}
        <View style={styles.inner}>
          {title && <AppText variant="title">{title}</AppText>}
          {children}
        </View>
      </ScrollView>
      <AddButton />
    </View>
  );
}

/** Tombol besar "+ Catat" (sama dengan web), di atas tab bar. */
function AddButton() {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Catat transaksi"
      onPress={() => router.push("/transaction/new")}
      style={({ pressed }) => [styles.fab, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}
    >
      <Icon name="add" size={28} color={theme.onPrimary} />
    </Pressable>
  );
}

/** Layar form (di bawah header): tidak tertutup keyboard, ketukan ke tombol tetap jalan. */
export function FormScreen({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 24 }]}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 120 },
  inner: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  form: { padding: 16, gap: 18 },
});
