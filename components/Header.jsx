'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Menu } from 'lucide-react';
import { useApp } from './AppProvider';

const NAMA = {
  '/': 'Beranda',
  '/profil-kos': 'Profil Kos',
  '/menu': 'Rekomendasi Menu',
  '/bahan-sisa': 'Cek Bahan Sisa',
  '/belanja': 'Daftar Belanja',
  '/gizi': 'Gizi Mingguan',
  '/profil': 'Profil Saya',
};

export default function Header() {
  const path = usePathname();
  const { profile, toggleSidebar } = useApp();
  const nama = NAMA[path] || (path.startsWith('/menu/') ? 'Detail Resep' : '');

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 shadow-xs backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleSidebar}
          aria-label="Buka Menu Navigasi"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 hover:text-brand-dark transition-colors lg:hidden"
        >
          <Menu size={22} />
        </button>

        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Logo NutriKos" className="h-9 w-9 object-contain" />
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight">
                <span className="text-brand-dark">Nutri</span>
                <span className="text-accent">Kos</span>
              </span>
              <span className="hidden rounded-full bg-brand-mint px-2 py-0.5 text-[10px] font-bold text-brand-deeper sm:inline-block">
                Hemat & Sehat
              </span>
            </div>
            <div className="text-xs font-medium text-slate-500">{nama}</div>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <button
          aria-label="Notifikasi"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 hover:text-brand-dark transition-colors"
        >
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white" />
        </button>
        <Link
          href="/profil"
          aria-label="Profil Saya"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-xl ring-2 ring-brand-mint transition-transform hover:scale-105"
        >
          {profile?.avatar || '👩‍🎓'}
        </Link>
      </div>
    </header>
  );
}
