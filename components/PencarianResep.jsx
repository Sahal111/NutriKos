'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { cariResep } from '@/lib/cari';
import { rupiah } from '@/lib/data';

const SLOT = { pagi: 'Sarapan', siang: 'Makan siang', malam: 'Makan malam' };

// Kolom cari resep di header. Layar lebar: kolom isian langsung. Layar kecil: ikon yang membuka panel.
export default function PencarianResep() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [fokus, setFokus] = useState(false);
  const [panel, setPanel] = useState(false);
  const kotak = useRef(null);
  const hasil = cariResep(q);
  const tampil = (fokus || panel) && q.trim().length > 0;

  useEffect(() => {
    if (!fokus && !panel) return;
    const tutup = () => { setFokus(false); setPanel(false); };
    const luar = (e) => { if (kotak.current && !kotak.current.contains(e.target)) tutup(); };
    const esc = (e) => { if (e.key === 'Escape') tutup(); };
    document.addEventListener('mousedown', luar);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', luar);
      document.removeEventListener('keydown', esc);
    };
  }, [fokus, panel]);

  const pilih = (id) => {
    setQ('');
    setFokus(false);
    setPanel(false);
    router.push(`/menu/${id}`);
  };

  return (
    <div ref={kotak} className="relative">
      <button
        type="button"
        aria-label="Cari resep"
        aria-expanded={panel}
        onClick={() => setPanel((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-dark md:hidden"
      >
        <Search size={20} />
      </button>

      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); if (hasil[0]) pilih(hasil[0].id); }}
        className={`${panel ? 'absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-xs rounded-2xl border border-slate-200 bg-white p-2 shadow-lg' : 'hidden'} md:relative md:top-0 md:block md:w-56 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none lg:w-72`}
      >
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFokus(true)}
            placeholder="Cari resep atau bahan..."
            aria-label="Cari resep atau bahan"
            className="input !py-2 !pl-9 !text-sm bg-slate-50 focus:bg-white"
          />
        </div>

        {tampil && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            {hasil.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-500">Tidak ada resep yang cocok.</p>
            ) : (
              <ul role="listbox" aria-label="Hasil pencarian resep">
                {hasil.map((r) => (
                  <li key={r.id} role="option" aria-selected="false">
                    <button
                      type="button"
                      onClick={() => pilih(r.id)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <span className="text-xl" aria-hidden="true">{r.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-slate-900">{r.nama}</span>
                        <span className="block text-xs text-slate-500">{SLOT[r.slot]} • {rupiah(r.harga)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
