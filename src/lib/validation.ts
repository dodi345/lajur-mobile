// Validasi form Masuk/Daftar dengan aturan dan pesan yang sama dengan web (lib/validation/auth.ts, zod).
// Dicek di HP sebelum dikirim ke Better Auth, supaya pesannya per kolom seperti web; server tetap memeriksa ulang.

/** Pola email zod v4 (z.email()), dipakai web. */
const EMAIL = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;

/** Email dirapikan (spasi & huruf besar) sebelum dicek, sama dengan web. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function emailError(value: string): string | undefined {
  return EMAIL.test(normalizeEmail(value)) ? undefined : "Format email belum benar.";
}

type Errors<F extends string> = Partial<Record<F, string>>;

function clean<F extends string>(errors: Errors<F>): Errors<F> {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as Errors<F>;
}

export function registerErrors(input: { name: string; email: string; password: string }): Errors<"name" | "email" | "password"> {
  const name = input.name.trim();
  return clean({
    name: name.length === 0 ? "Nama wajib diisi." : name.length > 100 ? "Nama maksimal 100 karakter." : undefined,
    email: emailError(input.email),
    // Password tidak di-trim: spasi adalah bagian dari password.
    password:
      input.password.length < 8
        ? "Password minimal 8 karakter."
        : input.password.length > 128
          ? "Password maksimal 128 karakter."
          : undefined,
  });
}

export function loginErrors(input: { email: string; password: string }): Errors<"email" | "password"> {
  return clean({
    email: emailError(input.email),
    password: input.password.length === 0 ? "Password wajib diisi." : undefined,
  });
}
