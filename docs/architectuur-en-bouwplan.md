# Snufsnuf — Architectuur en bouwplan

> Scope van dit document: **Fase 1 + Fase 2** (de echte eerste release, ~60 regels uit de
> functiespecificatie). De overall architectuur is zo gekozen dat Fase 3 t/m 8 erin passen
> zonder herbouw, maar alleen Fase 1+2 wordt hier tot op tabel- en endpointniveau ontworpen.
>
> Status: ontwerp · Stack-besluit: Next.js App Router + Vercel · Datum: 2026-10-26

---

## 1. Wat deze release moet bewijzen

| Fase | Wat | Bewijs dat het werkt |
|:--:|---|---|
| 1 | Aanmelden, diensten met maatklasse-prijzen, rooster, uitzonderingen, agenda | Tien salons in één stad hebben een werkende agenda |
| 2 | Dierprofiel, gedragsprofiel, verplichte intake, boeken, betalen, bevestiging | Twintig boekingen van begin tot eind zonder handwerk |

Alles daarbuiten (widget, bot, vaccinatiepoort, pension-dagcapaciteit, wachtlijstautomaat,
reviews) is **expliciet uit scope** voor deze release, ook waar het in de spec P0 heet. Het
datamodel en de modulegrenzen laten die features toe, maar we bouwen ze niet nu.

De kern in één zin blijft leidend: **we verkopen een agenda die weet wat erin staat.** Dat
betekent: het dier is een echt record, en prijs + duur komen uit dat record. Die twee dingen
mogen nergens kortgesloten worden tot "vast getal".

---

## 2. Stackbesluiten (met reden)

| Laag | Keuze | Waarom |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Eén codebase voor marketplace, aanbieder-dashboard én later de widget. Server Components voor de zoek-/profielpagina's (SEO, §I/§P-16), Server Actions + Route Handlers voor mutaties. |
| Runtime | **Node.js op Fluid Compute** (geen Edge) | Volledige Node-API, langere duur, streaming werkt zonder Edge. Stripe- en DB-drivers draaien probleemloos. |
| Database | **Neon Postgres** (Vercel Marketplace) | Serverless Postgres met branching → elke preview-deploy krijgt een eigen DB-branch. Relationeel is hier verplicht: afspraken, holds en prijsregels zijn zwaar relationeel en transactioneel. |
| ORM | **Drizzle** | Type-safe, dunne laag, expliciete SQL waar het telt (holds, beschikbaarheid), eenvoudige migraties met terugrolpad (R-15). |
| Auth | **Clerk** (Marketplace) voor aanbieders + interne rollen; **gast-boeking** als eigen flow voor consumenten | Clerk levert Google-login, magic link en 2FA (R-14) kant-en-klaar. Consumenten boeken zonder account (J-09) → gewone boekingsrij met e-mail/telefoon, achteraf koppelbaar aan een Clerk-account (J-10). Alternatief als je volledig self-hosted wilt: Auth.js v5 — zie §12 open besluiten. |
| Betalen | **Stripe Connect**, separate charges + transfers (R-02) | Geld landt op de rekening van de aanbieder; Snufsnuf houdt alleen commissie in (Fase 3+). iDEAL, kaart, Apple Pay (J-13). |
| Achtergrondtaken | **Vercel Cron** | Hold-opruiming (R-05), later herinneringen (K-04/05). |
| Mail | **Resend** (Marketplace) | Bevestigings- en herinneringsmail (J-16, N-03). Eigen afzenderdomein later (N-11). |
| Validatie | **Zod** | Eén schema-bron voor forms, Server Actions én de latere bot-tools. |
| UI | **Tailwind + shadcn/ui** | Snel, toegankelijk (WCAG 2.1 AA op boekingsflow is harde eis), en de widget erft later dezelfde componenten. |

> **Integraties worden echt geprovisioned** via de Vercel Marketplace (Neon, Clerk, Resend,
> Stripe). Geen mocks als standaard. Dat gebeurt pas in de bouwfase, niet in dit document.

---

## 3. Datamodel (Fase 1+2)

De entiteiten uit §28 van de spec, uitgewerkt tot kolommen voor wat Fase 1+2 raakt. Pension-
dagcapaciteit, vaccinatie, wachtlijst en review staan erin als **latere tabellen** en worden
hier alleen genoemd zodat de relaties kloppen.

