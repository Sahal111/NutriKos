'use client';
import Link from 'next/link';
import { Heart, History } from 'lucide-react';
import { useApp } from './AppProvider';
import { getRecipe, rupiah } from '@/lib/data';

function Baris({ resepId, tanggal }) {
  const r = getRecipe(resepId);
  if (!r) return null;
  return (
    <li>
      <Link href={`/menu/${r.id}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100">
        <span className="truncate pr-2">{r.emoji} {r.nama}</span>
        <span className="shrink-0 text-xs font-semibold text-slate-500">{tanggal ? `${tanggal} • ` : ''}{rupiah(r.harga)}</span>
      </Link>
    </li>
  );
}

// F6: menu favorit dan riwayat menu pengguna.
export default function FavoritRiwayat() {
  const { favorit, riwayat } = useApp();
  const terbaru = [...riwayat].reverse().slice(0, 8);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card">
        <h2 className="mb-2 flex items-center gap-2 font-extrabold"><Heart size={18} className="text-red-600" /> Menu Favorit ({favorit.length})</h2>
        {favorit.length === 0 ? <p className="text-sm text-slate-500">Belum ada favorit. Tekan ikon hati pada kartu menu untuk menyimpan.</p> : <ul className="space-y-1.5">{favorit.map((f) => <Baris key={f.resepId} resepId={f.resepId} />)}</ul>}
      </section>
      <section className="card">
        <h2 className="mb-2 flex items-center gap-2 font-extrabold"><History size={18} className="text-brand-dark" /> Riwayat Menu</h2>
        {terbaru.length === 0 ? <p className="text-sm text-slate-500">Riwayat muncul setelah kamu meminta rekomendasi menu.</p> : <ul className="space-y-1.5">{terbaru.map((x) => <Baris key={`${x.resepId}-${x.tanggal}`} resepId={x.resepId} tanggal={x.tanggal} />)}</ul>}
      </section>
    </div>
  );
}
