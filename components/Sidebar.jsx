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

const ROW = 54; // tinggi baris h-12 (48px) + gap-1.5 (6px)
const GAP = 6;
const R = 32; // radius lekukan
const LATAR = "#eef0f7"; // sama dengan bg-inverse-on-surface

// Efek muncul bertahap (fade + geser dari kiri) untuk isi panel saat sidebar
// dibuka. Delay per elemen lewat CSS variable --d; delay hanya dipakai saat
// membuka, jadi saat menutup isi langsung memudar.
const FADE =
  "transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none lg:-translate-x-3 lg:opacity-0 lg:group-hover/side:translate-x-0 lg:group-hover/side:opacity-100 lg:group-hover/side:[transition-delay:var(--d)] lg:group-focus-within/side:translate-x-0 lg:group-focus-within/side:opacity-100 lg:group-focus-within/side:[transition-delay:var(--d)]";

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
  const aktifIdx = NAV.findIndex((n) => aktif(n.href));

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
      <div className="flex h-full w-[72px] shrink-0 select-none flex-col gap-1.5 rounded-l-[28px] bg-rail-blue pt-[104px] lg:rounded-[28px] lg:transition-[border-radius] lg:duration-300 lg:group-hover/side:rounded-r-none lg:group-focus-within/side:rounded-r-none">
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
      <div className="flex h-full flex-1 flex-col rounded-br-[32px] bg-primary-container">
        <div
          className={`flex h-20 shrink-0 items-center gap-3 px-5 ${FADE}`}
          style={{ "--d": "40ms" }}
        >
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
        <div className="flex flex-1 flex-col justify-between pb-6 pt-6">
          <nav className="relative flex flex-col gap-1.5">
            {aktifIdx >= 0 && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 ml-3 h-12 transition-transform duration-300 ease-in-out will-change-transform"
                style={{ transform: `translateY(${aktifIdx * ROW}px)` }}
              >
                {/* Pil terang: ikut bergeser bersama lekukannya */}
                <div className="absolute inset-0 rounded-l-full bg-inverse-on-surface" />
                <div
                  className="absolute -top-8 right-0 h-8 w-8"
                  style={{
                    background: `radial-gradient(circle at 0 0, transparent ${R}px, ${LATAR} ${R}px)`,
                  }}
                />
                <div
                  className="absolute -bottom-8 right-0 h-8 w-8"
                  style={{
                    background: `radial-gradient(circle at 0 100%, transparent ${R}px, ${LATAR} ${R}px)`,
                  }}
                />
              </div>
            )}
            {NAV.map(({ href, label }, i) => {
              const on = aktif(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeSidebar}
                  aria-current={on ? "page" : undefined}
                  className={`relative z-10 ml-3 flex h-12 items-center rounded-l-full pl-5 font-menu-item text-menu-item transition-colors duration-300 ${
                    on
                      ? "font-bold text-primary-container"
                      : "text-white/85 hover:text-white"
                  }`}
                >
                  <span
                    className={`flex min-w-0 flex-1 items-center ${FADE}`}
                    style={{ "--d": `${80 + i * 30}ms` }}
                  >
                    <span className="truncate">{label}</span>
                    {href === "/belanja" && perluDibeli > 0 && (
                      <span
                        className={`ml-auto mr-4 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${on ? "bg-primary-container text-white" : "bg-warning text-white"}`}
                      >
                        {perluDibeli}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>
          <div
            className={`mx-5 ${FADE}`}
            style={{ "--d": `${80 + NAV.length * 30}ms` }}
          >
            <button
              type="button"
              onClick={keluar}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-menu-item text-menu-item text-white/85 transition-all hover:bg-white/10 hover:text-white"
            >
              <span className="material-symbols-outlined text-[20px]">
                logout
              </span>
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="group/side fixed left-0 top-0 z-50 hidden h-screen w-[72px] overflow-hidden transition-[width] delay-150 duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[width] focus-within:w-[308px] hover:w-[308px] hover:delay-75 motion-reduce:transition-none lg:block">
        {bar}
      </aside>
      {/* Redupkan konten di belakang saat sidebar terbuka
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40 hidden bg-text-primary/15 opacity-0 transition-opacity duration-300 peer-hover/side:opacity-100 peer-hover/side:delay-75 peer-focus-within/side:opacity-100 motion-reduce:transition-none lg:block"
      /> */}
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
