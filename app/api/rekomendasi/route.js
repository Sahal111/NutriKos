import { allowedRecipes, recommendDaily, ideasFromStock, nutrisiDari } from '@/lib/recommend';
import { jalankanAI } from '@/lib/aiPipeline';

export const runtime = 'nodejs';

// ---- pembatas sederhana (per IP, 20 permintaan / menit) ----
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 20;
}

const bersih = (s, n = 50) => String(s).replace(/[^\p{L}\p{N}\s&/().,-]/gu, '').slice(0, n).trim();

function bacaProfil(p = {}) {
  return {
    budget: Math.min(100000, Math.max(10000, Number(p.budget) || 30000)),
    alat: (Array.isArray(p.alat) ? p.alat : []).slice(0, 8).map((x) => bersih(x)),
    pantangan: (Array.isArray(p.pantangan) ? p.pantangan : []).slice(0, 8).map((x) => bersih(x)),
    stok: (Array.isArray(p.stok) ? p.stok : []).slice(0, 20).map((x) => bersih(x)).filter(Boolean),
  };
}

function bangunPrompt(mode, profil, kandidat) {
  const daftar = kandidat
    .map(
      (r) =>
        `${r.id} | ${r.slot} | ${r.nama} | Rp${r.harga} | protein ${r.protein}g | serat ${r.serat}g | bahan: ${r.bahan.map((b) => b.nama).join(', ')}`
    )
    .join('\n');

  const tugas =
    mode === 'bahan'
      ? 'Pilih 3 resep yang paling bisa dimasak dari bahan stok pengguna dengan tambahan belanja paling sedikit.'
      : 'Pilih TEPAT 3 resep: satu untuk slot pagi, satu untuk siang, satu untuk malam. Total harga harus <= budget harian. Utamakan protein dan serat tinggi serta pemakaian bahan stok agar belanja minimal.';

  return `Kamu adalah asisten gizi cerdas untuk mahasiswa anak kos di Indonesia bernama NutriKos AI. ${tugas}
Data pengguna:
Bujet harian: Rp${profil.budget}
Bahan stok kos: ${profil.stok.join(', ') || '(kosong)'}
Daftar resep yang boleh dipilih (id | slot | nama | harga | gizi | bahan):
${daftar}

Jawab HANYA JSON valid tanpa format markdown atau teks lain, contoh format persis:
{"ids":["id1","id2","id3"],"alasan":"2-3 kalimat penjelasan ramah dan solutif mengapa menu ini cocok untuk bujet dan kesehatan mahasiswa kos."}
Gunakan HANYA ID dari daftar resep di atas.`;
}

function bangunPromptChat(pesan, profil, riwayat = []) {
  const riwayatTeks = riwayat.length
    ? riwayat
        .map((m) => `${m.dari === 'user' ? 'Mahasiswa' : 'NutriKos AI'}: ${m.teks}`)
        .join('\n')
    : '';

  return `Kamu adalah NutriKos AI — teman ngobrol sekaligus konsultan gizi buat anak kos di Indonesia. Kamu bukan chatbot formal, kamu teman yang asyik, ngerti banget kondisi kantong tipis akhir bulan, dan selalu punya solusi kreatif.

Kepribadianmu:
- Ngobrol natural, santai, kayak temen kuliah — pakai "kamu", bisa sesekali pakai kata gaul/Gen Z yang wajar (nggak lebay)
- Langsung to the point, nggak pakai basa-basi panjang di awal (jangan mulai dengan "Halo!" terus panjang lebar)
- Kalau ditanya resep, langsung kasih resep + estimasi harganya
- Kalau bisa dihemat, kasih trik konkret (pasar subuh, beli satuan, rice cooker hack, warung gang, dll)
- Responsmu variatif — jangan selalu 3-4 paragraf, sesuaikan panjang jawaban dengan pertanyaannya. Kalau pertanyaan simpel, jawab singkat. Kalau kompleks, boleh panjangan dikit
- Jangan pakai format bullet yang terlalu kaku kalau nggak perlu; kadang jawab mengalir aja lebih enak

Profil mahasiswa ini:
- Bujet: Rp${(profil?.budget || 30000).toLocaleString('id-ID')}/hari
- Alat masak: ${(profil?.alat?.length ? profil.alat : ['Rice Cooker', 'Kompor']).join(', ')}
- Pantangan: ${(profil?.pantangan?.length ? profil.pantangan : ['Halal']).join(', ')}
- Stok bahan di kos: ${(profil?.stok?.length ? profil.stok : ['—']).join(', ')}

${riwayatTeks ? `Riwayat obrolan sebelumnya:\n${riwayatTeks}\n` : ''}
Pesan terbaru mahasiswa: "${pesan}"

Balas sebagai NutriKos AI. Langsung jawab tanpa nulis "NutriKos AI:" di depannya.`;
}

