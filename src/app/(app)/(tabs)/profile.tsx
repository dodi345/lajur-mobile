import { router } from "expo-router";
import type { ReactNode } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { Icon, type BoxIconName } from "@/components/icon";
import { Page } from "@/components/screen";
import { AppText, Button, IconChip, InsetCard } from "@/components/ui";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { shortDate } from "@/lib/date";
import { useHome, useProfile } from "@/lib/queries";
import { RADIUS, TOUCH, usePreferences, useTheme, type ThemeChoice } from "@/lib/theme";

// Akun = app/(app)/profile/page.tsx web. Tema dan "Kurangi efek kaca" disimpan di HP (sama dengan web,
// per perangkat). Mengubah nama/email/zona waktu/warna avatar, keamanan, dan data lain belum ada di
// API app (tahap 2): barisnya membuka halaman yang sama di web Lajur.

const AVATAR_COLORS = [
  { id: "indigo", background: "#4f46e5", text: "#ffffff" },
  { id: "violet", background: "#8b5cf6", text: "#ffffff" },
  { id: "pink", background: "#ec4899", text: "#ffffff" },
  { id: "orange", background: "#f97316", text: "#0f172a" },
  { id: "amber", background: "#f59e0b", text: "#0f172a" },
  { id: "teal", background: "#14b8a6", text: "#0f172a" },
  { id: "sky", background: "#0ea5e9", text: "#0f172a" },
] as const;

const TIMEZONES: Record<string, string> = {
  "Asia/Jakarta": "WIB · Jakarta (UTC+7)",
  "Asia/Makassar": "WITA · Makassar (UTC+8)",
  "Asia/Jayapura": "WIT · Jayapura (UTC+9)",
};

const THEMES: { value: ThemeChoice; label: string; icon: BoxIconName }[] = [
  { value: "light", label: "Terang", icon: "Sun" },
  { value: "dark", label: "Gelap", icon: "Moon" },
  { value: "system", label: "Ikuti sistem", icon: "Desktop" },
];

const openWeb = (path: string) => void Linking.openURL(`${API_URL}${path}`);

