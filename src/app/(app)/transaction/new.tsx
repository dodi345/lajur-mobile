import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { TransactionForm } from "@/components/transaction-form";
import { ApiError } from "@/lib/api";
import { useDeleteTransaction, useHome, useSaveTransaction } from "@/lib/queries";

// Catat transaksi (US-06/07/08): sheet dari tombol "+". Tersimpan → toast "Transaksi tersimpan." + "Batal"
// (menghapus lagi, BR-10); saldo jadi minus → toast peringatan dengan keterangan (BR-07). Sama dengan web.
export default function NewTransactionScreen() {
  const save = useSaveTransaction();
  const remove = useDeleteTransaction();
  const today = useHome().data?.today;
  const toast = useToast();
  const error = save.error instanceof ApiError ? save.error : null;
  const fieldErrors = error?.fieldErrors ?? {};
  return (
    <Sheet title="Catat transaksi">
      {({ close }) => (
        <TransactionForm
          today={today}
          submitting={save.isPending}
          fieldErrors={fieldErrors}
          message={save.error && Object.keys(fieldErrors).length === 0 ? save.error.message : null}
          submitLabel="Simpan"
          onSubmit={(input) =>
            save.mutate(input, {
              onSuccess: (result) => {
                const undo = () =>
                  remove.mutate(result.id, {
                    onSuccess: () => toast({ message: "Transaksi dibatalkan" }),
                    onError: () => toast({ message: "Transaksi tidak bisa dibatalkan.", type: "error" }),
                  });
                toast({
                  message: "Transaksi tersimpan.",
                  type: result.warning ? "warning" : "default",
                  description: result.warning,
                  actionLabel: "Batal",
                  onAction: undo,
                });
                close();
              },
            })
          }
        />
      )}
    </Sheet>
  );
}
