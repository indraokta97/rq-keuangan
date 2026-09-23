import { useEffect, useId } from "react";
import type { ReactNode } from "react";
import { IKON_UI, IkonKategori } from "./icons";
import type { Kategori } from "../lib/types";

export function Modal({
  open,
  onTutup,
  judul,
  subjudul,
  children,
  lebar = "max-w-lg",
  pusat = false,
}: {
  open: boolean;
  onTutup: () => void;
  judul: string;
  subjudul?: string;
  children: ReactNode;
  lebar?: string;
  pusat?: boolean;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTutup();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onTutup]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex bg-ink/40 backdrop-blur-sm ${
        pusat ? "items-center justify-center p-4" : "items-end justify-center sm:items-center sm:p-4"
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onTutup();
      }}
    >
<div
      className={`w-full ${lebar} max-h-[88vh] overflow-y-auto overscroll-contain border border-line bg-card shadow-pop ${
        pusat ? "rounded-2xl p-4 sm:p-6" : "rounded-t-[1.75rem] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-2xl sm:p-6"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
          <div
            className={`sticky top-0 z-10 flex items-start justify-between gap-3 bg-card ${
              pusat
                ? "mb-4 rounded-t-2xl pb-3 sm:mb-5"
                : "-mx-4 mb-4 rounded-t-[1.75rem] px-4 pb-3 pt-4 sm:mx-0 sm:rounded-t-2xl sm:px-0 sm:pt-0"
            } border-b border-line`}
          >
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-bold tracking-tight text-ink">
                {judul}
              </h2>
              {subjudul ? <p className="mt-0.5 truncate text-sm text-mute">{subjudul}</p> : null}
            </div>
            <button
              type="button"
              onClick={onTutup}
              aria-label="Tutup"
              className="shrink-0 rounded-lg p-2 text-mute transition hover:bg-paper hover:text-ink"
            >
              <IKON_UI.tutup className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
    </div>
  );
}

export function Konfirmasi({
  open,
  judul,
  pesan,
  tombol,
  padaSetuju,
  padaBatal,
  memuat = false,
}: {
  open: boolean;
  judul: string;
  pesan: string;
  tombol: string;
  padaSetuju: () => void;
  padaBatal: () => void;
  memuat?: boolean;
}) {
  return (
    <Modal open={open} onTutup={padaBatal} judul={judul} lebar="max-w-sm" pusat>
      <p className="text-sm leading-relaxed text-mute">{pesan}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-ghost w-full whitespace-nowrap sm:w-auto" onClick={padaBatal}>
          Batal
        </button>
        <button
          type="button"
          className="btn-danger w-full whitespace-nowrap sm:w-auto"
          onClick={padaSetuju}
          disabled={memuat}
        >
          {memuat ? <IKON_UI.muat className="h-4 w-4 animate-spin" /> : null}
          {tombol}
        </button>
      </div>
    </Modal>
  );
}

export function AvatarKategori({ kategori, ukuran = "md" }: { kategori: Kategori; ukuran?: "sm" | "md" | "lg" }) {
  const kl = ukuran === "sm" ? "h-7 w-7 rounded-lg" : ukuran === "lg" ? "h-12 w-12 rounded-xl" : "h-9 w-9 rounded-lg";
  const ikonK = ukuran === "sm" ? "h-3.5 w-3.5" : ukuran === "lg" ? "h-5 w-5" : "h-4 w-4";
  return (
    <span
      className={`${kl} inline-flex shrink-0 items-center justify-center`}
      style={{ background: `${kategori.warna}1f`, color: kategori.warna }}
    >
      <IkonKategori nama={kategori.ikon} className={ikonK} />
    </span>
  );
}

export function StatCard({
  label,
  nilai,
  sub,
  utama = false,
}: {
  label: string;
  nilai: string;
  sub?: ReactNode;
  utama?: boolean;
}) {
  if (utama) {
    return (
      <div className="card relative overflow-hidden border-0">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#09805a 0%,#0e9f6e 55%,#12a98b 100%)" }} />
        <div className="relative p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/75">{label}</p>
          <p className="num mt-3 truncate text-xl font-bold leading-tight sm:text-2xl">{nilai}</p>
          {sub ? <p className="mt-1.5 text-xs text-white/75">{sub}</p> : null}
        </div>
      </div>
    );
  }
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-mute">{label}</p>
      <p className="num mt-3 truncate text-xl font-bold leading-tight text-ink sm:text-2xl">{nilai}</p>
      {sub ? <div className="mt-1.5 text-xs text-mute">{sub}</div> : null}
    </div>
  );
}

export function Kosong({ ikon, judul, pesan, aksi }: { ikon?: React.ReactNode; judul: string; pesan: string; aksi?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      {ikon ? <div className="mb-4">{ikon}</div> : null}
      <h3 className="text-base font-bold text-ink">{judul}</h3>
      <p className="mt-1 max-w-sm text-sm text-mute">{pesan}</p>
      {aksi ? <div className="mt-5">{aksi}</div> : null}
    </div>
  );
}

export function ChipJumlah({ tipe, jumlah }: { tipe: "pemasukan" | "pengeluaran"; jumlah: number }) {
  const masuk = tipe === "pemasukan";
  return (
    <span className={`num font-semibold ${masuk ? "text-brand" : "text-expense"}`}>
      {masuk ? "+" : "−"}&nbsp;Rp{jumlah.toLocaleString("id-ID")}
    </span>
  );
}