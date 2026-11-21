'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Sparkles, Refrigerator, X, Plus, GraduationCap, Dices } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import RecipeCard from '@/components/RecipeCard';
import { getRecipe, rupiah } from '@/lib/data';
import { nutrisiDari, allowedRecipes } from '@/lib/recommend';
import { mintaAI } from '@/lib/ai';
import { targetHarian, hitungSkor } from '@/lib/gizi';

export default function Beranda() {
  const router = useRouter();
  const { profile, plan, setPlan, generatePlan, setProfile, setAi, catatRiwayat, customPlanDetails, setTriggerAiModal, ready } = useApp();
  const [bahanBaru, setBahanBaru] = useState('');
  const [loading, setLoading] = useState(false);
  if (!ready) return null;

  const resep = plan.map(getRecipe).filter(Boolean);
  const n = nutrisiDari(plan, customPlanDetails);
  const sisa = profile.budget - n.biaya;
  const persenTerpakai = Math.min(100, Math.round((n.biaya / profile.budget) * 100));
  const target = targetHarian(profile.jenisKelamin);
  const skor = hitungSkor(n, target);
  const nama = profile.nama.split(' ')[0];

  const tambahBahan = () => {
    const v = bahanBaru.trim();
    if (!v) return;
    if (!profile.stok.some((s) => s.toLowerCase() === v.toLowerCase())) setProfile({ stok: [...profile.stok, v] });
    setBahanBaru('');
  };
  const rekomendasi = async () => {
    setLoading(true);
    const hasil = await mintaAI('menu', profile);
    if (hasil && hasil.ids?.length) { setPlan(hasil.ids); catatRiwayat(hasil.ids); setAi({ alasan: hasil.alasan, sumber: hasil.sumber }); }
    else { generatePlan(); setAi({ alasan: 'Dipilih berdasarkan bujet, alat masak, dan pantanganmu (mode aturan).', sumber: 'aturan' }); }
    setLoading(false);
    setTriggerAiModal?.(true);
    router.push('/menu');
  };
  const acak = () => {
    const list = allowedRecipes(profile);
    if (list.length) router.push(`/menu/${list[Math.floor(Math.random() * list.length)].id}`);
  };

  return (
    <div className="space-y-5 md:space-y-6 lg:space-y-8">
      {/* Hero greeting */}
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-mint px-3 py-1 text-xs font-bold text-brand-deeper">
          <GraduationCap size={14} /> Anak Kos Hemat Cerdas • UNUSIA Kab. Bogor
        </span>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl lg:text-4xl">Halo, {nama}! 👋</h1>
        <p className="text-slate-600 sm:text-lg">Yuk atur menu sehat, lezat, dan tetap hemat di kantong hari ini!</p>
      </div>

      {/* Budget & CTA section */}
      <section className="card space-y-3 md:space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-slate-500">Sisa bujet hari ini</div>
            <div className={`text-2xl font-extrabold lg:text-3xl ${sisa < 0 ? 'text-red-600' : 'text-brand-dark'}`}>{rupiah(sisa)}</div>
          </div>
          <div className="text-sm text-slate-600 sm:text-right">
            <div>Target: {rupiah(profile.budget)}</div>
            <div>Terpakai: <b>{rupiah(n.biaya)}</b></div>
          </div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-brand-dark transition-all" style={{ width: `${persenTerpakai}%` }} /></div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button className="btn btn-primary disabled:opacity-70" disabled={loading} onClick={rekomendasi}><Sparkles size={18} /> {loading ? 'Menyusun menu...' : 'Rekomendasikan Menu'}</button>
          <Link href="/bahan-sisa" className="btn btn-soft"><Refrigerator size={18} /> Cek Bahan Sisa</Link>
        </div>
      </section>

      {/* Alat & Bahan Kos */}
      <section className="space-y-3">
        <h2 className="text-xl font-extrabold lg:text-2xl">Alat & Bahan Kos</h2>
        <div className="flex flex-wrap gap-2">
          {profile.alat.map((a) => <span key={a} className="chip chip-on">✓ {a}</span>)}
          <Link href="/profil-kos" className="chip">+ Ubah alat</Link>
        </div>
        <div className="card">
          <div className="mb-2 flex justify-between text-sm font-semibold"><span>Bahan tersimpan di kos:</span><span className="text-brand-dark">{profile.stok.length} bahan</span></div>
          <div className="flex flex-wrap gap-2">
            {profile.stok.map((s) => (
              <span key={s} className="chip">{s}
                <button aria-label={`Hapus ${s}`} onClick={() => setProfile({ stok: profile.stok.filter((x) => x !== s) })}><X size={14} /></button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input className="input" placeholder="Tambah bahan (misal: Tahu)" value={bahanBaru} onChange={(e) => setBahanBaru(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && tambahBahan()} />
            <button className="btn btn-primary shrink-0" onClick={tambahBahan} aria-label="Tambah bahan"><Plus size={18} /></button>
          </div>
        </div>
      </section>

      {/* Menu Hari Ini */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div><h2 className="text-xl font-extrabold lg:text-2xl">Menu Hari Ini</h2><p className="text-sm text-slate-500">{resep.length} santapan cerdas pas bujet {rupiah(profile.budget)}</p></div>
        </div>
        {resep.length === 0 && <div className="card text-sm text-slate-600">Belum ada menu yang cocok dengan alat dan pantanganmu. Coba ubah di Profil Kos.</div>}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {resep.map((r) => {
            const porsi = customPlanDetails?.[r.id]?.porsi || 1;
            return <RecipeCard key={r.id} recipe={r} action porsi={porsi} />;
          })}
        </div>
      </section>

      {/* Skor Gizi */}
      <section className="card">
        <div className="text-lg font-extrabold lg:text-xl">Skor Gizi Menu Hari Ini: {skor.total}/100 <span className="text-sm font-bold text-slate-500">({skor.kategori})</span></div>
        <p className="mt-1 text-sm text-slate-600">Protein {n.protein}g • Karbo {n.karbo}g • Sayur & buah {n.sayur} porsi (target harian {target.protein}g / {target.karbo}g / {target.sayur} porsi). <Link href="/gizi" className="font-bold text-brand-dark underline">Lihat skor mingguan</Link></p>
      </section>

      {/* Ide Masak Acak */}
      <section className="flex flex-col gap-3 rounded-2xl bg-accent p-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div><div className="text-xs font-bold uppercase opacity-90">Bingung mau masak apa?</div><div className="text-xl font-extrabold">Ide Masak Acak</div></div>
        <button onClick={acak} className="btn bg-amber-900 text-white shrink-0"><Dices size={18} /> Coba Sekarang</button>
      </section>
    </div>
  );
}
