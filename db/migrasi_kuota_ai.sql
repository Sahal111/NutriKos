-- Migrasi: kuota harian pemakaian AI. Aman dijalankan berulang.
-- ===== Kuota harian pemakaian AI per pengguna =====
-- Dicek oleh server (/api/rekomendasi) sebelum memanggil AI. Hari dihitung menurut WIB (Asia/Jakarta).
create table if not exists pakai_ai (
  pengguna_id uuid not null references pengguna(id) on delete cascade,
  tanggal     date not null,
  jumlah      integer not null default 0,
  primary key (pengguna_id, tanggal)
);
alter table pakai_ai enable row level security;   -- tanpa policy: tidak bisa diakses langsung, hanya lewat fungsi di bawah

-- Mencatat satu pemakaian untuk pengguna yang sedang masuk. true = masih dalam kuota `maks`, false = kuota hari ini habis.
create or replace function public.catat_pakai_ai(maks integer) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  if auth.uid() is null then return false; end if;
  insert into public.pakai_ai (pengguna_id, tanggal, jumlah)
  values (auth.uid(), (now() at time zone 'Asia/Jakarta')::date, 1)
  on conflict (pengguna_id, tanggal) do update set jumlah = public.pakai_ai.jumlah + 1
  returning jumlah into n;
  return n <= greatest(maks, 0);
end $$;

revoke all on function public.catat_pakai_ai(integer) from public, anon;
grant execute on function public.catat_pakai_ai(integer) to authenticated;
