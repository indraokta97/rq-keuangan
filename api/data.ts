import { bacaPengaturan, pastikanTabel, resErr, resJson, siapPakai, sql } from "./_lib/db.js";

export const config = { runtime: "nodejs" };

export async function GET(): Promise<Response> {
  if (!siapPakai()) return resErr("Database belum dihubungkan", 503);
  try {
    await pastikanTabel();

    const [kat, trx, pengaturan] = await Promise.all([
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
      kategori: kat as unknown[],
      transaksi: (trx as { jumlah: unknown }[]).map((r) => ({ ...r, jumlah: Number(r.jumlah) })),
      pengaturan: {
        namaOrganisasi: String(nilaiAwal?.namaOrganisasi ?? "Rumah Quran UGM"),
        saldoAwal: Number(nilaiAwal?.saldoAwal ?? 0),
        tahunMulai: Number(nilaiAwal?.tahunMulai ?? new Date().getFullYear()),
        catatanBulanan: Boolean(nilaiAwal?.catatanBulanan ?? true),
      },
    });
  } catch (e) {
    console.error("data GET:", e);
    return resErr("Terjadi kesalahan server");
  }
}