# How to edit dtll.org

## Fastest: Admin (no GitHub)

On the Worker preview (or later on dtll.org once cut over):

1. Open `/admin/`
2. Enter your `@lnmd.com.au` email
3. Click the magic link in your inbox
4. **Jobs** — New job / Edit / Archive / arrows to reorder. Careers updates itself.
5. **Images** — pick a slot, choose a photo, Upload. That page uses the new photo on the next load.

Only Dean, Tash and Courtney (`@lnmd.com.au`) can sign in.

Applications still go to courtney@lnmd.com.au through the same Careers form. Do not change that form unless Courtney asks.

## Still works: edit in GitHub

The site is also the GitHub repo **LNMD2025/dtll-careers**.
Cloudflare Pages project `dtll-careers` still publishes `main` to **https://dtll.org**.

1. Open https://github.com/LNMD2025/dtll-careers
2. Click the file
3. Click the pencil
4. Commit to `main`

## What file controls what

| Want to change | Where |
|---|---|
| Job titles, locations, who is hiring | **Admin → Jobs** (or `js/main.js` fallback list) |
| Hero / product / store photos | **Admin → Images** (slots). Files in `media/` stay as the fallback |
| Apply form / Courtney email / resume + cover letter | `careers.html` (multipart FormSubmit) — leave this alone for MVP |
| Home page copy | `index.html` |
| Pizza / pasta / coffee / cookie pages | `pizzas.html` `pasta.html` `coffee.html` `cookies.html` |
| Colours, type, layout | `css/styles.css` |

## Brand name

Use **DTLL Group** everywhere. Not “LNMD Mount Gambier”.
