import type { Kategori, Transaksi } from "./types";
import { dalamBulan, totalPemasukan, totalPengeluaran } from "./analytics";

export interface BarisKategori {
  kategori: Kategori;
  jumlah: number;
  banyak: number;
  persen: number;
  tipe: "pemasukan" | "pengeluaran";
}

export function jumlahPerKategori(trx: Transaksi[], kategori: Kategori[]): BarisKategori[] {
  const totalMasuk = totalPemasukan(trx) || 1;
  const totalKeluar = totalPengeluaran(trx) || 1;

  return kategori
    .map((k) => {
      const milik = trx.filter((t) => t.kategoriId === k.id);
      const jumlah = milik.reduce((a, t) => a + t.jumlah, 0);
      const penyebut = k.tipe === "pemasukan" ? totalMasuk : totalKeluar;
      return {
        kategori: k,
        jumlah,
        banyak: milik.length,
        persen: Math.round((jumlah / penyebut) * 100),
        tipe: k.tipe,
      };
    })
    .filter((r) => r.jumlah > 0)
    .sort((a, b) => b.jumlah - a.jumlah);
}

export interface RekapTahun {
  bulanKey: string;
  paduan: number; // 1-12
  pemasukan: number;
  pengeluaran: number;
  selisih: number;
}

export function renderBulanan(trx: Transaksi[], tahun: number): RekapTahun[] {
  const hasil: RekapTahun[] = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${tahun}-${String(m).padStart(2, "0")}`;
    const arr = dalamBulan(trx, key);
    const pem = totalPemasukan(arr);
    const peng = totalPengeluaran(arr);
    hasil.push({
      bulanKey: key,
      paduan: m,
      pemasukan: pem,
      pengeluaran: peng,
      selisih: pem - peng,
    });
  }
  return hasil;
}