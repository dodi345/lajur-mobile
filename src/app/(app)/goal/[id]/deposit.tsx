import { useLocalSearchParams } from "expo-router";
import { Sheet } from "@/components/sheet";
import { TransactionForm, useRecordTransaction } from "@/components/transaction-form";
import { ErrorState, Loading } from "@/components/ui";
import { useGoal } from "@/lib/queries";

// Tabung ke target = components/goals/goal-deposit.tsx web. BR-08: menabung = transfer ke dompet tabungan
// target. Form yang sama dengan "Catat transaksi", tab Transfer terpilih dan dompet tujuan terisi.
export default function GoalDepositScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useGoal(Number(id));
  const { record, submitting, fieldErrors, message } = useRecordTransaction();
  const goal = query.data?.goal;
  const deposit = query.data?.deposit;

  return (
    <Sheet title={goal ? `Tabung ke ${goal.name}` : "Tabung ke target"}>
      {({ close }) =>
        query.isPending ? (
          <Loading />
        ) : query.isError || !deposit ? (
          // Target yang diarsipkan tidak bisa ditabung (web: tidak ditemukan).
          <ErrorState message={query.error?.message ?? "Target tidak ditemukan."} />
        ) : (
          <TransactionForm
            preset={{ type: "transfer", walletId: deposit.fromWalletId, toWalletId: deposit.toWalletId }}
            today={query.data.today}
            submitting={submitting}
            fieldErrors={fieldErrors}
            message={message}
            submitLabel="Simpan"
            onSubmit={(input) => record(input, close)}
          />
        )
      }
    </Sheet>
  );
}
