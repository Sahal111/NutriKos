// Dasar perhitungan gizi sesuai proposal Bab 3.6.
// Sumber target: AKG 2019 (Permenkes 28/2019), kelompok usia 19-29 tahun (Tabel 3.2).
import { nutrisiDari } from './recommend';

export const AKG = {
  'Laki-laki': { energi: 2650, protein: 65, karbo: 430, lemak: 75, serat: 37 },
  Perempuan: { energi: 2250, protein: 60, karbo: 360, lemak: 65, serat: 32 },
};

// Target sayur & buah: 5 porsi per hari (SKI 2023 / Isi Piringku).
export const TARGET_SAYUR = 5;

export function targetHarian(jenisKelamin) {
  return { ...(AKG[jenisKelamin] || AKG.Perempuan), sayur: TARGET_SAYUR };
}

// Kunci tanggal berdasarkan zona waktu perangkat (YYYY-MM-DD).
// toISOString() memakai UTC sehingga pukul 00.00-07.00 WIB akan terbaca sebagai hari kemarin.
export function kunciTanggal(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Skor komponen (%) = (rata-rata asupan harian / target harian) x 100, maksimum 100.
const persenMentah = (asupan, target) => (target > 0 ? Math.min(100, Math.max(0, (asupan / target) * 100)) : 0);
export const skorKomponen = (asupan, target) => Math.round(persenMentah(asupan, target));

// Ambang batas indikator sederhana yang ditetapkan tim: >= 80 Cukup, 50-79 Perlu Ditingkatkan, < 50 Kurang.
export function kategoriSkor(skor) {
  if (skor >= 80) return 'Cukup';
  if (skor >= 50) return 'Perlu Ditingkatkan';
  return 'Kurang';
}

// Skor gizi = rata-rata skor protein, karbohidrat, dan sayur.
export function hitungSkor(asupan, target) {
  const mentah = {
    protein: persenMentah(asupan.protein, target.protein),
    karbo: persenMentah(asupan.karbo, target.karbo),
    sayur: persenMentah(asupan.sayur, target.sayur),
  };
  const total = Math.round((mentah.protein + mentah.karbo + mentah.sayur) / 3);
  return {
    komponen: { protein: Math.round(mentah.protein), karbo: Math.round(mentah.karbo), sayur: Math.round(mentah.sayur) },
    total,
    kategori: kategoriSkor(total),
  };
}

// Entri log bisa berupa array id (format lama) atau { ids, porsi } (format baru, menyimpan porsi saat dicatat).
export function asupanDariLog(entri) {
  const ids = Array.isArray(entri) ? entri : entri?.ids || [];
  const porsi = Array.isArray(entri) ? {} : entri?.porsi || {};
  const detail = Object.fromEntries(Object.entries(porsi).map(([id, n]) => [id, { porsi: n }]));
  return nutrisiDari(ids, detail);
}

// Rata-rata asupan harian dari hari-hari yang tercatat. null bila belum ada catatan.
export function rataAsupan(daftar) {
  if (!daftar.length) return null;
  const jumlah = daftar.reduce(
    (t, a) => ({ protein: t.protein + a.protein, karbo: t.karbo + a.karbo, sayur: t.sayur + a.sayur, serat: t.serat + a.serat, kalori: t.kalori + a.kalori, biaya: t.biaya + a.biaya }),
    { protein: 0, karbo: 0, sayur: 0, serat: 0, kalori: 0, biaya: 0 }
  );
  const r1 = (x) => Math.round((x / daftar.length) * 10) / 10;
  return { protein: r1(jumlah.protein), karbo: r1(jumlah.karbo), sayur: r1(jumlah.sayur), serat: r1(jumlah.serat), kalori: Math.round(jumlah.kalori / daftar.length), biaya: Math.round(jumlah.biaya / daftar.length) };
}

// Skor mingguan: rata-rata asupan dari menu yang dicatat dalam 7 hari terakhir terhadap target harian.
// Bila belum ada catatan, memakai menu hari ini sebagai pratinjau (pratinjau = true).
export function skorMingguan({ log, kunci7Hari, planHariIni, detailPlan, jenisKelamin }) {
  const target = targetHarian(jenisKelamin);
  const tercatat = kunci7Hari.filter((k) => log[k]);
  const rata = rataAsupan(tercatat.map((k) => asupanDariLog(log[k])));
  const asupan = rata || nutrisiDari(planHariIni, detailPlan);
  return { target, asupan, skor: hitungSkor(asupan, target), hariTercatat: tercatat.length, pratinjau: !rata };
}
