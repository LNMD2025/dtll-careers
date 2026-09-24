-- Hiring push, Sept 2026: DoughBros drivers + kitchen crew, Paradise drivers, Nalou full-time chef.
-- Safe to re-run. Run in Supabase SQL editor (project dtll-cms) or recreate the same roles in /admin → Jobs.

update site_jobs set title='Delivery Driver', store='doughbros', location_label='Mount Gambier Marketplace', employment_type='Casual / Part-time', sort_order=10, active=true, updated_at=now(), description=$d$Evenings, 4–9pm. Get Dough Bros pizza, pasta, burgers and shakes to Mount Gambier doors hot and on time. You’re the last face our customers see, so reliability and a good attitude matter as much as speed.

What you’ll do
- Pick up and deliver orders on time across Mount Gambier
- Handle payments and cash accurately
- Communicate clearly with the store and customers
- Represent Dough Bros on the road

What you need
- Current driver’s licence and your own reliable car
- Availability 4–9pm during evening trade
- Cash handling experience, or confidence to learn quickly
- Friendly, reliable and switched on$d$
where id='11111111-1111-4111-8111-111111111003';

insert into site_jobs (id, title, store, location_label, employment_type, description, active, sort_order) values
('11111111-1111-4111-8111-111111111011','Delivery Driver','paradise','205 Commercial St W','Casual / Part-time',$d$Evenings, 4–9pm. Drive for Paradise Pizzas and get Mount Gambier’s favourite pizzas to the door hot and on time. Reliable, friendly and know the town? This one’s for you.

What you’ll do
- Pick up and deliver orders on time across Mount Gambier
- Handle payments and cash accurately
- Communicate clearly with the store and customers
- Represent Paradise on the road

What you need
- Current driver’s licence and your own reliable car
- Availability 4–9pm during evening trade
- Cash handling experience, or confidence to learn quickly$d$, true, 11),
('11111111-1111-4111-8111-111111111012','Kitchen Crew','doughbros','Mount Gambier Marketplace','Casual / Part-time',$d$Pizza, prep and the line. Dough Bros moves fast — we need crew who can keep up, keep it clean and keep the quality high on every order. No experience? We’ll train you.

What you’ll do
- Stretch, top and bake pizzas and help build the rest of the menu to spec
- Prep, portion and keep the line stocked
- Keep the kitchen clean and ready for the next rush
- Work with the team to hit ticket times without dropping quality

What you need
- Energy, reliability and a good attitude
- Availability across evening and weekend trade
- Kitchen experience is a bonus, not a must — training provided$d$, true, 12)
on conflict (id) do update set title=excluded.title, store=excluded.store, location_label=excluded.location_label,
  employment_type=excluded.employment_type, description=excluded.description, active=true, sort_order=excluded.sort_order, updated_at=now();

update site_jobs set title='Chef — Full-time', employment_type='Full-time', sort_order=13, active=true, updated_at=now(), description=$d$Nalou is looking for a full-time Chef to run service across Nalou by day and Nalou by Night. Big things are cooking — we want someone who takes pride in the plate and keeps the pass moving.

What you’ll do
- Prep, cook and plate cafe, restaurant and burger-style dishes to spec
- Run the pass and keep ticket times tight without dropping quality
- Keep the kitchen clean, stocked and ready for the next service
- Support menu execution across daytime and evening trade

What you need
- Experience in a cafe, restaurant or burger kitchen
- Ability to work cleanly and calmly under pressure
- Full-time availability across day and evening shifts, 7am–9pm
- Willingness to work across 7 days (rostered)$d$
where id='11111111-1111-4111-8111-111111111006';
