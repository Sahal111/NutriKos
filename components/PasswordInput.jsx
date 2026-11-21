"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
}) {
  const [lihat, setLihat] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={lihat ? "text" : "password"}
        className="input pr-11"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
      />
      <button
        type="button"
        onClick={() => setLihat((v) => !v)}
        aria-label={lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
      >
        {lihat ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
