// Klien API Lajur (/api/v1 di money-management). Token sesi dikirim sebagai
// `Authorization: Bearer <token>`; token disimpan terenkripsi oleh lib/auth.tsx (SecureStore).

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || "https://lajur.stackfolio.web.id").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
    /** Kode error Better Auth (endpoint /api/auth), mis. INVALID_EMAIL_OR_PASSWORD. */
    readonly code: string | null = null,
  ) {
    super(message);
  }
}

export const OFFLINE_MESSAGE = "Tidak bisa terhubung ke server. Periksa koneksi internet.";

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setApiToken(value: string | null) {
  token = value;
}

/** Dipanggil saat server menolak token (401): sesi habis atau dikeluarkan dari web. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type RequestOptions = { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown; signal?: AbortSignal };

/** Request mentah; dipakai juga untuk membaca header (token saat masuk). */
export async function rawRequest(path: string, { method = "GET", body, signal }: RequestOptions = {}) {
  const headers: Record<string, string> = { accept: "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(0, OFFLINE_MESSAGE);
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token && path.startsWith("/api/v1/")) onUnauthorized?.();
    throw toApiError(response.status, data);
  }
  return { data, headers: response.headers };
}

export async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  return (await rawRequest(path, options)).data as T;
}

/** Error /api/v1: { error: { message, fieldErrors } }. Error Better Auth: { code, message }. */
export function toApiError(status: number, data: unknown): ApiError {
  const body = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const inner = (body.error && typeof body.error === "object" ? body.error : {}) as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  if (inner.fieldErrors && typeof inner.fieldErrors === "object") {
    for (const [field, message] of Object.entries(inner.fieldErrors as Record<string, unknown>)) {
      if (typeof message === "string") fieldErrors[field] = message;
    }
  }
  const message =
    typeof inner.message === "string"
      ? inner.message
      : typeof body.message === "string"
        ? body.message
        : `Terjadi kesalahan (${status}). Coba lagi sebentar lagi.`;
  return new ApiError(status, message, fieldErrors, typeof body.code === "string" ? body.code : null);
}

// ---- Bentuk data /api/v1 (lihat money-management docs/technical-design.md §5) -------------

export type User = { id: string; name: string; email: string; timezone: string; emailVerified: boolean };

export type WalletType = "cash" | "bank" | "ewallet" | "savings" | "receivable" | "payable";

export type Wallet = {
  id: number;
  name: string;
  type: WalletType;
  brand: string | null;
  counterparty: string | null;
  balance: number;
  archivedAt: string | null;
};

export type TransactionType = "expense" | "income" | "transfer" | "adjustment";

export type Transaction = {
  id: number;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  note: string | null;
  fromWalletId: number | null;
  fromWalletName: string | null;
  fromWalletType: WalletType | null;
  toWalletId: number | null;
  toWalletName: string | null;
  toWalletType: WalletType | null;
  categoryId: number | null;
  categoryName: string | null;
};

export type Category = { id: number; name: string; kind: "expense" | "income"; usageCount: number };

export type CategoryShare = {
  type: "expense" | "income";
  categoryId: number;
  categoryName: string;
  total: number;
  share: number;
};

export type MonthlySummary = {
  income: number;
  expense: number;
  net: number;
  expenseByCategory: CategoryShare[];
  incomeByCategory: CategoryShare[];
};

export type Home = {
  today: string;
  month: string;
  netWorth: { total: number; note: string };
  debts: { receivable: number; payable: number };
  walletCount: number;
  wallets: Wallet[];
  summary: MonthlySummary;
  recentTransactions: Transaction[];
};

export type TransactionInput = {
  type: "expense" | "income" | "transfer";
  amount: number | null;
  walletId: number | null;
  toWalletId: number | null;
  categoryId: number | null;
  /** Kosong = hari ini menurut zona waktu user (server). */
  transactionDate: string;
  note: string;
};

export type SaveResult = { id: number; warning?: string };