### 3.1 Multi-tenant grondslag (R-01)

Elke rij die aan een aanbieder hangt draagt `provider_id`. Scheiding op twee niveaus:

1. **Postgres Row-Level Security**: policies die `provider_id = current_setting('app.provider_id')`
   afdwingen. De DB-sessie zet die setting per request op basis van de ingelogde aanbieder.
2. **App-laag**: een `scopedDb(providerId)` helper die geen query zonder scope toelaat.

Marketplace-/publieke leeskant (zoeken, profielpagina) draait via een aparte, expliciet
read-only rol die alleen `status = 'actief'` aanbieders ziet.

### 3.2 Kernentiteiten

```
provider            (= tenant)
  id, category (enum), legal_name, kvk, address, phone, website,
  profile_text, logo_url, brand_color, status (concept|in_review|actief|afgekeurd|verborgen|geschorst),
  service_area (jsonb: postcodes | radius | polygon),  -- A-06, P1
  created_at, updated_at

provider_media       -- A-08 fotogalerij
  id, provider_id, url, sort_order, kind (work_photo|logo)

staff               -- medewerker (C-02)
  id, provider_id, name, role (owner|groomer), skills (text[]),  -- G-05
  is_active

staff_schedule       -- weekrooster (C-01)
  id, staff_id, weekday (0-6), start_time, end_time

schedule_exception   -- C-04 vakantie/ziekte/feestdag
  id, staff_id, date | date_range, type, blocks_whole_day (bool)

resource            -- C-03 tafel/wasbak (optioneel in Fase 1)
  id, provider_id, type, capacity, size_limit

service             -- dienst (B-01)
  id, provider_id, species (hond|kat|...),  -- soort als EERSTE dimensie
  name, description, visibility, buffer_minutes (B-10),
  booking_horizon_days (D-01), min_notice_minutes (D-02),
  required_skills (text[]),  -- D-link naar staff.skills
  status (concept|published)

service_pricing      -- B-02/B-04/B-06 : het hart van de moat
  id, service_id,
  size_class (xxs|xs|s|m|l|xl) NULL,      -- prijs/duur per maatklasse
  breed NULL,                             -- ras-uitzondering (B-04) wint van size_class
  coat_type NULL,                         -- vachtdimensie (B-06), telt op
  price_cents, duration_minutes,
  enabled (bool)
  -- resolutie-volgorde: breed-match > (size_class + coat_type) > size_class

surcharge            -- B-08/B-09 toeslagen (klit, nagels, ophalen...)
  id, service_id, name, price_cents, extra_minutes, mandatory (bool)

breed_library        -- B-05 (platform-breed, niet per tenant)
  id, species, name, default_coat_type, default_size_class

customer            -- baasje (E-01)
  id, provider_id, email, phone, name,
  account_user_id NULL  -- koppeling naar Clerk-account als die bestaat

animal              -- HET dier (E-02) — de datamoat
  id, customer_id, species, breed NULL, name, birthdate, weight_grams,
  coat_type, size_class,            -- E-03 sturen prijs + duur
  behavior (jsonb: sociaal|angstig|reactief|niet_met_honden),  -- E-04
  bite_risk_level, muzzle_required, -- E-05 (zichtbaar bovenaan daglijst)
  medical_notes,                    -- E-06
  top_note varchar(140),            -- E-12 (P0)
  photo_url

appointment         -- de transactie (E-07 historie hangt hieraan)
  id, provider_id, customer_id, animal_id, service_id, staff_id,
  resource_id NULL,
  starts_at (timestamptz), ends_at (timestamptz),  -- let op tijdzone, §5.4
  status (aanvraag|bevestigd|verwacht|aanwezig|in_behandeling|klaar|opgehaald|no_show|geannuleerd),
  price_cents_quoted,     -- indicatieve vanaf-prijs bij boeken
  price_cents_final NULL, -- na afronden/voortijdig stoppen
  intake (jsonb),         -- D-08 verplichte velden, ingevuld
  payment_id NULL,
  created_at

hold                -- voorkomt dubbele boeking (R-04/R-05)
  id, provider_id, service_id, staff_id, starts_at, ends_at,
  animal_id NULL, expires_at,       -- TTL 10 min, configureerbaar
  idempotency_key                   -- L-05/R-04

payment             -- Stripe
  id, appointment_id, stripe_payment_intent, amount_cents,
  type (aanbetaling|volledig), status

-- LATER (relaties voorbereid, niet gebouwd in Fase 1+2):
-- vaccination, waitlist_entry, review, conversation, turn,
-- day_capacity + bench_unit (pension), service_area polygon-detail
```

