// Pencarian resep untuk kolom cari di header: semua kata pencarian harus cocok dengan nama resep atau nama bahannya.
import { RECIPES } from './data';

const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Kecocokan di nama bernilai 3, di bahan 1. Hasil diurut dari skor tertinggi, lalu harga termurah.
export function cariResep(q, daftar = RECIPES, maks = 6) {
  const kata = norm(q).split(' ').filter(Boolean);
  if (!kata.length) return [];
  const hasil = [];
  for (const r of daftar) {
    const nama = norm(r.nama);
    const bahan = (r.bahan || []).map((b) => norm(b.nama)).join(' ');
    let skor = 0;
    let cocok = true;
    for (const k of kata) {
      if (nama.includes(k)) skor += 3;
      else if (bahan.includes(k)) skor += 1;
      else { cocok = false; break; }
    }
    if (cocok) hasil.push({ r, skor });
  }
  return hasil.sort((a, b) => b.skor - a.skor || a.r.harga - b.r.harga).slice(0, maks).map((x) => x.r);
}
