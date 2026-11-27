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
    <div className="min-h-screen w-full bg-inverse-on-surface">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-[308px]">
        <Header />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-28 pt-[88px] sm:px-6 lg:px-10 lg:pb-12">
          {children}
        </main>
      </div>
      <ChatAI />
      <BottomNav />
    </div>
  );
}
