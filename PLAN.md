# Implementation Plan — Frontend Publik Tenant (saas-frontend)

> **Untuk agentic workers:** Gunakan superpowers:subagent-driven-development
> (direkomendasikan) atau superpowers:executing-plans untuk mengimplementasikan
> rencana ini task demi task. Steps memakai checkbox (`- [ ]`) untuk tracking.

**Goal:** Situs berita publik multi-tenant berbasis Astro (SSR) yang membaca
endpoint `/public/*` cms-api, dengan demo tenant `media-nusantara.com`
(14 artikel siap dipakai).

**Architecture:** Astro SSR (output `server`, adapter `@astrojs/node`) — semua
halaman konten dirender server-side sehingga API hanya diakses dari server.
Tenant di-resolve dari header `Host` yang diteruskan API client ke cms-api.

**Tech Stack:** Astro 5, TypeScript, Node 22, adapter `@astrojs/node`
(standalone mode), CSS murni (tanpa framework CSS).

## Global Constraints

- Bahasa UI & copy: **Bahasa Indonesia**.
- **Header `Host: media-nusantara.com` wajib** pada setiap request ke
  `/public/*` — tanpa itu API menjawab 404 `DOMAIN_NOT_RESOLVED`.
- ⚠️ **Node `fetch`/undici memaksa header `Host`** — gunakan modul
  `node:http` (lihat `src/lib/api.ts`, Task 2). Jangan pakai `fetch()` untuk
  panggilan SSR ke API.
- Format respons API: `{"data": ..., "meta": ..., "error": null}`; error:
  `{"error": {"code", "message", "fields"}}` dengan status HTTP bermakna.
- Endpoint view-count: `GET /public/articles/{slug}` sudah menaikkan
  view_count secara otomatis (fire-and-forget di API). **Jangan** memanggil
  `POST /public/articles/{id}/view` dari frontend (akan dihitung ganda).
- File `.env` tidak boleh di-commit (gitignore dari Task 1); hanya `.env.example`.
- Port dev Astro: **4321**. Port API: 8080.
- Slug artikel unik per tenant; rute memakai slug, bukan id.
- Konten demo: 14 artikel published (10 simulasi lorem-ipsum body sama + 4
  seed), kategori `politik/ekonomi/teknologi/olahraga`, tag
  `breaking-news/exclusive`, tanggal tersebar 10 hari.

## Catatan API yang sudah diverifikasi (2026-08-08)

- `GET /public/articles` → `data[]` artikel berisi: `id, title, slug, summary,
  body_html, status, view_count, published_at, category_id, author_id,
  tags[{name, slug}]`. **Tidak ada** objek `category`/`author` tertanam —
  hanya id (lihat Task 3 untuk strategi).
- `GET /public/articles/{slug}` → objek artikel tunggal (sama + menaikkan
  view count).
- `GET /public/categories/{slug}` → `{id, name, slug, description,
  articles[]}` + meta paging.
- `GET /public/tags/{slug}` → `{id, name, slug, articles[], total_articles}`
  + meta paging.
- `GET /public/articles/search?q=` (Meilisearch) → `data[]` artikel + meta.
- `GET /public/banners?position=sidebar|after_article` → saat ini kosong
  (`data: []`); tampilkan blok ads hanya jika ada isi.
- `GET /public/resolve-domain?host=` → info tenant `{name, slug, description,
  public_domain}` — dipakai untuk header/branding situs.
- Keyset pagination tersedia via `?cursor=` (meta.next_cursor) — **tidak
  wajib** di v1; offset `?page=` sudah cukup.
- CORS `.env` API saat ini: `http://localhost:3000,…4000,…5173,…5174,
  http://192.168.19.7:3000,…4000,…5173,…5174` — belum ada port 4321.
  (Relevan hanya jika nanti ada fetch dari browser; SSR murni tidak
  terkena CORS.)

## Struktur File Target

