"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { kategori } from "@/components/MenuCard";
import { getRecipe, rupiah, SLOTS } from "@/lib/data";
import { adaDiStok } from "@/lib/recommend";
import { targetHarian } from "@/lib/gizi";

// Donut persis template: lingkaran 36x36, dasharray = persen.
function Donut({ persen, warna, children, tinggi }) {
  const p = Math.max(0, Math.min(100, Math.round(persen)));
  return (
    <div className="relative my-1 flex h-[76px] w-[76px] items-center justify-center">
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
        <path
          className="text-track-chart"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
        />
        <path
          className={`${warna} transition-all duration-700 ease-out`}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeDasharray={`${p}, 100`}
          strokeLinecap="round"
          strokeWidth="3.5"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-caption text-caption font-bold ${tinggi ? "text-primary" : "text-text-primary"}`}
        >
          {children}
        </span>
      </div>
    </div>
  );
}

export default function DetailResep() {
  const { id } = useParams();
  const router = useRouter();
  const { profile, plan, setPlan, addExtra, favorit, toggleFavorit, ready } =
    useApp();
  const r = getRecipe(id);

  // Kontrol template: porsi, centang bahan, dan toast (hanya tampilan).
  const [porsi, setPorsi] = useState(1);
  const [dicentang, setDicentang] = useState({});
  const [toast, setToast] = useState("");
  const timer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 3000);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!ready) return null;
  if (!r)
    return (
      <div className="rounded-[20px] bg-surface p-6 font-body-default text-body-default text-text-secondary shadow-sm">
        Resep tidak ditemukan.
      </div>
    );

  // ----- logika yang sudah ada -----
  const pilih = () => {
    setPlan(
      [...plan.filter((x) => getRecipe(x)?.slot !== r.slot), r.id].sort(
        (a, b) =>
          SLOTS.indexOf(getRecipe(a).slot) - SLOTS.indexOf(getRecipe(b).slot),
      ),
    );
    router.push("/menu");
  };
  const tambahBelanja = () => {
    addExtra(r.id);
    router.push("/belanja");
  };
  const disukai = favorit.some((f) => f.resepId === r.id);
  const t = targetHarian(profile.jenisKelamin);

  const bahan = r.bahan.map((x) => ({
    ...x,
    punya: adaDiStok(profile, x.kunci),
  }));
  const punya = bahan.filter((x) => x.punya);
  const beli = bahan.filter((x) => !x.punya);
  const biayaBeli = beli.reduce((s, x) => s + x.harga, 0);
  const centang = (x) => (x.nama in dicentang ? dicentang[x.nama] : x.punya);

  const harga = r.harga * porsi;
  const kalori = Math.round(r.kalori * porsi);
  const gizi = {
    protein: Math.round(r.protein * porsi),
    karbo: Math.round(r.karbo * porsi),
    lemak: Math.round(r.lemak * porsi),
    serat: Math.round(r.serat * porsi * 10) / 10,
  };
  const pct = (nilai, target) =>
    target > 0 ? Math.round((nilai / target) * 100) : 0;
  const waktuLangkah = Math.max(
    1,
    Math.round(r.waktu / Math.max(1, r.langkah.length)),
  );
  const alatUtama = r.alat.length ? r.alat[0] : "Tanpa alat";

  const deskripsi =
    punya.length > 0
      ? `${r.nama} dioptimalkan dari stok bahan kos kamu: ${punya.length} dari ${bahan.length} bahan sudah tersedia, sisanya cukup belanja sekitar ${rupiah(biayaBeli)}. Hemat, bergizi, dan siap disajikan dalam ${r.waktu} menit.`
      : `${r.nama} adalah menu hemat dan bergizi dari ${bahan.length} bahan sederhana, dengan estimasi belanja sekitar ${rupiah(biayaBeli)} dan waktu masak ${r.waktu} menit.`;
  const tips =
    punya.length > 0
      ? `Bahan yang sudah ada di stok kos (${punya.map((x) => x.nama.toLowerCase()).join(", ")}) tidak perlu dibeli lagi. Siapkan semua bahan sebelum mulai memasak supaya prosesnya cepat dan hemat energi.`
      : `Siapkan semua bahan sebelum mulai memasak supaya prosesnya cepat. Tambahkan bahan ke daftar belanja agar tidak ada yang terlewat saat berbelanja.`;

  return (
    <div className="flex w-full flex-col space-y-7 pb-14">
      {/* 1. BREADCRUMB & HEADER NAVIGASI */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-col gap-2">
          {/* Breadcrumb Hierarchy */}
          <nav className="flex select-none flex-wrap items-center gap-2 font-caption text-caption text-text-secondary">
            <Link
              href="/menu"
              className="flex items-center gap-1 transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined text-[15px]">
                recommend
              </span>
              Rekomendasi Menu
            </Link>
            <span className="text-text-disabled">/</span>
            <span className="transition-colors hover:text-primary">
              Detail Menu
            </span>
            <span className="text-text-disabled">/</span>
            <span className="max-w-[240px] truncate font-body-medium text-body-medium text-text-primary md:max-w-none">
              {r.nama}
            </span>
          </nav>
          {/* Pill Badges Header */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-success-soft px-2.5 font-micro text-micro text-success-accessible">
              <span className="material-symbols-outlined ms-fill text-[13px]">
                auto_awesome
              </span>
              Rekomendasi AI Terpilih
            </span>
            <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-primary-soft px-2.5 font-micro text-micro text-primary">
              <span className="material-symbols-outlined text-[13px]">
                fitness_center
              </span>
              {kategori(r)}
            </span>
            <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-surface px-2.5 font-micro text-micro text-text-secondary shadow-sm">
              <span className="material-symbols-outlined text-[13px]">
                skillet
              </span>
              {r.alat.length ? `Praktis ${alatUtama}` : "Tanpa Alat Masak"}
            </span>
          </div>
        </div>
        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-10 items-center gap-2 self-start rounded-full bg-surface px-5 font-label-prominent text-label-prominent text-text-primary shadow-sm transition-all hover:bg-surface-soft hover:shadow-md active:translate-y-0.5 md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          <span>Kembali ke Rekomendasi</span>
        </button>
      </div>

      {/* 2. HERO DETAIL SECTION */}
      <div className="w-full rounded-[20px] bg-surface p-6 shadow-sm transition-all duration-300 hover:shadow-md lg:p-7">
        <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-12">
          {/* Food Media Block (5 / 12) */}
          <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-gradient-to-br from-primary-soft via-pill-active-bg to-rail-blue/40 shadow-sm lg:col-span-5">
            <div className="absolute inset-0 flex items-center justify-center pb-6 text-[clamp(4rem,12vw,8rem)] transition-transform duration-500 ease-out group-hover:scale-105">
              {r.emoji}
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-text-primary/70 via-transparent to-black/10" />
            {/* Top Overlay Badges */}
            <div className="pointer-events-none absolute left-3 right-3 top-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1 font-micro text-micro text-text-primary shadow-sm backdrop-blur-sm">
                <span className="material-symbols-outlined ms-fill text-[14px] text-warning">
                  timer
                </span>
                <span>{r.waktu} Menit</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1 font-micro text-micro text-text-primary shadow-sm backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span>Mudah • Pemula</span>
              </div>
            </div>
            {/* Cost badge floating over image bottom */}
            <div className="absolute bottom-3 left-3 rounded-xl bg-text-primary/85 px-3.5 py-1.5 text-on-primary backdrop-blur-sm">
              <span className="block font-micro text-micro uppercase tracking-wider text-white/70">
                Hemat Kos
              </span>
              <span className="font-h4 text-h4 text-white">
                {rupiah(r.harga)}{" "}
                <span className="font-caption text-caption text-white/80">
                  / porsi
                </span>
              </span>
            </div>
          </div>

          {/* Info & Metric Summary Block (7 / 12) */}
          <div className="flex min-w-0 flex-col justify-between space-y-5 lg:col-span-7">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-rail-blue">
                  verified
                </span>
                <span className="font-caption text-caption font-semibold uppercase tracking-wider text-rail-blue">
                  Resep Terverifikasi Ahli Gizi
                </span>
              </div>
              <h1 className="font-h1 text-h1 tracking-tight text-text-primary">
                {r.nama}
              </h1>
              <p className="mt-2.5 font-body-default text-body-default leading-relaxed text-text-secondary">
                {deskripsi}
              </p>
            </div>

            {/* 4 Metric summary boxes */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Metric 1: Biaya */}
              <div className="flex flex-col rounded-2xl bg-surface-soft p-3">
                <div className="mb-1 flex items-center gap-1 text-text-secondary">
                  <span className="material-symbols-outlined text-[16px] text-success">
                    payments
                  </span>
                  <span className="font-micro text-micro uppercase">
                    Estimasi Biaya
                  </span>
                </div>
                <span className="font-h4 text-h4 text-text-primary">
                  {rupiah(harga)}
                </span>
                <span className="font-caption text-caption text-text-secondary">
                  per {porsi} porsi
                </span>
              </div>
              {/* Metric 2: Kalori */}
              <div className="flex flex-col rounded-2xl bg-surface-soft p-3">
                <div className="mb-1 flex items-center gap-1 text-text-secondary">
                  <span className="material-symbols-outlined text-[16px] text-warning">
                    local_fire_department
                  </span>
                  <span className="font-micro text-micro uppercase">
                    Total Kalori
                  </span>
                </div>
                <span className="font-h4 text-h4 text-text-primary">
                  {kalori} kkal
                </span>
                <span className="font-caption text-caption text-text-secondary">
                  energi harian
                </span>
              </div>
              {/* Metric 3: Waktu Masak */}
              <div className="flex flex-col rounded-2xl bg-surface-soft p-3">
                <div className="mb-1 flex items-center gap-1 text-text-secondary">
                  <span className="material-symbols-outlined text-[16px] text-rail-blue">
                    schedule
                  </span>
                  <span className="font-micro text-micro uppercase">
                    Waktu Masak
                  </span>
                </div>
                <span className="font-h4 text-h4 text-text-primary">
                  {r.waktu} Menit
                </span>
                <span className="truncate font-caption text-caption text-text-secondary">
                  {alatUtama}
                </span>
              </div>
              {/* Metric 4: Porsi Stepper Counter */}
              <div className="flex flex-col justify-between rounded-2xl bg-surface-soft p-3">
                <div className="mb-1 flex items-center gap-1 text-text-secondary">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    group
                  </span>
                  <span className="font-micro text-micro uppercase">
                    Porsi Masak
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between rounded-xl bg-surface px-1.5 py-1 shadow-sm">
                  <button
                    type="button"
                    aria-label="Kurangi porsi"
                    onClick={() => setPorsi((p) => Math.max(1, p - 1))}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-alt text-text-primary transition-colors hover:bg-pill-active-bg"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      remove
                    </span>
                  </button>
                  <span className="select-none px-1 font-label-prominent text-label-prominent text-text-primary">
                    {porsi}
                  </span>
                  <button
                    type="button"
                    aria-label="Tambah porsi"
                    onClick={() => setPorsi((p) => p + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-alt text-text-primary transition-colors hover:bg-pill-active-bg"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      add
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action CTAs and bookmark */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={pilih}
                className="flex h-10 items-center gap-2 rounded-xl bg-rail-blue px-5 font-label-prominent text-label-prominent text-white shadow-sm transition-all hover:bg-primary-container active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">
                  calendar_add_on
                </span>
                <span>+ Tambah ke Meal Planner</span>
              </button>
              <button
                type="button"
                onClick={tambahBelanja}
                className="flex h-10 items-center gap-2 rounded-xl bg-surface px-4 font-label-prominent text-label-prominent text-text-primary shadow-sm transition-all hover:bg-surface-soft active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px] text-rail-blue">
                  shopping_cart
                </span>
                <span>Tambah Bahan Kurang ke Belanja</span>
              </button>
              <button
                type="button"
                title="Simpan Resep Favorit"
                aria-pressed={disukai}
                aria-label={
                  disukai ? "Hapus dari favorit" : "Simpan ke favorit"
                }
                onClick={() => {
                  toggleFavorit(r.id);
                  showToast(
                    disukai
                      ? "Resep dihapus dari favorit."
                      : "Resep disimpan ke koleksi favorit.",
                  );
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-text-secondary shadow-sm transition-all hover:bg-surface-soft hover:text-danger"
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${disukai ? "ms-fill text-danger" : ""}`}
                >
                  {disukai ? "bookmark" : "bookmark_border"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DUA KOLOM UTAMA KONTEN: BAHAN & LANGKAH MEMASAK */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        {/* Kolom Kiri: Daftar Bahan Makanan */}
        <div className="flex flex-col justify-between rounded-[20px] bg-surface p-6 shadow-sm lg:col-span-5">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <span className="material-symbols-outlined text-[18px]">
                    kitchen
                  </span>
                </div>
                <div>
                  <h2 className="font-h3 text-h3 text-text-primary">
                    Daftar Bahan
                  </h2>
                  <span className="font-caption text-caption text-text-secondary">
                    Disesuaikan untuk {porsi} Porsi
                  </span>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-surface-alt px-2.5 py-1 font-micro text-micro text-text-secondary">
                {bahan.length} Komponen
              </span>
            </div>
            {/* Status Ketersediaan Bahan Kost Subheader */}
            <div className="my-3 flex flex-wrap items-center gap-2 rounded-2xl bg-surface-soft p-3">
              <div className="flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 font-micro text-micro text-success-accessible">
                <span className="material-symbols-outlined ms-fill text-[13px]">
                  check_circle
                </span>
                <span>{punya.length} Bahan di Kost</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-warning-soft px-2.5 py-1 font-micro text-micro text-warning-accessible">
                <span className="material-symbols-outlined text-[13px]">
                  shopping_bag
                </span>
                <span>
                  {beli.length} Perlu Dibeli (~{rupiah(biayaBeli)})
                </span>
              </div>
            </div>
            {/* Checklist Item Bahan Interaktif */}
            <div className="mt-4 space-y-2.5">
              {bahan.map((x) => {
                const on = centang(x);
                return (
                  <label
                    key={x.nama}
                    className={`group flex cursor-pointer select-none items-start justify-between gap-2 rounded-xl p-3 transition-colors ${
                      x.punya
                        ? "bg-surface-soft hover:bg-surface-alt"
                        : "bg-surface-alt hover:bg-pill-active-bg/50"
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) =>
                          setDicentang((s) => ({
                            ...s,
                            [x.nama]: e.target.checked,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded accent-rail-blue text-rail-blue focus:ring-rail-blue"
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="font-body-medium text-body-medium text-text-primary transition-colors group-hover:text-primary">
                          {x.nama}
                        </span>
                        <span className="font-caption text-caption text-text-secondary">
                          {x.qty}
                        </span>
                        {x.punya ? (
                          <span className="mt-0.5 flex items-center gap-1 font-micro text-micro text-success-accessible">
                            <span className="material-symbols-outlined text-[12px]">
                              home
                            </span>{" "}
                            Stok kost aman
                          </span>
                        ) : (
                          <span className="mt-0.5 flex items-center gap-1 font-micro text-micro text-text-secondary">
                            <span className="material-symbols-outlined text-[12px]">
                              storefront
                            </span>{" "}
                            Perlu dibeli
                          </span>
                        )}
                      </div>
                    </div>
                    {x.punya ? (
                      <span className="shrink-0 self-start rounded-full bg-success-soft px-2 py-0.5 font-micro text-micro font-semibold text-success-accessible">
                        Tersedia
                      </span>
                    ) : (
                      <span className="shrink-0 self-start font-caption text-caption font-semibold text-text-primary">
                        {rupiah(x.harga)}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
          {/* Quick Action: Pilih Semua yang Perlu Dibeli */}
          <div className="mt-4 pt-5">
            <button
              type="button"
              onClick={() => {
                setDicentang(
                  Object.fromEntries(bahan.map((x) => [x.nama, true])),
                );
                showToast(
                  `Semua bahan telah ditandai untuk dibeli (${rupiah(biayaBeli)})`,
                );
              }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-soft px-4 font-label-prominent text-label-prominent text-primary transition-all hover:bg-pill-active-bg"
            >
              <span className="material-symbols-outlined text-[18px]">
                add_shopping_cart
              </span>
              <span>Pilih Semua yang Perlu Dibeli ({rupiah(biayaBeli)})</span>
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Langkah Memasak & Tips Kost */}
        <div className="flex flex-col justify-between rounded-[20px] bg-surface p-6 shadow-sm lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <span className="material-symbols-outlined text-[18px]">
                    restaurant_menu
                  </span>
                </div>
                <h2 className="font-h3 text-h3 text-text-primary">
                  Langkah Memasak
                </h2>
              </div>
              <span className="rounded-full bg-pill-active-bg px-3 py-1 font-caption text-caption font-semibold text-rail-blue">
                Total Waktu: {r.waktu} Menit
              </span>
            </div>
            {/* Vertical Cooking Timeline */}
            <div className="relative space-y-6 pl-8 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-[2px] before:bg-surface-container before:content-['']">
              {r.langkah.map((l, i) => (
                <div key={i} className="group relative">
                  <div className="absolute -left-8 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-rail-blue font-micro text-micro text-white shadow-sm">
                    {i + 1}
                  </div>
                  <div className="rounded-2xl bg-surface-soft p-4 transition-colors group-hover:bg-surface-alt">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="font-label-prominent text-label-prominent text-text-primary">
                        Langkah {i + 1}
                      </span>
                      <span className="shrink-0 rounded-md bg-surface px-2 py-0.5 font-micro text-micro text-text-secondary shadow-xs">
                        ⏱ ±{waktuLangkah} Menit
                      </span>
                    </div>
                    <p className="font-body-default text-body-default leading-relaxed text-text-secondary">
                      {l}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* NutriKos AI Chef Tips Box */}
          <div className="mt-6 flex items-start gap-3.5 rounded-2xl bg-primary-soft/70 p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-rail-blue text-white shadow-xs">
              <span className="material-symbols-outlined text-[18px]">
                tips_and_updates
              </span>
            </div>
            <div className="flex flex-col">
              <span className="flex items-center gap-1.5 font-label-prominent text-label-prominent text-primary">
                NutriKos AI Chef Tips • Trik Hemat Kost
              </span>
              <p className="mt-1 font-body-default text-body-default leading-normal text-text-primary/90">
                {tips}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. INFORMASI & VISUALISASI NUTRISI */}
      <div className="w-full rounded-[20px] bg-surface p-6 shadow-sm lg:p-7">
        <div className="flex flex-col justify-between gap-4 pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-success-soft text-success-accessible">
              <span className="material-symbols-outlined text-[22px]">
                vital_signs
              </span>
            </div>
            <div>
              <h2 className="font-h3 text-h3 text-text-primary">
                Kandungan Nutrisi &amp; Rincian Gizi
              </h2>
              <p className="font-caption text-caption text-text-secondary">
                Estimasi kontribusi terhadap Angka Kecukupan Gizi (AKG{" "}
                {t.energi} kkal)
              </p>
            </div>
          </div>
          <div className="relative inline-flex items-center">
            <span className="flex h-8 items-center gap-1.5 rounded-full bg-pill-active-bg px-4 font-caption text-caption font-semibold text-primary-container shadow-xs">
              Per {porsi} Porsi ({kalori} kkal)
            </span>
          </div>
        </div>

        {/* Grid 6 Circular Donut Charts */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {/* Kalori */}
          <div className="group flex flex-col items-center rounded-2xl bg-surface-soft p-4 text-center transition-colors hover:bg-surface-alt">
            <Donut persen={pct(kalori, t.energi)} warna="text-rail-blue">
              {pct(kalori, t.energi)}%
            </Donut>
            <span className="mt-2 font-label-prominent text-label-prominent text-text-primary">
              Kalori
            </span>
            <span className="font-h4 text-h4 text-text-primary">
              {kalori}{" "}
              <span className="font-micro text-micro text-text-secondary">
                kkal
              </span>
            </span>
            <span className="mt-0.5 font-caption text-caption text-text-secondary">
              {pct(kalori, t.energi)}% AKG
            </span>
          </div>
          {/* Protein (Hero Macro) */}
          <div className="group flex flex-col items-center rounded-2xl bg-primary-soft/60 p-4 text-center transition-colors hover:bg-primary-soft">
            <Donut
              persen={pct(gizi.protein, t.protein)}
              warna="text-primary"
              tinggi
            >
              {pct(gizi.protein, t.protein)}%
            </Donut>
            <span className="mt-2 flex items-center gap-1 font-label-prominent text-label-prominent text-primary">
              Protein
              {r.protein >= 18 && (
                <span className="material-symbols-outlined text-[13px] text-success">
                  arrow_upward
                </span>
              )}
            </span>
            <span className="font-h4 text-h4 text-text-primary">
              {gizi.protein}{" "}
              <span className="font-micro text-micro text-text-secondary">
                g
              </span>
            </span>
            <span className="mt-0.5 font-micro text-micro font-semibold text-success-accessible">
              {r.protein >= 18
                ? "Tinggi Protein"
                : `${pct(gizi.protein, t.protein)}% AKG`}
            </span>
          </div>
          {/* Karbohidrat */}
          <div className="group flex flex-col items-center rounded-2xl bg-surface-soft p-4 text-center transition-colors hover:bg-surface-alt">
            <Donut
              persen={pct(gizi.karbo, t.karbo)}
              warna="text-secondary-container"
            >
              {pct(gizi.karbo, t.karbo)}%
            </Donut>
            <span className="mt-2 font-label-prominent text-label-prominent text-text-primary">
              Karbohidrat
            </span>
            <span className="font-h4 text-h4 text-text-primary">
              {gizi.karbo}{" "}
              <span className="font-micro text-micro text-text-secondary">
                g
              </span>
            </span>
            <span className="mt-0.5 font-caption text-caption text-text-secondary">
              {pct(gizi.karbo, t.karbo)}% AKG
            </span>
          </div>
          {/* Lemak */}
          <div className="group flex flex-col items-center rounded-2xl bg-surface-soft p-4 text-center transition-colors hover:bg-surface-alt">
            <Donut persen={pct(gizi.lemak, t.lemak)} warna="text-rail-blue">
              {pct(gizi.lemak, t.lemak)}%
            </Donut>
            <span className="mt-2 font-label-prominent text-label-prominent text-text-primary">
              Lemak Sehat
            </span>
            <span className="font-h4 text-h4 text-text-primary">
              {gizi.lemak}{" "}
              <span className="font-micro text-micro text-text-secondary">
                g
              </span>
            </span>
            <span className="mt-0.5 font-caption text-caption text-text-secondary">
              {pct(gizi.lemak, t.lemak)}% AKG
            </span>
          </div>
          {/* Serat Pangan */}
          <div className="group flex flex-col items-center rounded-2xl bg-surface-soft p-4 text-center transition-colors hover:bg-surface-alt">
            <Donut persen={pct(gizi.serat, t.serat)} warna="text-success">
              {pct(gizi.serat, t.serat)}%
            </Donut>
            <span className="mt-2 font-label-prominent text-label-prominent text-text-primary">
              Serat Pangan
            </span>
            <span className="font-h4 text-h4 text-text-primary">
              {gizi.serat}{" "}
              <span className="font-micro text-micro text-text-secondary">
                g
              </span>
            </span>
            <span className="mt-0.5 font-caption text-caption text-text-secondary">
              {pct(gizi.serat, t.serat)}% AKG
            </span>
          </div>
          {/* Natrium (tampilan template; data natrium belum tersedia) */}
          <div className="group flex flex-col items-center rounded-2xl bg-surface-soft p-4 text-center transition-colors hover:bg-surface-alt">
            <Donut persen={21} warna="text-rail-blue">
              21%
            </Donut>
            <span className="mt-2 font-label-prominent text-label-prominent text-text-primary">
              Natrium
            </span>
            <span className="font-h4 text-h4 text-text-primary">
              420{" "}
              <span className="font-micro text-micro text-text-secondary">
                mg
              </span>
            </span>
            <span className="mt-0.5 font-caption text-caption text-text-secondary">
              21% AKG
            </span>
          </div>
        </div>

        {/* Catatan Legal Gizi TKPI */}
        <div className="mt-6 flex flex-col justify-between gap-3 pt-4 text-text-secondary sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-text-disabled">
              info
            </span>
            <span className="font-caption text-caption">
              Contoh data gizi berbasis Tabel Komposisi Pangan Indonesia (TKPI)
              Kemenkes RI — disesuaikan untuk kebutuhan anak kost.
            </span>
          </div>
          <a
            href="#"
            className="flex items-center gap-1 self-start font-caption text-caption font-semibold text-rail-blue transition-colors hover:text-primary sm:self-auto"
          >
            Rincian Mikronutrien Lengkap
            <span className="material-symbols-outlined text-[14px]">
              arrow_forward
            </span>
          </a>
        </div>
      </div>

      {/* Toast Notification */}
      <div
        className={`pointer-events-none fixed bottom-24 right-4 z-50 flex items-center gap-3 rounded-2xl bg-text-primary px-5 py-3 text-on-primary shadow-xl transition-all duration-300 sm:right-8 lg:bottom-6 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        <span className="material-symbols-outlined ms-fill text-[20px] text-success">
          check_circle
        </span>
        <span className="font-body-medium text-body-medium text-white">
          {toast}
        </span>
      </div>
    </div>
  );
}
