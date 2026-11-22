import { RECIPES, SLOTS, PANTANGAN_TAG, getRecipe } from './data';

export function allowedRecipes(profile) {
  const avoid = (profile.pantangan || []).map((p) => PANTANGAN_TAG[p]).filter(Boolean);
  const alat = profile.alat || [];
  return RECIPES.filter((r) => {
    if (r.tags.some((t) => avoid.includes(t))) return false;
    if (r.alat.length === 0) return true;
    return r.alat.some((a) => alat.includes(a));
  });
}

// Rekomendasi menu harian: 1 menu per waktu makan, total <= budget, cenderung tinggi protein & serat.
// Dipilih acak dari separuh kombinasi terbaik (minimal 3) agar "Acak Ulang" benar-benar bervariasi.
// `hindari` = menu yang sedang tampil; tidak dipilih lagi selama masih ada kombinasi lain yang muat bujet.
export function recommendDaily(profile, hindari = []) {
  const ok = allowedRecipes(profile);
  const bySlot = SLOTS.map((s) => ok.filter((r) => r.slot === s));
  if (bySlot.some((l) => l.length === 0)) {
    // fallback: ambil apa saja yang tersedia
    return bySlot.map((l) => l[0]).filter(Boolean).map((r) => r.id);
  }
  // Semua kombinasi satu menu per waktu makan.
  const semua = bySlot
    .reduce((acc, list) => acc.flatMap((c) => list.map((r) => [...c, r])), [[]])
    .map((combo) => ({
      ids: combo.map((r) => r.id),
      cost: combo.reduce((s, r) => s + r.harga, 0),
      nutri: combo.reduce((s, r) => s + r.protein + r.serat * 2, 0),
    }));
  const muat = semua.filter((c) => c.cost <= profile.budget);
  if (muat.length === 0) {
    // Tidak ada yang muat bujet: pilih yang termurah.
    return semua.reduce((a, b) => (b.cost < a.cost ? b : a)).ids;
  }
  const kunci = (ids) => [...ids].sort().join(',');
  const lain = muat.filter((c) => kunci(c.ids) !== kunci(hindari));
  const kandidat = (lain.length ? lain : muat).sort((a, b) => b.nutri - a.nutri);
  const kolam = kandidat.slice(0, Math.max(3, Math.ceil(kandidat.length / 2)));
  return kolam[Math.floor(Math.random() * kolam.length)].ids;
}

export function recommendWeekly(profile) {
  const hari = [];
  for (let i = 0; i < 7; i++) hari.push(recommendDaily(profile, hari[i - 1] || []));
  return hari;
}

// Pencocokan per kata utuh (bukan potongan huruf), agar stok "a" tidak cocok dengan "bawang".
const ALIAS = { mie: 'mi', telor: 'telur' };
const kata = (s) =>
  String(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean).map((w) => ALIAS[w] || w);
export const cocok = (stokItem, kunci) => {
  const s = kata(stokItem);
  const k = kata(kunci);
  if (!s.length || !k.length) return false;
  for (let i = 0; i + k.length <= s.length; i++) {
    if (k.every((w, j) => s[i + j] === w)) return true;
  }
  return false;
};
export const adaDiStok = (profile, kunci) => (profile.stok || []).some((s) => cocok(s, kunci));

// Ide masakan dari bahan yang dimiliki.
export function ideasFromStock(profile) {
  return allowedRecipes(profile)
    .map((r) => {
      const punya = r.bahan.filter((x) => adaDiStok(profile, x.kunci));
      const kurang = r.bahan.filter((x) => !adaDiStok(profile, x.kunci));
      return { recipe: r, persen: Math.round((punya.length / r.bahan.length) * 100), kurang, biaya: kurang.reduce((s, x) => s + x.harga, 0) };
    })
    .filter((x) => x.persen > 0)
    .sort((a, b) => b.persen - a.persen || a.biaya - b.biaya)
    .slice(0, 6);
}

// Daftar belanja dari menu terpilih.
export function buildShopping(profile, ids, planDetails = {}) {
  const map = new Map();
  ids.forEach((id) => {
    const r = getRecipe(id);
    if (!r) return;
    const porsi = planDetails[id]?.porsi || 1;
    r.bahan.forEach((x) => {
      const cur = map.get(x.nama);
      const scaledHarga = Math.round(x.harga * porsi);
      const qtyText = porsi > 1 ? `${x.qty} (x${porsi} porsi)` : x.qty;
      if (cur) {
        cur.harga += scaledHarga;
        cur.untuk.add(r.nama);
      } else {
        map.set(x.nama, {
          ...x,
          qty: qtyText,
          harga: scaledHarga,
          untuk: new Set([r.nama]),
          sudahAda: adaDiStok(profile, x.kunci)
        });
      }
    });
  });
  return [...map.values()].map((x) => ({ ...x, untuk: [...x.untuk].join(', ') }));
}

// Gizi dan biaya SELALU dihitung sistem dari data resep/bahan, bukan dari keluaran AI (proposal 3.7).
export function nutrisiDari(ids, planDetails = {}) {
  return ids.reduce(
    (t, id) => {
      const r = getRecipe(id);
      if (!r) return t;
      const porsi = planDetails[id]?.porsi || 1;
      return {
        protein: Math.round(t.protein + r.protein * porsi),
        serat: Math.round(t.serat + r.serat * porsi),
        karbo: Math.round(t.karbo + r.karbo * porsi),
        sayur: t.sayur + (r.sayur || 0) * porsi,
        kalori: Math.round(t.kalori + r.kalori * porsi),
        biaya: Math.round(t.biaya + r.harga * porsi)
      };
    },
    { protein: 0, serat: 0, karbo: 0, sayur: 0, kalori: 0, biaya: 0 }
  );
}
