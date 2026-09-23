import { pastikanTabel, resErr, resJson, siapPakai, sql } from "./_lib/db.js";
import { resTolak, tokenSah } from "./_lib/auth.js";

export const config = { runtime: "nodejs" };

interface AppDataPayload {
  kategori?: { id: string; nama: string; tipe: string; warna: string; ikon: string; urutan?: number }[];
  transaksi?: {
    id: string;
    tipe: string;
    kategoriId?: string | null;
    jumlah: number;
    tanggal: string;
    keterangan?: string;
    referensi?: string;
    createdAt?: string;
    updatedAt?: string;
  }[];
  pengaturan?: Record<string, unknown>;
}

export async function POST(req: Request): Promise<Response> {
  if (!siapPakai()) return resErr("Database belum dihubungkan", 503);
  if (!tokenSah(req)) return resTolak();
  const d = (await req.json().catch(() => ({}))) as AppDataPayload;
  if (!Array.isArray(d.kategori) || !Array.isArray(d.transaksi)) {
    return resErr("Isi backup tidak lengkap", 400);
  }

  try {
    await pastikanTabel();
    await sql`DELETE FROM transaksi`;
    await sql`DELETE FROM kategori`;
    await sql`DELETE FROM app_settings`;

    for (const k of d.kategori) {
      await sql`
        INSERT INTO kategori (id, nama, tipe, warna, ikon, urutan)
        VALUES (${k.id}, ${k.nama}, ${k.tipe}, ${k.warna}, ${k.ikon}, ${k.urutan ?? 0})
      `;
    }
    for (const t of d.transaksi) {
      const jam = t.tanggal ? `${t.tanggal}T09:00:00` : new Date().toISOString();
      await sql`
        INSERT INTO transaksi (id, tipe, kategori_id, jumlah, tanggal, keterangan, referensi, created_at, updated_at)
        VALUES (
          ${t.id}, ${t.tipe}, ${t.kategoriId ?? null}, ${Math.round(t.jumlah)}, ${t.tanggal},
          ${t.keterangan ?? ""}, ${t.referensi ?? ""}, ${t.createdAt ?? jam}, ${t.updatedAt ?? t.createdAt ?? jam}
        )
      `;
    }
    const p = (d.pengaturan ?? {}) as Record<string, unknown>;
    await sql`
      INSERT INTO app_settings (key, value) VALUES ('pengaturan', ${JSON.stringify(p)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;

    return resJson({ ok: true, jumlahTransaksi: d.transaksi.length });
  } catch (e) {
    console.error("backup POST:", e);
    return resErr("Terjadi kesalahan server");
  }
}