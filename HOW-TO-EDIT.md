# How to edit dtll.org

## Fastest: Admin (no GitHub)

Live **https://dtll.org** (and www) is Worker **`dtll-cms`**. Edit jobs and photos there:

1. Open https://dtll.org/admin/
2. Sign in with email and password
3. **Jobs** — New job / Edit / Archive / arrows to reorder. Careers reads `/api/jobs`.
4. **Images** — pick a slot, choose a photo, Upload. That page uses the new photo on the next load.

Applications still go to courtney@lnmd.com.au through the same Careers form. Do not change that form unless Courtney asks.

## GitHub / Pages

The site source is the GitHub repo **LNMD2025/dtll-careers**. Keep `main` API-aware (`js/main.js` fetches `/api/jobs`) so it cannot regress to a hardcoded jobs list.

Cloudflare Pages project **`dtll-careers`** is **pages.dev only** — it does not serve dtll.org.

1. Open https://github.com/LNMD2025/dtll-careers
2. Click the file
3. Click the pencil
4. Commit to `main`

## What file controls what

| Want to change | Where |
|---|---|
| Job titles, locations, who is hiring | **Admin → Jobs** (`js/main.js` fallback only if `/api/jobs` fails) |
| Hero / product / store photos | **Admin → Images** (slots). Files in `media/` stay as the fallback |
| Apply form / Courtney email / resume + cover letter | `careers.html` (multipart FormSubmit) — leave this alone for MVP |
| Home page copy | `index.html` |
| Pizza / pasta / coffee / cookie pages | `pizzas.html` `pasta.html` `coffee.html` `cookies.html` |
| Colours, type, layout | `css/styles.css` |

## Brand name

Use **DTLL Group** everywhere. Not “LNMD Mount Gambier”.
