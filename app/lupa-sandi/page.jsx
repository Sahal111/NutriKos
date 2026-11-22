"use client";
import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { kirimResetSandi } from "@/lib/auth";

export default function LupaSandi() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [terkirim, setTerkirim] = useState(false);
  const [loading, setLoading] = useState(false);

  const kirim = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await kirimResetSandi(email);
      setTerkirim(true);
    } catch (x) {
      setErr(x.message);
    }
    setLoading(false);
  };

  return (
    <AuthShell
      judul="Lupa kata sandi"
      sub="Masukkan email akunmu, kami kirim tautan untuk membuat kata sandi baru."
      footer={
        <>
          Ingat kata sandimu?{" "}
          <Link
            href="/login"
            className="font-bold text-brand-dark hover:underline"
          >
            Masuk
          </Link>
        </>
      }
    >
      {terkirim ? (
        <p
          role="status"
          className="rounded-xl bg-brand-light px-3 py-3 text-sm font-semibold text-brand-deeper"
        >
          Jika email terdaftar, tautan reset sudah dikirim. Cek kotak masuk atau
          folder spam.
        </p>
      ) : (
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            {loading ? "Mengirim..." : "Kirim tautan reset"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
