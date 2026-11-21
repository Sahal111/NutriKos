import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  HeartPulse,
  Leaf,
  Refrigerator,
  Settings,
  ShoppingBag,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";

const FITUR = [
  {
    Icon: UtensilsCrossed,
    judul: "Rekomendasi Menu",
    isi: "Menu harian sesuai bujet, alat masak, dan pantanganmu.",
  },
  {
    Icon: Refrigerator,
    judul: "Cek Bahan Sisa",
    isi: "Punya telur dan kol saja? Dapatkan ide masakan dari stok di kosmu.",
  },
  {
    Icon: ShoppingBag,
    judul: "Daftar Belanja",
    isi: "Bahan terkumpul otomatis lengkap dengan estimasi biaya.",
  },
  {
    Icon: HeartPulse,
    judul: "Gizi Mingguan",
    isi: "Skor protein, karbohidrat, dan sayur dibandingkan dengan AKG 2019.",
  },
  {
    Icon: Bot,
    judul: "Asisten AI",
    isi: "AI memilih menu dari database resep. Gizi dan biaya tetap dihitung sistem.",
  },
  {
    Icon: Settings,
    judul: "Profil Kos",
    isi: "Atur bujet harian, alat masak, pantangan, dan lokasi sekali saja.",
  },
];

const LANGKAH = [
  ["Atur Profil Kos", "Isi bujet harian, alat masak, dan pantangan makananmu."],
  ["Dapatkan Menu", "NutriKos menyusun menu hemat dan bergizi untuk hari ini."],
  [
    "Belanja dan Masak",
    "Ikuti daftar belanja, masak, lalu pantau gizimu seminggu.",
  ],
];

const Logo = ({ size = "h-9 w-9", teks = "text-xl" }) => (
  <span className="flex items-center gap-2.5">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="/logo.png"
      alt="Logo NutriKos"
      className={`${size} object-contain`}
    />
    <span className={`${teks} font-extrabold tracking-tight`}>
      <span className="text-brand-dark">Nutri</span>
      <span className="text-accent">Kos</span>
    </span>
  </span>
);

export default function Landing() {
  return (
    <div className="bg-white text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="NutriKos">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <a href="#fitur" className="hover:text-brand-dark">
              Fitur
            </a>
            <a href="#cara-kerja" className="hover:text-brand-dark">
              Cara Kerja
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              Masuk
            </Link>
            <Link href="/register" className="btn btn-primary !py-2">
              Daftar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-light/70 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-mint px-3 py-1 text-xs font-bold text-brand-deeper">
              <Leaf size={14} /> Untuk mahasiswa perantau
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
              Makan <span className="text-brand-dark">bergizi</span> di kos,
              tanpa bikin <span className="text-accent">kantong jebol</span>.
            </h1>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              NutriKos menyusun menu harian sesuai bujet, alat masak, dan
              pantanganmu, lengkap dengan daftar belanja dan pelacak gizi
              mingguan.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="btn btn-primary px-6">
                Mulai Gratis <ArrowRight size={18} />
              </Link>
              <Link href="/login" className="btn btn-soft px-6">
                Saya sudah punya akun
              </Link>
            </div>
            <ul className="mt-6 space-y-2 text-sm font-semibold text-slate-600">
              {[
                "Sesuai bujet harian anak kos",
                "Bisa difilter pantangan, termasuk 100% halal",
                "Cukup rice cooker dan kompor",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check size={16} className="text-brand" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Contoh tampilan (ilustrasi statis, bukan data nyata) */}
          <div className="card mx-auto w-full max-w-md space-y-4 p-5 shadow-xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">
                Menu hari ini
              </span>
              <span className="rounded-full bg-accent-light px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                Contoh tampilan
              </span>
            </div>
            {[
              ["Sarapan", "Telur dadar + nasi"],
              ["Makan siang", "Tempe orek + tumis kol"],
              ["Makan malam", "Nasi + sayur bening"],
            ].map(([waktu, menu]) => (
              <div
                key={waktu}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-brand-dark">
                  <UtensilsCrossed size={18} />
                </span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {waktu}
                  </div>
                  <div className="text-sm font-semibold">{menu}</div>
                </div>
              </div>
            ))}
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <Wallet size={14} /> Bujet harian
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-4/5 rounded-full bg-brand" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section
        id="fitur"
        className="mx-auto max-w-6xl scroll-mt-16 px-4 py-14 sm:px-6"
      >
        <h2 className="text-center text-2xl font-extrabold sm:text-3xl">
          Semua yang anak kos butuhkan
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
          Dari memilih menu sampai memantau gizi, semua di satu tempat.
        </p>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FITUR.map(({ Icon, judul, isi }) => (
            <div key={judul} className="card border border-slate-100 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand-dark">
                <Icon size={22} />
              </span>
              <h3 className="mt-4 font-bold">{judul}</h3>
              <p className="mt-1 text-sm text-slate-600">{isi}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cara kerja */}
      <section id="cara-kerja" className="scroll-mt-16 bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold sm:text-3xl">
            Cara kerja
          </h2>
          <ol className="mt-9 grid gap-5 md:grid-cols-3">
            {LANGKAH.map(([judul, isi], i) => (
              <li key={judul} className="card p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-dark text-sm font-extrabold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-bold">{judul}</h3>
                <p className="mt-1 text-sm text-slate-600">{isi}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA akhir */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="rounded-3xl bg-brand-dark px-6 py-10 text-center text-white sm:py-14">
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            Siap makan sehat dan hemat?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-brand-light">
            Buat akun gratis dan dapatkan menu pertamamu hari ini.
          </p>
          <Link
            href="/register"
            className="btn mt-6 bg-white px-6 text-brand-dark hover:bg-brand-light"
          >
            Daftar Sekarang <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-center text-xs text-slate-500 sm:flex-row sm:px-6 sm:text-left">
          <Logo size="h-7 w-7" teks="text-base" />
          <p>
            Karya SEVENT X National Competition. Mendukung SDG 2 (Tanpa
            Kelaparan). Data resep dan harga adalah estimasi contoh.
          </p>
        </div>
      </footer>
    </div>
  );
}
