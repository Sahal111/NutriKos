// Jalankan: npm test
import test from "node:test";
import assert from "node:assert/strict";
import {
  targetHarian,
  hitungSkor,
  kategoriSkor,
  kunciTanggal,
  skorMingguan,
  asupanDariLog,
} from "../lib/gizi.js";
import { validasiHasil, jalankanAI } from "../lib/aiPipeline.js";
import { RECIPES } from "../lib/data.js";
import {
  cocok,
  adaDiStok,
  recommendDaily,
  recommendWeekly,
  nutrisiDari,
} from "../lib/recommend.js";
import { profilDariDb, profilKeDb } from "../lib/profilMap.js";
import {
  daftarDariDb,
  barisKeDb,
  logDariDb,
  logKeBaris,
  tanggalTerbaru,
} from "../lib/syncMap.js";

test("target AKG 2019 sesuai Tabel 3.2", () => {
  assert.deepEqual(targetHarian("Laki-laki"), {
    energi: 2650,
    protein: 65,
    karbo: 430,
    lemak: 75,
    serat: 37,
    sayur: 5,
  });
  assert.deepEqual(targetHarian("Perempuan"), {
    energi: 2250,
    protein: 60,
    karbo: 360,
    lemak: 65,
    serat: 32,
    sayur: 5,
  });
});

test("rumus skor: rata-rata 3 komponen, maksimum 100 per komponen", () => {
  const t = targetHarian("Perempuan");
  const s = hitungSkor({ protein: 120, karbo: 180, sayur: 5 }, t); // 100 (dibatasi), 50, 100
  assert.deepEqual(s.komponen, { protein: 100, karbo: 50, sayur: 100 });
  assert.equal(s.total, 83);
  assert.equal(s.kategori, "Cukup");
});

test("kategori: >=80 Cukup, 50-79 Perlu Ditingkatkan, <50 Kurang", () => {
  assert.equal(kategoriSkor(80), "Cukup");
  assert.equal(kategoriSkor(79), "Perlu Ditingkatkan");
  assert.equal(kategoriSkor(50), "Perlu Ditingkatkan");
  assert.equal(kategoriSkor(49), "Kurang");
});

test("kunciTanggal memakai tanggal lokal, bukan UTC", () => {
  assert.equal(kunciTanggal(new Date(2026, 10, 21, 1, 30)), "2026-11-21");
});

test("skor mingguan = rata-rata hari yang tercatat; log format lama tetap terbaca", () => {
  const ids = [
    "oat-telur-pisang",
    "liwet-tempe-sayur-bening",
    "tumis-tahu-tauge",
  ];
  const log = {
    "2026-11-20": ids,
    "2026-11-21": {
      ids,
      porsi: {
        "oat-telur-pisang": 2,
        "liwet-tempe-sayur-bening": 2,
        "tumis-tahu-tauge": 2,
      },
    },
  };
  const hasil = skorMingguan({
    log,
    kunci7Hari: ["2026-11-19", "2026-11-20", "2026-11-21"],
    planHariIni: [],
    detailPlan: {},
    jenisKelamin: "Perempuan",
  });
  const a1 = asupanDariLog(log["2026-11-20"]);
  assert.equal(hasil.hariTercatat, 2);
  assert.equal(hasil.pratinjau, false);
  assert.ok(Math.abs(hasil.asupan.protein - (a1.protein * 3) / 2) <= 1); // rata-rata 1x dan 2x porsi
  const kosong = skorMingguan({
    log: {},
    kunci7Hari: ["2026-11-21"],
    planHariIni: ids,
    detailPlan: {},
    jenisKelamin: "Perempuan",
  });
  assert.equal(kosong.pratinjau, true);
});

const profil = {
  budget: 30000,
  alat: ["Rice Cooker", "Kompor"],
  pantangan: [],
  stok: [],
};
const pilih = (slot, tag) =>
  RECIPES.find(
    (r) => r.slot === slot && (tag === undefined || r.tags.includes(tag)),
  );
const tigaMurah = ["pagi", "siang", "malam"]
  .map((s) => pilih(s))
  .map((r) => r.id);

test("validasi menerima menu 3 slot dalam bujet", () => {
  const h = validasiHasil("menu", { ids: tigaMurah, alasan: "ok" }, profil);
  assert.equal(h.ok, true);
});
test("validasi menolak: skema salah, id tak dikenal, ganda, bujet, pantangan, alat, slot", () => {
  assert.equal(validasiHasil("menu", { ids: "x" }, profil).ok, false);
  assert.equal(
    validasiHasil("menu", { ids: [...tigaMurah.slice(0, 2), "ngawur"] }, profil)
      .ok,
    false,
  );
  assert.equal(
    validasiHasil(
      "menu",
      { ids: [tigaMurah[0], tigaMurah[0], tigaMurah[1]] },
      profil,
    ).ok,
    false,
  );
  assert.equal(
    validasiHasil("menu", { ids: tigaMurah }, { ...profil, budget: 10000 }).ok,
    false,
  );
  assert.equal(
    validasiHasil(
      "menu",
      { ids: tigaMurah },
      {
        ...profil,
        pantangan: ["Alergi Telur", "Kacang-kacangan", "Seafood", "Vegetarian"],
      },
    ).ok,
    false,
  );
  assert.equal(
    validasiHasil(
      "menu",
      { ids: tigaMurah },
      { ...profil, alat: ["Microwave"] },
    ).ok,
    false,
  );
  assert.equal(
    validasiHasil("menu", { ids: tigaMurah.slice(0, 2) }, profil).ok,
    false,
  );
});

