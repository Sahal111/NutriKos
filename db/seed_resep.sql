-- Dibuat otomatis oleh scripts/gen-seed-resep.mjs dari lib/data.js (12 resep). Aman dijalankan berulang.
-- Catatan: alat_masak_dibutuhkan berisi pilihan alat; resep bisa dimasak jika pengguna punya salah satunya (kosong = tanpa alat).
insert into resep (id, nama, alat_masak_dibutuhkan, langkah, waktu_masak, jumlah_porsi) values
  ('oat-telur-pisang', 'Oat Telur Rebus & Pisang', array['Kompor', 'Panci / Wajan Listrik', 'Microwave']::text[], array['Rebus telur 8-10 menit lalu kupas.', 'Seduh oat dengan air panas atau masak sebentar.', 'Sajikan dengan telur dan irisan pisang.']::text[], 10, 1),
  ('nasi-telur-orak-arik', 'Nasi Telur Orak-arik Sayur', array['Kompor', 'Panci / Wajan Listrik', 'Rice Cooker']::text[], array['Kocok telur dengan garam dan sedikit lada.', 'Tumis bawang sampai harum, masukkan wortel dan daun bawang.', 'Tuang telur, orak-arik sampai matang lembut.', 'Sajikan di atas nasi hangat.']::text[], 10, 1),
  ('bubur-kacang-hijau', 'Bubur Kacang Hijau Rice Cooker', array['Rice Cooker', 'Kompor', 'Panci / Wajan Listrik']::text[], array['Cuci kacang hijau, masukkan ke rice cooker dengan air.', 'Masak mode cook sampai empuk (sekitar 30 menit).', 'Tambahkan gula merah dan santan, aduk rata.']::text[], 40, 1),
  ('roti-selai-pisang', 'Roti Selai Pisang', '{}'::text[], array['Oles selai di roti.', 'Tata irisan pisang di atasnya.', 'Sajikan.']::text[], 5, 1),
  ('liwet-tempe-sayur-bening', 'Nasi Liwet Tempe & Sayur Bening', array['Rice Cooker']::text[], array['Masukkan beras, air, bawang, dan irisan tempe ke rice cooker.', 'Masak mode cook sampai matang.', 'Di akhir, masukkan bayam dan jagung, tutup 5 menit.', 'Aduk dan sajikan.']::text[], 25, 1),
  ('nasi-goreng-kampung', 'Nasi Goreng Kampung Telur & Kol', array['Kompor', 'Panci / Wajan Listrik']::text[], array['Tumis bawang dan cabai sampai harum.', 'Masukkan telur, orak-arik, lalu tambahkan kol.', 'Masukkan nasi dan kecap, aduk rata sampai matang.']::text[], 10, 1),
  ('tempe-orek-bayam', 'Tempe Orek & Tumis Bayam', array['Kompor', 'Panci / Wajan Listrik']::text[], array['Potong tempe dadu, goreng sebentar.', 'Tumis bumbu, masukkan tempe dan kecap sampai meresap.', 'Tumis bayam terpisah sebentar, sajikan dengan nasi.']::text[], 15, 1),
  ('nasi-teri-kangkung', 'Nasi Ikan Teri & Tumis Kangkung', array['Kompor', 'Panci / Wajan Listrik']::text[], array['Goreng teri sampai garing.', 'Tumis bawang dan cabai, masukkan kangkung.', 'Sajikan dengan nasi hangat.']::text[], 15, 1),
  ('tumis-tahu-tauge', 'Tumis Tahu Tauge Kecap', array['Kompor', 'Panci / Wajan Listrik']::text[], array['Potong tahu, goreng setengah matang.', 'Tumis bawang dan cabai, masukkan tahu dan kecap.', 'Tambahkan tauge, aduk sebentar, sajikan dengan nasi.']::text[], 12, 1),
  ('sup-ayam-jagung', 'Sup Ayam Jagung Telur', array['Rice Cooker', 'Kompor', 'Panci / Wajan Listrik']::text[], array['Rebus ayam dengan bawang sampai empuk.', 'Masukkan wortel dan jagung, masak sampai lunak.', 'Tuang telur kocok perlahan sambil diaduk.']::text[], 20, 1),
  ('mi-rebus-sayur-telur', 'Mi Rebus Sayur & Telur', array['Kompor', 'Panci / Wajan Listrik']::text[], array['Rebus mi sampai setengah matang.', 'Masukkan sawi dan telur, masak sampai matang.', 'Tambahkan bumbu dan cabai.']::text[], 10, 1),
  ('tumis-kangkung-telur', 'Nasi Telur Dadar & Tumis Kangkung', array['Kompor', 'Panci / Wajan Listrik']::text[], array['Kocok telur dan dadar tipis.', 'Tumis bawang, cabai, dan kangkung.', 'Sajikan dengan nasi.']::text[], 15, 1)
on conflict (id) do update set
  nama = excluded.nama,
  alat_masak_dibutuhkan = excluded.alat_masak_dibutuhkan,
  langkah = excluded.langkah,
  waktu_masak = excluded.waktu_masak,
  jumlah_porsi = excluded.jumlah_porsi;

