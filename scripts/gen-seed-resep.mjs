// Membuat SQL isi tabel `resep` dari lib/data.js.
// Pakai: npx tsx scripts/gen-seed-resep.mjs > db/seed_resep.sql
// Jalankan ulang setiap kali resep di lib/data.js berubah, lalu jalankan hasilnya di Supabase SQL Editor.
import { RECIPES } from "../lib/data.js";

const t = (s) => `'${String(s).replace(/'/g, "''")}'`;
const arr = (a) =>
  a.length ? `array[${a.map(t).join(", ")}]::text[]` : `'{}'::text[]`;

const baris = RECIPES.map(
  (r) =>
    `  (${t(r.id)}, ${t(r.nama)}, ${arr(r.alat)}, ${arr(r.langkah)}, ${r.waktu}, 1)`,
);

console.log(`-- Dibuat otomatis oleh scripts/gen-seed-resep.mjs dari lib/data.js (${RECIPES.length} resep). Aman dijalankan berulang.
-- Catatan: alat_masak_dibutuhkan berisi pilihan alat; resep bisa dimasak jika pengguna punya salah satunya (kosong = tanpa alat).
insert into resep (id, nama, alat_masak_dibutuhkan, langkah, waktu_masak, jumlah_porsi) values
${baris.join(",\n")}
on conflict (id) do update set
  nama = excluded.nama,
  alat_masak_dibutuhkan = excluded.alat_masak_dibutuhkan,
  langkah = excluded.langkah,
  waktu_masak = excluded.waktu_masak,
  jumlah_porsi = excluded.jumlah_porsi;
`);
