import { useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useFinance } from "../lib/store";
import { formatRp, hariIniISO, hashSandi, KUNCI_SESI } from "../lib/format";
import { IKON_UI } from "../components/icons";
import type { AppData } from "../lib/types";
import { Konfirmasi } from "../components/ui";
import { tautanLihat } from "../lib/router";

function Bagian({ judul, sub, children }: { judul: string; sub: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="text-sm font-extrabold text-ink">{judul}</h2>
      <p className="mt-0.5 text-xs text-mute">{sub}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function KartuPenyimpanan() {
  const { mode, menyimpan } = useFinance();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-paper p-4">
      {mode === "postgres" ? (
        <IKON_UI.cloud className="h-6 w-6 text-brand" aria-hidden="true" />
      ) : (
        <IKON_UI.laptop className="h-6 w-6 text-gold" aria-hidden="true" />
      )}
      <div className="flex-1">
        <p className="text-sm font-bold text-ink">
          {mode === "postgres" ? "Database cloud (Neon Postgres)" : "Lokal di browser"}
        </p>
        <p className="text-xs text-mute">
          {mode === "postgres"
            ? "Terhubung ke server. Data bisa diakses dari perangkat lain yang memakai URL yang sama."
            : "Belum ada database terhubung. Data hanya tersimpan di browser ini — rutinlah mengunduh backup."}
        </p>
      </div>
      <span className={`chip ${mode === "postgres" ? "bg-brand-soft text-brand-deep" : "bg-amber-100 text-gold"}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        {menyimpan ? "menyimpan…" : "aktif"}
      </span>
    </div>
  );
}

export function PengaturanPage() {
  const { data, readOnly, terkunci, terbukaKunci, kunciSesi, menyimpan, simpanPengaturan, restore, muatContoh, hapusSemua } = useFinance();
  const [nama, setNama] = useState(data.pengaturan.namaOrganisasi);
  const [saldoStr, setSaldoStr] = useState(String(data.pengaturan.saldoAwal));
  const [tahunMulai, setTahunMulai] = useState(String(data.pengaturan.tahunMulai));
  const [sibuk, setSibuk] = useState(false);
  const [notif, setNotif] = useState<string | null>(null);
  const [konfirmasiReset, setKonfirmasiReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const tautan = tautanLihat();
  const [sandiBaru, setSandiBaru] = useState("");
  const [sandiUlang, setSandiUlang] = useState("");
  const [lihatSandi, setLihatSandi] = useState(false);

  if (readOnly) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <Bagian judul="Mode lihat" sub="Anda membuka lewat tautan tampilan pengunjung.">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-paper p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-gold">
              <IKON_UI.lihat className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-ink">Hanya bisa melihat</p>
              <p className="text-xs text-mute">
                Tautan ini memperlihatkan seluruh catatan kas tanpa tombol ubah, hapus, atau isi data — aman untuk dibagikan ke pengurus dan santri.
              </p>
            </div>
          </div>
        </Bagian>
        <Bagian judul="Penyimpanan data" sub="Ke mana catatan kas ini disimpan.">
          <KartuPenyimpanan />
        </Bagian>
        <footer className="pb-4 text-center text-xs text-mute">
          Dibuat dengan hati untuk amanah Rumah Quran UGM ❤️
        </footer>
      </div>
    );
  }

  const saldo = Math.max(0, Number(saldoStr.replace(/\D/g, "")) || 0);
  const tahunVal = Number(tahunMulai) || new Date().getFullYear();

  const salinTautan = async () => {
    try {
      await navigator.clipboard.writeText(tautan);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = tautan;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setNotif("Tautan tampilan pengunjung disalin.");
    setTimeout(() => setNotif(null), 3000);
  };

  const simpan = async (e: FormEvent) => {
    e.preventDefault();
    setSibuk(true);
    try {
      await simpanPengaturan({
        namaOrganisasi: nama.trim() || "Rumah Quran UGM",
        saldoAwal: saldo,
        tahunMulai: tahunVal,
        catatanBulanan: true,
        kataSandi: data.pengaturan.kataSandi || "",
      });
      setNotif("Pengaturan tersimpan.");
      setTimeout(() => setNotif(null), 3000);
    } finally {
      setSibuk(false);
    }
  };

  const simpanSandi = async (e: FormEvent) => {
    e.preventDefault();
    const s = sandiBaru;
    if (s.length < 4 && s.length > 0) {
      setNotif("Kata sandi minimal 4 karakter.");
      setTimeout(() => setNotif(null), 4000);
      return;
    }
    if (s && s !== sandiUlang) {
      setNotif("Kata sandi tidak sama dengan ulangan.");
      setTimeout(() => setNotif(null), 4000);
      return;
    }
    setSibuk(true);
    try {
      const kataSandi = s ? await hashSandi(s) : "";
      await simpanPengaturan({
        namaOrganisasi: nama.trim() || "Rumah Quran UGM",
        saldoAwal: saldo,
        tahunMulai: tahunVal,
        catatanBulanan: true,
        kataSandi,
      });
      if (kataSandi) localStorage.setItem(KUNCI_SESI, "1");
      setSandiBaru("");
      setSandiUlang("");
      setLihatSandi(false);
      setNotif(kataSandi ? "Kata sandi tersimpan. Pengunjung sekarang hanya bisa melihat." : "Kunci pengelola dinonaktifkan — semua orang bisa mengelola.");
      setTimeout(() => setNotif(null), 5000);
    } finally {
      setSibuk(false);
    }
  };

  const unduhBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-rq-keuangan-${hariIniISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setNotif("Backup terunduh.");
    setTimeout(() => setNotif(null), 3000);
  };

  const padaFile = (f: File) => {
    const baca = new FileReader();
    baca.onload = () => {
      try {
        const d = JSON.parse(String(baca.result)) as AppData;
        if (!Array.isArray(d.kategori) || !Array.isArray(d.transaksi) || !d.pengaturan) {
          throw new Error("format salah");
        }
        void restore(d).then(() => {
          setNotif("Backup dipulihkan.");
          setTimeout(() => setNotif(null), 3000);
        });
      } catch {
        setNotif("File backup tidak valid.");
        setTimeout(() => setNotif(null), 4000);
      }
    };
    baca.readAsText(f);
  };

  const tombolReset = async () => {
    setKonfirmasiReset(false);
    setSibuk(true);
    try {
      await hapusSemua();
      setNama("Rumah Quran UGM");
      setSaldoStr("0");
      setTahunMulai(String(new Date().getFullYear()));
      setNotif("Data direset. Mulai dari awal.");
      setTimeout(() => setNotif(null), 3000);
    } finally {
      setSibuk(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      {notif ? (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm font-semibold text-brand-deep">
          <IKON_UI.cek className="h-4 w-4" aria-hidden="true" />
          {notif}
        </div>
      ) : null}

      <Bagian judul="Identitas lembaga" sub="Nama yang tampil pada aplikasi dan laporan.">
        <form onSubmit={simpan} className="space-y-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Nama lembaga
            <input className="input" value={nama} maxLength={60} onChange={(e) => setNama(e.target.value)} required />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Saldo awal kas <span className="font-normal text-mute">(sebelum dicatat di aplikasi)</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-mute">Rp</span>
                <input
                  inputMode="numeric"
                  className="input num pl-9"
                  value={saldoStr}
                  onChange={(e) => setSaldoStr(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="0"
                />
              </div>
              {saldo > 0 ? <span className="num text-xs text-mute">= {formatRp(saldo)}</span> : null}
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Tahun mulai pembukuan
              <input
                inputMode="numeric"
                className="input num"
                value={tahunMulai}
                min={2000}
                max={2100}
                onChange={(e) => setTahunMulai(e.target.value.replace(/[^\d]/g, ""))}
              />
            </label>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button type="submit" className="btn-primary" disabled={sibuk}>
              {sibuk ? <IKON_UI.muat className="h-4 w-4 animate-spin" /> : <IKON_UI.cek className="h-4 w-4" />}
              Simpan identitas
            </button>
          </div>
        </form>
      </Bagian>

      <Bagian judul="Penyimpanan data" sub="Ke mana catatan kas Anda disimpan.">
        <KartuPenyimpanan />
      </Bagian>

      <Bagian judul="Tampilan pengunjung" sub="Bagikan tautan hanya-lihat ke pengurus lain, donatur, atau publik.">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Tautan lihat (read-only)
            <div className="flex items-center gap-2">
              <input className="input" readOnly value={tautan} onFocus={(e) => e.target.select()} aria-label="Tautan tampilan pengunjung" />
              <button type="button" className="btn-primary shrink-0" onClick={() => void salinTautan()}>
                <IKON_UI.fileDown className="h-4 w-4" aria-hidden="true" />
                Salin
              </button>
            </div>
          </label>
          <p className="text-xs text-mute">
            Siapa pun yang membuka tautan ini hanya bisa <strong className="font-semibold text-ink">melihat</strong> rekap, grafik, dan laporan — tidak ada tombol untuk mengubah atau menghapus data.
          </p>
        </div>
      </Bagian>

      <Bagian judul="Keamanan & masuk" sub="Kunci data agar pengunjung hanya bisa melihat; pengelola harus masuk dulu untuk mengubah.">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-paper p-4">
          <span className={`grid h-10 w-10 place-items-center rounded-xl ${terkunci ? "bg-brand-soft text-brand" : "bg-amber-100 text-gold"}`}>
            <IKON_UI.shield className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink">
              {terkunci ? "Kunci pengelola aktif" : "Kunci pengelola belum dipasang"}
            </p>
            <p className="text-xs text-mute">
              {terkunci
                ? terbukaKunci
                  ? "Sesi browser ini sudah masuk sebagai pengelola."
                  : "Pengunjung terbuka lewat tautan utama hanya bisa melihat data."
                : "Tanpa kata sandi, siapa pun yang membuka aplikasi bisa langsung mengelola."}
            </p>
          </div>
          {menyimpan ? (
            <IKON_UI.muat className="h-5 w-5 animate-spin text-mute" aria-hidden="true" />
          ) : terkunci ? (
            <span className={`chip ${terbukaKunci ? "bg-brand-soft text-brand-deep" : "bg-paper text-mute"}`}>
              {terbukaKunci ? "masuk" : "terkunci"}
            </span>
          ) : (
            <span className="chip bg-amber-100 text-gold">terbuka</span>
          )}
        </div>

        <form onSubmit={simpanSandi} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Kata sandi baru
              <div className="relative">
                <input
                  type={lihatSandi ? "text" : "password"}
                  className="input pr-11"
                  value={sandiBaru}
                  autoComplete="new-password"
                  placeholder={terkunci ? "••••••••" : "min. 4 karakter"}
                  onChange={(e) => setSandiBaru(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setLihatSandi((v) => !v)}
                  aria-label={lihatSandi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-mute transition hover:text-ink"
                >
                  <IKON_UI.lihat className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Ulangi kata sandi
              <input
                type={lihatSandi ? "text" : "password"}
                className="input"
                value={sandiUlang}
                maxLength={100}
                autoComplete="new-password"
                placeholder="ketik sekali lagi"
                onChange={(e) => setSandiUlang(e.target.value)}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {terkunci && terbukaKunci ? (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  kunciSesi();
                  setNotif("Sesi dikunci. Browser dianggap pengunjung lagi.");
                  setTimeout(() => setNotif(null), 4000);
                }}
              >
                <IKON_UI.lock className="h-4 w-4" aria-hidden="true" />
                Kunci sesi sekarang
              </button>
            ) : null}
            <button type="submit" className="btn-primary" disabled={sibuk}>
              {sibuk ? <IKON_UI.muat className="h-4 w-4 animate-spin" /> : <IKON_UI.cek className="h-4 w-4" />}
              Simpan kata sandi
            </button>
          </div>
          <p className="text-xs text-mute">
            Untuk menghapus kunci, kosongkan kolom kata sandi lalu simpan. Kata sandi disimpan sebagai hash, bukan teks asli.
          </p>
        </form>
      </Bagian>

      <Bagian judul="Backup & pemulihan" sub="Amankan data dengan cadangan berkas.">
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" className="btn-ghost" onClick={unduhBackup}>
            <IKON_UI.fileDown className="h-4 w-4" aria-hidden="true" />
            Unduh backup (JSON)
          </button>
          <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
            <IKON_UI.fileUp className="h-4 w-4" aria-hidden="true" />
            Pulihkan dari berkas
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Pilih file backup"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) padaFile(f);
              e.target.value = "";
            }}
          />
        </div>
        <p className="mt-3 text-xs text-mute">Format default CSV untuk rekap tersedia di menu Laporan.</p>
      </Bagian>

      <Bagian judul="Gunakan data contoh" sub="Isi aplikasi dengan catatan percobaan untuk melihat caranya.">
        <button type="button" className="btn-ghost" onClick={muatContoh} disabled={sibuk}>
          {sibuk ? <IKON_UI.muat className="h-4 w-4 animate-spin" /> : <IKON_UI.sparkle className="h-4 w-4" />}
          Muat data contoh
        </button>
      </Bagian>

      <Bagian judul="Zona berbahaya" sub="Semua catatan akan dihapus permanen.">
        <button type="button" className="btn-danger" onClick={() => setKonfirmasiReset(true)} disabled={sibuk}>
          <IKON_UI.reset className="h-4 w-4" aria-hidden="true" />
          Mulai dari awal (hapus semua data)
        </button>
      </Bagian>

      <footer className="pb-4 text-center text-xs text-mute">
        Dibuat dengan hati untuk amanah Rumah Quran UGM ❤️
      </footer>

      <Konfirmasi
        open={konfirmasiReset}
        judul="Hapus semua data?"
        pesan="Seluruh catatan transaksi dan pengaturan akan dihapus. Pastikan Anda sudah mengunduh backup."
        tombol="Ya, hapus semua"
        memuat={sibuk}
        padaBatal={() => setKonfirmasiReset(false)}
        padaSetuju={() => void tombolReset()}
      />
    </div>
  );
}