import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { WALLET_TYPE_LABELS, WalletRow } from "@/components/finance";
import { Icon } from "@/components/icon";
import { Page } from "@/components/screen";
import { AppText, Button, ErrorState, Loading } from "@/components/ui";
import { findBrand } from "@/components/wallet-logo";
import type { Wallet } from "@/lib/api";
import { formatRupiah } from "@/lib/money";
import { useHome, useWallets } from "@/lib/queries";
import { font, RADIUS, TOUCH, useTheme } from "@/lib/theme";

// Dompet = app/(app)/wallets/page.tsx web: kekayaan bersih, cari (kalau > 5 dompet), daftar 5 per tampilan,
// dompet diarsipkan (dilipat), catatan kaki.

const PAGE_SIZE = 5;

function matches(wallet: Wallet, query: string) {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  return [wallet.name, WALLET_TYPE_LABELS[wallet.type], findBrand(wallet.brand)?.label ?? ""].some((value) =>
    value.toLowerCase().includes(text),
  );
}

export default function WalletsScreen() {
  const theme = useTheme();
  const wallets = useWallets();
  const archived = useWallets(true);
  const home = useHome();
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const active = wallets.data ?? [];
  const archivedList = archived.data ?? [];
  const filtered = active.filter((wallet) => matches(wallet, query));

  return (
    <Page
      title="Dompet"
      back={() => router.back()}
      gap={20}
      action={<Button label="Tambah" icon="Plus" variant="outline" onPress={() => router.push("/wallet/new")} />}
      refreshing={wallets.isRefetching}
      onRefresh={() => void wallets.refetch()}
    >
      {home.data ? (
        <View style={[styles.netWorth, { backgroundColor: theme.muted }]}>
          <AppText size={13} tone="mutedForeground">
            Kekayaan bersih
          </AppText>
          <AppText size={32} weight={700} lineHeight={40} numeric>
            {formatRupiah(home.data.netWorth.total)}
          </AppText>
          <AppText size={13} tone="mutedForeground">
            {home.data.netWorth.note}
          </AppText>
        </View>
      ) : null}

      {wallets.isPending ? (
        <Loading label="Memuat dompet…" />
      ) : wallets.isError ? (
        <ErrorState message={wallets.error.message} onRetry={() => void wallets.refetch()} />
      ) : (
        <>
          {active.length + archivedList.length > PAGE_SIZE ? (
            <View style={styles.search}>
              <View style={styles.searchIcon} pointerEvents="none">
                <Icon name="Search" size={20} color={theme.mutedForeground} />
              </View>
              <TextInput
                value={query}
                onChangeText={(text) => {
                  setQuery(text);
                  setLimit(PAGE_SIZE);
                }}
                placeholder="Cari nama, bank, atau jenis dompet"
                placeholderTextColor={theme.mutedForeground}
                selectionColor={theme.primary}
                accessibilityLabel="Cari dompet"
                style={[styles.searchInput, font(16, 400, 22), { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.foreground }]}
              />
              {query ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Hapus pencarian" onPress={() => setQuery("")} style={styles.clear}>
                  <Icon name="X" size={20} color={theme.mutedForeground} />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View>
            {filtered.slice(0, limit).map((wallet) => (
              <WalletRow key={wallet.id} wallet={wallet} />
            ))}
            {filtered.length === 0 && query ? (
              <AppText size={14} lineHeight={20} tone="mutedForeground" style={styles.noResult}>
                Tidak ada dompet yang cocok.
              </AppText>
            ) : null}
          </View>
          {filtered.length > limit ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setLimit((value) => value + PAGE_SIZE)}
              style={[styles.more, { borderColor: theme.border }]}
            >
              <AppText size={14} weight={500} lineHeight={20}>
                Lihat lainnya
              </AppText>
              <Icon name="ChevronDown" size={20} color={theme.foreground} />
            </Pressable>
          ) : null}

          {archivedList.length > 0 ? (
            <View style={[styles.archived, { borderColor: theme.border }]}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: archivedOpen }} onPress={() => setArchivedOpen((open) => !open)} style={styles.archivedHead}>
                <AppText size={14} weight={500} lineHeight={20}>
                  Diarsipkan ({archivedList.length})
                </AppText>
                <View style={archivedOpen && styles.rotated}>
                  <Icon name="ChevronRight" size={20} color={theme.foreground} />
                </View>
              </Pressable>
              {archivedOpen ? (
                <View style={[styles.archivedBody, { borderTopColor: theme.border }]}>
                  {archivedList.map((wallet) => (
                    <View key={wallet.id} style={styles.dimmed}>
                      <WalletRow wallet={wallet} />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          <AppText size={13} tone="mutedForeground">
            Ketuk dompet untuk koreksi saldo, ubah nama, atau arsipkan. Dompet tidak bisa dihapus agar riwayat transaksi dan
            ringkasan bulan lalu tetap benar.
          </AppText>
        </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  netWorth: { borderRadius: RADIUS.xl, padding: 16, gap: 4 },
  search: { justifyContent: "center" },
  searchIcon: { position: "absolute", left: 12, zIndex: 1 },
  searchInput: { height: TOUCH, borderWidth: 1, borderRadius: RADIUS.xl, paddingLeft: 40, paddingRight: 44 },
  clear: { position: "absolute", right: 0, width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" },
  noResult: { paddingHorizontal: 8, paddingVertical: 8 },
  more: { minHeight: TOUCH, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderWidth: 1, borderRadius: RADIUS.xl },
  archived: { borderWidth: 1, borderRadius: RADIUS.xl },
  archivedHead: { minHeight: TOUCH, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  rotated: { transform: [{ rotate: "90deg" }] },
  archivedBody: { borderTopWidth: 1, padding: 8 },
  dimmed: { opacity: 0.7 },
});
