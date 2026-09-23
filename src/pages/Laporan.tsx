import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useFinance } from "../lib/store";
import { dalamBulan, tahunUnik, totalPemasukan, totalPengeluaran } from "../lib/analytics";
import { jumlahPerKategori, renderBulanan } from "../lib/analyticsLaporan";
import { bulanSekarang, formatRp, labelBulan, namaBulan } from "../lib/format";
import { IKON_UI } from "../components/icons";
import { AvatarKategori } from "../components/ui";

function unduhCsv(nama: string, baris: (string | number)[][]): void {
  const csv =
    "\uFEFF" +
    baris
      .map((r) => r.map((kol) => `"${String(kol).replace(/"/g, '""')}"`).join(","))
      .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function KartuExport({
  judul,
  sub,
  ikon,
  padaUnduh,
  anak,
}: {
  judul: string;
  sub: string;
  ikon: LucideIcon;
  padaUnduh?: () => void;
  anak?: ReactNode;
}) {
  const Ico = ikon;
  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-ink">{judul}</h2>
          <p className="mt-0.5 text-xs text-mute">{sub}</p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand">
          <Ico className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      {anak}
      {padaUnduh ? (
        <button type="button" className="btn-ghost mt-4 w-full" onClick={padaUnduh}>
          <IKON_UI.fileDown className="h-4 w-4" aria-hidden="true" />
          Unduh CSV
        </button>
      ) : null}
    </div>
  );
}

export function LaporanPage() {
  const { data } = useFinance();
  const [bulan, setBulan] = useState(bulanSekarang());
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const tahunList = tahunUnik(data.transaksi);

  const trxBulan = useMemo(() => dalamBulan(data.transaksi, bulan), [data.transaksi, bulan]);
  const perKategori = useMemo(() => jumlahPerKategori(trxBulan, data.kategori), [trxBulan, data.kategori]);
  const rekapBulanan = useMemo(() => renderBulanan(data.transaksi, tahun), [data.transaksi, tahun]);

  const unduhDetailBulan = () => {
    if (trxBulan.length === 0) return;
    const kMap = new Map(data.kategori.map((k) => [k.id, k.nama]));
    const baris: (string | number)[][] = [
      ["Tanggal", "Jenis", "Kategori", "Keterangan", "Jumlah (Rp)"],
      ...trxBulan
        .slice()
        .sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1))
        .map((t) => [
          t.tanggal,
          t.tipe,
          t.kategoriId ? (kMap.get(t.kategoriId) ?? "Tanpa kategori") : "Tanpa kategori",
          t.keterangan,
          t.tipe === "pemasukan" ? t.jumlah : -t.jumlah,
        ]),
    ];
    unduhCsv(`rq-keuangan-${bulan}.csv`, baris);
  };

  const unduhRekapTahun = () => {
    if (rekapBulanan.length === 0) return;
    const baris: (string | number)[][] = [
      ["Bulan", "Pemasukan", "Pengeluaran", "Selisih"],
      ...rekapBulanan.map((r) => [r.paduan, r.pemasukan, r.pengeluaran, r.selisih]),
    ];
    unduhCsv(`rq-keuangan-rekap-${tahun}.csv`, baris);
  };

  const rekapTahun = rekapBulanan.filter((r) => r.bulanKey.endsWith(`-${String(tahun)}`));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <KartuExport
          judul="Rekap bulan ini"
          sub="Detail setiap transaksi dalam bulan pilihan."
          ikon={IKON_UI.history}
          padaUnduh={trxBulan.length > 0 ? unduhDetailBulan : undefined}
          anak={
            <div className="mt-4">
              <input
                type="month"
                className="input w-full"
                aria-label="Pilih bulan untuk laporan"
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
              />
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-paper p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">Masuk</p>
                  <p className="num mt-1 text-sm font-bold text-brand">{formatRp(totalPemasukan(trxBulan))}</p>
                </div>
                <div className="rounded-xl bg-paper p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">Keluar</p>
                  <p className="num mt-1 text-sm font-bold text-expense">{formatRp(totalPengeluaran(trxBulan))}</p>
                </div>
                <div className="rounded-xl bg-paper p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">Selisih</p>
                  <p className="num mt-1 text-sm font-bold">
                    {formatRp(totalPemasukan(trxBulan) - totalPengeluaran(trxBulan))}
                  </p>
                </div>
              </div>
            </div>
          }
        />

        <KartuExport
          judul="Rekap tahunan"
          sub="Ikhtisar 12 bulan dalam satu tahun."
          ikon={IKON_UI.chart}
          padaUnduh={rekapTahun.length > 0 ? unduhRekapTahun : undefined}
          anak={
            <div className="mt-4">
              <select
                className="input w-full"
                aria-label="Pilih tahun untuk laporan"
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
              >
                {tahunList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div className="mt-4 space-y-1.5">
                {rekapTahun.map((r) => (
                  <div key={r.bulanKey} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 font-medium text-mute">{namaBulan(Number(r.bulanKey.split("-")[1]) - 1)}</span>
                    <span className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-paper sm:block">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: "100%", background: "var(--c-line)" }}
                      />
                    </span>
                    <span className="num w-28 text-right text-xs text-mute">{formatRp(r.selisih)}</span>
                  </div>
                ))}
                {rekapTahun.length === 0 ? (
                  <p className="py-6 text-center text-sm text-mute">Belum ada catatan di tahun {tahun}.</p>
                ) : null}
              </div>
            </div>
          }
        />
      </div>

      {/* Rincian kategori */}
      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-ink">Rincian kategori • {labelBulan(bulan)}</h2>
            <p className="mt-0.5 text-xs text-mute">Ringkasan per kategori untuk laporan bulanan.</p>
          </div>
        </div>

        {trxBulan.length === 0 ? (
          <div className="py-10 text-center text-sm text-mute">Belum ada transaksi pada bulan ini.</div>
        ) : (
          <ul className="divide-y divide-line">
            {perKategori.map((r) => (
              <li key={r.kategori.id} className="flex items-center gap-3 py-3">
                <AvatarKategori kategori={r.kategori} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-ink">{r.kategori.nama}</p>
                    <p className="num shrink-0 text-sm font-bold text-ink">{formatRp(r.jumlah)}</p>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${r.persen}%`, background: r.kategori.warna }}
                    />
                  </div>
<p className="mt-1 text-xs text-mute">
                    {r.banyak} catatan · {r.persen}% dari total {r.tipe === "pemasukan" ? "masuk" : "keluar"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}