test("pipeline: gagal sekali lalu berhasil = AI dipanggil 2x, hasil dipakai", async () => {
  let n = 0;
  const panggil = async () =>
    ++n === 1 ? "bukan json" : JSON.stringify({ ids: tigaMurah, alasan: "ok" });
  const h = await jalankanAI({ mode: "menu", profil, prompt: "x", panggil });
  assert.equal(n, 2);
  assert.equal(h.sumber, "ai");
});
test("pipeline: gagal dua kali = null (cadangan aturan), tidak lebih dari 2 panggilan", async () => {
  let n = 0;
  const h = await jalankanAI({
    mode: "menu",
    profil,
    prompt: "x",
    panggil: async () => (++n, JSON.stringify({ ids: ["ngawur"] })),
  });
  assert.equal(h, null);
  assert.equal(n, 2);
});
test("pipeline: layanan AI tidak tersedia = langsung null tanpa coba ulang", async () => {
  let n = 0;
  const h = await jalankanAI({
    mode: "menu",
    profil,
    prompt: "x",
    panggil: async () => {
      n++;
      throw new Error("down");
    },
  });
  assert.equal(h, null);
  assert.equal(n, 1);
});

test("cocok: per kata utuh, bukan potongan huruf", () => {
  assert.equal(cocok("a", "bawang"), false);
  assert.equal(cocok("Bawang merah", "bawang"), true);
  assert.equal(cocok("Bawang", "daun bawang"), false);
  assert.equal(cocok("Daun bawang", "daun bawang"), true);
  assert.equal(cocok("Telur ayam", "telur"), true);
  assert.equal(cocok("Mie", "mi"), true);
  assert.equal(cocok("Ikan teri", "teri"), true);
  assert.equal(adaDiStok({ stok: ["n"] }, "nasi"), false);
});

test("profilKeDb: batasi budget, validasi semester dan jenis kelamin, email tidak ditulis", () => {
  const { pengguna, kos } = profilKeDb({
    nama: " Rina ",
    email: "x@y.id",
    semester: "20",
    budget: 5000,
    jenisKelamin: "Lainnya",
    alat: ["Kompor"],
    pantangan: [],
    stok: ["Telur"],
    lokasi: "",
  });
  assert.equal(pengguna.nama, "Rina");
  assert.equal(pengguna.semester, null);
  assert.equal("email" in pengguna, false);
  assert.equal(kos.budget_harian, 10000);
  assert.equal(kos.jenis_kelamin, null);
  assert.equal(kos.lokasi, null);
  assert.deepEqual(kos.stok, ["Telur"]);
  assert.equal(profilKeDb({ budget: 999999 }).kos.budget_harian, 100000);
});
test("profilDariDb: kolom kosong tidak menimpa profil lokal; semester jadi string", () => {
  const p = profilDariDb(
    {
      nama: "",
      email: "a@b.id",
      kampus: null,
      program_studi: "TI",
      semester: 5,
      avatar: null,
    },
    {
      budget_harian: 25000,
      alat_masak: ["Kompor"],
      alergi_pantangan: [],
      jenis_kelamin: "Perempuan",
      lokasi: null,
      stok: [],
    },
  );
  assert.equal("nama" in p, false);
  assert.equal("kampus" in p, false);
  assert.equal(p.prodi, "TI");
  assert.equal(p.semester, "5");
  assert.equal(p.budget, 25000);
  assert.deepEqual(profilDariDb(null, null), {});
});

