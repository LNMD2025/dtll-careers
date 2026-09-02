# dtll.org — DTLL Group

Static site for **DTLL Group**: Dough Bros, Paradise Pizzas and Nalou Kitchen.

Home, pizza, pasta, coffee and cookies are cinematic brand showcases. **Hiring lives only on Careers** (`careers.html`), including resume and cover letter uploads via FormSubmit to courtney@lnmd.com.au.

Live production today: **https://dtll.org** (Cloudflare Pages project `dtll-careers`, deploys from `main`).

This branch adds a **CMS admin** so Dean can edit jobs and swap site images without GitHub. Preview is a **Workers.dev** deploy of Worker `dtll-cms`. **Do not attach `dtll.org` to that Worker** until SNR is ready to cut over.

## What Dean uses

1. Open `/admin/` on the Worker preview (same origin as the site files).
2. Sign in with a magic link to an `@lnmd.com.au` email (Dean, Tash, Courtney).
3. **Jobs** — create, edit, archive, reorder. Careers reads live open jobs from `/api/jobs`.
4. **Images** — upload a replacement onto a named slot (`hero-spread`, `pizza-card`, `careers-team`, …). Public pages with `data-slot` pick up the new URL from `/api/media`.

The apply form is unchanged: multipart FormSubmit to courtney@lnmd.com.au.

## Cloudflare

| Deploy | What it is | Custom domain |
|---|---|---|
| Pages `dtll-careers` | Current live site | `dtll.org` / `www.dtll.org` — leave this alone |
| Worker `dtll-cms` | Preview: static files + `/admin` + `/api/*` | **none** — workers.dev only |

Do not wrangler-deploy over the Pages project. Do not create a new Pages project. The Worker name is `dtll-cms` on purpose.

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

### Supabase Auth redirect URLs

Dashboard → Authentication → URL configuration:

- **Site URL:** `https://<your-worker>.workers.dev`
- **Redirect URLs:**
  - `https://<your-worker>.workers.dev/admin/`
  - `http://localhost:8787/admin/`

Email provider: Magic Link (default). First login creates the user. Only `@lnmd.com.au` can call admin APIs.

### First admin login

No seed password. Open `/admin/`, enter `dean@lnmd.com.au` (or Tash / Courtney), click the email link. If the link lands on the wrong host, add that host to Redirect URLs.

## Public API

| Method | Path | Who |
|---|---|---|
| `GET` | `/api/jobs` | Public — active jobs only |
| `GET` | `/api/media` | Public — `{ slots: { "hero-spread": { public_url, title } } }` |
| `GET` | `/api/config` | Public — Supabase URL + anon key for the admin page |
| `GET/POST/PUT` | `/api/admin/*` | Bearer JWT from magic link, `@lnmd.com.au` only |

Careers fetches `/api/jobs` in `js/main.js`. If the API is missing (Pages production today), the hardcoded fallback list still renders so the live site does not go blank.

## Database

SQL: `supabase/migrations/20260902000000_site_cms.sql`

- `site_jobs` — title, store (`doughbros` \| `paradise` \| `nalou` \| `all`), location, employment type, description, active, sort_order
- `site_media` — slot_key, title, storage_path, public_url
- Storage bucket `dtll-site-media` (public read)
- RLS: anyone can read active jobs + all media; writes require an authenticated `@lnmd.com.au` JWT

Project: **dtll-cms** in ap-southeast-2 (`axrrlolqkzbeqrkjyoen`).

## Media slots

Seeded from the current `media/` files. Uploading in admin replaces `public_url` with a Supabase Storage URL. Pages that have `data-slot="…"` swap the image client-side.

Used on the public site: `hero-spread`, `doughbros-shop-01`, `paradise-shop-02`, `pizza-card`, `pasta-card`, `nalou-coffee-01`, `doughbros-cookie-01`, `pizza-hero`, `doughbros-shop-02`, `paradise-pizza-01`, `pizza-slice`, `pasta-hero`, `gallery-spread`, `pasta-lasagna`, `nalou-coffee-02`, `nalou-brunch-01`, `gallery-nalou-brunch`, `nalou-food-01`, `nalou-kitchen`, `careers-team`, `careers-line`, `doughbros-cookie-02`, `cookies-hero`. Extra library files are seeded so they can be assigned later.

## Cut over later (not this PR)

When SNR wants dtll.org to serve live jobs and admin:

1. Confirm the workers.dev preview.
2. Either migrate the Pages project to this Worker, **or** add a Pages Function that proxies `/api/*` and `/admin/*`.
3. Add `https://dtll.org/admin/` to Supabase redirect URLs.
4. Only then attach the custom domain. Say so in the PR if you do this.
