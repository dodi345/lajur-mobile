import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { describeTransaction, TransactionAmount, transactionIcon } from "@/components/finance";
import { Sheet, type SheetControls } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { TransactionForm } from "@/components/transaction-form";
import { AppText, Button, ErrorState, IconChip, Loading, TextLink } from "@/components/ui";
import { ApiError, type Transaction } from "@/lib/api";
import { groupLabel } from "@/lib/date";
import { useDeleteTransaction, useHome, useRestoreTransaction, useSaveTransaction, useTransaction } from "@/lib/queries";
import { RADIUS, useTheme } from "@/lib/theme";

// Edit transaksi (US-09) + hapus tanpa dialog, bisa dibatalkan lewat toast "Batal" (BR-10).
// Transaksi pinjaman (BR-13) dan koreksi saldo tidak bisa diubah lewat form (hanya dihapus), sama dengan web.

const isDebtType = (type: Transaction["fromWalletType"]) => type === "receivable" || type === "payable";

/** Dompet pinjaman yang disentuh transaksi ini (null = transaksi biasa). */
function debtWalletOf(transaction: Transaction): number | null {
  if (isDebtType(transaction.toWalletType)) return transaction.toWalletId;
  if (isDebtType(transaction.fromWalletType)) return transaction.fromWalletId;
  return null;
}

export default function TransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transactionId = Number(id);
  const query = useTransaction(transactionId);
  const debtWalletId = query.data ? debtWalletOf(query.data) : null;
  const adjustment = query.data?.type === "adjustment";
  return (
    <Sheet title={debtWalletId ? "Transaksi pinjaman" : adjustment ? "Koreksi saldo" : "Edit transaksi"}>
      {(controls) =>
        query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
        ) : debtWalletId ? (
          <LoanDetail transaction={query.data} debtWalletId={debtWalletId} controls={controls} />
        ) : adjustment ? (
          <AdjustmentDetail transaction={query.data} controls={controls} />
        ) : (
          <EditForm transaction={query.data} controls={controls} />
        )
      }
    </Sheet>
  );
}

function useDelete(transaction: Transaction, { close }: SheetControls) {
  const remove = useDeleteTransaction();
  const restore = useRestoreTransaction();
  const toast = useToast();
  const run = () =>
    remove.mutate(transaction.id, {
      onSuccess: () => {
        toast({
          message: "Dihapus",
          actionLabel: "Batal",
          onAction: () =>
            restore.mutate(transaction.id, {
              onSuccess: () => toast({ message: "Transaksi dipulihkan" }),
              onError: () => toast({ message: "Transaksi tidak bisa dipulihkan.", type: "error" }),
            }),
        });
        close();
      },
      onError: (error) => toast({ message: error.message, type: "error" }),
    });
  return { run, pending: remove.isPending };
}

function DeleteButton({ onPress, pending }: { onPress: () => void; pending: boolean }) {
  return (
    <Button
      label={pending ? "Menghapus…" : "Hapus transaksi"}
      icon="Trash"
      variant="destructive"
      onPress={onPress}
      disabled={pending}
    />
  );
}

function EditForm({ transaction, controls }: { transaction: Transaction; controls: SheetControls }) {
  const theme = useTheme();
  const save = useSaveTransaction(transaction.id);
  const today = useHome().data?.today;
  const toast = useToast();
  const remove = useDelete(transaction, controls);
  const error = save.error instanceof ApiError ? save.error : null;
  const fieldErrors = error?.fieldErrors ?? {};
  // Form, keterangan, dan tombol hapus = blok terpisah di sheet (jarak 24px), sama dengan web.
  return (
    <>
    <TransactionForm
      initial={transaction}
      today={today}
      submitting={save.isPending}
      fieldErrors={fieldErrors}
      message={save.error && Object.keys(fieldErrors).length === 0 ? save.error.message : null}
      submitLabel="Simpan perubahan"
      onSubmit={(input) =>
        save.mutate(input, {
          onSuccess: (result) => {
            toast(result.warning ? { message: "Perubahan disimpan.", type: "warning", description: result.warning } : { message: "Perubahan disimpan." });
            controls.close();
          },
        })
      }
    />
      <AppText size={13} tone="mutedForeground">
        Mengubah nominal atau tanggal ikut memperbarui saldo dompet dan ringkasan bulan terkait.
      </AppText>
      <View style={[styles.danger, { borderTopColor: theme.border }]}>
        <DeleteButton onPress={remove.run} pending={remove.pending} />
      </View>
    </>
  );
}

function AdjustmentDetail({ transaction, controls }: { transaction: Transaction; controls: SheetControls }) {
  const theme = useTheme();
  const remove = useDelete(transaction, controls);
  const today = useHome().data?.today;
  const wallet = transaction.toWalletName ?? transaction.fromWalletName ?? "";
  return (
    <>
      <View style={[styles.summaryCard, { backgroundColor: theme.muted }]}>
        <IconChip name="SliderAlt" color={theme.transfer} background={theme.muted} />
        <View style={styles.flex}>
          <AppText weight={500} numberOfLines={1}>
            {transaction.note || "Koreksi saldo"}
          </AppText>
          <AppText size={13} tone="mutedForeground">
            Koreksi saldo · {wallet} · {groupLabel(transaction.transactionDate, today)}
          </AppText>
        </View>
        <TransactionAmount type="adjustment" amount={transaction.amount} incoming={transaction.toWalletId !== null} />
      </View>
      <AppText size={13} tone="mutedForeground">
        Saldo awal dan koreksi saldo dibuat dari halaman Dompet. Kalau salah, hapus lalu koreksi ulang saldo dompetnya.
      </AppText>
      <DeleteButton onPress={remove.run} pending={remove.pending} />
    </>
  );
}

/** Transaksi pinjaman: hanya ditampilkan + bisa dihapus; ubah lewat halaman pinjaman (web: "Buka pinjaman"). */
function LoanDetail({ transaction, debtWalletId, controls }: { transaction: Transaction; debtWalletId: number; controls: SheetControls }) {
  const theme = useTheme();
  const remove = useDelete(transaction, controls);
  const today = useHome().data?.today;
  const { title, subtitle } = describeTransaction(transaction);
  const icon = transactionIcon(transaction);
  return (
    <>
      <View style={[styles.summaryCard, { backgroundColor: theme.muted }]}>
        <IconChip name={icon.name} color={theme.transfer} background={theme.muted} />
        <View style={styles.flex}>
          <AppText weight={500} numberOfLines={1}>
            {title}
          </AppText>
          <AppText size={13} tone="mutedForeground">
            {subtitle} · {groupLabel(transaction.transactionDate, today)}
          </AppText>
        </View>
        <TransactionAmount type="transfer" amount={transaction.amount} />
      </View>
      <View style={styles.loanNote}>
        <AppText size={13} tone="mutedForeground">
          Catatan pinjaman tidak bisa diedit. Kalau salah, hapus lalu catat ulang dari halaman pinjaman.
        </AppText>
        {/* Kembali ke detail pinjaman kalau dibuka dari sana, selain itu ganti sheet ini dengan detailnya. */}
        <TextLink label="Buka pinjaman" onPress={() => router.dismissTo(`/debt/${debtWalletId}`)} style={styles.selfStart} />
      </View>
      <DeleteButton onPress={remove.run} pending={remove.pending} />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  loanNote: { gap: 4 },
  selfStart: { alignSelf: "flex-start", paddingHorizontal: 0 },
  danger: { borderTopWidth: 1, paddingTop: 20 },
  summaryCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: RADIUS.xl, padding: 16 },
});
