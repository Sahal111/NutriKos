// Komposisi gizi bahan per 100 g bagian yang dapat dimakan, dari
// Tabel Komposisi Pangan Indonesia (TKPI) 2017, Kementerian Kesehatan RI (Lampiran: tabel komposisi zat gizi).
// Kunci = `kunci` bahan di lib/data.js. `kode` = kode pangan di TKPI.
// `proksi` diisi bila bahan tidak ada di TKPI 2017 dan dipakai pangan terdekat; `catatan` untuk keanehan data sumber.
export const TKPI = {
  oat: {
    kode: "AR019",
    nama: "Jali, mentah",
    energi: 324,
    protein: 11.0,
    lemak: 4.0,
    karbo: 61.0,
    serat: 3.1,
    proksi:
      "Oat/havermut tidak ada di TKPI 2017; dipakai serealia utuh terdekat (jali)",
  },
  telur: {
    kode: "HR002",
    nama: "Telur ayam ras, segar",
    energi: 154,
    protein: 12.4,
    lemak: 10.8,
    karbo: 0.7,
    serat: 0.0,
  },
  pisang: {
    kode: "ER074",
    nama: "Pisang ambon, segar",
    energi: 108,
    protein: 1.0,
    lemak: 0.8,
    karbo: 24.3,
    serat: 1.9,
  },
  nasi: {
    kode: "AP001",
    nama: "Nasi",
    energi: 180,
    protein: 3.0,
    lemak: 0.3,
    karbo: 39.8,
    serat: 0.2,
  },
  wortel: {
    kode: "DR166",
    nama: "Wortel, segar",
    energi: 36,
    protein: 1.0,
    lemak: 0.6,
    karbo: 7.9,
    serat: 1.0,
  },
  "daun bawang": {
    kode: "DR018",
    nama: "Daun bawang merah, segar",
    energi: 41,
    protein: 2.0,
    lemak: 0.3,
    karbo: 7.8,
    serat: 2.1,
  },
  bawang: {
    kode: "NR007",
    nama: "Bawang merah, segar",
    energi: 46,
    protein: 1.5,
    lemak: 0.3,
    karbo: 9.2,
    serat: 1.7,
  },
  garam: {
    kode: null,
    nama: "Garam / kaldu (bumbu)",
    energi: 0,
    protein: 0,
    lemak: 0,
    karbo: 0,
    serat: 0,
    catatan: "Tidak ada di TKPI; dianggap tanpa zat gizi bermakna",
  },
  "kacang hijau": {
    kode: "CR014",
    nama: "Kacang hijau, kering",
    energi: 323,
    protein: 22.9,
    lemak: 1.5,
    karbo: 56.8,
    serat: 7.5,
  },
  gula: {
    kode: "MP006",
    nama: "Gula kelapa",
    energi: 386,
    protein: 3.0,
    lemak: 10.0,
    karbo: 76.0,
    serat: 0.0,
    catatan: "Gula merah = gula kelapa/aren; dipakai gula kelapa",
  },
  santan: {
    kode: "KP003",
    nama: "Santan (dengan air)",
    energi: 122,
    protein: 2.0,
    lemak: 10.0,
    karbo: 7.6,
    serat: 1.4,
  },
  roti: {
    kode: "AP024",
    nama: "Roti putih",
    energi: 248,
    protein: 8.0,
    lemak: 1.2,
    karbo: 50.0,
    serat: 9.1,
    catatan:
      "Serat 9,1 g/100 g sesuai yang tercetak di TKPI (tampak tinggi untuk roti putih)",
  },
  selai: {
    kode: "MP001",
    nama: "Coklat manis, batang",
    energi: 527,
    protein: 2.0,
    lemak: 29.8,
    karbo: 62.7,
    serat: 6.5,
    proksi:
      "Selai cokelat tidak ada di TKPI 2017; dipakai cokelat manis batang",
  },
  beras: {
    kode: "AR001",
    nama: "Beras giling, mentah",
    energi: 357,
    protein: 8.4,
    lemak: 1.7,
    karbo: 77.1,
    serat: 0.2,
  },
  tempe: {
    kode: "CP077",
    nama: "Tempe kedelai murni, mentah",
    energi: 201,
    protein: 20.8,
    lemak: 8.8,
    karbo: 13.5,
    serat: 1.4,
  },
  bayam: {
    kode: "DR008",
    nama: "Bayam, segar",
    energi: 16,
    protein: 0.9,
    lemak: 0.4,
    karbo: 2.9,
    serat: 0.7,
  },
  jagung: {
    kode: "AR015",
    nama: "Jagung muda, kuning, mentah",
    energi: 147,
    protein: 5.1,
    lemak: 0.7,
    karbo: 31.5,
    serat: 1.3,
  },
  kol: {
    kode: "DR044",
    nama: "Daun kubis, segar",
    energi: 51,
    protein: 2.5,
    lemak: 1.1,
    karbo: 8.0,
    serat: 3.4,
  },
  cabai: {
    kode: "NR015",
    nama: "Cabai rawit, segar",
    energi: 120,
    protein: 4.7,
    lemak: 2.4,
    karbo: 19.9,
    serat: 15.2,
  },
  kecap: {
    kode: "NP005",
    nama: "Kecap",
    energi: 71,
    protein: 5.7,
    lemak: 1.3,
    karbo: 9.0,
    serat: 0.0,
  },
  teri: {
    kode: "GP042",
    nama: "Ikan teri, kering, mentah",
    energi: 170,
    protein: 33.4,
    lemak: 3.0,
    karbo: 0.0,
    serat: 0.0,
  },
  kangkung: {
    kode: "DR100",
    nama: "Kangkung, segar",
    energi: 28,
    protein: 3.4,
    lemak: 0.7,
    karbo: 3.9,
    serat: 2.0,
  },
  tahu: {
    kode: "CP061",
    nama: "Tahu, mentah",
    energi: 80,
    protein: 10.9,
    lemak: 4.7,
    karbo: 0.8,
    serat: 0.1,
  },
  tauge: {
    kode: "DR141",
    nama: "Sawi, segar",
    energi: 28,
    protein: 2.3,
    lemak: 0.3,
    karbo: 4.0,
    serat: 2.5,
    proksi:
      'Tauge/kecambah kacang hijau tidak ada di TKPI 2017 ("toge" di TKPI adalah tumbuhan lain); dipakai sayuran daun terdekat (sawi)',
  },
  ayam: {
    kode: "FR005",
    nama: "Ayam, daging, segar",
    energi: 298,
    protein: 18.2,
    lemak: 25.0,
    karbo: 0.0,
    serat: 0.0,
    catatan: "Nilai TKPI untuk daging ayam berikut lemak/kulit",
  },
  mi: {
    kode: "AP022",
    nama: "Mi kering",
    energi: 339,
    protein: 10.0,
    lemak: 1.7,
    karbo: 70.9,
    serat: 0.4,
    proksi: "Mi instan tidak ada di TKPI 2017; dipakai mi kering",
    catatan:
      "Karbohidrat tercetak 6,3 g tidak sesuai energi 339 kkal; dihitung dari selisih energi (Atwater 4/9/4) menjadi 70,9 g. Mohon verifikasi dengan buku TKPI asli",
  },
  sawi: {
    kode: "DR141",
    nama: "Sawi, segar",
    energi: 28,
    protein: 2.3,
    lemak: 0.3,
    karbo: 4.0,
    serat: 2.5,
  },
  minyak: {
    kode: "KR012",
    nama: "Minyak kelapa sawit",
    energi: 884,
    protein: 0,
    lemak: 100.0,
    karbo: 0,
    serat: 0,
  },
};

