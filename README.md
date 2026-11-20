# NutriKos

Platform rekomendasi menu bergizi dan hemat untuk mahasiswa perantau (anak kos).
Karya lomba SEVENT X National Competition - Kategori Software Development / Website.
Tema: *Developing Sustainable Tech Solutions for Society* (SDG 2 - Zero Hunger).

## Menjalankan di komputer
```bash
npm install
npm run dev      # buka http://localhost:3000 (paling enak dilihat di tampilan HP)
npm run build    # cek build production
```

## Fitur
- Profil Kos: bujet harian, alat masak, pantangan, lokasi
- Rekomendasi menu harian/mingguan sesuai bujet dan alat
- Cek bahan sisa: ide masakan dari bahan yang dimiliki
- Daftar belanja otomatis + estimasi biaya
- Pelacak gizi (protein, serat, karbohidrat) dan catatan 7 hari
- Profil Saya: ubah nama, data diri, avatar

## Fitur AI
Endpoint `POST /api/rekomendasi` meminta model bahasa (LLM) memilih menu dari database resep sesuai bujet, alat, pantangan, dan bahan stok.
- Salin `.env.example` menjadi `.env.local`, isi `GEMINI_API_KEY` (gratis dari aistudio.google.com) atau `ANTHROPIC_API_KEY`.
- Di Vercel: Project Settings -> Environment Variables, tambahkan kunci yang sama, lalu Redeploy.
- Hasil AI divalidasi di server (id resep harus ada, satu per waktu makan, total harga <= bujet). Bila AI gagal atau kunci kosong, aplikasi otomatis memakai rekomendasi berbasis aturan.
- Ada pembatas 10 permintaan per menit per IP. Jangan pernah commit kunci API ke GitHub.

## Catatan
- Data resep, harga, dan nilai gizi di `lib/data.js` adalah **estimasi contoh**. Verifikasi ke TKPI Kemenkes dan harga warung sekitar kampus.
- Nama model dapat berubah; atur lewat `GEMINI_MODEL` / `ANTHROPIC_MODEL` bila perlu.
- Data pengguna disimpan di `localStorage` browser (belum memakai database).

## Struktur
```
app/            halaman (Beranda, menu, bahan-sisa, belanja, gizi, profil-kos, profil)
components/     Header, BottomNav, RecipeCard, AppProvider (state + localStorage)
lib/data.js     data resep & konstanta
lib/recommend.js  logika rekomendasi (aturan: alat, pantangan, bujet)
```

## Deploy (Vercel)
1. Push ke GitHub (repo **publik**).
2. Buka vercel.com, Import Project, pilih repo, Deploy.