```
saas-frontend/
├── astro.config.mjs
├── package.json / tsconfig.json / .gitignore
├── .env.example            # PUBLIC_TENANT_HOST, API_BASE_URL
├── README.md               # (sudah ada)
├── PLAN.md                 # (dokumen ini)
└── src/
    ├── lib/
    │   ├── api.ts          # HTTP client node:http + semua pemanggil API
    │   └── format.ts       # formatTanggal, formatViewCount
    ├── layouts/Base.astro  # header, nav kategori, footer, slot
    ├── components/
    │   ├── ArticleCard.astro
    │   ├── Pagination.astro
    │   ├── SearchBox.astro
    │   └── BannerSlot.astro
    └── pages/
        ├── index.astro
        ├── artikel/[slug].astro
        ├── kategori/[slug].astro
        ├── tag/[slug].astro
        ├── pencarian.astro
        └── 404.astro
```

---

## Task 1: Scaffold proyek Astro + env + CORS API

**Files:**
- Create: `astro.config.mjs`, `package.json`, `tsconfig.json`, `.gitignore`,
  `.env`, `.env.example`
- Modify: `/root/apps/api/.env` (baris `CORS_ALLOWED_ORIGINS` — tambah
  `http://localhost:4321,http://192.168.19.7:4321`)

- [ ] **Step 1: Scaffold Astro di folder yang sudah ada**

```bash
cd /root/apps/saas-frontend
npm create astro@latest . -- --template minimal --install --no-git --yes
npm install @astrojs/node
```

- [ ] **Step 2: Konfigurasi SSR + env**

`astro.config.mjs`:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { port: 4321, host: true },
});
```

`.env` dan `.env.example` (isi sama):

```env
# Host tenant yang diteruskan sebagai header Host ke API publik
PUBLIC_TENANT_HOST=media-nusantara.com
# Base URL cms-api
API_BASE_URL=http://localhost:8080
```

`.gitignore` — tambahkan `.env` (`.env.example` boleh di-commit):

```gitignore
node_modules
dist
.env
.env.*
!.env.example
.omc/
.claude/
.superpowers/
```

- [ ] **Step 3: Tambah origin 4321 ke CORS API**

Edit `/root/apps/api/.env` — tambahkan dua origin pada
`CORS_ALLOWED_ORIGINS` (append, jangan hapus yang ada):
`http://localhost:4321,http://192.168.19.7:4321`.

**Jangan commit `.env` API.** Restart agar berlaku:

```bash
pm2 restart cms-api && pm2 logs cms-api --lines 20 --nostream
```

Expected: server up di :8080 tanpa error.

- [ ] **Step 4: Verifikasi dev server**

```bash
npm run dev   # foreground; atau jalankan background lalu curl
curl -s http://localhost:4321/ | head -5
```

Expected: halaman default Astro, status 200.

- [ ] **Step 5: Commit**

```bash
git init -b main
git add -A && git commit -m "chore: scaffold Astro SSR project"
```

---

## Task 2: API client (`src/lib/api.ts`) dengan Host override

**Files:**
- Create: `src/lib/api.ts`, `src/lib/format.ts`

- [ ] **Step 1: Tulis API client berbasis node:http**

`src/lib/api.ts` — inti: `apiGet(path, query?)` memakai `http.request`
dengan header `Host` eksplisit (fetch/undici tidak bisa override Host):

```ts
import http from 'node:http';

const API_BASE = import.meta.env.API_BASE_URL ?? 'http://localhost:8080';
const TENANT_HOST = import.meta.env.PUBLIC_TENANT_HOST ?? 'media-nusantara.com';

export class ApiError extends Error {
  status: number; code: string;
  constructor(status: number, code: string, message: string) {
    super(message); this.status = status; this.code = code;
  }
}

export function apiGet<T>(path: string, query?: Record<string, string | number>): Promise<{ data: T; meta: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, String(v));
    const req = http.request(url, { headers: { Host: TENANT_HOST } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.error) return reject(new ApiError(res.statusCode ?? 500, json.error.code, json.error.message));
          resolve({ data: json.data as T, meta: json.meta ?? null });
        } catch { reject(new ApiError(res.statusCode ?? 500, 'BAD_JSON', body.slice(0, 200))); }
      });
    });
    req.on('error', (e) => reject(new ApiError(0, 'NETWORK', e.message)));
    req.end();
  });
}
```

