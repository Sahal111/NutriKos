// Jalankan: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { targetHarian, hitungSkor, kategoriSkor, kunciTanggal, skorMingguan, asupanDariLog } from '../lib/gizi.js';
import { validasiHasil, jalankanAI } from '../lib/aiPipeline.js';
import { RECIPES } from '../lib/data.js';

test('target AKG 2019 sesuai Tabel 3.2', () => {
  assert.deepEqual(targetHarian('Laki-laki'), { energi: 2650, protein: 65, karbo: 430, lemak: 75, serat: 37, sayur: 5 });
  assert.deepEqual(targetHarian('Perempuan'), { energi: 2250, protein: 60, karbo: 360, lemak: 65, serat: 32, sayur: 5 });
});

test('rumus skor: rata-rata 3 komponen, maksimum 100 per komponen', () => {
  const t = targetHarian('Perempuan');
  const s = hitungSkor({ protein: 120, karbo: 180, sayur: 5 }, t); // 100 (dibatasi), 50, 100
  assert.deepEqual(s.komponen, { protein: 100, karbo: 50, sayur: 100 });
  assert.equal(s.total, 83);
  assert.equal(s.kategori, 'Cukup');
});

test('kategori: >=80 Cukup, 50-79 Perlu Ditingkatkan, <50 Kurang', () => {
  assert.equal(kategoriSkor(80), 'Cukup');
  assert.equal(kategoriSkor(79), 'Perlu Ditingkatkan');
  assert.equal(kategoriSkor(50), 'Perlu Ditingkatkan');
  assert.equal(kategoriSkor(49), 'Kurang');
});

test('kunciTanggal memakai tanggal lokal, bukan UTC', () => {
  assert.equal(kunciTanggal(new Date(2026, 10, 21, 1, 30)), '2026-11-21');
});

test('skor mingguan = rata-rata hari yang tercatat; log format lama tetap terbaca', () => {
  const ids = ['oat-telur-pisang', 'liwet-tempe-sayur-bening', 'tumis-tahu-tauge'];
  const log = { '2026-11-20': ids, '2026-11-21': { ids, porsi: { 'oat-telur-pisang': 2, 'liwet-tempe-sayur-bening': 2, 'tumis-tahu-tauge': 2 } } };
  const hasil = skorMingguan({ log, kunci7Hari: ['2026-11-19', '2026-11-20', '2026-11-21'], planHariIni: [], detailPlan: {}, jenisKelamin: 'Perempuan' });
  const a1 = asupanDariLog(log['2026-11-20']);
  assert.equal(hasil.hariTercatat, 2);
  assert.equal(hasil.pratinjau, false);
  assert.ok(Math.abs(hasil.asupan.protein - (a1.protein * 3) / 2) <= 1); // rata-rata 1x dan 2x porsi
  const kosong = skorMingguan({ log: {}, kunci7Hari: ['2026-11-21'], planHariIni: ids, detailPlan: {}, jenisKelamin: 'Perempuan' });
  assert.equal(kosong.pratinjau, true);
});

const profil = { budget: 30000, alat: ['Rice Cooker', 'Kompor'], pantangan: [], stok: [] };
const pilih = (slot, tag) => RECIPES.find((r) => r.slot === slot && (tag === undefined || r.tags.includes(tag)));
const tigaMurah = ['pagi', 'siang', 'malam'].map((s) => pilih(s)).map((r) => r.id);

test('validasi menerima menu 3 slot dalam bujet', () => {
  const h = validasiHasil('menu', { ids: tigaMurah, alasan: 'ok' }, profil);
  assert.equal(h.ok, true);
});
test('validasi menolak: skema salah, id tak dikenal, ganda, bujet, pantangan, alat, slot', () => {
  assert.equal(validasiHasil('menu', { ids: 'x' }, profil).ok, false);
  assert.equal(validasiHasil('menu', { ids: [...tigaMurah.slice(0, 2), 'ngawur'] }, profil).ok, false);
  assert.equal(validasiHasil('menu', { ids: [tigaMurah[0], tigaMurah[0], tigaMurah[1]] }, profil).ok, false);
  assert.equal(validasiHasil('menu', { ids: tigaMurah }, { ...profil, budget: 10000 }).ok, false);
  assert.equal(validasiHasil('menu', { ids: tigaMurah }, { ...profil, pantangan: ['Alergi Telur', 'Kacang-kacangan', 'Seafood', 'Vegetarian'] }).ok, false);
  assert.equal(validasiHasil('menu', { ids: tigaMurah }, { ...profil, alat: ['Microwave'] }).ok, false);
  assert.equal(validasiHasil('menu', { ids: tigaMurah.slice(0, 2) }, profil).ok, false);
});

test('pipeline: gagal sekali lalu berhasil = AI dipanggil 2x, hasil dipakai', async () => {
  let n = 0;
  const panggil = async () => (++n === 1 ? 'bukan json' : JSON.stringify({ ids: tigaMurah, alasan: 'ok' }));
  const h = await jalankanAI({ mode: 'menu', profil, prompt: 'x', panggil });
  assert.equal(n, 2);
  assert.equal(h.sumber, 'ai');
});
test('pipeline: gagal dua kali = null (cadangan aturan), tidak lebih dari 2 panggilan', async () => {
  let n = 0;
  const h = await jalankanAI({ mode: 'menu', profil, prompt: 'x', panggil: async () => (++n, JSON.stringify({ ids: ['ngawur'] })) });
  assert.equal(h, null);
  assert.equal(n, 2);
});
test('pipeline: layanan AI tidak tersedia = langsung null tanpa coba ulang', async () => {
  let n = 0;
  const h = await jalankanAI({ mode: 'menu', profil, prompt: 'x', panggil: async () => { n++; throw new Error('down'); } });
  assert.equal(h, null);
  assert.equal(n, 1);
});
