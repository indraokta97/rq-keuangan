import type { Kategori } from "./types";

export const KATEGORI_DEFAULT: Kategori[] = [
  // Pemasukan
  { id: "kat-info", nama: "Infak Rutin Jumat", tipe: "pemasukan", warna: "#0E9F6E", ikon: "Archive", urutan: 0 },
  { id: "kat-don", nama: "Donasi Pendidikan Santri", tipe: "pemasukan", warna: "#2E8BE6", ikon: "BookOpen", urutan: 1 },
  { id: "kat-kotak", nama: "Kotak Amal & Sedekah", tipe: "pemasukan", warna: "#E8A33D", ikon: "HandCoins", urutan: 2 },
  { id: "kat-zis", nama: "ZIS (Zakat, Infak, Sedekah)", tipe: "pemasukan", warna: "#0FB5AB", ikon: "Gift", urutan: 3 },
  { id: "kat-online", nama: "Donasi Online (QRIS / Transfer)", tipe: "pemasukan", warna: "#7C5CE0", ikon: "Wallet", urutan: 4 },
  { id: "kat-program-masuk", nama: "Program Ramadhan & Momen Donasi", tipe: "pemasukan", warna: "#E05C9A", ikon: "Cake", urutan: 5 },
  { id: "kat-lainmasuk", nama: "Pemasukan Lainnya", tipe: "pemasukan", warna: "#5B6B7A", ikon: "CircleEllipsis", urutan: 6 },

  // Pengeluaran
  { id: "kat-gaji", nama: "Gaji Ustadz & Pengajar", tipe: "pengeluaran", warna: "#D64545", ikon: "Heart", urutan: 10 },
  { id: "kat-konsumsi", nama: "Konsumsi & Dapur Santri", tipe: "pengeluaran", warna: "#E8A33D", ikon: "Utensils", urutan: 11 },
  { id: "kat-tagihan", nama: "Listrik, Air & Tagihan", tipe: "pengeluaran", warna: "#2E8BE6", ikon: "Droplets", urutan: 12 },
  { id: "kat-atk", nama: "ATK, Buku & Al-Quran", tipe: "pengeluaran", warna: "#0FB5AB", ikon: "BookOpenText", urutan: 13 },
  { id: "kat-pemeliharaan", nama: "Pemeliharaan & Perbaikan", tipe: "pengeluaran", warna: "#E05C9A", ikon: "Wrench", urutan: 14 },
  { id: "kat-operasional", nama: "Transportasi & Operasional", tipe: "pengeluaran", warna: "#7C5CE0", ikon: "BusFront", urutan: 15 },
  { id: "kat-program", nama: "Kegiatan & Acara Program", tipe: "pengeluaran", warna: "#C95A5A", ikon: "CalendarDays", urutan: 16 },
  { id: "kat-wifi", nama: "Internet & Komunikasi", tipe: "pengeluaran", warna: "#5B6B7A", ikon: "Wifi", urutan: 17 },
  { id: "kat-sosial", nama: "Dana Sosial & Santunan", tipe: "pengeluaran", warna: "#C98A2B", ikon: "HandHeart", urutan: 18 },
  { id: "kat-lainkeluar", nama: "Pengeluaran Lainnya", tipe: "pengeluaran", warna: "#B07CE0", ikon: "CircleEllipsis", urutan: 19 },
];

export const IKON_YANG_BISA_DIPILIH = [
  "Archive",
  "BookOpen",
  "BookOpenText",
  "BusFront",
  "Cake",
  "CalendarDays",
  "CircleEllipsis",
  "Droplets",
  "Gift",
  "HandCoins",
  "HandHeart",
  "Heart",
  "PiggyBank",
  "Users",
  "Utensils",
  "Wallet",
  "Wifi",
  "Wrench",
];

export const WARNA_YANG_BISA_DIPILIH = [
  "#0E9F6E",
  "#0FB5AB",
  "#2E8BE6",
  "#7C5CE0",
  "#E8A33D",
  "#E05C9A",
  "#D64545",
  "#C95A5A",
  "#5B6B7A",
  "#C98A2B",
  "#B07CE0",
  "#3A8A7B",
];