Lalu fungsi domain (sesuaikan dengan payload aktual — `data[]` dibungkus
`meta`):

```ts
export interface Tag { id: string; name: string; slug: string }
export interface Article {
  id: string; title: string; slug: string; summary: string;
  body_html: string; view_count: number; published_at: string;
  category_id: string; author_id: string; tags: Tag[];
}
export interface Category { id: string; name: string; slug: string; description?: string }

export const getArticles = (page = 1, perPage = 12) =>
  apiGet<Article[]>('/public/articles', { page, per_page: perPage });

export const getArticle = (slug: string) =>
  apiGet<Article>(`/public/articles/${encodeURIComponent(slug)}`);

export const getCategory = (slug: string, page = 1) =>
  apiGet<Category & { articles: Article[] }>(`/public/categories/${encodeURIComponent(slug)}`, { page, per_page: 12 });

export const getTag = (slug: string, page = 1) =>
  apiGet<{ id: string; name: string; slug: string; total_articles: number; articles: Article[] }>(
    `/public/tags/${encodeURIComponent(slug)}`, { page, per_page: 12 });

export const searchArticles = (q: string, page = 1) =>
  apiGet<Article[]>('/public/articles/search', { q, page, per_page: 12 });

export const getBanners = (position: 'sidebar' | 'after_article') =>
  apiGet<any[]>('/public/banners', { position });

export const getTenantInfo = () =>
  apiGet<{ name: string; slug: string; description?: string }>('/public/resolve-domain', { host: TENANT_HOST });
```

**Catatan kategori:** endpoint publik hanya punya `GET /public/categories/{slug}`
(tidak ada list semua kategori). Strategi v1: panggil 4 slug yang sudah
diketahui (`politik, ekonomi, teknologi, olahraga`) via `Promise.allSettled`
di layout untuk nav; slug yang 404 dilewati. Jika tenant lain punya kategori
berbeda, ini jadi catatan backlog (lihat "Backlog").

- [ ] **Step 2: Helper format**

`src/lib/format.ts`:

```ts
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export function formatTanggal(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatViewCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')} rb` : String(n);
}
```

- [ ] **Step 3: Uji cepat via halaman debug**

Buat sementara `src/pages/debug.astro` yang memanggil `getArticles()` dan
`getTenantInfo()` lalu merender judul pertama + nama tenant; buka
`http://localhost:4321/debug`. Expected: judul artikel + "Media Nusantara".
Hapus file debug setelah lolos.

- [ ] **Step 4: Commit**

```bash
git add src/ && git commit -m "feat: API client dengan Host-header override (node:http)"
```

---

## Task 3: Layout dasar + homepage

**Files:**
- Create: `src/layouts/Base.astro`, `src/components/ArticleCard.astro`,
  `src/components/Pagination.astro`, `src/pages/index.astro`,
  `src/styles/global.css` (di-import di layout)

- [ ] **Step 1: Layout `Base.astro`**

Slot props: `title: string`, `description?: string`. Isi:
- `<head>`: charset, viewport, `<title>`, meta description.
- Header: nama tenant dari `getTenantInfo()` (fallback: `PUBLIC_TENANT_HOST`)
  link ke `/`, deskripsi tenant kecil.
- Nav kategori: 4 kategori via `Promise.allSettled` (lihat catatan Task 2) —
  link `/kategori/{slug}`.
- Kotak pencarian sederhana (`SearchBox.astro`: form GET ke `/pencarian?q=`).
- `<main>` = `<slot />`. Footer: copyright + tahun.

Styling CSS murni, mobile-first, max-width 960px.

- [ ] **Step 2: Komponen `ArticleCard.astro`**

Props: `article: Article`. Tampilkan: judul (link `/artikel/{slug}`),
`summary`, tanggal publish (`formatTanggal`), tag chips (link
`/tag/{slug}`), view count. Kategori tidak tersedia di payload artikel —
lewatkan di card (backlog: enrich dari map `category_id` hasil nav, opsional).

