import { supabase } from "@/lib/supabase";

// Terjemahkan pesan error Supabase yang umum; sisanya diteruskan apa adanya.
const pesan = (e) => {
  if (/invalid login credentials/i.test(e.message))
    return "Email atau kata sandi salah.";
  if (/already registered/i.test(e.message))
    return "Email sudah terdaftar. Silakan masuk.";
  if (/auth session missing|invalid.*(token|jwt)|expired/i.test(e.message))
    return "Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.";
  if (/failed to fetch|network/i.test(e.message))
    return "Tidak bisa terhubung ke server. Cek koneksi atau konfigurasi Supabase.";
  return e.message;
};

export const getSession = async () =>
  (await supabase.auth.getSession()).data.session;

export const logout = () => supabase.auth.signOut();

export async function register({ nama, email, sandi }) {
  nama = (nama || "").trim();
  email = (email || "").trim().toLowerCase();
  if (!nama) throw new Error("Nama wajib diisi.");
  if (!/^\S+@\S+\.\S+$/.test(email))
    throw new Error("Format email tidak valid.");
  if ((sandi || "").length < 8)
    throw new Error("Kata sandi minimal 8 karakter.");

  // `nama` dibaca trigger `saat_daftar` untuk mengisi tabel pengguna.
  const { data, error } = await supabase.auth.signUp({
    email,
    password: sandi,
    options: { data: { nama } },
  });
  if (error) throw new Error(pesan(error));
  if (!data.session)
    throw new Error("Akun dibuat. Cek email untuk konfirmasi, lalu masuk.");
  return { id: data.user.id, nama, email };
}

export async function login({ email, sandi }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: (email || "").trim().toLowerCase(),
    password: sandi || "",
  });
  if (error) throw new Error(pesan(error));
  return {
    id: data.user.id,
    email: data.user.email,
    nama: data.user.user_metadata?.nama || "",
  };
}

export async function kirimResetSandi(email) {
  email = (email || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email))
    throw new Error("Format email tidak valid.");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-sandi`,
  });
  if (error) throw new Error(pesan(error));
}

export async function setSandiBaru(sandi) {
  if ((sandi || "").length < 8)
    throw new Error("Kata sandi minimal 8 karakter.");
  const { error } = await supabase.auth.updateUser({ password: sandi });
  if (error) throw new Error(pesan(error));
}