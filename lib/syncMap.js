// Pemetaan murni (tanpa Supabase) untuk favorit dan riwayat menu: bentuk aplikasi <-> baris basis data.
const TGL = /^\d{4}-\d{2}-\d{2}$/;

// Baris DB -> [{ resepId, tanggal }], urut dari tanggal terlama ke terbaru (sama seperti urutan di aplikasi).
export function daftarDariDb(baris) {
  return (baris || [])
    .map((x) => ({
      resepId: x.resep_id,
      tanggal: String(x.tanggal).slice(0, 10),
    }))
    .sort((a, b) =>
      a.tanggal < b.tanggal ? -1 : a.tanggal > b.tanggal ? 1 : 0,
    );
}

// [{ resepId, tanggal }] -> baris siap ditulis. Entri tak valid dibuang: tanggal salah format, atau resep tak dikenal
// (id lama yang sudah dihapus dari daftar resep akan melanggar foreign key dan menggagalkan seluruh penulisan).
// perResep = true untuk favorit (kunci: pengguna + resep); false untuk riwayat (kunci: pengguna + resep + tanggal).
export function barisKeDb(uid, daftar, idValid, perResep = false) {
  const lihat = new Set();
  const hasil = [];
  for (const x of daftar || []) {
    if (!x || !TGL.test(x.tanggal || "")) continue;
    if (idValid && !idValid.has(x.resepId)) continue;
    const kunci = perResep ? x.resepId : `${x.resepId}|${x.tanggal}`;
    if (lihat.has(kunci)) continue;
    lihat.add(kunci);
    hasil.push({ pengguna_id: uid, resep_id: x.resepId, tanggal: x.tanggal });
  }
  return hasil;
}


// ===== Catatan makan (log) <-> tabel jadwal_makan =====
// Di aplikasi: log[tanggal] = { ids: [resepId], porsi: { resepId: n } } (atau array id untuk format lama).
const URUT_SLOT = { pagi: 0, siang: 1, malam: 2 };

// Baris jadwal_makan -> objek log. Urutan id mengikuti waktu makan (pagi, siang, malam).
export function logDariDb(baris) {
  const hasil = {};
  const urut = [...(baris || [])].sort((a, b) => (URUT_SLOT[a.waktu_makan] ?? 9) - (URUT_SLOT[b.waktu_makan] ?? 9));
  for (const x of urut) {
    const t = String(x.tanggal).slice(0, 10);
    if (!hasil[t]) hasil[t] = { ids: [], porsi: {} };
    hasil[t].ids.push(x.resep_id);
    hasil[t].porsi[x.resep_id] = x.porsi || 1;
  }
  return hasil;
}

// Tanggal-tanggal log terbaru (maksimal n hari terakhir) yang formatnya valid, terbaru lebih dulu.
export function tanggalTerbaru(log, n = 14) {
  return Object.keys(log || {}).filter((t) => TGL.test(t)).sort().reverse().slice(0, n);
}

// Objek log -> baris jadwal_makan untuk tanggal yang dipilih.
// infoResep = Map(idResep -> waktu makan); resep tak dikenal dibuang. Porsi dibatasi 1-20.
// `ids[tanggal]` memuat id yang dipertahankan per tanggal (dipakai untuk menghapus baris yang sudah tidak ada).
export function logKeBaris(uid, log, infoResep, tanggalDipilih) {
  const baris = [];
  const ids = {};
  for (const t of tanggalDipilih || []) {
    const e = log?.[t];
    if (!e || !TGL.test(t)) continue;
    const daftar = Array.isArray(e) ? e : e.ids || [];
    const porsi = Array.isArray(e) ? {} : e.porsi || {};
    ids[t] = [];
    for (const id of daftar) {
      if (!infoResep.has(id) || ids[t].includes(id)) continue;
      ids[t].push(id);
      baris.push({
        pengguna_id: uid,
        resep_id: id,
        tanggal: t,
        waktu_makan: infoResep.get(id),
        porsi: Math.min(20, Math.max(1, Math.round(Number(porsi[id])) || 1)),
      });
    }
  }
  return { baris, ids };
}
