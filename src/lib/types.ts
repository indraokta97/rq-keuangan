export type TipeTransaksi = "pemasukan" | "pengeluaran";

export interface Kategori {
  id: string;
  nama: string;
  tipe: TipeTransaksi;
  warna: string;
  ikon: string;
  urutan: number;
}

export interface Transaksi {
  id: string;
  tipe: TipeTransaksi;
  kategoriId: string | null;
  jumlah: number;
  tanggal: string; // YYYY-MM-DD
  keterangan: string;
  /** URL foto bukti (Vercel Blob, WebP). Kosong = tidak ada foto. */
  bukti?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pengaturan {
  namaOrganisasi: string;
  saldoAwal: number;
  tahunMulai: number;
  catatanBulanan?: boolean;
  /** Hash SHA-256 kata sandi pengelola. Kosong = belum dikunci. */
  kataSandi?: string;
}

export interface AppData {
  kategori: Kategori[];
  transaksi: Transaksi[];
  pengaturan: Pengaturan;
}

export interface FilterTransaksi {
  tipe: TipeTransaksi | "semua";
  kategoriId: string | null;
  tanggal: string; // YYYY-MM-DD atau ""
  cari: string;
}