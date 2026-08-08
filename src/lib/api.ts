import http from 'node:http';

const API_BASE = import.meta.env.API_BASE_URL ?? 'http://localhost:8080';

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith('/uploads/')) return `/media${url.slice('/uploads'.length)}`;
  return null;
}
export const TENANT_HOST = import.meta.env.PUBLIC_TENANT_HOST ?? 'media-nusantara.com';

export class ApiError extends Error {
  status: number; code: string;
  constructor(status: number, code: string, message: string) {
    super(message); this.status = status; this.code = code;
  }
}

export function apiGet<T>(path: string, query?: Record<string, string | number>): Promise<{ data: T; meta: Meta | null }> {
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
    req.setTimeout(10_000, () => {
      req.destroy();
      reject(new ApiError(0, 'TIMEOUT', `Request timeout: ${path}`));
    });
    req.end();
  });
}

// --- Types adapted to actual API payload ---

export interface Tag { id: string; name: string; slug: string }

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body_html?: string;
  body_json: string | null;
  status: string;
  view_count: number;
  published_at: string;
  created_at: string;
  updated_at: string;
  category_id: string;
  author_id: string;
  tags: Tag[];
  featured_image_url?: string | null;
  featured_image_caption?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Meta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

// --- Domain functions ---

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
