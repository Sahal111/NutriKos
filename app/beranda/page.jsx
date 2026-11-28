"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { getRecipe, rupiah, SLOT_LABEL } from "@/lib/data";
import { nutrisiDari, allowedRecipes } from "@/lib/recommend";
import { mintaAI } from "@/lib/ai";
import {
  targetHarian,
  hitungSkor,
  kunciTanggal,
  asupanDariLog,
} from "@/lib/gizi";

const ms = (n, c = "", fill) => (
  <span className={`material-symbols-outlined ${fill ? "ms-fill" : ""} ${c}`}>
    {n}
  </span>
);
const Judul = ({ children, aksi, href = "/menu" }) => (
  <div className="flex items-center justify-between px-1">
    <h4 className="judul-seksi">{children}</h4>
    {aksi && (
      <Link
        href={href}
        className="flex items-center gap-0.5 font-label-prominent text-label-prominent text-secondary hover:underline"
      >
        <span>{aksi}</span>
        {ms("chevron_right", "text-[16px]")}
      </Link>
    )}
  </div>
);
const pill =
  "inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface px-3.5 py-1.5 font-caption text-caption font-semibold text-secondary shadow-sm";

function Donut({ pct, label, sub, warna = "text-secondary", subPill }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex w-full flex-col items-center rounded-2xl p-2 text-center transition-colors hover:bg-surface-soft/60">
      <div className="relative flex h-[96px] w-[96px] items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
          <circle
            className="text-track-chart"
            cx="18"
            cy="18"
            r="14.3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
          />
          <circle
            className={warna}
            cx="18"
            cy="18"
            r="14.3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeDasharray="89.8"
            strokeDashoffset={(89.8 * (1 - p / 100)).toFixed(1)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-metric-donut text-[19px] font-bold text-text-primary">
          {Math.round(pct)}%
        </span>
      </div>
      <span className="mt-2 text-[13px] font-bold text-text-primary">
        {label}
      </span>
      <span
        className={`mt-0.5 text-[11px] font-medium leading-tight ${subPill ? "rounded-full bg-success-soft px-2 py-0.5 font-bold text-success-accessible" : "text-text-secondary"}`}
      >
        {sub}
      </span>
    </div>
  );
}

