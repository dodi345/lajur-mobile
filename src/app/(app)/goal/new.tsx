import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icon";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { AppText, Button, ChoiceChip, DateField, ErrorState, FormField, FormMessage, Input, Loading, MoneyInput } from "@/components/ui";
import { WalletLogo } from "@/components/wallet-logo";
import { ApiError } from "@/lib/api";
import { formatAmountInput, formatRupiah, parseAmountInput } from "@/lib/money";
import { useCreateGoal, useSavingsWallets } from "@/lib/queries";
import { useTheme } from "@/lib/theme";

// Target baru (US-13) = components/goals/goal-form.tsx web: nama, nominal, tenggat opsional, dompet tabungan
// (pilih yang ada atau buat baru). BR-08: hanya dompet Tabungan; yang sudah dipakai target aktif tidak bisa dipilih.

const NEW_WALLET = "new";

export default function NewGoalScreen() {
  const theme = useTheme();
  const toast = useToast();
  const options = useSavingsWallets();
  const create = useCreateGoal();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState<string | null>(null);
  const [wallet, setWallet] = useState<number | typeof NEW_WALLET | null>(null);
  const error = create.error instanceof ApiError ? create.error : null;
  const fieldErrors = error?.fieldErrors ?? {};
  const wallets = options.data?.wallets ?? [];
  const today = options.data?.today;
  // Bawaan sama dengan web: dompet tabungan pertama yang belum dipakai, kalau tidak ada "buat baru".
  const selected = wallet ?? wallets.find((item) => !item.usedBy)?.id ?? NEW_WALLET;

  const submit = (close: () => void) =>
    create.mutate(
      { name: name.trim(), targetAmount: parseAmountInput(target), deadline, wallet: selected },
      {
        onSuccess: (result) => {
          toast({ message: result.message, type: "success" });
          close();
        },
      },
    );

  return (
    <Sheet title="Target baru">
      {({ close }) =>
        options.isPending ? (
          <Loading />
        ) : options.isError ? (
          <ErrorState message={options.error.message} onRetry={() => void options.refetch()} />
        ) : (
          <View style={styles.form}>
            {create.error && Object.keys(fieldErrors).length === 0 ? <FormMessage message={create.error.message} /> : null}

            <FormField label="Nama target" error={fieldErrors.name}>
              <Input
                value={name}
                onChangeText={setName}
                autoFocus
                maxLength={50}
                placeholder="mis. Dana darurat"
                invalid={Boolean(fieldErrors.name)}
                accessibilityLabel="Nama target"
              />
            </FormField>

            <FormField label="Nominal target" error={fieldErrors.targetAmount}>
              <MoneyInput
                value={target}
                onChangeText={(text) => setTarget(formatAmountInput(text))}
                invalid={Boolean(fieldErrors.targetAmount)}
                accessibilityLabel="Nominal target"
              />
            </FormField>

            <FormField label="Tenggat (opsional)" error={fieldErrors.deadline}>
              <DateField
                value={deadline}
                onChange={setDeadline}
                min={today}
                clearable
                invalid={Boolean(fieldErrors.deadline)}
                accessibilityLabel="Tenggat (opsional)"
              />
            </FormField>

            <View style={styles.wallets}>
              <AppText size={13} weight={500} tone="mutedForeground">
                Dompet tabungan
              </AppText>
              {wallets.map((item) => (
                <ChoiceChip
                  key={item.id}
                  selected={selected === item.id}
                  disabled={Boolean(item.usedBy)}
                  onPress={() => setWallet(item.id)}
                  accessibilityLabel={item.name}
                  style={[styles.option, item.usedBy ? styles.used : null]}
                >
                  <WalletLogo type="savings" brand={item.brand} />
                  <View style={styles.flex}>
                    <AppText weight={500} numberOfLines={1}>
                      {item.name}
                    </AppText>
                    <AppText size={13} tone="mutedForeground" numeric>
                      {item.usedBy ? `Sudah dipakai target "${item.usedBy}"` : `Saldo ${formatRupiah(item.balance)}`}
                    </AppText>
                  </View>
                </ChoiceChip>
              ))}
              <ChoiceChip
                selected={selected === NEW_WALLET}
                onPress={() => setWallet(NEW_WALLET)}
                accessibilityLabel="Buat dompet tabungan baru"
                style={styles.option}
              >
                <View style={styles.plus}>
                  <Icon name="PlusCircle" size={24} color={theme.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText weight={500}>Buat dompet tabungan baru</AppText>
                  <AppText size={13} tone="mutedForeground">
                    Namanya mengikuti target, saldo awal Rp 0
                  </AppText>
                </View>
              </ChoiceChip>
              {fieldErrors.wallet ? (
                <AppText size={13} tone="destructive">
                  {fieldErrors.wallet}
                </AppText>
              ) : null}
              <AppText size={13} tone="mutedForeground">
                Progres dihitung dari saldo dompet ini. Satu dompet hanya untuk satu target aktif.
              </AppText>
            </View>

            <Button label={create.isPending ? "Menyimpan…" : "Simpan target"} big onPress={() => submit(close)} disabled={create.isPending} />
          </View>
        )
      }
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  form: { gap: 20 },
  wallets: { gap: 8 },
  option: { minHeight: 56, justifyContent: "flex-start", gap: 12, paddingHorizontal: 12, paddingVertical: 8 },
  used: { opacity: 0.6 },
  plus: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
});
