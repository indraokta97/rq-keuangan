import type { AppData, Kategori, Pengaturan, Transaksi, TipeTransaksi } from "./types";
import { KATEGORI_DEFAULT } from "./presets";
import { cocokKataSandi, uid } from "./format";

export type ModePenyimpanan = "lokal" | "postgres";

const KUNCI_LOKAL = "rqk::data";
const KUNCI_MODE = "rqk::mode";
export const KUNCI_TOKEN = "rqk::token";

export function ambilToken(): string | null {
  try {
    return localStorage.getItem(KUNCI_TOKEN);
  } catch {
    return null;
  }
}

function simpanToken(t: string): void {
  localStorage.setItem(KUNCI_TOKEN, t);
}

export function hapusToken(): void {
  try {
    localStorage.removeItem(KUNCI_TOKEN);
  } catch {
    // abaikan
  }
}

const PENGATURAN_DEFAULT: Pengaturan = {
  namaOrganisasi: "Rumah Quran UGM",
  saldoAwal: 0,
  tahunMulai: new Date().getFullYear(),
  catatanBulanan: true,
  kataSandi: "",
};

function dataKosong(): AppData {
  return {
    kategori: KATEGORI_DEFAULT.map((k) => ({ ...k })),
    transaksi: [],
    pengaturan: { ...PENGATURAN_DEFAULT },
  };
}

async function apiFetch(path: string, init?: RequestInit): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(path, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`API ${res.status}`);
    if (res.status === 204) return null;
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export interface FinanceAPI {
  mode: ModePenyimpanan;
  getAll(): Promise<AppData>;
  login(sandi: string): Promise<boolean>;
  createTransaksi(t: Transaksi): Promise<void>;
  updateTransaksi(input: Partial<Transaksi> & { id: string }): Promise<void>;
  deleteTransaksi(id: string): Promise<void>;
  createKategori(k: Kategori): Promise<void>;
  updateKategori(input: Partial<Kategori> & { id: string }): Promise<void>;
  deleteKategori(id: string): Promise<void>;
  savePengaturan(p: Pengaturan): Promise<void>;
  replaceAll(data: AppData): Promise<void>;
}

// ---------- Backend lokal (localStorage) ----------

export const ambilDataLokal = (): AppData => {
  const raw = localStorage.getItem(KUNCI_LOKAL);
  if (!raw) return dataKosong();
  try {
    const d = JSON.parse(raw) as AppData;
    if (!d.kategori || !d.transaksi || !d.pengaturan) return dataKosong();
    return d;
  } catch {
    return dataKosong();
  }
};

const simpanDataLokal = (d: AppData): void => {
  localStorage.setItem(KUNCI_LOKAL, JSON.stringify(d));
};

const langkahLokal = (fn: (d: AppData) => void): AppData => {
  const d = ambilDataLokal();
  fn(d);
  simpanDataLokal(d);
  return d;
};

// ---------- Backend Postgres (serverless functions Vercel) ----------

const ptnx = (r: unknown): Partial<Transaksi> & { id: string } => {
  return r as Partial<Transaksi> & { id: string };
};

const pcat = (r: unknown): Kategori => r as Kategori;

