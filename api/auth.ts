import { bacaPengaturan, pastikanTabel, resErr, resJson, siapPakai } from "./_lib/db.js";
import { cocokHashSandi } from "./_lib/auth.js";

export const config = { runtime: "nodejs" };

const MAKS_PERCOBAAN = 5;
const JENDELA_MS = 15 * 60 * 1000;
const percobaan = new Map<string, { n: number; reset: number }>();

function capKunci(req: Request): number | null {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "tak-dikenal";
  const kunci = `${ip}|${(req.headers.get("user-agent") || "").slice(0, 80)}`;
  const now = Date.now();
  const ada = percobaan.get(kunci);
  if (!ada || now > ada.reset) {
    percobaan.set(kunci, { n: 1, reset: now + JENDELA_MS });
    return null;
  }
  ada.n += 1;
  percobaan.set(kunci, ada);
  return ada.n >= MAKS_PERCOBAAN ? Math.ceil((ada.reset - now) / 1000) : null;
}

export async function POST(req: Request): Promise<Response> {
  if (!process.env.RQ_ADMIN_TOKEN) {
    return resErr("Akses pengelola belum dikonfigurasi. Tambahkan variabel RQ_ADMIN_TOKEN lalu redeploy.", 501);
  }
  if (!siapPakai()) return resErr("Database belum dihubungkan", 503);

  const sisa = capKunci(req);
  if (sisa !== null) return resJson({ error: `Terlalu banyak percobaan. Coba lagi dalam ${sisa} detik.` }, 429);

  const p = (await req.json().catch(() => ({}))) as { sandi?: unknown };
  const sandi = typeof p.sandi === "string" ? p.sandi : "";
  if (!sandi || sandi.length < 4 || sandi.length > 200) return resErr("Kata sandi harus 4–200 karakter", 400);

  try {
    await pastikanTabel();
    const baca = (await bacaPengaturan()) as Record<string, unknown>;
    const isi = (baca.pengaturan ?? {}) as Record<string, unknown>;
    const hash = typeof isi.kataSandi === "string" ? isi.kataSandi : "";

    if (!hash) {
      // Bootstrap: belum ada kata sandi tersimpan — izinkan sekali pasang awal.
      return resJson({ ok: true, token: process.env.RQ_ADMIN_TOKEN, bootstrap: true });
    }
    if (cocokHashSandi(sandi, hash)) {
      return resJson({ ok: true, token: process.env.RQ_ADMIN_TOKEN });
    }
    return resJson({ error: "Kata sandi salah" }, 401);
  } catch (e) {
    console.error("gagal login:", e);
    return resErr("Terjadi kesalahan server");
  }
}
