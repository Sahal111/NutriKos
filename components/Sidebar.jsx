'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UtensilsCrossed, ShoppingBag, HeartPulse, User, Settings, Refrigerator, X } from 'lucide-react';
import { useApp } from './AppProvider';

const NAV_ITEMS = [
  { href: '/', label: 'Beranda', Icon: Home },
  { href: '/menu', label: 'Rekomendasi Menu', Icon: UtensilsCrossed },
  { href: '/bahan-sisa', label: 'Cek Bahan Sisa', Icon: Refrigerator },
  { href: '/belanja', label: 'Daftar Belanja', Icon: ShoppingBag },
  { href: '/gizi', label: 'Gizi Mingguan', Icon: HeartPulse },
  { href: '/profil-kos', label: 'Profil Kos', Icon: Settings },
  { href: '/profil', label: 'Profil Saya', Icon: User },
];

export default function Sidebar() {
  const path = usePathname();
  const { profile, getShoppingItems, checked, isSidebarOpen, closeSidebar } = useApp();

  const shoppingItems = getShoppingItems ? getShoppingItems() : [];
  const perluDibeli = shoppingItems.filter((x) => !x.sudahAda && !checked[x.nama]).length;
  const aktif = (h) => (h === '/' ? path === '/' : path === h || path.startsWith(h + '/'));

  const navContent = (
    <>
      {/* Profile summary */}
      <div className="mb-4 px-4 pt-3">
        <div className="flex items-center gap-3 rounded-2xl bg-brand-light/70 p-3 border border-brand-mint/40">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-mint text-2xl shadow-xs">
            {profile?.avatar || '👩‍🎓'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-brand-deeper">{profile?.nama}</div>
            <div className="truncate text-xs text-slate-500">{profile?.kampus}</div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = aktif(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={closeSidebar}
              className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-brand-dark text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={19} className={isActive ? 'text-white' : 'text-slate-500'} />
              <span>{label}</span>
              {href === '/belanja' && perluDibeli > 0 && (
                <span
                  className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                    isActive ? 'bg-white text-brand-dark' : 'bg-accent text-white'
                  }`}
                >
                  {perluDibeli}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="border-t border-slate-200/80 p-4">
        <div className="text-center text-xs font-semibold text-slate-500">NutriKos v2.0</div>
        <div className="text-center text-[10px] text-slate-400">Pola Makan Sehat & Hemat Mahasiswa</div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar: Normal non-overlapping Flex Column */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
        {navContent}
      </aside>

      {/* Mobile Drawer (Drawer hamburger) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={closeSidebar}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header Drawer with Close Button */}
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
              <Link href="/" onClick={closeSidebar} className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Logo NutriKos" className="h-8 w-8 object-contain" />
                <span className="text-lg font-extrabold">
                  <span className="text-brand-dark">Nutri</span>
                  <span className="text-accent">Kos</span>
                </span>
              </Link>
              <button
                onClick={closeSidebar}
                aria-label="Tutup menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav content */}
            <div className="flex-1 overflow-y-auto">{navContent}</div>
          </aside>
        </div>
      )}
    </>
  );
}
