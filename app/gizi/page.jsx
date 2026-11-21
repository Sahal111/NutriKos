'use client';
import { Plus, Lightbulb, Check } from 'lucide-react';
import { useApp, hariIni } from '@/components/AppProvider';
import { nutrisiDari } from '@/lib/recommend';
import { getRecipe, rupiah, SLOT_LABEL } from '@/lib/data';
import { targetHarian, hitungSkor, kategoriSkor, kunciTanggal, skorMingguan } from '@/lib/gizi';

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const warnaKategori = (skor) =>
  skor >= 80 ? 'bg-brand-light text-brand-dark' : skor >= 50 ? 'bg-accent-light text-amber-800' : 'bg-red-100 text-red-700';

function Nutrisi({ judul, nilai, target, satuan, skor, sumber }) {
  return (
    <div className="card">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="font-extrabold">{judul} <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${warnaKategori(skor)}`}>{kategoriSkor(skor)}</span></div>
          <div className="text-xs text-slate-500">Target: {target} {satuan}/hari</div>
        </div>
        <div className="sm:text-right"><div className="text-xl font-extrabold text-brand-dark">{nilai} {satuan}</div><div className="text-xs text-slate-500">{skor}% tercapai</div></div>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200"><div className={`h-full ${skor >= 80 ? 'bg-brand-dark' : skor >= 50 ? 'bg-accent' : 'bg-red-500'}`} style={{ width: `${skor}%` }} /></div>
      <div className="mt-2 text-xs text-slate-600"><b>Sumber:</b> {sumber}</div>
    </div>
  );
}

export default function Gizi() {
  const { plan, log, logToday, customPlanDetails, profile, ready } = useApp();
  if (!ready) return null;

  const hari = hariIni();
  const minggu = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = kunciTanggal(d);
    return { key, nama: HARI[d.getDay()], tgl: d.getDate(), tercatat: !!log[key], hariIni: key === hari };
  });

  // Skor mingguan: rata-rata asupan dari menu yang dicatat 7 hari terakhir terhadap target AKG (proposal 3.6).
  const { target, asupan, skor, hariTercatat, pratinjau } = skorMingguan({
    log,
    kunci7Hari: minggu.map((m) => m.key),
    planHariIni: plan,
    detailPlan: customPlanDetails,
    jenisKelamin: profile.jenisKelamin,
  });

  // Skor menu hari ini (untuk rasio nutrisi per rupiah)
  const menuHariIni = nutrisiDari(plan, customPlanDetails);
  const skorHariIni = hitungSkor(menuHariIni, target);

  const terendah = Object.entries(skor.komponen).sort((a, b) => a[1] - b[1])[0][0];
  const tips = {
    protein: 'Tambah lauk seperti telur, tahu, atau tempe agar protein harianmu terpenuhi.',
    sayur: 'Sayur dan buahmu masih kurang. Coba tambah tumis kangkung atau lalapan seharga sekitar Rp2.000 dari warteg.',
    karbo: 'Karbohidratmu masih rendah. Tambahkan nasi atau umbi-umbian secukupnya agar tidak lemas.',
  }[terendah];
  const tercatatHariIni = log[hari];

  return (
    <div className="space-y-4 md:space-y-6">
      <div><h1 className="text-2xl font-extrabold sm:text-3xl lg:text-4xl">Gizi Mingguan</h1><p className="text-slate-600 sm:text-lg">Pantau nutrisi seimbang biar tetap fit & hemat bujet</p></div>

      {/* Score card */}
      <section className="card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-slate-500">Skor gizi mingguan</div>
            <div className="text-5xl font-extrabold text-brand-dark">{skor.total}<span className="text-xl text-slate-500"> /100</span></div>
            <div className="mt-1 text-xs text-slate-500">
              {pratinjau ? 'Pratinjau dari menu hari ini. Catat makan harianmu agar skor memakai data 7 hari.' : `Dihitung dari ${hariTercatat} dari 7 hari terakhir yang tercatat.`}
            </div>
          </div>
          <span className={`shrink-0 self-start rounded-full px-3 py-1.5 text-xs font-bold ${warnaKategori(skor.total)}`}>{skor.kategori}</span>
        </div>
        <p className="mt-3 text-xs text-slate-500">Skor = rata-rata skor protein, karbohidrat, dan sayur. Ambang: 80 ke atas Cukup, 50-79 Perlu Ditingkatkan, di bawah 50 Kurang (indikator sederhana yang ditetapkan tim).</p>
        <p className="mt-1 text-xs text-slate-500">Skor hanya menghitung menu yang dicatat di NutriKos, tidak termasuk makanan atau jajan di luar aplikasi. Skor merupakan panduan umum, bukan diagnosis atau pengganti saran ahli gizi.</p>
      </section>

      {/* Nutrisi cards */}
      <div>
        <h2 className="text-xl font-extrabold lg:text-2xl">Target Nutrisi Harian</h2>
        <p className="text-xs text-slate-500">Target mengacu pada AKG 2019 usia 19-29 tahun untuk {profile.jenisKelamin || 'Perempuan'}; ubah di Profil Kos. Sayur dan buah: 5 porsi per hari.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Nutrisi judul="Protein" nilai={asupan.protein} target={target.protein} satuan="g" skor={skor.komponen.protein} sumber="Telur, tahu, tempe, ayam, ikan teri" />
        <Nutrisi judul="Sayur & Buah" nilai={asupan.sayur} target={target.sayur} satuan="porsi" skor={skor.komponen.sayur} sumber="Bayam, kangkung, kol, wortel, tauge, pisang" />
        <Nutrisi judul="Karbohidrat" nilai={asupan.karbo} target={target.karbo} satuan="g" skor={skor.komponen.karbo} sumber="Nasi, oat, roti, jagung, mi" />
      </div>
      <p className="text-xs text-slate-500">Info tambahan (tidak masuk skor): energi {asupan.kalori} dari {target.energi} kkal, serat {asupan.serat} dari {target.serat} g per hari.</p>

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
          <button onClick={logToday} className="btn btn-primary mt-3 w-full"><Plus size={18} /> {tercatatHariIni ? 'Perbarui Catatan Hari Ini' : 'Catat Makan Hari Ini'}</button>
        </section>
      </div>

      {/* Tips and cost ratio: side-by-side on desktop */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <section className="card flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-light text-accent"><Lightbulb /></div><div><div className="font-extrabold">Tips Sehat Anak Kos</div><p className="text-sm text-slate-600">{tips}</p></div></section>
        <section className="card mt-4 lg:mt-0"><div className="text-xs font-bold uppercase text-slate-500">Rasio nutrisi per rupiah (menu hari ini)</div><div className="text-2xl font-extrabold">{rupiah(menuHariIni.biaya)} <span className="text-sm font-medium text-slate-500">/ hari</span></div><p className="text-sm text-slate-600">Untuk skor gizi {skorHariIni.total}/100 dari target harian.</p></section>
      </div>
    </div>
  );
}
