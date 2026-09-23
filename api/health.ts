import { resJson, siapPakai } from "./_lib/db.js";

export const config = { runtime: "nodejs" };

export function GET(): Response {
  return resJson({ ok: true, backend: siapPakai() ? "postgres" : "local", waktu: new Date().toISOString() });
}