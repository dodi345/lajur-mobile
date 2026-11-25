import { router } from "expo-router";
import { useState } from "react";
import { FormScreen } from "@/components/screen";
import { useToast } from "@/components/toast";
import { AppText, Button, FieldError, Segmented, TextField } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatAmountInput, parseAmountInput } from "@/lib/money";
import { useCreateWallet, type WalletInput } from "@/lib/queries";

const TYPES = [
  { value: "cash", label: "Tunai" },
  { value: "bank", label: "Bank" },
  { value: "ewallet", label: "E-wallet" },
  { value: "savings", label: "Tabungan" },
] as const;

// Tambah dompet + saldo awal (US-03). Saldo awal dicatat sebagai adjustment di server (BR-04).
export default function NewWalletScreen() {
  const create = useCreateWallet();
  const toast = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<WalletInput["type"]>("cash");
  const [opening, setOpening] = useState("");
  const error = create.error instanceof ApiError ? create.error : null;
  const fieldErrors = error?.fieldErrors ?? {};

  return (
    <FormScreen>
      <TextField label="Nama dompet" value={name} onChangeText={setName} placeholder="mis. BCA, Dompet harian" maxLength={50} error={fieldErrors.name} />
      <AppText variant="label" tone="muted">
        Jenis
      </AppText>
      <Segmented options={TYPES} value={type} onChange={setType} />
      <FieldError message={fieldErrors.type} />
      <TextField
        label="Saldo sekarang (Rp)"
        value={opening}
        onChangeText={(text) => setOpening(formatAmountInput(text))}
        keyboardType="number-pad"
        placeholder="0"
        hint="Boleh 0. Bisa dikoreksi kapan saja."
        error={fieldErrors.openingBalance}
      />
      {create.error && Object.keys(fieldErrors).length === 0 && (
        <AppText tone="destructive" accessibilityRole="alert">
          {create.error.message}
        </AppText>
      )}
      <Button
        label="Simpan dompet"
        loading={create.isPending}
        onPress={() =>
          create.mutate(
            { name: name.trim(), type, openingBalance: parseAmountInput(opening) },
            {
              onSuccess: () => {
                toast({ message: "Dompet tersimpan." });
                router.back();
              },
            },
          )
        }
      />
    </FormScreen>
  );
}
