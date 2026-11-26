import { supabase } from "@/lib/supabase";

// Token masuk dikirim ke server; tanpa token (belum masuk / sesi habis) server menolak dengan 401.
async function headerMasuk() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Memanggil /api/rekomendasi. Mengembalikan null bila gagal (pemanggil memakai cadangan lokal).
export async function mintaAI(mode, profile) {
  try {
    const { budget, alat, pantangan, stok } = profile || {};
    const res = await fetch("/api/rekomendasi", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await headerMasuk()) },
      body: JSON.stringify({
        mode,
        profile: { budget, alat, pantangan, stok },
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

// Fitur Chat Interaktif dengan Asisten AI NutriKos
export async function chatAI(pesan, profile, riwayat = []) {
  try {
    const { budget, alat, pantangan, stok } = profile || {};
    const res = await fetch("/api/rekomendasi", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await headerMasuk()) },
      body: JSON.stringify({
        mode: "chat",
        pesan,
        riwayat,
        profile: { budget, alat, pantangan, stok },
      }),
    });
    if (res.status === 401)
      return {
        balasan: "Sesimu sudah habis. Masuk lagi dulu ya, baru kita ngobrol!",
      };
    if (res.status === 429)
      return {
        balasan: "Terlalu banyak pertanyaan sekaligus, tunggu semenit ya!",
      };
    if (!res.ok)
      return { balasan: "Lagi ada gangguan nih, coba tanya lagi bentar ya!" };
    return await res.json();
  } catch (e) {
    return {
      balasan: "Koneksi putus nih. Cek internet dulu ya, terus tanya lagi!",
    };
  }
}
