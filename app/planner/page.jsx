"use client";
import { Fragment, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { allowedRecipes, nutrisiDari, adaDiStok } from "@/lib/recommend";
import { mintaAI } from "@/lib/ai";
import { targetHarian } from "@/lib/gizi";
import { getRecipe, rupiah, SLOTS, SLOT_LABEL } from "@/lib/data";

// Jam mulai tiap waktu makan; jendela makan 90 menit (07:00 - 08:30 dst, sesuai template).
const SLOT_JAM = { pagi: [7, 0], siang: [12, 0], malam: [18, 30] };
const SLOT_IKON = {
  pagi: "wb_twilight",
  siang: "light_mode",
  malam: "dark_mode",
};
const SLOT_NAMA = { pagi: "Pagi", siang: "Siang", malam: "Malam" };
const JENDELA = 90;

const hhmm = (menit) =>
  `${String(Math.floor(menit / 60) % 24).padStart(2, "0")}:${String(menit % 60).padStart(2, "0")}`;

const ms = (nama, kelas = "") => (
  <span className={`material-symbols-outlined ${kelas}`}>{nama}</span>
);

// Donut persis template: lingkaran 36x36, dasharray = persen.
function Donut({ persen, warna }) {
  const p = Math.max(0, Math.min(100, Math.round(persen)));
  return (
    <div className="relative mb-1 flex h-16 w-16 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-border-subtle"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
        />
        <path
          className={`${warna} transition-all duration-700`}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeDasharray={`${p}, 100`}
          strokeLinecap="round"
          strokeWidth="3.5"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-metric-donut text-metric-donut text-text-primary">
          {Math.round(persen)}%
        </span>
      </div>
    </div>
  );
}

export default function MealPlannerHarian() {
  const router = useRouter();
  const {
    profile,
    plan,
    setPlan,
    generatePlan,
    updateRecipeInPlan,
    removeRecipeFromPlan,
    addRecipeToPlan,
    setRecipePortion,
    customPlanDetails,
    catatRiwayat,
    addExtra,
    ai,
    setAi,
    ready,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [menuId, setMenuId] = useState(null); // popover "Opsi Menu"

  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [modalTambahOpen, setModalTambahOpen] = useState(false);
  const [modalHapusOpen, setModalHapusOpen] = useState(false);
  const [modalAIOpen, setModalAIOpen] = useState(false);
  const [resepAktif, setResepAktif] = useState(null);
  const [resepPenggantiId, setResepPenggantiId] = useState("");
  const [porsiDipilih, setPorsiDipilih] = useState(1);

  const [sekarang, setSekarang] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setSekarang(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const showToast = (pesan) => {
    setToast(pesan);
    setTimeout(() => setToast(""), 3000);
  };

  const semua = useMemo(() => allowedRecipes(profile), [profile]);

  if (!ready) return null;

  // ===== Data turunan (logika lama) =====
  const porsiDari = (id) => customPlanDetails?.[id]?.porsi || 1;
  const nutrisi = nutrisiDari(plan, customPlanDetails);
  const total = nutrisi.biaya;
  const lemakTotal = plan.reduce(
    (s, id) => s + (getRecipe(id)?.lemak || 0) * porsiDari(id),
    0,
  );
  const t = targetHarian(profile.jenisKelamin);
  const persen = (v, target) => (target > 0 ? (v / target) * 100 : 0);
  const pKalori = persen(nutrisi.kalori, t.energi);
  const pProtein = persen(nutrisi.protein, t.protein);
  const pKarbo = persen(nutrisi.karbo, t.karbo);
  const pLemak = persen(Math.round(lemakTotal), t.lemak);

  const menitSekarang = sekarang.getHours() * 60 + sekarang.getMinutes();
  const slotData = SLOTS.map((s) => {
    const [h, m] = SLOT_JAM[s];
    const mulai = h * 60 + m;
    return {
      s,
      mulai,
      akhir: mulai + JENDELA,
      selesai: menitSekarang > mulai + JENDELA,
      resep: plan.map((id) => getRecipe(id)).filter((r) => r && r.slot === s),
    };
  });
  const idxAktif = slotData.findIndex((x) => !x.selesai);
  const statusSlot = (i) =>
    slotData[i].selesai ? "selesai" : i === idxAktif ? "aktif" : "rencana";

  const biayaSlot = (x) =>
    x.resep.reduce((s, r) => s + r.harga * porsiDari(r.id), 0);
  const sisa = profile.budget - total;
  const persenBujet =
    profile.budget > 0
      ? Math.min(100, Math.round((total / profile.budget) * 100))
      : 0;
  const tanggal = sekarang.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const statusGizi =
    pProtein >= 80 && pKalori >= 60 && pKalori <= 110
      ? "Seimbang, kalori dan protein harian sudah mendekati target."
      : pProtein < 80
        ? "Protein masih di bawah target harian, tambah menu berprotein."
        : pKalori > 110
          ? "Kalori melebihi target harian, kurangi porsi atau menu."
          : "Kalori masih di bawah target harian, tambah menu atau porsi.";

  // Info bahan dari stok kos untuk satu resep.
  const infoStok = (r) => {
    const ada = r.bahan.filter((b) => adaDiStok(profile, b.kunci));
    const kurang = r.bahan.filter((b) => !adaDiStok(profile, b.kunci));
    return {
      ada,
      kurang,
      hematStok: ada.reduce((s, b) => s + b.harga, 0),
      biayaKurang: kurang.reduce((s, b) => s + b.harga, 0),
    };
  };

  // ===== Aksi (logika lama) =====
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

  const bukaModalEdit = (r) => {
    setMenuId(null);
    setResepAktif(r);
    setResepPenggantiId(r.id);
    setPorsiDipilih(porsiDari(r.id));
    setModalEditOpen(true);
  };

  const simpanEditMenu = () => {
    if (!resepAktif) return;
    if (resepPenggantiId && resepPenggantiId !== resepAktif.id) {
      updateRecipeInPlan(resepAktif.id, resepPenggantiId);
      setRecipePortion(resepPenggantiId, porsiDipilih);
      showToast(
        `✓ Menu diganti menjadi "${getRecipe(resepPenggantiId)?.nama || "Menu Baru"}"!`,
      );
    } else {
      setRecipePortion(resepAktif.id, porsiDipilih);
      showToast(`✓ Porsi "${resepAktif.nama}" diatur ke ${porsiDipilih}x!`);
    }
    setModalEditOpen(false);
    setResepAktif(null);
  };

  const bukaModalHapus = (r) => {
    setMenuId(null);
    setResepAktif(r);
    setModalHapusOpen(true);
  };

  const konfirmasiHapusMenu = () => {
    if (!resepAktif) return;
    removeRecipeFromPlan(resepAktif.id);
    setModalHapusOpen(false);
    showToast(`Menu "${resepAktif.nama}" dihapus dari jadwal makan.`);
    setResepAktif(null);
  };

  const tambahMenuLangsung = (id) => {
    addRecipeToPlan(id);
    setModalTambahOpen(false);
    showToast(`✓ "${getRecipe(id)?.nama}" ditambahkan ke jadwal harian!`);
  };

  const tambahKeBelanja = (r) => {
    addExtra(r.id);
    router.push("/belanja");
  };

  // ===== Potongan UI =====
  const OpsiMenu = ({ r }) => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuId(menuId === r.id ? null : r.id)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-alt hover:text-text-primary"
        title="Opsi Menu"
        aria-label="Opsi Menu"
        aria-expanded={menuId === r.id}
      >
        {ms("more_vert", "text-[20px]")}
      </button>
      {menuId === r.id && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setMenuId(null)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-9 z-20 w-52 overflow-hidden rounded-xl border border-border-subtle bg-surface py-1 shadow-lg">
            <button
              type="button"
              onClick={() => bukaModalEdit(r)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-caption text-caption font-bold text-text-primary hover:bg-surface-soft"
            >
              {ms("tune", "text-[18px] text-text-secondary")} Ubah Porsi / Ganti
              Menu
            </button>
            <button
              type="button"
              onClick={() => bukaModalHapus(r)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-caption text-caption font-bold text-danger hover:bg-danger-soft"
            >
              {ms("delete", "text-[18px]")} Hapus dari Jadwal
            </button>
          </div>
        </>
      )}
    </div>
  );

  const Gambar = ({ r, besar, hemat }) => (
    <div
      className={`group relative h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-soft via-pill-active-bg to-rail-blue/40 sm:w-36 ${besar ? "!h-32 sm:!w-44" : ""}`}
    >
      <Link
        href={`/menu/${r.id}`}
        aria-label={`Lihat resep ${r.nama}`}
        className="absolute inset-0 flex items-center justify-center text-6xl transition-transform duration-300 group-hover:scale-105"
      >
        {r.emoji}
      </Link>
      <span
        className={`pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-text-primary/75 px-2 py-0.5 font-micro text-micro text-white backdrop-blur-sm ${besar ? "bg-text-primary/80 font-bold" : ""}`}
      >
        {ms(
          besar ? "timer" : "schedule",
          besar ? "text-[13px]" : "text-[12px]",
        )}{" "}
        {r.waktu} mnt
      </span>
      {hemat && (
        <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-success px-2 py-0.5 font-micro text-micro font-bold text-white shadow-sm">
          Hemat
        </span>
      )}
    </div>
  );

  const Kartu = ({ x, r, status }) => {
    const porsi = porsiDari(r.id);
    const st = infoStok(r);
    const aktif = status === "aktif";
    const selesai = status === "selesai";
    const harga = Math.round(r.harga * porsi);
    const kalori = Math.round(r.kalori * porsi);
    const protein = Math.round(r.protein * porsi);
    const karbo = Math.round(r.karbo * porsi);
    const rentang = `(${hhmm(x.mulai)} - ${hhmm(x.akhir)} WIB)`;

    return (
      <div
        className={`relative overflow-hidden rounded-[20px] bg-surface p-6 transition-all hover:shadow-lg ${aktif ? "shadow-md" : "shadow-sm hover:-translate-y-0.5 hover:shadow-md"}`}
      >
        {aktif && (
          <div className="absolute bottom-0 left-0 top-0 w-2.5 bg-rail-blue" />
        )}

        {/* Baris metadata */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center rounded-xl ${aktif ? "h-10 w-10 bg-rail-blue text-white shadow-sm" : "h-9 w-9 bg-surface-alt text-text-secondary"}`}
            >
              {ms(SLOT_IKON[x.s], aktif ? "text-[22px]" : "text-[20px]")}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-x-2">
                <span
                  className={`${aktif ? "font-h3 text-h3" : "font-h4 text-h4"} uppercase text-text-primary`}
                >
                  {SLOT_LABEL[x.s]}
                </span>
                <span
                  className={`font-caption text-caption ${aktif ? "font-bold text-rail-blue" : "text-text-secondary"}`}
                >
                  {rentang}
                </span>
              </div>
              <span
                className={`font-micro text-micro ${aktif ? "font-semibold text-rail-blue" : "text-text-secondary"}`}
              >
                {aktif
                  ? `Menu Utama ${SLOT_NAMA[x.s]} Ini • Jadwal Saat Ini`
                  : selesai
                    ? `Menu Utama ${SLOT_NAMA[x.s]}`
                    : `Menu Terencana ${SLOT_NAMA[x.s]}`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selesai && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 font-micro text-micro font-bold text-success-accessible">
                {ms("check_circle", "text-[14px]")} Selesai Dimasak
              </span>
            )}
            {aktif && (
              <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-pill-active-bg px-3 py-1 font-micro text-micro font-bold text-primary-container">
                <span className="h-2 w-2 rounded-full bg-rail-blue" />
                Menu Hari Ini (Siap Masak)
              </span>
            )}
            {status === "rencana" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-3 py-1 font-micro text-micro font-bold text-text-secondary">
                {ms("event", "text-[14px]")} Terencana
              </span>
            )}
            {OpsiMenu({ r })}
          </div>
        </div>

        {/* Isi kartu */}
        <div className="flex flex-col items-start gap-4 sm:flex-row">
          {Gambar({ r, besar: aktif, hemat: aktif && r.harga < 10000 })}
          <div
            className={`flex min-w-0 flex-1 flex-col justify-between self-stretch `}
          >
            <div>
              <Link
                href={`/menu/${r.id}`}
                className={`mb-1 block text-text-primary transition-colors hover:text-rail-blue ${aktif ? "text-[22px] font-bold leading-[30px] tracking-[-0.01em]" : "truncate font-h3 text-h3"}`}
              >
                {r.nama}
                {porsi > 1 && (
                  <span className="ml-2 align-middle rounded-md bg-primary-soft px-1.5 py-0.5 font-micro text-micro font-bold text-primary">
                    {porsi} Porsi
                  </span>
                )}
              </Link>

              {aktif ? (
                st.kurang.length === 0 ? (
                  <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-success-soft px-3 py-1 font-caption text-caption text-success-accessible">
                    {ms("savings", "text-[16px]")}
                    <span>
                      Bahan lengkap di kosan •{" "}
                      <strong>Hemat {rupiah(st.hematStok)}</strong> dari belanja
                    </span>
                  </div>
                ) : (
                  <div className="mb-3 inline-flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-1 font-caption text-caption text-[#8A5A00]">
                    {ms("shopping_basket", "mt-0.5 text-[16px] text-warning")}
                    <span>
                      <strong>{st.kurang.length} bahan perlu dibeli:</strong>{" "}
                      {st.kurang.map((b) => b.nama).join(", ")} (±{" "}
                      {rupiah(st.biayaKurang)})
                    </span>
                  </div>
                )
              ) : st.kurang.length === 0 ? (
                <p className="mb-3 flex items-start gap-1.5 font-caption text-caption text-text-secondary">
                  {ms("kitchen", "mt-0.5 text-[16px] text-rail-blue")}
                  <span className="min-w-0">
                    Bahan dari stok kost ({st.ada.map((b) => b.nama).join(", ")}
                    )
                  </span>
                </p>
              ) : (
                <p className="mb-3 flex items-start gap-1.5 font-caption text-caption text-[#8A5A00]">
                  {ms("shopping_basket", "mt-0.5 text-[16px] text-warning")}
                  <span className="min-w-0">
                    <strong>{st.kurang.length} bahan perlu dibeli:</strong>{" "}
                    {st.kurang.map((b) => b.nama).join(", ")} (±{" "}
                    {rupiah(st.biayaKurang)})
                  </span>
                </p>
              )}
            </div>

            {aktif ? (
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-alt p-3 text-center sm:grid-cols-4">
                <div>
                  <span className="block font-caption text-caption text-text-secondary">
                    Estimasi
                  </span>
                  <span className="font-label-prominent text-label-prominent font-bold text-text-primary">
                    {rupiah(harga)}
                  </span>
                </div>
                <div>
                  <span className="block font-caption text-caption text-text-secondary">
                    Energi
                  </span>
                  <span className="font-label-prominent text-label-prominent font-bold text-primary">
                    {kalori} kkal
                  </span>
                </div>
                <div>
                  <span className="block font-caption text-caption text-text-secondary">
                    Protein
                  </span>
                  <span className="font-label-prominent text-label-prominent font-bold text-success">
                    {protein}g
                  </span>
                </div>
                <div>
                  <span className="block font-caption text-caption text-text-secondary">
                    Karbo
                  </span>
                  <span className="font-label-prominent text-label-prominent text-text-primary">
                    {karbo}g
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-surface-alt px-3 py-1 font-caption text-caption font-bold text-text-primary">
                  {rupiah(harga)}
                </span>
                <span className="rounded-lg bg-primary-soft px-3 py-1 font-caption text-caption font-medium text-primary">
                  {kalori} kkal
                </span>
                <span className="rounded-lg bg-success-soft px-3 py-1 font-caption text-caption font-medium text-success-accessible">
                  {protein}g Protein
                </span>
                <span className="rounded-lg bg-surface-alt px-3 py-1 font-caption text-caption text-text-secondary">
                  {karbo}g Karbo
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer aksi */}
        {aktif ? (
          <div className="-mx-6 -mb-6 mt-4 flex flex-wrap items-center justify-between gap-3 bg-primary-soft/40 px-6 py-3 pt-3">
            <div className="flex items-center gap-2">
              {ms("microwave", "text-[18px] text-rail-blue")}
              <span className="font-caption text-caption text-text-secondary">
                {r.alat?.length
                  ? `${r.alat.join(" & ")} siap dipakai`
                  : "Tanpa alat masak khusus"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => bukaModalEdit(r)}
                className="flex h-9 items-center gap-1.5 rounded-xl px-3 font-caption text-caption font-bold text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              >
                Ganti Menu
              </button>
              <Link
                href={`/menu/${r.id}`}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-surface px-4 font-caption text-caption font-bold text-text-primary shadow-sm transition-colors hover:bg-surface-soft"
              >
                {ms("receipt_long", "text-[16px] text-rail-blue")}
                <span>Bahan &amp; Resep</span>
              </Link>
              <button
                type="button"
                className="flex h-9 items-center gap-1.5 rounded-xl bg-surface px-4 font-caption text-caption font-bold text-success-accessible shadow-sm transition-colors hover:bg-success-soft"
              >
                {ms("done_all", "text-[16px]")}
                <span>Tandai Selesai</span>
              </button>
              <Link
                href={`/menu/${r.id}`}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-rail-blue px-5 font-label-prominent text-label-prominent font-bold text-white shadow-sm transition-all hover:bg-secondary"
              >
                {ms("skillet", "text-[18px]")}
                <span>Mulai Masak</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="-mx-6 -mb-6 mt-4 flex flex-wrap items-center justify-between gap-3 bg-surface-soft px-6 py-3">
            <div className="flex items-center gap-2">
              {selesai ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-success" />
                  <span className="font-micro text-micro text-text-secondary">
                    Dicatat otomatis ke Jurnal Pengeluaran
                  </span>
                </>
              ) : (
                <span className="font-caption text-caption text-text-secondary">
                  Waktu masak estimasi: {r.waktu} menit
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => bukaModalEdit(r)}
                className="h-8 rounded-lg px-3 font-caption text-caption text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              >
                Ganti Menu
              </button>
              {selesai ? (
                <Link
                  href={`/menu/${r.id}`}
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-surface px-4 font-caption text-caption font-bold text-primary shadow-sm transition-colors hover:bg-primary-soft"
                >
                  <span>Detail Resep</span>
                  {ms("arrow_forward", "text-[16px]")}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => tambahKeBelanja(r)}
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-surface px-4 font-caption text-caption font-bold text-rail-blue shadow-sm transition-colors hover:bg-primary-soft"
                >
                  {ms("add_shopping_cart", "text-[16px]")}
                  <span>+ Tambah ke Belanja</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const SlotKosong = ({ x }) => (
    <div className="group flex flex-col items-center justify-between gap-4 rounded-[20px] border-2 border-dashed border-border-subtle bg-surface/50 p-5 text-center transition-all hover:bg-surface sm:flex-row sm:text-left">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-alt text-text-secondary transition-colors group-hover:bg-primary-soft group-hover:text-primary">
          {ms(SLOT_IKON[x.s], "text-[20px]")}
        </div>
        <div>
          <div className="flex flex-wrap items-center justify-center gap-x-2 sm:justify-start">
            <span className="font-h4 text-h4 uppercase text-text-primary">
              {SLOT_LABEL[x.s]}
            </span>
            <span className="font-caption text-caption text-text-secondary">
              ({hhmm(x.mulai)} - {hhmm(x.akhir)} WIB)
            </span>
          </div>
          <p className="mt-0.5 font-caption text-caption text-text-secondary">
            Belum ada menu {SLOT_LABEL[x.s].toLowerCase()} terjadwal. Tambahkan
            menu hemat untuk melengkapi hari ini.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setModalTambahOpen(true)}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-surface px-4 font-label-prominent text-label-prominent text-rail-blue shadow-sm transition-all hover:bg-primary-soft"
      >
        {ms("add_circle", "text-[18px]")}
        <span>+ Tambah Menu</span>
      </button>
    </div>
  );

  const kandidatResep = semua;

  return (
    <div className="flex w-full flex-col">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 right-4 z-[60] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-xl bg-text-primary px-4 py-3 font-label-prominent text-label-prominent text-white shadow-xl lg:bottom-6">
          {ms("check_circle", "text-[20px] text-success")}
          <span>{toast}</span>
        </div>
      )}

      {/* Header halaman + kontrol */}
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-micro text-micro font-bold uppercase tracking-wider text-rail-blue">
              Rencana Makan Kost
            </span>
            <span className="h-1 w-1 rounded-full bg-border-hover" />
            <span className="font-caption text-caption text-text-secondary">
              Edisi Hemat Mahasiswa
            </span>
          </div>
          <h1 className="font-h1 text-h1 tracking-tight text-text-primary">
            Meal Planner Harian
          </h1>
          <p className="mt-1 font-body-default text-body-default text-text-secondary">
            Atur dan jadwalkan menu makan harianmu untuk menjaga keseimbangan
            gizi dan kontrol pengeluaran kost.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          {/* Navigasi tanggal */}
          <div className="flex max-w-full flex-wrap items-center rounded-full bg-surface p-1 px-2 shadow-sm">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-alt hover:text-text-primary"
              title="Hari Sebelumnya"
              aria-label="Hari Sebelumnya"
            >
              {ms("chevron_left", "text-[18px]")}
            </button>
            <div className="flex items-center gap-2 px-3">
              {ms("today", "text-[18px] text-primary")}
              <span className="font-label-prominent text-label-prominent text-text-primary">
                {tanggal}
              </span>
              <span className="rounded-full bg-primary-soft px-2 py-0.5 font-micro text-micro font-bold text-primary">
                Hari Ini
              </span>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-alt hover:text-text-primary"
              title="Hari Berikutnya"
              aria-label="Hari Berikutnya"
            >
              {ms("chevron_right", "text-[18px]")}
            </button>
            <span className="mx-1 hidden h-5 w-px bg-border-subtle sm:block" />
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-caption text-caption text-text-secondary transition-colors hover:bg-surface-alt hover:text-primary"
            >
              {ms("calendar_month", "text-[18px]")}
              <span>Pilih Tanggal</span>
            </button>
          </div>

          {/* Aksi cepat */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/planner/mingguan"
              className="flex h-10 items-center gap-2 rounded-full bg-surface px-4 font-label-prominent text-label-prominent text-text-primary shadow-sm transition-all hover:bg-surface-soft"
            >
              {ms("view_week", "text-[18px] text-text-secondary")}
              <span>Tampilan Mingguan</span>
            </Link>
            <button
              type="button"
              onClick={tanyaAI}
              disabled={loading}
              className="flex h-10 items-center gap-2 rounded-xl bg-rail-blue px-5 font-label-prominent text-label-prominent text-white shadow-sm transition-all hover:bg-secondary disabled:opacity-60"
            >
              {ms("auto_awesome", "text-[18px]")}
              <span>
                {loading ? "Menyusun..." : "+ Buat Rencana Otomatis AI"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid utama */}
      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-12">
        {/* KIRI: timeline slot makan */}
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">
          {slotData.map((x, i) => {
            const status = statusSlot(i);
            if (x.resep.length === 0)
              return <Fragment key={x.s}>{SlotKosong({ x })}</Fragment>;
            return x.resep.map((r) => (
              <Fragment key={r.id}>{Kartu({ x, r, status })}</Fragment>
            ));
          })}

          {/* Slot opsional (tampilan template; belum ada logika camilan) */}
          <div className="group flex flex-col items-center justify-between gap-4 rounded-[20px] border-2 border-dashed border-border-subtle bg-surface/50 p-5 text-center transition-all hover:bg-surface sm:flex-row sm:text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-alt text-text-secondary transition-colors group-hover:bg-primary-soft group-hover:text-primary">
                {ms("nutrition", "text-[20px]")}
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
                  <span className="font-h4 text-h4 text-text-primary">
                    CAMILAN SORE
                  </span>
                  <span className="font-caption text-caption text-text-secondary">
                    (15:30 - 17:00 WIB)
                  </span>
                  <span className="rounded-full bg-surface-alt px-2 py-0.5 font-micro text-micro text-text-secondary">
                    Opsional
                  </span>
                </div>
                <p className="mt-0.5 font-caption text-caption text-text-secondary">
                  Belum ada camilan terjadwal. Tambahkan buah potong hemat atau
                  biskuit gandum.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-surface px-4 font-label-prominent text-label-prominent text-rail-blue shadow-sm transition-all hover:bg-primary-soft"
            >
              {ms("add_circle", "text-[18px]")}
              <span>+ Tambah Camilan Hemat</span>
            </button>
          </div>

          {/* Tombol tambah menu (logika lama) */}
          <button
            type="button"
            onClick={() => setModalTambahOpen(true)}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-surface font-label-prominent text-label-prominent text-primary-container shadow-sm transition-all hover:bg-primary-soft"
          >
            {ms("add_circle", "text-[20px]")} Tambah Menu ke Jadwal
          </button>
        </div>

        {/* KANAN: ringkasan */}
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-4">
          {/* Ringkasan biaya */}
          <div className="rounded-[20px] bg-surface p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {ms("account_balance_wallet", "text-[20px] text-rail-blue")}
                <h4 className="font-h4 text-h4 text-text-primary">
                  Ringkasan Biaya Hari Ini
                </h4>
              </div>
              {sisa >= 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 font-micro text-micro font-bold text-success-accessible">
                  {ms("trending_down", "text-[14px]")} Hemat {rupiah(sisa)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-0.5 font-micro text-micro font-bold text-[#A3242A]">
                  {ms("trending_up", "text-[14px]")} Lebih {rupiah(-sisa)}
                </span>
              )}
            </div>

            <div className="my-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-[34px] font-bold leading-[44px] tracking-[-0.02em] text-text-primary tabular-nums sm:text-[40px] sm:leading-[48px]">
                  {rupiah(total)}
                </span>
                <span className="font-caption text-caption text-text-secondary">
                  / {rupiah(profile.budget)}
                </span>
              </div>
              <p className="mt-0.5 font-caption text-caption text-text-secondary">
                {persenBujet}% dari pagu anggaran harian anak kost
              </p>
            </div>

            <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-surface-alt">
              <div
                className="h-full rounded-full bg-rail-blue transition-all duration-500"
                style={{ width: `${persenBujet}%` }}
              />
            </div>

            <div className="mb-4 flex flex-col gap-2 border-t border-border-subtle/70 pt-3">
              {slotData.map((x, i) => {
                const st = statusSlot(i);
                const dot =
                  st === "selesai"
                    ? "bg-success"
                    : st === "aktif"
                      ? "bg-rail-blue"
                      : "bg-text-disabled";
                return (
                  <div
                    key={x.s}
                    className="flex items-center justify-between font-caption text-caption"
                  >
                    <span className="flex items-center gap-2 text-text-secondary">
                      <span className={`h-2 w-2 rounded-full ${dot}`} />{" "}
                      {SLOT_LABEL[x.s]}
                      {st === "aktif" ? " (Aktif)" : ""}
                    </span>
                    <span className="font-bold text-text-primary tabular-nums">
                      {rupiah(biayaSlot(x))}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-1 font-caption text-caption">
                <span className="text-text-secondary">
                  Sisa Cadangan Anggaran:
                </span>
                <span
                  className={`font-bold tabular-nums ${sisa >= 0 ? "text-success-accessible" : "text-[#A3242A]"}`}
                >
                  {sisa >= 0 ? "+ " : "- "}
                  {rupiah(Math.abs(sisa))}
                </span>
              </div>
            </div>

            <Link
              href="/profil-kos"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-surface-alt font-label-prominent text-label-prominent text-text-primary transition-colors hover:bg-[#eceef5]"
            >
              {ms("tune", "text-[18px] text-text-secondary")}
              <span>Atur Anggaran Harian</span>
            </Link>
          </div>

          {/* Target nutrisi */}
          <div className="rounded-[20px] bg-surface p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {ms("pie_chart", "text-[20px] text-primary")}
                <h4 className="font-h4 text-h4 text-text-primary">
                  Target Nutrisi Harian
                </h4>
              </div>
              <span className="rounded-full bg-primary-soft px-2 py-0.5 font-micro text-micro font-bold text-primary">
                Target {t.energi.toLocaleString("id-ID")} kkal
              </span>
            </div>

            <div className="mb-3 flex items-baseline justify-between gap-2">
              <div>
                <span className="text-[22px] font-bold leading-[30px] tracking-[-0.01em] text-text-primary">
                  {nutrisi.kalori.toLocaleString("id-ID")}
                </span>{" "}
                <span className="font-caption text-caption text-text-secondary">
                  / {t.energi.toLocaleString("id-ID")} kkal
                </span>
              </div>
              <span className="font-label-prominent text-label-prominent font-bold text-rail-blue">
                {Math.round(pKalori)}% Tercapai
              </span>
            </div>

            <div className="my-3 grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-alt p-3 text-center">
                <Donut persen={pKalori} warna="text-rail-blue" />
                <span className="font-caption text-caption font-bold text-text-primary">
                  Kalori Total
                </span>
                <span className="font-micro text-micro text-text-secondary">
                  {nutrisi.kalori.toLocaleString("id-ID")} kkal
                </span>
              </div>
              <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-surface-alt p-3 text-center">
                {pProtein >= 80 && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-success-soft px-1.5 font-micro text-micro font-bold text-success-accessible">
                    Optimal
                  </span>
                )}
                <Donut persen={pProtein} warna="text-success" />
                <span className="font-caption text-caption font-bold text-text-primary">
                  Protein
                </span>
                <span className="font-micro text-micro text-text-secondary">
                  {nutrisi.protein}g / {t.protein}g
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-alt p-3 text-center">
                <Donut persen={pKarbo} warna="text-warning" />
                <span className="font-caption text-caption font-bold text-text-primary">
                  Karbohidrat
                </span>
                <span className="font-micro text-micro text-text-secondary">
                  {nutrisi.karbo}g / {t.karbo}g
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-alt p-3 text-center">
                <Donut persen={pLemak} warna="text-secondary" />
                <span className="font-caption text-caption font-bold text-text-primary">
                  Lemak Baik
                </span>
                <span className="font-micro text-micro text-text-secondary">
                  {Math.round(lemakTotal)}g / {t.lemak}g
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl bg-success-soft/70 p-3">
              {ms("verified", "shrink-0 text-[20px] text-success-accessible")}
              <span className="font-caption text-caption font-medium text-success-accessible">
                <strong>Status Gizi:</strong> {statusGizi}
              </span>
            </div>
          </div>

          {/* Trik masak (isi tetap seperti template) */}
          <div className="rounded-[20px] bg-surface p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {ms("lightbulb", "text-[20px] text-warning")}
                <h4 className="font-h4 text-h4 text-text-primary">
                  Trik Masak Hari Ini
                </h4>
              </div>
              <span className="rounded-full bg-warning-soft px-2 py-0.5 font-micro text-micro font-bold text-[#8A5A00]">
                NutriBot AI
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 rounded-xl bg-surface-alt p-3 transition-colors hover:bg-surface-soft">
                {ms("rice_bowl", "mt-0.5 shrink-0 text-[18px] text-rail-blue")}
                <div>
                  <p className="font-caption text-caption font-medium leading-relaxed text-text-primary">
                    Masak nasi 2 porsi sekaligus di rice cooker siang ini untuk
                    makan malam agar hemat listrik kos.
                  </p>
                  <span className="mt-1 block font-micro text-micro text-text-secondary">
                    Hemat ± Rp 1.500 listrik/hari
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-surface-alt p-3 transition-colors hover:bg-surface-soft">
                {ms(
                  "soup_kitchen",
                  "mt-0.5 shrink-0 text-[18px] text-[#8A5A00]",
                )}
                <div>
                  <p className="font-caption text-caption font-medium leading-relaxed text-text-primary">
                    Siapkan dan potong semua bahan sebelum menyalakan kompor
                    agar proses masak lebih cepat dan hemat gas.
                  </p>
                  <span className="mt-1 block font-micro text-micro text-text-secondary">
                    Tips masak hemat energi
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-1 pt-2 text-center font-label-prominent text-label-prominent font-bold text-rail-blue transition-colors hover:text-secondary"
            >
              <span>Lihat Semua Tips Hemat Kost</span>
              {ms("chevron_right", "text-[16px]")}
            </button>
          </div>
        </div>
      </div>

      {/* ===== MODAL ===== */}
      {modalEditOpen && resepAktif && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-text-primary/50 backdrop-blur-[2px]"
            onClick={() => setModalEditOpen(false)}
          />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[20px] bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-2xl">
                  {resepAktif.emoji}
                </div>
                <div>
                  <h3 className="font-h4 text-h4 text-text-primary">
                    Ubah Porsi / Ganti Menu
                  </h3>
                  <p className="font-caption text-caption text-text-secondary">
                    Slot:{" "}
                    <b className="text-primary-container">
                      {SLOT_LABEL[resepAktif.slot] || resepAktif.slot}
                    </b>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEditOpen(false)}
                aria-label="Tutup"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-alt"
              >
                {ms("close", "text-[20px]")}
              </button>
            </div>

            <div className="mt-4 space-y-5">
              <div className="rounded-xl bg-surface-soft p-3.5">
                <div className="font-micro text-micro uppercase text-text-secondary">
                  Menu Saat Ini
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-h4 text-h4 text-text-primary">
                    {resepAktif.nama}
                  </span>
                  <span className="shrink-0 font-h4 text-h4 text-rail-blue">
                    {rupiah(resepAktif.harga)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 font-caption text-caption text-text-secondary">
                  <span>⏱️ {resepAktif.waktu} menit</span>
                  <span>🥩 {resepAktif.protein}g protein</span>
                  <span>🔥 {resepAktif.kalori} kcal</span>
                </div>
              </div>

              <div>
                <label className="label">Ubah Jumlah / Porsi:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPorsiDipilih(p)}
                      className={`rounded-xl py-2.5 font-caption text-caption font-bold transition-colors ${porsiDipilih === p ? "bg-rail-blue text-white shadow-sm" : "bg-surface-alt text-text-primary hover:bg-pill-active-bg"}`}
                    >
                      {p} Porsi
                    </button>
                  ))}
                </div>
                <div className="mt-1.5 font-caption text-caption text-text-secondary">
                  Estimasi biaya porsi ini:{" "}
                  <b>{rupiah(resepAktif.harga * porsiDipilih)}</b> (
                  {resepAktif.protein * porsiDipilih}g protein)
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="label !mb-0">Pilih Menu Pengganti:</label>
                  <span className="font-caption text-caption text-text-secondary">
                    {kandidatResep.length} pilihan
                  </span>
                </div>
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {kandidatResep.map((r) => {
                    const dipilih = resepPenggantiId === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setResepPenggantiId(r.id)}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl border p-2.5 text-left transition-all ${dipilih ? "border-rail-blue bg-primary-soft/50 ring-2 ring-pill-active-bg" : "border-border-subtle bg-surface hover:border-border-hover"}`}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="text-2xl">{r.emoji}</span>
                          <div className="min-w-0">
                            <div className="truncate font-label-prominent text-label-prominent text-text-primary">
                              {r.nama}
                            </div>
                            <div className="font-micro text-micro text-text-secondary">
                              {r.protein}g protein • {r.waktu} mnt
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-caption text-caption font-bold text-rail-blue">
                            {rupiah(r.harga)}
                          </div>
                          {dipilih && (
                            <span className="inline-flex items-center gap-0.5 font-micro text-micro font-bold text-primary-container">
                              {ms("check", "text-[12px]")} Terpilih
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(() => {
                const terpilih = getRecipe(resepPenggantiId) || resepAktif;
                return (
                  <div className="rounded-xl bg-surface-soft p-3 font-caption text-caption">
                    <div className="mb-1 font-bold text-text-primary">
                      Bahan untuk {terpilih.nama} ({porsiDipilih} porsi):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {terpilih.bahan.map((b) => (
                        <span
                          key={b.nama}
                          className="rounded-md border border-border-subtle bg-surface px-2 py-1 text-text-secondary"
                        >
                          {b.nama} ({b.qty})
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2.5 border-t border-border-subtle pt-3">
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
                  className="btn btn-primary flex-1"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalTambahOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-text-primary/50 backdrop-blur-[2px]"
            onClick={() => setModalTambahOpen(false)}
          />
          <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[20px] bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-container">
                  {ms("add", "text-[20px]")}
                </div>
                <div>
                  <h3 className="font-h4 text-h4 text-text-primary">
                    Tambah Menu ke Jadwal
                  </h3>
                  <p className="font-caption text-caption text-text-secondary">
                    Pilih resep yang ingin kamu santap hari ini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalTambahOpen(false)}
                aria-label="Tutup"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-alt"
              >
                {ms("close", "text-[20px]")}
              </button>
            </div>
            <div className="mt-4 max-h-96 space-y-2.5 overflow-y-auto pr-1">
              {semua
                .filter((r) => !plan.includes(r.id))
                .map((r) => (
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
                          {rupiah(r.harga)} • {r.protein}g protein •{" "}
                          {SLOT_LABEL[r.slot]}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => tambahMenuLangsung(r.id)}
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

      {modalHapusOpen && resepAktif && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-text-primary/50 backdrop-blur-[2px]"
            onClick={() => setModalHapusOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-[20px] bg-surface p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
              {ms("delete", "text-[24px]")}
            </div>
            <h3 className="text-center font-h4 text-h4 text-text-primary">
              Hapus Menu Ini?
            </h3>
            <p className="mt-2 text-center font-body-default text-body-default text-text-secondary">
              Apakah kamu yakin ingin menghapus{" "}
              <b className="text-text-primary">{resepAktif.nama}</b> dari jadwal
              makan harian? Bahan belanja terkait akan otomatis disinkronkan.
            </p>
            <div className="mt-6 flex gap-2.5">
              <button
                type="button"
                onClick={() => setModalHapusOpen(false)}
                className="btn btn-soft flex-1"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={konfirmasiHapusMenu}
                className="btn flex-1 bg-danger text-white hover:opacity-90"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAIOpen && ai && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-text-primary/50 backdrop-blur-[2px]"
            onClick={() => setModalAIOpen(false)}
          />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[20px] bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-rail-blue">
                  {ms("auto_awesome", "text-[22px]")}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-h4 text-h4 text-text-primary">
                      Rekomendasi NutriKos AI
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 font-micro text-micro font-bold ${ai.sumber === "ai" ? "bg-rail-blue text-white" : "bg-pill-active-bg text-primary"}`}
                    >
                      {ai.sumber === "ai" ? "✨ Gemini AI" : "✓ Sistem Pakar"}
                    </span>
                  </div>
                  <p className="font-caption text-caption text-text-secondary">
                    Analisis cerdas menu hemat & bergizi anak kos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAIOpen(false)}
                aria-label="Tutup"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-alt"
              >
                {ms("close", "text-[20px]")}
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-primary-soft/70 p-4">
              <div className="mb-1 flex items-center gap-1.5 font-micro text-micro uppercase text-primary">
                {ms("auto_awesome", "text-[14px]")} Alasan Pilihan AI:
              </div>
              <p className="font-body-default text-body-default font-medium leading-relaxed text-text-primary">
                {ai.alasan}
              </p>
            </div>

            <div className="mt-4 space-y-2.5">
              <div className="font-micro text-micro uppercase text-text-secondary">
                Menu Pilihan untuk Kamu:
              </div>
              {plan
                .map((id) => getRecipe(id))
                .filter(Boolean)
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border-subtle p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-3xl">{r.emoji}</span>
                      <div className="min-w-0">
                        <span className="font-micro text-micro uppercase text-primary-container">
                          {SLOT_LABEL[r.slot]}
                        </span>
                        <div className="truncate font-label-prominent text-label-prominent text-text-primary">
                          {r.nama}
                        </div>
                        <div className="font-caption text-caption text-text-secondary">
                          {r.protein}g protein • {r.kalori} kcal
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-label-prominent text-label-prominent font-bold text-rail-blue">
                        {rupiah(r.harga)}
                      </div>
                      <div className="font-micro text-micro text-text-secondary">
                        {r.waktu} mnt
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-surface-soft p-3.5">
              <div>
                <div className="font-caption text-caption text-text-secondary">
                  Total Biaya {plan.length} Menu:
                </div>
                <div className="font-h3 text-h3 text-primary-container">
                  {rupiah(total)}
                </div>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-pill-active-bg px-2.5 py-1 font-micro text-micro font-bold text-primary">
                  Bujet: {rupiah(profile.budget)}
                </span>
                <div className="mt-0.5 font-micro text-micro text-text-secondary">
                  {total <= profile.budget
                    ? `Hemat ${rupiah(profile.budget - total)}`
                    : "Melebihi target"}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setModalAIOpen(false);
                  tanyaAI();
                }}
                disabled={loading}
                className="btn btn-soft flex-1"
              >
                {ms("refresh", "text-[18px]")} Buat Pilihan Lain
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalAIOpen(false);
                  showToast("✓ Rekomendasi AI berhasil diterapkan ke jadwal!");
                }}
                className="btn btn-primary flex-1"
              >
                {ms("check", "text-[18px]")} Terapkan Menu Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
