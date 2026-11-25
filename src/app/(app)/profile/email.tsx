import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { AppText, Button, FormField, FormMessage, Input, Loading } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useChangeEmail, useProfile, useResendVerification } from "@/lib/queries";
import { RADIUS, useTheme } from "@/lib/theme";

// Email (US-33 konfirmasi, US-34 ganti email) = components/profile/email-settings.tsx web.
export default function EmailScreen() {
  const query = useProfile();
  return (
    <Sheet title="Email">
      {() =>
        !query.data ? (
          <Loading />
        ) : query.data.demo ? (
          <DemoNote />
        ) : (
          <EmailSettings email={query.data.profile.email} verified={query.data.profile.emailVerified} />
        )
      }
    </Sheet>
  );
}

function DemoNote() {
  const theme = useTheme();
  return (
    <View style={[styles.note, { backgroundColor: theme.muted }]}>
      <AppText size={14} lineHeight={20} tone="mutedForeground">
        Tidak tersedia di akun demo.
      </AppText>
    </View>
  );
}

function EmailSettings({ email, verified }: { email: string; verified: boolean }) {
  const theme = useTheme();
  const toast = useToast();
  const resend = useResendVerification();
  const change = useChangeEmail();
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const error = change.error instanceof ApiError ? change.error : null;
  const fieldErrors = error?.fieldErrors ?? {};

  const current = (
    <View style={[styles.current, { backgroundColor: theme.muted }]}>
      <AppText size={13} tone="mutedForeground">
        Email sekarang
      </AppText>
      <AppText weight={500}>{email}</AppText>
      <AppText size={13} tone={verified ? "income" : "warning"}>
        {verified ? "Terkonfirmasi" : "Belum dikonfirmasi"}
      </AppText>
    </View>
  );

  // BR-34: ganti email hanya untuk email yang sudah terkonfirmasi.
  if (!verified) {
    return (
      <>
        {current}
        <AppText size={14} lineHeight={20}>
          Konfirmasi email ini dulu dengan menekan tautan yang kami kirim. Setelah itu kamu bisa menggantinya.
        </AppText>
        <Button
          label={resend.isPending ? "Mengirim…" : "Kirim ulang email"}
          big
          disabled={resend.isPending}
          onPress={() =>
            resend.mutate(undefined, {
              onSuccess: (result) => toast({ message: result.message, type: "success" }),
              onError: (failure) => toast({ message: failure.message, type: "error" }),
            })
          }
        />
      </>
    );
  }

  if (change.isSuccess) {
    return (
      <>
        {current}
        <View accessibilityRole="alert" style={[styles.sent, { borderColor: theme.border }]}>
          <AppText size={14} lineHeight={20}>
            {change.data.message}
          </AppText>
        </View>
      </>
    );
  }

  return (
    <>
      {current}
      <View style={styles.steps}>
        <AppText size={13} tone="mutedForeground">
          1. Kami kirim tautan konfirmasi ke alamat baru. Pastikan alamatnya benar.
        </AppText>
        <AppText size={13} tone="mutedForeground">
          2. Email akun berganti setelah tautan itu ditekan. Sampai saat itu, kamu tetap masuk memakai email sekarang.
        </AppText>
      </View>
      <View style={styles.form}>
        {change.error && Object.keys(fieldErrors).length === 0 ? <FormMessage message={change.error.message} /> : null}
        <FormField label="Email baru" error={fieldErrors.newEmail}>
          <Input
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="nama@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoFocus
            invalid={Boolean(fieldErrors.newEmail)}
            accessibilityLabel="Email baru"
          />
        </FormField>
        <FormField label="Password saat ini" error={fieldErrors.password}>
          <Input
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            invalid={Boolean(fieldErrors.password)}
            accessibilityLabel="Password saat ini"
          />
        </FormField>
        <Button
          label={change.isPending ? "Mengirim…" : "Ganti email"}
          big
          disabled={change.isPending}
          onPress={() => change.mutate({ newEmail: newEmail.trim(), password })}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  note: { borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 12 },
  current: { borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  sent: { borderWidth: 1, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 12 },
  steps: { gap: 4, paddingLeft: 4 },
  form: { gap: 20 },
});
