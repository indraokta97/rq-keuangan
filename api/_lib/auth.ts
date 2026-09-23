import { createHash, pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { resJson } from "./db.js";

/** Validasi header `Authorization: Bearer <RQ_ADMIN_TOKEN>`. Fail-closed bila env tidak diset. */
export function tokenSah(req: Request): boolean {
  const token = process.env.RQ_ADMIN_TOKEN;
  if (!token) return false;
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return false;
  const diberikan = header.slice("Bearer ".length).trim();
  if (diberikan.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(diberikan), Buffer.from(token));
  } catch {
    return false;
  }
}

export function resTolak(pesan = "Tidak diizinkan. Masuk sebagai pengelola terlebih dahulu."): Response {
  return resJson({ error: pesan }, 401);
}

/**
 * Verifikasi kata sandi terhadap hash tersimpan.
 * Mendukung format `pbkdf2$iterasi$salt$hash` (baru) dan hex SHA-256 64 karakter (lama).
 */
export function cocokHashSandi(sandi: string, hash: string): boolean {
  if (!hash || typeof sandi !== "string") return false;

  if (hash.startsWith("pbkdf2$")) {
    const [aw, itStr, saltHex, hashHex] = hash.split("$");
    if (aw !== "pbkdf2" || !saltHex || !hashHex) return false;
    const iterasi = Number(itStr);
    if (!Number.isInteger(iterasi) || iterasi < 1000 || iterasi > 10_000_000) return false;
    if (!/^[0-9a-f]{32}$/i.test(saltHex) || !/^[0-9a-f]{64}$/i.test(hashHex)) return false;
    const salt = Buffer.from(saltHex, "hex");
    const uji = pbkdf2Sync(sandi, salt, iterasi, 32, "sha256");
    const simpan = Buffer.from(hashHex, "hex");
    return timingSafeEqual(uji, simpan);
  }

  if (/^[0-9a-f]{64}$/i.test(hash)) {
    const uji = createHash("sha256").update(sandi, "utf8").digest("hex");
    return timingSafeEqual(Buffer.from(uji, "utf8"), Buffer.from(hash.toLowerCase(), "utf8"));
  }

  return false;
}
