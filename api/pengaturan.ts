import { resErr, resJson, siapPakai, tulisPengaturan } from "./_lib/db";

export const config = { runtime: "nodejs" };

interface PengaturanPayload {
  namaOrganisasi?: string;
  saldoAwal?: number;
  tahunMulai?: number;
  catatanBulanan?: boolean;
}

export async function PUT(req: Request): Promise<Response> {
  if (!siapPakai()) return resErr("Database belum dihubungkan", 503);
  const p = (await req.json().catch(() => ({}))) as PengaturanPayload;

  try {
    await tulisPengaturan({
      namaOrganisasi: String(p.namaOrganisasi ?? "Rumah Quran UGM"),
      saldoAwal: Number(p.saldoAwal ?? 0),
      tahunMulai: Number(p.tahunMulai ?? new Date().getFullYear()),
      catatanBulanan: Boolean(p.catatanBulanan ?? true),
    });
    return resJson({ ok: true });
  } catch (e) {
    return resErr(e instanceof Error ? e.message : "Gagal menyimpan pengaturan");
  }
}