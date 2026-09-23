export const config = { runtime: "nodejs" };

export async function GET(): Promise<Response> {
  try {
    const db = await import("./_lib/db");
    const backend = db.siapPakai() ? "postgres" : "local";
    return db.resJson({ ok: true, backend, waktu: new Date().toISOString() });
  } catch (e) {
    const pesan = e instanceof Error ? e.stack ?? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, err: pesan }, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}