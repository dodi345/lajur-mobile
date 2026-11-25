import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  request,
  type Category,
  type Goal,
  type Home,
  type MonthlySummary,
  type Profile,
  type SaveResult,
  type Transaction,
  type TransactionInput,
  type TransactionList,
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
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await request<{ profile: Profile }>("/api/v1/profile")).profile,
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
