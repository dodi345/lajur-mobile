import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { Icon, type BoxIconName } from "@/components/icon";
import { OptionPicker } from "@/components/picker";
import { Page } from "@/components/screen";
import { useToast } from "@/components/toast";
import { AppText, Button, FormField, FormMessage, IconChip, Input, InsetCard } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { shortDate } from "@/lib/date";
import { exportTransactionsCsv } from "@/lib/export";
import { useHome, useProfile, useTelegramLink, useUnlinkTelegram, useUpdateProfile, type ProfileInput } from "@/lib/queries";
import { font, RADIUS, TALL, TOUCH, usePreferences, useTheme, type ThemeChoice } from "@/lib/theme";

// Akun = app/(app)/profile/page.tsx web. Semua aksi lewat API v1 (logika sama dengan form web).
// Tema dan "Kurangi efek kaca" disimpan di HP (web: per perangkat juga).
// Utang & Piutang, Kategori, dan Sampah menyusul di tahap C (sementara membuka web).

export const AVATAR_COLORS = [
  { id: "indigo", label: "Indigo", background: "#4f46e5", text: "#ffffff" },
  { id: "violet", label: "Ungu", background: "#8b5cf6", text: "#ffffff" },
  { id: "pink", label: "Merah muda", background: "#ec4899", text: "#ffffff" },
  { id: "orange", label: "Oranye", background: "#f97316", text: "#0f172a" },
  { id: "amber", label: "Kuning", background: "#f59e0b", text: "#0f172a" },
  { id: "teal", label: "Toska", background: "#14b8a6", text: "#0f172a" },
  { id: "sky", label: "Biru langit", background: "#0ea5e9", text: "#0f172a" },
] as const;

const TIMEZONES = [
  { value: "Asia/Jakarta", label: "WIB · Jakarta (UTC+7)" },
  { value: "Asia/Makassar", label: "WITA · Makassar (UTC+8)" },
  { value: "Asia/Jayapura", label: "WIT · Jayapura (UTC+9)" },
];

const THEMES: { value: ThemeChoice; label: string; icon: BoxIconName }[] = [
  { value: "light", label: "Terang", icon: "Sun" },
  { value: "dark", label: "Gelap", icon: "Moon" },
  { value: "system", label: "Ikuti sistem", icon: "Desktop" },
];


/** Inisial dari dua kata pertama, huruf besar (sama dengan web). */
function initials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => [...word][0] ?? "");
  return letters.join("").toUpperCase() || "?";
}

