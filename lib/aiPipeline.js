// Pengendalian keluaran AI (proposal 3.7, langkah 3-4).
// AI hanya memilih id resep + alasan. Semua hasil divalidasi di server; bila gagal, coba sekali lagi;
// bila masih gagal atau layanan AI tidak tersedia, pemanggil memakai rekomendasi berbasis aturan.
import { SLOTS, PANTANGAN_TAG, getRecipe } from './data';
import { nutrisiDari } from './recommend';

export function parseJson(teks) {
  const potong = String(teks).replace(/```json|```/g, '').trim();
  const mulai = potong.indexOf('{');
  const akhir = potong.lastIndexOf('}');
  if (mulai === -1 || akhir === -1) throw new Error('Format JSON tidak ditemukan');
  return JSON.parse(potong.slice(mulai, akhir + 1));
}

// Mengembalikan { ok: true, ids, alasan } atau { ok: false, galat }.
export function validasiHasil(mode, j, profil) {
  const gagal = (galat) => ({ ok: false, galat });

  // 1. Format sesuai skema: { ids: string[], alasan: string }
  if (!j || typeof j !== 'object' || !Array.isArray(j.ids) || !j.ids.every((x) => typeof x === 'string')) {
    return gagal('Skema JSON tidak sesuai');
  }
  const ids = [...new Set(j.ids)];
  if (ids.length !== j.ids.length) return gagal('Ada id resep ganda');

  // 2. Id ada di basis data resep
  const resep = ids.map(getRecipe);
  if (resep.some((r) => !r)) return gagal('Ada id resep yang tidak dikenal');

  // 3. Tidak mengandung bahan pantangan dan alat masak tersedia
  const hindari = (profil.pantangan || []).map((p) => PANTANGAN_TAG[p]).filter(Boolean);
  if (resep.some((r) => r.tags.some((t) => hindari.includes(t)))) return gagal('Melanggar pantangan');
  if (resep.some((r) => r.alat.length > 0 && !r.alat.some((a) => (profil.alat || []).includes(a)))) {
    return gagal('Alat masak tidak tersedia');
  }

  const alasan = typeof j.alasan === 'string' ? j.alasan.slice(0, 400) : '';

  if (mode === 'menu') {
    // Satu menu per waktu makan dan total biaya tidak melebihi bujet
    const urut = SLOTS.map((s) => resep.find((r) => r.slot === s)).filter(Boolean);
    if (resep.length !== SLOTS.length || urut.length !== SLOTS.length) return gagal('Slot waktu makan tidak lengkap');
    if (nutrisiDari(urut.map((r) => r.id)).biaya > profil.budget) return gagal('Total biaya melebihi bujet');
    return { ok: true, ids: urut.map((r) => r.id), alasan };
  }

  if (resep.length < 1 || resep.length > 3) return gagal('Jumlah resep tidak sesuai');
  return { ok: true, ids, alasan };
}

// panggil(prompt) -> teks. Melempar galat bila layanan AI tidak tersedia.
// Mengembalikan { ids, alasan, sumber: 'ai' } atau null (pemanggil memakai cadangan berbasis aturan).
export async function jalankanAI({ mode, profil, prompt, panggil, maksPercobaan = 2 }) {
  for (let i = 0; i < maksPercobaan; i++) {
    let teks;
    try {
      teks = await panggil(prompt);
    } catch {
      return null; // layanan AI tidak tersedia -> cadangan
    }
    try {
      const hasil = validasiHasil(mode, parseJson(teks), profil);
      if (hasil.ok) return { ids: hasil.ids, alasan: hasil.alasan, sumber: 'ai' };
    } catch {
      // JSON rusak -> dihitung sebagai validasi gagal, coba lagi
    }
  }
  return null;
}
