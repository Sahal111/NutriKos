'use client';
import { Plus, Lightbulb, Check } from 'lucide-react';
import { useApp, hariIni } from '@/components/AppProvider';
import { nutrisiDari } from '@/lib/recommend';
import { getRecipe, rupiah, TARGET_HARIAN, SLOT_LABEL } from '@/lib/data';

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function Nutrisi({ judul, nilai, target, warna, sumber }) {
  const p = Math.round((nilai / target) * 100);
  return (
    <div className="card">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div><div className="font-extrabold">{judul} <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${p >= 85 ? 'bg-brand-light text-brand-dark' : 'bg-accent-light text-amber-800'}`}>{p >= 85 ? 'Optimal' : 'Perlu Ditingkatkan'}</span></div><div className="text-xs text-slate-500">Target: {target}g/hari</div></div>
        <div className="sm:text-right"><div className="text-xl font-extrabold text-brand-dark">{nilai}g</div><div className="text-xs text-slate-500">{p}% tercapai</div></div>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200"><div className={`h-full ${warna}`} style={{ width: `${Math.min(100, p)}%` }} /></div>
      <div className="mt-2 text-xs text-slate-600"><b>Sumber:</b> {sumber}</div>
    </div>
  );
}

export default function Gizi() {
  const { plan, log, logToday, customPlanDetails, ready } = useApp();
  if (!ready) return null;

  const n = nutrisiDari(plan, customPlanDetails);
  const skor = Math.round(((Math.min(1, n.protein / TARGET_HARIAN.protein) + Math.min(1, n.serat / TARGET_HARIAN.serat) + Math.min(1, n.karbo / TARGET_HARIAN.karbo)) / 3) * 100);
  const label = skor >= 85 ? 'Sangat Baik & Seimbang' : skor >= 70 ? 'Cukup Baik & Seimbang' : 'Perlu Ditingkatkan';
  const hari = hariIni();
  const terendah = [['protein', n.protein / TARGET_HARIAN.protein], ['serat', n.serat / TARGET_HARIAN.serat], ['karbo', n.karbo / TARGET_HARIAN.karbo]].sort((a, b) => a[1] - b[1])[0][0];
  const tips = { protein: 'Tambah lauk seperti telur, tahu, atau tempe agar protein harianmu terpenuhi.', serat: 'Kamu masih kurang serat. Coba tambah tumis kangkung atau lalapan seharga sekitar Rp2.000 dari warteg.', karbo: 'Karbohidratmu masih rendah. Tambahkan nasi atau umbi-umbian secukupnya agar tidak lemas.' }[terendah];

  const minggu = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return { key, nama: HARI[d.getDay()], tgl: d.getDate(), tercatat: !!log[key], hariIni: key === hari };
  });
  const tercatatHariIni = log[hari];

  return (
    <div className="space-y-4 md:space-y-6">
      <div><h1 className="text-2xl font-extrabold sm:text-3xl lg:text-4xl">Gizi Mingguan</h1><p className="text-slate-600 sm:text-lg">Pantau nutrisi seimbang biar tetap fit & hemat bujet</p></div>

      {/* Score card */}
      <section className="card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div><div className="text-xs font-bold uppercase text-slate-500">Skor kebugaran kos (hari ini)</div><div className="text-5xl font-extrabold text-brand-dark">{skor}<span className="text-xl text-slate-500"> /100</span></div></div>
          <span className="shrink-0 self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-brand-dark">{label}</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">Catatan: skor ini panduan umum gaya hidup anak kos dan bukan pengganti saran atau diagnosis medis.</p>
      </section>

      {/* Nutrisi cards */}
      <h2 className="text-xl font-extrabold lg:text-2xl">Target Nutrisi Harian</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <Nutrisi judul="Protein" nilai={n.protein} target={TARGET_HARIAN.protein} warna="bg-brand-dark" sumber="Telur, tahu, tempe, ayam, ikan teri" />
        <Nutrisi judul="Sayur & Serat" nilai={n.serat} target={TARGET_HARIAN.serat} warna="bg-accent" sumber="Bayam, kangkung, kol, wortel, tauge" />
        <Nutrisi judul="Karbohidrat" nilai={n.karbo} target={TARGET_HARIAN.karbo} warna="bg-slate-500" sumber="Nasi, oat, roti, jagung, mi" />
      </div>

      {/* Weekly log & today's menu: side-by-side on desktop */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        {/* 7-day calendar */}
        <section className="card">
          <h2 className="mb-3 font-extrabold">Catatan 7 Hari</h2>
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {minggu.map((m) => (
              <div key={m.key} className={`rounded-xl py-2 ${m.hariIni ? 'bg-brand-dark text-white' : 'bg-slate-100'}`}>
                <div className="font-semibold">{m.nama}</div><div className="text-base font-extrabold">{m.tgl}</div>
                <div className="mt-1 flex justify-center">{m.tercatat ? <Check size={14} /> : <span className="opacity-40">-</span>}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Today's menu */}
        <section className="card mt-4 lg:mt-0">
          <div className="mb-2 flex justify-between text-sm font-bold"><span>Menu Hari Ini</span><span className={tercatatHariIni ? 'text-brand-dark' : 'text-slate-400'}>{tercatatHariIni ? 'Tercatat' : 'Belum dicatat'}</span></div>
          <ul className="space-y-1.5 text-sm">
            {plan.map((id) => getRecipe(id)).filter(Boolean).map((r) => {
              const porsi = customPlanDetails?.[r.id]?.porsi || 1;
              return (
                <li key={r.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>
                    <span className="text-xs text-slate-500">{SLOT_LABEL[r.slot]} {porsi > 1 ? `(${porsi} porsi)` : ''}</span>
                    <br />{r.emoji} {r.nama}
                  </span>
                  <span className="text-slate-500 font-semibold">{rupiah(r.harga * porsi)}</span>
                </li>
              );
            })}
          </ul>
          <button onClick={logToday} className="btn btn-primary mt-3 w-full"><Plus size={18} /> Catat Makan Hari Ini</button>
        </section>
      </div>

      {/* Tips and cost ratio: side-by-side on desktop */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <section className="card flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-light text-accent"><Lightbulb /></div><div><div className="font-extrabold">Tips Sehat Anak Kos</div><p className="text-sm text-slate-600">{tips}</p></div></section>
        <section className="card mt-4 lg:mt-0"><div className="text-xs font-bold uppercase text-slate-500">Rasio nutrisi per rupiah</div><div className="text-2xl font-extrabold">{rupiah(n.biaya)} <span className="text-sm font-medium text-slate-500">/ hari</span></div><p className="text-sm text-slate-600">Untuk {skor}% nutrisi harian terpenuhi.</p></section>
      </div>
    </div>
  );
}
