-- Skema basis data NutriKos (PostgreSQL / Supabase) sesuai Tabel 3.1 dan Gambar 3.6 proposal.
-- Jalankan di Supabase: SQL Editor -> New query -> tempel semua -> Run.
-- Autentikasi memakai Supabase Auth (auth.users); tabel `pengguna` menyimpan profil dan diisi otomatis oleh trigger.
-- Nilai gizi disimpan per 100 g (TKPI 2017); biaya dan gizi menu dihitung dari tabel bahan, tidak disimpan.

-- ===== Data pengguna =====
create table pengguna (
  id            uuid primary key references auth.users(id) on delete cascade,
  nama          text not null default '',
  email         text not null,
  kampus        text,
  program_studi text,
  semester      smallint check (semester between 1 and 14),
  avatar        text,
  dibuat_pada   timestamptz not null default now()
);

create table profil_kos (                        -- satu pengguna satu profil
  id                bigint generated always as identity primary key,
  pengguna_id       uuid not null unique references pengguna(id) on delete cascade,
  budget_harian     integer not null check (budget_harian between 10000 and 100000),
  alat_masak        text[] not null default '{}',
  alergi_pantangan  text[] not null default '{}',
  jenis_kelamin     text check (jenis_kelamin in ('Laki-laki', 'Perempuan')),   -- menentukan target AKG
  lokasi            text,
  stok              text[] not null default '{}'  -- bahan sisa (teks bebas); pindah ke tabel bahan_sisa bila tabel bahan sudah terisi
);

-- ===== Data referensi (diisi pengembang) =====
create table bahan (
  id              bigint generated always as identity primary key,
  kunci           text not null unique,
  nama            text not null,
  kategori        text not null check (kategori in ('karbohidrat', 'protein', 'sayur', 'lainnya')),
  satuan          text not null,
  harga_rata_rata integer not null check (harga_rata_rata >= 0),
  energi          numeric(7,2) not null,
  protein         numeric(7,2) not null,
  karbohidrat     numeric(7,2) not null,
  lemak           numeric(7,2) not null,
  serat           numeric(7,2) not null
);

create table resep (
  id                    text primary key,
  nama                  text not null,
  alat_masak_dibutuhkan text[] not null default '{}',
  langkah               text[] not null,
  waktu_masak           smallint not null check (waktu_masak > 0),
  jumlah_porsi          smallint not null default 1 check (jumlah_porsi > 0)
);

create table resep_bahan (
  resep_id  text   not null references resep(id)  on delete cascade,
  bahan_id  bigint not null references bahan(id),
  jumlah    numeric(8,2) not null check (jumlah > 0),
  primary key (resep_id, bahan_id)
);

-- ===== Data pengguna lainnya (terhubung ke pengguna_id) =====
create table bahan_sisa (
  id          bigint generated always as identity primary key,
  pengguna_id uuid   not null references pengguna(id) on delete cascade,
  bahan_id    bigint not null references bahan(id),
  jumlah      numeric(8,2) not null check (jumlah > 0)
);

create table jadwal_makan (
  id          bigint generated always as identity primary key,
  pengguna_id uuid not null references pengguna(id) on delete cascade,
  resep_id    text not null references resep(id),
  tanggal     date not null,
  waktu_makan text not null check (waktu_makan in ('pagi', 'siang', 'malam')),
  porsi       smallint not null default 1 check (porsi between 1 and 20),
  constraint jadwal_makan_unik unique (pengguna_id, tanggal, resep_id)   -- satu resep dicatat sekali per hari
);

create table daftar_belanja (
  id            bigint generated always as identity primary key,
  pengguna_id   uuid   not null references pengguna(id) on delete cascade,
  bahan_id      bigint not null references bahan(id),
  jumlah        numeric(8,2) not null check (jumlah > 0),
  harga         integer not null check (harga >= 0),
  sudah_dibeli  boolean not null default false
);

create table favorit (
  pengguna_id uuid not null references pengguna(id) on delete cascade,
  resep_id    text not null references resep(id),
  tanggal     date not null default current_date,
  primary key (pengguna_id, resep_id)
);

-- Catatan desain: tanggal dimasukkan ke kunci agar resep yang sama boleh tercatat lagi di hari lain
-- (perbarui Gambar 3.6 proposal bila disetujui).
create table riwayat_menu (
  pengguna_id uuid not null references pengguna(id) on delete cascade,
  resep_id    text not null references resep(id),
  tanggal     date not null default current_date,
  primary key (pengguna_id, resep_id, tanggal)
);

create index on jadwal_makan (pengguna_id, tanggal);
create index on riwayat_menu (pengguna_id, tanggal);
create index on bahan_sisa (pengguna_id);
create index on daftar_belanja (pengguna_id);

-- ===== Otomatis buat baris `pengguna` saat ada akun baru di Supabase Auth =====
create function public.saat_daftar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.pengguna (id, nama, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nama', ''), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger saat_daftar after insert on auth.users
for each row execute function public.saat_daftar();

-- Akun yang sudah terlanjur dibuat sebelum trigger ada:
insert into public.pengguna (id, nama, email)
select id, coalesce(raw_user_meta_data->>'nama', ''), email from auth.users
on conflict (id) do nothing;

-- ===== Keamanan (N3): setiap pengguna hanya dapat mengakses datanya sendiri =====
alter table pengguna       enable row level security;
alter table profil_kos     enable row level security;
alter table bahan_sisa     enable row level security;
alter table jadwal_makan   enable row level security;
alter table daftar_belanja enable row level security;
alter table favorit        enable row level security;
alter table riwayat_menu   enable row level security;
alter table bahan          enable row level security;
alter table resep          enable row level security;
alter table resep_bahan    enable row level security;

create policy milik_sendiri on pengguna
  for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy milik_sendiri on profil_kos
  for all to authenticated
  using (pengguna_id = (select auth.uid())) with check (pengguna_id = (select auth.uid()));
create policy milik_sendiri on bahan_sisa
  for all to authenticated
  using (pengguna_id = (select auth.uid())) with check (pengguna_id = (select auth.uid()));
create policy milik_sendiri on jadwal_makan
  for all to authenticated
  using (pengguna_id = (select auth.uid())) with check (pengguna_id = (select auth.uid()));
create policy milik_sendiri on daftar_belanja
  for all to authenticated
  using (pengguna_id = (select auth.uid())) with check (pengguna_id = (select auth.uid()));
create policy milik_sendiri on favorit
  for all to authenticated
  using (pengguna_id = (select auth.uid())) with check (pengguna_id = (select auth.uid()));
create policy milik_sendiri on riwayat_menu
  for all to authenticated
  using (pengguna_id = (select auth.uid())) with check (pengguna_id = (select auth.uid()));

-- Data referensi: semua pengguna yang sudah masuk boleh membaca, tidak boleh mengubah.
create policy baca_saja on bahan       for select to authenticated using (true);
create policy baca_saja on resep       for select to authenticated using (true);
create policy baca_saja on resep_bahan for select to authenticated using (true);