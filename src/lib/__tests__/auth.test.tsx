import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { ApiError, request } from "@/lib/api";
import { AuthProvider, authErrorMessage, useAuth } from "@/lib/auth";

// SecureStore palsu di memori (di HP: Android Keystore).
const mockStore = new Map<string, string>();
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockStore.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockStore.delete(key)),
}));

const fetchMock = jest.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

const USER = { id: "u1", name: "Budi", email: "budi@contoh.id", timezone: "Asia/Jakarta", emailVerified: true };

function reply(status: number, body: unknown, headers: Record<string, string> = {}) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } }));
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  mockStore.clear();
  fetchMock.mockReset();
});

describe("sesi login app", () => {
  it("tanpa token tersimpan → belum masuk", async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("signedOut"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("masuk: token dari header set-auth-token disimpan, lalu dipakai untuk /api/v1/me", async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("signedOut"));

    fetchMock
      .mockReturnValueOnce(reply(200, { token: "abc" }, { "set-auth-token": "token-sesi" }))
      .mockReturnValueOnce(reply(200, { user: USER }));
    await act(() => result.current.signIn(" budi@contoh.id ", "rahasia123"));

    expect(result.current.status).toBe("signedIn");
    expect(result.current.user).toEqual(USER);
    expect(mockStore.get("lajur.session-token")).toBe("token-sesi");
    const [signInUrl, signInInit] = fetchMock.mock.calls[0];
    expect(signInUrl).toMatch(/\/api\/auth\/sign-in\/email$/);
    expect(JSON.parse(signInInit.body)).toEqual({ email: "budi@contoh.id", password: "rahasia123", rememberMe: true });
    expect(fetchMock.mock.calls[1][1].headers.authorization).toBe("Bearer token-sesi");
  });

  it("token tersimpan masih berlaku → langsung masuk; 401 kemudian → keluar dan token dihapus", async () => {
    mockStore.set("lajur.session-token", "token-lama");
    fetchMock.mockReturnValueOnce(reply(200, { user: USER }));
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("signedIn"));

    fetchMock.mockReturnValueOnce(reply(401, { error: { message: "Masuk dulu." } }));
    await expect(request("/api/v1/home")).rejects.toBeInstanceOf(ApiError);
    await waitFor(() => expect(result.current.status).toBe("signedOut"));
    expect(mockStore.has("lajur.session-token")).toBe(false);
  });

  it("keluar: sesi server dihapus dan token di HP dibuang, walau server tidak bisa dihubungi", async () => {
    mockStore.set("lajur.session-token", "token-lama");
    fetchMock.mockReturnValueOnce(reply(200, { user: USER }));
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("signedIn"));

    fetchMock.mockRejectedValueOnce(new TypeError("Network request failed"));
    await act(() => result.current.signOut());
    expect(fetchMock.mock.calls.at(-1)?.[0]).toMatch(/\/api\/auth\/sign-out$/);
    expect(result.current.status).toBe("signedOut");
    expect(mockStore.size).toBe(0);
  });

  it("pesan error Better Auth dalam bahasa Indonesia", () => {
    expect(authErrorMessage(new ApiError(401, "Invalid", {}, "INVALID_EMAIL_OR_PASSWORD"))).toBe("Email atau password salah.");
    expect(authErrorMessage(new ApiError(422, "x", {}, "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"))).toMatch(/sudah terdaftar/);
    expect(authErrorMessage(new ApiError(400, "x", {}, "EMAIL_PASSWORD_SIGN_UP_DISABLED"))).toBe("Pendaftaran akun baru sedang ditutup.");
    expect(authErrorMessage(new ApiError(429, "x"))).toMatch(/Terlalu banyak percobaan/);
  });
});
