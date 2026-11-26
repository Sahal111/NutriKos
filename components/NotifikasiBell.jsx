'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useApp } from './AppProvider';
import { nutrisiDari } from '@/lib/recommend';
import { kunciTanggal } from '@/lib/gizi';
import { buatNotifikasi } from '@/lib/notifikasi';

// Lonceng pengingat di header: menampilkan jumlah pengingat yang masih berlaku dan daftarnya saat diklik.
export default function NotifikasiBell() {
  const { profile, plan, customPlanDetails, log, ready } = useApp();
  const [buka, setBuka] = useState(false);
  const kotak = useRef(null);

  useEffect(() => {
    if (!buka) return;
    const luar = (e) => { if (kotak.current && !kotak.current.contains(e.target)) setBuka(false); };
    const esc = (e) => { if (e.key === 'Escape') setBuka(false); };
    document.addEventListener('mousedown', luar);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', luar);
      document.removeEventListener('keydown', esc);
    };
  }, [buka]);

  const daftar = ready
    ? buatNotifikasi({
        profile,
        plan,
        biaya: nutrisiDari(plan, customPlanDetails).biaya,
        sudahDicatat: Boolean(log?.[kunciTanggal()]),
      })
    : [];

  return (
    <div ref={kotak} className="relative">
      <button
        type="button"
        aria-label={daftar.length ? `Notifikasi, ${daftar.length} pengingat` : 'Notifikasi'}
        aria-expanded={buka}
        aria-haspopup="true"
        onClick={() => setBuka((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-dark"
      >
        <Bell size={20} />
        {daftar.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {daftar.length}
          </span>
        )}
      </button>

      {buka && (
        <div
          role="region"
          aria-label="Daftar pengingat"
          className="absolute right-0 top-12 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          {daftar.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-slate-500">Semua beres, tidak ada pengingat.</p>
          ) : (
            <ul className="space-y-1">
              {daftar.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} onClick={() => setBuka(false)} className="block rounded-xl px-3 py-2 hover:bg-slate-50">
                    <div className="text-sm font-bold text-slate-900">{n.judul}</div>
                    <div className="text-xs text-slate-600">{n.isi}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
