# Landing Corporate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah homepage saas-frontend menjadi landing page corporate (data mock di atas, artikel API di bawah), dengan arsip berita di `/berita` dan profil statis di `/tentang`.

**Architecture:** Layout baru `Corporate.astro` terpisah dari layout berita `Base.astro` (tidak disentuh). Konten mock bertipe di `src/lib/company.ts`; section-section presentational di `src/components/landing/*`; halaman yang mengambil data API (`index.astro`, `/berita`) menangani error dan meneruskan data ke komponen.

**Tech Stack:** Astro 5 SSR, TypeScript, CSS murni (append ke `src/styles/global.css`), tanpa dependensi baru.

**Spec:** `docs/superpowers/specs/2026-08-08-corporate-landing-design.md`

## Global Constraints

- Bahasa UI & copy: **Bahasa Indonesia**.
- Palet corporate: `#065f5b` / `#0a8f88` (teal identitas), `#ff7849` (aksen CTA & statistik), `#f7faf9` (latar), `#1a2e2d` (teks). CSS variables baru berprefix `--corp-*`.
- Semua class CSS baru berprefix `landing-` atau `corp-` — **jangan ubah rule CSS eksisting** (halaman berita tetap tampil sama).
- Mobile-first; grid collapse ke 1 kolom di layar sempit; `html { scroll-behavior: smooth; }`.
- Dev server Astro sudah jalan di :4321 (log `/tmp/astro-dev.log`); cms-api di :8080 — jangan restart.
- Jangan sentuh: `Base.astro`, `api.ts`, `format.ts`, komponen `ArticleCard/Pagination/SearchBox/BannerSlot`, halaman kategori/tag/pencarian/detail/404, proxy `/media`.
- Verifikasi proyek ini berbasis curl + `npm run build` (tidak ada test runner frontend) — jalankan perintah verifikasi tiap task.
- Commit per task dengan pesan yang ditentukan; push `origin main` setelah semua task.

---

### Task 1: Data mock `src/lib/company.ts`

**Files:**
- Create: `src/lib/company.ts`

**Interfaces:**
- Produces: `TAGLINE: string`, `SERVICES: ServiceItem[]`, `STATS: StatItem[]`, `PROFILE: { short: string; long: string[] }`, `CONTACTS: { email: string; phone: string; address: string }` dengan `interface ServiceItem { icon: string; title: string; description: string }` dan `interface StatItem { value: string; label: string }`. Task 4 memakai semuanya persis dengan nama ini.

- [ ] **Step 1: Tulis file**

```ts
// Data mock corporate (v1) — satu-satunya sumber konten landing.
// Konten statis; bila nanti dinamis, ganti sumber di sini saja.

export interface ServiceItem {
  icon: string;
  title: string;
  description: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export const TAGLINE =
  'Menghadirkan informasi akurat dan berimbang untuk Nusantara';

export const SERVICES: ServiceItem[] = [
  {
    icon: '📰',
    title: 'Berita Terkini',
    description:
      'Informasi politik, ekonomi, teknologi, dan olahraga yang cepat, akurat, dan terverifikasi.',
  },
  {
    icon: '🎥',
    title: 'Liputan Multimedia',
    description:
      'Konten foto dan video jurnalistik dari tim peliput di berbagai daerah.',
  },
  {
    icon: '🤝',
    title: 'Kemitraan Konten',
    description:
      'Sindikasi berita dan kolaborasi konten dengan media serta institusi.',
  },
  {
    icon: '📣',
    title: 'Layanan Iklan',
    description:
      'Penempatan banner dan konten bersponsor untuk menjangkau pembaca kami.',
  },
];

export const STATS: StatItem[] = [
  { value: '10+', label: 'Tahun Beroperasi' },
  { value: '14', label: 'Artikel Terbit' },
  { value: '4', label: 'Kategori Berita' },
  { value: '1 Jt+', label: 'Pembaca per Bulan' },
];

export const PROFILE = {
  short:
    'PT Media Nusantara adalah perusahaan media digital yang menghadirkan jurnalisme independen, cepat, dan berimbang untuk pembaca di seluruh Nusantara.',
  long: [
    'Berdiri sejak lebih dari satu dekade lalu, PT Media Nusantara tumbuh dari ruang redaksi kecil menjadi portal berita multi-platform yang dipercaya jutaan pembaca setiap bulannya. Kami meliput politik, ekonomi, teknologi, dan olahraga dengan standar verifikasi yang ketat.',
    'Redaksi kami didukung tim multimedia yang memproduksi foto dan video jurnalistik, serta jaringan koresponden di berbagai daerah. Setiap berita melalui proses penyuntingan berjenjang sebelum dipublikasikan.',
    'Selain penerbitan berita, kami membuka kemitraan sindikasi konten dengan media dan institusi, serta layanan periklanan digital yang transparan dan terukur.',
  ],
};

export const CONTACTS = {
  email: 'info@media-nusantara.com',
  phone: '(021) 555-0123',
  address: 'Jl. Kebon Sirih No. 10, Jakarta Pusat, Indonesia',
};
```

