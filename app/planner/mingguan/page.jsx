"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import {
  allowedRecipes,
  recommendWeekly,
  buildShopping,
} from "@/lib/recommend";
import { targetHarian } from "@/lib/gizi";
import { getRecipe, rupiah, SLOTS, SLOT_LABEL } from "@/lib/data";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const BLN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
const SLOT_META = {
  pagi: {
    ikon: "wb_twilight",
    warna: "text-secondary",
    jam: "07:00 - 08:30",
    mulai: 7 * 60,
  },
  siang: {
    ikon: "wb_sunny",
    warna: "text-[#8A5A00]",
    jam: "12:00 - 13:30",
    mulai: 12 * 60,
  },
  malam: {
    ikon: "nights_stay",
    warna: "text-primary",
    jam: "18:30 - 20:00",
    mulai: 18 * 60 + 30,
  },
};
const JENDELA = 90;
const AKHIR_PEKAN = [5, 6];

const ms = (nama, kelas = "") => (
  <span className={`material-symbols-outlined ${kelas}`}>{nama}</span>
);
const angka = (n) => Number(n).toLocaleString("id-ID");
const jam2 = (d) =>
  `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;

export default function MealPlannerMingguan() {
  const router = useRouter();
  const { profile, addExtra, ready } = useApp();
  const [mingguan, setMingguan] = useState(null); // 7 hari, tiap hari = daftar id resep
  const [diperbarui, setDiperbarui] = useState(null);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null); // { hari, slot }
  const [sekarang] = useState(() => new Date());

  useEffect(() => {
    if (ready && !mingguan) {
      setMingguan(recommendWeekly(profile));
      setDiperbarui(new Date());
    }
  }, [ready, mingguan, profile]);

  const semua = useMemo(() => allowedRecipes(profile), [profile]);

  if (!ready || !mingguan) return null;

  const showToast = (pesan) => {
    setToast(pesan);
    setTimeout(() => setToast(""), 3000);
  };

  // ===== Kalender pekan ini (Senin - Minggu) =====
  const idxHariIni = (sekarang.getDay() + 6) % 7;
  const senin = new Date(
    sekarang.getFullYear(),
    sekarang.getMonth(),
    sekarang.getDate() - idxHariIni,
  );
  const tanggal = HARI.map(
    (_, i) =>
      new Date(senin.getFullYear(), senin.getMonth(), senin.getDate() + i),
  );
  const minggu = tanggal[6];
  const tahun = minggu.getFullYear();
  const periode =
    senin.getMonth() === minggu.getMonth()
      ? `${senin.getDate()} - ${minggu.getDate()} ${BULAN[minggu.getMonth()]} ${tahun}`
      : `${senin.getDate()} ${BULAN[senin.getMonth()]} - ${minggu.getDate()} ${BULAN[minggu.getMonth()]} ${tahun}`;
  const rentangPendek =
    senin.getMonth() === minggu.getMonth()
      ? `${senin.getDate()} - ${minggu.getDate()} ${BLN[minggu.getMonth()]} ${tahun}`
      : `${senin.getDate()} ${BLN[senin.getMonth()]} - ${minggu.getDate()} ${BLN[minggu.getMonth()]} ${tahun}`;
  const offsetBulan =
    (new Date(sekarang.getFullYear(), sekarang.getMonth(), 1).getDay() + 6) % 7;
  const mingguKe = Math.ceil((sekarang.getDate() + offsetBulan) / 7);

  // ===== Data turunan dari rencana =====
  const t = targetHarian(profile.jenisKelamin);
  const hariData = mingguan.map((ids) => {
    const rs = ids.map((id) => getRecipe(id)).filter(Boolean);
    const slot = {};
    SLOTS.forEach((s) => {
      slot[s] = rs.find((r) => r.slot === s) || null;
    });
    return {
      rs,
      slot,
      biaya: rs.reduce((n, r) => n + r.harga, 0),
      kalori: rs.reduce((n, r) => n + r.kalori, 0),
      protein: rs.reduce((n, r) => n + r.protein, 0),
      serat: rs.reduce((n, r) => n + r.serat, 0),
      terisi: SLOTS.filter((s) => slot[s]).length,
    };
  });
  const semuaId = mingguan.flat().filter((id) => getRecipe(id));
  const totalBiaya = hariData.reduce((n, h) => n + h.biaya, 0);
  const pagu = profile.budget * 7;
  const sisaPagu = pagu - totalBiaya;
  const pctPagu =
    pagu > 0 ? Math.min(100, Math.round((totalBiaya / pagu) * 100)) : 0;
  const rataKalori = Math.round(hariData.reduce((n, h) => n + h.kalori, 0) / 7);
  const rataProtein = Math.round(
    hariData.reduce((n, h) => n + h.protein, 0) / 7,
  );
  const rataSerat = Math.round(hariData.reduce((n, h) => n + h.serat, 0) / 7);
  const pProtein =
    t.protein > 0 ? Math.round((rataProtein / t.protein) * 100) : 0;
  const pSerat = t.serat > 0 ? Math.round((rataSerat / t.serat) * 100) : 0;
  const pKalori = t.energi > 0 ? (rataKalori / t.energi) * 100 : 0;
  const gizi = pProtein >= 80 && pKalori >= 60 && pKalori <= 110;
  const terisi = hariData.reduce((n, h) => n + h.terisi, 0);
  const totalSlot = 7 * SLOTS.length;
  const kosong = [];
  hariData.forEach((h, i) =>
    SLOTS.forEach((s) => !h.slot[s] && kosong.push({ hari: i, slot: s })),
  );

  const belanja = buildShopping(profile, semuaId);
  const perluBeli = belanja.filter((x) => !x.sudahAda);
  const dariStok = belanja.filter((x) => x.sudahAda);
  const biayaBeli = perluBeli.reduce((n, x) => n + x.harga, 0);
  const pctStok = belanja.length
    ? Math.round((dariStok.length / belanja.length) * 100)
    : 0;

  const hitungBahan = {};
  hariData.forEach((h) =>
    h.rs.forEach((r) =>
      r.bahan.forEach(
        (b) => (hitungBahan[b.nama] = (hitungBahan[b.nama] || 0) + 1),
      ),
    ),
  );
  const bahanTop = Object.entries(hitungBahan).sort((a, b) => b[1] - a[1])[0];

  // Status sel: hari lalu selesai, hari ini mengikuti jam, hari depan terjadwal.
  const menitSekarang = sekarang.getHours() * 60 + sekarang.getMinutes();
  const slotSelesai = (s) => menitSekarang > SLOT_META[s].mulai + JENDELA;
  const slotAktif = SLOTS.find((s) => !slotSelesai(s));
  const statusSel = (i, s) => {
    if (i < idxHariIni) return "selesai";
    if (i > idxHariIni) return "terjadwal";
    if (slotSelesai(s)) return "selesai";
    return s === slotAktif ? "siap" : "terencana";
  };
  const BADGE = {
    selesai: [
      "Selesai",
      "bg-success-soft text-success-accessible",
      "check_circle",
      "text-success",
    ],
    siap: [
      "Siap Masak",
      "bg-warning-soft text-[#8A5A00]",
      "skillet",
      "text-warning",
    ],
    terencana: [
      "Terencana",
      "bg-primary-soft text-primary",
      "schedule",
      "text-secondary",
    ],
    terjadwal: [
      "Terjadwal",
      "bg-primary-soft text-primary",
      "restaurant",
      "text-text-disabled",
    ],
  };

  // ===== Aksi =====
  const acakUlang = () => {
    setMingguan(recommendWeekly(profile));
    setDiperbarui(new Date());
    showToast("✓ Rencana seminggu berhasil disusun ulang!");
  };

  const tambahKeHari = (id) => {
    if (!modal) return;
    setMingguan((m) => m.map((d, j) => (j === modal.hari ? [...d, id] : d)));
    showToast(`✓ "${getRecipe(id)?.nama}" ditambahkan ke ${HARI[modal.hari]}!`);
    setModal(null);
  };

  const generateBelanja = () => {
    [...new Set(semuaId)].forEach((id) => addExtra(id));
    router.push("/belanja");
  };

  const kandidat = modal
    ? semua.filter(
        (r) => r.slot === modal.slot && !mingguan[modal.hari].includes(r.id),
      )
    : [];

  // ===== Potongan UI =====
  const warnaKolom = (i) =>
    i === idxHariIni
      ? "bg-primary-soft/30"
      : AKHIR_PEKAN.includes(i)
        ? "bg-surface-alt/40"
        : "";

  const Sel = (i, s) => {
    const r = hariData[i].slot[s];
    const spesial = i === idxHariIni || AKHIR_PEKAN.includes(i);
    if (!r) {
      return (
        <button
          type="button"
          onClick={() => setModal({ hari: i, slot: s })}
          className="group flex h-[126px] w-full flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-secondary/40 p-3 text-center transition-all hover:border-secondary hover:bg-surface"
        >
          <span className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-pill-active-bg text-secondary transition-transform group-hover:scale-110">
            {ms("add", "text-[18px]")}
          </span>
          <span className="font-label-prominent text-label-prominent font-bold text-secondary">
            Tambah Menu
          </span>
          <span className="font-micro text-micro text-text-secondary">
            {SLOT_LABEL[s]}
          </span>
        </button>
      );
    }
    const [label, kelasBadge, ikon, kelasIkon] = BADGE[statusSel(i, s)];
    return (
      <Link
        href={`/menu/${r.id}`}
        className={`flex h-[126px] flex-col justify-between rounded-[14px] p-3 transition-all ${spesial ? "bg-surface shadow-sm hover:shadow-md" : "bg-surface-alt/80 hover:bg-surface hover:shadow-sm"}`}
      >
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span
              className={`rounded px-1.5 py-0.5 font-micro text-micro font-bold ${kelasBadge}`}
            >
              {label}
            </span>
            {ms(ikon, `text-[16px] ${kelasIkon}`)}
          </div>
          <h4 className="line-clamp-2 font-body-default text-body-default font-bold leading-tight text-text-primary">
            {r.nama}
          </h4>
        </div>
        <div className="flex items-center justify-between pt-2 font-caption text-caption text-text-secondary">
          <span className="font-bold text-text-primary">{rupiah(r.harga)}</span>
          <span>{r.kalori} kkal</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="flex w-full flex-col">
      {toast && (
        <div className="fixed bottom-24 right-4 z-[60] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-xl bg-text-primary px-4 py-3 font-label-prominent text-label-prominent text-white shadow-xl lg:bottom-6">
          {ms("check_circle", "text-[20px] text-success")}
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <section className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pill-active-bg px-3 py-1 font-micro text-micro font-bold uppercase tracking-wide text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              Rencana Makan Kost • Periode {periode}
            </span>
            <span className="font-caption text-caption text-text-disabled">
              •
            </span>
            <span className="font-caption text-caption font-medium text-text-secondary">
              Minggu ke-{mingguKe} Bulan Ini
            </span>
          </div>
          <h1 className="font-h1 text-h1 tracking-tight text-text-primary">
            Meal Planner Mingguan
          </h1>
          <p className="mt-1 max-w-2xl font-body-default text-body-default text-text-secondary">
            Susun jadwal makan hemat dan bergizi 7 hari ke depan untuk optimasi
            anggaran belanja pasar dan stok kosan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <div className="flex items-center rounded-xl bg-surface p-1 shadow-sm">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-alt hover:text-text-primary"
              title="Minggu Sebelumnya"
              aria-label="Minggu Sebelumnya"
            >
              {ms("chevron_left", "text-[18px]")}
            </button>
            <div className="flex items-center gap-1.5 px-3">
              {ms("calendar_today", "text-[18px] text-secondary")}
              <span className="whitespace-nowrap font-label-prominent text-label-prominent text-text-primary">
                {rentangPendek}
              </span>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-alt hover:text-text-primary"
              title="Minggu Berikutnya"
              aria-label="Minggu Berikutnya"
            >
              {ms("chevron_right", "text-[18px]")}
            </button>
          </div>

          <div className="inline-flex rounded-full bg-surface-alt p-1">
            <Link
              href="/planner"
              className="rounded-full px-3.5 py-1.5 font-label-prominent text-label-prominent text-text-secondary transition-all hover:text-text-primary"
            >
              Harian
            </Link>
            <button
              type="button"
              aria-current="page"
              className="rounded-full bg-primary px-3.5 py-1.5 font-label-prominent text-label-prominent text-white shadow-sm"
            >
              Mingguan
            </button>
          </div>

          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-xl bg-surface px-4 font-label-prominent text-label-prominent text-text-primary shadow-sm transition-all hover:bg-surface-alt"
          >
            {ms("receipt_long", "text-[20px] text-text-secondary")}
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={acakUlang}
            className="flex h-10 items-center gap-2 rounded-xl bg-secondary px-5 font-label-prominent text-label-prominent text-white shadow-md transition-all hover:bg-primary"
          >
            {ms("auto_awesome", "ms-fill text-[20px]")}
            <span>Buat Rencana Otomatis AI</span>
          </button>
        </div>
      </section>

      {/* 4 KPI */}
      <section className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col justify-between rounded-[20px] bg-surface p-5 shadow-sm">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-caption text-caption font-semibold uppercase tracking-wider text-text-secondary">
                Total Anggaran Minggu Ini
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                {ms("account_balance_wallet", "text-[18px]")}
              </span>
            </div>
            <div className="mb-1 flex flex-wrap items-baseline gap-2">
              <span className="text-[22px] font-bold leading-[30px] tracking-[-0.01em] text-text-primary">
                {rupiah(totalBiaya)}
              </span>
              <span className="font-caption text-caption text-text-secondary">
                / Pagu {rupiah(pagu)}
              </span>
            </div>
            <div className="my-3 h-2 w-full overflow-hidden rounded-full bg-track-chart">
              <div
                className="h-full rounded-full bg-secondary"
                style={{ width: `${pctPagu}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            {sisaPagu >= 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 font-micro text-micro font-bold text-success-accessible">
                {ms("trending_down", "text-[14px]")} Hemat {rupiah(sisaPagu)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 font-micro text-micro font-bold text-[#A3242A]">
                {ms("trending_up", "text-[14px]")} Lebih {rupiah(-sisaPagu)}
              </span>
            )}
            <span className="font-micro text-micro text-text-secondary">
              {pctPagu}% Terpakai
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[20px] bg-surface p-5 shadow-sm">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-caption text-caption font-semibold uppercase tracking-wider text-text-secondary">
                Target Rata-rata Nutrisi
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success-accessible">
                {ms("vital_signs", "text-[18px]")}
              </span>
            </div>
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-[22px] font-bold leading-[30px] tracking-[-0.01em] text-text-primary">
                {angka(rataKalori)}
              </span>
              <span className="font-caption text-caption text-text-secondary">
                kkal / hari
              </span>
            </div>
            <div className="my-2.5 flex items-center gap-3">
              <div className="flex-1 rounded-xl bg-surface-alt p-2">
                <div className="font-micro text-micro font-medium text-text-secondary">
                  Protein
                </div>
                <div className="font-label-prominent text-label-prominent font-bold text-text-primary">
                  {rataProtein}g{" "}
                  <span className="font-micro text-micro font-medium text-success-accessible">
                    ({pProtein}%)
                  </span>
                </div>
              </div>
              <div className="flex-1 rounded-xl bg-surface-alt p-2">
                <div className="font-micro text-micro font-medium text-text-secondary">
                  Serat
                </div>
                <div className="font-label-prominent text-label-prominent font-bold text-text-primary">
                  {rataSerat}g{" "}
                  <span className="font-micro text-micro font-medium text-secondary">
                    ({pSerat}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-micro text-micro font-semibold ${gizi ? "bg-success-soft text-success-accessible" : "bg-warning-soft text-[#8A5A00]"}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${gizi ? "bg-success" : "bg-warning"}`}
              />
              Status Gizi: {gizi ? "Optimal Seimbang" : "Perlu Disesuaikan"}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[20px] bg-surface p-5 shadow-sm">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-caption text-caption font-semibold uppercase tracking-wider text-text-secondary">
                Kelengkapan Menu
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-[#8A5A00]">
                {ms("checklist_rtl", "text-[18px]")}
              </span>
            </div>
            <div className="mb-1 flex flex-wrap items-baseline gap-2">
              <span className="text-[22px] font-bold leading-[30px] tracking-[-0.01em] text-text-primary">
                {terisi} / {totalSlot}
              </span>
              <span className="font-caption text-caption text-text-secondary">
                Slot Terisi ({Math.round((terisi / totalSlot) * 100)}%)
              </span>
            </div>
            <p className="my-2.5 font-caption text-caption text-text-secondary">
              {kosong.length === 0
                ? "Semua slot makan minggu ini sudah terisi menunya."
                : `${kosong.length} slot makan belum diatur menunya.`}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              disabled={kosong.length === 0}
              onClick={() => kosong[0] && setModal(kosong[0])}
              className="group flex items-center gap-1 font-label-prominent text-label-prominent font-semibold text-secondary hover:text-primary disabled:opacity-40"
            >
              <span>Isi Slot Kosong</span>
              {ms(
                "arrow_forward",
                "text-[16px] transition-transform group-hover:translate-x-0.5",
              )}
            </button>
            <span className="rounded-full bg-warning-soft px-2 py-0.5 font-micro text-micro font-bold text-[#8A5A00]">
              {kosong.length} Slot Sisa
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[20px] bg-surface p-5 shadow-sm">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-caption text-caption font-semibold uppercase tracking-wider text-text-secondary">
                Efisiensi Stok &amp; Pasar
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                {ms("inventory_2", "text-[18px]")}
              </span>
            </div>
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-[22px] font-bold leading-[30px] tracking-[-0.01em] text-text-primary">
                {dariStok.length} Bahan
              </span>
              <span className="font-caption text-caption text-text-secondary">
                dari Stok Kos
              </span>
            </div>
            <p className="my-2.5 font-caption text-caption text-text-secondary">
              Hanya perlu beli {perluBeli.length} bahan di pasar (Est.{" "}
              {rupiah(biayaBeli)}).
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="flex items-center gap-1 font-micro text-micro font-semibold text-secondary">
              {ms("sync", "text-[14px]")} Sinkron dengan Kulkas
            </span>
            <span className="rounded-full bg-pill-active-bg px-2 py-0.5 font-micro text-micro font-bold text-primary">
              {pctStok}% Stok Kos
            </span>
          </div>
        </div>
      </section>

      {/* Matriks */}
      <section className="mb-7 overflow-hidden rounded-[20px] bg-surface p-5 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-secondary" />
            <h2 className="font-h3 text-h3 text-text-primary">
              Matriks Menu Mingguan
            </h2>
            <span className="rounded-full bg-surface-alt px-2.5 py-0.5 font-caption text-caption text-text-secondary">
              Semua Waktu Makan
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden font-caption text-caption text-text-secondary md:inline">
              Mode Tinjau:
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 font-micro text-micro font-bold text-primary">
              {ms("tune", "text-[14px]")} Filter Anggaran &amp; Kalori
            </span>
          </div>
        </div>

        {/* Tabel (tablet ke atas) */}
        <div className="hidden overflow-x-auto pb-2 md:block">
          <table className="w-full min-w-[1080px] table-fixed border-collapse">
            <thead>
              <tr>
                <th className="w-28 bg-surface px-2 py-3 text-left font-caption text-caption font-bold uppercase tracking-wider text-text-secondary">
                  Waktu Makan
                </th>
                {HARI.map((h, i) => (
                  <th
                    key={h}
                    className={`px-3 py-3 text-left ${i === idxHariIni ? "rounded-t-xl bg-primary-soft/60" : AKHIR_PEKAN.includes(i) ? "rounded-t-xl bg-surface-alt/40" : ""}`}
                  >
                    {i === idxHariIni ? (
                      <div className="flex items-center justify-between gap-1">
                        <div>
                          <span className="block font-label-prominent text-label-prominent font-bold text-primary">
                            {h}
                          </span>
                          <span className="font-caption text-caption text-text-secondary">
                            {tanggal[i].getDate()} {BLN[tanggal[i].getMonth()]}
                          </span>
                        </div>
                        <span className="rounded-full bg-primary px-2 py-0.5 font-micro text-micro font-bold text-white">
                          Hari Ini
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="block font-label-prominent text-label-prominent font-bold text-text-primary">
                          {h}
                        </span>
                        <span className="font-caption text-caption text-text-secondary">
                          {tanggal[i].getDate()} {BLN[tanggal[i].getMonth()]}
                          {AKHIR_PEKAN.includes(i) ? " (Akhir Pekan)" : ""}
                        </span>
                      </>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {SLOTS.map((s) => (
                <tr key={s} className="align-top">
                  <td className="bg-surface px-2 py-4">
                    <div
                      className={`mb-1 flex items-center gap-1.5 ${SLOT_META[s].warna}`}
                    >
                      {ms(SLOT_META[s].ikon, "text-[18px]")}
                      <span className="font-label-prominent text-label-prominent font-bold uppercase text-text-primary">
                        {SLOT_LABEL[s]}
                      </span>
                    </div>
                    <span className="block font-micro text-micro text-text-secondary">
                      {SLOT_META[s].jam}
                    </span>
                  </td>
                  {HARI.map((h, i) => (
                    <td key={h} className={`p-2 ${warnaKolom(i)}`}>
                      {Sel(i, s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface-alt/90 font-medium">
                <td className="rounded-bl-xl px-2 py-3">
                  <span className="block font-label-prominent text-label-prominent font-bold text-text-primary">
                    TOTAL HARI
                  </span>
                  <span className="font-micro text-micro uppercase text-text-secondary">
                    Biaya &amp; Energi
                  </span>
                </td>
                {hariData.map((d, i) => (
                  <td
                    key={i}
                    className={`p-3 ${i === idxHariIni ? "bg-primary-soft/40" : AKHIR_PEKAN.includes(i) ? "bg-surface-alt/60" : ""} ${i === 6 ? "rounded-br-xl" : ""}`}
                  >
                    <div
                      className={`font-label-prominent text-label-prominent font-bold ${i === idxHariIni ? "text-primary" : "text-text-primary"}`}
                    >
                      {rupiah(d.biaya)}
                    </div>
                    <div
                      className={`font-micro text-micro font-semibold ${d.terisi < SLOTS.length ? "text-[#8A5A00]" : "text-text-secondary"}`}
                    >
                      {angka(d.kalori)} kkal
                      {d.terisi < SLOTS.length ? " (Belum fix)" : ""}
                    </div>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Kartu per hari (mobile) */}
        <div className="flex flex-col gap-3 md:hidden">
          {HARI.map((h, i) => {
            const d = hariData[i];
            return (
              <div
                key={h}
                className={`rounded-2xl p-3 ${i === idxHariIni ? "bg-primary-soft/50" : AKHIR_PEKAN.includes(i) ? "bg-surface-alt/60" : "bg-surface-alt/40"}`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-label-prominent text-label-prominent font-bold ${i === idxHariIni ? "text-primary" : "text-text-primary"}`}
                    >
                      {h}
                    </span>
                    <span className="font-caption text-caption text-text-secondary">
                      {tanggal[i].getDate()} {BLN[tanggal[i].getMonth()]}
                    </span>
                    {i === idxHariIni && (
                      <span className="rounded-full bg-primary px-2 py-0.5 font-micro text-micro font-bold text-white">
                        Hari Ini
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-label-prominent text-label-prominent font-bold text-text-primary">
                      {rupiah(d.biaya)}
                    </div>
                    <div
                      className={`font-micro text-micro font-semibold ${d.terisi < SLOTS.length ? "text-[#8A5A00]" : "text-text-secondary"}`}
                    >
                      {angka(d.kalori)} kkal
                      {d.terisi < SLOTS.length ? " (Belum fix)" : ""}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {SLOTS.map((s) => (
                    <Fragment key={s}>
                      <div
                        className={`flex items-center gap-1.5 font-micro text-micro uppercase ${SLOT_META[s].warna}`}
                      >
                        {ms(SLOT_META[s].ikon, "text-[16px]")}
                        <span className="font-bold text-text-primary">
                          {SLOT_LABEL[s]}
                        </span>
                        <span className="text-text-secondary">
                          {SLOT_META[s].jam}
                        </span>
                      </div>
                      {Sel(i, s)}
                    </Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Insight + sinkron belanja */}
      <section className="mb-7 rounded-[20px] bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-col items-stretch justify-between gap-6 lg:flex-row">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pill-active-bg text-secondary">
                {ms("psychology", "ms-fill text-[20px]")}
              </span>
              <div>
                <h3 className="font-h3 text-h3 text-text-primary">
                  NutriBot Smart Recommendations
                </h3>
                <span className="font-caption text-caption text-text-secondary">
                  Optimasi stok dapur kost &amp; teknik belanja hemat pekan ini
                </span>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 rounded-xl bg-surface-alt/80 p-3 transition-colors hover:bg-surface-alt">
                {ms("tips_and_updates", "mt-0.5 text-[20px] text-secondary")}
                <p className="font-body-default text-body-default font-semibold text-text-primary">
                  Bahan Andalan:{" "}
                  <span className="font-normal text-text-secondary">
                    {bahanTop
                      ? `${bahanTop[0]} dipakai di ${bahanTop[1]} menu pekan ini, beli sekaligus agar lebih hemat dibanding eceran harian.`
                      : "Belum ada menu yang terjadwal pekan ini."}
                  </span>
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-surface-alt/80 p-3 transition-colors hover:bg-surface-alt">
                {ms("savings", "mt-0.5 text-[20px] text-success-accessible")}
                <p className="font-body-default text-body-default font-semibold text-text-primary">
                  Belanja Sekali Jalan:{" "}
                  <span className="font-normal text-text-secondary">
                    Hanya {perluBeli.length} bahan yang perlu dibeli (±{" "}
                    {rupiah(biayaBeli)}), sedangkan {dariStok.length} bahan
                    sudah ada di stok kos.
                  </span>
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-surface-alt/80 p-3 transition-colors hover:bg-surface-alt">
                {ms("spa", "mt-0.5 text-[20px] text-primary")}
                <p className="font-body-default text-body-default font-semibold text-text-primary">
                  Serat {pSerat}% dari Target:{" "}
                  <span className="font-normal text-text-secondary">
                    Rata-rata serat {rataSerat}g per hari dari target {t.serat}g
                    untuk anak kost.
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col justify-between rounded-2xl bg-gradient-to-br from-primary to-primary-container p-5 text-white shadow-md lg:w-96">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-white/20 px-2.5 py-1 font-micro text-micro font-bold uppercase tracking-wider text-white">
                  Shopping Auto-Sync
                </span>
                {ms("shopping_cart_checkout", "text-[24px] text-white/80")}
              </div>
              <h4 className="mb-2 font-h3 text-h3 text-white">
                Siap Belanja untuk 7 Hari?
              </h4>
              <p className="mb-4 font-body-default text-body-default leading-relaxed text-white/85">
                NutriBot telah menghitung semua takaran bahan dari{" "}
                {semuaId.length} menu di atas dan mencocokkannya dengan stok
                kulkas Anda.
              </p>
              <div className="mb-4 flex items-center justify-between gap-2 rounded-xl bg-black/20 p-3">
                <div className="flex flex-col">
                  <span className="font-caption text-caption text-white/70">
                    Estimasi Belanja Bersih
                  </span>
                  <span className="font-h3 text-h3 font-bold text-white">
                    {rupiah(biayaBeli)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block font-caption text-caption text-white/70">
                    Bahan Dibutuhkan
                  </span>
                  <span className="font-h3 text-h3 font-bold text-white">
                    {perluBeli.length} Item Pasar
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={generateBelanja}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface font-label-prominent text-label-prominent font-bold text-primary shadow-lg transition-all hover:bg-surface-soft"
            >
              <span>Generate Daftar Belanja ({belanja.length} Item)</span>
              {ms(
                "arrow_forward",
                "text-[18px] transition-transform group-hover:translate-x-1",
              )}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle/50 pt-4 font-caption text-caption text-text-secondary">
          <span className="flex items-start gap-1.5">
            {ms("info", "text-[16px] text-text-disabled")}
            <span>
              Estimasi harga berbasis rata-rata pasar tradisional &amp; warteg
              lingkar kampus.
            </span>
          </span>
          <span className="font-micro text-micro text-text-disabled">
            Terakhir diperbarui otomatis: Hari ini,{" "}
            {diperbarui ? jam2(diperbarui) : "--.--"} WIB
          </span>
        </div>
      </section>

      {/* Modal tambah menu ke slot kosong */}
      {modal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-text-primary/50 backdrop-blur-[2px]"
            onClick={() => setModal(null)}
          />
          <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[20px] bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-container">
                  {ms("add", "text-[20px]")}
                </div>
                <div>
                  <h3 className="font-h4 text-h4 text-text-primary">
                    Tambah Menu {SLOT_LABEL[modal.slot]}
                  </h3>
                  <p className="font-caption text-caption text-text-secondary">
                    {HARI[modal.hari]}, {tanggal[modal.hari].getDate()}{" "}
                    {BLN[tanggal[modal.hari].getMonth()]}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                aria-label="Tutup"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-alt"
              >
                {ms("close", "text-[20px]")}
              </button>
            </div>
            <div className="mt-4 max-h-96 space-y-2.5 overflow-y-auto pr-1">
              {kandidat.length === 0 && (
                <p className="py-6 text-center font-body-default text-body-default text-text-secondary">
                  Tidak ada resep lain untuk waktu makan ini.
                </p>
              )}
              {kandidat.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle p-3 transition-all hover:border-border-hover hover:bg-surface-soft"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-3xl">{r.emoji}</span>
                    <div className="min-w-0">
                      <div className="truncate font-label-prominent text-label-prominent text-text-primary">
                        {r.nama}
                      </div>
                      <div className="font-caption text-caption text-text-secondary">
                        {rupiah(r.harga)} • {r.protein}g protein • {r.kalori}{" "}
                        kkal
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => tambahKeHari(r.id)}
                    className="btn btn-primary shrink-0 !px-3 !py-2 text-xs"
                  >
                    {ms("add", "text-[16px]")} Tambahkan
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
