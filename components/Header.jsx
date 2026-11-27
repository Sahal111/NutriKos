'use client';
import Link from 'next/link';
import { useApp } from "./AppProvider";
import PencarianResep from "./PencarianResep";
import NotifikasiBell from "./NotifikasiBell";

export default function Header() {
  const { profile, toggleSidebar } = useApp();
  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between bg-inverse-on-surface/90 px-4 shadow-[0_1px_8px_rgba(27,33,80,0.04)] backdrop-blur-md sm:px-6 lg:left-[308px] lg:px-10">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Buka Menu Navigasi"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text-secondary shadow-sm transition-colors hover:text-text-primary lg:hidden"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>
        <PencarianResep />
      </div>
      <div className="flex items-center gap-5">
        <NotifikasiBell />
        <div className="h-6 w-px bg-border-subtle" />
        <Link href="/profil" aria-label="Profil Saya" className="group flex cursor-pointer items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-lg ring-2 ring-primary-soft">
            {profile?.avatar || "👩‍🎓"}
          </span>
          <span className="hidden flex-col text-left sm:flex">
            <span className="font-label-prominent text-label-prominent leading-tight text-text-primary transition-colors group-hover:text-primary">{profile?.nama}</span>
            <span className="font-micro text-micro leading-tight text-text-secondary">Anak Kos Hemat</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