async function panggilAI(prompt) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (key) {
    // Model resmi yang aktif dan didukung untuk API key Gemini baru
    const models = [
      process.env.GEMINI_MODEL?.trim() || 'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-flash-latest',
    ];

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': key,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
            },
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (r.ok) {
          const j = await r.json();
          const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
          if (text) {
            console.log(`[NutriKos AI] Sukses memanggil model: ${model}`);
            return text;
          }
        } else {
          const errBody = await r.text().catch(() => '');
          console.warn(`[NutriKos AI] ${model} status ${r.status}:`, errBody.slice(0, 150));
        }
      } catch (err) {
        console.warn(`[NutriKos AI] Error fetch ${model}:`, err.message);
      }
    }
  }

  // Coba Anthropic jika ada
  if (process.env.ANTHROPIC_API_KEY) {
    const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY.trim(),
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (r.ok) {
        const j = await r.json();
        return j.content?.map((c) => c.text || '').join('') || '';
      }
    } catch (err) {
      console.warn('[NutriKos AI] Gagal Anthropic:', err.message);
    }
  }

  throw new Error('API key belum valid atau tidak dapat terhubung');
}

// Gizi & biaya dihitung sistem dari data resep, bukan dari keluaran AI.
function ringkasan(ids) {
  const n = nutrisiDari(ids);
  return { biaya: n.biaya, protein: n.protein, karbo: n.karbo, sayur: n.sayur, kalori: n.kalori };
}

