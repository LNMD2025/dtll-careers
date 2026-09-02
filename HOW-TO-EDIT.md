# How to edit dtll.org

## Fastest: Admin (no GitHub)

1. Open `/admin/`
2. Sign in with email and password
3. **Jobs** — New job / Edit / Archive / arrows to reorder. Careers updates from `/api/jobs` on the next load
4. **Images** — pick the page, then the labeled slot (`Pizza page image 1`, `Cookies page image 2`, …). Upload a photo and/or save overlay title, kicker, and body

Applications still go to courtney@lnmd.com.au through the same Careers form. Do not change that form unless Courtney asks.

## Still works: edit in GitHub

The site is the GitHub repo **LNMD2025/dtll-careers**. Worker **`dtll-cms`** serves **https://dtll.org**.

## What file controls what

| Want to change | Where |
|---|---|
| Job titles, locations, who is hiring | **Admin → Jobs** |
| Page photos and overlay words | **Admin → Images** (labeled by page). Files in `media/` stay as the fallback |
| Apply form / Courtney email / resume + cover letter | `careers.html` (multipart FormSubmit) — leave this alone for MVP |
| Slot map / new placements | `worker/slots.ts` plus a Supabase migration |
| Colours, type, layout | `css/styles.css` |

## Brand name

Use **DTLL Group** everywhere. Not “LNMD Mount Gambier”.
