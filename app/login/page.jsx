"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import { login } from "@/lib/auth";

export default function Login() {
  const router = useRouter();
  const [f, setF] = useState({ email: "", sandi: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const kirim = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(f);
      router.replace("/beranda");
    } catch (x) {
      setErr(x.message);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      judul="Masuk ke NutriKos"
      sub="Lanjutkan atur menu hemat dan bergizimu."
      footer={
        <>
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-bold text-brand-dark hover:underline"
          >
            Daftar gratis
          </Link>
        </>
      }
    >
      <form onSubmit={kirim} className="space-y-4" noValidate>
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
            onChange={(e) => setF({ ...f, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="sandi">
            Kata sandi
          </label>
          <PasswordInput
            id="sandi"
            autoComplete="current-password"
            value={f.sandi}
            onChange={(e) => setF({ ...f, sandi: e.target.value })}
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
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </AuthShell>
  );
}
