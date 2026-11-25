import { renderRouter, screen } from "expo-router/testing-library";
import type { ReactNode } from "react";
import type { Category, Goal, Home, MonthlySummary, Profile, Transaction, Wallet } from "@/lib/api";

// Smoke test: setiap layar setelah login dirender dengan data contoh (bentuk sama dengan /api/v1)
// tanpa crash dan tanpa console.error. Tab bar native diganti Stack (tidak bisa dirender di Jest).

jest.mock("@/lib/auth", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    status: "signedIn",
    user: { id: "u1", name: "Budi", email: "budi@contoh.id", timezone: "Asia/Jakarta", emailVerified: true },
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    signOutEverywhere: jest.fn(),
    signInDemo: jest.fn(),
    replaceToken: jest.fn(),
    forgetSession: jest.fn(),
  }),
  authErrorMessage: () => "error",
}));

const wallet: Wallet = { id: 1, name: "BCA Utama", type: "bank", brand: "bca", counterparty: null, balance: 1_250_000, archivedAt: null };
const minus: Wallet = { id: 2, name: "Dompet harian", type: "cash", brand: null, counterparty: null, balance: -5_000, archivedAt: null };
const transactions: Transaction[] = [
  {
    id: 10, type: "expense", amount: 25_000, transactionDate: "2026-11-25", note: "makan siang",
    fromWalletId: 1, fromWalletName: "BCA Utama", fromWalletType: "bank", toWalletId: null, toWalletName: null, toWalletType: null,
    categoryId: 3, categoryName: "Makan", categoryIcon: "BowlRice",
  },
  {
    id: 11, type: "transfer", amount: 100_000, transactionDate: "2026-11-24", note: null,
    fromWalletId: 1, fromWalletName: "BCA Utama", fromWalletType: "bank", toWalletId: 2, toWalletName: "Dompet harian", toWalletType: "cash",
    categoryId: null, categoryName: null, categoryIcon: null,
  },
  {
    id: 12, type: "adjustment", amount: 50_000, transactionDate: "2026-11-01", note: null,
    fromWalletId: null, fromWalletName: null, fromWalletType: null, toWalletId: 2, toWalletName: "Dompet harian", toWalletType: "cash",
    categoryId: null, categoryName: null, categoryIcon: null,
  },
];
const summary: MonthlySummary = {
  income: 5_000_000,
  expense: 25_000,
  net: 4_975_000,
  expenseByCategory: [{ type: "expense", categoryId: 3, categoryName: "Makan", categoryIcon: "BowlRice", total: 25_000, share: 1 }],
  incomeByCategory: [{ type: "income", categoryId: 1, categoryName: "Gaji", categoryIcon: "Briefcase", total: 5_000_000, share: 1 }],
};
const goal: Goal = {
  id: 7,
  name: "Dana darurat",
  targetAmount: 10_000_000,
  deadline: "2027-06-30",
  walletId: 2,
  walletName: "Dompet harian",
  walletType: "savings",
  walletBrand: null,
  balance: 4_200_000,
  achievedOn: null,
  archived: false,
  progress: { share: 0.42, remaining: 5_800_000, achieved: false, daysLeft: 217 },
};
const profile: Profile = {
  id: "u1",
  name: "Budi",
  email: "budi@contoh.id",
  timezone: "Asia/Jakarta",
  emailVerified: false,
  avatarColor: null,
  joinedOn: "2026-11-25",
};
const home: Home = {
  today: "2026-11-25",
  month: "2026-11",
  netWorth: { total: 1_245_000, note: "Total dari 2 dompet aktif" },
  debts: { receivable: 0, payable: 0 },
  walletCount: 2,
  wallets: [minus, wallet],
  summary,
  recentTransactions: transactions,
  goals: [goal],
  lastWalletId: 2,
};
const categories: Category[] = [{ id: 3, name: "Makan", kind: "expense", icon: "BowlRice", usageCount: 4 }];
const debt = {
  id: 30, name: "Piutang: Andi", type: "receivable", counterparty: "Andi", dueDate: "2026-11-20", balance: 60_000, total: 100_000,
  lastDate: "2026-11-24", archived: false, remaining: 60_000, settled: false, due: { text: "Lewat jatuh tempo 5 hari", overdue: true },
};
const loan: Transaction = {
  id: 20, type: "transfer", amount: 100_000, transactionDate: "2026-11-24", note: null,
  fromWalletId: 1, fromWalletName: "BCA Utama", fromWalletType: "bank", fromCounterparty: null,
  toWalletId: 30, toWalletName: "Piutang: Andi", toWalletType: "receivable", toCounterparty: "Andi",
  categoryId: null, categoryName: null, categoryIcon: null,
};

