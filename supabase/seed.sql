-- Snufsnuf — seed (dezelfde demo-data als src/lib/mock.ts)
-- Idempotent: eerst leegmaken, dan opnieuw vullen.

truncate table public.appointments, public.holds, public.animals,
               public.customers, public.services, public.providers restart identity cascade;

-- ── Providers ────────────────────────────────────────────────────────────────
insert into public.providers (slug, name, category, owner, city, distance_km, rating, review_count, blurb, species, skills, prikkelarm, mobiel) values
('trimsalon-sanne','Trimsalon Sanne','trimsalon','Sanne','Amsterdam',2.4,4.9,128,
 'Kleine salon die rustig werkt en veel ervaring heeft met herplaatsers en onbekende kruisingen. Elke hond krijgt de tijd die de vacht vraagt.',
 '{hond}','{angsthond,handstrippen,senior}', true, false),
('salon-mark-team','Salon Mark & team','trimsalon','Mark','Amsterdam',3.1,4.7,243,
 'Salon met drie trimmers en twee tafels. Van puppywenbeurt tot volledige knipbeurt, en genoeg capaciteit om snel terecht te kunnen.',
 '{hond}','{puppy,senior,handstrippen}', false, false),
('kattentrim-iris','Kattentrim Iris','kattentrimsalon','Iris','Amsterdam',5.8,5.0,61,
 'Werkt uitsluitend met katten, in een prikkelarme kamer, een op een. Geen honden in de agenda, dus geen onrust in de wachtruimte.',
 '{kat}','{kat}', true, false),
('mobiel-youssef','Youssef mobiel trimmen','mobiele_trimmer','Youssef','Amsterdam',1.2,4.8,94,
 'Komt met een volledig ingerichte bus naar je adres. Geen reisstress voor de hond, en jij hoeft de deur niet uit.',
 '{hond}','{senior}', false, true);

-- ── Diensten ─────────────────────────────────────────────────────────────────
insert into public.services (provider_id, species, name, description, pricing, coat_surcharge, breed_exceptions, required_skills, buffer_min, indicative)
select id, 'hond', 'Volledige knipbeurt',
 'Wassen, drogen, knippen, nagels en oren. De duur rekenen we uit de maat en de vacht, dus een krulvacht met klitten kost meer tijd dan een gladde vacht.',
 '[{"sizeClass":"xs","priceCents":3500,"durationMin":45},{"sizeClass":"s","priceCents":4500,"durationMin":60},{"sizeClass":"m","priceCents":5500,"durationMin":75},{"sizeClass":"l","priceCents":6500,"durationMin":90},{"sizeClass":"xl","priceCents":7500,"durationMin":120}]'::jsonb,
 '{"krul":{"extraMin":30,"extraCents":1500},"lang":{"extraMin":20,"extraCents":1000},"dubbel":{"extraMin":25,"extraCents":1200}}'::jsonb,
 '[{"breed":"Labradoodle","priceCents":8000,"durationMin":120}]'::jsonb,
 '{}', 15, true
from public.providers where slug = 'trimsalon-sanne';

insert into public.services (provider_id, species, name, description, pricing, coat_surcharge, breed_exceptions, required_skills, buffer_min, indicative)
select id, 'hond', 'Kennismaking',
 'Korte afspraak om de hond rustig te laten wennen aan de salon, zonder volledige beurt. Aangeraden bij een eerste hond of een onzekere hond.',
 '[{"sizeClass":"xs","priceCents":1500,"durationMin":20},{"sizeClass":"s","priceCents":1500,"durationMin":20},{"sizeClass":"m","priceCents":1500,"durationMin":20},{"sizeClass":"l","priceCents":1500,"durationMin":20},{"sizeClass":"xl","priceCents":1500,"durationMin":20}]'::jsonb,
 '{}', '[]', '{angsthond}', 10, false
from public.providers where slug = 'trimsalon-sanne';

insert into public.services (provider_id, species, name, description, pricing, coat_surcharge, breed_exceptions, required_skills, buffer_min, indicative)
select id, 'hond', 'Knip- en wasbeurt',
 'Complete beurt door een van onze trimmers. Grotere en dikkere vachten plannen we bij een senior trimmer in.',
 '[{"sizeClass":"xs","priceCents":3200,"durationMin":45},{"sizeClass":"s","priceCents":4200,"durationMin":55},{"sizeClass":"m","priceCents":5200,"durationMin":70},{"sizeClass":"l","priceCents":6200,"durationMin":85},{"sizeClass":"xl","priceCents":7200,"durationMin":110}]'::jsonb,
 '{"krul":{"extraMin":25,"extraCents":1200},"dubbel":{"extraMin":25,"extraCents":1200}}'::jsonb,
 '[]', '{}', 15, true
from public.providers where slug = 'salon-mark-team';

insert into public.services (provider_id, species, name, description, pricing, coat_surcharge, breed_exceptions, required_skills, buffer_min, indicative)
select id, 'hond', 'Puppy wenbeurt',
 'Korte, positieve eerste kennismaking met trimmen voor pups onder zes maanden. Geen volledige knipbeurt.',
 '[{"sizeClass":"xs","priceCents":2000,"durationMin":30},{"sizeClass":"s","priceCents":2000,"durationMin":30},{"sizeClass":"m","priceCents":2000,"durationMin":30},{"sizeClass":"l","priceCents":2000,"durationMin":30},{"sizeClass":"xl","priceCents":2000,"durationMin":30}]'::jsonb,
 '{}', '[]', '{puppy}', 10, false
