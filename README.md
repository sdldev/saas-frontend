# saas-frontend

Frontend publik (Astro SSG/SSR) untuk situs berita tenant pada CMS multi-tenant.
Mengkonsumsi endpoint `/public/*` dari `cms-api` — tanpa autentikasi.

> **Status:** Implementasi selesai — lihat Quick Start untuk menjalankan.

```bash
npm run dev      # dev di :4321
npm run build && node dist/server/entry.mjs   # preview production
```

## Arsitektur singkat

```
Browser ──▶ Astro frontend (:4321) ──SSR──▶ cms-api (:8080)  /public/*
                                              ▲
                          Header wajib: Host: media-nusantara.com
```

- API multi-tenant me-resolve tenant dari **header `Host`** pada setiap request
  `/public/*` (public domain harus `domain_status=verified` + tenant `active`).
- Backend: `/root/apps/api` (Go 1.25, port 8080, dijalankan via pm2 `cms-api`).
- Demo tenant: **Media Nusantara** — domain publik `media-nusantara.com`.

## Quick start (uji API dulu)

```bash
# List artikel (14 artikel published)
curl -H "Host: media-nusantara.com" "http://localhost:8080/public/articles?per_page=20"

# Detail artikel
curl -H "Host: media-nusantara.com" "http://localhost:8080/public/articles/timnas-indonesia-lolos-ke-final-piala-asia-u-23"

# Kategori (artikel di dalamnya)
curl -H "Host: media-nusantara.com" "http://localhost:8080/public/categories/ekonomi"

# Tag
curl -H "Host: media-nusantara.com" "http://localhost:8080/public/tags/breaking-news"

# Pencarian (Meilisearch)
curl -H "Host: media-nusantara.com" "http://localhost:8080/public/articles/search?q=indonesia"

# Info tenant (nama, slug, domain)
curl -H "Host: media-nusantara.com" "http://localhost:8080/public/resolve-domain?host=media-nusantara.com"
```

Format respons seragam: `{"data": ..., "meta": {...}, "error": null}` dengan
`meta = {page, per_page, total, total_pages}` untuk list berpaginasi.

## Demo data yang tersedia

- **14 artikel published** (10 simulasi lorem-ipsum + 4 seed lama)
- Kategori: `politik`, `ekonomi`, `teknologi`, `olahraga`
- Tag: `breaking-news`, `exclusive`
- Tanggal publish tersebar 10 hari ke belakang

Lihat `PLAN.md` §"Referensi API Publik" untuk bentuk payload lengkap.

## Lingkungan pengembangan

| Item | Nilai |
|---|---|
| Node.js | v22.23.2 (npm 10.9.8) |
| Dev server Astro | port **4321** |
| API | `http://localhost:8080` (dari mesin ini) / `http://192.168.19.7:8080` (dari LAN) |
| Host header wajib | `media-nusantara.com` |
| CORS | origin `localhost:4321` & `192.168.19.7:4321` harus ditambahkan ke `.env` API (Task 1 di PLAN.md) |
