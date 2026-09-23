import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppData, Kategori, Pengaturan, Transaksi, TipeTransaksi } from "./types";
import {
  ambilToken,
  buatAPI,
  buatKategoriBaru,
  buatTransaksiBaru,
  hapusToken,
  type FinanceAPI,
  type ModePenyimpanan,
} from "./backend";
import { hasilkanDataContoh } from "./sample";
import { KATEGORI_DEFAULT } from "./presets";
import { modeLihat } from "./router";
import { KUNCI_SESI } from "./format";

interface FinanceContextValue {
  mode: ModePenyimpanan;
  ready: boolean;
  readOnly: boolean;
  terkunci: boolean;
  terbukaKunci: boolean;
  hashLihat: boolean;
  bukaKunci(sandi: string): Promise<boolean>;
  kunciSesi(): void;
  error: string | null;
  tolakError(): void;
  menyimpan: boolean;
  data: AppData;
  transaksiTerurut: Transaksi[];
  kategoriMap: Map<string, Kategori>;
  tambahTransaksi(a: {
    tipe: TipeTransaksi;
    kategoriId: string | null;
    jumlah: number;
    tanggal: string;
    keterangan: string;
    bukti?: string;
  }): Promise<void>;
  ubahTransaksi(id: string, patch: Partial<Transaksi>): Promise<void>;
  hapusTransaksi(id: string): Promise<void>;
  tambahKategori(a: { nama: string; tipe: TipeTransaksi; warna: string; ikon: string }): Promise<void>;
  ubahKategori(id: string, patch: Partial<Kategori>): Promise<void>;
  hapusKategori(id: string): Promise<void>;
  simpanPengaturan(p: Pengaturan): Promise<void>;
  restore(data: AppData): Promise<void>;
  muatContoh(): Promise<void>;
  hapusSemua(): Promise<void>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<FinanceAPI | null>(null);
  const [mode, setMode] = useState<ModePenyimpanan>("lokal");
  const [hashLihat, setHashLihat] = useState<boolean>(() => modeLihat());
  const [sesi, setSesi] = useState<boolean>(() => localStorage.getItem(KUNCI_SESI) === "1");
  const [punyaToken, setPunyaToken] = useState<boolean>(() => ambilToken() !== null);
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    const onHash = () => setHashLihat(modeLihat());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const terkunci = mode === "postgres" ? true : data ? (data.pengaturan.kataSandi || "").length > 0 : false;
  const terbukaKunci = mode === "postgres" ? punyaToken : !terkunci || sesi;
  const readOnly = hashLihat || (terkunci && !terbukaKunci);

  const refresh = useCallback(async (a: FinanceAPI) => {
    const d = await a.getAll();
    setData(d);
  }, []);

  useEffect(() => {
    let aktif = true;
    (async () => {
      try {
        const a = await buatAPI();
        if (!aktif) return;
        setApi(a);
        setMode(a.mode);
        const d = await a.getAll();
        if (aktif) setData(d);
      } catch (e) {
        if (aktif) setError(e instanceof Error ? e.message : "Gagal memuat data");
      }
    })();
    return () => {
      aktif = false;
    };
  }, []);

  const jalan = useCallback(
    async (fn: (a: FinanceAPI) => Promise<void>) => {
      if (!api || readOnly) return;
      setMenyimpan(true);
      try {
        await fn(api);
        await refresh(api);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Terjadi kesalahan");
        throw e;
      } finally {
        setMenyimpan(false);
      }
    },
    [api, refresh, readOnly]
  );

  const value = useMemo<FinanceContextValue | null>(() => {
    if (!data || !api) return null;
    const transaksiTerurut = [...data.transaksi].sort((a, b) => {
      if (a.tanggal !== b.tanggal) return a.tanggal < b.tanggal ? 1 : -1;
      return a.createdAt < b.createdAt ? 1 : -1;
    });
    const kategoriMap = new Map(data.kategori.map((k) => [k.id, k]));

    return {
      mode,
      ready: !!data,
      readOnly,
      terkunci,
      terbukaKunci,
      hashLihat,
      bukaKunci: async (sandi) => {
        if (!api) return false;
        const ok = await api.login(sandi);
        if (ok) {
          if (mode === "postgres") setPunyaToken(true);
          else {
            localStorage.setItem(KUNCI_SESI, "1");
            setSesi(true);
          }
        }
        return ok;
      },
      kunciSesi: () => {
        localStorage.removeItem(KUNCI_SESI);
        hapusToken();
        setSesi(false);
        setPunyaToken(false);
      },
      error,
      tolakError: () => setError(null),
      menyimpan,
      data,
      transaksiTerurut,
      kategoriMap,
      tambahTransaksi: (a) => jalan((x) => x.createTransaksi(buatTransaksiBaru(a))),
      ubahTransaksi: (id, patch) => jalan((x) => x.updateTransaksi({ id, ...patch })),
      hapusTransaksi: (id) => jalan((x) => x.deleteTransaksi(id)),
      tambahKategori: (a) => jalan((x) => x.createKategori(buatKategoriBaru(a))),
      ubahKategori: (id, patch) => jalan((x) => x.updateKategori({ id, ...patch })),
      hapusKategori: (id) => jalan((x) => x.deleteKategori(id)),
      simpanPengaturan: (p) => jalan((x) => x.savePengaturan(p)),
      restore: (d) => jalan((x) => x.replaceAll(d)),
      muatContoh: () => jalan((x) => x.replaceAll(hasilkanDataContoh())),
      hapusSemua: () =>
        jalan((x) =>
          x.replaceAll({
            kategori: KATEGORI_DEFAULT.map((k) => ({ ...k })),
            transaksi: [],
            pengaturan: {
              namaOrganisasi: "Rumah Quran UGM",
              saldoAwal: 0,
              tahunMulai: new Date().getFullYear(),
              catatanBulanan: true,
              kataSandi: "",
            },
          })
        ),
    };
  }, [data, api, mode, error, jalan, menyimpan, readOnly, terkunci, terbukaKunci, hashLihat]);

  if (!value) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <div className="flex flex-col items-center gap-3 text-mute">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />
          <p className="text-sm font-medium">Membuka lemari kas…</p>
        </div>
      </div>
    );
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance harus dipakai di dalam FinanceProvider");
  return ctx;
}