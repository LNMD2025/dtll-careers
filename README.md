# dtll.org — DTLL Group

Site + CMS for **DTLL Group**: Dough Bros, Paradise Pizzas and Nalou Kitchen.

Home, pizza, pasta, coffee and cookies are cinematic brand showcases. **Hiring lives only on Careers** (`careers.html` and `/careers`), including resume and cover letter uploads via FormSubmit to courtney@lnmd.com.au.

Live: **https://dtll.org** on Worker **`dtll-cms`** (custom domains `dtll.org` and `www.dtll.org`). Do **not** attach those domains to `crew-hq` or any other Worker.

## Admin

1. Open `/admin/`
2. Sign in with email and password
3. **Jobs** — create, edit, archive, reorder. Careers reads `/api/jobs` (active roles only)
4. **Images** — grouped by page (`Home page image 1`, `Pizza page image 2`, …). Upload a photo and/or edit overlay title, kicker, and body

The apply form is unchanged: multipart FormSubmit to courtney@lnmd.com.au.

## Cloudflare

| Deploy | What it is | Custom domain |
|---|---|---|
| Worker `dtll-cms` | Production site + `/admin` + `/api/*` | `dtll.org` / `www.dtll.org` |
| Pages `dtll-careers` | Git preview / leftover static project | do not re-attach production domains |

```bash
npm install
npx wrangler deploy
```

Optional secret (admin writes work via signed-in JWT + RLS without it):

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

### Rollback

```bash
npx wrangler versions list
npx wrangler rollback
# or
npx wrangler rollback <VERSION_ID>
```

That rolls Worker `dtll-cms` to the previous (or named) version. Custom domains stay on `dtll-cms`.

## Environment

Public Worker vars (already in `wrangler.jsonc`):

| Name | Purpose |
|---|---|
| `SUPABASE_URL` | `https://axrrlolqkzbeqrkjyoen.supabase.co` |
| `SUPABASE_ANON_KEY` | Legacy anon JWT (safe in the client) |
| `ADMIN_EMAIL_DOMAIN` | Server-side allowlist only. Never returned to the browser |

Secrets:

| Name | Purpose |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Project Settings → API → `service_role`. **Never** put this in the browser or `wrangler.jsonc` |

Local: copy `.dev.vars.example` to `.dev.vars`.

### First admin login

Create staff users in the Supabase dashboard (Authentication → Users) with email and password. Open `/admin/` and sign in. Do not commit or paste passwords.

## Public API

| Method | Path | Who |
|---|---|---|
| `GET` | `/api/jobs` | Public — active jobs only, `Cache-Control: no-store` |
| `GET` | `/api/media` | Public — slot map including overlay fields |
| `GET` | `/api/config` | Public — Supabase URL + anon key only |
| `GET/POST/PUT/PATCH` | `/api/admin/*` | Bearer JWT from a signed-in staff session |

Careers fetches `/api/jobs` in `js/main.js` and paints that list. Hardcoded fallback jobs are used only if the API request fails.

## Database

SQL:

- `supabase/migrations/20260902000000_site_cms.sql`
- `supabase/migrations/20260902070000_media_slots_overlays.sql`

- `site_jobs` — title, store (`doughbros` \| `paradise` \| `nalou` \| `all`), location, employment type, description, active, sort_order
- `site_media` — slot_key, page, title/label, storage_path, public_url, overlay_title, overlay_subtitle, overlay_body, sort_order
- Storage bucket `dtll-site-media` (public read)
- RLS: anyone can read active jobs + all media; writes require an authenticated staff JWT

Project: **dtll-cms** in ap-southeast-2 (`axrrlolqkzbeqrkjyoen`).

## Media slots

Admin Images is a page → slot map. Each public placement has its own key so Pizza page image 1 is independent of Home page image 4.

Overlay fields (`overlay_title`, `overlay_subtitle`, `overlay_body`) drive the cinematic copy on that photo.
