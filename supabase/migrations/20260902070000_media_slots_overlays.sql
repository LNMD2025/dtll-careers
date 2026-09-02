-- Page-labeled media slots plus overlay copy for cinematic brand pages.

ALTER TABLE public.site_media
  ADD COLUMN IF NOT EXISTS page text NOT NULL DEFAULT 'library',
  ADD COLUMN IF NOT EXISTS overlay_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS overlay_subtitle text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS overlay_body text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 100;

CREATE INDEX IF NOT EXISTS site_media_page_sort_idx
  ON public.site_media (page, sort_order, slot_key);

INSERT INTO public.site_media (
  slot_key, title, storage_path, public_url, page, sort_order,
  overlay_title, overlay_subtitle, overlay_body
)
VALUES
  ('home-1', 'Home page image 1', 'media/hero-spread.jpg', '/media/hero-spread.jpg', 'home', 10, 'DTLL Group', 'Dough Bros · Paradise · Nalou', 'Three rooms. One standard. Mount Gambier.'),
  ('home-2', 'Home page image 2', 'media/doughbros-shop-01.jpg', '/media/doughbros-shop-01.jpg', 'home', 20, 'Food people come back for.', 'The rooms', ''),
  ('home-3', 'Home page image 3', 'media/paradise-shop-02.jpg', '/media/paradise-shop-02.jpg', 'home', 30, '', '', ''),
  ('home-4', 'Home page image 4', 'media/pizza-card.jpg', '/media/pizza-card.jpg', 'home', 40, 'Pizza', 'Dough Bros & Paradise', 'Slow rise. Loaded. Built to disappear.'),
  ('home-5', 'Home page image 5', 'media/pasta-card.jpg', '/media/pasta-card.jpg', 'home', 50, 'Pasta', 'House sauce', 'Carbonara. Bolognese. Chilli penne.'),
  ('home-6', 'Home page image 6', 'media/nalou-coffee-01.jpg', '/media/nalou-coffee-01.jpg', 'home', 60, 'Coffee', 'Nalou Kitchen', 'Long coffees. Damn good food by day.'),
  ('home-7', 'Home page image 7', 'media/doughbros-cookie-01.jpg', '/media/doughbros-cookie-01.jpg', 'home', 70, 'Cookies', 'Dough Bros', 'Too much. On purpose.'),

  ('pizza-1', 'Pizza page image 1', 'media/pizza-hero.jpg', '/media/pizza-hero.jpg', 'pizza', 10, 'Pizza.', 'Dough Bros & Paradise', 'Slow rise. Loaded. Built to disappear.'),
  ('pizza-2', 'Pizza page image 2', 'media/pizza-hero.jpg', '/media/pizza-hero.jpg', 'pizza', 20, 'Better inputs. Bigger pies.', '', ''),
  ('pizza-3', 'Pizza page image 3', 'media/pizza-card.jpg', '/media/pizza-card.jpg', 'pizza', 30, '', '', ''),
  ('pizza-4', 'Pizza page image 4', 'media/doughbros-shop-01.jpg', '/media/doughbros-shop-01.jpg', 'pizza', 40, 'Dough Bros', 'Marketplace', 'Pink neon. Slow dough. Pizza and pasta under one roof.'),
  ('pizza-5', 'Pizza page image 5', 'media/doughbros-shop-02.jpg', '/media/doughbros-shop-02.jpg', 'pizza', 50, '', '', ''),
  ('pizza-6', 'Pizza page image 6', 'media/paradise-pizza-01.jpg', '/media/paradise-pizza-01.jpg', 'pizza', 60, 'Paradise', '205 Commercial St W', 'Pizza Lovers Club. Hot from the warmer.'),
  ('pizza-7', 'Pizza page image 7', 'media/paradise-shop-02.jpg', '/media/paradise-shop-02.jpg', 'pizza', 70, '', '', ''),
  ('pizza-8', 'Pizza page image 8', 'media/pizza-slice.jpg', '/media/pizza-slice.jpg', 'pizza', 80, 'Take the slice.', '', ''),

  ('pasta-1', 'Pasta page image 1', 'media/pasta-hero.jpg', '/media/pasta-hero.jpg', 'pasta', 10, 'Pasta.', 'Dough Bros & Paradise', 'House sauce. Italian pasta.'),
  ('pasta-2', 'Pasta page image 2', 'media/gallery-spread.jpg', '/media/gallery-spread.jpg', 'pasta', 20, 'Carbonara. Bolognese. Chilli penne.', '', ''),
  ('pasta-3', 'Pasta page image 3', 'media/pasta-lasagna.jpg', '/media/pasta-lasagna.jpg', 'pasta', 30, 'Lasagna.', 'The bake', 'Layers. Sauce. The slice that holds.'),
  ('pasta-4', 'Pasta page image 4', 'media/doughbros-shop-01.jpg', '/media/doughbros-shop-01.jpg', 'pasta', 40, 'Same kitchens. Same obsession.', '', ''),

  ('coffee-1', 'Coffee page image 1', 'media/nalou-coffee-01.jpg', '/media/nalou-coffee-01.jpg', 'coffee', 10, 'Coffee.', 'Nalou Kitchen', 'Long coffees. 82 Commercial Street West.'),
  ('coffee-2', 'Coffee page image 2', 'media/nalou-coffee-01.jpg', '/media/nalou-coffee-01.jpg', 'coffee', 20, 'Toasted. Tall. First.', '', ''),
  ('coffee-3', 'Coffee page image 3', 'media/nalou-coffee-02.jpg', '/media/nalou-coffee-02.jpg', 'coffee', 30, '', '', ''),
  ('coffee-4', 'Coffee page image 4', 'media/nalou-brunch-01.jpg', '/media/nalou-brunch-01.jpg', 'coffee', 40, 'Brunch that earns the coffee.', 'By day', ''),
  ('coffee-5', 'Coffee page image 5', 'media/gallery-nalou-brunch.jpg', '/media/gallery-nalou-brunch.jpg', 'coffee', 50, '', '', ''),
  ('coffee-6', 'Coffee page image 6', 'media/nalou-food-01.jpg', '/media/nalou-food-01.jpg', 'coffee', 60, 'Damn good food.', 'The pass', ''),
  ('coffee-7', 'Coffee page image 7', 'media/nalou-kitchen.jpg', '/media/nalou-kitchen.jpg', 'coffee', 70, '', '', ''),
  ('coffee-8', 'Coffee page image 8', 'media/careers-team.jpg', '/media/careers-team.jpg', 'coffee', 80, 'Stay a while.', '', ''),

  ('cookies-1', 'Cookies page image 1', 'media/doughbros-cookie-01.jpg', '/media/doughbros-cookie-01.jpg', 'cookies', 10, 'Cookies.', 'Loaded NY cookies · Dough Bros', 'Too much. On purpose.'),
  ('cookies-2', 'Cookies page image 2', 'media/doughbros-cookie-02.jpg', '/media/doughbros-cookie-02.jpg', 'cookies', 20, 'Biscoff. Reese’s. Nutella M&M.', '', ''),
  ('cookies-3', 'Cookies page image 3', 'media/cookies-hero.jpg', '/media/cookies-hero.jpg', 'cookies', 30, 'Marble top deck.', 'The counter', 'Pick it up warm. Don’t share.'),
  ('cookies-4', 'Cookies page image 4', 'media/doughbros-shop-02.jpg', '/media/doughbros-shop-02.jpg', 'cookies', 40, 'Dough Bros.', '', ''),

  ('careers-1', 'Careers page image 1', 'media/careers-team.jpg', '/media/careers-team.jpg', 'careers', 10, 'Work across DTLL Group', 'DTLL Group careers', 'Apply across Dough Bros, Paradise Pizzas and Nalou Kitchen. Attach a resume and cover letter.'),
  ('careers-2', 'Careers page image 2', 'media/careers-line.jpg', '/media/careers-line.jpg', 'careers', 20, '', '', '')
ON CONFLICT (slot_key) DO UPDATE
SET
  title = EXCLUDED.title,
  page = EXCLUDED.page,
  sort_order = EXCLUDED.sort_order,
  overlay_title = CASE
    WHEN public.site_media.overlay_title = '' THEN EXCLUDED.overlay_title
    ELSE public.site_media.overlay_title
  END,
  overlay_subtitle = CASE
    WHEN public.site_media.overlay_subtitle = '' THEN EXCLUDED.overlay_subtitle
    ELSE public.site_media.overlay_subtitle
  END,
  overlay_body = CASE
    WHEN public.site_media.overlay_body = '' THEN EXCLUDED.overlay_body
    ELSE public.site_media.overlay_body
  END,
  public_url = CASE
    WHEN public.site_media.public_url LIKE 'https://%supabase.co/%' THEN public.site_media.public_url
    ELSE EXCLUDED.public_url
  END;

-- Carry the already-uploaded cookies counter photo onto Cookies page image 3.
UPDATE public.site_media AS dest
SET
  public_url = src.public_url,
  storage_path = src.storage_path
FROM public.site_media AS src
WHERE dest.slot_key = 'cookies-3'
  AND src.slot_key = 'cookies-hero'
  AND src.public_url LIKE 'https://%';
