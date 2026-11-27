'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text-secondary shadow-sm transition-all hover:bg-surface-soft hover:text-text-primary"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {daftar.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />}
      </button>

      {buka && (
        <div
          role="region"
          aria-label="Daftar pengingat"
          className="absolute right-0 top-12 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-border-subtle bg-white p-2 shadow-lg"
        >
          {daftar.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-text-secondary">Semua beres, tidak ada pengingat.</p>
          ) : (
            <ul className="space-y-1">
              {daftar.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} onClick={() => setBuka(false)} className="block rounded-xl px-3 py-2 hover:bg-surface-soft">
                    <div className="text-sm font-bold text-text-primary">{n.judul}</div>
                    <div className="text-xs text-text-secondary">{n.isi}</div>
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