### 3.3 Waarom dit model het verschil maakt

- **`animal` is geen notitieveld.** Prijs, duur, intake, daglijst-waarschuwing en later de
  bot hangen allemaal aan dit record. Dat is precies wat Treatwell/Salonized niet doen (§5).
- **`service_pricing` met drie dimensies** (maatklasse × vacht, met ras-uitzondering) is de
  reden dat een doodle-met-klitten de agenda niet laat uitlopen. De resolutie-volgorde is een
  pure functie — zie §5.1.
- **`hold` is een aparte tabel**, geen vlag op appointment. Zo kan een slot vastgehouden zijn
  zonder dat er al een afspraak bestaat, en ruimt een cron verlopen holds op.

---

## 4. Modulearchitectuur

```
app/
  (marketplace)/            # publiek, read-only, SEO
    zoeken/                 # I-05 filterpagina (terugval; bot komt Fase 7)
    [provider]/             # I-14 aanbiederpagina met live beschikbaarheid
  (boeken)/                 # consument-boekingsflow, Fase 2
    [provider]/[service]/   # J-01 t/m J-17 keten
  (dashboard)/              # aanbieder, achter Clerk-auth
    onboarding/             # A-01 t/m A-18 trapsgewijs
    diensten/               # B-* prijs & duur
    agenda/                 # C-* rooster + agenda
    klanten/                # E-* klant- en dierkaart
  (admin)/                  # interne rollen, 2FA, Fase 1 minimaal (P-01/P-02)
  api/
    holds/                  # POST hold, DELETE release
    bookings/               # POST idempotent (R-04)
    webhooks/stripe/        # betaalbevestiging
    cron/expire-holds/      # R-05

lib/
  pricing/                  # §5.1 — pure prijs/duur-resolver, geen IO
  availability/             # §5.2 — slotgeneratie uit rooster − afspraken − holds
  booking/                  # §5.3 — hold → betaal → afspraak, idempotent
  auth/                     # Clerk + rollen + gast-sessie
  db/                       # Drizzle schema, scopedDb, RLS-setting
  tenancy/                  # provider-scope guard
```

Harde regel: **`pricing/` en `availability/` zijn pure, IO-vrije modules** met eigen unit-tests.
Ze zijn de latere bot-tools (L-02/L-03) in de kern al, zonder dat de bot bestaat.

---

## 5. Kritieke mechanismen

### 5.1 Prijs- en duurmotor (de moat)

Eén pure functie, input volledig uit records:

```
resolvePrice(service, animal, surcharges[]) -> { from_cents, duration_minutes, is_indicative }
```

Resolutie-volgorde:
1. **Ras-uitzondering** (`service_pricing.breed == animal.breed`) wint altijd (B-04).
2. Anders: **maatklasse-regel** (`size_class`) als basis, **+ vachttoeslag-duur** als er een
   `coat_type`-regel bestaat (B-06, duur telt op).
3. **Toeslagen** (B-08/B-09): mandatory tellen altijd mee, optionele apart.
4. `is_indicative = true` zodra vacht meespeelt → naar de klant altijd **"vanaf"-prijs** (B-07,
   L-17). Nooit een vaste prijs beloven bij vachtgevoelige diensten.

Maatklasse wordt bepaald uit ras of gewicht (B-03) via `breed_library`; onbekend ras → vraag
maat + vacht uit (nu in een formulier, later de bot L-12).

### 5.2 Beschikbaarheid

```
slots(provider, service, staff?, dateRange) =
    rooster(staff, weekday)                 # C-01 vensters
  − schedule_exception                       # C-04 vakantie/ziekte
  − bestaande appointments (+ buffer B-10)
  − actieve holds (expires_at > now)
  ∩ booking_horizon  ∩  min_notice           # D-01/D-02
  ∩ staff.skills ⊇ service.required_skills    # D-12 / UC-06
```

Een vrij slot is pas een **geschikt** slot als skill/maat/protocol kloppen (§5 uit spec). De
slotgeneratie houdt daar nu al rekening mee, ook al voegen angsthond-protocollen pas later toe.

