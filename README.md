# dtll.org — DTLL Group

Static site for **DTLL Group**: Dough Bros, Paradise Pizzas and Nalou Kitchen.

Home, pizza, pasta, coffee and cookies are cinematic brand showcases. **Hiring lives only on Careers** (`careers.html`), including resume and cover letter uploads via FormSubmit to courtney@lnmd.com.au.

Live **https://dtll.org** and **https://www.dtll.org** are served by Worker **`dtll-cms`** (custom domains). Admin CRUD writes to Supabase `site_jobs`; Careers loads them via `GET /api/jobs`.

Cloudflare Pages project **`dtll-careers`** is **pages.dev only** — it is not the live custom-domain site. Keep GitHub `main` API-aware (`js/main.js` fetches `/api/jobs`) so a Pages rebuild cannot regress to hardcoded jobs.

## Admin

1. Open https://dtll.org/admin/ (same origin as the live site).
2. Sign in with email and password.
3. **Jobs** — create, edit, archive, reorder. Careers reads live open jobs from `/api/jobs`.
4. **Images** — upload a replacement onto a named slot (`hero-spread`, `pizza-card`, `careers-team`, …). Public pages with `data-slot` pick up the new URL from `/api/media`.

The apply form is unchanged: multipart FormSubmit to courtney@lnmd.com.au.

## Cloudflare

| Deploy | What it is | Custom domain |
|---|---|---|
| Worker `dtll-cms` | Live site: static files + `/admin` + `/api/*` | `dtll.org` / `www.dtll.org` |
| Pages `dtll-careers` | Static preview from `main` | **none** — `*.pages.dev` only |

Do not attach `dtll.org` to another Worker or Pages project. Do not create a new Pages project. The Worker name is `dtll-cms` on purpose. Keep `main` API-aware.

```bash
npm install
npx wrangler deploy
```

Then set the optional service-role secret (Worker still works without it — admin writes go through the signed-in JWT and RLS):

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

## Environment

Public Worker vars (already in `wrangler.jsonc`):

| Name | Purpose |
|---|---|
| `SUPABASE_URL` | `https://axrrlolqkzbeqrkjyoen.supabase.co` |
| `SUPABASE_ANON_KEY` | Legacy anon JWT (safe in the client) |
| `ADMIN_EMAIL_DOMAIN` | `lnmd.com.au` |

Secrets (optional but recommended):

| Name | Purpose |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Project Settings → API → `service_role`. **Never** put this in the browser or `wrangler.jsonc`. |

Local: copy `.dev.vars.example` to `.dev.vars`.

### First admin login

Create staff users in the Supabase dashboard (Authentication → Users) with email and password. Open `/admin/` and sign in. Do not commit or paste passwords in the repo or PR.

## Public API

| Method | Path | Who |
|---|---|---|
| `GET` | `/api/jobs` | Public — active jobs only |
| `GET` | `/api/media` | Public — `{ slots: { "hero-spread": { public_url, title } } }` |
| `GET` | `/api/config` | Public — Supabase URL + anon key for the admin page |
| `GET/POST/PUT` | `/api/admin/*` | Bearer JWT from a signed-in staff session |

Careers fetches `/api/jobs` in `js/main.js` with `cache: "no-store"`. A successful CMS response always replaces the list (including an empty array when every role is archived). The hardcoded fallback is used only when that request fails.

## Database

SQL: `supabase/migrations/20260902000000_site_cms.sql`

- `site_jobs` — title, store (`doughbros` \| `paradise` \| `nalou` \| `all`), location, employment type, description, active, sort_order
- `site_media` — slot_key, title, storage_path, public_url
- Storage bucket `dtll-site-media` (public read)
- RLS: anyone can read active jobs + all media; writes require an authenticated staff JWT

Project: **dtll-cms** in ap-southeast-2 (`axrrlolqkzbeqrkjyoen`).

## Media slots

Seeded from the current `media/` files. Uploading in admin replaces `public_url` with a Supabase Storage URL. Pages that have `data-slot="…"` swap the image client-side.

Used on the public site: `hero-spread`, `doughbros-shop-01`, `paradise-shop-02`, `pizza-card`, `pasta-card`, `nalou-coffee-01`, `doughbros-cookie-01`, `pizza-hero`, `doughbros-shop-02`, `paradise-pizza-01`, `pizza-slice`, `pasta-hero`, `gallery-spread`, `pasta-lasagna`, `nalou-coffee-02`, `nalou-brunch-01`, `gallery-nalou-brunch`, `nalou-food-01`, `nalou-kitchen`, `careers-team`, `careers-line`, `doughbros-cookie-02`, `cookies-hero`. Extra library files are seeded so they can be assigned later.

## Deploy

Live custom domains already point at Worker `dtll-cms`. After merging API-aware `js/main.js` to `main`, Pages `dtll-careers` stays a pages.dev preview and will not overwrite dtll.org.
