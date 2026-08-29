# Brand media sources

Live pages use **local** files in this folder. No Unsplash. No hotlinked Instagram CDNs.

## What shipped (public brand sites)

Downloaded from the shops’ own sites and committed here. Dean owns these brands.

### Paradise Pizzas — paradisepizzas.com.au

- `https://d2ova09jg8x3xk.cloudfront.net/projects.deliverit.com.au/nparadisepizza/uploads/img-slider1.jpg`
- `https://d2ova09jg8x3xk.cloudfront.net/projects.deliverit.com.au/nparadisepizza/uploads/img-slider2.jpg`
- `https://d2ova09jg8x3xk.cloudfront.net/projects.deliverit.com.au/nparadisepizza/uploads/img-slider4.jpg`
- `https://d2ova09jg8x3xk.cloudfront.net/projects.deliverit.com.au/nparadisepizza/uploads/img-slider5.jpg`
- `https://d2ova09jg8x3xk.cloudfront.net/projects.deliverit.com.au/nparadisepizza/uploads/item-img2.jpg`
- `https://d2ova09jg8x3xk.cloudfront.net/projects.deliverit.com.au/nparadisepizza/uploads/item-img3.jpg`

### Dough Bros — doughbrospizza.com.au / orderonline.doughbrospizza.com.au

- `https://d2ova09jg8x3xk.cloudfront.net/doughbrospizza.com.au/uploads/thumbs/DB_CONTENT_SHOOT_FEBRUARY_2026-1.webp`
- `https://d2ova09jg8x3xk.cloudfront.net/doughbrospizza.com.au/uploads/thumbs/DB_CONTENT_SHOOT_FEBRUARY_2026-80.webp`
- `https://d2ova09jg8x3xk.cloudfront.net/doughbrospizza.com.au/uploads/thumbs/Lasagna_3.webp`

### Nalou Kitchen — naloukitchen.com.au

- `https://naloukitchen.com.au/wp-content/uploads/2026/01/Nalou_Kitchen_Home-02.jpg`
- `https://naloukitchen.com.au/wp-content/uploads/2026/01/Nalou_Night_Home-02.jpg`
- `https://naloukitchen.com.au/wp-content/uploads/2026/01/Nalou_Home-02.jpg`
- `https://naloukitchen.com.au/wp-content/uploads/2026/01/Nalou_Team-01.jpg`
- `https://naloukitchen.com.au/wp-content/uploads/2026/01/Nalou_Team-02.jpg`
- `https://naloukitchen.com.au/wp-content/uploads/2026/01/Nalou_Brunch-02.jpg`
- `https://naloukitchen.com.au/wp-content/uploads/2026/01/Smoothie_MangoLavaFlow.jpg`
- `https://naloukitchen.com.au/wp-content/uploads/2026/02/NZ6_0091.jpg`
- `https://naloukitchen.com.au/wp-content/uploads/2026/06/Nalou_May_Content_Shoot_2026-2-scaled.jpeg`

Public Instagram (`@doughbros_mtg`, `@naloukitchen`, `@paradise_pizzas5290`) is login-walled from this environment — do not hotlink `cdninstagram` URLs.

## Follow-up: ZBM / Drive (Charles)

Agents cannot open private Drive. Charles is compressing a web-sized set separately. Drop those files into `media/` (or `images/`) and point the HTML `src` at them.

Known folders Dean owns:

| Shoot | Drive folder |
|---|---|
| Nalou August 2026 FULL ALBUM | https://drive.google.com/drive/folders/1U7Oh0LnsNZwBLyT8rJM2KXtsnmf4pCBn |
| Paradise (ZBM) | https://drive.google.com/drive/folders/1Q_YCnvK-b-oLxxkFfENBKSL3NNLOE-cy |
| DOUGHBROS CONTENT / October content shoots (loaded cookies, food, candid) | in Drive (no folder id in this note) |
| DOUGH-CHI | in Drive |
| Nalou winter menu | in Drive |
| Nalou Logo [Burger].png | in Drive |

Priority swaps when those files land:

1. Loaded NY cookie product shot → `cookies.html` hero (`media/cookies-hero.jpg`)
2. Long-black / espresso still → coffee card / coffee hero
3. Nalou logo if we add a mark next to **DTLL Group**
4. Extra gallery stills (candid / shop / team)

Do not replace current files with Unsplash or generic stock from another city.
