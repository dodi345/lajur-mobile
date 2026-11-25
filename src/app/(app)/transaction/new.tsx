import { router } from "expo-router";
import { FormScreen } from "@/components/screen";
import { useToast } from "@/components/toast";
import { TransactionForm } from "@/components/transaction-form";
import { ApiError } from "@/lib/api";
import { useHome, useSaveTransaction } from "@/lib/queries";

// Catat transaksi (US-06/07/08).
export default function NewTransactionScreen() {
  const save = useSaveTransaction();
  const today = useHome().data?.today;
  const toast = useToast();
  const error = save.error instanceof ApiError ? save.error : null;
  return (
    <FormScreen>
      <TransactionForm
        today={today}
        submitting={save.isPending}
        fieldErrors={error?.fieldErrors ?? {}}
        message={save.error ? (Object.keys(error?.fieldErrors ?? {}).length > 0 ? null : save.error.message) : null}
        submitLabel="Simpan"
        onSubmit={(input) =>
          save.mutate(input, {
            onSuccess: (result) => {
              // BR-07: saldo minus tetap tersimpan, dengan peringatan.
              toast(result.warning ? { message: result.warning, tone: "warning" } : { message: "Transaksi tersimpan." });
              router.back();
            },
          })
        }
      />
    </FormScreen>
  );
}
