-- Skema basis data NutriKos (PostgreSQL / Supabase) sesuai Tabel 3.1 dan Gambar 3.6 proposal.
-- STATUS: belum terhubung ke aplikasi (aplikasi masih memakai localStorage). Ini rancangan siap pakai untuk tahap berikutnya.
-- Nilai gizi disimpan per 100 g (TKPI 2017); biaya dan gizi menu dihitung dari tabel bahan, tidak disimpan.

-- ===== Data pengguna =====
create table pengguna (
  id              uuid primary key default gen_random_uuid(),
  nama            text not null,
  email           text not null unique,
  kata_sandi_hash text not null,                 -- bcrypt, tidak pernah menyimpan kata sandi asli
  kampus          text,
  program_studi   text,
  semester        smallint check (semester between 1 and 14),
  avatar          text,
  dibuat_pada     timestamptz not null default now()
);

create table token_pemulihan (                   -- Lupa Kata Sandi
  id            bigint generated always as identity primary key,
  pengguna_id   uuid not null references pengguna(id) on delete cascade,
  token_hash    text not null,                   -- simpan hash token, bukan tokennya
  kedaluwarsa   timestamptz not null
);

create table profil_kos (                        -- satu pengguna satu profil
  id                bigint generated always as identity primary key,
  pengguna_id       uuid not null unique references pengguna(id) on delete cascade,
  budget_harian     integer not null check (budget_harian between 10000 and 100000),
  alat_masak        text[] not null default '{}',
  alergi_pantangan  text[] not null default '{}',
  jenis_kelamin     text check (jenis_kelamin in ('Laki-laki', 'Perempuan'))   -- menentukan target AKG
);

-- ===== Data referensi (diisi pengembang) =====
create table bahan (
  id              bigint generated always as identity primary key,
  kunci           text not null unique,          -- kata kunci pencocokan stok, mis. 'bawang' (dipakai aplikasi saat ini)
  nama            text not null,
  kategori        text not null check (kategori in ('karbohidrat', 'protein', 'sayur', 'lainnya')),
  satuan          text not null,
  harga_rata_rata integer not null check (harga_rata_rata >= 0),   -- rujukan PIHPS Nasional BI, diperbarui manual
  energi          numeric(7,2) not null,         -- per 100 g
  protein         numeric(7,2) not null,
  karbohidrat     numeric(7,2) not null,
  lemak           numeric(7,2) not null,
  serat           numeric(7,2) not null
);

create table resep (
  id                    text primary key,        -- slug, sama dengan id di lib/data.js
  nama                  text not null,
  alat_masak_dibutuhkan text[] not null default '{}',
  langkah               text[] not null,
  waktu_masak           smallint not null check (waktu_masak > 0),
  jumlah_porsi          smallint not null default 1 check (jumlah_porsi > 0)
);

create table resep_bahan (
  resep_id  text   not null references resep(id)  on delete cascade,
  bahan_id  bigint not null references bahan(id),
  jumlah    numeric(8,2) not null check (jumlah > 0),   -- gram, dipakai untuk menghitung gizi dan biaya
  primary key (resep_id, bahan_id)
);

-- ===== Data pengguna yang terhubung ke akun (pengguna_id) =====
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
  waktu_makan text not null check (waktu_makan in ('pagi', 'siang', 'malam'))
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

-- Catatan desain: pada ERD proposal kunci riwayat_menu adalah (pengguna_id, resep_id), sehingga satu resep
-- hanya bisa tercatat sekali seumur akun. Agar resep yang sama boleh direkomendasikan lagi di hari lain,
-- tanggal dimasukkan ke kunci. Perbarui Gambar 3.6 bila disetujui.
create table riwayat_menu (
  pengguna_id uuid not null references pengguna(id) on delete cascade,
  resep_id    text not null references resep(id),
  tanggal     date not null default current_date,
  primary key (pengguna_id, resep_id, tanggal)
);

-- ===== Keamanan: setiap pengguna hanya dapat mengakses datanya sendiri (N3) =====
-- Bila lewat Supabase (PostgREST) pakai Row Level Security dengan auth.uid(). Bila memakai API Route + JWT sendiri,
-- sertakan 'where pengguna_id = <id dari token>' di setiap query.
-- alter table profil_kos enable row level security;
-- create policy hanya_milik_sendiri on profil_kos using (pengguna_id = auth.uid());
-- (ulangi untuk bahan_sisa, jadwal_makan, daftar_belanja, favorit, riwayat_menu, token_pemulihan)

create index on jadwal_makan (pengguna_id, tanggal);
create index on riwayat_menu (pengguna_id, tanggal);
create index on bahan_sisa (pengguna_id);
create index on daftar_belanja (pengguna_id);
