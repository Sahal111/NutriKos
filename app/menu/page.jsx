"use client";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Sparkles,
  Plus,
  Trash2,
  X,
  Check,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import MenuCard from "@/components/MenuCard";
import { allowedRecipes, nutrisiDari } from "@/lib/recommend";
import { mintaAI } from "@/lib/ai";
import { getRecipe, rupiah, SLOT_LABEL, ALAT_OPTIONS } from "@/lib/data";

const ALAT_ICON = {
  "Rice Cooker": "soup_kitchen",
  Kompor: "mode_heat",
  Microwave: "microwave",
  "Air Fryer": "air_freshener",
  "Panci / Wajan Listrik": "skillet",
};

const FILTERS = [
  "Semua",
  "Rice Cooker",
  "Kompor",
  "< Rp10.000",
  "Tinggi Protein",
  "Cepat (< 15 mnt)",
];

export default function MenuPage() {
  const router = useRouter();
  const {
    profile,
    setProfile,
    plan,
    setPlan,
    generatePlan,
    updateRecipeInPlan,
    removeRecipeFromPlan,
    addRecipeToPlan,
    setRecipePortion,
    customPlanDetails,
    logToday,
    catatRiwayat,
    ai,
    setAi,
    triggerAiModal,
    setTriggerAiModal,
    ready,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("Semua");
  const [toast, setToast] = useState("");
  // Kontrol template yang belum punya logika: hanya tampilan.
  const [budgetPorsi, setBudgetPorsi] = useState("12.000");
  const [waktuMakan, setWaktuMakan] = useState("M. Siang");
  const [prefUI, setPrefUI] = useState({});
  const [tambahStokOpen, setTambahStokOpen] = useState(false);
  const [stokBaru, setStokBaru] = useState("");

  // Modal States
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [modalTambahOpen, setModalTambahOpen] = useState(false);
  const [modalHapusOpen, setModalHapusOpen] = useState(false);
  const [modalAIOpen, setModalAIOpen] = useState(false);
  const [resepAktif, setResepAktif] = useState(null);

  // Auto trigger AI modal if redirected from Beranda
  useEffect(() => {
    if (triggerAiModal) {
      setModalAIOpen(true);
      setTriggerAiModal?.(false);
    }
  }, [triggerAiModal, setTriggerAiModal]);

  // Form edit menu
  const [resepPenggantiId, setResepPenggantiId] = useState("");
  const [porsiDipilih, setPorsiDipilih] = useState(1);
  const [filterModal, setFilterModal] = useState("Semua");

  const showToast = (pesan) => {
    setToast(pesan);
    setTimeout(() => setToast(""), 3000);
  };

  const semua = useMemo(() => allowedRecipes(profile), [profile]);

  if (!ready) return null;

  // Filter resep
  const cocokFilter = (r, f) => {
    if (f === "Rice Cooker" || f === "Kompor") return r.alat.includes(f);
    if (f === "< Rp10.000") return r.harga < 10000;
    if (f === "Tinggi Protein") return r.protein >= 18;
    if (f === "Cepat (< 15 mnt)") return r.waktu < 15;
    return true;
  };

  // Kalkulasi total biaya & nutrisi dengan porsi
  const nutrisiHarian = nutrisiDari(plan, customPlanDetails);
  const total = nutrisiHarian.biaya;
  const hemat = Math.max(0, Math.round((1 - total / profile.budget) * 100));

  // Pilihan resep lain untuk filter di halaman
  const pilihan = semua.filter(
    (r) => cocokFilter(r, filter) && !plan.includes(r.id),
  );

  // AI Recommendation
  const tanyaAI = async () => {
    setLoading(true);
    const hasil = await mintaAI("menu", profile);
    if (hasil && hasil.ids?.length) {
      setPlan(hasil.ids);
      catatRiwayat(hasil.ids);
      setAi({ alasan: hasil.alasan, sumber: hasil.sumber });
      setModalAIOpen(true);
      showToast("✨ Rekomendasi AI berhasil dibuat!");
    } else {
      generatePlan();
      setAi({
        alasan:
          "Paket menu seimbang ini disusun pas dengan target bujetmu, ketersediaan alat kos, dan pantangan makanmu agar nutrisi harian optimal.",
        sumber: "aturan",
      });
      setModalAIOpen(true);
      showToast("✨ Rekomendasi cerdas berhasil dibuat!");
    }
    setLoading(false);
  };

  const terapkan = () => {
    logToday();
    router.push("/gizi");
  };

  // Handler Buka Modal Edit
  const bukaModalEdit = (recipe) => {
    setResepAktif(recipe);
    setResepPenggantiId(recipe.id);
    const porsiSaatIni = customPlanDetails[recipe.id]?.porsi || 1;
    setPorsiDipilih(porsiSaatIni);
    setFilterModal("Semua");
    setModalEditOpen(true);
  };

  // Simpan Perubahan Edit Menu
  const simpanEditMenu = () => {
    if (!resepAktif) return;

    // Jika ganti resep
    if (resepPenggantiId && resepPenggantiId !== resepAktif.id) {
      updateRecipeInPlan(resepAktif.id, resepPenggantiId);
      setRecipePortion(resepPenggantiId, porsiDipilih);
      const namaPengganti = getRecipe(resepPenggantiId)?.nama || "Menu Baru";
      showToast(`✓ Menu diganti menjadi "${namaPengganti}"!`);
    } else {
      // Hanya ubah porsi
      setRecipePortion(resepAktif.id, porsiDipilih);
      showToast(`✓ Porsi "${resepAktif.nama}" diatur ke ${porsiDipilih}x!`);
    }

    setModalEditOpen(false);
    setResepAktif(null);
  };

  // Handler Buka Modal Hapus
  const bukaModalHapus = (recipe) => {
    setResepAktif(recipe);
    setModalHapusOpen(true);
  };

  const konfirmasiHapusMenu = () => {
    if (!resepAktif) return;
    removeRecipeFromPlan(resepAktif.id);
    setModalHapusOpen(false);
    showToast(`Menu "${resepAktif.nama}" dihapus dari jadwal makan.`);
    setResepAktif(null);
  };

  // Handler Tambah Menu Baru
  const tambahMenuLangsung = (resepId) => {
    addRecipeToPlan(resepId);
    setModalTambahOpen(false);
    const namaResep = getRecipe(resepId)?.nama;
    showToast(`✓ "${namaResep}" ditambahkan ke jadwal harian!`);
  };

  // Daftar kandidat resep untuk modal edit (diutamakan slot sama atau semua yang cocok)
  const kandidatResep = !resepAktif
    ? semua
    : semua.filter((r) => cocokFilter(r, filterModal));

  const sisaBujet = profile.budget - total;
  const resepPlan = plan.map((id) => getRecipe(id)).filter(Boolean);

  // Gaya chip persis template
  const chipOn =
    "bg-primary-soft text-primary-container font-semibold shadow-xs";
  const chipOff =
    "bg-surface-soft hover:bg-surface text-text-secondary transition-colors";

  // Chip yang terhubung ke filter yang sudah ada (klik lagi = batal)
  const pakaiFilter = (nama) => setFilter(filter === nama ? "Semua" : nama);
  // Chip template yang belum punya logika: hanya tampilan (aktif/nonaktif)
  const togglePref = (k) => setPrefUI((s) => ({ ...s, [k]: !s[k] }));
  const resetForm = () => {
    setFilter("Semua");
    setPrefUI({});
    setBudgetPorsi("12.000");
    setWaktuMakan("M. Siang");
  };

  const submitStok = (e) => {
    e.preventDefault();
    const v = stokBaru.trim();
    if (!v) return;
    if (
      !(profile.stok || []).some((x) => x.toLowerCase() === v.toLowerCase())
    ) {
      setProfile({ stok: [...(profile.stok || []), v] });
    }
    setStokBaru("");
    setTambahStokOpen(false);
  };

  return (
    <div className="flex w-full flex-col pb-24 lg:pb-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-xl bg-text-primary px-4 py-3 text-sm font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 size={18} className="text-success" />
          <span>{toast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-h1 text-h1 tracking-tight text-text-primary">
              Rekomendasi Menu AI
            </h1>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-primary-container shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-rail-blue">
                auto_awesome
              </span>
              <span className="font-micro text-micro font-semibold tracking-normal">
                NutriKos AI v2.4 • Model Khusus Kost
              </span>
            </div>
          </div>
          <p className="mt-1 font-body-default text-body-default text-text-secondary">
            Dapatkan saran menu bergizi dan hemat sesuai anggaran, alat masak,
            dan stok bahan kost kamu.
          </p>
        </div>

        {/* Quick Stats Capsule */}
        <div className="flex items-center gap-3 self-start rounded-full bg-surface px-4 py-2 shadow-sm lg:self-auto">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${sisaBujet >= 0 ? "bg-success" : "bg-danger"}`}
            />
            <span className="font-caption text-caption text-text-secondary">
              Sisa Porsi Anggaran Hari Ini:
            </span>
            <span className="font-label-prominent text-label-prominent text-text-primary">
              {rupiah(Math.max(0, sisaBujet))}
            </span>
          </div>
          <span className="text-text-disabled">•</span>
          <div className="flex items-center gap-1.5 text-rail-blue">
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span className="font-micro text-micro font-bold uppercase tracking-wider">
              Mode Cerdas Aktif
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[350px_minmax(0,1fr)]">
        {/* LEFT INPUT PANEL */}
        <aside className="flex flex-col gap-5 rounded-[20px] bg-surface p-6 shadow-sm lg:sticky lg:top-20">
          {/* Panel Header */}
          <div className="flex items-start justify-between pb-3">
            <div>
              <h2 className="font-h4 text-h4 text-text-primary">
                Kriteria &amp; Kebutuhan Kamu
              </h2>
              <p className="mt-0.5 font-caption text-caption text-text-secondary">
                Sesuaikan parameter untuk hasil optimal
              </p>
            </div>
            <button
              type="button"
              title="Reset Formulir"
              onClick={resetForm}
              className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-surface-soft hover:text-rail-blue"
            >
              <span className="material-symbols-outlined text-[18px]">
                restart_alt
              </span>
            </button>
          </div>

          {/* Form Field 1: Anggaran Makan */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center justify-between font-label-prominent text-label-prominent text-text-primary">
              <span>Anggaran Makan (Per Porsi)</span>
              <span className="rounded-full bg-primary-soft px-2 py-0.5 font-micro text-micro text-rail-blue">
                Hemat
              </span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 font-label-prominent text-label-prominent text-text-secondary">
                Rp
              </span>
              <input
                type="text"
                value={budgetPorsi}
                onChange={(e) => setBudgetPorsi(e.target.value)}
                className="h-11 w-full rounded-xl bg-surface-soft pl-11 pr-4 font-h4 text-h4 text-text-primary shadow-inner transition-all focus:bg-surface focus:outline-none focus:ring-2 focus:ring-rail-blue/40"
              />
              <span className="absolute right-3 font-caption text-caption text-text-secondary">
                / porsi
              </span>
            </div>
            {/* Quick Budget Chips */}
            <div className="mt-1 grid grid-cols-4 gap-1.5">
              {["8.000", "12.000", "15.000", "20.000"].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setBudgetPorsi(n)}
                  className={`rounded-lg px-1.5 py-1 text-center font-micro text-micro transition-colors ${
                    budgetPorsi === n
                      ? "bg-primary-container font-bold text-on-primary shadow-sm"
                      : "bg-surface-soft text-text-secondary hover:bg-pill-active-bg hover:text-primary-container"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Form Field 2: Waktu Makan */}
          <div className="flex flex-col gap-2">
            <label className="font-label-prominent text-label-prominent text-text-primary">
              Waktu Makan
            </label>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-soft p-1">
              {["Sarapan", "M. Siang", "M. Malam"].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWaktuMakan(w)}
                  className={`rounded-lg py-2 text-center transition-all ${
                    waktuMakan === w
                      ? "bg-rail-blue font-label-prominent text-label-prominent text-white shadow-sm"
                      : "font-caption text-caption text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Form Field 3: Target Kalori */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-label-prominent text-label-prominent text-text-primary">
                Target Kalori
              </label>
              <span className="rounded-md bg-primary-soft px-2.5 py-0.5 font-label-prominent text-label-prominent text-primary-container">
                500 - 650 kkal
              </span>
            </div>
            <div className="relative py-2">
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-track-chart">
                <div className="w-[30%] bg-transparent" />
                <div className="w-[45%] rounded-full bg-rail-blue" />
                <div className="w-[25%] bg-transparent" />
              </div>
              <div className="mt-1.5 flex justify-between font-micro text-micro text-text-disabled">
                <span>300 kkal</span>
                <span className="font-semibold text-text-secondary">
                  Optimal Siang
                </span>
                <span>900 kkal</span>
              </div>
            </div>
          </div>

          {/* Form Field 4: Preferensi Khusus */}
          <div className="flex flex-col gap-2">
            <label className="font-label-prominent text-label-prominent text-text-primary">
              Preferensi Nutrisi &amp; Rasa
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                aria-pressed={filter === "Tinggi Protein"}
                onClick={() => pakaiFilter("Tinggi Protein")}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 font-micro text-micro ${filter === "Tinggi Protein" ? chipOn : chipOff}`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  fitness_center
                </span>{" "}
                Tinggi Protein
              </button>
              <button
                type="button"
                aria-pressed={filter === "< Rp10.000"}
                onClick={() => pakaiFilter("< Rp10.000")}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 font-micro text-micro ${filter === "< Rp10.000" ? chipOn : chipOff}`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  savings
                </span>{" "}
                Hemat Budget
              </button>
              {[
                ["santan", "Tanpa Santan"],
                ["lemak", "Rendah Lemak"],
                ["pedas", "Pedas Sedang"],
              ].map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={!!prefUI[k]}
                  onClick={() => togglePref(k)}
                  className={`rounded-full px-3 py-1.5 font-micro text-micro ${prefUI[k] ? chipOn : chipOff}`}
                >
                  {label}
                </button>
              ))}
              {/* Filter lama yang tidak ada di template, dipertahankan agar fiturnya tidak hilang */}
              <button
                type="button"
                aria-pressed={filter === "Cepat (< 15 mnt)"}
                onClick={() => pakaiFilter("Cepat (< 15 mnt)")}
                className={`rounded-full px-3 py-1.5 font-micro text-micro ${filter === "Cepat (< 15 mnt)" ? chipOn : chipOff}`}
              >
                Cepat (&lt; 15 mnt)
              </button>
            </div>
          </div>

          {/* Form Field 5: Fasilitas & Alat Masak */}
          <div className="flex flex-col gap-2">
            <label className="font-label-prominent text-label-prominent text-text-primary">
              Fasilitas Alat di Kost
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                aria-pressed={filter === "Rice Cooker"}
                onClick={() => pakaiFilter("Rice Cooker")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-caption text-caption ${filter === "Rice Cooker" ? chipOn : chipOff}`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  soup_kitchen
                </span>{" "}
                Rice Cooker
              </button>
              <button
                type="button"
                aria-pressed={filter === "Kompor"}
                onClick={() => pakaiFilter("Kompor")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-caption text-caption ${filter === "Kompor" ? chipOn : chipOff}`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  mode_heat
                </span>{" "}
                Kompor 1 Tungku
              </button>
              {[
                ["fryer", "air_freshener", "Air Fryer"],
                ["warteg", "storefront", "Warteg / Tanpa Masak"],
              ].map(([k, ic, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={!!prefUI[k]}
                  onClick={() => togglePref(k)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-caption text-caption ${prefUI[k] ? chipOn : chipOff}`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {ic}
                  </span>{" "}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Field 6: Bahan Tersedia di Kost */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-label-prominent text-label-prominent text-text-primary">
                Stok Bahan di Kost Kamu
              </label>
              <span className="font-micro text-micro font-semibold text-success-accessible">
                {(profile.stok || []).length} Terdeteksi
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 rounded-xl bg-surface-soft p-2">
              {(profile.stok || []).map((x) => (
                <span
                  key={x}
                  className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 font-caption text-caption text-text-primary shadow-xs"
                >
                  {x}
                  <button
                    type="button"
                    aria-label={`Hapus ${x}`}
                    onClick={() =>
                      setProfile({ stok: profile.stok.filter((y) => y !== x) })
                    }
                    className="flex text-text-disabled transition-colors hover:text-danger"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      close
                    </span>
                  </button>
                </span>
              ))}
              {tambahStokOpen ? (
                <form onSubmit={submitStok} className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={stokBaru}
                    onChange={(e) => setStokBaru(e.target.value)}
                    onBlur={() => !stokBaru.trim() && setTambahStokOpen(false)}
                    placeholder="misal: Tahu"
                    className="h-7 w-28 rounded-lg bg-surface px-2 font-caption text-caption text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-rail-blue/40"
                  />
                  <button
                    type="submit"
                    aria-label="Simpan bahan"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-rail-blue text-white"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      check
                    </span>
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setTambahStokOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary-soft px-2.5 py-1 font-caption text-caption text-primary-container transition-colors hover:bg-pill-active-bg"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    add
                  </span>{" "}
                  Tambah Bahan
                </button>
              )}
            </div>
          </div>

          {/* Submit CTA */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={tanyaAI}
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rail-blue font-label-prominent text-label-prominent text-white shadow-sm transition-all hover:bg-primary-hover active:bg-primary disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[20px]">
                auto_awesome
              </span>
              {loading
                ? "Menyusun rekomendasi..."
                : "Rekomendasikan Menu Sekarang"}
            </button>
            <span className="text-center font-micro text-micro text-text-secondary">
              ✨ Ditenagai NutriKos AI Engine • Estimasi gizi 95% akurat
            </span>
          </div>
        </aside>

        {/* RIGHT RESULTS AREA */}
        <section className="flex min-w-0 flex-col gap-6">
          {/* Top Summary & Control Bar */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl bg-surface p-4 shadow-sm md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success-accessible">
                <span className="material-symbols-outlined text-[22px]">
                  fact_check
                </span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-h4 text-h4 text-text-primary">
                    Ditemukan {plan.length} Rekomendasi Menu
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-micro text-micro font-bold ${
                      total <= profile.budget
                        ? "bg-success-soft text-success-accessible"
                        : "bg-danger-soft text-danger"
                    }`}
                  >
                    {total <= profile.budget ? "Optimal" : "Melebihi Bujet"}
                  </span>
                </div>
                <p className="mt-0.5 font-caption text-caption text-text-secondary">
                  Filter:{" "}
                  <span className="font-semibold text-text-primary">
                    Anggaran ≤ {rupiah(profile.budget)}
                  </span>{" "}
                  • Alat:{" "}
                  <span className="font-semibold text-text-primary">
                    {(profile.alat || []).length
                      ? profile.alat.join(" / ")
                      : "-"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Sort Dropdown Trigger (tampilan template) */}
              <div className="relative">
                <button
                  type="button"
                  className="flex h-9 items-center gap-2 rounded-xl bg-surface-soft px-3 font-caption text-caption font-semibold text-text-primary transition-colors hover:bg-pill-active-bg"
                >
                  <span className="text-text-secondary">Urutkan:</span>
                  <span>Paling Hemat &amp; Bernutrisi</span>
                  <span className="material-symbols-outlined text-[16px] text-text-secondary">
                    expand_more
                  </span>
                </button>
              </div>
              {/* Tambah Menu (fitur yang sudah ada) */}
              <button
                type="button"
                onClick={() => setModalTambahOpen(true)}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-surface-soft px-3 font-caption text-caption font-semibold text-text-primary transition-colors hover:bg-pill-active-bg"
              >
                <span className="material-symbols-outlined text-[16px] text-text-secondary">
                  add
                </span>
                <span>Tambah Menu</span>
              </button>
              {/* Shuffle Button */}
              <button
                type="button"
                title="Acak Rekomendasi Baru"
                onClick={() => {
                  generatePlan();
                  setAi(null);
                  showToast("✓ Menu berhasil diacak ulang!");
                }}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-primary-soft px-3 font-caption text-caption font-semibold text-primary-container transition-colors hover:bg-pill-active-bg"
              >
                <span className="material-symbols-outlined text-[16px]">
                  autorenew
                </span>
                <span>Acak Ulang</span>
              </button>
            </div>
          </div>

          {/* AI Explanation Banner */}
          {ai && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-primary-soft p-3.5 text-sm">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-rail-blue">
                auto_awesome
              </span>
              <div className="font-caption text-caption text-text-secondary">
                <span
                  className={`mr-2 rounded-full px-2 py-0.5 font-micro text-micro font-bold ${
                    ai.sumber === "ai"
                      ? "bg-rail-blue text-white"
                      : "bg-pill-active-bg text-primary-container"
                  }`}
                >
                  {ai.sumber === "ai" ? "Saran AI" : "Mode Aturan"}
                </span>
                <span className="text-text-primary">{ai.alasan}</span>
              </div>
            </div>
          )}

          {/* Menu terpilih */}
          {plan.length === 0 ? (
            <div className="rounded-2xl bg-surface py-10 text-center shadow-sm">
              <p className="mb-3 font-body-default text-body-default text-text-secondary">
                Belum ada menu yang dipilih untuk jadwal hari ini.
              </p>
              <button
                type="button"
                onClick={generatePlan}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-rail-blue px-4 font-label-prominent text-label-prominent text-white shadow-sm transition-colors hover:bg-primary-hover"
              >
                <span className="material-symbols-outlined text-[18px]">
                  auto_awesome
                </span>
                Buat Rekomendasi Menu
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {resepPlan.map((r) => (
                <MenuCard
                  key={r.id}
                  recipe={r}
                  porsi={customPlanDetails[r.id]?.porsi || 1}
                  aksiLabel="Lihat Resep"
                  aksiIcon="menu_book"
                  onEdit={() => bukaModalEdit(r)}
                  onDelete={() => bukaModalHapus(r)}
                />
              ))}
            </div>
          )}

          {/* Pilihan menu lainnya */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="judul-seksi">Pilihan Menu Lainnya</h2>
              <p className="mt-1 font-caption text-caption text-text-secondary">
                Ganti menu harianmu langsung dengan opsi lain di bawah ini.
              </p>
            </div>
            {pilihan.length === 0 ? (
              <div className="rounded-2xl bg-surface p-4 font-body-default text-body-default text-text-secondary shadow-sm">
                Tidak ada menu lain untuk filter ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {pilihan.map((r) => (
                  <MenuCard
                    key={r.id}
                    recipe={r}
                    aksiLabel="Pilih Menu"
                    onAksi={() => {
                      addRecipeToPlan(r.id);
                      showToast(`✓ "${r.nama}" ditambahkan ke jadwal harian!`);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Disclaimer / Help banner */}
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-surface-soft p-4 text-text-secondary sm:flex-row">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-rail-blue">
                info
              </span>
              <span className="font-caption text-caption">
                Harga bahan makanan disesuaikan dengan rata-rata harga pasar
                tradisional &amp; warung kelontong sekitar area kampus di
                Indonesia.
              </span>
            </div>
            <a
              href="#"
              className="flex items-center gap-1 whitespace-nowrap font-label-prominent text-label-prominent text-rail-blue hover:underline"
            >
              Bandingkan Harga Pasar{" "}
              <span className="material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </a>
          </div>
        </section>
      </div>

      {/* Bilah aksi bawah */}
      {plan.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 p-3.5 shadow-[0_-4px_16px_rgba(27,33,80,0.08)] backdrop-blur lg:static lg:mt-7 lg:rounded-2xl lg:bg-surface lg:p-4 lg:shadow-sm">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft font-h4 text-h4 text-primary-container">
                {plan.length}
              </div>
              <div>
                <div className="font-caption text-caption text-text-secondary">
                  Estimasi Total Menu Terpilih
                </div>
                <div className="font-h3 text-h3 leading-tight text-primary-container">
                  {rupiah(total)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={terapkan}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rail-blue px-5 font-label-prominent text-label-prominent text-white shadow-sm transition-all hover:bg-primary-hover active:bg-primary sm:w-auto"
            >
              <span className="material-symbols-outlined text-[20px]">
                event_available
              </span>
              Terapkan ke Jadwal &amp; Lihat Gizi
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT REKOMENDASI MENU */}
      {modalEditOpen && resepAktif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setModalEditOpen(false)}
          />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-2xl">
                  {resepAktif.emoji}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800">
                    Edit Rekomendasi Menu
                  </h3>
                  <p className="text-xs text-slate-500">
                    Slot:{" "}
                    <b className="text-brand-dark">
                      {SLOT_LABEL[resepAktif.slot] || resepAktif.slot}
                    </b>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalEditOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-5">
              {/* Info Menu Saat Ini */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="text-xs font-bold uppercase text-slate-500">
                  Menu Saat Ini
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-extrabold text-base text-slate-800">
                    {resepAktif.nama}
                  </span>
                  <span className="font-extrabold text-accent">
                    {rupiah(resepAktif.harga)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span>⏱️ {resepAktif.waktu} menit</span>
                  <span>• 🥩 {resepAktif.protein}g protein</span>
                  <span>• 🔥 {resepAktif.kalori} kcal</span>
                </div>
              </div>

              {/* Atur Porsi */}
              <div>
                <label className="label">Ubah Jumlah / Porsi:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPorsiDipilih(p)}
                      className={`rounded-xl py-2.5 text-xs font-bold transition-colors ${
                        porsiDipilih === p
                          ? "bg-brand-dark text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {p} Porsi
                    </button>
                  ))}
                </div>
                <div className="mt-1.5 text-xs text-slate-500">
                  Estimasi biaya porsi ini:{" "}
                  <b>{rupiah(resepAktif.harga * porsiDipilih)}</b> (
                  {resepAktif.protein * porsiDipilih}g protein)
                </div>
              </div>

              {/* Ganti Menu Pengganti */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label !mb-0">Pilih Menu Pengganti:</label>
                  <span className="text-xs text-slate-500">
                    {kandidatResep.length} pilihan resep
                  </span>
                </div>

                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {kandidatResep.map((r) => {
                    const isSelected = resepPenggantiId === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setResepPenggantiId(r.id)}
                        className={`w-full flex items-center justify-between gap-3 rounded-xl border p-2.5 text-left transition-all ${
                          isSelected
                            ? "border-brand-dark bg-brand-light/40 ring-2 ring-brand-mint"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl">{r.emoji}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-800 truncate">
                              {r.nama}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {r.protein}g protein • {r.waktu} mnt
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-extrabold text-accent">
                            {rupiah(r.harga)}
                          </div>
                          {isSelected && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-dark">
                              <Check size={12} /> Terpilih
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rincian Bahan Menu yang Dipilih */}
              {(() => {
                const terpilih = getRecipe(resepPenggantiId) || resepAktif;
                return (
                  <div className="rounded-xl bg-slate-50 p-3 text-xs">
                    <div className="font-bold text-slate-700 mb-1">
                      Bahan untuk {terpilih.nama} ({porsiDipilih} porsi):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {terpilih.bahan.map((b) => (
                        <span
                          key={b.nama}
                          className="rounded-md bg-white border border-slate-200 px-2 py-1 text-slate-600"
                        >
                          {b.nama} ({b.qty})
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalEditOpen(false)}
                  className="btn btn-soft flex-1"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={simpanEditMenu}
                  className="btn btn-primary flex-1 shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH MENU KE JADWAL */}
      {modalTambahOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setModalTambahOpen(false)}
          />
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand-dark">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800">
                    Tambah Menu ke Jadwal
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilih resep yang ingin kamu santap hari ini
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalTambahOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {semua
                .filter((r) => !plan.includes(r.id))
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 hover:border-brand-mint hover:bg-brand-light/10 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-3xl">{r.emoji}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-800 truncate">
                          {r.nama}
                        </div>
                        <div className="text-xs text-slate-500">
                          {rupiah(r.harga)} • {r.protein}g protein •{" "}
                          {SLOT_LABEL[r.slot]}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => tambahMenuLangsung(r.id)}
                      className="btn btn-primary py-2 px-3 text-xs shrink-0"
                    >
                      <Plus size={14} /> Tambahkan
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: KONFIRMASI HAPUS MENU */}
      {modalHapusOpen && resepAktif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setModalHapusOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4 mx-auto">
              <Trash2 size={24} />
            </div>
            <h3 className="text-center text-lg font-extrabold text-slate-800">
              Hapus Menu Ini?
            </h3>
            <p className="mt-2 text-center text-sm text-slate-600">
              Apakah kamu yakin ingin menghapus{" "}
              <b className="text-slate-800">{resepAktif.nama}</b> dari
              rekomendasi menu harian? Bahan belanja terkait akan otomatis
              disinkronkan.
            </p>
            <div className="mt-6 flex gap-2.5">
              <button
                onClick={() => setModalHapusOpen(false)}
                className="btn btn-soft flex-1"
              >
                Batal
              </button>
              <button
                onClick={konfirmasiHapusMenu}
                className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 4: HASIL REKOMENDASI AI */}
      {modalAIOpen && ai && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setModalAIOpen(false)}
          />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-brand-mint animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal AI */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-light text-brand-dark shadow-xs">
                  <Sparkles size={22} className="text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-800">
                      Rekomendasi NutriKos AI
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        ai.sumber === "ai"
                          ? "bg-brand-dark text-white"
                          : "bg-brand-mint text-brand-deeper"
                      }`}
                    >
                      {ai.sumber === "ai" ? "✨ Gemini AI" : "✓ Sistem Pakar"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Analisis cerdas menu hemat & bergizi anak kos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalAIOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Kotak Alasan AI */}
            <div className="mt-4 rounded-2xl bg-gradient-to-r from-brand-light/70 to-emerald-50/60 p-4 border border-brand-mint/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-deeper uppercase mb-1">
                <Sparkles size={14} className="text-accent" /> Alasan Pilihan
                AI:
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                {ai.alasan}
              </p>
            </div>

            {/* Preview 3 Menu yang dipilih */}
            <div className="mt-4 space-y-2.5">
              <div className="text-xs font-bold uppercase text-slate-500">
                Menu Pilihan untuk Kamu:
              </div>
              {plan
                .map((id) => getRecipe(id))
                .filter(Boolean)
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 hover:border-brand-mint transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-3xl">{r.emoji}</span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase text-brand-dark">
                          {SLOT_LABEL[r.slot]}
                        </span>
                        <div className="font-bold text-sm text-slate-800 truncate">
                          {r.nama}
                        </div>
                        <div className="text-xs text-slate-500">
                          {r.protein}g protein • {r.kalori} kcal
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-accent">
                        {rupiah(r.harga)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {r.waktu} mnt
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Total Biaya & Status Bujet */}
            <div className="mt-4 rounded-xl bg-slate-50 p-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">
                  Total Biaya 3 Menu:
                </div>
                <div className="text-xl font-extrabold text-brand-dark">
                  {rupiah(total)}
                </div>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-brand-mint px-2.5 py-1 text-xs font-bold text-brand-deeper">
                  Bujet: {rupiah(profile.budget)}
                </span>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {total <= profile.budget
                    ? `Hemat ${rupiah(profile.budget - total)}`
                    : "Melebihi target"}
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => {
                  setModalAIOpen(false);
                  tanyaAI();
                }}
                disabled={loading}
                className="btn btn-soft flex-1 text-xs sm:text-sm"
              >
                <RefreshCw size={15} /> Buat Pilihan Lain
              </button>
              <button
                onClick={() => {
                  setModalAIOpen(false);
                  showToast("✓ Rekomendasi AI berhasil diterapkan ke jadwal!");
                }}
                className="btn btn-primary flex-1 text-xs sm:text-sm shadow-md"
              >
                <Check size={16} /> Terapkan Menu Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
