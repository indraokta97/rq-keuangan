import { useEffect } from "react";
import { FinanceProvider, useFinance } from "./lib/store";
import { Layout } from "./components/Layout";
import { useRoute } from "./lib/router";
import { Dashboard } from "./pages/Dashboard";
import { TransaksiPage } from "./pages/Transaksi";
import { KategoriPage } from "./pages/Kategori";
import { LaporanPage } from "./pages/Laporan";
import { PengaturanPage } from "./pages/Pengaturan";

function Konten() {
  const { readOnly } = useFinance();
  const rute = useRoute();
  const ruteTerbuka = !readOnly || rute === "dashboard" || rute === "transaksi";
  useEffect(() => {
    if (!ruteTerbuka) window.location.hash = "/dashboard";
  }, [ruteTerbuka, rute]);
  if (!ruteTerbuka) return <Dashboard />;
  if (rute === "transaksi") return <TransaksiPage />;
  if (rute === "kategori") return <KategoriPage />;
  if (rute === "laporan") return <LaporanPage />;
  if (rute === "pengaturan") return <PengaturanPage />;
  return <Dashboard />;
}

export default function App() {
  return (
    <FinanceProvider>
      <Layout>
        <Konten />
      </Layout>
    </FinanceProvider>
  );
}
