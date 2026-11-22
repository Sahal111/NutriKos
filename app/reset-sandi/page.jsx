"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import { setSandiBaru } from "@/lib/auth";

export default function ResetSandi() {
  const router = useRouter();
  const [f, setF] = useState({ sandi: "", ulang: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const kirim = async (e) => {
    e.preventDefault();
    setErr("");
    if (f.sandi !== f.ulang)
      return setErr("Kata sandi dan pengulangannya tidak sama.");
    setLoading(true);
    try {
      await setSandiBaru(f.sandi);
      router.replace("/beranda");
    } catch (x) {
      setErr(x.message);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      judul="Buat kata sandi baru"
      sub="Masukkan kata sandi baru untuk akunmu."
      footer={null}
    >
      <form onSubmit={kirim} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="sandi">
            Kata sandi baru
          </label>
          <PasswordInput
            id="sandi"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            value={f.sandi}
            onChange={(e) => setF({ ...f, sandi: e.target.value })}
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
            onChange={(e) => setF({ ...f, ulang: e.target.value })}
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
          {loading ? "Menyimpan..." : "Simpan kata sandi"}
        </button>
      </form>
    </AuthShell>
  );
}
