import { useMemo, useState } from "react";
import { useFinance } from "../lib/store";
import type { FilterTransaksi, TipeTransaksi, Transaksi } from "../lib/types";
import { formatTanggalPendek, formatRp } from "../lib/format";
import { AvatarKategori, ChipJumlah, Konfirmasi, Kosong, Modal } from "../components/ui";
import { IKON_UI } from "../components/icons";
import { FormTransaksi } from "../components/FormTransaksi";

const PER_HALAMAN = 15;

export function TransaksiPage() {
  const { data, transaksiTerurut, kategoriMap, hapusTransaksi, readOnly } = useFinance();
  const [filter, setFilter] = useState<FilterTransaksi>({ tipe: "semua", kategoriId: null, tanggal: "", cari: "" });
  const [halaman, setHalaman] = useState(0);
  const [formBuka, setFormBuka] = useState(false);
  const [sunting, setSunting] = useState<Transaksi | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);
  const [lihatBukti, setLihatBukti] = useState<Transaksi | null>(null);

  const { tipe, kategoriId, tanggal, cari } = filter;

  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return transaksiTerurut.filter((t) => {
      if (tipe !== "semua" && t.tipe !== tipe) return false;
      if (kategoriId && t.kategoriId !== kategoriId) return false;
      if (tanggal && t.tanggal !== tanggal) return false;
      if (q) {
        const k = t.kategoriId ? kategoriMap.get(t.kategoriId) : undefined;
        const teks = [t.keterangan, k?.nama ?? ""].join(" ").toLowerCase();
        if (!teks.includes(q)) return false;
      }
      return true;
    });
  }, [transaksiTerurut, tipe, kategoriId, tanggal, cari, kategoriMap]);

  const totalMasuk = hasil.filter((t) => t.tipe === "pemasukan").reduce((a, t) => a + t.jumlah, 0);
  const totalKeluar = hasil.filter((t) => t.tipe === "pengeluaran").reduce((a, t) => a + t.jumlah, 0);

  const jumlahHalaman = Math.max(1, Math.ceil(hasil.length / PER_HALAMAN));
  const halAman = Math.min(halaman, jumlahHalaman - 1);
  const tampil = hasil.slice(halAman * PER_HALAMAN, halAman * PER_HALAMAN + PER_HALAMAN);

  const ubahTerapkan = (p: Partial<FilterTransaksi>) => {
    setFilter((f) => ({ ...f, ...p }));
    setHalaman(0);
  };

  const mulaiEdit = (t: Transaksi) => {
    setSunting(t);
    setFormBuka(true);
  };

  const kategoriDipilih = kategoriId ? data.kategori.find((k) => k.id === kategoriId) : undefined;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Panel filter */}
      <div className="card flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div role="tablist" aria-label="Jenis transaksi" className="grid min-w-0 flex-1 grid-cols-3 gap-1 rounded-xl bg-paper p-1">
            {(
              [
                { k: "semua", l: "Semua" },
                { k: "pemasukan", l: "Masuk" },
                { k: "pengeluaran", l: "Keluar" },
              ] as const
            ).map((o) => {
              const aktif = tipe === o.k;
              return (
                <button
                  key={o.k}
                  role="tab"
                  aria-selected={aktif}
                  onClick={() => ubahTerapkan({ tipe: o.k })}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    aktif ? "bg-card text-ink shadow-sm" : "text-mute hover:text-ink"
                  }`}
                >
                  {o.l}
                </button>
              );
            })}
          </div>

          {!readOnly ? (
            <button type="button" className="btn-primary shrink-0 px-3 sm:px-4" onClick={() => setFormBuka(true)}>
              <IKON_UI.plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Tambah</span>
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <label className="relative col-span-2 block text-mute sm:w-52">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <IKON_UI.cari className="h-4 w-4" aria-hidden="true" />
            </span>
            <input
              className="input w-full py-2 pl-9"
              placeholder="Cari keterangan…"
              value={cari}
              onChange={(e) => ubahTerapkan({ cari: e.target.value })}
            />
          </label>
          <input
            type="date"
            className="input w-full py-2 sm:w-[150px]"
            aria-label="Filter berdasarkan tanggal"
            value={tanggal}
            onChange={(e) => ubahTerapkan({ tanggal: e.target.value })}
          />
          <select
            className="input w-full min-w-0 py-2 sm:min-w-[150px] sm:flex-1"
            aria-label="Filter kategori"
            value={kategoriId ?? ""}
            onChange={(e) => ubahTerapkan({ kategoriId: e.target.value || null })}
          >
            <option value="">Semua kategori</option>
            <optgroup label="Pemasukan">
              {data.kategori.filter((k) => k.tipe === "pemasukan").map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </optgroup>
            <optgroup label="Pengeluaran">
              {data.kategori.filter((k) => k.tipe === "pengeluaran").map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Ringkasan desktop */}
        <div className="hidden flex-wrap items-center gap-x-5 gap-y-1 border-t border-line pt-3 text-xs text-mute sm:flex">
          <span>
            <span className="font-bold text-ink">{hasil.length}</span> catatan ditemukan
          </span>
          <span>
            Masuk <span className="num font-bold text-brand">{formatRp(totalMasuk)}</span>
          </span>
          <span>
            Keluar <span className="num font-bold text-expense">{formatRp(totalKeluar)}</span>
          </span>
          <span>
            Selisih{" "}
            <span className={`num font-bold ${totalMasuk - totalKeluar >= 0 ? "text-ink" : "text-expense"}`}>
              {formatRp(totalMasuk - totalKeluar)}
            </span>
          </span>
          {kategoriDipilih ? (
            <span className="chip bg-brand-soft text-brand-deep">
              <AvatarKategori kategori={kategoriDipilih} ukuran="sm" />
              {kategoriDipilih.nama}
            </span>
          ) : null}
        </div>

        {/* Ringkasan mobile */}
        <div className="border-t border-line pt-3 sm:hidden">
          <div className="flex items-center justify-between gap-2 text-xs text-mute">
            <span>
              <span className="font-bold text-ink">{hasil.length}</span> catatan ditemukan
            </span>
            {kategoriDipilih ? (
              <span className="chip bg-brand-soft text-brand-deep">
                <AvatarKategori kategori={kategoriDipilih} ukuran="sm" />
                {kategoriDipilih.nama}
              </span>
            ) : null}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-line">
            {(
              [
                { l: "Masuk", v: formatRp(totalMasuk), c: "text-brand" },
                { l: "Keluar", v: formatRp(totalKeluar), c: "text-expense" },
                {
                  l: "Selisih",
                  v: formatRp(totalMasuk - totalKeluar),
                  c: totalMasuk - totalKeluar >= 0 ? "text-ink" : "text-expense",
                },
              ] as const
            ).map((d) => (
              <div key={d.l} className="bg-paper px-2 py-2 text-center">
                <p className="text-[11px] font-medium">{d.l}</p>
                <p className={`num mt-0.5 whitespace-nowrap text-xs font-bold leading-tight ${d.c}`}>{d.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daftar transaksi */}
      {tampil.length === 0 ? (
        <div className="mt-5">
          <Kosong
            ikon={
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-paper text-mute">
                <IKON_UI.net className="h-7 w-7" aria-hidden="true" />
              </span>
            }
            judul="Belum ada catatan di sini"
            pesan={readOnly ? "Coba ubah filter pencarian Anda — tidak ada catatan yang cocok." : "Coba ubah filter pencarian Anda, atau catat transaksi baru."}
            aksi={
              !readOnly ? (
                <button type="button" className="btn-primary" onClick={() => setFormBuka(true)}>
                  <IKON_UI.plus className="h-4 w-4" aria-hidden="true" />
                  Tambah transaksi
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-card">
          {/* Tabel desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-xs uppercase tracking-wider text-mute">
                  <th scope="col" className="px-5 py-3.5 font-semibold">Tanggal</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Keterangan</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Kategori</th>
                  <th scope="col" className="px-5 py-3.5 text-right font-semibold">Jumlah</th>
                  {!readOnly ? <th scope="col" className="px-5 py-3.5" aria-label="Aksi" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {tampil.map((t) => {
                  const k = t.kategoriId ? kategoriMap.get(t.kategoriId) : undefined;
                  const jenis: TipeTransaksi = t.tipe;
                  return (
                    <tr key={t.id} className="transition hover:bg-paper/60">
                      <td className="whitespace-nowrap px-5 py-3.5 text-mute" data-tanggal={t.tanggal}>
                        <span className="sr-only">{t.tanggal}</span>
                        {formatTanggalPendek(t.tanggal)}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-ink">{t.keterangan}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {k ? (
                          <span className="inline-flex items-center gap-2">
                            <AvatarKategori kategori={k} ukuran="sm" />
                            <span className="text-xs font-medium text-mute">{k.nama}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-mute">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ChipJumlah tipe={jenis} jumlah={t.jumlah} />
                      </td>
                      {!readOnly ? (
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            {t.bukti ? (
                              <button
                                type="button"
                                onClick={() => setLihatBukti(t)}
                                aria-label={`Lihat foto bukti ${t.keterangan}`}
                                className="rounded-lg p-2 text-mute transition hover:bg-brand-soft hover:text-brand-deep"
                              >
                                <IKON_UI.lihat className="h-4 w-4" aria-hidden="true" />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => mulaiEdit(t)}
                              aria-label={`Ubah catatan ${t.keterangan}`}
                              className="rounded-lg p-2 text-mute transition hover:bg-brand-soft hover:text-brand-deep"
                            >
                              <IKON_UI.edit className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setHapusId(t.id)}
                              aria-label={`Hapus catatan ${t.keterangan}`}
                              className="rounded-lg p-2 text-mute transition hover:bg-expense/10 hover:text-expense"
                            >
                              <IKON_UI.hapus className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Kartu mobile */}
          <ul className="divide-y divide-line md:hidden">
            {tampil.map((t) => {
              const k = t.kategoriId ? kategoriMap.get(t.kategoriId) : undefined;
              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                  {k ? (
                    <AvatarKategori kategori={k} />
                  ) : (
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper text-mute">
                      <IKON_UI.tag className="h-4 w-4" aria-hidden="true" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{t.keterangan}</p>
                    <p className="truncate text-xs text-mute">
                      {formatTanggalPendek(t.tanggal)}
                      {k ? <> · {k.nama}</> : null}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <ChipJumlah tipe={t.tipe} jumlah={t.jumlah} />
                    {!readOnly ? (
                      <div className="mt-1 flex items-center justify-end gap-0.5">
                        {t.bukti ? (
                          <button
                            type="button"
                            onClick={() => setLihatBukti(t)}
                            aria-label={`Lihat foto bukti ${t.keterangan}`}
                            className="rounded p-1 text-mute hover:text-brand-deep"
                          >
                            <IKON_UI.lihat className="h-4 w-4" aria-hidden="true" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => mulaiEdit(t)}
                          aria-label={`Ubah catatan ${t.keterangan}`}
                          className="rounded p-1 text-mute hover:text-brand-deep"
                        >
                          <IKON_UI.edit className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setHapusId(t.id)}
                          aria-label={`Hapus catatan ${t.keterangan}`}
                          className="rounded p-1 text-mute hover:text-expense"
                        >
                          <IKON_UI.hapus className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Paginasi */}
          {jumlahHalaman > 1 ? (
            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <p className="text-xs text-mute">
                Hal {halAman + 1} dari {jumlahHalaman}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-ghost px-3 py-2"
                  disabled={halAman === 0}
                  onClick={() => setHalaman(Math.max(0, halAman - 1))}
                  aria-label="Halaman sebelumnya"
                >
                  <IKON_UI.kiri className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn-ghost px-3 py-2"
                  disabled={halAman >= jumlahHalaman - 1}
                  onClick={() => setHalaman(Math.min(jumlahHalaman - 1, halAman + 1))}
                  aria-label="Halaman berikutnya"
                >
                  <IKON_UI.kanan className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Form modal */}
      <FormTransaksi
        terbuka={formBuka}
        padaTutup={() => {
          setFormBuka(false);
          setSunting(null);
        }}
        sunting={sunting}
        defaultTipe={tipe === "semua" ? "pemasukan" : tipe}
        defaultKategoriId={kategoriId}
      />

      {/* Popup foto bukti */}
      <Modal
        open={lihatBukti !== null}
        onTutup={() => setLihatBukti(null)}
        judul="Foto bukti"
        subjudul={lihatBukti ? `${lihatBukti.keterangan} · ${formatRp(lihatBukti.jumlah)}` : undefined}
        lebar="max-w-xl"
        pusat
      >
        {lihatBukti?.bukti ? (
          <div className="flex justify-center">
            <img
              src={lihatBukti.bukti}
              alt={`Foto bukti ${lihatBukti.keterangan}`}
              className="max-h-[65vh] w-auto max-w-full rounded-xl border border-line bg-paper object-contain"
            />
          </div>
        ) : null}
      </Modal>

      {/* Konfirmasi hapus */}
      <Konfirmasi
        open={hapusId !== null}
        judul="Hapus catatan ini?"
        pesan="Catatan akan dihapus permanen dan tidak bisa dikembalikan. Lanjutkan?"
        tombol="Ya, hapus"
        padaBatal={() => setHapusId(null)}
        padaSetuju={() => {
          if (hapusId) {
            void hapusTransaksi(hapusId);
            setHapusId(null);
          }
        }}
      />
    </div>
  );
}