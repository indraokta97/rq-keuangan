import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { formatCompact, formatRp } from "../lib/format";
import type { RingkasanKategori } from "../lib/analytics";
import { TEMA } from "../lib/theme";
import { IkonKategori } from "./icons";

const TIK_JADI = (n: unknown) => formatCompact(Number(n));

function TipArea({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-card px-3.5 py-2.5 text-xs shadow-pop">
      <p className="mb-1.5 font-bold text-ink">{String(label)}</p>
      {payload.map((p) => (
        <p key={String(p.name)} className="num flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-mute">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden="true" />
            {String(p.name)}
          </span>
          <span className="font-semibold text-ink">{formatRp(Number(p.value ?? 0))}</span>
        </p>
      ))}
    </div>
  );
}

export function GrafikArusKas({ data }: { data: { label: string; pemasukan: number; pengeluaran: number }[] }) {
  const id = "grad-arus";
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TEMA.income} stopOpacity={0.25} />
              <stop offset="100%" stopColor={TEMA.income} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id={`${id}-peng`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TEMA.expense} stopOpacity={0.22} />
              <stop offset="100%" stopColor={TEMA.expense} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={TEMA.line} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: TEMA.mute, fontSize: 12 }} dy={6} />
          <YAxis tickLine={false} axisLine={false} width={54} tickFormatter={TIK_JADI} tick={{ fill: TEMA.mute, fontSize: 11 }} />
          <Tooltip content={TipArea} cursor={{ stroke: TEMA.line }} />
          <Area
            type="monotone"
            dataKey="pemasukan"
            name="Pemasukan"
            stroke={TEMA.income}
            strokeWidth={2.5}
            fill={`url(#${id})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Area
            type="monotone"
            dataKey="pengeluaran"
            name="Pengeluaran"
            stroke={TEMA.expense}
            strokeWidth={2.5}
            fill={`url(#${id}-peng)`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function Keterangan({
  judul,
  warna,
  nilai,
}: {
  judul: string;
  warna: string;
  nilai?: string;
}) {
  return (
    <span className="flex items-center gap-2 text-xs text-mute">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: warna }} aria-hidden="true" />
      {judul}
      {nilai ? <span className="num font-semibold text-ink">{nilai}</span> : null}
    </span>
  );
}

export function LegendaArusKas({ totalMasuk, totalKeluar }: { totalMasuk?: number; totalKeluar?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <Keterangan judul="Pemasukan" warna={TEMA.income} nilai={totalMasuk !== undefined ? formatCompact(totalMasuk) : undefined} />
      <Keterangan judul="Pengeluaran" warna={TEMA.expense} nilai={totalKeluar !== undefined ? formatCompact(totalKeluar) : undefined} />
    </div>
  );
}

function TipPie(props: TooltipContentProps) {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as unknown as RingkasanKategori;
  return (
    <div className="rounded-xl border border-line bg-card px-3.5 py-2.5 text-xs shadow-pop">
      <p className="flex items-center gap-2 font-bold text-ink">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.kategori.warna }} aria-hidden="true" />
        {d.kategori.nama}
      </p>
      <p className="num mt-1 text-mute">
        {formatRp(d.jumlah)} <span className="text-ink">· {Math.round(d.porsi * 100)}%</span>
      </p>
    </div>
  );
}

export function DonatKategori({
  data,
  judul,
  sub,
  alat,
}: {
  data: RingkasanKategori[];
  judul: string;
  sub?: string;
  children?: ReactNode;
  alat?: ReactNode;
}) {
  const kosong = data.length === 0;
  const total = data.reduce((a, d) => a + d.jumlah, 0);

  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink">{judul}</h3>
          {sub ? <p className="mt-0.5 text-xs text-mute">{sub}</p> : null}
        </div>
        {alat ?? (total > 0 ? <p className="num text-sm font-bold text-ink">{formatCompact(total)}</p> : null)}
      </div>

      {kosong ? (
        <div className="grid flex-1 place-items-center py-10 text-center">
          <p className="max-w-[220px] text-sm text-mute">Belum ada catatan untuk rentang ini.</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col">
          <div className="relative mx-auto h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="jumlah"
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((d) => (
                    <Cell key={d.kategori.id} fill={d.kategori.warna} />
                  ))}
                </Pie>
                <Tooltip content={TipPie} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <p className="text-center">
                <span className="num block text-xl font-bold text-ink">{data.length}</span>
                <span className="text-[11px] text-mute">kategori</span>
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-2.5">
            {data.slice(0, 5).map((d) => (
              <li key={d.kategori.id} className="flex items-center gap-3 text-sm">
                <IkonKategori nama={d.kategori.ikon} className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">
                  <span className="font-medium text-ink">{d.kategori.nama}</span>
                  <span className="ml-2 text-xs text-mute">{formatCompact(d.jumlah)}</span>
                </span>
                <span className="num w-10 text-right text-xs font-semibold" style={{ color: d.kategori.warna }}>
                  {Math.round(d.porsi * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
