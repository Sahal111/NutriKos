import Link from "next/link";

export default function AuthShell({ judul, sub, footer, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-light to-white px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Logo NutriKos"
            className="h-10 w-10 object-contain"
          />
          <span className="text-2xl font-extrabold tracking-tight">
            <span className="text-brand-dark">Nutri</span>
            <span className="text-accent">Kos</span>
          </span>
        </Link>
        <div className="card p-6 sm:p-8">
          <h1 className="text-xl font-extrabold">{judul}</h1>
          <p className="mt-1 text-sm text-slate-600">{sub}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-5 text-center text-sm text-slate-600">{footer}</p>
      </div>
    </main>
  );
}
