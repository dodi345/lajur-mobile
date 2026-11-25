import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { Legend, NoWallets, WalletPicker } from "@/components/transaction-form";
import { AppText, Button, DateField, ErrorState, FormField, FormMessage, Input, Loading, MoneyInput, TextLink } from "@/components/ui";
import { ApiError, type Debt } from "@/lib/api";
import { formatAmountInput, formatRupiah, groupThousands, parseAmountInput } from "@/lib/money";
import { useDebt, usePayDebt, useWallets } from "@/lib/queries";
import { RADIUS } from "@/lib/theme";

// Terima bayaran / bayar utang (US-17) = components/debts/pay-debt.tsx + RepaymentForm web: sebagian atau penuh
// ("Lunasi semua"). Melebihi sisa ditolak server dengan petunjuk mencatat kelebihannya (BR-16).
export default function PayDebtScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useDebt(Number(id));
  const debt = query.data?.debt;
  const receivable = debt?.type !== "payable";
  return (
    <Sheet title={receivable ? "Terima bayaran" : "Bayar utang"}>
      {({ close }) =>
        query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
        ) : debt!.settled ? (
          <>
            <AppText size={14} lineHeight={20} tone="mutedForeground">
              Pinjaman dengan {debt!.counterparty} sudah lunas.
            </AppText>
            <TextLink label="Lihat riwayat" onPress={close} style={styles.selfStart} />
          </>
        ) : (
          <RepaymentForm debt={debt!} today={query.data.today} close={close} />
        )
      }
    </Sheet>
  );
}

function RepaymentForm({ debt, today, close }: { debt: Debt; today: string; close: () => void }) {
  const toast = useToast();
  const wallets = useWallets();
  const pay = usePayDebt(debt.id);
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState<number | null>(null);
  const [date, setDate] = useState<string | null>(today);
  const [note, setNote] = useState("");
  const fieldErrors = (pay.error instanceof ApiError ? pay.error.fieldErrors : undefined) ?? {};
  const receivable = debt.type === "receivable";
  const walletList = wallets.data ?? [];
  const selectedWallet = walletId ?? walletList[0]?.id ?? null;

  const intro = (
    <AppText size={14} lineHeight={20} tone="mutedForeground">
      {receivable ? `${debt.counterparty} masih berutang ` : `Sisa utang ke ${debt.counterparty} `}
      <AppText size={14} lineHeight={20} weight={600} numeric>
        {formatRupiah(debt.remaining)}
      </AppText>
      .
    </AppText>
  );
  if (wallets.isPending) return <Loading />;
  if (walletList.length === 0) {
    return (
      <>
        {intro}
        <NoWallets />
      </>
    );
  }

  const submit = () =>
    pay.mutate(
      { amount: parseAmountInput(amount), walletId: selectedWallet, transactionDate: date ?? "", note: note.trim() },
      {
        onSuccess: (result) => {
          toast({ message: result.message, type: "success" });
          close();
        },
      },
    );

  return (
    <>
      {intro}
      <View style={styles.form}>
        {pay.error && Object.keys(fieldErrors).length === 0 ? <FormMessage message={pay.error.message} /> : null}

        <View style={styles.amount}>
          <FormField label="Nominal" error={fieldErrors.amount}>
            <MoneyInput
              value={amount}
              onChangeText={(text) => setAmount(formatAmountInput(text))}
              autoFocus
              invalid={Boolean(fieldErrors.amount)}
              accessibilityLabel="Nominal"
            />
          </FormField>
          <Pressable
            accessibilityRole="button"
            onPress={() => setAmount(groupThousands(debt.remaining))}
            style={({ pressed }) => [styles.payAll, pressed && { opacity: 0.7 }]}
          >
            <AppText size={14} weight={500} lineHeight={20} tone="primary">
              Lunasi semua ·{" "}
              <AppText size={14} weight={500} lineHeight={20} tone="primary" numeric>
                {formatRupiah(debt.remaining)}
              </AppText>
            </AppText>
          </Pressable>
        </View>

        <View>
          <Legend>{receivable ? "Masuk ke dompet" : "Dibayar dari dompet"}</Legend>
          <WalletPicker wallets={walletList} selected={selectedWallet} onSelect={setWalletId} />
          {fieldErrors.walletId ? (
            <AppText size={13} tone="destructive" style={styles.errorBelow}>
              {fieldErrors.walletId}
            </AppText>
          ) : null}
        </View>

        <FormField label="Tanggal" error={fieldErrors.transactionDate}>
          <DateField value={date} onChange={setDate} max={today} invalid={Boolean(fieldErrors.transactionDate)} accessibilityLabel="Tanggal" />
        </FormField>
        <FormField label="Catatan (opsional)" error={fieldErrors.note}>
          <Input value={note} onChangeText={setNote} maxLength={255} placeholder="mis. Untuk bayar kos" invalid={Boolean(fieldErrors.note)} accessibilityLabel="Catatan (opsional)" />
        </FormField>

        <Button
          label={pay.isPending ? "Menyimpan…" : receivable ? `Simpan bayaran dari ${debt.counterparty}` : "Simpan pembayaran"}
          big
          onPress={submit}
          disabled={pay.isPending}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  selfStart: { alignSelf: "flex-start", paddingHorizontal: 0 },
  form: { gap: 20 },
  amount: { gap: 4 },
  payAll: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start", borderRadius: RADIUS.lg, paddingHorizontal: 4 },
  errorBelow: { marginTop: 6 },
});
