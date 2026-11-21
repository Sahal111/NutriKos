# Audit NutriKos terhadap Proposal (Sevent X, tim CODIVA)

Tanggal audit: 21 November 2026. Acuan: `Proposal_NutriKos_Sevent_Codiva.pdf`. Kode yang diaudit: branch `main`, commit `ea3bccd`.

Status: **Sesuai** = sudah sesuai proposal. **Diperbaiki** = tidak sesuai, sudah disesuaikan pada audit ini. **Belum** = belum ada, perlu dikerjakan. **Revisi proposal** = lebih baik proposalnya yang diubah.

## 1. Ringkasan

| Area | Status |
|---|---|
| Fitur inti F1-F5 (profil kos, rekomendasi, bahan sisa, belanja, gizi) | Sesuai |
| Target gizi AKG per jenis kelamin, rumus dan ambang skor (3.6) | Diperbaiki |
| Pengendalian keluaran AI: validasi, coba ulang, cadangan (3.7) | Diperbaiki |
| Favorit dan riwayat menu (F6) | Diperbaiki (di perangkat, belum di basis data) |
| Akun: Register, Login, Lupa Kata Sandi, JWT, bcrypt (F9, N3) | **Belum** |
| Basis data PostgreSQL/Supabase (3.5) | Skema dibuat (`db/schema.sql`), **belum terhubung** |
| Gizi dan biaya dihitung dari tabel bahan (TKPI, PIHPS) | **Belum** (masih estimasi per resep) |
| Tampilan sesuai mockup (sidebar biru, pencarian di header) | **Belum** |

## 2. Temuan yang sudah diperbaiki

| # | Proposal | Kondisi sebelumnya | Perbaikan |
|---|---|---|---|
| 1 | Tabel 3.2: target AKG 2019 per jenis kelamin (protein 65/60 g, karbo 430/360 g, dst.) | Satu target tetap untuk semua (protein 50, serat 25, karbo 220) | `lib/gizi.js`; pilihan jenis kelamin di Profil Kos |
| 2 | Skor = rata-rata skor protein, karbohidrat, **sayur** (5 porsi/hari), maks 100 per komponen | Memakai serat (gram), bukan sayur | Porsi sayur per resep, rumus sesuai proposal |
| 3 | Ambang: >= 80 Cukup, 50-79 Perlu Ditingkatkan, < 50 Kurang | 85 dan 70 dengan label lain | Disesuaikan di Gizi dan Beranda |
| 4 | Skor **mingguan** dari menu yang dijadwalkan | Hanya menu hari ini | Rata-rata 7 hari dari catatan; pratinjau bila belum ada catatan |
| 5 | Catatan batasan skor (hanya menu di NutriKos, bukan diagnosis) | Hanya sebagian | Ditampilkan lengkap di halaman Gizi |
| 6 | 3.7 langkah 4: validasi gagal, coba **sekali lagi**, baru cadangan | Langsung ke cadangan | `lib/aiPipeline.js` (maks 2 panggilan) |
| 7 | 3.7 langkah 3: cek format, id, pantangan, alat, bujet | Pantangan dan alat hanya lewat penyaringan kandidat | Dicek eksplisit pada hasil AI |
| 8 | 3.7 langkah 5: gizi dan biaya dihitung sistem | Dihitung klien saja | API mengembalikan `ringkasan` hasil hitung server |
| 9 | F6: favorit dan riwayat menu | Tidak ada | Tombol hati, bagian Favorit dan Riwayat di halaman Menu |
| 10 | N3: kunci API tidak bocor | Kunci Gemini ikut di URL (bisa tercatat di log) | Kunci hanya lewat header |
| 11 | N3: data minimal ke AI | Sudah (tanpa nama/email); input chat tanpa batas | Panjang pesan dan riwayat chat dibatasi |
| 12 | Klaim "Hemat sampai Rp15.000 / hari" | Angka tetap tanpa dasar | Dihitung dari resep teratas, ditandai estimasi |
| 13 | .env.example menyebut `claude-haiku-5-5` | Kode memakai model lama | Default disamakan |

