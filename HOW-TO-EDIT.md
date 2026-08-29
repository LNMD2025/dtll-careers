# How to edit dtll.org

The site is the GitHub repo **LNMD2025/dtll-careers**.
Once Cloudflare Pages is connected to that repo, every save on `main` goes live.

## Fastest: edit in the browser

1. Open https://github.com/LNMD2025/dtll-careers
2. Click the file (e.g. `careers.html` or `js/main.js`)
3. Click the pencil
4. Change the text
5. Commit to `main`

Cloudflare rebuilds in about a minute.

## What file controls what

| Want to change | File |
|---|---|
| Home page copy | `index.html` |
| Jobs list (titles, locations, descriptions) | `js/main.js` — the `jobs` array |
| Apply form / Courtney email | `careers.html` |
| Pizza / pasta / coffee / cookie pages | `pizzas.html` `pasta.html` `coffee.html` `cookies.html` |
| Colours, type, layout | `css/styles.css` |
| Photos | drop files into `media/` (preferred) or `images/` then point the `src` at them |

## Add a photo from Drive or Instagram

1. Download the image to your computer (from Drive or IG).
2. In the repo click **Add file → Upload files**.
3. Put it in `media/` e.g. `media/pizza-hero.jpg` (or `images/` if you prefer that folder).
4. In the HTML change the image tag to:

```html
<img src="media/pizza-hero.jpg" alt="Dough Bros pizza" />
```

Drive links will **not** work on the public site unless the file is set to “Anyone with the link”. Uploading into `media/` is the reliable way. Live pages already use venue photos from the official brand sites — see `media/SOURCES.md`.

## Add or remove a job

Open `js/main.js`. Each role looks like:

```js
{
  id: "pizza-maker-db",
  title: "Pizza Maker",
  brand: "DoughBros",
  location: "Mount Gambier Marketplace",
  type: "Full-time / Part-time",
  summary: "One line on the card.",
  body: "Full description in the popup."
}
```

Copy a block, change the fields, save.

## Brand name

Use **DTLL Group** everywhere. Not “LNMD Mount Gambier”.
