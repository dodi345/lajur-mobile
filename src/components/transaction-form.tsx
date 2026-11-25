import { useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { AppText, Button, Chip, FieldError, Segmented, TextField } from "@/components/ui";
import type { Transaction, TransactionInput } from "@/lib/api";
import { displayDate, parseDisplayDate, shiftDay } from "@/lib/date";
import { formatAmountInput, groupThousands, parseAmountInput } from "@/lib/money";
import { useCategories, useWallets } from "@/lib/queries";

// Form catat/ubah transaksi (US-06/07/08/09). Validasi akhir tetap di server (skema Zod yang sama
// dengan web); pesan per field dari server ditampilkan di bawah isian masing-masing.

type EntryType = TransactionInput["type"];

const TYPE_OPTIONS = [
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
  { value: "transfer", label: "Transfer" },
] as const;

export function TransactionForm({
  initial,
  today,
  submitting,
  fieldErrors,
  message,
  submitLabel,
  onSubmit,
}: {
  initial?: Transaction;
  /** Hari ini menurut zona waktu user (dari server); belum ada = tanggal dikosongkan (server mengisi). */
  today: string | undefined;
  submitting: boolean;
  fieldErrors: Record<string, string>;
  message: string | null;
  submitLabel: string;
  onSubmit: (input: TransactionInput) => void;
}) {
  const wallets = useWallets();
  const [type, setType] = useState<EntryType>(
    initial && initial.type !== "adjustment" ? initial.type : "expense",
  );
  const [amount, setAmount] = useState(initial ? groupThousands(initial.amount) : "");
  const [walletId, setWalletId] = useState<number | null>(
    initial ? (initial.type === "income" ? initial.toWalletId : initial.fromWalletId) : null,
  );
  const [toWalletId, setToWalletId] = useState<number | null>(initial?.type === "transfer" ? initial.toWalletId : null);
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null);
  const [date, setDate] = useState(initial?.transactionDate ?? "");
  const [otherDate, setOtherDate] = useState(initial && initial.transactionDate !== today ? displayDate(initial.transactionDate) : "");
  const [dateMode, setDateMode] = useState<"today" | "yesterday" | "other">(
    !initial || initial.transactionDate === today ? "today" : today && initial.transactionDate === shiftDay(today, -1) ? "yesterday" : "other",
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [localError, setLocalError] = useState<string | null>(null);
  const categories = useCategories(type === "income" ? "income" : "expense");

  const walletList = wallets.data ?? [];
  // Dompet pertama dipilih otomatis untuk transaksi baru.
  const selectedWallet = walletId ?? (initial ? null : (walletList[0]?.id ?? null));

  const chooseDate = (mode: "today" | "yesterday" | "other") => {
    setDateMode(mode);
    if (mode === "today") setDate(today ?? "");
    if (mode === "yesterday" && today) setDate(shiftDay(today, -1));
    if (mode === "other") setDate(parseDisplayDate(otherDate) ?? "");
  };

  const submit = () => {
    setLocalError(null);
    let transactionDate = dateMode === "today" ? (today ?? "") : date;
    if (dateMode === "other") {
      const parsed = parseDisplayDate(otherDate);
      if (!parsed) {
        setLocalError("Tulis tanggal sebagai HH/BB/TTTT, mis. 08/11/2026.");
        return;
      }
      transactionDate = parsed;
    }
    onSubmit({
      type,
      amount: parseAmountInput(amount),
      walletId: selectedWallet,
      toWalletId: type === "transfer" ? toWalletId : null,
      categoryId: type === "transfer" ? null : categoryId,
      transactionDate,
      note: note.trim(),
    });
  };

  return (
    <View style={styles.form}>
      <Segmented
        options={TYPE_OPTIONS}
        value={type}
        onChange={(next) => {
          setType(next);
          setCategoryId(null);
        }}
      />
      <FieldError message={fieldErrors.type} />

      <TextField
        label="Nominal (Rp)"
        value={amount}
        onChangeText={(text) => setAmount(formatAmountInput(text))}
        keyboardType="number-pad"
        placeholder="0"
        error={fieldErrors.amount}
        style={styles.amount}
        autoFocus={!initial}
      />

      <Picker label={type === "income" ? "Masuk ke dompet" : "Dari dompet"} error={fieldErrors.walletId}>
        {walletList.map((wallet) => (
          <Chip key={wallet.id} label={wallet.name} selected={selectedWallet === wallet.id} onPress={() => setWalletId(wallet.id)} />
        ))}
      </Picker>
      {wallets.isSuccess && walletList.length === 0 && (
        <AppText tone="muted">Belum ada dompet. Tambahkan dompet dulu dari tab Dompet.</AppText>
      )}

      {type === "transfer" ? (
        <Picker label="Ke dompet" error={fieldErrors.toWalletId}>
          {walletList
            .filter((wallet) => wallet.id !== selectedWallet)
            .map((wallet) => (
              <Chip key={wallet.id} label={wallet.name} selected={toWalletId === wallet.id} onPress={() => setToWalletId(wallet.id)} />
            ))}
        </Picker>
      ) : (
        <Picker label="Kategori" error={fieldErrors.categoryId}>
          {(categories.data ?? []).map((category) => (
            <Chip key={category.id} label={category.name} selected={categoryId === category.id} onPress={() => setCategoryId(category.id)} />
          ))}
        </Picker>
      )}

      <Picker label="Tanggal" error={fieldErrors.transactionDate ?? localError ?? undefined}>
        <Chip label="Hari ini" selected={dateMode === "today"} onPress={() => chooseDate("today")} />
        {today && <Chip label="Kemarin" selected={dateMode === "yesterday"} onPress={() => chooseDate("yesterday")} />}
        <Chip label="Tanggal lain" selected={dateMode === "other"} onPress={() => chooseDate("other")} />
      </Picker>
      {dateMode === "other" && (
        <TextField
          label="Tanggal (HH/BB/TTTT)"
          value={otherDate}
          onChangeText={setOtherDate}
          placeholder="08/11/2026"
          keyboardType="numbers-and-punctuation"
        />
      )}

      <TextField
        label="Catatan (opsional)"
        value={note}
        onChangeText={setNote}
        placeholder="mis. makan siang"
        maxLength={200}
        error={fieldErrors.note}
      />

      {message && (
        <AppText tone="destructive" accessibilityRole="alert">
          {message}
        </AppText>
      )}
      <Button label={submitLabel} onPress={submit} loading={submitting} />
    </View>
  );
}

function Picker({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View style={styles.picker}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {children}
      </ScrollView>
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 18 },
  amount: { fontSize: 26, fontWeight: "700", minHeight: 60, fontVariant: ["tabular-nums"] },
  picker: { gap: 8 },
  chips: { gap: 8, paddingRight: 8 },
});