Perbaikan di luar proposal: tanggal catatan memakai zona waktu lokal (sebelumnya UTC, sehingga pukul 00.00-07.00 WIB tercatat sebagai kemarin); menu "Profil Kos" dan "Profil Saya" sama-sama menyala di sidebar; jsconfig `baseUrl` (deprecated) dihapus; Next.js 14.2.15 ke 14.2.35 (rentan keamanan); README (batas 20 permintaan/menit, struktur folder).

## 3. Yang belum sesuai (perlu keputusan atau akses layanan)

1. **Akun dan sesi (F9, N3).** Tidak ada Register, Login, Lupa Kata Sandi, JWT, bcrypt. Profil bawaan masih "Rina Anggraini". Dibutuhkan: proyek Supabase (atau PostgreSQL lain), `DATABASE_URL`, rahasia JWT, dan layanan email untuk pemulihan kata sandi.
2. **Basis data (3.5).** Seluruh data masih di `localStorage`, sehingga klaim "dapat diakses dari perangkat mana pun" belum benar. Skema siap di `db/schema.sql`; langkah berikutnya mengisi tabel `bahan` dan `resep` dari `lib/data.js` lalu memindahkan state AppProvider ke API.
3. **Gizi dari tabel bahan (3.6).** Nilai gizi masih ditulis per resep (perkiraan), bukan dihitung dari gram bahan x TKPI 2017, dan harga belum dirujuk ke PIHPS. Proposal menyatakan ini; kodenya belum. **Penting:** setelah target diganti ke AKG, karbohidrat satu hari menu (sekitar 150 g) hanya mencapai sekitar 40% dari target 360 g, sehingga skor cenderung rendah. Itu kemungkinan karena nilai karbo per resep terlalu kecil (satu piring nasi sudah sekitar 80 g). Kalibrasi ulang nilai gizi sebelum demo.
4. **Tampilan (3.3).** Mockup memakai sidebar biru, kolom pencarian di header, dan Beranda tiga kolom (statistik pengeluaran, jadwal menu, agenda belanja). Aplikasi memakai tema hijau, sidebar putih, tanpa pencarian. Halaman Login/Register/Lupa Kata Sandi belum ada.
5. **Jadwal makan (F8).** "Terapkan ke jadwal" hanya menyalin menu hari ini ke catatan. Belum ada jadwal per tanggal dan waktu makan (tabel `jadwal_makan`).
6. **Pelacak mingguan** menghitung rata-rata dari hari yang tercatat saja. Jika hanya 1 dari 7 hari tercatat, skor mewakili 1 hari itu. Jelaskan ini saat presentasi.
7. **Pengujian (2.3).** Uji endpoint dengan Postman belum ada; uji otomatis baru mencakup rumus gizi dan alur validasi AI (`npm test`).

## 4. Usulan revisi proposal

- Tabel 3.1 dan Gambar 3.6: kunci `riwayat_menu` (pengguna_id, resep_id) membuat satu resep hanya bisa tercatat sekali per akun. Tambahkan `tanggal` ke kunci (sudah begitu di `db/schema.sql`).
- Bab 2.2 menyebut Postman, DBeaver, Supabase, JWT, bcrypt. Jika akun dan basis data tidak selesai sebelum batas lomba, tandai sebagai rencana pengembangan, bukan fitur yang sudah ada, agar tidak melebihi kondisi aplikasi.
- Bab 1.6 poin 7 menyebut "data resep dan bahan diisi pengembang langsung ke basis data"; saat ini diisi di `lib/data.js`.
- Mockup Gambar 3.3-3.5 memuat "Masuk dengan Google" dan "SSO Kampus", padahal batasan 1.6 menyatakan login pihak ketiga belum disediakan.
- Kemampuan chat asisten AI ("Tanya AI") ada di aplikasi tetapi tidak ada di proposal. Tambahkan ke Bab 3.4 atau hapus.
