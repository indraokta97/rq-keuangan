import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { IKON_UI } from "./icons";
import { Modal } from "./ui";
import { useFinance } from "../lib/store";
import { LABEL_RUTE, navigasi, useRoute, SET_RUTE, type Route } from "../lib/router";
import { hariIniPanjang } from "../lib/format";

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/logo-rq.png"
        alt="Logo Rumah Quran"
        className="h-10 w-10 shrink-0 rounded-xl object-contain p-1 shadow-sm"
      />
      <div className="leading-tight">
        <p className="text-sm font-extrabold tracking-tight text-ink">Kas Rumah Quran</p>
      </div>
    </div>
  );
}

const IKON_NAV: Record<Route, LucideIcon> = {
  dashboard: IKON_UI.dashboard,
  transaksi: IKON_UI.net,
  kategori: IKON_UI.tag,
  laporan: IKON_UI.fileDown,
  pengaturan: IKON_UI.settings,
};

function NavList({ tampilkanLabel }: { tampilkanLabel: boolean }) {
  const rute = useRoute();
  const { readOnly } = useFinance();
  const daftar = (readOnly ? ["dashboard", "transaksi"] : Object.keys(LABEL_RUTE)) as Route[];
  return (
    <nav aria-label="Navigasi utama" className="flex flex-1 flex-col gap-1">
      {daftar.map((r) => {
        const Ico = IKON_NAV[r];
        const aktif = rute === r;
        return (
          <button
            key={r}
            type="button"
            onClick={() => navigasi(r)}
            aria-current={aktif ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition
              ${aktif ? "text-white" : "text-mute hover:bg-paper hover:text-ink"}`}
            style={aktif ? { background: "linear-gradient(135deg,#09805a,#12a98b)" } : undefined}
          >
            <Ico className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {tampilkanLabel ? <span>{LABEL_RUTE[r]}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { error, tolakError, readOnly, terkunci, terbukaKunci, hashLihat, bukaKunci } = useFinance();

  useEffect(() => {
    const cegahKlikKanan = (e: MouseEvent) => e.preventDefault();
    window.addEventListener("contextmenu", cegahKlikKanan);
    return () => window.removeEventListener("contextmenu", cegahKlikKanan);
  }, []);

  const rute = useRoute();
  const judulHalaman = useMemo(() => SET_RUTE.find((s) => s.rute === rute), [rute]);
  const daftarNav = (readOnly ? ["dashboard", "transaksi"] : Object.keys(LABEL_RUTE)) as Route[];
  const [modalLogin, setModalLogin] = useState(false);
  const [sandi, setSandi] = useState("");
  const [lihatSandi, setLihatSandi] = useState(false);
  const [salah, setSalah] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const perluLogin = !hashLihat && terkunci && !terbukaKunci;

  const cobaBuka = async (e: FormEvent) => {
    e.preventDefault();
    if (sibuk || !sandi) return;
    setSibuk(true);
    const ok = await bukaKunci(sandi);
    setSibuk(false);
    if (ok) {
      setModalLogin(false);
      setSandi("");
      setSalah(false);
      setLihatSandi(false);
    } else {
      setSalah(true);
    }
  };

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-r border-line bg-card p-4 lg:flex">
        <Logo />
        <NavList tampilkanLabel />
      </aside>

      {/* Main */}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
            <img src="/logo-rq.png" alt="Logo Rumah Quran" className="h-8 w-8 shrink-0 rounded-lg object-contain p-0.5 lg:hidden" />
            <div className="min-w-0">
              {judulHalaman?.sub ? <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-brand">{judulHalaman.sub}</p> : null}
              <h1 className="truncate text-lg font-extrabold tracking-tight text-ink sm:text-xl">{judulHalaman?.judul}</h1>
            </div>
          </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden text-sm font-medium text-mute md:block">{hariIniPanjang()}</span>
              {perluLogin ? (
                <button
                  type="button"
                  onClick={() => setModalLogin(true)}
                  className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-bold text-mute transition hover:border-brand/40 hover:text-brand"
                >
                  <IKON_UI.lihat className="h-3.5 w-3.5" aria-hidden="true" />
                  Pengunjung
                </button>
              ) : terkunci && terbukaKunci && !hashLihat ? (
                <span className="flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-deep">
                  <IKON_UI.shield className="h-3.5 w-3.5" aria-hidden="true" />
                  Pengelola
                </span>
              ) : null}
            </div>
          </div>
        </header>

        {error ? (
          <div role="alert" className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-xl border border-expense/30 bg-expense/10 px-4 py-3 text-sm text-expense sm:mx-6 lg:mx-8">
            <span className="flex items-center gap-2">
              <IKON_UI.alert className="h-4 w-4 shrink-0" aria-hidden="true" />
              {error}. Coba muat ulang halaman, atau periksa koneksi database.
            </span>
            <button type="button" onClick={tolakError} aria-label="Tutup peringatan" className="rounded p-1 hover:bg-expense/10">
              <IKON_UI.tutup className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {perluLogin ? (
          <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand/30 bg-brand-soft px-4 py-2.5 text-sm font-semibold text-brand-deep sm:mx-6 lg:mx-8">
            <span className="flex items-center gap-2">
              <IKON_UI.lihat className="h-4 w-4 shrink-0" aria-hidden="true" />
              Hanya bisa lihat. Masuk untuk mengelola.
            </span>
            <button
              type="button"
              className="btn-primary px-3 py-1.5 text-xs"
              onClick={() => setModalLogin(true)}
            >
              Masuk
            </button>
          </div>
        ) : readOnly ? (
          <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/40 bg-amber-100/70 px-4 py-2.5 text-sm font-semibold text-gold sm:mx-6 lg:mx-8">
            <span className="flex items-center gap-2">
              <IKON_UI.lihat className="h-4 w-4 shrink-0" aria-hidden="true" />
              Mode lihat — hanya bisa melihat data.
            </span>
            <button
              type="button"
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-gold transition hover:bg-amber-200/60"
              onClick={() => {
                window.location.hash = "/dashboard";
              }}
            >
              Keluar mode lihat
            </button>
          </div>
        ) : null}

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      {/* Nav bawah (mobile) */}
      <nav
        aria-label="Navigasi bawah"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[max(env(safe-area-inset-bottom),8px)] pt-1 backdrop-blur lg:hidden"
      >
        <div className={`mx-auto grid max-w-md ${readOnly ? "grid-cols-2" : "grid-cols-5"}`}>
          {daftarNav.map((r) => {
            const Ico = IKON_NAV[r];
            const aktif = rute === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => navigasi(r)}
                aria-current={aktif ? "page" : undefined}
                className={`flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold transition ${
                  aktif ? "text-brand" : "text-mute"
                }`}
              >
                <Ico className="h-5 w-5" aria-hidden="true" />
                {LABEL_RUTE[r]}
              </button>
            );
          })}
        </div>
      </nav>
      <div className="h-16 lg:hidden" aria-hidden="true" />

      {/* Modal masuk pengelola */}
      <Modal
        open={modalLogin}
        onTutup={() => {
          setModalLogin(false);
          setSalah(false);
          setSandi("");
        }}
        judul="Masuk sebagai pengelola"
        subjudul="Masukkan kata sandi untuk mengelola data kas."
        lebar="max-w-sm"
        pusat
      >
        <form onSubmit={cobaBuka} className="space-y-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Kata sandi
            <div className="relative">
              <input
                type={lihatSandi ? "text" : "password"}
                className="input pr-11"
                value={sandi}
                autoFocus
                maxLength={100}
                placeholder="••••••••"
                aria-invalid={salah}
                autoComplete="current-password"
                onChange={(e) => {
                  setSandi(e.target.value);
                  setSalah(false);
                }}
              />
              <button
                type="button"
                onClick={() => setLihatSandi((v) => !v)}
                aria-label={lihatSandi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-mute transition hover:text-ink"
              >
                <IKON_UI.lihat className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {salah ? <span className="text-xs font-medium text-expense">Kata sandi salah, coba lagi.</span> : null}
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={() => setModalLogin(false)}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={!sandi || sibuk}>
              {sibuk ? <IKON_UI.muat className="h-4 w-4 animate-spin" /> : <IKON_UI.shield className="h-4 w-4" />}
              Masuk
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