- [ ] **Step 3: Komponen `Pagination.astro`**

Props: `page`, `totalPages`, `basePath`. Link ‹ Sebelumnya / Berikutnya,
disable di ujung. Query param `?page=N`.

- [ ] **Step 4: Homepage**

`src/pages/index.astro`: `getArticles(page)` dari `Astro.url.searchParams`;
render grid card; Pagination; error handling: tangkap `ApiError` → tampilkan
pesan ramah "Konten sedang tidak tersedia".

- [ ] **Step 5: Verifikasi**

```bash
curl -s http://localhost:4321/ | grep -c "artikel/"   # expected >= 10
curl -s "http://localhost:4321/?page=2"
```

Expected: 12 artikel di halaman 1 (total 14 → 2 artikel di halaman 2).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: layout dasar, homepage dengan grid artikel + pagination"
```

---

## Task 4: Halaman detail artikel

**Files:**
- Create: `src/pages/artikel/[slug].astro`
- Create: `src/components/BannerSlot.astro`

- [ ] **Step 1: Halaman detail**

```astro
---
import Base from '../../layouts/Base.astro';
import { getArticle, getBanners, ApiError } from '../../lib/api';
import { formatTanggal, formatViewCount } from '../../lib/format';

const { slug } = Astro.params;
let article;
try { article = (await getArticle(slug!)).data; }
catch (e) {
  if (e instanceof ApiError && e.status === 404) return Astro.redirect('/404');
  throw e;
}
const banners = await getBanners('after_article').catch(() => ({ data: [] }));
---
```

Render: judul h1, meta (tanggal, view count), tag chips, lalu
`<Fragment set:html={article.body_html} />` dengan styling artikel
(`p, h2, blockquote`). Setelah artikel: `BannerSlot` (hanya jika
`banners.data.length > 0`).

⚠️ `GET /public/articles/{slug}` sudah menaikkan view count — jangan tambah
pemanggilan view lain.

- [ ] **Step 2: `BannerSlot.astro`**

Props: `banners: any[]`. Loop render tiap banner: jika ada `image_url`
tampilkan `<img>` (link `target_url` bila ada), jika hanya `title`/`text`
tampilkan kotak placeholder bertuliskan "Iklan". Kosong → render nothing.

- [ ] **Step 3: Verifikasi**

```bash
curl -s http://localhost:4321/artikel/timnas-indonesia-lolos-ke-final-piala-asia-u-23 | grep -o "Timnas Indonesia" | head -1
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:4321/artikel/tidak-ada
```

Expected: halaman berisi judul + paragraf lorem ipsum; slug tak dikenal →
redirect ke `/404`.

- [ ] **Step 4: Commit**

```bash
git add src/ && git commit -m "feat: halaman detail artikel dengan body HTML + slot banner"
```

---

## Task 5: Halaman kategori & tag

**Files:**
- Create: `src/pages/kategori/[slug].astro`, `src/pages/tag/[slug].astro`

- [ ] **Step 1: Halaman kategori**

Ambil `Astro.params.slug` + `page` dari query. `getCategory(slug, page)`.
Header: nama + deskripsi kategori. Grid `ArticleCard` dari `data.articles`.
Pagination pakai `meta`. 404 dari API → redirect `/404`.

- [ ] **Step 2: Halaman tag**

Sama dengan kategori, pakai `getTag`. Tampilkan `total_articles` di header.

- [ ] **Step 3: Verifikasi**

```bash
curl -s http://localhost:4321/kategori/ekonomi | grep -c "artikel/"    # expected >= 1
curl -s http://localhost:4321/tag/breaking-news | grep -c "artikel/"   # expected >= 1
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/kategori/fiktif  # 302/404
```

- [ ] **Step 4: Commit**

```bash
git add src/ && git commit -m "feat: halaman kategori dan tag"
```

---

## Task 6: Pencarian + halaman 404

**Files:**
- Create: `src/pages/pencarian.astro`, `src/pages/404.astro`

- [ ] **Step 1: Halaman pencarian**

Query `q` dari `Astro.url.searchParams` (URLSearchParams sudah meng-decode
`+`/`%20`). Jika `q` kosong → tampilkan form + hint. Jika ada:
`searchArticles(q, page)` → grid card + info jumlah hasil (`meta.total`)
+ Pagination. Tangkap `ApiError` code `SEARCH_UNAVAILABLE` → pesan "Pencarian
sedang tidak tersedia".

Catatan: Meilisearch kadang mengembalikan dokumen duplikat/stale (sudah
dibersihkan 2026-08-08). Jika duplikat muncul lagi, itu masalah indeks di
sisi API — catat, jangan dedupe di frontend sebagai solusi permanen.

- [ ] **Step 2: Halaman 404**

`src/pages/404.astro` — layout Base, pesan "Halaman tidak ditemukan", link
ke homepage. Karena output `server`, pastikan mengembalikan `Astro.response.status = 404`.

- [ ] **Step 3: Verifikasi**

```bash
curl -s "http://localhost:4321/pencarian?q=indonesia" | grep -c "artikel/"   # expected >= 1
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/404           # 404
curl -s "http://localhost:4321/pencarian?q=zzzztidakada" | grep -i "tidak"   # pesan kosong
```

- [ ] **Step 4: Commit**

```bash
git add src/ && git commit -m "feat: pencarian dan halaman 404"
```

---

## Task 7: Finalisasi + smoke test end-to-end

**Files:**
- Modify: `README.md` (perbarui status & instruksi run)
- Create: `ecosystem frontend opsional` — lewatkan, jalankan manual dulu

- [ ] **Step 1: Update README**

Ganti blok status di `README.md`: "Implementasi selesai — lihat Quick Start
untuk menjalankan". Tambah perintah:

```bash
npm run dev      # dev di :4321
npm run build && node dist/server/entry.mjs   # preview production
```

- [ ] **Step 2: Smoke test semua rute**

```bash
for p in "/" "/artikel/timnas-indonesia-lolos-ke-final-piala-asia-u-23" \
         "/kategori/ekonomi" "/kategori/politik" "/tag/breaking-news" \
         "/tag/exclusive" "/pencarian?q=umkm" "/404"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4321$p")
  echo "$code  $p"
