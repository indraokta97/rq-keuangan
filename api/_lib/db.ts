import { neon } from "@neondatabase/serverless";

const url = (
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.PGURI
)?.trim();

export const sql = (() => {
  if (!url) return null;
  try {
    return neon(url);
  } catch {
    return null;
  }
})();

export function siapPakai(): boolean {
  return !!sql;
}

export async function pastikanTabel(): Promise<boolean> {
  if (!sql) return false;
  await sql`
    CREATE TABLE IF NOT EXISTS kategori (
      id TEXT PRIMARY KEY,
      nama TEXT NOT NULL,
      tipe TEXT NOT NULL,
      warna TEXT NOT NULL,
      ikon TEXT NOT NULL,
      urutan INTEGER NOT NULL DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS transaksi (
      id TEXT PRIMARY KEY,
      tipe TEXT NOT NULL,
      kategori_id TEXT REFERENCES kategori(id) ON DELETE SET NULL,
      jumlah BIGINT NOT NULL,
      tanggal TEXT NOT NULL,
      keterangan TEXT NOT NULL DEFAULT '',
      referensi TEXT NOT NULL DEFAULT '',
      bukti TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT now()
    )
  `;
  await sql`
    ALTER TABLE transaksi ADD COLUMN IF NOT EXISTS bukti TEXT NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE transaksi ALTER COLUMN jumlah TYPE BIGINT
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '{}'
    )
  `;
  return true;
}

const PENGATURAN_BAWAAN = {
  namaOrganisasi: "Rumah Quran UGM",
  saldoAwal: 0,
  tahunMulai: new Date().getFullYear(),
  catatanBulanan: true,
  kataSandi: "",
};

export async function bacaPengaturan(): Promise<Record<string, unknown>> {
  if (!sql) return PENGATURAN_BAWAAN;
  const baris = await sql`SELECT key, value FROM app_settings`;
  const gabung: Record<string, unknown> = {};
  for (const r of baris as { key: string; value: string }[]) {
    try {
      gabung[r.key] = JSON.parse(r.value);
    } catch {
      gabung[r.key] = r.value;
    }
  }
  return gabung;
}

export async function tulisPengaturan(entri: Record<string, unknown>): Promise<void> {
  if (!sql) return;
  for (const [k, v] of Object.entries({ pengaturan: entri })) {
    await sql`
      INSERT INTO app_settings (key, value) VALUES (${k}, ${JSON.stringify(v)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
  }
}

export function resJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export function resErr(pesan: string, status = 500): Response {
  return resJson({ error: pesan }, status);
}