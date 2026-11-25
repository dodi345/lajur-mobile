import { loginErrors, normalizeEmail, registerErrors } from "@/lib/validation";

// Aturan dan pesan sama dengan web (money-management lib/validation/auth.ts).
describe("validasi Masuk/Daftar", () => {
  it("daftar: nama wajib (maks. 100), email valid, password 8–128 karakter", () => {
    expect(registerErrors({ name: " ", email: "budi@", password: "pendek" })).toEqual({
      name: "Nama wajib diisi.",
      email: "Format email belum benar.",
      password: "Password minimal 8 karakter.",
    });
    expect(registerErrors({ name: "x".repeat(101), email: "a@b.co", password: "x".repeat(129) })).toEqual({
      name: "Nama maksimal 100 karakter.",
      password: "Password maksimal 128 karakter.",
    });
    // Email dirapikan dulu (spasi, huruf besar); spasi di password tetap dihitung.
    expect(registerErrors({ name: "Budi", email: "  Budi@Contoh.ID ", password: "        " })).toEqual({});
  });

  it("masuk: email valid dan password wajib", () => {
    expect(loginErrors({ email: "budi", password: "" })).toEqual({
      email: "Format email belum benar.",
      password: "Password wajib diisi.",
    });
    expect(loginErrors({ email: "budi@contoh.id", password: "x" })).toEqual({});
  });

  it("email dikirim dalam huruf kecil tanpa spasi", () => {
    expect(normalizeEmail("  Budi@Contoh.ID ")).toBe("budi@contoh.id");
  });
});
