import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { openTransactions, WALLET_TYPE_LABELS } from "@/components/finance";
import { Icon } from "@/components/icon";
import { Page } from "@/components/screen";
import { useToast } from "@/components/toast";
import { AppText, Button, ChoiceChip, ErrorState, FormField, FormMessage, Input, Loading, MoneyInput, Segmented, TextLink } from "@/components/ui";
import { WalletLogo } from "@/components/wallet-logo";
import { ApiError } from "@/lib/api";
import { formatAmountInput, formatRupiah, formatSigned, parseAmountInput } from "@/lib/money";
import { useAdjustWallet, useRenameWallet, useSetWalletArchived, useWallet } from "@/lib/queries";
import { RADIUS, useTheme } from "@/lib/theme";

// Detail dompet = app/(app)/wallets/[id]/page.tsx web: kartu logo + saldo, peringatan saldo minus (BR-07),
// tautan ke transaksinya, koreksi saldo (BR-04, dua cara), ubah nama, arsipkan/pulihkan (US-05, BR-09).

type Adjustment = { direction: "in" | "out"; amount: number };

/** Sama dengan computeAdjustment web (lib/domain/balance.ts): selisih saldo nyata − saldo aplikasi. */
function computeAdjustment(current: number, actual: number): Adjustment | null {
  const difference = actual - current;
  if (difference === 0) return null;
  return { direction: difference > 0 ? "in" : "out", amount: Math.abs(difference) };
}

/** Pesan per field di bawah isiannya; pesan umum (tanpa field) di atas form. */
function errorOf(error: Error | null) {
  const fieldErrors = (error instanceof ApiError ? error.fieldErrors : undefined) ?? {};
  return { fieldErrors, message: error && Object.keys(fieldErrors).length === 0 ? error.message : null };
}

export default function WalletScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const query = useWallet(Number(id));
  const wallet = query.data?.wallet;
  const negative = (wallet?.balance ?? 0) < 0;
  const archived = Boolean(wallet?.archivedAt);
  // Dompet utang/piutang dikelola di halaman pinjaman (sisa pinjaman hanya berubah lewat pinjam/bayar, BR-16).
  const debt = wallet?.type === "receivable" || wallet?.type === "payable";
  // Web: dompet utang/piutang dialihkan ke halaman pinjamannya.
  if (wallet && debt) return <Redirect href={`/debt/${wallet.id}`} />;

  return (
    <Page title={wallet?.name ?? "Dompet"} back={() => router.back()} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? (
        <Loading label="Memuat dompet…" />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: theme.muted }]}>
            <View style={styles.row}>
              <WalletLogo type={wallet!.type} brand={wallet!.brand} />
              <AppText size={14} lineHeight={20} tone="mutedForeground">
                {WALLET_TYPE_LABELS[wallet!.type]}
                {archived ? " · Diarsipkan" : ""}
              </AppText>
            </View>
            <View style={styles.balanceRow}>
              <AppText size={14} lineHeight={20} tone="mutedForeground">
                Saldo di aplikasi ini
              </AppText>
              <AppText size={20} weight={700} lineHeight={28} tone={negative ? "warning" : "foreground"} numeric>
                {formatRupiah(wallet!.balance)}
              </AppText>
            </View>
          </View>

          {negative ? (
            <View style={[styles.warning, { borderColor: theme.warning30 }]}>
              <View style={styles.warningIcon}>
                <Icon name="AlertTriangle" size={20} color={theme.warning} />
              </View>
              <AppText size={14} lineHeight={20} tone="warning" style={styles.flex}>
                Saldo minus biasanya berarti ada transaksi yang lupa dicatat. Cek riwayat dulu sebelum koreksi.
              </AppText>
            </View>
          ) : null}

          <TextLink
            label={`Lihat transaksi ${wallet!.name}`}
            onPress={() => openTransactions({ walletId: wallet!.id })}
            style={styles.selfStart}
          />

          {debt ? null : (
            <>
              {!archived ? (
                <View style={styles.section}>
                  <AppText weight={600} accessibilityRole="header">
                    Koreksi saldo
                  </AppText>
                  <AdjustBalanceForm walletId={wallet!.id} balance={wallet!.balance} />
                </View>
              ) : null}

              <View style={[styles.section, styles.divided, { borderTopColor: theme.border }]}>
                <AppText weight={600} accessibilityRole="header">
                  Ubah nama
                </AppText>
                <RenameWalletForm key={wallet!.name} walletId={wallet!.id} name={wallet!.name} />
              </View>

              <View style={[styles.section, styles.divided, { borderTopColor: theme.border }]}>
                <AppText weight={600} accessibilityRole="header">
                  {archived ? "Pulihkan dompet" : "Arsipkan dompet"}
                </AppText>
                <AppText size={13} tone="mutedForeground">
                  {archived
                    ? "Dompet kembali aktif dan saldonya ikut dihitung di kekayaan bersih."
                    : "Dompet disembunyikan dan saldonya tidak dihitung di kekayaan bersih. Riwayat transaksi tetap tersimpan, dan dompet bisa dipulihkan kapan saja."}
                </AppText>
                <ArchiveButton walletId={wallet!.id} archived={archived} />
              </View>
            </>
          )}
        </>
      )}
    </Page>
  );
}

