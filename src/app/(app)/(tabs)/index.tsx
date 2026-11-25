import { router, useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { Animated, Easing, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryBreakdown, GoalCard, SummaryStats, TransactionRow, WalletCard } from "@/components/finance";
import { Icon } from "@/components/icon";
import { NAV_SPACE } from "@/components/screen";
import { useToast } from "@/components/toast";
import { AppText, Button, ErrorState, InsetCard, Loading, SectionHeader } from "@/components/ui";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { monthLabel } from "@/lib/date";
import { formatRupiah } from "@/lib/money";
import { useHome, useProfile, useResendVerification } from "@/lib/queries";
import { RADIUS, TOUCH, useTheme } from "@/lib/theme";

// Beranda = app/(app)/page.tsx web: blok hero ungu tetap di atas (sapaan, kekayaan bersih, pinjaman)
// dan lembar konten bersudut 26,4px yang mulai 24px di atas hero lalu menutupinya saat digulir.

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const home = useHome();
  const profile = useProfile();
  const { user } = useAuth();
  // Hero "sticky": ikut di dalam area gulir tapi digeser balik sejauh guliran, lembar konten menutupinya.
  const [scrollY] = useState(() => new Animated.Value(0));
  const heroShift = scrollY.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolateLeft: "clamp" });

  // Status bar di atas hero berwarna terang (web: theme-color = warna hero di halaman /).
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle(theme.dark ? "light" : "dark");
    }, [theme.dark]),
  );

  const data = home.data;
  const hasDebts = data ? data.debts.receivable > 0 || data.debts.payable > 0 : false;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        style={{ backgroundColor: theme.hero }}
        contentContainerStyle={{ backgroundColor: theme.background }}
        refreshControl={
          <RefreshControl
            refreshing={home.isRefetching}
            onRefresh={() => void home.refetch()}
            colors={[theme.primary]}
            progressBackgroundColor={theme.muted}
            progressViewOffset={insets.top}
          />
        }
      >
      <Animated.View
        style={[styles.hero, { backgroundColor: theme.hero, paddingTop: insets.top + 24, transform: [{ translateY: heroShift }] }]}
      >
        <View style={[styles.circleA, { top: -70 }]} />
        <View style={[styles.circleB, { top: 60 }]} />
        <Greeting name={user?.name ?? ""} />
        {data && data.walletCount > 0 ? (
          <View style={styles.netWorth}>
            <AppText size={13} tone="heroMuted">
              Kekayaan bersih
            </AppText>
            <AppText size={34} weight={700} lineHeight={42.5} tone="heroForeground" numeric>
              {formatRupiah(data.netWorth.total)}
            </AppText>
            <AppText size={13} tone="heroMuted">
              {data.netWorth.note}
            </AppText>
          </View>
        ) : null}
        {data && hasDebts ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(`${API_URL}/debts`)}
            style={[styles.debtPill, { borderColor: theme.heroMuted40 }]}
          >
            <View style={styles.debtText}>
              <AppText size={14} lineHeight={20} tone="heroMuted">
                Piutang{" "}
                <AppText size={14} lineHeight={20} tone="heroForeground" numeric>
                  {formatRupiah(data.debts.receivable)}
                </AppText>
              </AppText>
              <AppText size={14} lineHeight={20} tone="heroMuted">
                Utang{" "}
                <AppText size={14} lineHeight={20} tone="heroForeground" numeric>
                  {formatRupiah(data.debts.payable)}
                </AppText>
              </AppText>
            </View>
            <Icon name="ChevronRight" size={20} color={theme.heroMuted} />
          </Pressable>
        ) : null}
      </Animated.View>

        <View style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: 24 + NAV_SPACE + insets.bottom }]}>
          {home.isPending ? (
            <Loading />
          ) : home.isError ? (
            <ErrorState message={home.error.message} onRetry={() => void home.refetch()} />
          ) : (
            <>
              {/* Banner konfirmasi email: bukan untuk akun demo (BR-33), sama dengan web. */}
              {user && !user.emailVerified && profile.data && !profile.data.demo ? <EmailBanner email={user.email} /> : null}

              {data!.walletCount === 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/wallet/new")}
                  style={[styles.ctaCard, { borderColor: theme.primary30, backgroundColor: theme.primary5 }]}
                >
                  <View style={styles.flex}>
                    <AppText weight={600}>Siapkan dompet pertama</AppText>
                    <AppText size={13} tone="mutedForeground">
                      Isi saldo yang ada sekarang untuk mulai mencatat.
                    </AppText>
                  </View>
                  <Icon name="ChevronRight" size={20} color={theme.primary} />
                </Pressable>
              ) : (
                <View style={styles.section}>
                  <SectionHeader title="Dompet" link="Kelola" onLink={() => router.push("/wallets")} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.walletRow}>
                    {data!.wallets.map((wallet) => (
                      <WalletCard key={wallet.id} wallet={wallet} />
                    ))}
                    {data!.walletCount > data!.wallets.length ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push("/wallets")}
                        style={[styles.moreCard, { borderColor: theme.border }]}
                      >
                        <View style={[styles.moreCircle, { backgroundColor: theme.muted }]}>
                          <Icon name="ChevronRight" size={20} color={theme.mutedForeground} />
                        </View>
                        <AppText size={14} weight={500} lineHeight={20}>
                          Lihat semua
                        </AppText>
                        <AppText size={13} tone="mutedForeground">
                          {data!.walletCount} dompet
                        </AppText>
                      </Pressable>
                    ) : null}
                  </ScrollView>
                </View>
              )}

              <View style={styles.monthSection}>
                <SectionHeader
                  title={`Bulan ini · ${monthLabel(data!.month)}`}
                  link="Detail"
                  onLink={() => router.push({ pathname: "/summary", params: { month: data!.month } })}
                />
                <SummaryStats income={data!.summary.income} expense={data!.summary.expense} net={data!.summary.net} />
                {data!.summary.expenseByCategory.length > 0 ? (
                  <View style={styles.topExpenses}>
                    <AppText size={13} weight={500} tone="mutedForeground" style={styles.caption}>
                      Pengeluaran terbesar
                    </AppText>
                    <CategoryBreakdown items={data!.summary.expenseByCategory.slice(0, 3)} month={data!.month} />
                  </View>
                ) : null}
              </View>

              {data!.goals.length > 0 ? (
                <View style={styles.section}>
                  <SectionHeader title="Target" link="Lihat semua" onLink={() => router.navigate("/goals")} />
                  {data!.goals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} onPress={() => void Linking.openURL(`${API_URL}/goals/${goal.id}`)} />
                  ))}
                </View>
              ) : null}

              <View style={styles.section}>
                <SectionHeader title="Transaksi terakhir" link="Lihat semua" onLink={() => router.navigate("/transactions")} />
                {data!.recentTransactions.length > 0 ? (
                  <InsetCard>
                    {data!.recentTransactions.map((transaction) => (
                      <TransactionRow key={transaction.id} transaction={transaction} />
                    ))}
                  </InsetCard>
                ) : (
                  <AppText size={14} lineHeight={20} tone="mutedForeground" style={styles.emptyRecent}>
                    Belum ada transaksi. Tekan tombol{" "}
                    <AppText size={14} lineHeight={20} weight={600} tone="primary">
                      +
                    </AppText>{" "}
                    untuk mencatat.
                  </AppText>
                )}
              </View>
            </>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