- [ ] **Step 2: Verifikasi**

Run: `npm run build` → Expected: exit 0 tanpa error TS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/company.ts && git commit -m "feat: data mock corporate (company.ts)"
```

---

### Task 2: Halaman arsip berita `/berita`

**Files:**
- Create: `src/pages/berita/index.astro`

**Interfaces:**
- Consumes: `Base.astro` (props `title, description?`), `ArticleCard`, `Pagination` (props `page, totalPages, basePath`), `getArticles(page, perPage?)`, `Meta` dari `../lib/api` — semua sudah ada.
- Produces: rute `/berita` (grid berpaginasi) — target tombol "Lihat Semua Berita" di Task 5.

- [ ] **Step 1: Tulis halaman (pindah utuh logika homepage saat ini, basePath `/berita`)**

```astro
---
import Base from '../../layouts/Base.astro';
import ArticleCard from '../../components/ArticleCard.astro';
import Pagination from '../../components/Pagination.astro';
import { getArticles } from '../../lib/api';
import type { Article, Meta } from '../../lib/api';

let articles: Article[] = [];
let meta: Meta | null = null;
let errorMsg = '';

const rawPage = Astro.url.searchParams.get('page');
const page = (() => {
  const n = rawPage ? parseInt(rawPage, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
})();

try {
  const res = await getArticles(page);
  articles = res.data;
  meta = res.meta;
} catch {
  errorMsg = 'Konten sedang tidak tersedia';
}
---
<Base title="Berita" description="Arsip berita terbaru dari semua kategori">
  {errorMsg ? (
    <div class="error-message">
      <p>{errorMsg}</p>
    </div>
  ) : (
    <>
      <div class="article-grid">
        {articles.map((a) => <ArticleCard article={a} />)}
      </div>
      {meta && (
        <Pagination page={meta.page} totalPages={meta.total_pages} basePath="/berita" />
      )}
    </>
  )}
</Base>
```

- [ ] **Step 2: Verifikasi**

```bash
curl -s http://localhost:4321/berita | grep -c "artikel/"        # expected >= 10
curl -s "http://localhost:4321/berita?page=2" | grep -c "artikel/"  # expected >= 1
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/    # expected 200 (homepage lama belum berubah)
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/berita/ && git commit -m "feat: halaman arsip berita /berita"
```

---

### Task 3: Layout Corporate + footer + halaman `/tentang`

**Files:**
- Create: `src/layouts/Corporate.astro`
- Create: `src/components/landing/CorporateFooter.astro`
- Create: `src/pages/tentang.astro`
- Modify: `src/styles/global.css` (append blok CSS corporate di akhir file)

**Interfaces:**
- Consumes: `getTenantInfo()`, `getCategory(slug)`, `TENANT_HOST`, `Category` dari `src/lib/api` (pola sama dengan `Base.astro` baris 11-25); `PROFILE`, `CONTACTS` dari `../lib/company`.
- Produces: `<Corporate title={string} description?={string}>` shell — header nav corporate + `<slot />` + `CorporateFooter`; dipakai Task 5 (homepage) dan halaman `/tentang`. Footer punya `id="kontak"` (target anchor nav).

- [ ] **Step 1: Append CSS corporate ke `src/styles/global.css`** (append SETELAH baris terakhir `.error-message`, jangan ubah rule di atasnya)

```css
/* ===== Corporate landing (prefix .corp-* / .landing-*) ===== */
:root {
  --corp-primary: #065f5b;
  --corp-primary-2: #0a8f88;
  --corp-accent: #ff7849;
  --corp-bg: #f7faf9;
  --corp-text: #1a2e2d;
}

html { scroll-behavior: smooth; }

/* Header corporate */
.corp-header { background: #fff; border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 10; }
.corp-header .container { display: flex; align-items: center; justify-content: space-between; padding-top: 0.75rem; padding-bottom: 0.75rem; }
.corp-logo { font-size: 1.25rem; font-weight: 800; color: var(--corp-primary); }
.corp-logo:hover { text-decoration: none; color: var(--corp-primary-2); }

/* Hamburger (checkbox hack, tanpa JS) */
.corp-menu-toggle { display: none; }
.corp-hamburger { display: none; font-size: 1.5rem; cursor: pointer; color: var(--corp-primary); }

.corp-nav ul { list-style: none; display: flex; gap: 1.25rem; align-items: center; }
.corp-nav a { color: var(--corp-text); font-weight: 500; }
.corp-nav a:hover { color: var(--corp-primary-2); }
.corp-nav .corp-cta {
  background: var(--corp-accent); color: #fff; padding: 0.4rem 1rem;
  border-radius: 6px; font-weight: 600;
}
.corp-nav .corp-cta:hover { background: #f06a3c; color: #fff; text-decoration: none; }

@media (max-width: 720px) {
  .corp-hamburger { display: block; }
  .corp-nav { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border-bottom: 1px solid var(--color-border); display: none; }
  .corp-nav ul { flex-direction: column; align-items: stretch; gap: 0; padding: 0.5rem 0; }
  .corp-nav li a { display: block; padding: 0.6rem var(--gutter); }
  .corp-nav .corp-cta { margin: 0.5rem var(--gutter); text-align: center; border-radius: 6px; }
  .corp-menu-toggle:checked ~ .corp-nav { display: block; }
}

/* Section umum landing */
.landing-section { padding: 3rem 0; }
.landing-section-alt { background: var(--corp-bg); }
.landing-title { font-size: 1.5rem; color: var(--corp-primary); margin-bottom: 1.5rem; }

/* Hero */
.landing-hero {
  background: linear-gradient(135deg, var(--corp-primary), var(--corp-primary-2));
  background-image: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08) 0, rgba(255,255,255,0) 40%),
                    radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08) 0, rgba(255,255,255,0) 40%),
                    linear-gradient(135deg, var(--corp-primary), var(--corp-primary-2));
  color: #fff; text-align: center; padding: 4.5rem 0;
}
.landing-hero h1 { font-size: 2rem; line-height: 1.25; margin-bottom: 0.75rem; }
.landing-hero p { font-size: 1.05rem; opacity: 0.92; max-width: 640px; margin: 0 auto 1.5rem; }
.landing-hero-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
.landing-hero-actions a { padding: 0.6rem 1.4rem; border-radius: 8px; font-weight: 600; }
.landing-hero-actions .btn-primary { background: var(--corp-accent); color: #fff; }
.landing-hero-actions .btn-primary:hover { background: #f06a3c; text-decoration: none; }
.landing-hero-actions .btn-ghost { border: 2px solid rgba(255,255,255,0.7); color: #fff; }
.landing-hero-actions .btn-ghost:hover { background: rgba(255,255,255,0.12); text-decoration: none; }
@media (min-width: 720px) { .landing-hero h1 { font-size: 2.6rem; } }

/* Layanan */
.landing-services-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
@media (min-width: 600px) { .landing-services-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 840px) { .landing-services-grid { grid-template-columns: repeat(4, 1fr); } }
.landing-service-card { background: #fff; border: 1px solid var(--color-border); border-radius: 8px; padding: 1.25rem; }
.landing-service-card .icon { font-size: 1.8rem; }
.landing-service-card h3 { font-size: 1rem; margin: 0.5rem 0 0.35rem; color: var(--corp-text); }
.landing-service-card p { font-size: 0.85rem; color: var(--color-muted); }

/* Statistik */
.landing-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; text-align: center; }
@media (min-width: 720px) { .landing-stats { grid-template-columns: repeat(4, 1fr); } }
.landing-stat .value { font-size: 1.9rem; font-weight: 800; color: var(--corp-accent); }
.landing-stat .label { font-size: 0.85rem; color: var(--color-muted); }

/* Sekilas profil */
.landing-profile { display: grid; grid-template-columns: 1fr; gap: 1.5rem; align-items: center; }
@media (min-width: 720px) { .landing-profile { grid-template-columns: 2fr 3fr; } }
.landing-profile-art {
  aspect-ratio: 4 / 3; border-radius: 8px; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--corp-primary), var(--corp-primary-2)); color: rgba(255,255,255,0.9); font-size: 2.5rem;
}
.landing-profile-copy h2 { font-size: 1.4rem; color: var(--corp-primary); margin-bottom: 0.6rem; }
.landing-profile-copy p { color: var(--corp-text); margin-bottom: 1rem; }
.landing-profile-copy a { display: inline-block; background: var(--corp-primary); color: #fff; padding: 0.5rem 1.2rem; border-radius: 8px; font-weight: 600; }
.landing-profile-copy a:hover { background: var(--corp-primary-2); text-decoration: none; }

/* Berita terbaru */
.landing-news-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
.landing-news-header h2 { font-size: 1.5rem; color: var(--corp-primary); }
.landing-news-header a { background: var(--corp-primary); color: #fff; padding: 0.45rem 1.1rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem; }
.landing-news-header a:hover { background: var(--corp-primary-2); text-decoration: none; }

/* Footer corporate */
.corp-footer { background: var(--corp-text); color: #cfe5e3; padding: 2.5rem 0 1rem; margin-top: 2rem; }
.corp-footer-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
@media (min-width: 600px) { .corp-footer-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 840px) { .corp-footer-grid { grid-template-columns: 2fr 1fr 1fr 1.5fr; } }
.corp-footer h4 { color: #fff; font-size: 0.95rem; margin-bottom: 0.5rem; }
.corp-footer p, .corp-footer li { font-size: 0.85rem; line-height: 1.7; }
.corp-footer ul { list-style: none; }
.corp-footer a { color: #cfe5e3; }
.corp-footer a:hover { color: #fff; }
.corp-footer-bottom { border-top: 1px solid rgba(255,255,255,0.15); margin-top: 1.75rem; padding-top: 0.9rem; text-align: center; font-size: 0.78rem; color: #9db8b6; }

/* Halaman tentang */
.tentang-hero { background: linear-gradient(135deg, var(--corp-primary), var(--corp-primary-2)); color: #fff; padding: 2.5rem 0; text-align: center; }
.tentang-hero h1 { font-size: 1.8rem; }
.tentang-body { padding: 2rem 0; max-width: 720px; margin: 0 auto; }
.tentang-body p { margin-bottom: 1rem; line-height: 1.8; }
.tentang-contact { background: var(--corp-bg); border-radius: 8px; padding: 1.25rem; margin-top: 1.5rem; font-size: 0.9rem; }
```

- [ ] **Step 2: Tulis `src/components/landing/CorporateFooter.astro`**

```astro
---
import type { Category } from '../../lib/api';
import { CONTACTS } from '../../lib/company';

interface Props { tenantName: string; categories: Category[] }
const { tenantName, categories } = Astro.props;
---
<footer class="corp-footer" id="kontak">
  <div class="container">
    <div class="corp-footer-grid">
      <div>
        <h4>{tenantName}</h4>
        <p>Portal berita multi-platform yang menghadirkan jurnalisme independen, cepat, dan berimbang untuk Nusantara.</p>
      </div>
      <div>
        <h4>Kategori</h4>
        <ul>
          {categories.map((c) => <li><a href={`/kategori/${c.slug}`}>{c.name}</a></li>)}
        </ul>
      </div>
      <div>
        <h4>Navigasi</h4>
        <ul>
          <li><a href="/berita">Berita</a></li>
          <li><a href="/tentang">Tentang Kami</a></li>
          <li><a href="/pencarian">Pencarian</a></li>
        </ul>
      </div>
      <div>
        <h4>Kontak</h4>
        <ul>
          <li>{CONTACTS.email}</li>
          <li>{CONTACTS.phone}</li>
          <li>{CONTACTS.address}</li>
        </ul>
      </div>
    </div>
    <div class="corp-footer-bottom">
      &copy; {new Date().getFullYear()} {tenantName}. Hak cipta dilindungi.
    </div>
  </div>
</footer>
```

- [ ] **Step 3: Tulis `src/layouts/Corporate.astro`**

```astro
---
import { getTenantInfo, getCategory, TENANT_HOST } from '../lib/api';
import type { Category } from '../lib/api';
import CorporateFooter from '../components/landing/CorporateFooter.astro';
import '../styles/global.css';

interface Props { title: string; description?: string }
const { title, description } = Astro.props;

let tenantName = TENANT_HOST;
try {
  const { data } = await getTenantInfo();
  tenantName = data.name ?? tenantName;
} catch { /* pakai fallback */ }

// Kategori untuk footer — pola sama dengan Base.astro (skip yang 404)
const CAT_SLUGS = ['politik', 'ekonomi', 'teknologi', 'olahraga'];
const catResults = await Promise.allSettled(CAT_SLUGS.map((s) => getCategory(s)));
const categories: Category[] = [];
for (const r of catResults) {
  if (r.status === 'fulfilled') categories.push({ id: r.value.data.id, name: r.value.data.name, slug: r.value.data.slug });
}
---
<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description ?? `${tenantName} — portal berita`} />
    <title>{title} — {tenantName}</title>
  </head>
  <body>
    <header class="corp-header">
      <div class="container">
        <a href="/" class="corp-logo">{tenantName}</a>
        <input type="checkbox" id="corp-menu" class="corp-menu-toggle" />
        <label for="corp-menu" class="corp-hamburger" aria-label="Buka menu">&#9776;</label>
        <nav class="corp-nav">
          <ul>
            <li><a href="/">Beranda</a></li>
            <li><a href="/#layanan">Layanan</a></li>
            <li><a href="/tentang">Tentang</a></li>
            <li><a href="/#kontak">Kontak</a></li>
            <li><a href="/#kontak" class="corp-cta">Hubungi Kami</a></li>
          </ul>
        </nav>
      </div>
    </header>

    <slot />

    <CorporateFooter tenantName={tenantName} categories={categories} />
  </body>
</html>
```

- [ ] **Step 4: Tulis `src/pages/tentang.astro`**

```astro
---
import Corporate from '../layouts/Corporate.astro';
import { PROFILE, CONTACTS, STATS } from '../lib/company';
---
<Corporate title="Tentang Kami" description="Profil perusahaan Media Nusantara">
  <section class="tentang-hero">
    <div class="container">
      <h1>Tentang Kami</h1>
    </div>
  </section>
  <div class="tentang-body container">
    {PROFILE.long.map((p) => <p>{p}</p>)}
    <div class="tentang-contact">
      <h4>Hubungi Kami</h4>
      <p>{CONTACTS.email} · {CONTACTS.phone} · {CONTACTS.address}</p>
    </div>
  </div>
</Corporate>
```

- [ ] **Step 5: Verifikasi**

```bash
npm run build                                                        # exit 0
curl -s http://localhost:4321/tentang | grep -o "Tentang Kami" | head -1   # ada
curl -s http://localhost:4321/tentang | grep -c "corp-footer"       # >= 1
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/     # 200 (homepage lama belum berubah)
```

- [ ] **Step 6: Commit**

```bash
git add src/layouts/Corporate.astro src/components/landing/ src/pages/tentang.astro src/styles/global.css
git commit -m "feat: layout corporate, footer, dan halaman /tentang"
```

---

### Task 4: Komponen section landing (presentational)

**Files:**
- Create: `src/components/landing/HeroSection.astro`
- Create: `src/components/landing/ServicesSection.astro`
- Create: `src/components/landing/StatsSection.astro`
- Create: `src/components/landing/ProfileSection.astro`
- Create: `src/components/landing/LatestNewsSection.astro`

**Interfaces:**
- Consumes: `TAGLINE`, `SERVICES`, `STATS`, `PROFILE` dari `../../lib/company`; `Article` type dari `../../lib/api`; komponen `ArticleCard` (props `article: Article`).
- Produces: `HeroSection` (tanpa props), `ServicesSection` (tanpa props), `StatsSection` (tanpa props), `ProfileSection` (tanpa props), `LatestNewsSection` (props `articles: Article[]`). Task 5 merangkai kelimanya di homepage. `ServicesSection` memakai wrapper `id="layanan"` (target anchor nav).

- [ ] **Step 1: Tulis `HeroSection.astro`**

```astro
---
import { TAGLINE } from '../../lib/company';
---
<section class="landing-hero">
  <div class="container">
    <h1>Portal Berita Terpercaya untuk Nusantara</h1>
    <p>{TAGLINE}</p>
    <div class="landing-hero-actions">
      <a href="/berita" class="btn-primary">Jelajahi Berita</a>
      <a href="/tentang" class="btn-ghost">Tentang Kami</a>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Tulis `ServicesSection.astro`**

```astro
---
import { SERVICES } from '../../lib/company';
---
<section class="landing-section" id="layanan">
  <div class="container">
    <h2 class="landing-title">Layanan &amp; Keunggulan</h2>
    <div class="landing-services-grid">
      {SERVICES.map((s) => (
        <div class="landing-service-card">
          <div class="icon">{s.icon}</div>
          <h3>{s.title}</h3>
          <p>{s.description}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 3: Tulis `StatsSection.astro`**

```astro
---
import { STATS } from '../../lib/company';
---
<section class="landing-section landing-section-alt">
  <div class="container">
    <h2 class="landing-title">Media Nusantara dalam Angka</h2>
    <div class="landing-stats">
      {STATS.map((s) => (
        <div class="landing-stat">
          <div class="value">{s.value}</div>
          <div class="label">{s.label}</div>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 4: Tulis `ProfileSection.astro`**

```astro
---
import { PROFILE } from '../../lib/company';
---
<section class="landing-section">
  <div class="container">
    <div class="landing-profile">
      <div class="landing-profile-art">&#128240;</div>
      <div class="landing-profile-copy">
        <h2>Sekilas Tentang Kami</h2>
        <p>{PROFILE.short}</p>
        <a href="/tentang">Selengkapnya</a>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 5: Tulis `LatestNewsSection.astro`**

```astro
---
import type { Article } from '../../lib/api';
import ArticleCard from '../ArticleCard.astro';

interface Props { articles: Article[] }
const { articles } = Astro.props;
---
<section class="landing-section landing-section-alt">
  <div class="container">
    <div class="landing-news-header">
      <h2>Berita Terbaru</h2>
      <a href="/berita">Lihat Semua Berita</a>
    </div>
    <div class="article-grid">
      {articles.map((a) => <ArticleCard article={a} />)}
    </div>
  </div>
</section>
```

- [ ] **Step 6: Verifikasi**

Run: `npm run build` → Expected: exit 0 (Astro type-check komponen saat build).

- [ ] **Step 7: Commit**

```bash
git add src/components/landing/ && git commit -m "feat: komponen section landing corporate"
```

---

### Task 5: Homepage menjadi landing corporate

**Files:**
- Modify: `src/pages/index.astro` (ganti total)

**Interfaces:**
- Consumes: layout `Corporate` (Task 3), semua section Task 4, `getArticles`, `ApiError` dari `../lib/api`, `TAGLINE` dari `../lib/company`.
- Produces: `/` sebagai landing; section berita menampilkan 6 artikel (`getArticles(1, 6)`), error API → pesan "Berita sedang tidak tersedia" hanya di section berita.

- [ ] **Step 1: Ganti `src/pages/index.astro`**

```astro
---
import Corporate from '../layouts/Corporate.astro';
import HeroSection from '../components/landing/HeroSection.astro';
import ServicesSection from '../components/landing/ServicesSection.astro';
import StatsSection from '../components/landing/StatsSection.astro';
import ProfileSection from '../components/landing/ProfileSection.astro';
import LatestNewsSection from '../components/landing/LatestNewsSection.astro';
import { getArticles } from '../lib/api';
import type { Article } from '../lib/api';
import { TAGLINE } from '../lib/company';

let articles: Article[] = [];
let newsError = false;
try {
  const res = await getArticles(1, 6);
  articles = res.data;
} catch {
  newsError = true;
}
---
<Corporate title="Beranda" description={TAGLINE}>
  <HeroSection />
  <ServicesSection />
  <StatsSection />
  <ProfileSection />
  {newsError ? (
    <section class="landing-section landing-section-alt">
      <div class="container">
        <div class="error-message"><p>Berita sedang tidak tersedia</p></div>
      </div>
    </section>
  ) : (
    <LatestNewsSection articles={articles} />
  )}
</Corporate>
```

- [ ] **Step 2: Verifikasi**

```bash
curl -s http://localhost:4321/ | grep -o "Portal Berita Terpercaya" | head -1   # hero
curl -s http://localhost:4321/ | grep -o "Layanan &amp; Keunggulan" | head -1  # section layanan
curl -s http://localhost:4321/ | grep -c "artikel/"     # expected >= 6
curl -s http://localhost:4321/ | grep -o "Lihat Semua Berita" | head -1
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/berita          # 200
npm run build                                                                   # exit 0
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro && git commit -m "feat: homepage menjadi landing corporate"
```

---

### Task 6: Finalisasi — README + smoke test + push

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: semua rute dari Task 1-5 sudah ada.
- Produces: README ter-update + seluruh branch ter-push.

- [ ] **Step 1: Tambah subbab landing di README** (append setelah blok fitur yang ada; pertahankan isi lain)

```markdown
## Landing Corporate

Homepage (`/`) menampilkan landing page corporate (hero, layanan, statistik,
sekilas profil) dengan berita terbaru di bagian bawah. Arsip berita lengkap
di `/berita`, profil perusahaan di `/tentang`. Konten corporate saat ini
mock di `src/lib/company.ts` (lihat `docs/superpowers/specs/2026-08-08-corporate-landing-design.md`).
```

- [ ] **Step 2: Smoke test semua rute**

```bash
for p in "/" "/berita" "/tentang" "/artikel/timnas-indonesia-lolos-ke-final-piala-asia-u-23" \
         "/kategori/ekonomi" "/tag/breaking-news" "/pencarian?q=umkm" "/404"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4321$p")
  echo "$code  $p"
done
```

Expected: semua 200 kecuali `/404` → 404.

- [ ] **Step 3: Verifikasi halaman berita tak berubah**

```bash
curl -s http://localhost:4321/kategori/ekonomi | grep -c "artikel/"   # >= 1
curl -s http://localhost:4321/berita?page=2 | grep -c "artikel/"      # >= 1
```

- [ ] **Step 4: Commit + push**

```bash
git add README.md && git commit -m "docs: dokumentasikan landing corporate"
git push origin main
```