/** Inisial dari dua kata pertama, huruf besar (sama dengan web). */
function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, signOut, signOutEverywhere } = useAuth();
  const profile = useProfile();
  const home = useHome();
  const { themeChoice, setThemeChoice, glassOff, setGlassOff } = usePreferences();
  const data = profile.data;
  const name = data?.name ?? user?.name ?? "";
  const email = data?.email ?? user?.email ?? "";
  const verified = data?.emailVerified ?? user?.emailVerified ?? false;
  const color = AVATAR_COLORS.find((option) => option.id === data?.avatarColor) ?? AVATAR_COLORS[0];

  return (
    <Page title="Akun" tab refreshing={profile.isRefetching} onRefresh={() => void profile.refetch()}>
      <View style={[styles.profileCard, { backgroundColor: theme.muted }]}>
        <View style={[styles.avatar, { backgroundColor: color.background }]}>
          <AppText size={20} weight={700} lineHeight={28} style={{ color: color.text }}>
            {initials(name)}
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText size={18} weight={600} lineHeight={28} numberOfLines={1}>
            {name}
          </AppText>
          <AppText size={13} tone="mutedForeground" numberOfLines={1}>
            {email}
          </AppText>
          {data ? (
            <AppText size={13} tone="mutedForeground">
              Bergabung {shortDate(data.joinedOn)}
            </AppText>
          ) : null}
        </View>
      </View>

      <Group title="Akun">
        <ValueRow label="Nama" value={name} action="Ubah" onPress={() => openWeb("/profile")} />
        <Pressable onPress={() => openWeb("/profile")} style={({ pressed }) => [styles.valueRow, pressed && { backgroundColor: theme.pressedRow }]}>
          <View style={styles.flex}>
            <AppText size={13} tone="mutedForeground">
              Email
            </AppText>
            <AppText weight={500} numberOfLines={1}>
              {email}
            </AppText>
            <AppText size={12} tone={verified ? "income" : "warning"}>
              {verified ? "Terkonfirmasi" : "Belum dikonfirmasi"}
            </AppText>
          </View>
          <Icon name="ChevronRight" size={20} color={theme.mutedForeground} />
        </Pressable>
        <ValueRow
          label="Zona waktu"
          value={TIMEZONES[data?.timezone ?? user?.timezone ?? ""] ?? data?.timezone ?? user?.timezone ?? ""}
          action="Ubah"
          onPress={() => openWeb("/profile")}
        />
      </Group>

      <Group title="Tampilan">
        <View style={styles.block}>
          <AppText size={13} tone="mutedForeground">
            Warna avatar
          </AppText>
          <View style={styles.swatches}>
            {AVATAR_COLORS.map((option) => {
              const selected = option.id === color.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => openWeb("/profile")}
                  style={styles.swatchHit}
                >
                  <View style={[styles.swatchRing, selected && { borderColor: theme.foreground }]}>
                    <View style={[styles.swatch, { backgroundColor: option.background }]} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={[styles.block, styles.themeBlock]}>
          <AppText size={13} tone="mutedForeground">
            Tema
          </AppText>
          <View style={[styles.themeTrack, { backgroundColor: theme.background }]} accessibilityRole="radiogroup">
            {THEMES.map((option) => {
              const selected = option.value === themeChoice;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setThemeChoice(option.value)}
                  style={[styles.themeOption, selected && { backgroundColor: theme.muted, borderColor: theme.border, borderWidth: 1 }]}
                >
                  <Icon name={option.icon} size={20} color={selected ? theme.primary : theme.mutedForeground} />
                  <AppText size={13} weight={selected ? 600 : 400} tone={selected ? "primary" : "mutedForeground"}>
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: glassOff }}
          onPress={() => setGlassOff(!glassOff)}
          style={styles.switchRow}
        >
          <View style={styles.flex}>
            <AppText weight={500}>Kurangi efek kaca</AppText>
            <AppText size={13} tone="mutedForeground">
              Navigasi dan notifikasi memakai latar solid.
            </AppText>
          </View>
          <View style={[styles.track, { backgroundColor: glassOff ? theme.primary : theme.mutedForeground }]}>
            <View style={[styles.thumb, { backgroundColor: theme.background }, glassOff && styles.thumbOn]} />
          </View>
        </Pressable>
      </Group>

      <Group title="Keamanan">
        <MenuLink icon="Lock" label="Ganti password" onPress={() => openWeb("/profile")} />
        <MenuLink icon="Devices" label="Perangkat yang login" onPress={() => openWeb("/profile/sessions")} />
      </Group>

      <Group title="Bot Telegram">
        <MenuLink icon="MessageBubbleDots" label="Hubungkan Telegram" detail="Catat transaksi lewat chat" onPress={() => openWeb("/profile")} />
      </Group>

      <Group title="Data">
        <MenuLink
          icon="Wallet"
          label="Dompet"
          detail={home.data ? `${home.data.walletCount} aktif` : undefined}
          onPress={() => router.push("/wallets")}
        />
        <MenuLink icon="Handshake" label="Utang & Piutang" onPress={() => openWeb("/debts")} />
        <MenuLink icon="Tag" label="Kategori" onPress={() => openWeb("/categories")} />
        <MenuLink icon="Trash" label="Sampah" onPress={() => openWeb("/trash")} />
        <MenuLink icon="ArrowToBottom" label="Ekspor CSV" detail="Semua transaksi, untuk Excel / Google Sheets" onPress={() => openWeb("/profile")} chevron={false} />
      </Group>

      <Group title="Zona bahaya">
        <Pressable onPress={() => openWeb("/profile")} style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: theme.destructiveChip }]}>
          <IconChip name="UserX" color={theme.destructive} background={theme.destructiveChip} />
          <View style={styles.flex}>
            <AppText weight={500} tone="destructive">
              Hapus akun
            </AppText>
            <AppText size={13} tone="mutedForeground">
              Permanen, beserta seluruh data
            </AppText>
          </View>
          <Icon name="ChevronRight" size={20} color={theme.mutedForeground} />
        </Pressable>
      </Group>

      <View style={styles.buttons}>
        <Button label="Keluar" icon="ArrowOutRightSquareHalf" variant="destructive" onPress={() => void signOut()} />
        <Button label="Keluar dari semua perangkat" icon="Devices" variant="destructive" onPress={() => void signOutEverywhere()} />
      </View>
    </Page>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <AppText size={13} weight={500} tone="mutedForeground" style={styles.caption}>
        {title}
      </AppText>
      <InsetCard>{children}</InsetCard>
    </View>
  );
}

function ValueRow({ label, value, action, onPress }: { label: string; value: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.valueRow}>
      <View style={styles.flex}>
        <AppText size={13} tone="mutedForeground">
          {label}
        </AppText>
        <AppText weight={500} numberOfLines={1}>
          {value}
        </AppText>
      </View>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.action} hitSlop={8}>
        <AppText size={14} weight={500} lineHeight={20} tone="primary">
          {action}
        </AppText>
      </Pressable>
    </View>
  );
}

function MenuLink({
  icon,
  label,
  detail,
  onPress,
  chevron = true,
}: {
  icon: BoxIconName;
  label: string;
  detail?: string;
  onPress: () => void;
  chevron?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: theme.pressedRow }]}>
      <IconChip name={icon} background={theme.background} />
      <View style={styles.flex}>
        <AppText weight={500}>{label}</AppText>
        {detail ? (
          <AppText size={13} tone="mutedForeground">
            {detail}
          </AppText>
        ) : null}
      </View>
      {chevron ? <Icon name="ChevronRight" size={20} color={theme.mutedForeground} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 16, borderRadius: RADIUS.xl, padding: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  group: { gap: 8 },
  caption: { paddingHorizontal: 16 },
  valueRow: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  action: { minHeight: TOUCH, justifyContent: "center" },
  block: { paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  themeBlock: { gap: 8 },
  swatches: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: -12 },
  swatchHit: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" },
  swatchRing: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  swatch: { width: 32, height: 32, borderRadius: 16 },
  themeTrack: { flexDirection: "row", gap: 4, padding: 4, borderRadius: RADIUS.xl },
  themeOption: { flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", gap: 4, borderRadius: RADIUS.lg },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 8, minHeight: 56 },
  track: { width: 48, height: 28, borderRadius: 14, paddingHorizontal: 4, justifyContent: "center" },
  thumb: { width: 20, height: 20, borderRadius: 10 },
  thumbOn: { transform: [{ translateX: 20 }] },
  menuRow: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  buttons: { gap: 8 },
});
