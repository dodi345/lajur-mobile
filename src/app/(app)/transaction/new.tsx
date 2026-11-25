import { Sheet } from "@/components/sheet";
import { TransactionForm, useRecordTransaction } from "@/components/transaction-form";
import { useHome } from "@/lib/queries";

// Catat transaksi (US-06/07/08): sheet dari tombol "+". Tersimpan → toast "Transaksi tersimpan." + "Batal"
// (menghapus lagi, BR-10); saldo jadi minus → toast peringatan dengan keterangan (BR-07). Sama dengan web.
export default function NewTransactionScreen() {
  const { record, submitting, fieldErrors, message } = useRecordTransaction();
  const today = useHome().data?.today;
  return (
    <Sheet title="Catat transaksi">
      {({ close }) => (
        <TransactionForm
          today={today}
          submitting={submitting}
          fieldErrors={fieldErrors}
          message={message}
          submitLabel="Simpan"
          onSubmit={(input) => record(input, close)}
        />
      )}
    </Sheet>
  );
}