from public.providers where slug = 'salon-mark-team';

insert into public.services (provider_id, species, name, description, pricing, coat_surcharge, breed_exceptions, required_skills, buffer_min, indicative)
select id, 'kat', 'Kattentrimbeurt',
 'Rustige beurt in een prikkelarme kamer, een op een. We volgen het tempo van de kat en stoppen als het te veel wordt.',
 '[{"sizeClass":"s","priceCents":5000,"durationMin":60},{"sizeClass":"m","priceCents":5500,"durationMin":70},{"sizeClass":"l","priceCents":6000,"durationMin":80}]'::jsonb,
 '{"lang":{"extraMin":20,"extraCents":1500}}'::jsonb,
 '[]', '{kat}', 20, true
from public.providers where slug = 'kattentrim-iris';

insert into public.services (provider_id, species, name, description, pricing, coat_surcharge, breed_exceptions, required_skills, buffer_min, indicative)
select id, 'hond', 'Knipbeurt aan huis',
 'Volledige beurt in de bus voor de deur. Voorrijden binnen het werkgebied is inbegrepen.',
 '[{"sizeClass":"s","priceCents":5500,"durationMin":60},{"sizeClass":"m","priceCents":6500,"durationMin":75},{"sizeClass":"l","priceCents":7500,"durationMin":90}]'::jsonb,
 '{"krul":{"extraMin":30,"extraCents":1500},"lang":{"extraMin":20,"extraCents":1000}}'::jsonb,
 '[]', '{}', 30, true
from public.providers where slug = 'mobiel-youssef';

-- ── Klant + opgeslagen dieren (Ahmed met twee labradoodles) ──────────────────
insert into public.customers (provider_id, name, email, phone)
select id, 'Ahmed', 'ahmed@example.com', '0612345678'
from public.providers where slug = 'trimsalon-sanne';

insert into public.animals (customer_id, name, species, breed, size_class, coat_type, weight_kg, behavior, bite_risk, muzzle_required, top_note)
select c.id, 'Bella', 'hond', 'Labradoodle', 'l', 'krul', 24, '{sociaal}', 0, false, 'Houdt niet van de fohn op haar kop'
from public.customers c where c.email = 'ahmed@example.com';

insert into public.animals (customer_id, name, species, breed, size_class, coat_type, weight_kg, behavior, bite_risk, muzzle_required)
select c.id, 'Moos', 'hond', 'Labradoodle', 'l', 'krul', 26, '{sociaal}', 0, false
from public.customers c where c.email = 'ahmed@example.com';

-- ── Daglijst van vandaag (aanbieder-dashboard) ───────────────────────────────
insert into public.appointments (provider_id, service_id, animal, owner_name, service_name, staff, starts_at, duration_min, price_cents, status)
select p.id, s.id,
  '{"name":"Bella","breed":"Labradoodle","sizeClass":"l","coatType":"krul","biteRisk":0,"muzzleRequired":false,"behavior":["sociaal"],"topNote":"Houdt niet van de fohn op haar kop"}'::jsonb,
  'Ahmed', 'Volledige knipbeurt', 'Sanne',
  (current_date + time '09:00') at time zone 'Europe/Amsterdam', 120, 8000, 'aanwezig'
from public.providers p
join public.services s on s.provider_id = p.id and s.name = 'Volledige knipbeurt'
where p.slug = 'trimsalon-sanne';

insert into public.appointments (provider_id, service_id, animal, owner_name, service_name, staff, starts_at, duration_min, price_cents, status)
select p.id, s.id,
  '{"name":"Rex","breed":"Mechelaar","sizeClass":"l","coatType":"glad","biteRisk":3,"muzzleRequired":true,"behavior":["reactief","niet met andere honden"],"medicalNote":"Bijt bij nagels knippen","topNote":"Een op een, niet naast andere honden laten wachten"}'::jsonb,
  'Marieke', 'Volledige knipbeurt', 'Sanne',
  (current_date + time '11:00') at time zone 'Europe/Amsterdam', 90, 6500, 'verwacht'
from public.providers p
join public.services s on s.provider_id = p.id and s.name = 'Volledige knipbeurt'
where p.slug = 'trimsalon-sanne';

insert into public.appointments (provider_id, service_id, animal, owner_name, service_name, staff, starts_at, duration_min, price_cents, status)
select p.id, s.id,
  '{"name":"Sjors","breed":"Spaniel","sizeClass":"m","coatType":"lang","biteRisk":0,"muzzleRequired":false,"behavior":["sociaal"],"medicalNote":"14 jaar, hartconditie, korte sessie met pauze","topNote":"Kan niet lang staan, pauze halverwege"}'::jsonb,
  'Wilma', 'Senior- en zorgbeurt', 'Sanne',
  (current_date + time '14:00') at time zone 'Europe/Amsterdam', 60, 5500, 'bevestigd'
from public.providers p
join public.services s on s.provider_id = p.id and s.name = 'Volledige knipbeurt'
where p.slug = 'trimsalon-sanne';
