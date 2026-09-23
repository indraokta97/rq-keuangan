import { bacaPengaturan, pastikanTabel, resErr, resJson, siapPakai, sql } from "./_lib/db";

export const config = { runtime: "nodejs" };

export async function GET(): Promise<Response> {
  if (!siapPakai()) return resErr("Database belum dihubungkan", 503);
  try {
    await pastikanTabel();

    const [kategori, transaksi, pengaturan] = await Promise.all([
      sql`SELECT id, nama, tipe, warna, ikon, urutan FROM kategori ORDER BY urutan, nama`,
      sql`
        SELECT id, tipe, kategori_id AS "kategoriId", jumlah, tanggal, keterangan, referensi, bukti,
               created_at AS "createdAt", updated_at AS "updatedAt"
        FROM transaksi
      `,
      bacaPengaturan(),
    ]);

    const nilaiAwal = pengaturan.pengaturan as Record<string, unknown>;
    return resJson({
      kategori: kategori as unknown[],
      transaksi: transaksi as unknown[],
      pengaturan: {
        namaOrganisasi: String(nilaiAwal?.namaOrganisasi ?? "Rumah Quran UGM"),
        saldoAwal: Number(nilaiAwal?.saldoAwal ?? 0),
        tahunMulai: Number(nilaiAwal?.tahunMulai ?? new Date().getFullYear()),
        catatanBulanan: Boolean(nilaiAwal?.catatanBulanan ?? true),
      },
    });
  } catch (e) {
    return resErr(e instanceof Error ? e.message : "Gagal membaca data");
  }
}