import Link from 'next/link';
import { Clock, Edit3, Trash2 } from 'lucide-react';
import { rupiah, SLOT_LABEL } from '@/lib/data';

export default function RecipeCard({
  recipe,
  action,
  aksiLabel = 'Masak Ini Saja',
  onAksi,
  secondary,
  onEdit,
  onDelete,
  porsi = 1,
}) {
  const hargaTotal = Math.round(recipe.harga * porsi);
  const proteinTotal = Math.round(recipe.protein * porsi);
  const kaloriTotal = Math.round(recipe.kalori * porsi);

  return (
    <div className="card flex flex-col justify-between border border-slate-100 hover:border-slate-200 transition-all hover:shadow-md">
      <div>
        <div className="flex gap-3 sm:gap-4">
          <Link
            href={`/menu/${recipe.id}`}
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-brand-light text-4xl sm:h-24 sm:w-24 sm:text-5xl md:h-28 md:w-28 md:rounded-2xl transition-transform hover:scale-105"
          >
            {recipe.emoji}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-base font-extrabold text-accent sm:text-lg">
                  {rupiah(hargaTotal)}
                </span>
                {porsi > 1 && (
                  <span className="ml-1.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                    {porsi} Porsi
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                <Clock size={12} />
                {recipe.waktu} mnt
              </span>
            </div>

            <Link
              href={`/menu/${recipe.id}`}
              className="mt-1 block font-bold leading-snug sm:text-base hover:text-brand-dark transition-colors line-clamp-2"
            >
              {recipe.nama}
            </Link>

            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold sm:text-xs">
              <span className="rounded-full bg-brand-light px-2 py-0.5 text-brand-dark">
                {proteinTotal}g Protein
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                {kaloriTotal} kcal
              </span>
              {action && recipe.slot && (
                <span className="rounded-full bg-accent-light px-2 py-0.5 text-amber-800">
                  {SLOT_LABEL[recipe.slot]}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Button Actions */}
      <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center gap-2">
        {onAksi ? (
          <button
            onClick={onAksi}
            className={`btn flex-1 py-2.5 text-xs sm:text-sm ${
              secondary ? 'btn-soft' : 'btn-primary'
            }`}
          >
            {aksiLabel}
          </button>
        ) : (
          <Link
            href={`/menu/${recipe.id}`}
            className="btn btn-soft flex-1 py-2.5 text-xs sm:text-sm text-brand-dark"
          >
            {aksiLabel}
          </Link>
        )}

        {onEdit && (
          <button
            onClick={onEdit}
            title="Edit rekomendasi menu ini"
            aria-label="Edit menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
          >
            <Edit3 size={16} />
          </button>
        )}

        {onDelete && (
          <button
            onClick={onDelete}
            title="Hapus menu dari jadwal"
            aria-label="Hapus menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
