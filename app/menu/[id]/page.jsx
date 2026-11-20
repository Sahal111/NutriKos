'use client';
import { useParams, useRouter } from 'next/navigation';
import { Clock, Flame, ChevronLeft, ShoppingCart, Check } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { getRecipe, rupiah, SLOTS } from '@/lib/data';
import { adaDiStok } from '@/lib/recommend';

function Bar({ label, nilai, target, warna }) {
  return (
    <div>
      <div className="flex justify-between text-sm font-semibold"><span>{label}</span><span>{nilai}g / {target}g target</span></div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full ${warna}`} style={{ width: `${Math.min(100, (nilai / target) * 100)}%` }} /></div>
    </div>
  );
}

export default function DetailResep() {
  const { id } = useParams();
  const router = useRouter();
  const { profile, plan, setPlan, addExtra, ready } = useApp();
  const r = getRecipe(id);
  if (!ready) return null;
  if (!r) return <div className="card">Resep tidak ditemukan.</div>;

  const pilih = () => {
    setPlan([...plan.filter((x) => getRecipe(x)?.slot !== r.slot), r.id].sort((a, b) => SLOTS.indexOf(getRecipe(a).slot) - SLOTS.indexOf(getRecipe(b).slot)));
    router.push('/menu');
  };
  const tambahBelanja = () => { addExtra(r.id); router.push('/belanja'); };
  const biayaBeli = r.bahan.filter((x) => !adaDiStok(profile, x.kunci)).reduce((s, x) => s + x.harga, 0);

  return (
    <div className="space-y-4 pb-4 md:space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-brand-dark transition-colors"><ChevronLeft size={18} /> Kembali</button>

      {/* Desktop: side-by-side hero + info. Mobile: stacked */}
      <div className="lg:flex lg:gap-8">
        {/* Emoji hero */}
        <div className="relative flex h-48 items-center justify-center rounded-2xl bg-brand-light text-8xl sm:h-56 md:h-64 lg:h-72 lg:w-96 lg:shrink-0 xl:w-[28rem]">
          {r.emoji}
          <span className="absolute bottom-3 left-3 rounded-xl bg-white px-3 py-1.5 text-sm"><span className="block text-[10px] uppercase text-slate-500">Estimasi porsi</span><b className="text-lg">{rupiah(r.harga)}</b></span>
          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white"><Flame size={12} /> {r.kalori} kkal</span>
        </div>

        {/* Info section */}
        <div className="mt-4 flex-1 space-y-4 lg:mt-0">
          <h1 className="text-2xl font-extrabold sm:text-3xl">{r.nama}</h1>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="card !p-3"><Clock className="mx-auto text-brand-dark" size={20} /><div className="text-xs text-slate-500">Waktu</div><b>{r.waktu} Menit</b></div>
            <div className="card !p-3"><div className="text-xl">🧑‍🍳</div><div className="text-xs text-slate-500">Alat</div><b>{r.alat.length ? r.alat[0] : 'Tanpa alat'}</b></div>
            <div className="card !p-3"><div className="text-xl">💰</div><div className="text-xs text-slate-500">Perlu dibeli</div><b>{rupiah(biayaBeli)}</b></div>
          </div>

          {/* Nutrisi */}
          <section className="card space-y-3">
            <h2 className="font-extrabold">Rincian Gizi (estimasi)</h2>
            <Bar label="Protein" nilai={r.protein} target={25} warna="bg-brand-dark" />
            <Bar label="Serat" nilai={r.serat} target={10} warna="bg-accent" />
            <Bar label="Karbohidrat" nilai={r.karbo} target={60} warna="bg-slate-500" />
          </section>
        </div>
      </div>

      {/* Bahan & Langkah: side-by-side on desktop */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <section className="card">
          <div className="mb-2 flex justify-between"><h2 className="font-extrabold">Daftar Bahan</h2><span className="text-sm font-bold text-brand-dark">1 porsi</span></div>
          <ul className="space-y-2">
            {r.bahan.map((x) => {
              const punya = adaDiStok(profile, x.kunci);
              return (
                <li key={x.nama} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-5 w-5 items-center justify-center rounded ${punya ? 'bg-brand-dark text-white' : 'border border-slate-300'}`}>{punya && <Check size={14} />}</span>
                    <div><div className="font-semibold">{x.nama}</div><div className="text-xs text-slate-500">{x.qty}{punya ? ' • Stok kos' : ''}</div></div>
                  </div>
                  <span className="text-sm font-semibold">{punya ? 'Gratis' : rupiah(x.harga)}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card mt-4 lg:mt-0">
          <h2 className="mb-3 font-extrabold">Langkah Memasak</h2>
          <ol className="space-y-3">
            {r.langkah.map((l, i) => (
              <li key={i} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-mint text-sm font-bold text-brand-deeper">{i + 1}</span><p className="text-sm text-slate-700">{l}</p></li>
            ))}
          </ol>
        </section>
      </div>

      {/* Action buttons */}
      <div className="grid gap-2 sm:grid-cols-2 lg:max-w-md">
        <button onClick={tambahBelanja} className="btn btn-soft"><ShoppingCart size={18} /> Tambah ke Belanja</button>
        <button onClick={pilih} className="btn btn-primary">Pilih Menu Ini</button>
      </div>
    </div>
  );
}
