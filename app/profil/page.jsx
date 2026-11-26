"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Save, LogOut, Home as HomeIcon, CircleCheck } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { logout } from "@/lib/auth";
import { AVATARS, rupiah } from "@/lib/data";
import {
  UKURAN_HURUF,
  bacaUkuranHuruf,
  terapkanUkuranHuruf,
} from "@/lib/ukuranHuruf";

export default function ProfilSaya() {
  const router = useRouter();
  const { profile, setProfile, reset, ready } = useApp();
  const [form, setForm] = useState(null);
  const [toast, setToast] = useState(false);
  const [ukuran, setUkuran] = useState("normal");
  useEffect(() => setUkuran(bacaUkuranHuruf()), []);

  useEffect(() => {
  if (ready && !form) setForm(profile);
  }, [ready, form, profile]);
  if (!ready || !form) return null;

  const ubah = (patch) => setForm((f) => ({ ...f, ...patch }));
  const simpan = () => {
    if (!form.nama.trim()) return;
    setProfile({
      nama: form.nama.trim(),
      kampus: form.kampus.trim(),
      prodi: form.prodi.trim(),
      semester: form.semester,
      avatar: form.avatar,
    });
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };
    const keluar = async () => {
            if (
              confirm(
                "Keluar dari akun? Profil, favorit, riwayat, dan catatan gizi tetap tersimpan di akunmu. Rencana menu dan daftar belanja di perangkat ini akan dihapus.",
              )
            ) {
              await logout();
              reset();
              router.push("/");
            }
    };

  return (
    <div className="space-y-4 pb-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl lg:text-4xl">
          Profil Saya
        </h1>
        <p className="text-slate-600 sm:text-lg">
          Kelola informasi diri & preferensi kos
        </p>
      </div>

      {/* Avatar picker */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-light text-5xl ring-4 ring-brand-mint sm:h-28 sm:w-28 sm:text-6xl">
          {form.avatar}
        </div>
        <div className="label !mb-0">Pilih karakter kos</div>
        <div className="flex flex-wrap justify-center gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              aria-label={`Avatar ${a}`}
              onClick={() => ubah({ avatar: a })}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl transition-transform hover:scale-110 ${form.avatar === a ? "bg-brand-mint ring-2 ring-brand-dark" : "bg-slate-200"}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Form: 2-col on desktop */}
      <section className="card space-y-3 md:space-y-4">
        <h2 className="text-lg font-extrabold">Data Diri Mahasiswa</h2>
        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          <div>
            <label className="label" htmlFor="nama">
              Nama lengkap
            </label>
            <input
              id="nama"
              className="input"
              value={form.nama}
              onChange={(e) => ubah({ nama: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Alamat email
            </label>
            <input
              id="email"
              type="email"
              className="input cursor-not-allowed bg-slate-100 text-slate-500"
              value={form.email}
              readOnly
              aria-readonly="true"
            />
            <p className="mt-1 text-xs text-slate-500">
              Email mengikuti akunmu dan tidak bisa diubah di sini.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="kampus">
              Asal kampus
            </label>
            <input
              id="kampus"
              className="input"
              value={form.kampus}
              onChange={(e) => ubah({ kampus: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="prodi">
              Program studi
            </label>
            <input
              id="prodi"
              className="input"
              value={form.prodi}
              onChange={(e) => ubah({ prodi: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="smt">
              Semester saat ini
            </label>
            <select
              id="smt"
              className="input"
              value={form.semester}
              onChange={(e) => ubah({ semester: e.target.value })}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={String(s)}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Profil Kos summary */}
      <section className="card space-y-2 bg-brand-light/60">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <HomeIcon size={18} /> Profil Kos & Dapur
          </h2>
          <span className="rounded-full bg-brand-dark px-2 py-0.5 text-xs font-bold text-white">
            Aktif
          </span>
        </div>
        <div className="grid gap-3 rounded-xl bg-white p-3 text-sm sm:grid-cols-3">
          <div>
            <span className="text-xs text-slate-500">Bujet harian</span>
            <br />
            <b>{rupiah(profile.budget)} / hari</b>
          </div>
          <div>
            <span className="text-xs text-slate-500">Peralatan masak</span>
            <br />
            <b>{profile.alat.join(", ") || "Tidak ada"}</b>
          </div>
          <div>
            <span className="text-xs text-slate-500">Lokasi kos</span>
            <br />
            <b>{profile.lokasi}</b>
          </div>
        </div>
        <Link
          href="/profil-kos"
          className="text-sm font-bold text-brand-dark underline"
        >
          Ubah Profil Kos
        </Link>
      </section>

      {/* Tampilan */}
      <section className="card space-y-3">
        <h2 className="text-lg font-extrabold">Tampilan</h2>
        <div className="label">Ukuran huruf</div>
        <div
          className="grid grid-cols-3 gap-2"
          role="radiogroup"
          aria-label="Ukuran huruf"
        >
          {UKURAN_HURUF.map((u) => (
            <button
              key={u.kode}
              type="button"
              role="radio"
              aria-checked={ukuran === u.kode}
              onClick={() => setUkuran(terapkanUkuranHuruf(u.kode))}
              className={`rounded-xl py-3 text-sm font-bold transition-colors ${ukuran === u.kode ? "bg-brand-dark text-white" : "bg-slate-100 hover:bg-slate-200"}`}
            >
              {u.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Pengaturan ini tersimpan di perangkat ini.
        </p>
      </section>

      {toast && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl bg-brand-deeper px-4 py-3 text-sm font-bold text-white"
        >
          <CircleCheck size={18} /> Perubahan berhasil disimpan
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <button onClick={simpan} className="btn btn-primary flex-1">
          <Save size={18} /> Simpan Perubahan
        </button>
        <button
          onClick={() => {
            setForm(profile);
            router.push("/beranda");
          }}
          className="btn btn-soft flex-1"
        >
          Batal
        </button>
      </div>
      <button
        onClick={keluar}
        className="mx-auto flex items-center gap-2 text-sm font-bold text-red-600"
      >
        <LogOut size={16} /> Keluar dari Akun
      </button>
    </div>
  );
}
