import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  request,
  type Category,
  type DebtDetail,
  type DebtList,
  type Goal,
  type GoalDetail,
  type Home,
  type ManagedCategory,
  type DeviceSession,
  type MessageResult,
  type MonthlySummary,
  type ProfileResponse,
  type SavingsWalletOption,
  type SaveResult,
  type Transaction,
  type TransactionInput,
  type TransactionList,
  type TrashItem,
  type Wallet,
} from "@/lib/api";

// Data dari /api/v1. Setelah mencatat/mengubah/menghapus, semua data dimuat ulang (saldo, ringkasan,
// dan daftar saling bergantung; datanya kecil, jadi lebih aman daripada memperbarui satu per satu).

export function useHome() {
  return useQuery({ queryKey: ["home"], queryFn: () => request<Home>("/api/v1/home") });
}

export function useWallets(archived = false) {
  return useQuery({
    queryKey: ["wallets", archived],
    queryFn: async () => (await request<{ wallets: Wallet[] }>(`/api/v1/wallets${archived ? "?archived=1" : ""}`)).wallets,
  });
}

export function useWallet(id: number) {
  return useQuery({
    queryKey: ["wallet", id],
    queryFn: () => request<{ wallet: Wallet; transactions: Transaction[] }>(`/api/v1/wallets/${id}`),
  });
}

export function useCategories(kind: "expense" | "income") {
  return useQuery({
    queryKey: ["categories", kind],
    queryFn: async () => (await request<{ categories: Category[] }>(`/api/v1/categories?kind=${kind}`)).categories,
    staleTime: 5 * 60_000,
  });
}

export type TransactionFilter = { month?: string; type?: Transaction["type"]; walletId?: number; categoryId?: number };

export function useTransactions(filter: TransactionFilter) {
  const params = new URLSearchParams();
  if (filter.month) params.set("month", filter.month);
  if (filter.type) params.set("type", filter.type);
  if (filter.walletId) params.set("walletId", String(filter.walletId));
  if (filter.categoryId) params.set("categoryId", String(filter.categoryId));
  return useQuery({
    queryKey: ["transactions", filter.month ?? null, filter.type ?? null, filter.walletId ?? null, filter.categoryId ?? null],
    queryFn: () => request<TransactionList>(`/api/v1/transactions?${params}`),
  });
}

export function useTransaction(id: number) {
  return useQuery({
    queryKey: ["transaction", id],
    queryFn: async () => (await request<{ transaction: Transaction }>(`/api/v1/transactions/${id}`)).transaction,
  });
}

export function useSummary(month: string | undefined) {
  return useQuery({
    queryKey: ["summary", month ?? null],
    queryFn: () =>
      request<{ month: string; summary: MonthlySummary }>(`/api/v1/summary${month ? `?month=${month}` : ""}`),
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: () => request<{ today: string; goals: Goal[]; archived: Goal[] }>("/api/v1/goals"),
  });
}

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: () => request<ProfileResponse>("/api/v1/profile") });
}

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: () => request<{ timezone: string; sessions: DeviceSession[] }>("/api/v1/sessions"),
  });
}

// Aksi Akun: logika dan validasi di server (lib/services/account.ts web), sama dengan form web.
export type ProfileInput = Partial<Record<"name" | "timezone" | "avatarColor", string>>;

export function useUpdateProfile() {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (input: ProfileInput) => request<MessageResult>("/api/v1/profile", { method: "PATCH", body: input }),
    onSuccess: refresh,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
      request<MessageResult>("/api/v1/profile/password", { method: "POST", body: input }),
  });
}