### 5.3 Boeken: hold → betaal → afspraak (idempotent)

1. **Hold** (`POST /api/holds`): reserveert slot met `expires_at = now + 10min` (configureerbaar),
   geeft `hold_id` + `idempotency_key`. Transactie met `SELECT ... FOR UPDATE` op het slot zodat
   twee gelijktijdige holds niet botsen.
2. Klant vult dier + verplichte intake (D-08), ziet voorwaarden (D-16/J-12).
3. **Betaal**: Stripe PaymentIntent; bij eerste klant eventueel aanvraag i.p.v. bevestiging (D-03).
4. **Afspraak** (`POST /api/bookings` met `hold_id` + `idempotency_key`): tweemaal versturen →
   **één** afspraak (R-04). Hold wordt geconsumeerd, slot definitief geblokkeerd.
5. Verloopt de hold ongebruikt → cron (`/api/cron/expire-holds`, elke minuut) geeft het slot terug
   (R-05). Reads behandelen verlopen holds sowieso als vrij (riem én bretels).

### 5.4 Tijdzone (R-03)

Alles opslaan als `timestamptz` in UTC; roosters zijn **lokale** tijden (Europe/Amsterdam) en
worden per dag naar UTC opgelost met correcte DST-overgang. Een slot van 10:00 blijft 10:00 lokaal
op de dag dat de klok verspringt. Dit wordt een expliciete testcase, geen aanname.

### 5.5 Multi-tenant (R-01)

Zie §3.1. Elke niet-publieke query loopt door `scopedDb(providerId)`; een query zonder scope is
een typefout die niet compileert. Publieke leeskant via aparte read-rol op `status = 'actief'`.

---

## 6. Routes / API-oppervlak (Fase 1+2)

| Route | Methode | Spec | Opmerking |
|---|---|---|---|
| `/api/holds` | POST / DELETE | J-05/J-06, R-04 | hold pakken / vrijgeven, met TTL |
| `/api/bookings` | POST | J-13/J-17, R-04 | idempotent op hold_id |
| `/api/webhooks/stripe` | POST | R-02 | betaling → afspraak bevestigen |
| `/api/cron/expire-holds` | GET (cron) | R-05 | elke minuut |
| Server Actions | — | B-*, C-*, E-* | dashboard-mutaties (dienst, rooster, dier) |
| Server Components | — | I-13/I-14 | zoeken + aanbiederpagina, live slots |

---

## 7. Niet-functionele eisen die het ontwerp raken (§27)

- Zoeken p95 < 400 ms, slotophalen p95 < 250 ms → geïndexeerde queries, slot-cache per
  (provider, service, dag) met invalidatie bij afspraak/hold-mutatie.
- WCAG 2.1 AA op de boekingsflow → shadcn/ui + toetsenbord/focus/aria vanaf dag één.
- EU-hosting + verwerkersovereenkomst per leverancier → Neon/Clerk/Resend/Stripe EU-regio,
  register van verwerkers (S-14) vanaf de eerste integratie.
- Versleuteling in rust en transport (R-13) → standaard bij de gekozen providers, vastleggen.

---

## 8. Bouwplan Fase 1 (tickets → spec-ID)

> Mijlpaal: tien salons in één stad hebben een werkende agenda.

1. **Fundament**: repo, Vercel-project, Neon provisioning, Drizzle-schema §3, RLS + `scopedDb`,
   Clerk-auth met aanbieder- en interne rol (R-01, R-14, A-01).
2. **Onboarding**: trapsgewijs met tussentijds opslaan en voortgang (A-01/A-02/A-17/A-18),
   categorie stuurt velden (A-03), KvK-formaatcheck (A-04), bedrijfsgegevens + profieltekst +
   foto's (A-05/A-07/A-08).
3. **Diensten & prijsmotor**: dienst CRUD (B-01), `service_pricing` + maatklasse (B-02/B-03),
   ras-uitzondering (B-04), vanaf-prijs (B-07), buffer (B-10). `lib/pricing` met unit-tests.
4. **Rooster & agenda**: weekrooster (C-01), uitzonderingen (C-04), dagcapaciteit-plekhouder,
   agenda dag/week/maand met slepen (C-09), handmatige afspraak + blokkade (C-10/C-11).
   `lib/availability` met unit-tests, inclusief DST-test (R-03).