const SLOT_JAM = { pagi: [7, 0], siang: [12, 0], malam: [18, 30] };
const SLOT_ICON = {
  pagi: "breakfast_dining",
  siang: "lunch_dining",
  malam: "dinner_dining",
};
const hhmm = (h, m) =>
  `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
const jamAkhir = (h, m) => {
  const t = h * 60 + m + 45;
  return hhmm(Math.floor(t / 60), t % 60);
};

export default function Beranda() {
  const router = useRouter();
  const {
    profile,
    plan,
    setPlan,
    generatePlan,
    setProfile,
    setAi,
    catatRiwayat,
    customPlanDetails,
    setTriggerAiModal,
    log,
    ready,
  } = useApp();
  const [bahanBaru, setBahanBaru] = useState("");
  const [loading, setLoading] = useState(false);
  if (!ready) return null;

  const resep = plan.map(getRecipe).filter(Boolean);
  const n = nutrisiDari(plan, customPlanDetails);
  const lemak = Math.round(
    plan.reduce(
      (t, id) =>
        t + (getRecipe(id)?.lemak || 0) * (customPlanDetails?.[id]?.porsi || 1),
      0,
    ),
  );
  const sisa = profile.budget - n.biaya;
  const persenBudget =
    profile.budget > 0 ? (n.biaya / profile.budget) * 100 : 0;
  const target = targetHarian(profile.jenisKelamin);
  const skor = hitungSkor(n, target);
  const nama = profile.nama.split(" ")[0];

  // Pengeluaran 7 hari terakhir: dari catatan gizi; hari ini memakai menu yang sedang dipilih bila belum dicatat.
  const hari = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const k = kunciTanggal(d);
    const biaya =
      i === 6 && !log?.[k]
        ? n.biaya
        : log?.[k]
          ? asupanDariLog(log[k]).biaya
          : 0;
    return {
      label: d.toLocaleDateString("id-ID", { weekday: "short" }),
      biaya,
      hariIni: i === 6,
      dicatat: !!log?.[k],
    };
  });
  const totalMinggu = hari.reduce((t, h) => t + h.biaya, 0);
  const limitMinggu = profile.budget * 7;
  const hemat = limitMinggu - totalMinggu;

  // Jadwal makan hari ini
  const now = new Date();
  const menit = now.getHours() * 60 + now.getMinutes();
  const jadwal = ["pagi", "siang", "malam"].map((s) => {
    const [h, m] = SLOT_JAM[s];
    return {
      s,
      h,
      m,
      daftar: resep.filter((r) => r.slot === s),
      selesai: menit > h * 60 + m + 45,
    };
  });
  const idxNext = jadwal.findIndex((x) => !x.selesai);
  const idxSekarang = idxNext === -1 ? jadwal.length : idxNext;

  const gram = { protein: n.protein, karbo: n.karbo, lemak };
  const kE = { protein: n.protein * 4, karbo: n.karbo * 4, lemak: lemak * 9 };
  const totE = kE.protein + kE.karbo + kE.lemak;
  const pE = (x) => (totE ? Math.round((x / totE) * 100) : 0);
  const komposisi = [
    ["Protein", "protein", "bg-primary-container"],
    ["Karbohidrat", "karbo", "bg-secondary-container"],
    ["Lemak", "lemak", "bg-warning"],
  ];
  const jumlahCatat = hari.filter((h) => h.dicatat).length;

  const rekomendasiLain = allowedRecipes(profile)
    .filter((r) => !plan.includes(r.id))
    .slice(0, 2);
  const terendah = Object.entries(skor.komponen).sort((a, b) => a[1] - b[1])[0];
  const NAMA_K = {
    protein: "Protein",
    karbo: "Karbohidrat",
    sayur: "Sayur & buah",
  };

  const tambahBahan = () => {
    const v = bahanBaru.trim();
    if (!v) return;
    if (!profile.stok.some((s) => s.toLowerCase() === v.toLowerCase()))
      setProfile({ stok: [...profile.stok, v] });
    setBahanBaru("");
  };
  const rekomendasi = async () => {
    setLoading(true);
    const hasil = await mintaAI("menu", profile);
    if (hasil && hasil.ids?.length) {
      setPlan(hasil.ids);
      catatRiwayat(hasil.ids);
      setAi({ alasan: hasil.alasan, sumber: hasil.sumber });
    } else {
      generatePlan();
      setAi({
        alasan:
          "Dipilih berdasarkan bujet, alat masak, dan pantanganmu (mode aturan).",
        sumber: "aturan",
      });
    }
    setLoading(false);
    setTriggerAiModal?.(true);
    router.push("/menu");
  };
  const acak = () => {
    const list = allowedRecipes(profile);
    if (list.length)
      router.push(`/menu/${list[Math.floor(Math.random() * list.length)].id}`);
  };

  return (
    <div className="grid w-full grid-cols-1 items-start gap-7 pb-12 xl:grid-cols-[1.78fr_1fr_340px]">
      {/* ============ KOLOM 1 ============ */}
      <div className="flex min-w-0 flex-col gap-6">
        {/* Welcome */}
        <div
          className="group relative flex min-h-[175px] flex-col justify-between gap-6 overflow-hidden rounded-[20px] border border-border-subtle/60 p-6 shadow-[0_10px_30px_rgba(38,57,138,0.06)] transition-all duration-300 hover:shadow-[0_16px_36px_rgba(38,57,138,0.1)] sm:p-7 md:flex-row md:items-center"
          style={{
            background:
              "radial-gradient(120% 120% at 100% 0%, #E8EDFC 0%, #F5F7FE 45%, #FFFFFF 100%)",
          }}
        >
          <div className="pointer-events-none absolute -right-6 -top-10 h-64 w-64 rounded-full bg-secondary-container/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-5 right-36 h-40 w-40 rounded-full bg-rail-blue/10 blur-2xl" />
          <div className="z-10 flex max-w-full flex-col gap-3.5 md:max-w-[68%]">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-secondary/20 bg-surface/90 px-3.5 py-1 font-micro text-[12px] font-bold tracking-tight text-secondary backdrop-blur-sm">
              {ms("auto_awesome", "text-[15px] text-rail-blue", true)}
              <span>
                Target Hemat Harian:{" "}
                {sisa >= 0 ? "Sesuai Jalur" : "Melebihi Bujet"}
              </span>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-[26px] font-bold tracking-tight text-text-primary">
                Halo, {nama}!{" "}
                <span className="inline-block cursor-default transition-transform duration-200 hover:rotate-12">
                  👋
                </span>
              </h3>
              <p className="mt-1.5 font-body-default text-body-default leading-relaxed text-text-secondary">
                {sisa >= 0
                  ? "Sisa pagu hari ini "
                  : "Menu hari ini melebihi bujet "}
                <span className="mx-0.5 inline-flex items-center rounded-lg border border-secondary/15 bg-primary-soft px-2.5 py-0.5 text-[13px] font-bold text-primary">
                  {rupiah(Math.abs(sisa))}
                </span>{" "}
                dari target harian {rupiah(profile.budget)}. {resep.length} menu
                sehat &amp; hemat siap dieksekusi hari ini.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={rekomendasi}
                className="inline-flex items-center gap-2 rounded-xl bg-rail-blue px-5 py-2.5 font-label-prominent text-label-prominent text-white shadow-[0_4px_14px_rgba(91,116,214,0.35)] transition-all duration-200 hover:bg-primary-container disabled:opacity-70"
              >
                <span>
                  {loading ? "Menyusun menu..." : "Rekomendasikan Menu"}
                </span>
                {ms("arrow_forward", "text-[17px]")}
              </button>
              <Link
                href="/bahan-sisa"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-4 py-2.5 font-label-prominent text-label-prominent text-secondary shadow-sm transition-colors hover:bg-pill-active-bg"
              >
                {ms("kitchen", "text-[18px]")}Cek Bahan Sisa
              </Link>
              <button
                type="button"
                onClick={acak}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-4 py-2.5 font-label-prominent text-label-prominent text-secondary shadow-sm transition-colors hover:bg-pill-active-bg"
              >
                {ms("casino", "text-[18px]")}Ide Masak Acak
              </button>
              {resep.length > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-success/20 bg-success-soft/70 px-3 py-1.5 font-caption text-caption font-semibold text-success-accessible">
                  {ms("check_circle", "text-[16px] text-success", true)}
                  <span>
                    {skor.total >= 80
                      ? "Porsi nutrisi terpenuhi"
                      : `Skor gizi ${skor.total}/100 · ${skor.kategori}`}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="pointer-events-none relative z-10 flex h-[150px] w-[150px] flex-shrink-0 select-none items-center justify-center self-center md:self-auto">
            <div className="absolute inset-2 -z-10 rounded-2xl bg-gradient-to-tr from-rail-blue/20 via-primary-soft to-white/90 blur-lg" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Maskot NutriKos"
              className="h-full w-full object-contain drop-shadow-[0_14px_24px_rgba(38,57,138,0.22)] transition-transform duration-300 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRoNRlLzky_errvZRACUYBDai6XkNM9a9vmwlZrC_YoKw-L6Zzub-3Yslywcgl2aUXr9yMbakBGZ4_fqRxP2LNtAKMpcH8bI2pg_FepS0SsLJAiPtwsxmH_E06_JFUcTFbn9lOqmV0QMrp87o7ex0xCdSOW3q_90JcEYXbBiNOHFMqarcWjwq_OlOKmB036bvjUUbCbdSR8_9VMM7S9EB7BefJ3LIdxCsKBR0NWFM"
            />
          </div>
        </div>

        {/* Nutrition & Budget Performance */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="judul-seksi">Nutrition &amp; Budget Performance</h4>
            <span className={pill}>7 hari terakhir</span>
          </div>
          <div className="flex flex-col gap-5 rounded-[20px] border border-border-subtle/50 bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle/40 pb-2">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                  Total Pengeluaran 7 Hari
                </span>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="text-[32px] font-bold leading-tight tracking-tight text-text-primary">
                    {rupiah(totalMinggu)}
                  </span>
                  <span className="font-caption text-caption font-medium text-text-secondary">
                    / limit {rupiah(limitMinggu)}
                  </span>
                </div>
                <div
                  className={`mt-2.5 inline-flex items-center gap-2 self-start rounded-full border px-3 py-1 font-caption text-caption font-semibold ${hemat >= 0 ? "border-success/20 bg-success-soft/90 text-success-accessible" : "border-danger/20 bg-danger-soft text-danger"}`}
                >
                  {ms(
                    hemat >= 0 ? "trending_down" : "trending_up",
                    "text-[15px]",
                  )}
                  <span>
                    {hemat >= 0
                      ? `Hemat ${rupiah(hemat)}`
                      : `Lebih ${rupiah(-hemat)}`}{" "}
                    (
                    {Math.abs(
                      Math.round((hemat / (limitMinggu || 1)) * 1000) / 10,
                    )}
                    % {hemat >= 0 ? "lebih irit" : "di atas limit"})
                  </span>
                </div>
              </div>
              <Link
                href="/menu"
                className="group/b flex h-9 items-center gap-1.5 rounded-xl border border-border-subtle/60 bg-surface-soft px-4 font-label-prominent text-label-prominent text-secondary shadow-sm transition-all hover:bg-pill-active-bg"
              >
                <span>Semua riwayat</span>
                {ms(
                  "chevron_right",
                  "text-[18px] transition-transform group-hover/b:translate-x-0.5",
                )}
              </Link>
            </div>
            <div className="flex flex-col pt-2">
              <div className="grid h-[175px] grid-cols-7 items-end gap-3 border-b border-border-subtle/40 px-2 pb-2 sm:gap-5">
                {hari.map((h, i) => {
                  const p =
                    profile.budget > 0
                      ? Math.min(100, (h.biaya / profile.budget) * 100)
                      : 0;
                  return (
                    <div
                      key={i}
                      className="group/bar flex h-full cursor-default flex-col items-center justify-end"
                      title={rupiah(h.biaya)}
                    >
                      <span className="mb-1.5 text-[11px] font-semibold text-text-secondary transition-colors group-hover/bar:text-primary">
                        {h.biaya
                          ? `${Math.round((h.biaya / (profile.budget || 1)) * 1000) / 10}%`
                          : "–"}
                      </span>
                      <div className="flex h-[120px] w-full max-w-[34px] flex-col justify-end overflow-hidden rounded-t-[8px] bg-surface-alt shadow-sm">
                        <div
                          className={`w-full rounded-t-[8px] transition-all ${h.biaya > profile.budget ? "bg-danger" : "bg-primary-container"}`}
                          style={{ height: `${p}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2.5 grid grid-cols-7 gap-3 px-1 text-center sm:gap-5">
                {hari.map((h, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="truncate text-[12px] font-bold text-text-primary">
                      {h.label}
                    </span>
                    <span className="truncate text-[11px] text-text-secondary">
                      {h.hariIni
                        ? "Hari ini"
                        : h.biaya
                          ? `${Math.round(h.biaya / 1000)}rb`
                          : ""}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-border-subtle/40 bg-surface-soft/80 px-3.5 py-2.5">
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-[4px] bg-primary-container" />
                    <span className="font-caption text-caption font-medium text-text-secondary">
                      Realisasi Belanja
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-[4px] bg-surface-alt ring-1 ring-border-subtle" />
                    <span className="font-caption text-caption font-medium text-text-secondary">
                      Bujet Harian
                    </span>
                  </div>
                </div>
                <span className="font-micro text-micro text-text-disabled">
                  Dari catatan gizi
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Menus */}
        {rekomendasiLain.length > 0 && (
          <div className="flex flex-col gap-3">
            <Judul aksi="Lihat semua">Recommended Menus</Judul>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {rekomendasiLain.map((r) => (
                <div
                  key={r.id}
                  className="group flex flex-col justify-between rounded-[20px] border border-border-subtle/50 bg-surface p-5 shadow-sm transition-all duration-300 hover:border-rail-blue/30 hover:shadow-md"
                >
                  <div className="flex flex-col gap-3">
                    <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-primary-soft text-6xl">
                      <span className="transition-transform duration-300 group-hover:scale-110">
                        {r.emoji}
                      </span>
                      <span className="absolute left-2.5 top-2.5 rounded-full border border-secondary/10 bg-surface/95 px-3 py-1 font-micro text-micro font-bold text-secondary shadow-sm">
                        {SLOT_LABEL[r.slot]}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-h4 text-h4 leading-snug text-text-primary transition-colors group-hover:text-primary">
                        {r.nama}
                      </h4>
                      <div className="mt-1 flex items-center gap-2.5 font-caption text-caption text-text-secondary">
                        <span className="text-[14px] font-bold text-primary">
                          {rupiah(r.harga)}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-text-disabled" />
                        <span>{r.kalori} kkal</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/menu/${r.id}`}
                    className="mt-4 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-border-subtle/80 bg-surface-soft font-label-prominent text-label-prominent text-secondary shadow-sm transition-all hover:border-rail-blue hover:bg-rail-blue hover:text-white"
                  >
                    {ms("add_circle", "text-[18px]")}
                    <span>Lihat detail</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu hari ini */}
        <div className="flex flex-col gap-3">
          <Judul aksi="Lihat semua">Menu Hari Ini</Judul>
          {resep.length === 0 && (
            <div className="rounded-[20px] border border-border-subtle/50 bg-surface p-5 text-sm text-text-secondary shadow-sm">
              Belum ada menu yang cocok dengan alat dan pantanganmu. Coba ubah
              di Profil Kos.
            </div>
          )}
          {resep.map((r) => {
            const porsi = customPlanDetails?.[r.id]?.porsi || 1;
            return (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-[20px] border border-border-subtle/50 bg-surface p-4 shadow-sm transition-all hover:bg-surface-soft/80"
              >
                <Link
                  href={`/menu/${r.id}`}
                  className="flex min-w-0 items-center gap-3.5"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft text-2xl ring-1 ring-border-subtle">
                    {r.emoji}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-label-prominent text-label-prominent font-bold text-text-primary">
                      {r.nama}
                    </span>
                    <span className="mt-0.5 font-caption text-caption text-text-secondary">
                      {SLOT_LABEL[r.slot]} · {r.waktu} mnt
                      {porsi > 1 ? ` · ${porsi} porsi` : ""}
                    </span>
                  </div>
                </Link>
                <div className="flex items-center gap-4">
                  <span className="text-[15px] font-bold text-text-primary">
                    {rupiah(r.harga * porsi)}
                  </span>
                  <Link
                    href={`/menu/${r.id}`}
                    aria-label={`Detail ${r.nama}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-variant"
                  >
                    {ms("edit_note", "text-[18px]")}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============ KOLOM 2: NUTRITION OVERVIEW ============ */}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="judul-seksi">Nutrition Overview</h4>
          <span className={pill}>Hari ini</span>
        </div>
        <div className="flex min-h-[580px] flex-col justify-between rounded-[20px] border border-border-subtle/50 bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="grid grid-cols-2 items-center justify-items-center gap-x-4 gap-y-7 py-2">
            <Donut
              pct={(n.kalori / target.energi) * 100}
              label="Kalori"
              sub={`${n.kalori.toLocaleString("id-ID")} / ${target.energi.toLocaleString("id-ID")} kkal`}
            />
            <Donut
              pct={(n.protein / target.protein) * 100}
              label="Protein"
              sub={`${n.protein} / ${target.protein} g`}
            />
            <Donut
              pct={(n.karbo / target.karbo) * 100}
              label="Karbohidrat"
              sub={`${n.karbo} / ${target.karbo} g`}
            />
            <Donut
              pct={(lemak / target.lemak) * 100}
              label="Lemak"
              sub={`${lemak} / ${target.lemak} g`}
            />
            <Donut
              pct={skor.total}
              label="Skor Nutrisi"
              sub={skor.kategori}
              subPill={skor.total >= 80}
              warna="text-success"
            />
            <Donut
              pct={persenBudget}
              label="Penggunaan Budget"
              sub={`${rupiah(n.biaya)} / ${rupiah(profile.budget)}`.replace(
                /Rp /g,
                "Rp ",
              )}
              warna={
                persenBudget > 100 ? "text-danger" : "text-secondary-container"
              }
            />
          </div>
          <Link
            href="/gizi"
            className="mt-4 flex items-center justify-center gap-1.5 border-t border-border-subtle/50 pt-3.5 text-center font-micro text-micro text-text-secondary hover:text-primary"
          >
            {ms("info", "text-[15px] text-text-disabled")}
            <span>Lihat skor mingguan di Gizi Mingguan</span>
          </Link>
        </div>

        {/* Komposisi Energi + Konsistensi Catat */}
        <div className="mt-3 flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-[20px] border border-border-subtle/50 bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between border-b border-border-subtle/40 pb-2">
              <h4 className="judul-seksi !gap-2 [&::before]:!h-4">
                Komposisi Energi
              </h4>
              <span className="font-caption text-caption font-medium text-text-secondary">
                {n.kalori.toLocaleString("id-ID")} kkal
              </span>
            </div>
            <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full bg-track-chart">
              {totE > 0 &&
                komposisi.map(([, k, c]) => (
                  <div
                    key={k}
                    className={`h-full ${c}`}
                    style={{ flexGrow: kE[k] }}
                  />
                ))}
            </div>
            <div className="flex flex-col gap-2.5">
              {komposisi.map(([l, k, c]) => (
                <div key={k} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${c}`} />
                    <span className="text-[13px] font-semibold text-text-primary">
                      {l}
                    </span>
                  </div>
                  <span className="font-caption text-caption text-text-secondary">
                    {gram[k]} g ·{" "}
                    <b className="text-text-primary">{pE(kE[k])}%</b>
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-border-subtle/50 pt-4">
              {[
                ["Serat", n.serat, target.serat, "g"],
                ["Sayur & buah", n.sayur, target.sayur, "porsi"],
              ].map(([l, v, t, u]) => (
                <div key={l} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-text-primary">{l}</span>
                    <span className="text-text-secondary">
                      {Math.round(v * 10) / 10} / {t} {u}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-track-chart">
                    <div
                      className="h-full rounded-full bg-success transition-all"
                      style={{
                        width: `${t > 0 ? Math.min(100, (v / t) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-[20px] border border-border-subtle/50 bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between border-b border-border-subtle/40 pb-2">
              <h4 className="judul-seksi !gap-2 [&::before]:!h-4">
                Konsistensi Catat
              </h4>
              <span className={`${pill} !py-1`}>{jumlahCatat}/7 hari</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {hari.map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${h.dicatat ? "bg-rail-blue text-white shadow-sm" : h.hariIni ? "border-2 border-dashed border-rail-blue/50 text-rail-blue" : "bg-surface-alt text-text-disabled"}`}
                  >
                    {ms(
                      h.dicatat ? "check" : h.hariIni ? "edit" : "remove",
                      "text-[18px]",
                    )}
                  </span>
                  <span className="text-[11px] font-semibold text-text-secondary">
                    {h.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[12px] leading-relaxed text-text-secondary">
              {jumlahCatat === 0
                ? "Belum ada catatan minggu ini. Catat menu harianmu supaya skor gizi mingguan akurat."
                : `${jumlahCatat} dari 7 hari sudah tercatat. Makin rutin dicatat, makin akurat skor gizi mingguanmu.`}
            </p>
            <Link href="/gizi" className="btn btn-soft !py-2.5">
              {ms("pie_chart", "text-[18px]")}Buka Gizi Mingguan
            </Link>
          </div>
        </div>
      </div>

      {/* ============ KOLOM 3 ============ */}
      <div className="flex w-full min-w-0 flex-col gap-6 xl:w-[340px] xl:shrink-0">
        {/* Today's Meal Plan */}
        <div className="flex flex-col rounded-[20px] border border-border-subtle/50 bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-start justify-between border-b border-border-subtle/40 pb-2">
            <div className="flex flex-col">
              <h4 className="judul-seksi !gap-2 [&::before]:!h-4">
                Today&apos;s Meal Plan
              </h4>
              <span className="mt-0.5 font-caption text-caption font-medium text-text-secondary">
                3 jadwal waktu makan
              </span>
            </div>
            <span className={`${pill} !bg-surface-soft !py-1`}>Hari ini</span>
          </div>
          <div className="relative flex flex-col gap-3.5 pt-1">
            {[
              ...jadwal.slice(0, idxSekarang),
              "now",
              ...jadwal.slice(idxSekarang),
            ].map((x) =>
              x === "now" ? (
                <div key="now" className="flex items-center gap-3 py-0.5">
                  <span className="w-10 flex-shrink-0 text-right text-[12px] font-bold text-secondary">
                    {hhmm(now.getHours(), now.getMinutes())}
                  </span>
                  <div className="flex flex-1 items-center gap-2">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-secondary ring-4 ring-secondary/20" />
                    <div className="h-px flex-1 border-t border-dashed border-secondary/50" />
                    <span className="font-micro text-[10px] font-bold uppercase tracking-wider text-secondary">
                      Sekarang
                    </span>
                  </div>
                </div>
              ) : (
                <div key={x.s} className="flex items-start gap-3">
                  <span
                    className={`w-10 flex-shrink-0 pt-2 text-right text-[12px] ${x.selesai ? "font-bold text-text-primary" : "font-medium text-text-secondary"}`}
                  >
                    {hhmm(x.h, x.m)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {x.daftar.length === 0 && (
                      <div className="rounded-[16px] border border-dashed border-border-subtle bg-surface-soft p-3.5 text-[12px] text-text-secondary">
                        Belum ada menu {SLOT_LABEL[x.s].toLowerCase()}
                      </div>
                    )}
                    {x.daftar.map((r) => {
                      const porsi = customPlanDetails?.[r.id]?.porsi || 1;
                      return (
                        <Link
                          key={r.id}
                          href={`/menu/${r.id}`}
                          className={`block min-w-0 rounded-[16px] p-3.5 transition-all ${x.selesai ? "bg-rail-blue text-white shadow-sm hover:-translate-y-0.5" : "border border-border-subtle/60 bg-surface-soft hover:bg-pill-active-bg/40"}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${x.selesai ? "bg-white/20 text-white" : "border border-border-subtle bg-surface text-secondary shadow-sm"}`}
                            >
                              {ms(SLOT_ICON[x.s], "text-[20px]")}
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col">
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`truncate text-[13px] font-bold leading-snug ${x.selesai ? "" : "text-text-primary"}`}
                                >
                                  {SLOT_LABEL[x.s]}: {r.nama}
                                </span>
                                {x.selesai && (
                                  <span className="rounded-full bg-white/20 px-1.5 text-[10px] font-bold">
                                    Selesai
                                  </span>
                                )}
                              </div>
                              <div
                                className={`mt-0.5 flex items-center gap-2 text-[11px] ${x.selesai ? "text-white/85" : "text-text-secondary"}`}
                              >
                                {ms("schedule", "text-[13px]")}
                                <span>
                                  {hhmm(x.h, x.m).replace(":", ".")} -{" "}
                                  {jamAkhir(x.h, x.m).replace(":", ".")} ·{" "}
                                  {rupiah(r.harga * porsi)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Alat & Bahan Kos */}
        <div className="flex flex-col gap-4 rounded-[20px] border border-border-subtle/50 bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between border-b border-border-subtle/40 pb-2">
            <h4 className="judul-seksi !gap-2 [&::before]:!h-4">
              Alat &amp; Bahan Kos
            </h4>
            <Link
              href="/profil-kos"
              className="flex items-center gap-0.5 font-label-prominent text-label-prominent text-secondary hover:underline"
            >
              <span>Ubah alat</span>
              {ms("chevron_right", "text-[16px]")}
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.alat.map((a) => (
              <span key={a} className="chip chip-on">
                ✓ {a}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm font-semibold text-text-primary">
            <span>Bahan tersimpan di kos</span>
            <span className="text-primary">{profile.stok.length} bahan</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.stok.map((s) => (
              <span key={s} className="chip">
                {s}
                <button
                  aria-label={`Hapus ${s}`}
                  onClick={() =>
                    setProfile({ stok: profile.stok.filter((x) => x !== s) })
                  }
                >
                  {ms("close", "text-[14px]")}
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Tambah bahan (misal: Tahu)"
              value={bahanBaru}
              onChange={(e) => setBahanBaru(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && tambahBahan()}
            />
            <button
              className="btn btn-primary shrink-0"
              onClick={tambahBahan}
              aria-label="Tambah bahan"
            >
              {ms("add", "text-[20px]")}
            </button>
          </div>
        </div>

        {/* NutriKos AI Insights */}
        <div className="relative flex flex-col gap-3.5 overflow-hidden rounded-[20px] border border-border-subtle/50 bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-pill-active-bg/60 blur-xl" />
          <div className="z-10 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pill-active-bg text-secondary">
              {ms("auto_awesome", "text-[17px]", true)}
            </div>
            <h4 className="font-h4 text-h4 font-bold tracking-tight text-text-primary">
              NutriKos AI Insights
            </h4>
          </div>
          <div className="z-10 flex flex-col gap-2.5 pt-1">
            {[
              [
                "💡",
                sisa >= 0 ? (
                  <>
                    Menu hari ini {rupiah(n.biaya)} dari bujet{" "}
                    {rupiah(profile.budget)}, sisa{" "}
                    <span className="rounded bg-success-soft px-1.5 py-0.5 font-bold text-success-accessible">
                      {rupiah(sisa)}
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Menu hari ini melebihi bujet{" "}
                    <span className="rounded bg-danger-soft px-1.5 py-0.5 font-bold text-danger">
                      {rupiah(-sisa)}
                    </span>
                    . Ganti dengan menu yang lebih murah.
                  </>
                ),
              ],
              [
                "🍳",
                profile.stok.length ? (
                  <>
                    Kamu punya <b>{profile.stok.length} bahan</b> di kos.{" "}
                    <Link
                      href="/bahan-sisa"
                      className="font-bold text-primary underline"
                    >
                      Cek ide masakan
                    </Link>{" "}
                    dari bahan sisa.
                  </>
                ) : (
                  <>
                    Belum ada bahan stok.{" "}
                    <Link
                      href="/bahan-sisa"
                      className="font-bold text-primary underline"
                    >
                      Tambahkan
                    </Link>{" "}
                    agar ide masakan lebih pas.
                  </>
                ),
              ],
              [
                "🥗",
                resep.length === 0 ? (
                  <>Pilih menu dulu untuk melihat analisis gizi harianmu.</>
                ) : terendah[1] < 80 ? (
                  <>
                    {NAMA_K[terendah[0]]} baru{" "}
                    <span className="font-semibold text-primary">
                      {terendah[1]}%
                    </span>{" "}
                    dari target harian. Tambahkan menu yang kaya{" "}
                    {NAMA_K[terendah[0]].toLowerCase()}.
                  </>
                ) : (
                  <>
                    Protein, karbohidrat, dan sayur hari ini sudah memenuhi
                    target harian.
                  </>
                ),
              ],
            ].map(([e, t], i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border-subtle/50 bg-surface-soft/80 p-3.5 shadow-sm transition-colors hover:border-rail-blue/30"
              >
                <span className="mt-0.5 select-none text-base">{e}</span>
                <p className="font-body-default text-[12px] leading-relaxed text-text-primary">
                  {t}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
