// Ukuran huruf (N4): dipilih pengguna dan disimpan di perangkat ini.
// Seluruh tampilan memakai satuan rem, jadi mengubah ukuran huruf dasar halaman ikut membesarkan semuanya.
export const UKURAN_HURUF = [
  { kode: "normal", label: "Normal", persen: 100 },
  { kode: "besar", label: "Besar", persen: 112.5 },
  { kode: "sangat-besar", label: "Sangat besar", persen: 125 },
];
const KUNCI = "nutrikos-ukuran-huruf";

export function bacaUkuranHuruf() {
  try {
    const k = localStorage.getItem(KUNCI);
    return UKURAN_HURUF.some((u) => u.kode === k) ? k : "normal";
  } catch {
    return "normal";
  }
}

// Menerapkan ukuran ke halaman dan menyimpannya. Mengembalikan kode ukuran yang dipakai.
export function terapkanUkuranHuruf(kode) {
  const u = UKURAN_HURUF.find((x) => x.kode === kode) || UKURAN_HURUF[0];
  document.documentElement.style.fontSize = `${u.persen}%`;
  try {
    localStorage.setItem(KUNCI, u.kode);
  } catch {}
  return u.kode;
}
