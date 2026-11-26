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
  allowedRecipes,
  ideaDariId,
  biayaHarianTermurah,
} from "../lib/recommend.js";
import { UKURAN_HURUF } from "../lib/ukuranHuruf.js";
import { profilDariDb, profilKeDb } from "../lib/profilMap.js";
import { catatPakaiAI } from "../lib/kuotaAI.js";
import { cariResep } from "../lib/cari.js";
import { buatNotifikasi } from "../lib/notifikasi.js";
import {
  daftarDariDb,
  barisKeDb,
  logDariDb,
  logKeBaris,
  tanggalTerbaru,
} from "../lib/syncMap.js";
import {
  penggunaDariRequest,
  tokenDariRequest,
  kosongkanCacheAuth,
} from "../lib/authServer.js";
import { TKPI, GRAM_RESEP, hitungGizi } from "../lib/tkpi.js";

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

test("penggunaDariRequest: tanpa token / env kosong / token ditolak = null; token sah = id; hasil disimpan sebentar", async () => {
  const awal = {
    fetch: globalThis.fetch,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
  const req = (auth) => ({
    headers: {
      get: (k) => (k.toLowerCase() === "authorization" ? auth : null),
    },
  });
  let panggilan = 0;
  globalThis.fetch = async (url, opt) => {
    panggilan++;
    assert.equal(url, "https://x.supabase.co/auth/v1/user");
    assert.equal(opt.headers.apikey, "anon");
    return opt.headers.Authorization === "Bearer bagus"
      ? { ok: true, json: async () => ({ id: "u-1" }) }
      : { ok: false };
  };
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    kosongkanCacheAuth();
    assert.equal(await penggunaDariRequest(req(null)), null);
    assert.equal(await penggunaDariRequest(req("Basic abc")), null);
    assert.equal(
      panggilan,
      0,
      "tidak boleh menghubungi Supabase tanpa token Bearer",
    );
    assert.equal(await penggunaDariRequest(req("Bearer salah")), null);
    assert.equal(await penggunaDariRequest(req("Bearer bagus")), "u-1");
    assert.equal(await penggunaDariRequest(req("bearer bagus")), "u-1");
    assert.equal(panggilan, 2, "token sah kedua kali dilayani dari cache");
    globalThis.fetch = async () => {
      throw new Error("jaringan putus");
    };
    kosongkanCacheAuth();
    assert.equal(
      await penggunaDariRequest(req("Bearer bagus")),
      null,
      "Supabase tak terjangkau = ditolak",
    );
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    assert.equal(
      await penggunaDariRequest(req("Bearer bagus")),
      null,
      "env kosong = ditolak",
    );
  } finally {
    globalThis.fetch = awal.fetch;
    if (awal.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = awal.url;
    if (awal.key === undefined)
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = awal.key;
  }
});

test("biayaHarianTermurah: sama dengan kombinasi termurah hasil hitung manual; null bila ada waktu makan tanpa resep", () => {
  const p = { alat: ["Kompor", "Rice Cooker"], pantangan: [], stok: [] };
  const ok = allowedRecipes(p);
  const by = (s) => ok.filter((r) => r.slot === s);
  let manual = Infinity;
  for (const a of by("pagi"))
    for (const b of by("siang"))
      for (const c of by("malam"))
        manual = Math.min(manual, a.harga + b.harga + c.harga);
  assert.equal(biayaHarianTermurah(p), manual);
  assert.equal(
    biayaHarianTermurah({
      alat: [],
      pantangan: ["Vegetarian", "Alergi Telur", "Kacang-kacangan", "Seafood"],
      stok: [],
    }),
    null,
  );
});
test("ideaDariId: resep yang boleh dipakai dihitung kecocokannya; id tak dikenal atau terlarang = null", () => {
  const p = {
    alat: ["Kompor", "Rice Cooker"],
    pantangan: [],
    stok: ["Telur", "Nasi"],
  };
  const ide = ideaDariId("nasi-telur-orak-arik", p);
  assert.equal(ide.recipe.id, "nasi-telur-orak-arik");
  assert.ok(ide.persen > 0 && Array.isArray(ide.kurang));
  assert.equal(ideaDariId("tidak-ada", p), null);
  assert.equal(
    ideaDariId("nasi-telur-orak-arik", { ...p, pantangan: ["Alergi Telur"] }),
    null,
  );
});
test("UKURAN_HURUF: tiga pilihan dengan Normal = 100%", () => {
  assert.deepEqual(
    UKURAN_HURUF.map((u) => u.kode),
    ["normal", "besar", "sangat-besar"],
  );
  assert.equal(UKURAN_HURUF[0].persen, 100);
});

test("cariResep: semua kata harus cocok (nama atau bahan), nama diutamakan, tak peka huruf besar, kosong = []", () => {
  assert.deepEqual(cariResep(""), []);
  assert.deepEqual(cariResep("   "), []);
  assert.deepEqual(cariResep("zzzxxx"), []);
  const telur = cariResep("TELUR", RECIPES, 20);
  assert.ok(telur.length > 1);
  assert.ok(
    telur[0].nama.toLowerCase().includes("telur"),
    "yang namanya memuat kata dulu",
  );
  assert.ok(
    telur.every(
      (r) =>
        r.nama.toLowerCase().includes("telur") ||
        r.bahan.some((b) => b.nama.toLowerCase().includes("telur")),
    ),
  );
  const dua = cariResep("nasi kangkung", RECIPES, 20);
  assert.ok(
    dua.length >= 1 &&
      dua.every((r) =>
        /kangkung/i.test(r.nama + r.bahan.map((b) => b.nama).join(" ")),
      ),
  );
  assert.equal(cariResep("telur", RECIPES, 2).length, 2);
});
test("buatNotifikasi: pengingat hanya bila masih berlaku", () => {
  const profile = { budget: 20000, stok: [] };
  const id = (x) => x.map((n) => n.id);
  assert.deepEqual(
    id(buatNotifikasi({ profile, plan: [], biaya: 0, sudahDicatat: false })),
    ["menu", "stok"],
  );
  assert.deepEqual(
    id(
      buatNotifikasi({
        profile,
        plan: ["a"],
        biaya: 25000,
        sudahDicatat: false,
      }),
    ),
    ["budget", "catat", "stok"],
  );
  assert.deepEqual(
    id(
      buatNotifikasi({
        profile: { ...profile, stok: ["Telur"] },
        plan: ["a"],
        biaya: 15000,
        sudahDicatat: true,
      }),
    ),
    [],
  );
  assert.match(
    buatNotifikasi({
      profile,
      plan: ["a"],
      biaya: 25000,
      sudahDicatat: true,
    })[0].isi,
    /25\.000.*20\.000/,
  );
});
test("tokenDariRequest dan catatPakaiAI: ok / habis / error, gagal-aman, mengirim token dan batas", async () => {
  const req = (auth) => ({ headers: { get: () => auth } });
  assert.equal(tokenDariRequest(req("Bearer abc")), "abc");
  assert.equal(tokenDariRequest(req("Basic abc")), null);
  assert.equal(tokenDariRequest(req(null)), null);
  const awal = {
    fetch: globalThis.fetch,
    warn: console.warn,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
  console.warn = () => {};
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  try {
    let terakhir;
    const balas = (resp) => {
      globalThis.fetch = async (u, o) => {
        terakhir = { u, o };
        return resp;
      };
    };
    balas({ ok: true, json: async () => true });
    assert.equal(await catatPakaiAI("tok", 7), "ok");
    assert.equal(
      terakhir.u,
      "https://x.supabase.co/rest/v1/rpc/catat_pakai_ai",
    );
    assert.equal(terakhir.o.headers.Authorization, "Bearer tok");
    assert.equal(terakhir.o.headers.apikey, "anon");
    assert.deepEqual(JSON.parse(terakhir.o.body), { maks: 7 });
    balas({ ok: true, json: async () => false });
    assert.equal(await catatPakaiAI("tok", 7), "habis");
    balas({ ok: false, status: 404 });
    assert.equal(await catatPakaiAI("tok", 7), "error");
    globalThis.fetch = async () => {
      throw new Error("putus");
    };
    assert.equal(await catatPakaiAI("tok", 7), "error");
    assert.equal(await catatPakaiAI(null, 7), "error");
  } finally {
    globalThis.fetch = awal.fetch;
    console.warn = awal.warn;
    if (awal.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = awal.url;
    if (awal.key === undefined)
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = awal.key;
  }
});

test("TKPI: setiap bahan resep punya komposisi dan takaran gram; bahan di luar TKPI wajib bertanda proksi", () => {
  for (const r of RECIPES) {
    assert.ok(GRAM_RESEP[r.id], `takaran resep ${r.id} belum ada`);
    for (const b of r.bahan) {
      assert.ok(TKPI[b.kunci], `komposisi ${b.kunci} belum ada`);
      assert.ok(
        b.kunci in GRAM_RESEP[r.id],
        `takaran ${b.kunci} di ${r.id} belum ada`,
      );
    }
  }
  const tanpaKode = Object.entries(TKPI)
    .filter(([, x]) => !x.kode)
    .map(([k]) => k);
  assert.deepEqual(tanpaKode, ["garam"]);
  const proksi = Object.entries(TKPI)
    .filter(([, x]) => x.proksi)
    .map(([k]) => k)
    .sort();
  assert.deepEqual(proksi, ["mi", "oat", "selai", "tauge"]);
  for (const x of Object.values(TKPI))
    for (const k of ["energi", "protein", "lemak", "karbo", "serat"])
      assert.ok(Number.isFinite(x[k]) && x[k] >= 0);
});
test("hitungGizi: dihitung dari gram x TKPI per 100 g; menumis/menggoreng menambah 10 g minyak (884 kkal/100 g)", () => {
  const roti = hitungGizi({
    id: "roti-selai-pisang",
    langkah: ["Oles selai."],
  });
  assert.equal(roti.kalori, 346); // 75 g roti (248) + 15 g selai (527) + 75 g pisang (108)
  assert.equal(roti.karbo, 65.1);
  const tanpa = hitungGizi({
    id: "tumis-tahu-tauge",
    langkah: ["Rebus tahu."],
  });
  const dengan = hitungGizi({
    id: "tumis-tahu-tauge",
    langkah: ["Tumis tahu."],
  });
  assert.ok(Math.abs(dengan.kalori - tanpa.kalori - 88) <= 1);
  assert.equal(hitungGizi({ id: "tidak-ada", langkah: [] }), null);
});
test("seed gizi: semua bahan TKPI dan semua resep ada di db/seed_gizi.sql", async () => {
  const { readFileSync } = await import("node:fs");
  const sql = readFileSync(
    new URL("../db/seed_gizi.sql", import.meta.url),
    "utf8",
  );
  for (const k of Object.keys(TKPI))
    assert.ok(sql.includes(`('${k}',`), `bahan ${k} tidak ada di seed`);
  for (const id of Object.keys(GRAM_RESEP))
    assert.ok(sql.includes(`('${id}',`), `resep ${id} tidak ada di seed`);
});