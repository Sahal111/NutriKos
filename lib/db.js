import { supabase } from "@/lib/supabase";
import { RECIPES } from "./data";
import { profilDariDb, profilKeDb } from "./profilMap";
import { kunciTanggal } from './gizi';
import { daftarDariDb, barisKeDb, logDariDb, logKeBaris } from './syncMap';

const ID_RESEP = new Set(RECIPES.map((r) => r.id));
const INFO_RESEP = new Map(RECIPES.map((r) => [r.id, r.slot])); // id resep -> waktu makan
const idPengguna = async () =>
  (await supabase.auth.getSession()).data.session?.user.id || null;

// Mengembalikan profil dari basis data, atau null bila belum masuk / belum ada data.
export async function muatProfil() {
  const uid = await idPengguna();
  if (!uid) return null;
  const [p, k] = await Promise.all([
    supabase
      .from("pengguna")
      .select("nama,email,kampus,program_studi,semester,avatar")
      .eq("id", uid)
      .maybeSingle(),
    supabase
      .from("profil_kos")
      .select(
        "budget_harian,alat_masak,alergi_pantangan,jenis_kelamin,lokasi,stok",
      )
      .eq("pengguna_id", uid)
      .maybeSingle(),
  ]);
  if (p.error || k.error) throw new Error((p.error || k.error).message);
  return profilDariDb(p.data, k.data);
}

// Menyimpan profil ke basis data. Diam saja bila belum masuk.
export async function simpanProfil(profile) {
  const uid = await idPengguna();
  if (!uid) return;
  const { pengguna, kos } = profilKeDb(profile);
  const a = await supabase.from("pengguna").update(pengguna).eq("id", uid);
  const b = await supabase
    .from("profil_kos")
    .upsert({ pengguna_id: uid, ...kos }, { onConflict: "pengguna_id" });
  if (a.error || b.error) throw new Error((a.error || b.error).message);
}// Mengembalikan { favorit, riwayat } dari basis data, atau null bila belum masuk.
export async function muatFavoritRiwayat() {
  const uid = await idPengguna();
  if (!uid) return null;
  const [f, r] = await Promise.all([
    supabase.from('favorit').select('resep_id,tanggal').eq('pengguna_id', uid),
    supabase.from('riwayat_menu').select('resep_id,tanggal').eq('pengguna_id', uid).order('tanggal', { ascending: false }).limit(200),
  ]);
  if (f.error || r.error) throw new Error((f.error || r.error).message);
  return { favorit: daftarDariDb(f.data), riwayat: daftarDariDb(r.data) };
}

// Isi tabel favorit dibuat sama dengan daftar di aplikasi: yang baru ditambah, yang sudah tidak difavoritkan dihapus.
export async function simpanFavorit(favorit) {
  const uid = await idPengguna();
  if (!uid) return;
  const baris = barisKeDb(uid, favorit, ID_RESEP, true);
  if (baris.length) {
    const u = await supabase.from('favorit').upsert(baris, { onConflict: 'pengguna_id,resep_id', ignoreDuplicates: true });
    if (u.error) throw new Error(u.error.message);
  }
  let q = supabase.from('favorit').delete().eq('pengguna_id', uid);
  if (baris.length) q = q.not('resep_id', 'in', `(${baris.map((b) => `"${b.resep_id}"`).join(',')})`);
  const d = await q;
  if (d.error) throw new Error(d.error.message);
}

// Riwayat hanya bertambah: entri yang sudah ada dibiarkan.
export async function simpanRiwayat(riwayat) {
  const uid = await idPengguna();
  if (!uid) return;
  const baris = barisKeDb(uid, riwayat, ID_RESEP, false);
  if (!baris.length) return;
  const u = await supabase.from('riwayat_menu').upsert(baris, { onConflict: 'pengguna_id,resep_id,tanggal', ignoreDuplicates: true });
  if (u.error) throw new Error(u.error.message);
}


// Catatan makan 30 hari terakhir dari jadwal_makan, dalam bentuk objek log aplikasi. null bila belum masuk.
export async function muatLog() {
  const uid = await idPengguna();
  if (!uid) return null;
  const sejak = kunciTanggal(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const r = await supabase.from('jadwal_makan').select('resep_id,tanggal,waktu_makan,porsi').eq('pengguna_id', uid).gte('tanggal', sejak);
  if (r.error) throw new Error(r.error.message);
  return logDariDb(r.data);
}

// Menyimpan catatan makan untuk tanggal-tanggal yang berubah: porsi diperbarui, resep yang sudah tidak dicatat di tanggal itu dihapus.
export async function simpanLog(log, tanggalDipilih) {
  const uid = await idPengguna();
  if (!uid) return;
  const { baris, ids } = logKeBaris(uid, log, INFO_RESEP, tanggalDipilih);
  if (baris.length) {
    const u = await supabase.from('jadwal_makan').upsert(baris, { onConflict: 'pengguna_id,tanggal,resep_id' });
    if (u.error) throw new Error(u.error.message);
  }
  for (const [tanggal, daftar] of Object.entries(ids)) {
    let q = supabase.from('jadwal_makan').delete().eq('pengguna_id', uid).eq('tanggal', tanggal);
    if (daftar.length) q = q.not('resep_id', 'in', `(${daftar.map((i) => `"${i}"`).join(',')})`);
    const d = await q;
    if (d.error) throw new Error(d.error.message);
  }
}