export function GET(): Response {
  return new Response(JSON.stringify({ ok: true, uji: "self-contained" }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}