export function useChangeEmail() {
  return useMutation({
    mutationFn: (input: { newEmail: string; password: string }) =>
      request<MessageResult>("/api/v1/profile/email", { method: "POST", body: input }),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: () => request<MessageResult>("/api/v1/profile/verification", { method: "POST", body: {} }),
  });
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request<MessageResult>("/api/v1/sessions/revoke-others", { method: "POST", body: {} }),
    onSuccess: () => queryClient.invalidateQueries({ predicate: (query) => ["sessions", "profile"].includes(String(query.queryKey[0])) }),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (input: { password: string; confirmation: string }) =>
      request<MessageResult>("/api/v1/profile", { method: "DELETE", body: input }),
  });
}

export function useTelegramLink() {
  return useMutation({ mutationFn: () => request<{ url: string }>("/api/v1/telegram", { method: "POST", body: {} }) });
}

export function useUnlinkTelegram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request<MessageResult>("/api/v1/telegram", { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}

function useRefreshAll() {
  const queryClient = useQueryClient();
  // Kategori tidak ikut (urutan "paling sering dipakai" cukup diperbarui berkala).
  return () => queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] !== "categories" });
}

export function useSaveTransaction(id?: number) {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (input: TransactionInput) =>
      request<SaveResult>(id ? `/api/v1/transactions/${id}` : "/api/v1/transactions", {
        method: id ? "PUT" : "POST",
        body: input,
      }),
    onSuccess: refresh,
  });
}

export function useDeleteTransaction() {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (id: number) => request<{ ok: true }>(`/api/v1/transactions/${id}`, { method: "DELETE" }),
    onSuccess: refresh,
  });
}

export function useRestoreTransaction() {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (id: number) => request<{ ok: true }>(`/api/v1/transactions/${id}/restore`, { method: "POST" }),
    onSuccess: refresh,
  });
}

export type WalletInput = {
  name: string;
  type: "cash" | "bank" | "ewallet" | "savings";
  brand: string | null;
  openingBalance: number | null;
};

export function useCreateWallet() {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (input: WalletInput) => request<{ id: number }>("/api/v1/wallets", { method: "POST", body: input }),
    onSuccess: refresh,
  });
}

/** Koreksi saldo (BR-04): saldo sebenarnya, atau tambah/kurangi. */
export type AdjustInput =
  | { mode: "actual"; actualBalance: number | null }
  | { mode: "delta"; direction: "in" | "out"; amount: number | null };

export function useAdjustWallet(id: number) {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (input: AdjustInput) => request<MessageResult>(`/api/v1/wallets/${id}/adjust`, { method: "POST", body: input }),
    onSuccess: refresh,
  });
}

export function useRenameWallet(id: number) {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (name: string) => request<MessageResult>(`/api/v1/wallets/${id}`, { method: "PATCH", body: { name } }),
    onSuccess: refresh,
  });
}

/** Arsipkan (true) atau pulihkan (false) dompet (US-05, BR-09). */
export function useSetWalletArchived(id: number) {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (archived: boolean) =>
      request<MessageResult>(`/api/v1/wallets/${id}/${archived ? "archive" : "restore"}`, { method: "POST" }),
    onSuccess: refresh,
  });
}

export function useGoal(id: number) {
  return useQuery({ queryKey: ["goal", id], queryFn: () => request<GoalDetail>(`/api/v1/goals/${id}`) });
}

export function useSavingsWallets() {
  return useQuery({
    queryKey: ["savings-wallets"],
    queryFn: () => request<{ today: string; wallets: SavingsWalletOption[] }>("/api/v1/goals/savings-wallets"),
  });
}

export type GoalInput = { name: string; targetAmount: number | null; deadline: string | null; wallet: "new" | number };

export function useCreateGoal() {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (input: GoalInput) => request<{ id: number; message: string }>("/api/v1/goals", { method: "POST", body: input }),
    onSuccess: refresh,
  });
}

/** Arsipkan (true) atau pulihkan (false) target. Pulihkan bisa ditolak (409) kalau dompetnya dipakai target lain. */
export function useSetGoalArchived(id: number) {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (archived: boolean) =>
      request<MessageResult>(`/api/v1/goals/${id}/${archived ? "archive" : "restore"}`, { method: "POST" }),
    onSuccess: refresh,
  });
}

