import { useEffect, useState } from "react";

export type Route = "dashboard" | "transaksi" | "kategori" | "laporan" | "pengaturan";

const DAFTAR: Route[] = ["dashboard", "transaksi", "kategori", "laporan", "pengaturan"];

export function cekHash(): string {
  return window.location.hash.replace(/^#\/?/, "");
}

/** Hash `#/lihat` atau `#/lihat/<rute>` => tampilan hanya-lihat untuk pengunjung. */
export function modeLihat(): boolean {
  const h = cekHash();
  return h === "lihat" || h.startsWith("lihat/");
}

export function valueRute(): Route {
  const h = cekHash().replace(/^lihat\/?/, "");
  return (DAFTAR.find((r) => r === h) ?? "dashboard") as Route;
}

export function useRoute(): Route {
  const [rute, setRute] = useState<Route>(() => valueRute());

  useEffect(() => {
    const onHash = () => setRute(valueRute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return rute;
}

export function navigasi(rute: Route, lihat: boolean = modeLihat()): void {
  window.location.hash = lihat ? `/lihat/${rute}` : `/${rute}`;
}

/** Tautan yang bisa dibagikan ke pengunjung (hanya bisa melihat). */
export function tautanLihat(): string {
  return `${window.location.pathname}#/lihat`;
}

export const LABEL_RUTE: Record<Route, string> = {
  dashboard: "Ringkasan",
  transaksi: "Transaksi",
  kategori: "Kategori",
  laporan: "Laporan",
  pengaturan: "Pengaturan",
};

export const SET_RUTE: { rute: Route; judul: string; sub: string }[] = [
  { rute: "dashboard", judul: "Ringkasan Kas", sub: "" },
  { rute: "transaksi", judul: "Catatan Transaksi", sub: "" },
  { rute: "kategori", judul: "Kategori Kas", sub: "" },
  { rute: "laporan", judul: "Laporan & Unduhan", sub: "" },
  { rute: "pengaturan", judul: "Pengaturan", sub: "" },
];