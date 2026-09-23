import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "./ui";
import { IKON_UI, IkonKategori } from "./icons";
import { useFinance } from "../lib/store";
import type { TipeTransaksi, Transaksi } from "../lib/types";
import { buatKunci, formatJumlahInput, parseJumlahStr } from "../lib/format";
import { konversiKeWebp, unggahBukti } from "../lib/upload";

export function FormTransaksi({
  terbuka,
  padaTutup,
  sunting,
  defaultTipe = "pemasukan",
  defaultKategoriId,
}: {
  terbuka: boolean;
  padaTutup: () => void;
  sunting: Transaksi | null;
  defaultTipe: TipeTransaksi;
  defaultKategoriId?: string | null;
}) {
  const { data, tambahTransaksi, ubahTransaksi, mode } = useFinance();
  const [tipe, setTipe] = useState<TipeTransaksi>(defaultTipe);
  const [tanggal, setTanggal] = useState(buatKunci(new Date()));
  const [jumlahStr, setJumlahStr] = useState("");
  const [kategoriId, setKategoriId] = useState<string>(defaultKategoriId ?? "");
  const [keterangan, setKeterangan] = useState("");
  const [buktiPreview, setBuktiPreview] = useState<string | null>(null);
  const [buktiBaru, setBuktiBaru] = useState<File | null>(null);
  const [buktiDataUrl, setBuktiDataUrl] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [memilih, setMemilih] = useState(false);
  const [sibuk, setSibuk] = useState(false);

  const kategoriTipe = useMemo(
    () => data.kategori.filter((k) => k.tipe === tipe).sort((a, b) => a.urutan - b.urutan),
    [data.kategori, tipe]
  );

  useEffect(() => {
    if (!terbuka) return;
    setBuktiPreview(sunting?.bukti ?? null);
    setBuktiBaru(null);
    setBuktiDataUrl(null);
    setUploadErr(null);
    if (sunting) {
      setTipe(sunting.tipe);
      setTanggal(sunting.tanggal);
      setJumlahStr(formatJumlahInput(sunting.jumlah));
      setKategoriId(sunting.kategoriId ?? "");
      setKeterangan(sunting.keterangan);
    } else {
      setTipe(defaultTipe);
      setTanggal(buatKunci(new Date()));
      setJumlahStr("");
      setKategoriId(defaultKategoriId ?? "");
      setKeterangan("");
    }
  }, [terbuka, sunting, defaultTipe, defaultKategoriId]);

  const jumlah = parseJumlahStr(jumlahStr);
  const valid = jumlah > 0 && tanggal.length === 10 && keterangan.trim().length > 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || sibuk) return;
    setSibuk(true);
    setUploadErr(null);
    try {
      let bukti = buktiBaru ? "" : (sunting?.bukti ?? "");
      if (buktiBaru) {
        if (mode === "postgres") {
          try {
            bukti = await unggahBukti(buktiBaru);
          } catch (err) {
            const pesan = err instanceof Error ? err.message : "Gagal mengunggah foto.";
            setUploadErr(`${pesan} Hapus foto atau coba lagi.`);
            setSibuk(false);
            return;
          }
        } else if (buktiDataUrl) {
          bukti = buktiDataUrl;
        }
      }
      const payload = {
        tipe,
        kategoriId: kategoriId || null,
        jumlah,
        tanggal,
        keterangan: keterangan.trim(),
        bukti,
      };
      if (sunting) await ubahTransaksi(sunting.id, payload);
      else await tambahTransaksi(payload);
      padaTutup();
    } finally {
      setSibuk(false);
    }
  };

  const pilihFile = async (f: File | null) => {
    setUploadErr(null);
    if (!f) return;
    setMemilih(true);
    try {
      const { blob, dataUrl, preview } = await konversiKeWebp(f);
      setBuktiBaru(new File([blob], "bukti.webp", { type: blob.type }));
      setBuktiDataUrl(dataUrl);
      setBuktiPreview(preview);
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : "Gambar gagal diolah.");
    } finally {
      setMemilih(false);
    }
  };

  const pilihGantiTipe = (t: TipeTransaksi) => {
    setTipe(t);
    setKategoriId("");
  };

  return (
    <Modal
      open={terbuka}
      onTutup={padaTutup}
      judul={sunting ? "Ubah catatan" : "Tambah transaksi"}
      subjudul={sunting ? "Perbaiki detail catatan kas." : "Catat pemasukan atau pengeluaran kas."}
    >
      <form onSubmit={submit} className="space-y-4">
        <div role="radiogroup" aria-label="Jenis transaksi" className="grid grid-cols-2 gap-2 rounded-xl bg-paper p-1">
          {(["pemasukan", "pengeluaran"] as TipeTransaksi[]).map((t) => {
            const aktif = tipe === t;
            const masuk = t === "pemasukan";
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={aktif}
                onClick={() => pilihGantiTipe(t)}
                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold capitalize transition ${
                  aktif ? (masuk ? "text-white" : "text-white") : "text-mute hover:text-ink"
                }`}
                style={aktif ? { background: masuk ? "var(--c-brand)" : "var(--c-expense)" } : undefined}
              >
                {masuk ? <IKON_UI.naik className="h-4 w-4" aria-hidden="true" /> : <IKON_UI.turun className="h-4 w-4" aria-hidden="true" />}
                {t}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Tanggal
            <input type="date" className="input" value={tanggal} max={buatKunci(new Date())} onChange={(e) => setTanggal(e.target.value)} required />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Nominal
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-mute">Rp</span>
              <input
                inputMode="numeric"
                className="input num pl-9"
                placeholder="0"
                value={jumlahStr}
                onChange={(e) => setJumlahStr(e.target.value.replace(/[^\d]/g, ""))}
                aria-label="Nominal dalam rupiah"
              />
            </div>
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Kategori
          <select className="input" value={kategoriId} onChange={(e) => setKategoriId(e.target.value)}>
            <option value="">Tanpa kategori</option>
            {kategoriTipe.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
          {kategoriTipe.length === 0 ? (
            <span className="text-xs text-gold">
              Belum ada kategori {tipe}. Tambahkan dulu di menu Kategori.
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Keterangan
          <input
            className="input"
            placeholder={tipe === "pemasukan" ? "cth: Infak Jumat pekan ke-2" : "cth: Belanja dapur mingguan"}
            value={keterangan}
            maxLength={120}
            onChange={(e) => setKeterangan(e.target.value)}
            required
          />
        </label>

        <div className="flex flex-col gap-1.5 text-sm font-semibold">
          <span>Foto bukti</span>
          {buktiPreview ? (
            <div className="flex items-center gap-3">
              <a
                href={buktiPreview.startsWith("blob:") ? undefined : buktiPreview}
                target="_blank"
                rel="noreferrer"
                className="block shrink-0 overflow-hidden rounded-xl border border-line"
                aria-label="Buka foto bukti di tab baru"
              >
                <img src={buktiPreview} alt="" className="h-20 w-20 object-cover" />
              </a>
              <div className="flex flex-col gap-2">
                <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-brand/50 hover:text-brand">
                  {memilih ? <IKON_UI.muat className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <IKON_UI.ganti className="h-3.5 w-3.5" aria-hidden="true" />}
                  {memilih ? "Mengolah…" : "Ganti"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={sibuk || memilih}
                    onChange={(e) => {
                      void pilihFile(e.target.files?.[0] ?? null);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="w-fit text-xs font-semibold text-expense hover:underline"
                  onClick={() => {
                    setBuktiPreview(null);
                    setBuktiBaru(null);
                    setBuktiDataUrl(null);
                    setUploadErr(null);
                  }}
                >
                  Hapus foto
                </button>
              </div>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-paper px-4 py-5 text-xs font-semibold text-mute transition hover:border-brand/50 hover:text-brand">
              {memilih ? <IKON_UI.muat className="h-4 w-4 animate-spin" aria-hidden="true" /> : <IKON_UI.foto className="h-4 w-4" aria-hidden="true" />}
              {memilih ? "Mengolah gambar…" : "Pilih foto"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={sibuk || memilih}
                onChange={(e) => {
                  void pilihFile(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </label>
          )}
          {uploadErr ? (
            <span className="text-xs font-medium text-expense">{uploadErr}</span>
          ) : null}
        </div>

        <div className="sticky bottom-0 -mx-4 mt-1 flex items-center justify-between gap-3 border-t border-line bg-card px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3 sm:mx-0 sm:px-0 sm:pt-3">
          {sunting ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-deep">
              <IKON_UI.edit className="h-3.5 w-3.5" aria-hidden="true" />
              Mode ubah
            </span>
          ) : (
            <span className="hidden text-xs text-mute sm:block">Simpan & catat lagi bila perlu.</span>
          )}
          <div className="flex shrink-0 gap-2 sm:ml-auto">
            <button
              type="button"
              className="btn-ghost whitespace-nowrap px-4 py-2.5 sm:px-4 sm:py-2"
              onClick={padaTutup}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary whitespace-nowrap px-5 py-2.5 sm:px-4 sm:py-2"
              disabled={!valid || sibuk}
            >
              {sibuk ? <IKON_UI.muat className="h-4 w-4 animate-spin" /> : <IKON_UI.cek className="h-4 w-4" />}
              {sunting ? "Simpan" : "Catat"}
            </button>
          </div>
        </div>
      </form>

      {kategoriTipe.length === 0 ? (
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-deep"
          onClick={() => {
            padaTutup();
            window.location.hash = "/kategori";
          }}
        >
          <IKON_UI.plus className="h-3.5 w-3.5" aria-hidden="true" />
          Buat kategori {tipe} dulu
        </button>
      ) : null}

      {kategoriId ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-paper px-3 py-2.5 text-sm">
          {(() => {
            const k = data.kategori.find((x) => x.id === kategoriId)!;
            return (
              <>
                <IkonKategori nama={k.ikon} className="h-4 w-4" />
                <span className="font-medium text-ink">{k.nama}</span>
                <span className="ml-auto text-xs text-mute">
                  {k.tipe === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                </span>
              </>
            );
          })()}
        </div>
      ) : null}
    </Modal>
  );
}