/** "Halo, Budi 👋" dengan lambaian tangan (rotasi 0→14→−8→14→−4→10→0°, 1,8 detik, 2 kali) seperti web. */
function Greeting({ name }: { name: string }) {
  const [wave] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const steps = [14, -8, 14, -4, 10, 0];
    const animation = Animated.sequence(
      steps.map((toValue) => Animated.timing(wave, { toValue, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true })),
    );
    Animated.loop(animation, { iterations: 2 }).start();
  }, [wave]);
  const rotate = wave.interpolate({ inputRange: [-90, 90], outputRange: ["-90deg", "90deg"] });
  return (
    <View style={styles.greeting}>
      <AppText size={14} lineHeight={20} tone="heroMuted">
        Halo, {name}{" "}
      </AppText>
      <Animated.Text style={[styles.wave, { transform: [{ rotate }] }]}>👋</Animated.Text>
    </View>
  );
}

function EmailBanner({ email }: { email: string }) {
  const theme = useTheme();
  const toast = useToast();
  const resend = useResendVerification();
  return (
    <View style={[styles.banner, { borderColor: theme.primary30, backgroundColor: theme.primary5 }]}>
      <View style={styles.bannerRow}>
        <View style={styles.bannerIcon}>
          <Icon name="Envelope" size={20} color={theme.primary} />
        </View>
        <View style={styles.flex}>
          <AppText weight={600}>Konfirmasi email kamu</AppText>
          <AppText size={13} tone="mutedForeground">
            Tekan tautan yang kami kirim ke{" "}
            <AppText size={13} weight={500}>
              {email}
            </AppText>
            , supaya akunmu bisa dipulihkan kalau lupa password.
          </AppText>
        </View>
      </View>
      {/* US-33: jeda 60 detik dijaga di server (BR-30). */}
      <Button
        label={resend.isPending ? "Mengirim…" : "Kirim ulang email"}
        variant="outline"
        disabled={resend.isPending}
        onPress={() =>
          resend.mutate(undefined, {
            onSuccess: (result) => toast({ message: result.message, type: "success" }),
            onError: (error) => toast({ message: error.message, type: "error" }),
          })
        }
        style={{ backgroundColor: theme.background }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  hero: { paddingHorizontal: 16, paddingBottom: 48, gap: 16, overflow: "hidden", zIndex: 0 },
  circleA: { position: "absolute", right: -90, width: 230, height: 230, borderRadius: 115, backgroundColor: "rgba(255,255,255,0.06)" },
  circleB: { position: "absolute", right: 10, width: 170, height: 170, borderRadius: 85, backgroundColor: "rgba(255,255,255,0.04)" },
  greeting: { flexDirection: "row", alignItems: "center" },
  wave: { fontSize: 14, lineHeight: 20 },
  netWorth: { gap: 4 },
  debtPill: {
    minHeight: TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  debtText: { flex: 1, flexDirection: "row", flexWrap: "wrap", columnGap: 12 },
  sheet: {
    zIndex: 1,
    marginTop: -24,
    minHeight: 640,
    borderTopLeftRadius: RADIUS.homeSheet,
    borderTopRightRadius: RADIUS.homeSheet,
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 24,
  },
  section: { gap: 8 },
  monthSection: { gap: 12 },
  topExpenses: { gap: 4 },
  caption: { paddingHorizontal: 8 },
  bleed: { marginHorizontal: -16 },
  walletRow: { gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  moreCard: { width: 112, borderWidth: 1, borderRadius: RADIUS.xl, padding: 12, gap: 8, alignItems: "center", justifyContent: "center" },
  moreCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  ctaCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: RADIUS.xl, padding: 16 },
  emptyRecent: { paddingHorizontal: 8, paddingVertical: 16 },
  banner: { borderWidth: 1, borderRadius: RADIUS.xl, padding: 16, gap: 12 },
  bannerRow: { flexDirection: "row", gap: 12 },
  bannerIcon: { marginTop: 2 },
});
