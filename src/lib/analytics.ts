import type { Kategori, Transaksi } from "./types";
import { bulanSebelumnya, formatRp } from "./format";

export function totalPemasukan(trx: Transaksi[]): number {
  return trx.filter((t) => t.tipe === "pemasukan").reduce((a, t) => a + t.jumlah, 0);
}

export function totalPengeluaran(trx: Transaksi[]): number {
  return trx.filter((t) => t.tipe === "pengeluaran").reduce((a, t) => a + t.jumlah, 0);
}

export function saldoTotal(trx: Transaksi[], saldoAwal: number): number {
  return saldoAwal + totalPemasukan(trx) - totalPengeluaran(trx);
}

export function dalamBulan(trx: Transaksi[], bulanKey: string): Transaksi[] {
  return trx.filter((t) => t.tanggal.slice(0, 7) === bulanKey);
}

export interface RingkasanBulanan {
  bulanKey: string;
  paduan: string;
  pemasukan: number;
  pengeluaran: number;
  selisih: number;
}

export function ringkasanPerBulan(trx: Transaksi[], jumlahBulan: number, dariBulan?: string): RingkasanBulanan[] {
  const sekarang = dariBulan ?? new Date().toISOString().slice(0, 7);
  const hasil: RingkasanBulanan[] = [];

  for (let i = jumlahBulan - 1; i >= 0; i--) {
    const kunci = bulanSebelumnya(sekarang, i);
    const bulan = dalamBulan(trx, kunci);
    const pem = totalPemasukan(bulan);
    const peng = totalPengeluaran(bulan);
    hasil.push({
      bulanKey: kunci,
      paduan: kunci.slice(5),
      pemasukan: pem,
      pengeluaran: peng,
      selisih: pem - peng,
    });
  }
  return hasil;
}

export interface RingkasanKategori {
  kategori: Kategori;
  jumlah: number;
  porsi: number; // 0-1
  banyakTransaksi: number;
}

export function ringkasanPerKategori(trx: Transaksi[], kategori: Kategori[], tipe: "pemasukan" | "pengeluaran"): RingkasanKategori[] {
  const rows = trx.filter((t) => t.tipe === tipe);
  const total = rows.reduce((a, t) => a + t.jumlah, 0) || 1;

  return kategori
    .filter((k) => k.tipe === tipe)
    .map((k) => {
      const milik = rows.filter((t) => t.kategoriId === k.id);
      const jumlah = milik.reduce((a, t) => a + t.jumlah, 0);
      return {
        kategori: k,
        jumlah,
        porsi: jumlah / total,
        banyakTransaksi: milik.length,
      };
    })
    .filter((r) => r.jumlah > 0)
    .sort((a, b) => b.jumlah - a.jumlah);
}

export function bilang(angka: number): string {
  return Math.round(angka * 100) + "%";
}

export function labelRingkasanAkses(ri: { kategori: Kategori; porsi: number; jumlah: number }): string {
  return `${ri.kategori.nama}: ${bilang(ri.porsi)} (${formatRp(ri.jumlah)})`;
}

export function tahunUnik(trx: Transaksi[]): number[] {
  const set = new Set(trx.map((t) => Number(t.tanggal.slice(0, 4))));
  if (set.size === 0) set.add(new Date().getFullYear());
  return Array.from(set).sort((a, b) => b - a);
}