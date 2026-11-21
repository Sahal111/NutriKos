"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import ChatAI from "@/components/ChatAI";
import { getSession } from "@/lib/auth";

// Halaman tanpa Header/Sidebar dan tanpa wajib login.
const PUBLIK = ["/", "/login", "/register"];

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
    <div className="min-h-screen w-full bg-surface flex flex-col">
      <Header />
      {/* Desktop layout: Sidebar in normal flex flow, main content takes all remaining width */}
      <div className="flex flex-1 w-full">
        <Sidebar />
        <main className="flex-1 min-w-0 w-full px-4 py-6 sm:px-6 md:px-8 lg:px-8 xl:px-10 pb-28 lg:pb-12">
          {children}
        </main>
      </div>
      {/* Asisten AI Interaktif NutriKos */}
      <ChatAI />
      <BottomNav />
    </div>
  );
}
