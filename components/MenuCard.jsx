"use client";
import Link from "next/link";
import { rupiah } from "@/lib/data";
import { adaDiStok } from "@/lib/recommend";
import { useApp } from "./AppProvider";

// Label kategori singkat dari data resep (maks. 2), mis. "Hemat & Tinggi Protein".
function kategori(r) {
  const label = [];
  if (r.harga < 10000) label.push("Hemat");
  if (r.protein >= 18) label.push("Tinggi Protein");
  if (r.waktu < 15) label.push("Cepat");
  if (label.length === 0)
    label.push(r.alat?.[0] ? `Praktis ${r.alat[0]}` : "Praktis");
  return label.slice(0, 2).join(" & ");
}

// Kartu menu gaya template: foto/emoji + lencana, ringkasan insight, makro, dan tombol aksi.
export default function MenuCard({
  recipe: r,
  porsi = 1,
  aksiLabel = "Pilih Menu",
  aksiIcon = "add_circle",
  onAksi,
  href,
  onEdit,
  onDelete,
}) {
  const { favorit, toggleFavorit, profile } = useApp();
  const disukai = favorit.some((f) => f.resepId === r.id);

  const harga = Math.round(r.harga * porsi);
  const kalori = Math.round(r.kalori * porsi);
  const protein = Math.round(r.protein * porsi);
  const karbo = Math.round(r.karbo * porsi);
  const lemak = Math.round(r.lemak * porsi);

  // Insight dihitung dari stok bahan di kos (bukan teks tetap).
  const adaStok = r.bahan.filter((b) => adaDiStok(profile, b.kunci));
  const hematStok = adaStok.reduce((s, b) => s + b.harga, 0);
  const sisaBeli = r.harga - hematStok;
  const insight =
    adaStok.length > 0
      ? `${adaStok.length} dari ${r.bahan.length} bahan sudah ada di stokmu, belanja sisanya hanya ${rupiah(sisaBeli)}.`
      : `Belum ada bahan di stokmu, belanja sekitar ${rupiah(r.harga)} untuk ${r.bahan.length} bahan.`;

  const tombolUtama =
    "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-rail-blue font-label-prominent text-label-prominent text-white shadow-sm transition-colors hover:bg-primary-hover active:bg-primary";
  const tombolIkon =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-soft text-text-secondary transition-colors hover:bg-pill-active-bg hover:text-rail-blue";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-surface shadow-sm transition-all hover:shadow-md">
      {/* Gambar + lencana */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-primary-soft via-pill-active-bg to-rail-blue/40">
        <Link
          href={`/menu/${r.id}`}
          aria-label={`Lihat resep ${r.nama}`}
          className="absolute inset-0 flex items-center justify-center pb-8 text-7xl transition-transform duration-300 group-hover:scale-105"
        >
          {r.emoji}
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-text-primary/70 via-transparent to-transparent" />

        {/* Match Badge Top Left (tampilan template; belum ada logika skor kecocokan) */}
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 font-caption text-caption font-bold text-success-accessible shadow-sm">
          <span className="material-symbols-outlined text-[14px]">
            verified
          </span>
          <span>98% Cocok</span>
        </div>
        <div className="absolute right-3 top-3 max-w-[55%] truncate rounded-md bg-surface/90 px-2 py-0.5 font-micro text-micro font-semibold text-primary-container shadow-sm backdrop-blur">
          {kategori(r)}
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 text-white">
          <div>
            <span className="block font-micro text-micro opacity-80">
              Estimasi Biaya{porsi > 1 ? ` (${porsi} porsi)` : ""}:
            </span>
            <span className="font-h3 text-h3 leading-none text-white">
              {rupiah(harga)}
            </span>
          </div>
          <div className="flex items-center gap-2 font-caption text-caption">
            <span className="flex items-center gap-0.5 rounded-full bg-black/40 px-2 py-0.5">
              <span className="material-symbols-outlined text-[14px]">
                schedule
              </span>{" "}
              {r.waktu} mnt
            </span>
            <span className="flex items-center gap-0.5 rounded-full bg-black/40 px-2 py-0.5">
              <span className="material-symbols-outlined text-[14px]">
                local_fire_department
              </span>{" "}
              {kalori} kkal
            </span>
          </div>
        </div>
      </div>

      {/* Isi kartu */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div>
          <Link
            href={`/menu/${r.id}`}
            className="line-clamp-1 font-h4 text-h4 text-text-primary transition-colors group-hover:text-rail-blue"
          >
            {r.nama}
          </Link>
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-surface-soft p-2.5">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px] text-warning">
              lightbulb
            </span>
            <p className="font-caption text-caption leading-tight text-text-secondary">
              <span className="font-bold text-text-primary">AI Insight:</span>{" "}
              {insight}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-alt px-2 py-1.5 text-center">
          <div>
            <span className="block font-micro text-micro text-text-secondary">
              Protein
            </span>
            <span className="font-label-prominent text-label-prominent text-primary-container">
              {protein}g
            </span>
          </div>
          <div>
            <span className="block font-micro text-micro text-text-secondary">
              Karbo
            </span>
            <span className="font-label-prominent text-label-prominent text-text-primary">
              {karbo}g
            </span>
          </div>
          <div>
            <span className="block font-micro text-micro text-text-secondary">
              Lemak
            </span>
            <span className="font-label-prominent text-label-prominent text-text-primary">
              {lemak}g
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {onAksi ? (
            <button type="button" onClick={onAksi} className={tombolUtama}>
              <span className="material-symbols-outlined text-[18px]">
                {aksiIcon}
              </span>
              {aksiLabel}
            </button>
          ) : (
            <Link href={href || `/menu/${r.id}`} className={tombolUtama}>
              <span className="material-symbols-outlined text-[18px]">
                {aksiIcon}
              </span>
              {aksiLabel}
            </Link>
          )}

          <button
            type="button"
            onClick={() => toggleFavorit(r.id)}
            title={disukai ? "Hapus dari favorit" : "Simpan ke favorit"}
            aria-label={disukai ? "Hapus dari favorit" : "Simpan ke favorit"}
            aria-pressed={disukai}
            className={`${tombolIkon} ${disukai ? "!bg-primary-soft !text-rail-blue" : ""}`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${disukai ? "ms-fill" : ""}`}
            >
              {disukai ? "bookmark" : "bookmark_border"}
            </span>
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              title="Edit rekomendasi menu ini"
              aria-label="Edit menu"
              className={tombolIkon}
            >
              <span className="material-symbols-outlined text-[20px]">
                edit
              </span>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="Hapus menu dari jadwal"
              aria-label="Hapus menu"
              className={`${tombolIkon} hover:!bg-danger-soft hover:!text-danger`}
            >
              <span className="material-symbols-outlined text-[20px]">
                delete
              </span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
