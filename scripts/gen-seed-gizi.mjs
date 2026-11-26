// Membuat SQL isi tabel `bahan` (komposisi TKPI 2017 per 100 g) dan `resep_bahan` (takaran gram) dari lib/tkpi.js dan lib/data.js.
// Pakai: npx tsx scripts/gen-seed-gizi.mjs > db/seed_gizi.sql
// Jalankan setelah db/seed_resep.sql. Aman dijalankan berulang.
import { RECIPES } from '../lib/data.js';
import { TKPI, GRAM_RESEP, MINYAK_G, BUTUH_MINYAK } from '../lib/tkpi.js';

const t = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const KATEGORI = { karbo: 'karbohidrat', protein: 'protein', sayur: 'sayur', bumbu: 'lainnya' };

// Kategori dan harga per 100 g diturunkan dari baris bahan di resep (harga baris / gram x 100, dirata-ratakan).
const info = {};
for (const r of RECIPES) {
  for (const b of r.bahan) {
    const g = GRAM_RESEP[r.id]?.[b.kunci] ?? 0;
    const i = (info[b.kunci] ||= { nama: b.nama, kat: KATEGORI[b.kat] || 'lainnya', harga: [] });
    if (g > 0) i.harga.push((b.harga / g) * 100);
  }
}
info.minyak = { nama: 'Minyak goreng', kat: 'lainnya', harga: [] };

const kunciBahan = Object.keys(TKPI);
const barisBahan = kunciBahan.map((k) => {
  const x = TKPI[k];
  const i = info[k] || { nama: k, kat: 'lainnya', harga: [] };
  const harga = i.harga.length ? Math.round(i.harga.reduce((a, b) => a + b, 0) / i.harga.length) : 0;
  const catatan = [x.proksi && `PROKSI: ${x.proksi}`, x.catatan].filter(Boolean).join(' | ') || null;
  return `  (${t(k)}, ${t(i.nama)}, ${t(i.kat)}, 'per 100 g', ${harga}, ${x.energi}, ${x.protein}, ${x.karbo}, ${x.lemak}, ${x.serat}, ${t(x.kode)}, ${t(x.nama)}, ${t(catatan)})`;
});

const barisResepBahan = [];
for (const r of RECIPES) {
  for (const [k, g] of Object.entries(GRAM_RESEP[r.id] || {})) if (g > 0) barisResepBahan.push(`  (${t(r.id)}, ${t(k)}, ${g})`);
  if ((r.langkah || []).some((l) => BUTUH_MINYAK.test(l))) barisResepBahan.push(`  (${t(r.id)}, 'minyak', ${MINYAK_G})`);
}

console.log(`-- Dibuat otomatis oleh scripts/gen-seed-gizi.mjs dari lib/tkpi.js dan lib/data.js. Aman dijalankan berulang.
-- Jalankan SETELAH db/seed_resep.sql (resep_bahan mengacu ke tabel resep).
-- Sumber gizi: Tabel Komposisi Pangan Indonesia (TKPI) 2017, nilai per 100 g bagian yang dapat dimakan.
-- Takaran gram per resep adalah asumsi ukuran rumah tangga (lihat komentar di lib/tkpi.js), perlu diverifikasi tim.
alter table bahan add column if not exists kode_tkpi text;
alter table bahan add column if not exists nama_tkpi text;
alter table bahan add column if not exists catatan text;

insert into bahan (kunci, nama, kategori, satuan, harga_rata_rata, energi, protein, karbohidrat, lemak, serat, kode_tkpi, nama_tkpi, catatan) values
${barisBahan.join(',\n')}
on conflict (kunci) do update set
  nama = excluded.nama, kategori = excluded.kategori, satuan = excluded.satuan, harga_rata_rata = excluded.harga_rata_rata,
  energi = excluded.energi, protein = excluded.protein, karbohidrat = excluded.karbohidrat, lemak = excluded.lemak, serat = excluded.serat,
  kode_tkpi = excluded.kode_tkpi, nama_tkpi = excluded.nama_tkpi, catatan = excluded.catatan;

insert into resep_bahan (resep_id, bahan_id, jumlah)
select v.resep_id, b.id, v.jumlah
from (values
${barisResepBahan.join(',\n')}
) as v(resep_id, kunci, jumlah)
join bahan b on b.kunci = v.kunci
on conflict (resep_id, bahan_id) do update set jumlah = excluded.jumlah;
`);