done
```

Expected: semua 200 kecuali `/404` (404).

- [ ] **Step 3: Verifikasi build production**

```bash
npm run build
```

Expected: build sukses tanpa error TypeScript.

- [ ] **Step 4: Commit**

```bash
git add README.md && git commit -m "docs: tandai implementasi selesai"
```

---

## Backlog (di luar v1)

1. **Endpoint daftar kategori publik** (`GET /public/categories`) di API —
   saat ini nav kategori hardcode 4 slug demo.
2. **Nama penulis & kategori tertanam** di payload artikel publik (sekarang
   hanya `author_id`/`category_id`).
3. **Tag di endpoint detail** — `/public/articles/{slug}` tidak menyertakan
   `tags` di beberapa versi; verifikasi saat implementasi Task 4 (payload
   list punya tags).
4. **SSG + ISR** bila trafik menuntut (saat ini SSR penuh).
5. **RSS feed** per tenant.
6. **Banner/ads management** — slot sudah ada, konten kosong.

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| 404 `DOMAIN_NOT_RESOLVED` dari semua endpoint | Header `Host` tidak terkirim. Pastikan pakai `apiGet` (node:http), bukan `fetch`. Cek `PUBLIC_TENANT_HOST`. |
| Halaman putih / 500 dev server | API mati. `pm2 status` → hanya `cms-api` yang harus online; `pm2 restart cms-api`. |
| Pencarian `SEARCH_UNAVAILABLE` | Meilisearch mati atau indeks bermasalah. Di sisi API: cek `MEILISEARCH_HOST` di `/root/apps/api/.env` (port 7700). |
| `EADDRINUSE` 4321 | Proses Astro lama masih jalan: `pkill -f astro` lalu ulang. |
| Duplikat hasil pencarian | Dokumen stale di indeks Meilisearch — bersihkan via API Meilisearch (`DELETE /indexes/articles/documents/{id}`), jangan dedupe di frontend. |