// ── Utang & Piutang (US-15..21) ────────────────────────────────────────────────────────────────

export function useDebts() {
  return useQuery({ queryKey: ["debts"], queryFn: () => request<DebtList>("/api/v1/debts") });
}

export function useDebt(id: number) {
  return useQuery({ queryKey: ["debt", id], queryFn: () => request<DebtDetail>(`/api/v1/debts/${id}`) });
}

export type NewDebtInput = {
  kind: "lend" | "borrow";
  /** Pinjaman lama (US-21): tanpa dompet, saldo dompet tidak berubah. */
  existing: boolean;
  counterparty: string;
  amount: number | null;
  walletId: number | null;
  transactionDate: string;
  dueDate: string | null;
  note: string;
};

export function useRecordDebt() {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (input: NewDebtInput) => request<{ id: number; message: string }>("/api/v1/debts", { method: "POST", body: input }),
    onSuccess: refresh,
  });
}

export type RepaymentInput = { amount: number | null; walletId: number | null; transactionDate: string; note: string };

export function usePayDebt(id: number) {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (input: RepaymentInput) =>
      request<{ id: number; message: string }>(`/api/v1/debts/${id}/pay`, { method: "POST", body: input }),
    onSuccess: refresh,
  });
}

// ── Kategori (US-11) ─────────────────────────────────────────────────────────────────────────────

export function useManagedCategories(kind: "expense" | "income") {
  return useQuery({
    queryKey: ["categories", "manage", kind],
    queryFn: () => request<{ active: ManagedCategory[]; archived: ManagedCategory[] }>(`/api/v1/categories?kind=${kind}&view=manage`),
  });
}

export function useCategory(id: number) {
  return useQuery({
    queryKey: ["categories", "detail", id],
    queryFn: async () => (await request<{ category: ManagedCategory }>(`/api/v1/categories/${id}`)).category,
  });
}

/** Kategori dipakai form catat dan halaman Kategori: setelah berubah, semua data kategori dimuat ulang. */
function useRefreshCategories() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ predicate: (query) => ["categories", "transactions", "summary", "home"].includes(String(query.queryKey[0])) });
}

export function useCreateCategory() {
  const refresh = useRefreshCategories();
  return useMutation({
    mutationFn: (input: { name: string; kind: "expense" | "income" }) =>
      request<{ id: number; message: string }>("/api/v1/categories", { method: "POST", body: input }),
    onSuccess: refresh,
  });
}

export function useRenameCategory(id: number) {
  const refresh = useRefreshCategories();
  return useMutation({
    mutationFn: (name: string) => request<MessageResult>(`/api/v1/categories/${id}`, { method: "PATCH", body: { name } }),
    onSuccess: refresh,
  });
}

/** Arsipkan (true) atau pulihkan (false) kategori (BR-09). */
export function useSetCategoryArchived(id: number) {
  const refresh = useRefreshCategories();
  return useMutation({
    mutationFn: (archived: boolean) =>
      request<MessageResult>(`/api/v1/categories/${id}/${archived ? "archive" : "restore"}`, { method: "POST" }),
    onSuccess: refresh,
  });
}

// ── Sampah (BR-10) ───────────────────────────────────────────────────────────────────────────────

export function useTrash() {
  return useQuery({
    queryKey: ["trash"],
    queryFn: async () => (await request<{ items: TrashItem[] }>("/api/v1/trash")).items,
  });
}

/** Pendaftaran dibuka/ditutup (DISABLE_SIGNUP di server); dipakai halaman Masuk dan Daftar tanpa login. */
export function useSignUpStatus() {
  return useQuery({
    queryKey: ["signup-status"],
    queryFn: async () => (await request<{ signUpOpen: boolean }>("/api/v1/auth/status")).signUpOpen,
    staleTime: 5 * 60_000,
  });
}
