# Desain — Landing Corporate untuk saas-frontend

**Tanggal:** 2026-08-08 · **Status:** disetujui pengguna
**Referensi layout:** pola landing institusi/sekolah Indonesia (hero → keunggulan → sekilas → berita di bawah).

## Ringkasan

Homepage (`/`) saas-frontend diubah menjadi landing page corporate untuk
tenant (brand "Media Nusantara" dari API tenant): section corporate berbasis
**data mock** di bagian atas, lalu **artikel dari API** di bagian bawah.
Grid berita berpaginasi pindah ke halaman baru `/berita`; halaman profil
statis baru di `/tentang`. Halaman berita lain (kategori, tag, pencarian,
detail, 404) tidak berubah.

## Keputusan desain

### Gaya visual
- Palet: teal dalam `#065f5b` / `#0a8f88` (identitas), aksen oranye
  `#ff7849` (CTA & angka statistik), latar `#f7faf9`, teks `#1a2e2d`.
- CSS murni (tanpa framework), mobile-first, radius & shadow halus,
  konsisten dengan kartu artikel/thumbnail yang sudah ada.
- Bahasa copy: Indonesia.

### Section landing (urutan atas → bawah)
1. **Header corporate** — logo teks nama tenant (dari `getTenantInfo()`),
   nav: Beranda (anchor atas) · Layanan (anchor) · Tentang (`/tentang`) ·
   Kontak (anchor footer); tombol CTA "Hubungi Kami" (anchor footer).
   Mobile: hamburger menu (CSS/JS minimal).
2. **Hero** — gradien teal + pola halus CSS, judul besar, tagline
   "Menghadirkan informasi akurat dan berimbang untuk Nusantara", CTA ganda:
   "Jelajahi Berita" → `/berita`, "Tentang Kami" → `/tentang`.
3. **Layanan / Keunggulan** — 4 kartu ikon emoji: Berita Terkini, Liputan
   Multimedia, Kemitraan Konten, Layanan Iklan (judul + deskripsi singkat).
4. **Statistik** — 4 angka mock: 10+ Tahun Beroperasi · 14 Artikel Terbit ·
   4 Kategori · 1 Jt+ Pembaca/Bulan.
5. **Sekilas Profil** — dua kolom: placeholder ilustrasi CSS (bukan gambar)
   + paragraf singkat perusahaan + tombol "Selengkapnya" → `/tentang`.
6. **Berita Terbaru** — `getArticles(1, 6)` → 6 `ArticleCard` (dengan
   thumbnail) grid 3 kolom desktop / 1 kolom mobile + tombol
   "Lihat Semua Berita" → `/berita`.
7. **Footer corporate** — 4 kolom: brand + deskripsi, Kategori (4 link
   `/kategori/*`), Navigasi (Berita, Tentang, Pencarian), Kontak mock
   (email, telepon, alamat Jakarta) + copyright.

### Halaman & struktur teknis
- **Baru:**
  - `src/layouts/Corporate.astro` — shell corporate (header + footer + slot).
  - `src/components/landing/HeroSection.astro`, `ServicesSection.astro`,
    `StatsSection.astro`, `ProfileSection.astro`, `LatestNewsSection.astro`,
    `CorporateFooter.astro`.
  - `src/lib/company.ts` — data mock bertipe (layanan, statistik, profil,
    kontak). Satu-satunya sumber konten mock.
  - `src/pages/berita/index.astro` — grid berpaginasi eksisting homepage
    (logika dipindah utuh: `getArticles(page)`, Pagination, error handling
    identik).
  - `src/pages/tentang.astro` — halaman profil statis (layout Corporate):
    hero kecil + teks profil mock + statistik ringkas + CTA kontak.
- **Diubah:**
  - `src/pages/index.astro` — jadi landing corporate.
  - `src/styles/global.css` — tambah blok style landing berprefix (`.landing-*`)
    tanpa mengubah rule eksisting; palet corporate didefinisikan sebagai
    CSS variables baru.
- **Tidak disentuh:** `Base.astro`, komponen artikel, halaman kategori/tag/
  pencarian/detail/404, proxy `/media`, `api.ts` (kecuali jika diperlukan —
  tidak direncanakan).

### Data & error handling
- Section mock (hero, layanan, statistik, profil, footer) tidak bergantung
  API — hanya nama tenant yang diambil dari `getTenantInfo()` dengan
  fallback `TENANT_HOST`.
- Section berita: `ApiError` → pesan ramah "Berita sedang tidak tersedia"
  di dalam section itu saja; section lain tetap render.
- Anchor scroll memakai `scroll-behavior: smooth`.

### Di luar scope (backlog)
- Konten corporate dinamis dari API (profil tenant kaya).
- Formulir kontak fungsional (kontak mock statis saja).
- Gambar asli untuk hero/profil (placeholder CSS).

## Verifikasi
- `npm run build` exit 0 tanpa error TS.
- Curl: `/` memuat section hero + layanan + statistik + ≥6 `artikel/` link;
  `/berita?page=2` memuat artikel; `/tentang` 200; halaman kategori/tag/
  pencarian/detail tetap 200 & tak berubah.
- Mobile: grid collapse ke 1 kolom (cek CSS, tidak butuh device).
