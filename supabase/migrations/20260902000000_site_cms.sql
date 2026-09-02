-- DTLL site CMS: jobs + media slots
-- Public read for active jobs and all media; writes for @lnmd.com.au via authenticated JWT.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.site_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  store text NOT NULL CHECK (store IN ('doughbros', 'paradise', 'nalou', 'all')),
  location_label text NOT NULL DEFAULT '',
  employment_type text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_jobs_active_sort_idx
  ON public.site_jobs (active, sort_order, created_at);

CREATE TRIGGER site_jobs_set_updated_at
  BEFORE UPDATE ON public.site_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.site_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_key text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  storage_path text,
  public_url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER site_media_set_updated_at
  BEFORE UPDATE ON public.site_media
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.site_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_jobs_public_read_active
  ON public.site_jobs
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY site_jobs_admin_read
  ON public.site_jobs
  FOR SELECT
  TO authenticated
  USING (lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2)) = 'lnmd.com.au');

CREATE POLICY site_jobs_admin_insert
  ON public.site_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2)) = 'lnmd.com.au');

CREATE POLICY site_jobs_admin_update
  ON public.site_jobs
  FOR UPDATE
  TO authenticated
  USING (lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2)) = 'lnmd.com.au')
  WITH CHECK (lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2)) = 'lnmd.com.au');

CREATE POLICY site_jobs_admin_delete
  ON public.site_jobs
  FOR DELETE
  TO authenticated
  USING (lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2)) = 'lnmd.com.au');

CREATE POLICY site_media_public_read
  ON public.site_media
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY site_media_admin_insert
  ON public.site_media
  FOR INSERT
  TO authenticated
  WITH CHECK (lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2)) = 'lnmd.com.au');

CREATE POLICY site_media_admin_update
  ON public.site_media
  FOR UPDATE
  TO authenticated
  USING (lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2)) = 'lnmd.com.au')
  WITH CHECK (lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2)) = 'lnmd.com.au');

CREATE POLICY site_media_admin_delete
  ON public.site_media
  FOR DELETE
  TO authenticated
  USING (lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2)) = 'lnmd.com.au');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dtll-site-media',
  'dtll-site-media',
  true,
  8388608,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY site_media_objects_public_read
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'dtll-site-media');

CREATE POLICY site_media_objects_admin_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dtll-site-media'
    AND lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2)) = 'lnmd.com.au'
  );

CREATE POLICY site_media_objects_admin_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'dtll-site-media'
    AND lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2)) = 'lnmd.com.au'
  )
  WITH CHECK (
    bucket_id = 'dtll-site-media'
    AND lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2)) = 'lnmd.com.au'
  );

CREATE POLICY site_media_objects_admin_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'dtll-site-media'
    AND lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2)) = 'lnmd.com.au'
  );

-- Seed current hardcoded careers titles
INSERT INTO public.site_jobs (id, title, store, location_label, employment_type, description, active, sort_order)
VALUES
  (
    '11111111-1111-4111-8111-111111111001',
    'Pizza Maker',
    'doughbros',
    'Mount Gambier Marketplace',
    'Full-time / Part-time',
    'Hand-stretch, top and bake our slow-rise pizzas at pace.

You’ll live on the make line: stretch dough, load toppings evenly, run the oven and keep tickets moving on Friday nights. Training provided.',
    true,
    10
  ),
  (
    '11111111-1111-4111-8111-111111111002',
    'Kitchen Hand / Prep',
    'paradise',
    '205 Commercial St W',
    'Casual',
    'Prep, wash, pack and keep the line stocked.

Paradise runs hot from lunch through late. Prep veg, portion toppings, pack orders, keep boards clean.',
    true,
    20
  ),
  (
    '11111111-1111-4111-8111-111111111003',
    'Front of House / Counter',
    'doughbros',
    'Mount Gambier Marketplace',
    'Casual / Part-time',
    'Take orders, run the counter, look after walk-ins.

First face people see. Phone and counter orders, pickup, keep the front tidy.',
    true,
    30
  ),
  (
    '11111111-1111-4111-8111-111111111004',
    'Barista',
    'nalou',
    '82 Commercial St W',
    'Part-time / Full-time',
    'Long coffees, tight milk, a room that starts the day.

Nalou is coffee first. Consistent shots, proper milk, morning rush. Commercial machine experience required.',
    true,
    40
  ),
  (
    '11111111-1111-4111-8111-111111111005',
    'Floor / Wait Staff',
    'nalou',
    '82 Commercial St W',
    'Casual',
    'Brunch floor that turns into dinner.

Breakfast, lunch and selected night shifts. RSA a plus for night service.',
    true,
    50
  ),
  (
    '11111111-1111-4111-8111-111111111006',
    'Cook — Nalou by Night',
    'nalou',
    '82 Commercial St W',
    'Part-time evenings',
    'Burgers and dinner plates when the lights dim.

Tuesday–Saturday nights. Grill, pass and plate. Commercial kitchen experience required.',
    true,
    60
  ),
  (
    '11111111-1111-4111-8111-111111111007',
    'Delivery Driver',
    'all',
    'Mount Gambier',
    'Casual evenings',
    'Hot food, on time, across town.

Current licence, reliable car. Bags supplied. Fuel contribution as per store policy.',
    true,
    70
  ),
  (
    '11111111-1111-4111-8111-111111111008',
    'Shift Supervisor',
    'all',
    'Mount Gambier',
    'Full-time',
    'Run a shift: people, tickets, quality and close-down.

Open or close, set the pace, coach juniors, protect food quality. Path into store management.',
    true,
    80
  ),
  (
    '11111111-1111-4111-8111-111111111009',
    'Store Manager',
    'all',
    'Mount Gambier',
    'Full-time',
    'P&L, people, product.

Rostering, food cost, hiring, service standards. Multi-site hospitality management preferred.',
    true,
    90
  )
