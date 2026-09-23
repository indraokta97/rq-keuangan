const CURRENCY = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRp(n: number): string {
  const am = Math.abs(Math.round(n));
  return CURRENCY.format(am);
}

export function formatRpTertanda(n: number): string {
  const am = formatRp(n);
  return n < 0 ? `-${am}` : am;
}

export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  }
  if (abs >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  }
  if (abs >= 1_000) {
    return `${(n / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} rb`;
  }
  return `${n}`;
}

export function hariIniISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function bulanSekarang(): string {
  return hariIniISO().slice(0, 7);
}

export function bulanTahunSekarang(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}`;
}

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const NAMA_BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function namaBulan(monthIndex0: number): string {
  return NAMA_BULAN[monthIndex0] ?? "";
}

export function namaBulanPendek(monthIndex0: number): string {
  return NAMA_BULAN_PENDEK[monthIndex0] ?? "";
}

export function labelBulan(bulanKey: string): string {
  const [y, m] = bulanKey.split("-").map(Number);
  return `${NAMA_BULAN[m - 1]} ${y}`;
}

export function formatTanggal(tanggalISO: string): string {
  const [y, m, d] = tanggalISO.split("-").map(Number);
  const tgl = new Date(y, m - 1, d);
  const tglNum = tgl.getDate();
  const bulanNama = NAMA_BULAN[m - 1];
  const tahun = y;
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][tgl.getDay()];
  return `${hari}, ${tglNum} ${bulanNama} ${tahun}`;
}

export function formatTanggalPendek(tanggalISO: string): string {
  const [y, m, d] = tanggalISO.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${NAMA_BULAN_PENDEK[m - 1]} ${y}`;
}

export function hariIniPanjang(): string {
  return formatTanggal(hariIniISO());
}

export function parseJumlahStr(s: string): number {
  const digits = s.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function formatJumlahInput(n: number): string {
  if (!n) return "";
  return n.toLocaleString("id-ID");
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buatKunci(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function bulanSebelumnya(kunci: string, nBulan = 1): string {
  const [y, m] = kunci.split("-").map(Number);
  const d = new Date(y, m - 1 - nBulan, 1);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${mm}`;
}

const TEKS_ENC = new TextEncoder();

const ITERASI_PBKDF2 = 120_000;

function keHex(byt: Uint8Array): string {
  return Array.from(byt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function dariHex(hex: string): Uint8Array<ArrayBuffer> {
  const pasang = (hex.match(/../g) ?? []).map((h) => parseInt(h, 16));
  const out = new Uint8Array(pasang.length);
  out.set(pasang);
  return out;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", TEKS_ENC.encode(s));
  return keHex(new Uint8Array(buf as ArrayBuffer));
}

/** Hash kata sandi (PBKDF2-SHA256 + salt). Format: `pbkdf2$iterasi$salt$hash`. */
export async function hashSandi(s: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const kunci = await crypto.subtle.importKey("raw", TEKS_ENC.encode(s), "PBKDF2", false, ["deriveBits"]);
    const bit = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: ITERASI_PBKDF2, hash: "SHA-256" }, kunci, 256);
    return `pbkdf2$${ITERASI_PBKDF2}$${keHex(salt)}$${keHex(new Uint8Array(bit as ArrayBuffer))}`;
  }
  // fallback hanya untuk konteks non-secure tanpa Web Crypto
  let h = 0x811c9dc5;
  for (const b of TEKS_ENC.encode(s)) {
    h ^= b;
    h = Math.imul(h, 0x01000193);
  }
  return `f-${(h >>> 0).toString(16)}-${s.length}`;
}

function bandingHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let beda = 0;
  for (let i = 0; i < a.length; i++) if (a.charCodeAt(i) !== b.charCodeAt(i)) beda++;
  return beda === 0;
}

/** Cocokkan kata sandi dengan hash tersimpan (mendukung PBKDF2 baru, SHA-256 lama, dan fallback). */
export async function cocokKataSandi(s: string, hash: string): Promise<boolean> {
  if (!hash || typeof s !== "string") return false;
  if (typeof crypto === "undefined" || !crypto.subtle) return false;

  if (hash.startsWith("pbkdf2$")) {
    const [aw, itStr, saltHex, hashHex] = hash.split("$");
    if (aw !== "pbkdf2" || !saltHex || !hashHex) return false;
    const iterasi = Number(itStr);
    if (!Number.isInteger(iterasi) || iterasi < 1000 || iterasi > 10_000_000) return false;
    if (!/^[0-9a-f]{32}$/i.test(saltHex) || !/^[0-9a-f]{64}$/i.test(hashHex)) return false;
    const kunci = await crypto.subtle.importKey("raw", TEKS_ENC.encode(s), "PBKDF2", false, ["deriveBits"]);
    const bit = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: dariHex(saltHex), iterations: iterasi, hash: "SHA-256" },
      kunci,
      256
    );
    return bandingHex(keHex(new Uint8Array(bit as ArrayBuffer)), hashHex);
  }
  if (/^[0-9a-f]{64}$/i.test(hash)) {
    return bandingHex(await sha256Hex(s), hash.toLowerCase());
  }
  if (hash.startsWith("f-")) {
    let hh = 0x811c9dc5;
    for (const b of TEKS_ENC.encode(s)) {
      hh ^= b;
      hh = Math.imul(hh, 0x01000193);
    }
    return hash === `f-${(hh >>> 0).toString(16)}-${s.length}`;
  }
  return false;
}

export const KUNCI_SESI = "rqk::sesi";