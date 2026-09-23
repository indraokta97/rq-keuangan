import { pastikanTabel, resErr, resJson, siapPakai, sql } from "./_lib/db.js";

export const config = { runtime: "nodejs" };

interface KategoriPayload {
  id: string;
  nama: string;
  tipe: "pemasukan" | "pengeluaran";
  warna: string;
  ikon: string;
  urutan?: number;
}

async function bacaBody(req: Request): Promise<Partial<KategoriPayload>> {
  return req.json().catch(() => ({}));
}

export async function POST(req: Request): Promise<Response> {
  if (!siapPakai()) return resErr("Database belum dihubungkan", 503);
  const p = (await bacaBody(req)) as KategoriPayload;
  if (!p.id || !p.nama || !p.tipe) return resErr("Data kategori tidak lengkap", 400);

  try {
    await pastikanTabel();
    await sql`
      INSERT INTO kategori (id, nama, tipe, warna, ikon, urutan)
      VALUES (${p.id}, ${p.nama}, ${p.tipe}, ${p.warna ?? "#0E9F6E"}, ${p.ikon ?? "CircleEllipsis"}, ${p.urutan ?? 0})
    `;
    return resJson({ ok: true });
  } catch (e) {
    return resErr(e instanceof Error ? e.message : "Gagal menyimpan kategori");
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
    const lama = (await sql`SELECT * FROM kategori WHERE id = ${id}`) as Record<string, unknown>[];
    if (lama.length === 0) return resErr("Kategori tidak ditemukan", 404);
    const l = lama[0];

    await sql`
      UPDATE kategori SET
        nama = ${p.nama ?? (l.nama as string)},
        tipe = ${p.tipe ?? (l.tipe as string)},
        warna = ${p.warna ?? (l.warna as string)},
        ikon = ${p.ikon ?? (l.ikon as string)},
        urutan = ${p.urutan ?? (l.urutan as number)}
      WHERE id = ${id}
    `;
    return resJson({ ok: true });
  } catch (e) {
    return resErr(e instanceof Error ? e.message : "Gagal memperbarui kategori");
  }
}

export async function DELETE(req: Request): Promise<Response> {
  if (!siapPakai()) return resErr("Database belum dihubungkan", 503);
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return resErr("Parameter id wajib ada", 400);

  try {
    await pastikanTabel();
    await sql`DELETE FROM kategori WHERE id = ${id}`;
    return resJson({ ok: true });
  } catch (e) {
    return resErr(e instanceof Error ? e.message : "Gagal menghapus kategori");
  }
}