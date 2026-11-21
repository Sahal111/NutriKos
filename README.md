# NutriKos

Platform rekomendasi menu bergizi dan hemat untuk mahasiswa perantau (anak kos).
Karya lomba SEVENT X National Competition - Kategori Software Development / Website.
Tema: *Developing Sustainable Tech Solutions for Society* (SDG 2 - Zero Hunger).

## Menjalankan di komputer
```bash
npm install
npm run dev      # buka http://localhost:3000 (paling enak dilihat di tampilan HP)
npm run build    # cek build production
npm test         # uji rumus skor gizi dan pengendalian keluaran AI
```

## Fitur
- Profil Kos: bujet harian, alat masak, pantangan, jenis kelamin (untuk target gizi), lokasi
- Rekomendasi menu harian/mingguan sesuai bujet dan alat
- Cek bahan sisa: ide masakan dari bahan yang dimiliki
- Daftar belanja otomatis + estimasi biaya
- Pelacak gizi mingguan: skor dari protein, karbohidrat, dan sayur terhadap AKG 2019 (lihat `lib/gizi.js`) dan catatan 7 hari
- Menu favorit dan riwayat menu (di halaman Rekomendasi Menu)
- Profil Saya: ubah nama, data diri, avatar

## Fitur AI
Endpoint `POST /api/rekomendasi` meminta model bahasa (LLM) memilih menu dari database resep sesuai bujet, alat, pantangan, dan bahan stok.
- Salin `.env.example` menjadi `.env.local`, isi `GEMINI_API_KEY` (gratis dari aistudio.google.com) atau `ANTHROPIC_API_KEY`.
- Di Vercel: Project Settings -> Environment Variables, tambahkan kunci yang sama, lalu Redeploy.
- AI hanya memilih id resep dan memberi alasan. Hasilnya divalidasi di server (`lib/aiPipeline.js`): format JSON, id resep ada, tidak melanggar pantangan, alat masak tersedia, satu menu per waktu makan, total harga <= bujet. Bila gagal, server mencoba sekali lagi; bila masih gagal atau AI tidak tersedia, dipakai rekomendasi berbasis aturan.
- Gizi dan biaya selalu dihitung sistem dari data resep, bukan dari keluaran AI.
- Hanya bujet, alat, pantangan, dan bahan stok yang dikirim ke layanan AI (tanpa nama, email, atau jenis kelamin). Kunci API hanya dibaca di server.
- Ada pembatas 20 permintaan per menit per IP. Jangan pernah commit kunci API ke GitHub.

## Catatan
- Data resep, harga, dan nilai gizi di `lib/data.js` adalah **estimasi contoh**. Verifikasi ke TKPI Kemenkes dan harga warung sekitar kampus.
- Nama model dapat berubah; atur lewat `GEMINI_MODEL` / `ANTHROPIC_MODEL` bila perlu.
- Data pengguna disimpan di `localStorage` browser (belum memakai database). Rancangan skema PostgreSQL sesuai proposal ada di `db/schema.sql` (belum terhubung).
- Status kesesuaian dengan proposal dan daftar pekerjaan tersisa: `docs/AUDIT_PROPOSAL.md`.

## Struktur
```
app/            halaman (Beranda, menu, bahan-sisa, belanja, gizi, profil-kos, profil)
components/     Header, Sidebar, BottomNav, RecipeCard, ChatAI, FavoritRiwayat, AppProvider (state + localStorage)
lib/data.js     data resep & konstanta
lib/recommend.js  logika rekomendasi (aturan: alat, pantangan, bujet)
lib/gizi.js     target AKG, rumus skor gizi, skor mingguan
lib/aiPipeline.js  validasi keluaran AI, coba ulang, cadangan
app/api/rekomendasi/  endpoint AI (server)
db/schema.sql   rancangan basis data PostgreSQL (Tabel 3.1 proposal)
tests/          uji otomatis
```

## Deploy (Vercel)
1. Push ke GitHub (repo **publik**).
2. Buka vercel.com, Import Project, pilih repo, Deploy.
