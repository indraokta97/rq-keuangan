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

/** Hash SHA-256 (hex) untuk kata sandi pengelola. */
export async function hashSandi(s: string): Promise<string> {
  const data = TEKS_ENC.encode(s);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // fallback sederhana bila Web Crypto tidak tersedia (konteks non-secure)
  let h = 0x811c9dc5;
  for (const b of data) {
    h ^= b;
    h = Math.imul(h, 0x01000193);
  }
  return `f-${(h >>> 0).toString(16)}-${s.length}`;
}

export const KUNCI_SESI = "rqk::sesi";