// Takaran: gram bagian yang dapat dimakan per baris bahan resep (ASUMSI ukuran rumah tangga; lihat catatan di tiap angka).
// Satuan di lib/data.js ("2 butir", "1 piring", ...) diterjemahkan ke gram di sini agar bisa dihitung dengan TKPI.
export const GRAM_RESEP = {
  "oat-telur-pisang": { oat: 30, telur: 100, pisang: 75 }, // 4 sdm oat ≈ 30 g; telur 50 g/butir
  "nasi-telur-orak-arik": {
    nasi: 150,
    telur: 100,
    wortel: 40,
    "daun bawang": 10,
    bawang: 10,
    garam: 0,
  }, // mangkuk nasi ≈ 150 g
  "nasi-goreng-kampung": {
    nasi: 200,
    telur: 50,
    bawang: 15,
    kol: 100,
    cabai: 6,
    kecap: 15,
  }, // piring nasi ≈ 200 g
  "sup-ayam-jagung": {
    ayam: 100,
    jagung: 75,
    wortel: 40,
    telur: 50,
    bawang: 10,
    garam: 0,
  },
  "mi-rebus-sayur-telur": { mi: 70, sawi: 80, telur: 50, cabai: 6 }, // 1 bungkus mi ≈ 70 g
  "tumis-kangkung-telur": {
    nasi: 200,
    kangkung: 100,
    telur: 50,
    bawang: 10,
    cabai: 6,
  },
  "roti-selai-pisang": { roti: 75, selai: 15, pisang: 75 }, // 1 lembar roti ≈ 25 g
  "bubur-kacang-hijau": { "kacang hijau": 75, gula: 15, santan: 65 }, // 1/2 cup kacang hijau kering ≈ 75 g; 1 sachet santan ≈ 65 g
  "liwet-tempe-sayur-bening": {
    beras: 150,
    tempe: 100,
    bayam: 70,
    jagung: 75,
    bawang: 10,
    garam: 0,
  }, // 1 cup beras mentah ≈ 150 g; 1/2 papan tempe ≈ 100 g
  "tempe-orek-bayam": {
    nasi: 200,
    tempe: 100,
    bayam: 70,
    bawang: 10,
    cabai: 4,
    kecap: 15,
  },
  "nasi-teri-kangkung": {
    nasi: 200,
    teri: 20,
    kangkung: 100,
    bawang: 10,
    cabai: 6,
  }, // 1 genggam teri kering ≈ 20 g
  "tumis-tahu-tauge": {
    nasi: 150,
    tahu: 100,
    tauge: 50,
    bawang: 10,
    cabai: 6,
    kecap: 15,
  }, // 4 potong tahu ≈ 100 g
};

// Minyak goreng yang terserap/dipakai menumis atau menggoreng (gram). ASUMSI: 10 g (1 sendok makan) bila resep menumis/menggoreng.
export const MINYAK_G = 10;
export const BUTUH_MINYAK = /tumis|goreng|dadar|orak|orek/i;

const bulat = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

// Gizi satu resep (1 porsi) dari takaran gram x komposisi TKPI.
export function hitungGizi(resep) {
  const gram = GRAM_RESEP[resep.id];
  if (!gram) return null;
  const tot = { energi: 0, protein: 0, lemak: 0, karbo: 0, serat: 0 };
  const tambah = (kunci, g) => {
    const t = TKPI[kunci];
    if (!t || !g) return;
    for (const k of Object.keys(tot)) tot[k] += (t[k] * g) / 100;
  };
  for (const [kunci, g] of Object.entries(gram)) tambah(kunci, g);
  if ((resep.langkah || []).some((l) => BUTUH_MINYAK.test(l)))
    tambah("minyak", MINYAK_G);
  return {
    kalori: Math.round(tot.energi),
    protein: bulat(tot.protein),
    lemak: bulat(tot.lemak),
    karbo: bulat(tot.karbo),
    serat: bulat(tot.serat),
  };
}
