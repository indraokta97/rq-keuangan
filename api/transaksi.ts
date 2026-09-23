import { pastikanTabel, resErr, resJson, siapPakai, sql } from "./_lib/db";

export const config = { runtime: "nodejs" };

interface TipePayload {
  id?: string;
  tipe?: "pemasukan" | "pengeluaran";
  kategoriId?: string | null;
  jumlah?: number;
  tanggal?: string;
  keterangan?: string;
  referensi?: string;
  bukti?: string;
}

function bacaBody(req: Request): Promise<TipePayload> {
  return req.json().catch(() => ({}));
}

export async function POST(req: Request): Promise<Response> {
  if (!siapPakai()) return resErr("Database belum dihubungkan", 503);
  const p = await bacaBody(req);
  if (!p.id || !p.tipe || !p.jumlah) return resErr("Data transaksi tidak lengkap", 400);

  try {
    await pastikanTabel();
    const sekarang = new Date().toISOString();
    await sql`
      INSERT INTO transaksi (id, tipe, kategori_id, jumlah, tanggal, keterangan, referensi, bukti, created_at, updated_at)
      VALUES (
        ${p.id},
        ${p.tipe},
        ${p.kategoriId ?? null},
        ${Math.round(p.jumlah)},
        ${p.tanggal ?? ""},
        ${p.keterangan ?? ""},
        ${p.referensi ?? ""},
        ${p.bukti ?? ""},
        ${sekarang},
        ${sekarang}
      )
    `;
    return resJson({ ok: true });
  } catch (e) {
    return resErr(e instanceof Error ? e.message : "Gagal menyimpan");
  }
}

export async function PUT(req: Request): Promise<Response> {
  if (!siapPakai()) return resErr("Database belum dihubungkan", 503);
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const p = await bacaBody(req);
  if (!id) return resErr("Parameter id wajib ada", 400);

  try {
    await pastikanTabel();
    const lama = (await sql`SELECT * FROM transaksi WHERE id = ${id}`) as Record<string, unknown>[];
    if (lama.length === 0) return resErr("Transaksi tidak ditemukan", 404);
    const l = lama[0];

    const tipe = p.tipe ?? (l.tipe as string);
    const kategoriId = p.kategoriId !== undefined ? p.kategoriId : (l.kategori_id as string | null);
    const jumlah = p.jumlah !== undefined ? Math.round(p.jumlah) : (l.jumlah as number);
    const tanggal = p.tanggal ?? (l.tanggal as string);
    const keterangan = p.keterangan ?? (l.keterangan as string);
    const referensi = p.referensi ?? (l.referensi as string);
    const bukti = p.bukti ?? (l.bukti as string);

    await sql`
      UPDATE transaksi SET
        tipe = ${tipe},
        kategori_id = ${kategoriId},
        jumlah = ${jumlah},
        tanggal = ${tanggal},
        keterangan = ${keterangan},
        referensi = ${referensi},
        bukti = ${bukti},
        updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
    `;
    return resJson({ ok: true });
  } catch (e) {
    return resErr(e instanceof Error ? e.message : "Gagal memperbarui");
  }
}

export async function DELETE(req: Request): Promise<Response> {
  if (!siapPakai()) return resErr("Database belum dihubungkan", 503);
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return resErr("Parameter id wajib ada", 400);

  try {
    await pastikanTabel();
    await sql`DELETE FROM transaksi WHERE id = ${id}`;
    return resJson({ ok: true });
  } catch (e) {
    return resErr(e instanceof Error ? e.message : "Gagal menghapus");
  }
}