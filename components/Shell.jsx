"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import ChatAI from "@/components/ChatAI";
import { getSession } from "@/lib/auth";

// Halaman tanpa Header/Sidebar dan tanpa wajib login.
const PUBLIK = ["/", "/login", "/register", "/lupa-sandi", "/reset-sandi"];

export default function Shell({ children }) {
  const path = usePathname();
  const router = useRouter();
  const [masuk, setMasuk] = useState(false);
  const [sbOpen, setSbOpen] = useState(false); // sidebar desktop sedang terbuka (hover/fokus keyboard)
  const publik = PUBLIK.includes(path);

  useEffect(() => {
    let batal = false;
    getSession().then((s) => {
      if (batal) return;
      const ada = !!s;
      setMasuk(ada);
      if (!ada && !publik) router.replace("/login");
      if (ada && (path === "/login" || path === "/register"))
        router.replace("/beranda");
    });
    return () => {
      batal = true;
    };
  }, [path, publik, router]);

  if (publik) return <div className="min-h-screen bg-white">{children}</div>;
  if (!masuk) return null; // tunggu cek sesi, cegah kilatan konten

  return (
    <div
      data-open={sbOpen}
      className="min-h-screen w-full bg-inverse-on-surface [--sb-delay:150ms] [--sb:72px] data-[open=true]:[--sb-delay:75ms] data-[open=true]:[--sb:308px]"
    >
      <Sidebar open={sbOpen} onOpenChange={setSbOpen} />
      <div className="flex min-h-screen flex-col lg:pl-[var(--sb)] lg:transition-[padding-left] lg:duration-[380ms] lg:ease-[cubic-bezier(0.22,1,0.36,1)] lg:[transition-delay:var(--sb-delay)] motion-reduce:transition-none">
        <Header />
        <main className="mx-auto w-full max-w-[2200px] flex-1 px-4 pb-28 pt-[88px] sm:px-6 lg:px-10 lg:pb-12">
          {children}
        </main>
      </div>
      <ChatAI />
      <BottomNav />
    </div>
  );
}
