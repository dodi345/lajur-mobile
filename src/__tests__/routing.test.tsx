import { Stack } from "expo-router";
import { renderRouter, screen } from "expo-router/testing-library";
import type { ReactNode } from "react";
import { Text } from "react-native";

// Navigasi akar (src/app/_layout.tsx) dengan status login palsu. Tab dan Beranda diganti layar
// sederhana; layar Masuk/Daftar memakai file aslinya.

let mockStatus: "signedIn" | "signedOut" = "signedOut";

jest.mock("@/lib/auth", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({ status: mockStatus, user: null, signIn: jest.fn(), signUp: jest.fn(), signOut: jest.fn() }),
  authErrorMessage: () => "error",
}));

const overrides = {
  "(app)/(tabs)/_layout": () => <Stack />,
  "(app)/(tabs)/index": () => <Text>beranda</Text>,
};

async function open(url: string) {
  return renderRouter({ appDir: "src/app", overrides }, { initialUrl: url });
}

describe("navigasi sesuai status login", () => {
  it("belum login: membuka app langsung ke layar Masuk, bukan Unmatched Route", async () => {
    mockStatus = "signedOut";
    const router = await open("/");
    expect(router.getPathname()).toBe("/login");
    expect(screen.getByText("Lanjutkan mencatat keuanganmu.")).toBeOnTheScreen();
    expect(screen.queryByText(/Unmatched/)).toBeNull();
  });

  it("belum login: layar Daftar bisa dibuka", async () => {
    mockStatus = "signedOut";
    const router = await open("/register");
    expect(router.getPathname()).toBe("/register");
  });

  it("belum login: halaman yang butuh login dialihkan ke Masuk", async () => {
    mockStatus = "signedOut";
    const router = await open("/transaction/new");
    expect(router.getPathname()).toBe("/login");
  });

  it("sudah login: membuka app langsung ke Beranda", async () => {
    mockStatus = "signedIn";
    const router = await open("/");
    expect(router.getPathname()).toBe("/");
    expect(screen.getByText("beranda")).toBeOnTheScreen();
  });

  it("sudah login: layar Masuk tidak bisa dibuka lagi", async () => {
    mockStatus = "signedIn";
    const router = await open("/login");
    expect(router.getPathname()).toBe("/");
  });
});
