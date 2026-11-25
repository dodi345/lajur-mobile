import type { BottomTabBarProps } from "expo-router/js-tabs";
import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import {
  Animated,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Glass } from "@/components/glass";
import { Icon, type BoxIconName } from "@/components/icon";
import { AppText } from "@/components/ui";
import { RADIUS, TOUCH, useTheme } from "@/lib/theme";

// Kerangka halaman web Lajur: <main px-4 py-6 gap-6>, PageHeader (judul 28 bold + baris kembali),
// header ringkas berefek kaca saat judul tergulir keluar, dan nav bawah kapsul melayang.

/** Ruang kosong di bawah halaman bertab supaya isi terakhir tidak tertutup nav (6.75rem + inset). */
export const NAV_SPACE = 108;

export function PageHeader({ title, back, action }: { title: string; back?: () => void; action?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Kembali" onPress={back} style={styles.back}>
          <Icon name="ChevronLeft" size={24} color={theme.foreground} />
        </Pressable>
      ) : null}
      <View style={styles.titleRow}>
        <AppText size={28} weight={700} lineHeight={35} style={styles.flex} accessibilityRole="header">
          {title}
        </AppText>
        {action}
      </View>
    </View>
  );
}

/**
 * Halaman biasa: gulir, padding 16/24, jarak antar blok `gap` (web: 24; Ringkasan 16; Dompet/Target 20).
 * Header ringkas (kaca, 48px) muncul saat judul besar tergulir keluar layar, sama dengan web.
 */
export function Page({
  title,
  back,
  action,
  gap = 24,
  tab,
  refreshing = false,
  onRefresh,
  children,
}: {
  title: string;
  back?: () => void;
  action?: ReactNode;
  gap?: number;
  /** Halaman bertab: beri ruang untuk nav bawah. */
  tab?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [titleBottom, setTitleBottom] = useState(0);
  const [condensed] = useState(() => new Animated.Value(0));
  const [shown, setShown] = useState(false);

  const onLayoutHeader = (event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setTitleBottom(y + height);
  };
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const show = titleBottom > 0 && event.nativeEvent.contentOffset.y > titleBottom - insets.top - 48;
    if (show !== shown) {
      setShown(show);
      Animated.timing(condensed, { toValue: show ? 1 : 0, duration: 200, useNativeDriver: true }).start();
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          { gap, paddingTop: insets.top + 24, paddingBottom: 24 + (tab ? NAV_SPACE + insets.bottom : insets.bottom) },
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
              progressBackgroundColor={theme.muted}
              progressViewOffset={insets.top}
            />
          ) : undefined
        }
      >
        <View onLayout={onLayoutHeader}>
          <PageHeader title={title} back={back} action={action} />
        </View>
        {children}
      </Animated.ScrollView>
      <Animated.View
        pointerEvents={shown ? "auto" : "none"}
        style={[styles.condensed, { opacity: condensed }]}
      >
        <Glass borderless={["top", "left", "right"]} style={{ paddingTop: insets.top }}>
          <View style={styles.condensedRow}>
            {back ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Kembali" onPress={back} style={styles.back}>
                <Icon name="ChevronLeft" size={24} color={theme.foreground} />
              </Pressable>
            ) : null}
            <AppText size={15} weight={600} numberOfLines={1} style={styles.flex}>
              {title}
            </AppText>
          </View>
        </Glass>
      </Animated.View>
    </View>
  );
}

const TABS: Record<string, { label: string; icon: BoxIconName }> = {
  index: { label: "Beranda", icon: "Home" },
  transactions: { label: "Transaksi", icon: "Receipt" },
  goals: { label: "Target", icon: "Target" },
  profile: { label: "Akun", icon: "User" },
};

/** Nav bawah web: kapsul kaca 64px, 12px dari tepi; Beranda · Transaksi · [+] · Target · Akun. */
export function BottomNav({ state, navigateToTab }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const items = state.routes.map((route, index) => {
    const tab = TABS[route.name];
    if (!tab) return null;
    const active = state.index === index;
    const color = active ? theme.primary : theme.mutedForeground;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={tab.label}
        onPress={() => {
          if (!active) navigateToTab(route.key);
        }}
        style={styles.tab}
      >
        <Icon name={tab.icon} size={24} filled={active} color={color} />
        <AppText size={11} lineHeight={11} weight={active ? 600 : 400} style={{ color }}>
          {tab.label}
        </AppText>
      </Pressable>
    );
  });
  // Tombol "+" (Catat transaksi) di tengah, menonjol 16px di atas kapsul.
  items.splice(
    2,
    0,
    <Pressable
      key="catat"
      accessibilityRole="button"
      accessibilityLabel="Catat transaksi"
      onPress={() => router.push("/transaction/new")}
      style={({ pressed }) => [styles.plus, { backgroundColor: theme.primary }, pressed && styles.plusPressed]}
    >
      <Icon name="Plus" size={30} color={theme.primaryForeground} />
    </Pressable>,
  );
  return (
    <View pointerEvents="box-none" style={[styles.nav, { paddingBottom: 12 + insets.bottom }]}>
      <View style={styles.capsule}>
        {/* Latar kaca dipotong bulat; tombol "+" di atasnya tidak ikut terpotong. */}
        <Glass style={[StyleSheet.absoluteFill, styles.capsuleGlass]} />
        <View style={styles.capsuleRow}>{items}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: 16 },
  header: { gap: 4 },
  back: { width: TOUCH, height: TOUCH, marginLeft: -8, borderRadius: RADIUS.lg, alignItems: "center", justifyContent: "center" },
  titleRow: { minHeight: TOUCH, flexDirection: "row", alignItems: "center", gap: 8 },
  condensed: { position: "absolute", top: 0, left: 0, right: 0 },
  condensedRow: { height: 48, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 16 },
  nav: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 12 },
  // Kapsul tidak memotong tombol "+" yang menonjol: kliping hanya di latar kaca.
  capsule: { height: 64 },
  capsuleGlass: { borderRadius: RADIUS.full },
  capsuleRow: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 8 },
  tab: { minWidth: 56, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 4, borderRadius: RADIUS.xl },
  plus: { width: 60, height: 60, marginTop: -36, borderRadius: RADIUS.xl2, alignItems: "center", justifyContent: "center" },
  plusPressed: { transform: [{ scale: 0.95 }] },
});