5. **Admin minimaal**: aanbiederkeuring + schorsen (P-01/P-02) zodat de marktplaats geloofwaardig
   opent.

### Bewijs Fase 1

Tien testsalons ingevoerd, elk met diensten + maatklasse-prijzen + rooster; agenda toont correcte
vrije slots, buffer en uitzonderingen; een handmatige afspraak blokkeert het slot.

## 9. Bouwplan Fase 2 (tickets → spec-ID)

> Mijlpaal: twintig boekingen van begin tot eind zonder handwerk.

1. **Klant & dier**: klantkaart (E-01), dier aanmaken met verplichte velden (E-02), vacht + maat
   (E-03), gedrag + bijtrisico (E-04/E-05), topnotitie 140 tekens (E-12), medische notitie (E-06).
2. **Zoek-/profielkant minimaal**: aanbiederkaart met vanaf-prijs, afstand, eerst-vrij (I-13),
   aanbiederpagina met live beschikbaarheid (I-14). Bot nog niet — filterpagina is de ingang.
3. **Boekingsflow**: dienst + maatklasse + vanaf-prijs (J-01), dier kiezen/aanmaken (J-02/J-03),
   slot kiezen met live beschikbaarheid + hold + aftelling (J-05/J-06), verplichte intake (J-07/
   D-08), gast-boeking zonder account (J-09), voorwaarden tonen (J-12/D-16), aanvraag bij eerste
   klant (D-03/J-17).
4. **Betalen**: Stripe Connect separate charges (R-02), iDEAL/kaart/Apple Pay (J-13), idempotente
   booking-endpoint (R-04), hold-expiry cron (R-05).
5. **Bevestiging & notificatie**: bevestigingsscherm + mail (J-15/J-16), aanbieder-melding
   (N-01), herinnering 24u/2u (K-04/K-05) — herinneringen via cron.

### Bewijs Fase 2

Twintig echte boekingen doorlopen de keten: hold → intake → betaling → afspraak → bevestigingsmail,
zonder dat de salon iets handmatig hoeft te doen. Dubbele submit levert één afspraak op.

---

## 10. Wat we bewust NIET bouwen in deze release

Widget (Fase 3), bot + tool-calling (Fase 7), vaccinatiepoort (Fase 4), pension-dagcapaciteit +
benchunits + meerdaagse boeking (Fase 5), wachtlijstautomaat (Fase 6), reviews + rasfilters +
agendasync (Fase 8). Plus alles uit §26 van de spec (kassa, voorraad, cadeaubonnen,
boekhoudkoppeling, routeoptimalisatie, websitebouwer, telefonie).

De volgorde is niet vrijblijvend: **de widget komt vóór de bot** (Fase 3 vóór 7) — zelfde codepad,
het is wat een salon laat tekenen, en levert de boekingen waarmee je later de bot test.

---

## 11. Risico's

| Risico | Mitigatie |
|---|---|
| Prijsmotor wordt stilletjes "vast getal" onder druk | `is_indicative` is verplicht veld; vanaf-prijs is de enige publieke weergave bij vacht. Unit-tests borgen de resolutie-volgorde. |
| Dubbele boeking bij gelijktijdigheid | `SELECT FOR UPDATE` op slot bij hold + idempotency_key op booking + cron-opruiming. |
| DST-fout in slotberekening | Expliciete testcase maart/oktober vóór oplevering (R-03). |
| Tenant-lek | Postgres RLS én `scopedDb`-guard; publieke read-rol apart. |
| P0 te groot voor één release | Alleen Fase 1+2 bouwen; rest schuift door, ook als het P0 heet (zoals de spec zelf voorschrijft). |

## 12. Open besluiten (voor jou)

1. **Auth**: Clerk (snel, 2FA/Google/magic-link kant-en-klaar) vs. Auth.js v5 (volledig
   self-hosted, meer werk aan 2FA). Voorstel: **Clerk**, tenzij je self-hosted wilt.
2. **Eerste stad**: welke stad openen we als pilot? (Bepaalt testdata en SEO-pagina's later.)
3. **Monorepo nu of later**: de widget (Fase 3) deelt componenten. Eén Next.js-app nu, pas bij
   Fase 3 eventueel splitsen. Voorstel: **nu één app**, niet vooruit optimaliseren.
