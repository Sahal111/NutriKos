import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Placeholder hanya agar `next build` tidak crash bila env belum diisi.
// Saat dijalankan sungguhan, isi kedua variabel ini (lihat .env.example).
export const supabaseTerkonfigurasi = Boolean(url && key);

export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  key || "placeholder-anon-key",
);
