import { useMemo, useState } from "react";
import { useFinance } from "../lib/store";
import {
  dalamBulan,
  ringkasanPerBulan,
  ringkasanPerKategori,
  saldoTotal,
  totalPemasukan,
  totalPengeluaran,
} from "../lib/analytics";
import { bulanSekarang, labelBulan, namaBulanPendek, bulanSebelumnya, formatRp, formatTanggalPendek } from "../lib/format";
import { GrafikArusKas, LegendaArusKas, DonatKategori } from "../components/charts";
import { AvatarKategori, StatCard } from "../components/ui";
import { IKON_UI } from "../components/icons";
import { navigasi } from "../lib/router";
import { hasilkanDataContoh } from "../lib/sample";
import { FormTransaksi } from "../components/FormTransaksi";

export function Dashboard() {
  const { data, transaksiTerurut, kategoriMap, restore, readOnly } = useFinance();
  const [formBuka, setFormBuka] = useState(false);
  const [sedang, setSedang] = useState(false);
  const [jangkauan, setJangkauan] = useState<"all" | "12" | "6" | "3">("all");
  const [bulanDonat, setBulanDonat] = useState<"all" | string>("all");

  const bulanIni = bulanSekarang();
  const trx = data.transaksi;
  const masukTotal = totalPemasukan(trx);
  const keluarTotal = totalPengeluaran(trx);
  const saldo = saldoTotal(trx, data.pengaturan.saldoAwal);

  const labelGrafik = (key: string) => {
    const [y, m] = key.split("-").map(Number);
    return `${namaBulanPendek(m - 1)} ${String(y).slice(2)}`;
  };

  const seri = useMemo(() => {
    if (jangkauan === "all") {
      const kunciAwal = trx.length
        ? trx.reduce((a, t) => {
            const k = t.tanggal.slice(0, 7);
            return k < a ? k : a;
          }, trx[0].tanggal.slice(0, 7))
        : bulanIni;
      const keys: string[] = [];
      let k = kunciAwal;
      while (k <= bulanIni) {
        keys.push(k);
        k = bulanSebelumnya(k, -1);
      }
      return keys.map((bk) => {
        const bulan = dalamBulan(trx, bk);
        return {
          label: labelGrafik(bk),
          pemasukan: totalPemasukan(bulan),
          pengeluaran: totalPengeluaran(bulan),
        };
      });
    }
    return ringkasanPerBulan(trx, Number(jangkauan)).map((r) => ({
      label: labelGrafik(r.bulanKey),
      pemasukan: r.pemasukan,
      pengeluaran: r.pengeluaran,
    }));
  }, [trx, jangkauan, bulanIni]);

  const daftarBulan = useMemo(() => {
    const set = new Set(trx.map((t) => t.tanggal.slice(0, 7)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [trx]);

  const donatKategori = useMemo(() => {
    const trxDonat = bulanDonat === "all" ? trx : dalamBulan(trx, bulanDonat);
    return ringkasanPerKategori(trxDonat, data.kategori, "pengeluaran");
  }, [trx, data.kategori, bulanDonat]);

  const baruEnam = transaksiTerurut?.slice(0, 6) ?? [];
  const kosong = trx.length === 0;

  const muatContoh = async () => {
    setSedang(true);
    try {
      await restore(hasilkanDataContoh());
    } finally {
      setSedang(false);
    }
  };

  if (kosong) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card overflow-hidden border-0 p-8 text-center">
          <div
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl text-white"
            style={{ background: "linear-gradient(135deg,#09805a,#12a98b)" }}
          >
            <IKON_UI.tilawah className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-extrabold tracking-tight text-ink">
            {readOnly ? `Kas ${data.pengaturan.namaOrganisasi}` : `Selamat datang, ${data.pengaturan.namaOrganisasi}`}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-mute">
            {readOnly
              ? "Belum ada catatan kas yang dibagikan. Data akan muncul di sini begitu pengurus mencatatnya."
              : "Mari rapi-rapikan amanah. Mulai dengan mencatat transaksi pertama, atau muat data contoh untuk melihat bagaimana grafik dan laporannya bekerja."}
          </p>

          {readOnly ? (
            <p className="mt-6 text-xs text-mute">
              Tampilan ini hanya untuk melihat — tidak bisa mengubah data.
            </p>
          ) : (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button type="button" className="btn-primary" onClick={() => setFormBuka(true)}>
                <IKON_UI.plus className="h-4 w-4" aria-hidden="true" />
                Catat transaksi pertama
              </button>
              <button type="button" className="btn-ghost" onClick={muatContoh} disabled={sedang}>
                {sedang ? <IKON_UI.muat className="h-4 w-4 animate-spin" /> : <IKON_UI.sparkle className="h-4 w-4" />}
                Muat data contoh
              </button>
            </div>
          )}

          {!readOnly ? (
            <p className="mt-5 text-xs text-mute">
              Data contoh bisa dihapus dari menu Pengaturan → “Mulai dari awal”.
            </p>
          ) : null}
        </div>
        {!readOnly ? (
          <FormTransaksi terbuka={formBuka} padaTutup={() => setFormBuka(false)} sunting={null} defaultTipe="pemasukan" />
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      {/* Kartu statistik */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard utama label="Saldo kas" nilai={formatRp(saldo)} />
        <StatCard label="Pemasukan" nilai={formatRp(masukTotal)} />
        <StatCard label="Pengeluaran" nilai={formatRp(keluarTotal)} />
      </div>

      {/* Grafik */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="card flex flex-col p-5 lg:col-span-2">
          <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-ink">Arus kas</h2>
              <p className="mt-0.5 text-xs text-mute">
                {jangkauan === "all" ? "Seluruh riwayat sejak awal." : `${jangkauan} bulan terakhir.`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <select
                className="input w-auto min-w-[130px] py-1.5 text-xs font-semibold"
                aria-label="Jangkauan grafik arus kas"
                value={jangkauan}
                onChange={(e) => setJangkauan(e.target.value as typeof jangkauan)}
              >
                <option value="all">Semua waktu</option>
                <option value="3">3 bulan terakhir</option>
                <option value="6">6 bulan terakhir</option>
                <option value="12">12 bulan terakhir</option>
              </select>
              <LegendaArusKas />
            </div>
          </div>
          <div className="mt-4">
            <GrafikArusKas data={seri} />
          </div>
        </div>

        <DonatKategori
          data={donatKategori}
          judul="Pengeluaran"
          sub={bulanDonat === "all" ? "Seluruh riwayat" : labelBulan(bulanDonat)}
          alat={
            <select
              className="input w-auto min-w-[130px] py-1.5 text-xs font-semibold"
              aria-label="Bulan pengeluaran"
              value={bulanDonat}
              onChange={(e) => setBulanDonat(e.target.value)}
            >
              <option value="all">Semua waktu</option>
              {daftarBulan.map((bk) => (
                <option key={bk} value={bk}>
                  {labelBulan(bk)}
                </option>
              ))}
            </select>
          }
        />
      </div>

      {/* Transaksi terbaru */}
      <div className="card flex flex-col p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink">Transaksi terbaru</h2>
            <p className="mt-0.5 text-xs text-mute">Enam catatan terakhir yang masuk.</p>
          </div>
          <button type="button" className="btn-ghost" onClick={() => navigasi("transaksi")}>
            Lihat semua
            <IKON_UI.panah className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <ul className="divide-y divide-line">
          {baruEnam.map((t) => {
            const k = t.kategoriId ? kategoriMap.get(t.kategoriId) : undefined;
            return (
              <li key={t.id} className="flex items-center gap-3.5 py-3">
                {k ? (
                  <AvatarKategori kategori={k} />
                ) : (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-paper text-mute">
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
                <span className={`num text-sm font-bold ${t.tipe === "pemasukan" ? "text-brand" : "text-expense"}`}>
                  {t.tipe === "pemasukan" ? "+" : "−"} {formatRp(t.jumlah)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}