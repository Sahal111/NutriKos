'use client';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { ALAT_OPTIONS, PANTANGAN_OPTIONS, rupiah } from '@/lib/data';

const PILIHAN_CEPAT = [{ l: 'Hemat', v: 20000 }, { l: 'Standar', v: 30000 }, { l: 'Leluasa', v: 50000 }];

const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export default function ProfilKos() {
  const router = useRouter();
  const { profile, setProfile, generatePlan, ready } = useApp();
  if (!ready) return null;

  const simpan = () => { generatePlan(); router.push('/'); };

  return (
    <div className="space-y-4 pb-4 md:space-y-6">
      <div className="text-center"><div className="text-xs font-bold uppercase tracking-wide text-brand-dark">Onboarding kos</div><h1 className="text-2xl font-extrabold sm:text-3xl lg:text-4xl">Profil Kos</h1><p className="text-sm text-slate-600 sm:text-base">Atur preferensi makan, bujet harian, dan alat masak di kamar kosmu agar menu lebih pas.</p></div>

      {/* Budget section */}
      <section className="card space-y-3 md:space-y-4">
        <div><h2 className="text-lg font-extrabold">Bujet Makan Harian</h2><p className="text-sm text-slate-500">Berapa target bujet makanmu per hari?</p></div>
        <div className="rounded-xl bg-slate-100 p-4 text-center"><div className="text-sm text-slate-500">Estimasi Alokasi Harian</div><div className="text-3xl font-extrabold text-brand-dark">{rupiah(profile.budget)} <span className="text-sm font-medium">/ hari</span></div></div>
        <input type="range" min={10000} max={100000} step={1000} value={profile.budget} onChange={(e) => setProfile({ budget: Number(e.target.value) })} className="w-full accent-brand-dark" aria-label="Bujet harian" />
        <div className="flex justify-between text-xs font-bold text-slate-500"><span>Rp 10.000</span><span>Rp 100.000</span></div>
        <div className="label">Pilihan cepat anak kos:</div>
        <div className="grid grid-cols-3 gap-2">
          {PILIHAN_CEPAT.map((p) => <button key={p.l} onClick={() => setProfile({ budget: p.v })} className={`rounded-xl py-3 text-sm font-bold transition-colors ${profile.budget === p.v ? 'bg-brand-dark text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>{p.l}<div className="text-xs font-medium opacity-80">{rupiah(p.v)}</div></button>)}
        </div>
        <div className="rounded-xl bg-accent-light p-3 text-sm text-amber-900">Bujet lebih besar memberi pilihan menu lebih beragam, sedangkan bujet hemat tetap bisa bergizi dengan menu sederhana dan memanfaatkan bahan sisa.</div>
      </section>

      {/* Tools section */}
      <section className="card space-y-3 md:space-y-4">
        <div><h2 className="text-lg font-extrabold">Peralatan Masak di Kos</h2><p className="text-sm text-slate-500">Pilih alat yang kamu miliki di kamar atau dapur bersama.</p></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {ALAT_OPTIONS.map((a) => { const on = profile.alat.includes(a); return <button key={a} onClick={() => setProfile({ alat: toggle(profile.alat, a) })} className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold transition-colors ${on ? 'bg-brand-mint text-brand-deeper' : 'bg-slate-100 hover:bg-slate-200'}`}>{a}{on && <Check size={16} />}</button>; })}
        </div>
        <button onClick={() => setProfile({ alat: [] })} className={`w-full rounded-xl px-3 py-3 text-sm font-bold transition-colors ${profile.alat.length === 0 ? 'bg-brand-mint text-brand-deeper' : 'bg-slate-100 hover:bg-slate-200'}`}>Tidak ada alat (hanya beli matang / warteg)</button>
      </section>

      {/* Dietary preferences */}
      <section className="card space-y-3 md:space-y-4">
        <div><h2 className="text-lg font-extrabold">Pantangan & Preferensi</h2><p className="text-sm text-slate-500">Kami sesuaikan rekomendasi agar aman dan nyaman untukmu.</p></div>
        <div className="flex flex-wrap gap-2">
          {PANTANGAN_OPTIONS.map((p) => { const on = profile.pantangan.includes(p); return <button key={p} onClick={() => setProfile({ pantangan: toggle(profile.pantangan, p) })} className={`chip transition-colors ${on ? 'bg-brand-mint text-brand-deeper' : 'hover:bg-slate-200'}`}>{on && <Check size={14} />}{p}</button>; })}
        </div>
      </section>

      {/* Location */}
      <section className="card space-y-3">
        <h2 className="text-lg font-extrabold">Lingkungan Kos</h2>
        <div className="max-w-md"><label className="label" htmlFor="lokasi">Lokasi kos terpilih</label><input id="lokasi" className="input" value={profile.lokasi} onChange={(e) => setProfile({ lokasi: e.target.value })} /></div>
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 sm:justify-center">
        <button onClick={simpan} className="btn btn-primary sm:px-8">Simpan Profil & Lanjut <ArrowRight size={18} /></button>
        <button onClick={() => router.push('/')} className="btn btn-soft">Lewati untuk sekarang</button>
      </div>
    </div>
  );
}
