import { put } from "@vercel/blob";
import { resTolak, tokenSah } from "./_lib/auth.js";

export const config = { runtime: "nodejs" };

function resJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

const MAKS = 6 * 1024 * 1024;

export async function POST(req: Request): Promise<Response> {
  if (!tokenSah(req)) return resTolak();
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return resJson({ error: "Upload foto belum diaktifkan. Hubungkan Vercel Blob ke proyek ini." }, 501);
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    file = (form.get("file") as File | null) ?? null;
  } catch {
    return resJson({ error: "Isi formulir unggah tidak valid." }, 400);
  }
  if (!file) return resJson({ error: "File foto tidak ditemukan." }, 400);
  if (file.size === 0) return resJson({ error: "File foto kosong." }, 400);
  if (file.size > MAKS) return resJson({ error: "Foto maksimal 6 MB." }, 400);
  if (!["image/webp", "image/jpeg"].includes(file.type)) {
    return resJson({ error: "Format harus WebP atau JPEG." }, 400);
  }

  try {
    const nama = `bukti/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.webp`;
    const { url } = await put(nama, new Uint8Array(await file.arrayBuffer()), {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: true,
    });
    return resJson({ url });
  } catch (e) {
    console.error("upload POST:", e);
    return resJson({ error: "Gagal mengunggah foto." }, 500);
  }
}