async function postgresMode(): Promise<FinanceAPI> {
  const pgsql = async (
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: unknown,
    params?: string
  ): Promise<unknown> => {
    const init: RequestInit = { method };
    const hdrs: Record<string, string> = {};
    const token = ambilToken();
    if (token) hdrs["Authorization"] = `Bearer ${token}`;
    if (body !== undefined) {
      hdrs["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    if (Object.keys(hdrs).length > 0) init.headers = hdrs;
    const res = await apiFetch(`/api/${path}${params ? `?${params}` : ""}`, init);
    return res;
  };

  return {
    mode: "postgres",
    async login(sandi) {
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sandi }),
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return false;
        const j = (await res.json()) as { ok?: boolean; token?: string };
        if (j.ok && j.token) {
          simpanToken(j.token);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    async getAll() {
      const res = await apiFetch("/api/data");
      return res as AppData;
    },
    async createTransaksi(t) {
      await pgsql("transaksi", "POST", t);
    },
    async updateTransaksi(input) {
      const t = ptnx(input);
      await pgsql("transaksi", "PUT", t, `id=${encodeURIComponent(t.id)}`);
    },
    async deleteTransaksi(id) {
      await pgsql("transaksi", "DELETE", undefined, `id=${encodeURIComponent(id)}`);
    },
    async createKategori(k) {
      await pgsql("kategori", "POST", pcat(k));
    },
    async updateKategori(input) {
      const k = pcat(input);
      await pgsql("kategori", "PUT", k, `id=${encodeURIComponent(k.id)}`);
    },
    async deleteKategori(id) {
      await pgsql("kategori", "DELETE", undefined, `id=${encodeURIComponent(id)}`);
    },
    async savePengaturan(p) {
      await pgsql("pengaturan", "PUT", p);
    },
    async replaceAll(data) {
      await pgsql("backup", "POST", data);
    },
  };
}

// ---------- Deteksi mode + factory ----------

async function cekBackend(): Promise<ModePenyimpanan> {
  const cached = localStorage.getItem(KUNCI_MODE);
  if (cached === "postgres") return "postgres";
  try {
    const res = await fetch("/api/health", { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const j = (await res.json()) as { backend?: string };
      if (j.backend === "postgres") {
        localStorage.setItem(KUNCI_MODE, "postgres");
        return "postgres";
      }
    }
  } catch {
    // api tidak tersedia (mis. saat vite dev) -> pakai lokal
  }
  localStorage.removeItem(KUNCI_MODE);
  return "lokal";
}

export async function buatAPI(): Promise<FinanceAPI> {
  const mode = await cekBackend();
  if (mode === "postgres") return postgresMode();

  return {
    mode,
    async login(sandi) {
      return cocokKataSandi(sandi, ambilDataLokal().pengaturan.kataSandi || "");
    },
    async getAll() {
      return ambilDataLokal();
    },
    async createTransaksi(t) {
      langkahLokal((d) => {
        d.transaksi.push(t);
      });
    },
    async updateTransaksi(input) {
      langkahLokal((d) => {
        const i = d.transaksi.findIndex((x) => x.id === input.id);
        if (i >= 0) d.transaksi[i] = { ...d.transaksi[i], ...input };
      });
    },
    async deleteTransaksi(id) {
      langkahLokal((d) => {
        d.transaksi = d.transaksi.filter((x) => x.id !== id);
      });
    },
    async createKategori(k) {
      langkahLokal((d) => {
        d.kategori.push(k);
      });
    },
    async updateKategori(input) {
      langkahLokal((d) => {
        const i = d.kategori.findIndex((x) => x.id === input.id);
        if (i >= 0) d.kategori[i] = { ...d.kategori[i], ...input };
      });
    },
    async deleteKategori(id) {
      langkahLokal((d) => {
        d.kategori = d.kategori.filter((x) => x.id !== id);
      });
    },
    async savePengaturan(p) {
      langkahLokal((d) => {
        d.pengaturan = p;
      });
    },
    async replaceAll(data) {
      simpanDataLokal({
        ...data,
        pengaturan: { ...PENGATURAN_DEFAULT, ...data.pengaturan },
      });
    },
  };
}

export function buatTransaksiBaru(partial: {
  tipe: TipeTransaksi;
  kategoriId: string | null;
  jumlah: number;
  tanggal: string;
  keterangan: string;
  bukti?: string;
}): Transaksi {
  const sekarang = new Date().toISOString();
  return {
    id: uid(),
    tipe: partial.tipe,
    kategoriId: partial.kategoriId,
    jumlah: partial.jumlah,
    tanggal: partial.tanggal,
    keterangan: partial.keterangan,
    bukti: partial.bukti || undefined,
    createdAt: sekarang,
    updatedAt: sekarang,
  };
}

export function buatKategoriBaru(partial: { nama: string; tipe: TipeTransaksi; warna: string; ikon: string }): Kategori {
  return {
    id: uid(),
    urutan: Date.now(),
    nama: partial.nama.trim(),
    tipe: partial.tipe,
    warna: partial.warna,
    ikon: partial.ikon,
  };
}