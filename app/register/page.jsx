"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import { useApp } from "@/components/AppProvider";
import { register } from "@/lib/auth";

export default function Register() {
  const router = useRouter();
  const { setProfile } = useApp();
  const [f, setF] = useState({ nama: "", email: "", sandi: "", ulang: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const ubah = (patch) => setF((s) => ({ ...s, ...patch }));

  const kirim = async (e) => {
    e.preventDefault();
    setErr("");
    if (f.sandi !== f.ulang)
      return setErr("Kata sandi dan pengulangannya tidak sama.");
    setLoading(true);
    try {
      const u = await register(f);
      setProfile({ nama: u.nama, email: u.email });
      router.replace("/profil-kos"); // akun baru langsung atur profil kos
    } catch (x) {
      setErr(x.message);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      judul="Buat akun NutriKos"
      sub="Gratis. Cukup beberapa detik."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-bold text-brand-dark hover:underline"
          >
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={kirim} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="nama">
            Nama lengkap
          </label>
          <input
            id="nama"
            className="input"
            autoComplete="name"
            value={f.nama}
            onChange={(e) => ubah({ nama: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="nama@email.com"
            autoComplete="email"
            value={f.email}
            onChange={(e) => ubah({ email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="sandi">
            Kata sandi
          </label>
          <PasswordInput
            id="sandi"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            value={f.sandi}
            onChange={(e) => ubah({ sandi: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="ulang">
            Ulangi kata sandi
          </label>
          <PasswordInput
            id="ulang"
            autoComplete="new-password"
            value={f.ulang}
            onChange={(e) => ubah({ ulang: e.target.value })}
          />
        </div>
        {err && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
          >
            {err}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Daftar"}
        </button>
      </form>
    </AuthShell>
  );
}
