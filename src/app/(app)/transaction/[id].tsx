import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { transactionDirection, transactionTitle } from "@/components/finance";
import { FormScreen } from "@/components/screen";
import { useToast } from "@/components/toast";
import { TransactionForm } from "@/components/transaction-form";
import { AppText, Button, Card, ErrorState, Loading } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { dayLabel } from "@/lib/date";
import { formatSigned } from "@/lib/money";
import { useDeleteTransaction, useHome, useRestoreTransaction, useSaveTransaction, useTransaction } from "@/lib/queries";

// Ubah atau hapus transaksi (US-09). Hapus = soft delete + toast "Batal" (BR-10), tanpa dialog.
export default function TransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transactionId = Number(id);
  const query = useTransaction(transactionId);
  const save = useSaveTransaction(transactionId);
  const remove = useDeleteTransaction();
  const restore = useRestoreTransaction();
  const today = useHome().data?.today;
  const toast = useToast();

  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  const transaction = query.data;

  const onDelete = () =>
    remove.mutate(transaction.id, {
      onSuccess: () => {
        router.back();
        toast({
          message: "Transaksi dihapus.",
          actionLabel: "Batal",
          onAction: () =>
            restore.mutate(transaction.id, {
              onSuccess: () => toast({ message: "Transaksi dipulihkan." }),
              onError: (error) => toast({ message: error.message, tone: "warning" }),
            }),
        });
      },
      onError: (error) => toast({ message: error.message, tone: "warning" }),
    });

  // Saldo awal / koreksi (adjustment) hanya diubah lewat dompet di web (BR-04).
  if (transaction.type === "adjustment") {
    return (
      <FormScreen>
        <Card>
          <AppText variant="heading">{transactionTitle(transaction)}</AppText>
          <AppText variant="title" numeric>
            {formatSigned(transaction.amount, transactionDirection(transaction))}
          </AppText>
          <AppText tone="muted">
            {transaction.toWalletName ?? transaction.fromWalletName} · {dayLabel(transaction.transactionDate)}
          </AppText>
        </Card>
        <AppText tone="muted">Saldo awal dan koreksi saldo diubah lewat halaman dompet di web Lajur.</AppText>
      </FormScreen>
    );
  }

  const error = save.error instanceof ApiError ? save.error : null;
  return (
    <FormScreen>
      <TransactionForm
        initial={transaction}
        today={today}
        submitting={save.isPending}
        fieldErrors={error?.fieldErrors ?? {}}
        message={save.error ? (Object.keys(error?.fieldErrors ?? {}).length > 0 ? null : save.error.message) : null}
        submitLabel="Simpan perubahan"
        onSubmit={(input) =>
          save.mutate(input, {
            onSuccess: (result) => {
              toast(result.warning ? { message: result.warning, tone: "warning" } : { message: "Perubahan disimpan." });
              router.back();
            },
          })
        }
      />
      <View style={styles.danger}>
        <Button label="Hapus transaksi" variant="destructive" icon="delete" loading={remove.isPending} onPress={onDelete} />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  danger: { marginTop: 8 },
});
