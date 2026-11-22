// Pemetaan murni (tanpa Supabase) antara baris basis data dan bentuk profil di aplikasi.
const buang = (o) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined && v !== null),
  );

// Baris `pengguna` + `profil_kos` -> objek profil aplikasi (hanya kolom yang ada).
export function profilDariDb(p, k) {
  return buang({
    nama: p?.nama || undefined,
    email: p?.email,
    kampus: p?.kampus,
    prodi: p?.program_studi,
    semester: p?.semester != null ? String(p.semester) : undefined,
    avatar: p?.avatar,
    budget: k?.budget_harian,
    alat: k?.alat_masak,
    pantangan: k?.alergi_pantangan,
    jenisKelamin: k?.jenis_kelamin,
    lokasi: k?.lokasi,
    stok: k?.stok,
  });
}

// Objek profil aplikasi -> baris yang siap ditulis ke `pengguna` dan `profil_kos`.
// Email tidak ditulis: email dikelola Supabase Auth.
export function profilKeDb(profile) {
  const semester = Number(profile.semester);
  return {
    pengguna: {
      nama: (profile.nama || "").trim(),
      kampus: profile.kampus || null,
      program_studi: profile.prodi || null,
      semester: semester >= 1 && semester <= 14 ? semester : null,
      avatar: profile.avatar || null,
    },
    kos: {
      budget_harian: Math.min(
        100000,
        Math.max(10000, Number(profile.budget) || 30000),
      ),
      alat_masak: profile.alat || [],
      alergi_pantangan: profile.pantangan || [],
      jenis_kelamin: ["Laki-laki", "Perempuan"].includes(profile.jenisKelamin)
        ? profile.jenisKelamin
        : null,
      lokasi: profile.lokasi || null,
      stok: profile.stok || [],
    },
  };
}
