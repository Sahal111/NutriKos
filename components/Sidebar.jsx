"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "./AppProvider";
import { logout } from "@/lib/auth";

// Satu daftar untuk dua kolom: ikon di rail kiri dan teks di panel biru. Tinggi barisnya sama (h-12) supaya sejajar.
const NAV = [
  { href: "/beranda", label: "Dashboard", icon: "space_dashboard" },
  { href: "/menu", label: "Rekomendasi Menu", icon: "restaurant_menu" },
  { href: "/bahan-sisa", label: "Cek Bahan Sisa", icon: "kitchen" },
  { href: "/belanja", label: "Daftar Belanja", icon: "shopping_cart" },
  { href: "/gizi", label: "Gizi Mingguan", icon: "pie_chart" },
  { href: "/profil-kos", label: "Profil Kos", icon: "settings" },
  { href: "/profil", label: "Profil Saya", icon: "person" },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const { getShoppingItems, checked, isSidebarOpen, closeSidebar, reset } =
    useApp();
  const items = getShoppingItems ? getShoppingItems() : [];
  const perluDibeli = items.filter(
    (x) => !x.sudahAda && !checked[x.nama],
  ).length;
  const aktif = (h) => path === h || path.startsWith(h + "/");

  const keluar = async () => {
    if (
      confirm(
        "Keluar dari akun? Profil, favorit, riwayat, dan catatan gizi tetap tersimpan di akunmu. Rencana menu dan daftar belanja di perangkat ini akan dihapus.",
      )
    ) {
      await logout();
      reset();
      router.push("/");
    }
  };

  const bar = (
    <div className="flex h-full w-[308px]">
      {/* Rail ikon */}
      <div className="flex h-full w-[72px] shrink-0 select-none flex-col gap-1.5 rounded-l-[28px] bg-rail-blue pt-[104px]">
        {NAV.map(({ href, label, icon }) => {
          const on = aktif(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              tabIndex={-1}
              aria-hidden="true"
              onClick={closeSidebar}
              className={`relative flex h-12 items-center justify-center transition-colors ${on ? "text-white" : "text-white/75 hover:text-white"}`}
            >
              {on && (
                <span className="absolute left-0 h-7 w-1 rounded-r-full bg-white" />
              )}
              <span className="material-symbols-outlined ms-fill text-[24px]">
                {icon}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Panel biru: logo terpisah + menu teks */}
      <div className="flex h-full flex-1 flex-col">
        <div className="flex h-20 shrink-0 items-center gap-3 rounded-br-[32px] bg-primary-container px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Logo NutriKos"
            className="h-8 w-auto object-contain"
          />
          <div className="flex flex-col">
            <span className="font-h4 text-xl leading-none tracking-tight text-white">
              NutriKos
            </span>
            <span className="mt-1 font-micro text-micro uppercase tracking-widest text-white/70">
              Nutrisi &amp; Hemat
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between rounded-br-[32px] rounded-tr-[32px] bg-primary-container pb-6 pt-6">
          <nav className="flex flex-col gap-1.5">
            {NAV.map(({ href, label }) => {
              const on = aktif(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeSidebar}
                  aria-current={on ? "page" : undefined}
                  className={`ml-3 flex h-12 items-center rounded-l-full pl-5 transition-all ${
                    on
                      ? "bg-inverse-on-surface font-h4 text-h4 text-primary-container shadow-sm"
                      : "font-menu-item text-menu-item text-white/85 hover:text-white"
                  }`}
                >
                  <span className="truncate">{label}</span>
                  {href === "/belanja" && perluDibeli > 0 && (
                    <span
                      className={`ml-auto mr-4 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${on ? "bg-primary-container text-white" : "bg-warning text-white"}`}
                    >
                      {perluDibeli}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={keluar}
            className="mx-5 flex items-center justify-center gap-2 rounded-xl py-3 font-menu-item text-menu-item text-white/85 transition-all hover:bg-white/10 hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">
              logout
            </span>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed left-0 top-0 z-50 hidden h-screen lg:block">
        {bar}
      </aside>
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-text-primary/50"
            onClick={closeSidebar}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 shadow-2xl">
            {bar}
          </aside>
        </div>
      )}
    </>
  );
}