/** Setelah berhasil: toast, tetap di detail dompet, dan form dipasang ulang (kosong) lewat key, sama dengan web. */
function AdjustBalanceForm({ walletId, balance }: { walletId: number; balance: number }) {
  const [round, setRound] = useState(0);
  return <AdjustBalanceFields key={round} walletId={walletId} balance={balance} onSaved={() => setRound((value) => value + 1)} />;
}

const MODES = [
  { value: "actual", label: "Saldo sebenarnya" },
  { value: "delta", label: "Tambah / Kurangi" },
] as const;

function AdjustBalanceFields({ walletId, balance, onSaved }: { walletId: number; balance: number; onSaved: () => void }) {
  const theme = useTheme();
  const toast = useToast();
  const save = useAdjustWallet(walletId);
  const [mode, setMode] = useState<"actual" | "delta">("actual");
  const [actual, setActual] = useState("");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const { fieldErrors, message } = errorOf(save.error);

  let adjustment: Adjustment | null = null;
  if (mode === "actual") {
    const actualAmount = parseAmountInput(actual);
    adjustment = actualAmount === null ? null : computeAdjustment(balance, actualAmount);
  } else {
    const deltaAmount = parseAmountInput(amount);
    adjustment = deltaAmount && deltaAmount > 0 ? { direction, amount: deltaAmount } : null;
  }
  const newBalance = adjustment ? balance + (adjustment.direction === "in" ? adjustment.amount : -adjustment.amount) : balance;

  const submit = () =>
    save.mutate(
      mode === "delta" ? { mode, direction, amount: parseAmountInput(amount) } : { mode, actualBalance: parseAmountInput(actual) },
      {
        onSuccess: (result) => {
          toast({ message: result.message, type: "success" });
          onSaved();
        },
      },
    );

  return (
    <View style={styles.form}>
      {message ? <FormMessage message={message} /> : null}
      <Segmented options={MODES} value={mode} onChange={setMode} />

      {mode === "actual" ? (
        <FormField
          label="Saldo sebenarnya sekarang"
          hint="Lihat di aplikasi bank atau e-wallet, atau hitung uang tunaimu."
          error={fieldErrors.actualBalance}
        >
          <MoneyInput
            value={actual}
            onChangeText={(text) => setActual(formatAmountInput(text))}
            invalid={Boolean(fieldErrors.actualBalance)}
            accessibilityLabel="Saldo sebenarnya sekarang"
          />
        </FormField>
      ) : (
        <>
          <View>
            <AppText size={13} weight={500} tone="mutedForeground" style={styles.legend}>
              Saldo mau
            </AppText>
            <View style={styles.directions}>
              <ChoiceChip label="Tambah" selected={direction === "in"} onPress={() => setDirection("in")} style={styles.flex} />
              <ChoiceChip label="Kurangi" selected={direction === "out"} onPress={() => setDirection("out")} style={styles.flex} />
            </View>
          </View>
          <FormField label="Nominal" error={fieldErrors.amount}>
            <MoneyInput value={amount} onChangeText={(text) => setAmount(formatAmountInput(text))} invalid={Boolean(fieldErrors.amount)} accessibilityLabel="Nominal" />
          </FormField>
        </>
      )}

      <View style={[styles.preview, { backgroundColor: theme.muted }]} accessibilityLiveRegion="polite">
        <View style={styles.previewRow}>
          <AppText size={14} lineHeight={20} tone="mutedForeground">
            Selisih
          </AppText>
          <AppText size={14} lineHeight={20} weight={600} numeric>
            {adjustment ? formatSigned(adjustment.amount, adjustment.direction) : formatRupiah(0)}
          </AppText>
        </View>
        <View style={styles.previewRow}>
          <AppText size={14} lineHeight={20} tone="mutedForeground">
            Saldo jadi
          </AppText>
          <AppText size={14} lineHeight={20} weight={600} tone={newBalance < 0 ? "warning" : "foreground"} numeric>
            {formatRupiah(newBalance)}
          </AppText>
        </View>
        {newBalance < 0 ? (
          // BR-07: saldo minus boleh, tapi diberi tahu.
          <View style={styles.minusRow}>
            <Icon name="AlertTriangle" size={16} color={theme.warning} />
            <AppText size={13} tone="warning">
              Saldo akan minus.
            </AppText>
          </View>
        ) : null}
        <AppText size={13} tone="mutedForeground">
          Dicatat sebagai koreksi saldo, bukan pemasukan atau pengeluaran, jadi tidak memengaruhi ringkasan bulanan. Kalau uangnya
          memang masuk atau keluar karena sesuatu, catat sebagai transaksi biasa.
        </AppText>
      </View>

      <Button label={save.isPending ? "Menyimpan…" : "Simpan koreksi"} big onPress={submit} disabled={save.isPending || !adjustment} />
    </View>
  );
}

