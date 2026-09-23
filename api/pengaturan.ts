import { bacaPengaturan, resErr, resJson, siapPakai, tulisPengaturan } from "./_lib/db.js";
import { resTolak, tokenSah } from "./_lib/auth.js";

export const config = { runtime: "nodejs" };

interface PengaturanPayload {
  namaOrganisasi?: string;
  saldoAwal?: number;
  tahunMulai?: number;
  catatanBulanan?: boolean;
  kataSandi?: string;
}

export async function PUT(req: Request): Promise<Response> {
  if (!tokenSah(req)) return resTolak();
  if (!siapPakai()) return resErr("Database belum dihubungkan", 503);
  const p = (await req.json().catch(() => ({}))) as PengaturanPayload;

  try {
    const lama = ((await bacaPengaturan())?.pengaturan ?? {}) as Record<string, unknown>;
    const hashLama = typeof lama.kataSandi === "string" ? lama.kataSandi : "";
    const kataSandi = typeof p.kataSandi === "string" ? p.kataSandi : hashLama;

    await tulisPengaturan({
      namaOrganisasi: String(p.namaOrganisasi ?? "Rumah Quran UGM"),
      saldoAwal: Number(p.saldoAwal ?? 0),
      tahunMulai: Number(p.tahunMulai ?? new Date().getFullYear()),
      catatanBulanan: Boolean(p.catatanBulanan ?? true),
      kataSandi,
    });
    return resJson({ ok: true });
  } catch (e) {
    console.error("pengaturan PUT:", e);
    return resErr("Terjadi kesalahan server");
  }
}