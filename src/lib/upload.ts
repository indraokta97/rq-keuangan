const MAKS_SISI = 1600;
const MAKS_UKURAN = 10 * 1024 * 1024;

export const BUKTI_MAKS_UKURAN = MAKS_UKURAN;

type SumberGambar = CanvasImageSource & { width: number; height: number };

function muatSebagaiGambar(file: File): Promise<SumberGambar> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img as unknown as SumberGambar);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gambar tidak bisa dibaca."));
    };
    img.src = url;
  });
}

async function muatSumber(file: File): Promise<SumberGambar> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    return bmp as unknown as SumberGambar;
  } catch {
    return muatSebagaiGambar(file);
  }
}

/** Konversi foto jadi WebP (fallback JPEG) berukuran wajar di sisi browser. */
export async function konversiKeWebp(
  file: File
): Promise<{ blob: Blob; dataUrl: string; preview: string }> {
  if (file.size > MAKS_UKURAN) throw new Error("Foto maksimal 10 MB.");
  const sumber = await muatSumber(file);
  const skala = Math.min(1, MAKS_SISI / Math.max(sumber.width, sumber.height));
  const w = Math.max(1, Math.round(sumber.width * skala));
  const h = Math.max(1, Math.round(sumber.height * skala));
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung pengolahan gambar.");
  ctx.drawImage(sumber, 0, 0, w, h);

  let blob: Blob | null = await new Promise((r) => cv.toBlob(r, "image/webp", 0.85));
  if (!blob) {
    blob = await new Promise((r) => cv.toBlob(r, "image/jpeg", 0.88));
    if (blob) {
      return { blob, dataUrl: cv.toDataURL("image/jpeg", 0.88), preview: URL.createObjectURL(blob) };
    }
  }
  if (!blob) throw new Error("Gambar tidak bisa dikonversi.");
  return { blob, dataUrl: cv.toDataURL("image/webp", 0.85), preview: URL.createObjectURL(blob) };
}

/** Unggah blob foto ke /api/upload, kembalikan URL publik (Vercel Blob). */
export async function unggahBukti(blob: Blob): Promise<string> {
  const fd = new FormData();
  fd.append("file", blob, "bukti.webp");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    let pesan = `Unggah gagal (${res.status}).`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) pesan = String(j.error);
    } catch {
      // biarkan pesan bawaan
    }
    throw new Error(pesan);
  }
  const j = (await res.json()) as { url?: string };
  if (!j?.url) throw new Error("Respon unggah tidak valid.");
  return j.url;
}