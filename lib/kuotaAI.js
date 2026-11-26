// Kuota harian pemakaian AI per pengguna, dicatat di database lewat fungsi catat_pakai_ai (lihat db/schema.sql).
// Mengembalikan 'ok' (boleh memanggil AI), 'habis' (kuota hari ini terpakai), atau 'error' (kuota tidak bisa diperiksa).
// Gagal-aman: selain 'ok', pemanggil tidak boleh memanggil AI.
export async function catatPakaiAI(token, maks = Number(process.env.AI_KUOTA_HARIAN) || 60) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!token || !url || !key) return 'error';
  try {
    const r = await fetch(`${url}/rest/v1/rpc/catat_pakai_ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: key },
      body: JSON.stringify({ maks }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) {
      console.warn('[NutriKos] Kuota AI: gagal memeriksa kuota, status', r.status);
      return 'error';
    }
    return (await r.json()) === true ? 'ok' : 'habis';
  } catch (e) {
    console.warn('[NutriKos] Kuota AI: gagal memeriksa kuota:', e.message);
    return 'error';
  }
}