export default function ProfileScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { signOut, signOutEverywhere } = useAuth();
  const query = useProfile();
  const home = useHome();
  const [exporting, setExporting] = useState(false);
  const [leaving, setLeaving] = useState<"one" | "all" | null>(null);
  const data = query.data;
  const profile = data?.profile;
  const demo = data?.demo ?? false;
  const color = AVATAR_COLORS.find((option) => option.id === profile?.avatarColor) ?? AVATAR_COLORS[0];

  const exportCsv = async () => {
    setExporting(true);
    try {
      await exportTransactionsCsv(home.data?.today);
    } catch {
      toast({ message: "Ekspor gagal. Coba lagi sebentar lagi.", type: "error" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Page title="Akun" tab refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {profile ? (
        <>
          <View style={[styles.profileCard, { backgroundColor: theme.muted }]}>
            <View style={[styles.avatar, { backgroundColor: color.background }]}>
              <AppText size={20} weight={700} lineHeight={28} style={{ color: color.text }}>
                {initials(profile.name)}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText size={18} weight={600} lineHeight={28} numberOfLines={1}>
                {profile.name}
              </AppText>
              <AppText size={13} tone="mutedForeground" numberOfLines={1}>
                {profile.email}
              </AppText>
              <AppText size={13} tone="mutedForeground">
                Bergabung {shortDate(profile.joinedOn)}
              </AppText>
            </View>
          </View>

          <Group title="Akun">
            <InlineEditRow label="Nama" value={profile.name} field="name" initial={profile.name} />
            {demo ? (
              // Akun demo: email tidak bisa diubah, baris tidak bisa diketuk (sama dengan web).
              <View style={styles.valueRow}>
                <View style={styles.flex}>
                  <AppText size={13} tone="mutedForeground">
                    Email
                  </AppText>
                  <AppText weight={500} numberOfLines={1}>
                    {profile.email}
                  </AppText>
                  <AppText size={12} tone="mutedForeground">
                    Tidak bisa diubah di akun demo
                  </AppText>
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/profile/email")}
                style={({ pressed }) => [styles.valueRow, pressed && { backgroundColor: theme.pressedRow }]}
              >
                <View style={styles.flex}>
                  <AppText size={13} tone="mutedForeground">
                    Email
                  </AppText>
                  <AppText weight={500} numberOfLines={1}>
                    {profile.email}
                  </AppText>
                  <AppText size={12} tone={profile.emailVerified ? "income" : "warning"}>
                    {profile.emailVerified ? "Terkonfirmasi" : "Belum dikonfirmasi"}
                  </AppText>
                </View>
                <Icon name="ChevronRight" size={20} color={theme.mutedForeground} />
              </Pressable>
            )}
            <InlineEditRow
              label="Zona waktu"
              value={TIMEZONES.find((zone) => zone.value === profile.timezone)?.label ?? profile.timezone}
              field="timezone"
              initial={profile.timezone}
              hint="Mengatur “hari ini” dan batas bulan. Tanggal transaksi yang sudah tercatat tidak berubah."
            />
          </Group>

          <Group title="Tampilan">
            <AvatarColorRow selected={color.id} />
            <ThemeRow />
            <GlassRow />
          </Group>

          <Group title="Keamanan">
            {demo ? (
              <DisabledRow icon="Lock" label="Ganti password" />
            ) : (
              <MenuLink icon="Lock" label="Ganti password" onPress={() => router.push("/profile/password")} />
            )}
            <MenuLink icon="Devices" label="Perangkat yang login" detail={`${data.counts.sessions} perangkat`} onPress={() => router.push("/sessions")} />
          </Group>

          {data.telegram.ready ? (
            <Group title="Bot Telegram">
              <TelegramRow demo={demo} linkedOn={data.telegram.linkedOn} active={data.telegram.active} />
            </Group>
          ) : null}

          <Group title="Data">
            <MenuLink icon="Wallet" label="Dompet" detail={`${data.counts.wallets} aktif`} onPress={() => router.push("/wallets")} />
            <MenuLink
              icon="Handshake"
              label="Utang & Piutang"
              detail={data.counts.openDebts > 0 ? `${data.counts.openDebts} belum lunas` : undefined}
              onPress={() => router.push("/debts")}
            />
            <MenuLink icon="Tag" label="Kategori" onPress={() => router.push("/categories")} />
            <MenuLink icon="Trash" label="Sampah" detail={data.counts.trash > 0 ? String(data.counts.trash) : undefined} onPress={() => router.push("/trash")} />
            <MenuLink
              icon="ArrowToBottom"
              label={exporting ? "Menyiapkan file…" : "Ekspor CSV"}
              detail="Semua transaksi, untuk Excel / Google Sheets"
              onPress={() => void exportCsv()}
              chevron={false}
            />
          </Group>

          <Group title="Zona bahaya">
            {demo ? (
              <DisabledRow icon="UserX" label="Hapus akun" danger />
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/profile/delete")}
                style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: theme.destructiveChip }]}
              >
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
            )}
          </Group>
        </>
      ) : query.isError ? (
        <FormMessage message={query.error.message} />
      ) : null}

      <View style={styles.buttons}>
        <Button
          label={leaving === "one" ? "Keluar…" : "Keluar"}
          icon="ArrowOutRightSquareHalf"
          variant="destructive"
          disabled={leaving !== null}
          onPress={() => {
            setLeaving("one");
            void signOut();
          }}
        />
        <Button
          label={leaving === "all" ? "Keluar…" : "Keluar dari semua perangkat"}
          icon="Devices"
          variant="destructive"
          disabled={leaving !== null}
          onPress={() => {
            setLeaving("all");
            void signOutEverywhere();
          }}
        />
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

/** Baris yang diubah di tempat (web: ketuk "Ubah" → form kecil → Simpan/Batal, lalu toast). */
function InlineEditRow({
  label,
  value,
  field,
  initial,
  hint,
}: {
  label: string;
  value: string;
  field: "name" | "timezone";
  initial: string;
  hint?: string;
}) {
  const theme = useTheme();
  const toast = useToast();
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [picking, setPicking] = useState(false);
  const error = update.error instanceof ApiError ? update.error : null;

  if (!editing) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ubah ${label.toLowerCase()}: ${value}`}
        onPress={() => {
          setDraft(initial);
          update.reset();
          setEditing(true);
        }}
        style={({ pressed }) => [styles.valueRow, pressed && { backgroundColor: theme.pressedRow }]}
      >
        <View style={styles.flex}>
          <AppText size={13} tone="mutedForeground">
            {label}
          </AppText>
          <AppText weight={500} numberOfLines={1}>
            {value}
          </AppText>
        </View>
        <AppText size={14} weight={500} lineHeight={20} tone="primary">
          Ubah
        </AppText>
      </Pressable>
    );
  }

  const save = () =>
    update.mutate({ [field]: draft } as ProfileInput, {
      onSuccess: (result) => {
        setEditing(false);
        toast({ message: result.message, type: "success" });
      },
    });

  return (
    <View style={styles.editForm}>
      {update.error && !error?.fieldErrors?.[field] ? <FormMessage message={update.error.message} /> : null}
      <FormField label={label} hint={hint} error={error?.fieldErrors?.[field]}>
        {field === "name" ? (
          <Input value={draft} onChangeText={setDraft} autoFocus maxLength={100} autoComplete="name" onBackground accessibilityLabel={label} />
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={() => setPicking(true)}
              style={[styles.select, { backgroundColor: theme.background, borderColor: theme.border }]}
            >
              <AppText style={[font(16, 400, 22), styles.flex]} numberOfLines={1}>
                {TIMEZONES.find((zone) => zone.value === draft)?.label ?? draft}
              </AppText>
              <Icon name="ChevronDown" size={20} color={theme.mutedForeground} />
            </Pressable>
            <OptionPicker visible={picking} title={label} options={TIMEZONES} value={draft} onSelect={setDraft} onClose={() => setPicking(false)} />
          </>
        )}
      </FormField>
      <View style={styles.editButtons}>
        <Button label="Batal" variant="outline" onPress={() => setEditing(false)} style={styles.flex} />
        <Button label={update.isPending ? "Menyimpan…" : "Simpan"} onPress={save} disabled={update.isPending} style={styles.flex} />
      </View>
    </View>
  );
}

/** Warna avatar: satu ketukan langsung tersimpan; tampil seketika dan kembali kalau server menolak. */
function AvatarColorRow({ selected }: { selected: string }) {
  const theme = useTheme();
  const toast = useToast();
  const update = useUpdateProfile();
  const [optimistic, setOptimistic] = useState<string | null>(null);
  const current = optimistic ?? selected;
  return (
    <View style={styles.block}>
      <AppText size={13} tone="mutedForeground">
        Warna avatar
      </AppText>
      <View style={styles.swatches} accessibilityRole="radiogroup">
        {AVATAR_COLORS.map((option) => {
          const checked = option.id === current;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: checked }}
              accessibilityLabel={option.label}
              disabled={update.isPending}
              onPress={() => {
                setOptimistic(option.id);
                update.mutate(
                  { avatarColor: option.id },
                  {
                    onSuccess: (result) => toast({ message: result.message, type: "success" }),
                    onError: (error) => toast({ message: error.message || "Warna gagal disimpan.", type: "error" }),
                    onSettled: () => setOptimistic(null),
                  },
                );
              }}
              style={styles.swatchHit}
            >
              <View style={[styles.swatchRing, checked && { borderColor: theme.foreground }]}>
                <View style={[styles.swatch, { backgroundColor: option.background }]} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ThemeRow() {
  const theme = useTheme();
  const { themeChoice, setThemeChoice } = usePreferences();
  return (
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
  );
}

function GlassRow() {
  const theme = useTheme();
  const { glassOff, setGlassOff } = usePreferences();
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: glassOff }} onPress={() => setGlassOff(!glassOff)} style={styles.switchRow}>
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
  );
}

/** PRD Bot Telegram F1: hubungkan (membuka aplikasi Telegram lewat tautan t.me) / putuskan. */
function TelegramRow({ demo, linkedOn, active }: { demo: boolean; linkedOn: string | null; active: boolean }) {
  const theme = useTheme();
  const toast = useToast();
  const link = useTelegramLink();
  const unlink = useUnlinkTelegram();
  if (demo) return <DisabledRow icon="MessageBubbleDots" label="Hubungkan Telegram" />;
  if (linkedOn) {
    return (
      <View style={styles.menuRow}>
        <IconChip name="MessageBubbleDots" background={theme.background} />
        <View style={styles.flex}>
          <AppText weight={500}>Telegram</AppText>
          <AppText size={13} tone={active ? "mutedForeground" : "warning"}>
            {active ? `Terhubung sejak ${shortDate(linkedOn)}` : "Bot diblokir di Telegram. Putuskan, lalu hubungkan lagi."}
          </AppText>
        </View>
        <Button label={unlink.isPending ? "Memutus…" : "Putuskan"} variant="ghost" onPress={() => unlink.mutate()} disabled={unlink.isPending} />
      </View>
    );
  }
  return (
    <MenuLink
      icon="MessageBubbleDots"
      label={link.isPending ? "Membuka Telegram…" : "Hubungkan Telegram"}
      detail="Catat transaksi lewat chat"
      onPress={() =>
        link.mutate(undefined, {
          // Kode berlaku 10 menit; tautan t.me membuka aplikasi Telegram langsung.
          onSuccess: (result) => void Linking.openURL(result.url),
          onError: (error) => toast({ message: error.message, type: "error" }),
        })
      }
    />
  );
}

/** Menu yang tidak tersedia di akun demo: redup, tanpa aksi (sama dengan web). */
function DisabledRow({ icon, label, danger }: { icon: BoxIconName; label: string; danger?: boolean }) {
  const theme = useTheme();
  return (
    <View accessibilityState={{ disabled: true }} style={[styles.menuRow, styles.disabled]}>
      <IconChip
        name={icon}
        color={danger ? theme.destructive : undefined}
        background={danger ? theme.destructiveChip : theme.background}
      />
      <View style={styles.flex}>
        <AppText weight={500}>{label}</AppText>
        <AppText size={13} tone="mutedForeground">
          Tidak tersedia di akun demo
        </AppText>
      </View>
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
  editForm: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  editButtons: { flexDirection: "row", gap: 8 },
  select: { height: TALL, borderWidth: 1, borderRadius: RADIUS.xl, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
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
  disabled: { opacity: 0.6 },
  buttons: { gap: 8 },
});
