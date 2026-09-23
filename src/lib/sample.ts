import type { AppData, Kategori, Transaksi } from "./types";
import { KATEGORI_DEFAULT } from "./presets";
import { buatKunci, uid } from "./format";

let seed = 20260922;
function rand(min: number, max: number): number {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  const r = seed / 2147483648;
  return Math.round(min + r * (max - min));
}

function dataTanggal(now: Date, bulanBack: number, day: number): string {
  return buatKunci(new Date(now.getFullYear(), now.getMonth() - bulanBack, day));
}

export function hasilkanDataContoh(): AppData {
  const now = new Date();
  const kategori: Kategori[] = KATEGORI_DEFAULT.map((k) => ({ ...k }));
  const transaksi: Transaksi[] = [];
  const baris = (tipe: "pemasukan" | "pengeluaran", kategoriId: string, jumlah: number, tanggal: string, keterangan: string) =>
    ({
      id: uid(),
      tipe,
      kategoriId,
      jumlah,
      tanggal,
      keterangan,
      createdAt: `${tanggal}T09:00:00`,
      updatedAt: `${tanggal}T09:00:00`,
    }) as Transaksi;

  for (let b = 5; b >= 0; b--) {
    const tgl = (d: number) => dataTanggal(now, b, d);

    // Pemasukan rutin
    transaksi.push(
      baris("pemasukan", "kat-info", rand(450000, 900000), tgl(2), "Infak Jumat pekan 1"),
      baris("pemasukan", "kat-info", rand(350000, 750000), tgl(9), "Infak Jumat pekan 2"),
      baris("pemasukan", "kat-info", rand(400000, 800000), tgl(16), "Infak Jumat pekan 3"),
      baris("pemasukan", "kat-info", rand(380000, 700000), tgl(23), "Infak Jumat pekan 4"),
      baris("pemasukan", "kat-online", rand(250000, 600000), tgl(5), "Donasi transfer bank"),
      baris("pemasukan", "kat-kotak", rand(120000, 260000), tgl(b === 0 ? now.getDate() : 27), "Kotak amal harian"),
    );

    // Pengeluaran rutin
    transaksi.push(
      baris("pengeluaran", "kat-gaji", 3000000, tgl(27), "Insentif ustadz & pengajar bulanan"),
      baris("pengeluaran", "kat-konsumsi", rand(700000, 1100000), tgl(14), "Belanja dapur santri mingguan"),
      baris("pengeluaran", "kat-tagihan", rand(300000, 460000), tgl(20), "Tagihan listrik & PDAM"),
      baris("pengeluaran", "kat-wifi", 350000, tgl(18), "Langganan WiFi bulanan"),
      baris("pengeluaran", "kat-operasional", rand(150000, 300000), tgl(11), "Bensin & transportasi kegiatan"),
    );

    if (b === 3) {
      transaksi.push(baris("pengeluaran", "kat-pemeliharaan", 1750000, tgl(21), "Perbaikan atap ruang belajar"));
      transaksi.push(baris("pemasukan", "kat-don", 3000000, tgl(10), "SPP & uang gedung santri baru"));
    }
    if (b === 2) {
      transaksi.push(baris("pengeluaran", "kat-program", 2400000, tgl(15), "Gelar karya santri & pembagian rapor"));
      transaksi.push(baris("pemasukan", "kat-zis", 5000000, tgl(8), "Distribusi ZIS dari lembaga mitra"));
    }
    if (b === 1) {
      transaksi.push(baris("pengeluaran", "kat-atk", 850000, tgl(6), "Cetak buku, al-Quran & ATK santri"));
      transaksi.push(baris("pemasukan", "kat-program-masuk", 1200000, tgl(22), "Donasi Gema Ramadhan"));
    }
    if (b === 0) {
      transaksi.push(baris("pengeluaran", "kat-sosial", 500000, tgl(4), "Santunan anak yatim"));
      transaksi.push(baris("pemasukan", "kat-don", 1500000, tgl(12), "Donatur tetap tahfizh"));
    }
  }

  transaksi.sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0));

  return {
    kategori,
    transaksi,
    pengaturan: {
      namaOrganisasi: "Rumah Quran UGM",
      saldoAwal: 2500000,
      tahunMulai: now.getFullYear(),
      catatanBulanan: true,
      kataSandi: "",
    },
  };
}