function RenameWalletForm({ walletId, name: current }: { walletId: number; name: string }) {
  const toast = useToast();
  const save = useRenameWallet(walletId);
  const [name, setName] = useState(current);
  const { fieldErrors, message } = errorOf(save.error);
  return (
    <View style={styles.renameForm}>
      {message ? <FormMessage message={message} /> : null}
      <FormField label="Nama dompet" error={fieldErrors.name}>
        <Input value={name} onChangeText={setName} maxLength={50} invalid={Boolean(fieldErrors.name)} accessibilityLabel="Nama dompet" />
      </FormField>
      <Button
        label={save.isPending ? "Menyimpan…" : "Simpan nama"}
        variant="outline"
        disabled={save.isPending}
        onPress={() => save.mutate(name, { onSuccess: (result) => toast({ message: result.message, type: "success" }) })}
      />
    </View>
  );
}

/** Sama dengan web: tanpa toast, langsung ke daftar dompet setelah diarsipkan/dipulihkan. */
function ArchiveButton({ walletId, archived }: { walletId: number; archived: boolean }) {
  const toast = useToast();
  const change = useSetWalletArchived(walletId);
  const label = change.isPending ? (archived ? "Memulihkan…" : "Mengarsipkan…") : archived ? "Pulihkan" : "Arsipkan";
  return (
    <Button
      label={label}
      icon={archived ? "ArchiveArrowUp" : "Archive"}
      variant="outline"
      disabled={change.isPending}
      onPress={() =>
        change.mutate(!archived, {
          onSuccess: () => router.dismissTo("/wallets"),
          onError: (error) => toast({ message: error.message, type: "error" }),
        })
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: RADIUS.xl, padding: 16, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  balanceRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  warning: { flexDirection: "row", gap: 8, borderWidth: 1, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 12 },
  warningIcon: { marginTop: 2 },
  selfStart: { alignSelf: "flex-start", paddingHorizontal: 0 },
  section: { gap: 12 },
  divided: { borderTopWidth: 1, paddingTop: 24 },
  form: { gap: 16 },
  renameForm: { gap: 12 },
  legend: { marginBottom: 8 },
  directions: { flexDirection: "row", gap: 8 },
  preview: { borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  previewRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  minusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
});
