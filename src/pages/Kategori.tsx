import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useFinance } from "../lib/store";
import type { Kategori, TipeTransaksi } from "../lib/types";
import { IKON_UI, IkonKategori } from "../components/icons";
import { AvatarKategori, Konfirmasi, Modal } from "../components/ui";
import { IKON_YANG_BISA_DIPILIH, WARNA_YANG_BISA_DIPILIH } from "../lib/presets";
import { formatCompact } from "../lib/format";

type ModeForm = { tipe: TipeTransaksi } | null;

function FormKategori({
  mode,
  sunting,
  padaTutup,
}: {
  mode: ModeForm;
  sunting: Kategori | null;
  padaTutup: () => void;
}) {
  const { tambahKategori, ubahKategori } = useFinance();
  const [tipe, setTipe] = useState<TipeTransaksi>(sunting?.tipe ?? mode?.tipe ?? "pemasukan");
  const [nama, setNama] = useState(sunting?.nama ?? "");
  const [warna, setWarna] = useState(sunting?.warna ?? "#0E9F6E");
  const [ikon, setIkon] = useState(sunting?.ikon ?? "CircleEllipsis");
  const [sibuk, setSibuk] = useState(false);

  const valid = nama.trim().length > 0;

  useEffect(() => {
    if (sunting) {
      setTipe(sunting.tipe);
      setNama(sunting.nama);
      setWarna(sunting.warna);
      setIkon(sunting.ikon);
    } else if (mode) {
      setTipe(mode.tipe);
      setNama("");
      setWarna("#0E9F6E");
      setIkon("CircleEllipsis");
    }
  }, [sunting, mode]);

  const simpan = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || sibuk) return;
    setSibuk(true);
    try {
      if (sunting) await ubahKategori(sunting.id, { nama: nama.trim(), tipe, warna, ikon });
      else await tambahKategori({ nama: nama.trim(), tipe, warna, ikon });
      padaTutup();
    } finally {
      setSibuk(false);
    }
  };

  return (
    <Modal
      open={!!mode || !!sunting}
      onTutup={padaTutup}
      judul={sunting ? "Ubah kategori" : "Kategori baru"}
      subjudul="Berikan nama yang mudah dikenali oleh pengurus."
    >
      <form onSubmit={simpan} className="space-y-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Nama kategori
          <input
            className="input"
            placeholder={tipe === "pemasukan" ? "cth: Infak Pembangunan" : "cth: Honor Ustadz Tamu"}
            value={nama}
            maxLength={50}
            onChange={(e) => setNama(e.target.value)}
            autoFocus
            required
          />
        </label>

        <div>
          <p className="mb-1.5 text-sm font-semibold">Jenis</p>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-paper p-1" role="radiogroup" aria-label="Jenis kategori">
            {(["pemasukan", "pengeluaran"] as TipeTransaksi[]).map((t) => {
              const aktif = tipe === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={aktif}
                  onClick={() => setTipe(t)}
                  className={`rounded-lg px-3 py-2 text-sm font-bold capitalize transition ${
                    aktif ? "text-white" : "text-mute hover:text-ink"
                  }`}
                  style={aktif ? { background: t === "pemasukan" ? "var(--c-brand)" : "var(--c-expense)" } : undefined}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold">Warna</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Pilih warna">
            {WARNA_YANG_BISA_DIPILIH.map((w) => (
              <button
                key={w}
                type="button"
                role="radio"
                aria-checked={warna === w}
                aria-label={`Warna ${w}`}
                onClick={() => setWarna(w)}
                className="grid h-8 w-8 place-items-center rounded-full transition hover:scale-110"
                style={{ background: w }}
              >
                {warna === w ? <IKON_UI.cek className="h-4 w-4 text-white" aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold">Ikon</p>
          <div className="grid grid-cols-6 gap-2">
            {IKON_YANG_BISA_DIPILIH.map((namaIkon) => {
              const akt = ikon === namaIkon;
              return (
                <button
                  key={namaIkon}
                  type="button"
                  aria-pressed={akt}
                  aria-label={`Ikon ${namaIkon}`}
                  onClick={() => setIkon(namaIkon)}
                  className="grid h-10 w-full place-items-center rounded-xl border transition"
                  style={
                    akt
                      ? { borderColor: warna, background: `${warna}14`, color: warna }
                      : { borderColor: "var(--c-line)", color: "var(--c-mute)" }
                  }
                >
                  <IkonKategori nama={namaIkon} className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-sm font-medium text-mute">
            <AvatarKategori kategori={{ id: "x", nama: nama || "Kategori", tipe, warna, ikon, urutan: 0 }} ukuran="lg" />
            <span>{nama || "Kategori"}</span>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={padaTutup}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={!valid || sibuk}>
              {sibuk ? <IKON_UI.muat className="h-4 w-4 animate-spin" /> : <IKON_UI.cek className="h-4 w-4" />}
              Simpan
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function BagianKategori({ tipe }: { tipe: TipeTransaksi }) {
  const { data, hapusKategori, readOnly } = useFinance();
  const [mode, setMode] = useState<ModeForm>(null);
  const [sunting, setSunting] = useState<Kategori | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);

  const daftar = useMemo(
    () =>
      data.kategori
        .filter((k) => k.tipe === tipe)
        .sort((a, b) => a.urutan - b.urutan),
    [data.kategori, tipe]
  );

  const dipakaiPada = (kategoriId: string) => {
    const trx = data.transaksi.filter((t) => t.kategoriId === kategoriId);
    const total = trx.reduce((a, t) => a + t.jumlah, 0);
    const berbuah = trx.length > 0;
    return berbuah ? `${trx.length} catatan · ${formatCompact(total)}` : "Belum terpakai";
  };

  const masuk = tipe === "pemasukan";
  const totalKategori = daftar.reduce((a, k) => a + data.transaksi.filter((t) => t.kategoriId === k.id).reduce((x, t) => x + t.jumlah, 0), 0);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className={`text-sm font-extrabold ${masuk ? "text-brand" : "text-expense"}`}>
            {masuk ? "Pemasukan" : "Pengeluaran"}
          </h2>
          <p className="text-xs text-mute">
            {daftar.length} kategori
            {totalKategori > 0 ? <> · total {formatCompact(totalKategori)}</> : null}
          </p>
        </div>
        {!readOnly ? (
          <button type="button" className="btn-ghost px-3 py-2" onClick={() => setMode({ tipe })}>
            <IKON_UI.plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Tambah</span>
          </button>
        ) : null}
      </div>

      {daftar.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-mute">
          {masuk ? "Belum ada kategori pemasukan." : "Belum ada kategori pengeluaran."}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {daftar.map((k) => {
            const dipakai = data.transaksi.some((t) => t.kategoriId === k.id);
            return (
              <li key={k.id} className="card group flex items-center gap-3 p-3.5">
                <AvatarKategori kategori={k} ukuran="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{k.nama}</p>
                  <p className="truncate text-xs text-mute">{dipakaiPada(k.id)}</p>
                </div>
                {!readOnly ? (
                  <div className="flex shrink-0 gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => setSunting(k)}
                      aria-label={`Ubah kategori ${k.nama}`}
                      className="rounded-lg p-2 text-mute transition hover:bg-brand-soft hover:text-brand-deep"
                    >
                      <IKON_UI.edit className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setHapusId(k.id)}
                      aria-label={`Hapus kategori ${k.nama}`}
                      className="rounded-lg p-2 text-mute transition hover:bg-expense/10 hover:text-expense"
                    >
                      <IKON_UI.hapus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : null}

                {dipakai ? (
                  <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand" aria-hidden="true" title="Terpakai" />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <FormKategori mode={mode} sunting={sunting} padaTutup={() => { setMode(null); setSunting(null); }} />

      <Konfirmasi
        open={hapusId !== null}
        judul="Hapus kategori?"
        pesan="Catatan lama tetap tersimpan, namun kategorinya akan menjadi tanpa kategori. Lanjutkan?"
        tombol="Ya, hapus"
        padaBatal={() => setHapusId(null)}
        padaSetuju={() => {
          if (hapusId) {
            void hapusKategori(hapusId);
            setHapusId(null);
          }
        }}
      />
    </section>
  );
}

export function KategoriPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: "var(--c-brand-soft)", color: "var(--c-brand)" }}>
              <IKON_UI.naik className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">Kategori uang masuk</p>
              <p className="text-xs text-mute">Infak, donasi, ZIS, sumbangan, dan lainnya.</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: "rgba(214,69,69,0.12)", color: "var(--c-expense)" }}>
              <IKON_UI.turun className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">Kategori uang keluar</p>
              <p className="text-xs text-mute">Operasional, santri, tagihan, dan kegiatan.</p>
            </div>
          </div>
        </div>
      </div>

      <BagianKategori tipe="pemasukan" />
      <BagianKategori tipe="pengeluaran" />
    </div>
  );
}