test("daftarDariDb: urut dari terlama, tanggal dipotong jadi YYYY-MM-DD", () => {
  const d = daftarDariDb([
    { resep_id: "b", tanggal: "2026-11-22" },
    { resep_id: "a", tanggal: "2026-11-20T00:00:00+00:00" },
  ]);
  assert.deepEqual(d, [
    { resepId: "a", tanggal: "2026-11-20" },
    { resepId: "b", tanggal: "2026-11-22" },
  ]);
  assert.deepEqual(daftarDariDb(null), []);
});
test("barisKeDb: buang id tak dikenal, tanggal salah, dan duplikat", () => {
  const ok = new Set(["a", "b"]);
  const daftar = [
    { resepId: "a", tanggal: "2026-11-22" },
    { resepId: "a", tanggal: "2026-11-22" },
    { resepId: "a", tanggal: "2026-11-23" },
    { resepId: "lama", tanggal: "2026-11-22" },
    { resepId: "b", tanggal: "22/11/2026" },
    null,
  ];
  assert.equal(barisKeDb("u1", daftar, ok, false).length, 2); // riwayat: kunci resep+tanggal
  assert.equal(barisKeDb("u1", daftar, ok, true).length, 1); // favorit: kunci resep saja
  assert.deepEqual(
    barisKeDb("u1", [{ resepId: "b", tanggal: "2026-11-22" }], ok),
    [{ pengguna_id: "u1", resep_id: "b", tanggal: "2026-11-22" }],
  );
});
test("seed resep: semua id resep di lib/data.js punya baris seed", async () => {
  const { readFileSync } = await import("node:fs");
  const sql = readFileSync(
    new URL("../db/seed_resep.sql", import.meta.url),
    "utf8",
  );
  for (const r of RECIPES)
    assert.ok(sql.includes(`('${r.id}',`), `seed tidak memuat ${r.id}`);
});

test("recommendDaily: dalam bujet, bervariasi, dan tidak mengulang menu yang sedang tampil", () => {
  const profil = {
    budget: 30000,
    alat: ["Kompor", "Rice Cooker"],
    pantangan: [],
    jenisKelamin: "Perempuan",
    stok: [],
  };
  const hasil = new Set();
  let sebelumnya = recommendDaily(profil);
  for (let i = 0; i < 200; i++) {
    const baru = recommendDaily(profil, sebelumnya);
    assert.notEqual(
      [...baru].sort().join(),
      [...sebelumnya].sort().join(),
      "menu sama dengan sebelumnya",
    );
    assert.ok(nutrisiDari(baru).biaya <= profil.budget, "melebihi bujet");
    hasil.add([...baru].sort().join());
    sebelumnya = baru;
  }
  assert.ok(hasil.size >= 5, `kurang bervariasi: ${hasil.size}`);
});
test("recommendDaily: bujet terlalu kecil memilih kombinasi termurah; rencana seminggu tidak mengulang hari berturut-turut", () => {
  const kecil = {
    budget: 10000,
    alat: ["Kompor", "Rice Cooker"],
    pantangan: [],
    jenisKelamin: "Perempuan",
    stok: [],
  };
  const termurah = recommendDaily(kecil);
  assert.equal(
    nutrisiDari(termurah).biaya,
    Math.min(
      ...Array.from(
        { length: 50 },
        () => nutrisiDari(recommendDaily(kecil)).biaya,
      ),
    ),
  );
  const minggu = recommendWeekly({ ...kecil, budget: 30000 });
  assert.equal(minggu.length, 7);
  for (let i = 1; i < 7; i++)
    assert.notEqual(
      [...minggu[i]].sort().join(),
      [...minggu[i - 1]].sort().join(),
    );
});

test("logKeBaris: porsi dibatasi 1-20, format lama (array) terbaca, id tak dikenal dan duplikat dibuang", () => {
  const info = new Map([
    ["a", "pagi"],
    ["b", "siang"],
  ]);
  const log = {
    "2026-11-22": { ids: ["a", "b", "b", "lama"], porsi: { a: 3, b: 99 } },
    "2026-11-21": ["a"],
    rusak: { ids: ["a"], porsi: {} },
  };
  const { baris, ids } = logKeBaris("u1", log, info, [
    "2026-11-22",
    "2026-11-21",
    "rusak",
  ]);
  assert.deepEqual(ids, { "2026-11-22": ["a", "b"], "2026-11-21": ["a"] });
  assert.equal(baris.length, 3);
  assert.deepEqual(
    baris.find((x) => x.tanggal === "2026-11-22" && x.resep_id === "b"),
    {
      pengguna_id: "u1",
      resep_id: "b",
      tanggal: "2026-11-22",
      waktu_makan: "siang",
      porsi: 20,
    },
  );
  assert.equal(baris.find((x) => x.tanggal === "2026-11-21").porsi, 1);
});
test("logDariDb: dikelompokkan per tanggal, urut pagi-siang-malam; bolak-balik dengan logKeBaris tidak berubah", () => {
  const info = new Map([
    ["a", "pagi"],
    ["b", "siang"],
    ["c", "malam"],
  ]);
  const asli = {
    "2026-11-22": { ids: ["a", "b", "c"], porsi: { a: 1, b: 2, c: 1 } },
  };
  const { baris } = logKeBaris("u1", asli, info, ["2026-11-22"]);
  const acak = [baris[2], baris[0], baris[1]];
  assert.deepEqual(logDariDb(acak), asli);
  assert.deepEqual(logDariDb(null), {});
});
test("tanggalTerbaru: hanya tanggal valid, terbaru dulu, dibatasi n", () => {
  const log = { "2026-11-01": 1, "2026-11-22": 1, "2026-11-10": 1, x: 1 };
  assert.deepEqual(tanggalTerbaru(log, 2), ["2026-11-22", "2026-11-10"]);
  assert.deepEqual(tanggalTerbaru(null), []);
});