ON CONFLICT (id) DO NOTHING;

-- Seed known image slots. public_url starts as the static /media file so Pages
-- and Worker previews look identical until an admin uploads a replacement.
INSERT INTO public.site_media (slot_key, title, storage_path, public_url)
VALUES
  ('hero-spread', 'Home hero — Paradise table spread', 'media/hero-spread.jpg', '/media/hero-spread.jpg'),
  ('doughbros-shop-01', 'Dough Bros neon interior', 'media/doughbros-shop-01.jpg', '/media/doughbros-shop-01.jpg'),
  ('paradise-shop-02', 'Paradise Pizzas neon', 'media/paradise-shop-02.jpg', '/media/paradise-shop-02.jpg'),
  ('pizza-card', 'Home / pizza card — three pies', 'media/pizza-card.jpg', '/media/pizza-card.jpg'),
  ('pasta-card', 'Home pasta card — Italian spread', 'media/pasta-card.jpg', '/media/pasta-card.jpg'),
  ('nalou-coffee-01', 'Nalou toasted marshmallow coffee', 'media/nalou-coffee-01.jpg', '/media/nalou-coffee-01.jpg'),
  ('doughbros-cookie-01', 'Dough Bros Biscoff cookie pizza', 'media/doughbros-cookie-01.jpg', '/media/doughbros-cookie-01.jpg'),
  ('pizza-hero', 'Pizza page hero', 'media/pizza-hero.jpg', '/media/pizza-hero.jpg'),
  ('doughbros-shop-02', 'Dough Bros shop — Dough-Chi line', 'media/doughbros-shop-02.jpg', '/media/doughbros-shop-02.jpg'),
  ('paradise-pizza-01', 'Paradise warmer — Pizza Lovers Club', 'media/paradise-pizza-01.jpg', '/media/paradise-pizza-01.jpg'),
  ('pizza-slice', 'Pizza page closer — slice lift', 'media/pizza-slice.jpg', '/media/pizza-slice.jpg'),
  ('pasta-hero', 'Pasta page hero', 'media/pasta-hero.jpg', '/media/pasta-hero.jpg'),
  ('gallery-spread', 'Pasta spread — bowls beside pies', 'media/gallery-spread.jpg', '/media/gallery-spread.jpg'),
  ('pasta-lasagna', 'House lasagna wedge', 'media/pasta-lasagna.jpg', '/media/pasta-lasagna.jpg'),
  ('nalou-coffee-02', 'Nalou coffee among the plants', 'media/nalou-coffee-02.jpg', '/media/nalou-coffee-02.jpg'),
  ('nalou-brunch-01', 'Nalou flat-top brunch', 'media/nalou-brunch-01.jpg', '/media/nalou-brunch-01.jpg'),
  ('gallery-nalou-brunch', 'Nalou brunch plate', 'media/gallery-nalou-brunch.jpg', '/media/gallery-nalou-brunch.jpg'),
  ('nalou-food-01', 'Nalou fried-chicken sandwich', 'media/nalou-food-01.jpg', '/media/nalou-food-01.jpg'),
  ('nalou-kitchen', 'Nalou sliders', 'media/nalou-kitchen.jpg', '/media/nalou-kitchen.jpg'),
  ('careers-team', 'Careers / coffee — loaded shake', 'media/careers-team.jpg', '/media/careers-team.jpg'),
  ('careers-line', 'Careers — seasoning fries', 'media/careers-line.jpg', '/media/careers-line.jpg'),
  ('doughbros-cookie-02', 'Dough Bros Reese’s cookie', 'media/doughbros-cookie-02.jpg', '/media/doughbros-cookie-02.jpg'),
  ('cookies-hero', 'Cookies counter', 'media/cookies-hero.jpg', '/media/cookies-hero.jpg'),
  ('coffee-hero', 'Coffee hero (library)', 'media/coffee-hero.jpg', '/media/coffee-hero.jpg'),
  ('coffee-card', 'Coffee card (library)', 'media/coffee-card.jpg', '/media/coffee-card.jpg'),
  ('paradise-shop-01', 'Paradise staff + Pizza Lovers Club', 'media/paradise-shop-01.jpg', '/media/paradise-shop-01.jpg'),
  ('gallery-pizza', 'Gallery pizza', 'media/gallery-pizza.jpg', '/media/gallery-pizza.jpg'),
  ('gallery-service', 'Gallery service', 'media/gallery-service.jpg', '/media/gallery-service.jpg'),
  ('gallery-shop', 'Gallery shop', 'media/gallery-shop.jpg', '/media/gallery-shop.jpg'),
  ('gallery-nalou-bowl', 'Gallery Nalou bowl', 'media/gallery-nalou-bowl.jpg', '/media/gallery-nalou-bowl.jpg'),
  ('nalou-brunch', 'Nalou brunch (library)', 'media/nalou-brunch.jpg', '/media/nalou-brunch.jpg'),
  ('nalou-logo', 'Nalou logo on black', 'media/nalou-logo.png', '/media/nalou-logo.png'),
  ('nalou-logo-white', 'Nalou logo on white', 'media/nalou-logo-white.jpg', '/media/nalou-logo-white.jpg')
ON CONFLICT (slot_key) DO NOTHING;
