// Memeriksa token masuk (Supabase Auth) di sisi server. Mengembalikan id pengguna, atau null bila tidak sah.
// Aman secara bawaan: bila env Supabase tidak ada atau Supabase tidak terjangkau, hasilnya null (permintaan ditolak).
const TTL = 60_000; // hasil pemeriksaan disimpan 60 detik agar tidak menghubungi Supabase di setiap pesan chat
const cache = new Map();

export const kosongkanCacheAuth = () => cache.clear();

// Token Bearer dari header Authorization, atau null.
export function tokenDariRequest(req) {
  return /^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization') || '')?.[1] || null;
}

export async function penggunaDariRequest(req) {
  const token = tokenDariRequest(req);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!token || !url || !key) return null;

  const now = Date.now();
  const hit = cache.get(token);
  if (hit && hit.exp > now) return hit.id;

  try {
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: key },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    const id = (await r.json())?.id || null;
    if (id) {
      if (cache.size > 500) cache.clear();
      cache.set(token, { id, exp: now + TTL });
    }
    return id;
  } catch {
    return null;
  }
}