function hasilAturan(mode, profil) {
  if (mode === 'bahan') {
    const ide = ideasFromStock(profil).slice(0, 3);
    return {
      ids: ide.map((x) => x.recipe.id),
      alasan: `Dipilih berdasarkan ${profil.stok.length} bahan stok yang kamu punya di kos agar menghemat belanja dan tidak mubazir.`,
      ringkasan: ringkasan(ide.map((x) => x.recipe.id)),
      sumber: 'aturan',
    };
  }
  const plan = recommendDaily(profil);
  const n = nutrisiDari(plan);
  return {
    ids: plan,
    ringkasan: ringkasan(plan),
    alasan: `Paket menu seimbang ini disusun pas dengan target bujetmu (${profil.budget ? 'Rp' + profil.budget.toLocaleString('id-ID') : 'Rp30.000'}/hari) serta memaksimalkan asupan protein (${n.protein}g) dan serat (${n.serat}g) untuk stamina kuliah harianmu.`,
    sumber: 'aturan',
  };
}

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'lokal';
  if (limited(ip)) {
    return Response.json(
      { error: 'Terlalu banyak permintaan, coba lagi sebentar.' },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Format JSON salah' }, { status: 400 });
  }

  const mode = body.mode || 'menu';
  const profil = bacaProfil(body.profile);

  // 1. Mode Chat Interaktif dengan AI
  if (mode === 'chat') {
    const pesan = String(body.pesan || '').trim().slice(0, 500);
    const riwayat = (Array.isArray(body.riwayat) ? body.riwayat.slice(-10) : []).map((m) => ({
      dari: m?.dari === 'user' ? 'user' : 'ai',
      teks: String(m?.teks || '').slice(0, 500),
    }));
    if (!pesan) return Response.json({ balasan: 'Hei, mau tanya apa nih? Soal menu, bujet, atau resep?' });

    try {
      const prompt = bangunPromptChat(pesan, profil, riwayat);
      const jawaban = await panggilAI(prompt);
      return Response.json({ balasan: jawaban, sumber: 'ai' });
    } catch (e) {
      // Fallback jawaban cerdas lokal jika offline/tanpa API key
      const pesanLower = pesan.toLowerCase();
      const alatInfo = (profil.alat && profil.alat.length) ? `alat ${profil.alat.join(', ')}` : 'alat seadanya';
      let fallbackText = `Dengan bujet Rp${(profil.budget || 30000).toLocaleString('id-ID')}/hari dan ${alatInfo}, fokus ke protein murah dulu: telur, tahu, tempe. Belanja sayur di warung gang atau pasar subuh bisa hemat 40% loh!`;

      if (pesanLower.includes('tempe')) {
        fallbackText = 'Tempe itu jagoan anak kos! Coba: 1) Tempe orek kecap (potong dadu, goreng, tumis bawang + kecap manis), 2) Nasi liwet tempe di rice cooker (masukin tempe sama bawang putih waktu masak nasi), atau 3) Tempe goreng tepung renyah. Murah, gampang, dan proteinnya lumayan tinggi!';
      } else if (pesanLower.includes('tahu')) {
        fallbackText = 'Tahu gampang banget! Tumis tahu tauge kecap cuma 10 menit, atau coba tahu orak-arik telur, atau sup tahu sayur bening yang segar. Semua bisa di rice cooker/kompor dan harganya di bawah Rp5.000!';
      } else if (pesanLower.includes('telur')) {
        fallbackText = 'Telur itu superfood-nya anak kos. 1 butir ~6g protein, harga Rp2.000-an. Variasiin jadi dadar daun bawang, orak-arik kol, atau telur rebus kecap — bisa di rice cooker semua!';
      } else if (pesanLower.includes('kangkung') || pesanLower.includes('bayam') || pesanLower.includes('sayur')) {
        fallbackText = 'Kangkung sama bayam itu Rp2.000-3.000 seikat, worth it banget! Tumis 3-5 menit sama bawang + cabai rawit sudah enak. Jangan overcook biar seratnya tetap bagus.';
      } else if (pesanLower.includes('bujet') || pesanLower.includes('hemat') || pesanLower.includes('uang')) {
        fallbackText = `Trik hemat bujet Rp${(profil.budget || 30000).toLocaleString('id-ID')}/hari: masak nasi sendiri (hemat Rp10K/hari), beli bumbu racik eceran Rp1.000, dan belanja sayur ikat di warung subuh. Protein dari tahu-tempe-telur sudah cukup gizi!`;
      } else if (pesanLower.includes('rice cooker')) {
        fallbackText = 'Rice cooker bukan cuma buat nasi! Kamu bisa masak nasi liwet tempe, bubur kacang hijau, sup sayur bening, sampai ngukus telur + tahu sekaligus bareng nasi. Life hack banget!';
      }
      return Response.json({ balasan: fallbackText, sumber: 'aturan' });
    }
  }

  // 2. Mode Rekomendasi Menu & Bahan Sisa
  // Alur: prompt -> AI -> validasi -> (coba ulang sekali) -> cadangan berbasis aturan. Gizi & biaya dihitung sistem.
  const kandidat = allowedRecipes(profil);
  if (kandidat.length === 0) return Response.json(hasilAturan(mode, profil));

  const hasil = await jalankanAI({
    mode: mode === 'bahan' ? 'bahan' : 'menu',
    profil,
    prompt: bangunPrompt(mode, profil, kandidat),
    panggil: panggilAI,
  });
  if (!hasil) return Response.json(hasilAturan(mode, profil));
  return Response.json({ ...hasil, ringkasan: ringkasan(hasil.ids) });
}
