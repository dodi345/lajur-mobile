import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { API_URL, authHeaders } from "@/lib/api";

// Ekspor CSV (US-14): file dari server (isi sama dengan unduhan web) disimpan sementara di cache app,
// lalu dibuka lewat lembar Bagikan Android (simpan ke Files/Drive, buka di Excel / Google Sheets).
export async function exportTransactionsCsv(today: string | undefined): Promise<void> {
  const folder = new Directory(Paths.cache, "ekspor");
  if (!folder.exists) folder.create();
  const file = new File(folder, `lajur-transaksi-${today ?? "semua"}.csv`);
  if (file.exists) file.delete();
  const saved = await File.downloadFileAsync(`${API_URL}/api/v1/export`, file, { headers: authHeaders(), idempotent: true });
  await Sharing.shareAsync(saved.uri, { mimeType: "text/csv", dialogTitle: "Ekspor CSV" });
}