function apiResponse(path: string): unknown {
  const url = new URL(path, "https://contoh.test");
  const routes: Record<string, unknown> = {
    "/api/v1/home": home,
    "/api/v1/wallets": { wallets: url.searchParams.get("archived") ? [] : [wallet, minus] },
    "/api/v1/goals": { today: "2026-11-25", goals: [goal], archived: [] },
    "/api/v1/profile": {
      profile,
      demo: false,
      counts: { wallets: 2, openDebts: 0, trash: 1, sessions: 2 },
      telegram: { ready: true, linkedOn: null, active: false },
      data: { transactions: 3, wallets: 2, goals: 1 },
    },
    "/api/v1/sessions": {
      timezone: "Asia/Jakarta",
      sessions: [
        { id: "s1", label: "Android · Lajur", lastActiveAt: "2026-11-25T07:00:00.000Z", current: true },
        { id: "s2", label: "Chrome di Linux", lastActiveAt: "2026-11-24T07:05:00.000Z", current: false },
      ],
    },
    "/api/v1/wallets/1": { wallet, transactions },
    "/api/v1/wallets/2": { wallet: minus, transactions },
    "/api/v1/goals/7": { today: "2026-11-25", goal, deposit: { fromWalletId: 1, toWalletId: 2 } },
    "/api/v1/goals/8": { today: "2026-11-25", goal: { ...goal, id: 8, archived: true, achievedOn: "2026-10-12" }, deposit: null },
    "/api/v1/goals/savings-wallets": {
      today: "2026-11-25",
      wallets: [
        { id: 2, name: "Dompet harian", brand: null, balance: 4_200_000, usedBy: "Dana darurat" },
        { id: 5, name: "Celengan", brand: null, balance: 0, usedBy: null },
      ],
    },
    "/api/v1/categories": url.searchParams.get("view") === "manage"
      ? { active: categories.map((category) => ({ ...category, archivedAt: null })), archived: [] }
      : { categories },
    "/api/v1/transactions": {
      month: "2026-11",
      today: "2026-11-25",
      transactions,
      totals: { income: 0, expense: 25_000 },
      days: [
        { date: "2026-11-25", label: "Hari ini · Rab, 25 Nov", net: -25_000 },
        { date: "2026-11-24", label: "Kemarin · Sel, 24 Nov", net: 0 },
        { date: "2026-11-01", label: "Min, 1 Nov", net: 0 },
      ],
    },
    "/api/v1/transactions/10": { transaction: transactions[0] },
    "/api/v1/transactions/20": { transaction: loan },
    "/api/v1/debts": { today: "2026-11-25", debts: [debt], counterparties: ["Andi"] },
    "/api/v1/debts/30": { today: "2026-11-25", debt, history: [loan] },
    "/api/v1/categories/3": { category: { ...categories[0], archivedAt: null } },
    "/api/v1/trash": { items: [{ ...transactions[0], daysAgo: 6 }] },
    "/api/v1/summary": { month: "2026-11", summary },
  };
  if (!(url.pathname in routes)) throw new Error(`Rute API tidak terduga: ${url.pathname}`);
  return routes[url.pathname];
}

// Tab bar asli (BottomNav) ikut dirender.
const overrides = {};
let consoleError: jest.SpyInstance;

beforeEach(() => {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const body = apiResponse(String(input).replace(/^https?:\/\/[^/]+/, ""));
    return { ok: true, status: 200, headers: new Headers(), json: async () => body } as Response;
  });
  consoleError = jest.spyOn(console, "error");
});

afterEach(() => {
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

const cases: [string, string | RegExp][] = [
  ["/", "makan siang"],
  ["/transactions", "Hari ini · Rab, 25 Nov"],
  ["/goals", "Dana darurat"],
  ["/profile", "Bergabung 25 Nov 2026"],
  ["/wallets", "Dompet harian"],
  ["/summary", "Gaji"],
  ["/transaction/new", "Catat transaksi"],
  ["/transaction/10", "Simpan perubahan"],
  ["/wallet/new", "Tambah dompet"],
  ["/wallet/1", "Simpan koreksi"],
  // Saldo minus: peringatan (BR-07) di kartu dan di pratinjau koreksi.
  ["/wallet/2", "Saldo akan minus."],
  ["/goal/7", "Tabung sekarang"],
  ["/goal/8", "Dana darurat (diarsipkan)"],
  ["/goal/7/deposit", "Tabung ke Dana darurat"],
  ["/goal/new", 'Sudah dipakai target "Dana darurat"'],
  ["/debts", "Lewat jatuh tempo 5 hari"],
  ["/debt/30", "Pinjamkan ke Andi"],
  ["/debt/30/pay", "Simpan bayaran dari Andi"],
  ["/debt/new", "Pinjaman lama"],
  ["/transaction/20", "Buka pinjaman"],
  ["/categories", "4 transaksi"],
  ["/category/3", "Dipakai di 4 transaksi"],
  ["/trash", /dihapus 6 hari lalu/],
  // Sudah punya dompet → bukan onboarding lagi: "Tambah dompet" biasa dengan form yang sama.
  ["/onboarding", "Simpan & tambah dompet lain"],
  ["/sessions", "Terakhir aktif 24 Nov 2026, 14.05"],
  ["/profile/email", "Belum dikonfirmasi"],
  ["/profile/password", "Ulangi password baru"],
  ["/profile/delete", "3 transaksi · 2 dompet · 1 target"],
];

describe.each(cases)("layar %s", (url, expected) => {
  it("tampil dengan data tanpa error", async () => {
    const router = await renderRouter({ appDir: "src/app", overrides }, { initialUrl: url });
    expect(router.getPathname()).toBe(url);
    expect((await screen.findAllByText(expected)).length).toBeGreaterThan(0);
    expect(screen.queryByText("Coba lagi")).toBeNull();
  });
});
