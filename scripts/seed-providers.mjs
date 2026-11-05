// Eenmalige seed: verwijder nep-aanbieders en vul de marktplaats met 10 realistische
// dierenzorg-bedrijven (foto's, openingstijden, diensten). Draai met: node scripts/seed-providers.mjs
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const { createClient } = await import("@supabase/supabase-js");
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const OWNER = "b7b3f782-bc27-4738-9111-47e7bb76c75a"; // bedrijf@snufsnuf.nl
const JUNK = ["9ce0cc8f-3961-49db-aa17-0742b2b875d6", "6275bcf3-ecba-468d-93cc-bbcb11562cc5"];

const unsplash = (id) =>
  `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;
const dog = (n) => `https://placedog.net/900/650?id=${n}`;

// 10 bedrijven. hero = geverifieerde Unsplash-foto, daarna 2 galerijfoto's.
const P = [
  {
    slug: "trimsalon-de-zachte-poot", name: "Trimsalon De Zachte Poot", category: "trimsalon",
    city: "Amsterdam", address: "Haarlemmerdijk 112", postal_code: "1013 JE", distance_km: 0.8,
    rating: 4.9, review_count: 164, species: ["hond"], skills: ["angsthond", "puppy"],
    prikkelarm: true, mobiel: false,
    blurb: "Rustige trimsalon in de Jordaan met veel ervaring in angstige en oudere honden. We werken op afspraak zodat jouw hond alle aandacht krijgt.",
    photos: [unsplash("1548199973-03cce0bbc87b"), dog(11), dog(21)],
    hours: "winkel", services: "trim",
  },
  {
    slug: "hondensalon-vacht-en-co", name: "Hondensalon Vacht & Co", category: "trimsalon",
    city: "Utrecht", address: "Oudegracht 245", postal_code: "3511 NL", distance_km: 1.4,
    rating: 4.8, review_count: 98, species: ["hond"], skills: ["handstripping", "doodhaar"],
    prikkelarm: false, mobiel: false,
    blurb: "Van puppyknip tot volledige trimbeurt met handstrippen. We nemen de tijd voor vacht, nagels en oren en geven advies voor thuis.",
    photos: [unsplash("1601758228041-f3b2795255f1"), dog(12), dog(22)],
    hours: "winkel_za", services: "trim",
  },
  {
    slug: "kattentrimsalon-spinvis", name: "Kattentrimsalon Spinvis", category: "kattentrimsalon",
    city: "Rotterdam", address: "Nieuwe Binnenweg 88", postal_code: "3014 GC", distance_km: 2.1,
    rating: 5.0, review_count: 57, species: ["kat"], skills: ["kat", "ontklitten"],
    prikkelarm: true, mobiel: false,
    blurb: "Gespecialiseerd in katten met klitten of een lange vacht. Stressvrij wassen, scheren en ontklitten door een vaste trimster.",
    photos: [unsplash("1583337130417-3346a1be7dee"), dog(13), dog(23)],
    hours: "winkel", services: "kat",
  },
  {
    slug: "mobiele-trimservice-op-wielen", name: "Mobiele Trimservice Op Wielen", category: "mobiele_trimmer",
    city: "Den Haag", address: "Komt aan huis", postal_code: "2511 AA", distance_km: 3.3,
    rating: 4.7, review_count: 71, species: ["hond"], skills: ["angsthond"],
    prikkelarm: true, mobiel: true,
    blurb: "Wij komen met de trimbus naar jouw deur. Fijn voor honden die slecht tegen reizen kunnen of liever thuis op hun gemak blijven.",
    photos: [unsplash("1558788353-f76d92427f16"), dog(14), dog(24)],
    hours: "mobiel", services: "mobiel",
  },
  {
    slug: "trimsalon-borstel-en-bad", name: "Trimsalon Borstel & Bad", category: "trimsalon",
    city: "Arnhem", address: "Steenstraat 19", postal_code: "6828 CA", distance_km: 0.5,
    rating: 4.6, review_count: 142, species: ["hond"], skills: ["puppy", "doodhaar"],
    prikkelarm: false, mobiel: false,
    blurb: "Verzorgde trimbeurt in een lichte salon vlak bij het centrum. Wassen, drogen, knippen en nagels in een afspraak.",
    photos: [unsplash("1534361960057-19889db9621e"), dog(15), dog(25)],
    hours: "winkel_za", services: "trim",
  },
  {
    slug: "dierenpension-de-weide", name: "Dierenpension De Weide", category: "pension",
    city: "Nijmegen", address: "Weg door Jonkerbos 4", postal_code: "6532 SZ", distance_km: 5.9,
    rating: 4.8, review_count: 203, species: ["hond", "kat"], skills: ["pension", "medicatie"],
    prikkelarm: false, mobiel: false,
    blurb: "Logeren op een rustig terrein met ruime binnen- en buitenverblijven. Dagelijks uitlaten en persoonlijke aandacht, ook voor dieren met medicatie.",
    photos: [unsplash("1576201836106-db1758fd1c97"), dog(16), dog(26)],
    hours: "pension", services: "pension",
  },
  {
    slug: "uitlaatservice-vrolijke-staart", name: "Uitlaatservice Vrolijke Staart", category: "uitlaatservice",
    city: "Eindhoven", address: "Ophaalgebied Stratum", postal_code: "5611 AA", distance_km: 2.7,
    rating: 4.9, review_count: 86, species: ["hond"], skills: ["groepswandeling"],
    prikkelarm: false, mobiel: true,
    blurb: "Kleine groepswandelingen in het bos rond Eindhoven. We halen op en brengen terug en sturen na elke wandeling een berichtje.",
    photos: [unsplash("1583512603805-3cc6b41f3edb"), dog(17), dog(27)],
    hours: "uitlaat", services: "uitlaat",
  },
  {
    slug: "trimsalon-pluche", name: "Trimsalon Pluche", category: "trimsalon",
    city: "Groningen", address: "Folkingestraat 31", postal_code: "9711 JT", distance_km: 1.9,
    rating: 4.7, review_count: 119, species: ["hond"], skills: ["angsthond", "prikkelarm"],
    prikkelarm: true, mobiel: false,
    blurb: "Prikkelarme salon waar maar een hond tegelijk binnen is. Ideaal voor dieren die snel schrikken van drukte of geluid.",
    photos: [unsplash("1581888227599-779811939961"), dog(18), dog(28)],
    hours: "winkel", services: "trim",
  },
  {
    slug: "kattentrimsalon-fluweel", name: "Kattentrimsalon Fluweel", category: "kattentrimsalon",
    city: "Haarlem", address: "Generaal Cronjéstraat 54", postal_code: "2021 JD", distance_km: 1.1,
    rating: 4.9, review_count: 44, species: ["kat"], skills: ["kat", "ontklitten"],
    prikkelarm: true, mobiel: false,
    blurb: "Alleen katten, de hele dag door. Van een wasbeurt tot een leeuwenknip, altijd rustig en zonder verdoving.",
    photos: [unsplash("1596492784531-6e6eb5ea9993"), dog(19), dog(29)],
    hours: "winkel", services: "kat",
  },
  {
    slug: "trimsalon-krullenbol", name: "Trimsalon Krullenbol", category: "trimsalon",
    city: "Amersfoort", address: "Langestraat 76", postal_code: "3811 AP", distance_km: 3.0,
    rating: 4.8, review_count: 131, species: ["hond"], skills: ["angsthond", "doodhaar", "puppy"],
    prikkelarm: false, mobiel: false,
    blurb: "Specialist in krullende vachten zoals doodle, poedel en bichon. Scheren, scharen en modelleren met oog voor de huid.",
    photos: [unsplash("1548199973-03cce0bbc87b"), dog(20), dog(30)],
    hours: "winkel_za", services: "trim",
  },
];

const HOURS = {
  winkel: [[1, "09:00", "17:00"], [2, "09:00", "17:00"], [3, "09:00", "17:00"], [4, "09:00", "17:00"], [5, "09:00", "17:00"]],
  winkel_za: [[1, "09:00", "17:30"], [2, "09:00", "17:30"], [3, "09:00", "17:30"], [4, "09:00", "20:00"], [5, "09:00", "17:30"], [6, "10:00", "16:00"]],
  mobiel: [[1, "08:00", "18:00"], [2, "08:00", "18:00"], [3, "08:00", "18:00"], [4, "08:00", "18:00"], [5, "08:00", "18:00"]],
  pension: [[0, "08:00", "20:00"], [1, "08:00", "20:00"], [2, "08:00", "20:00"], [3, "08:00", "20:00"], [4, "08:00", "20:00"], [5, "08:00", "20:00"], [6, "08:00", "20:00"]],
  uitlaat: [[1, "08:00", "18:00"], [2, "08:00", "18:00"], [3, "08:00", "18:00"], [4, "08:00", "18:00"], [5, "08:00", "18:00"]],
};

// base_price_cents, base_duration_min, species, name, description, isFrom, perNight, perHour
const SERVICES = {
  trim: [
    [3500, 90, "hond", "Trimbeurt", "Wassen, drogen, knippen of plukken, nagels en oren. Prijs hangt af van maat en vacht.", true, false, false],
    [2500, 60, "hond", "Wassen en föhnen", "Grondige wasbeurt met ontklitten en föhnen.", false, false, false],
    [1000, 15, "hond", "Nagels knippen", "Snel langs voor alleen de nagels.", false, false, false],
  ],
  kat: [
    [4500, 75, "kat", "Kattentrimbeurt", "Wassen, drogen en knippen op maat van de kat.", true, false, false],
    [3000, 45, "kat", "Ontklitten", "Klitten eruit zonder stress, zonder verdoving.", false, false, false],
  ],
  mobiel: [
    [5000, 90, "hond", "Trimbeurt aan huis", "Volledige trimbeurt in de trimbus voor je deur.", true, false, false],
    [2000, 20, "hond", "Nagels aan huis", "Alleen de nagels, bij jou thuis.", false, false, false],
  ],
  pension: [
    [2800, 0, "hond", "Overnachting hond", "Verblijf per nacht inclusief uitlaten en voeren.", true, true, false],
    [2200, 0, "kat", "Kattenverblijf", "Rustig kattenverblijf per nacht.", true, true, false],
  ],
  uitlaat: [
    [1500, 60, "hond", "Groepswandeling", "Wandeling van een uur in een klein groepje.", true, false, true],
    [2500, 60, "hond", "Individuele wandeling", "Een-op-een wandeling op jouw tempo.", false, false, true],
  ],
};

async function main() {
  // 1) Nep-aanbieders + afhankelijke rijen opruimen
  for (const table of ["appointments", "holds", "schedule_exceptions", "services", "provider_hours"]) {
    const { error } = await db.from(table).delete().in("provider_id", JUNK);
    if (error) console.log(`  waarschuwing ${table}:`, error.message);
  }
  {
    const { error } = await db.from("providers").delete().in("id", JUNK);
    console.log(error ? "providers delete fout: " + error.message : "✓ nep-aanbieders verwijderd");
  }

  // 2) 10 aanbieders invoeren
  const rows = P.map((p) => ({
    slug: p.slug, name: p.name, category: p.category, owner: p.name, city: p.city,
    address: p.address, postal_code: p.postal_code, distance_km: p.distance_km,
    rating: p.rating, review_count: p.review_count, blurb: p.blurb, species: p.species,
    skills: p.skills, prikkelarm: p.prikkelarm, mobiel: p.mobiel, status: "actief",
    owner_user_id: OWNER, photos: p.photos,
    kvk: String(60000000 + Math.floor(p.distance_km * 111111)).slice(0, 8),
    phone: "06-" + String(10000000 + p.review_count * 37).slice(0, 8),
    website: "https://" + p.slug.replace(/-/g, "") + ".nl",
  }));
  const { data: inserted, error: insErr } = await db.from("providers").insert(rows).select("id, slug");
  if (insErr) { console.log("INSERT FOUT:", insErr.message); process.exit(1); }
  console.log(`✓ ${inserted.length} aanbieders aangemaakt`);
  const idBySlug = Object.fromEntries(inserted.map((r) => [r.slug, r.id]));

  // 3) Openingstijden
  const hourRows = [];
  for (const p of P) for (const [weekday, open_time, close_time] of HOURS[p.hours])
    hourRows.push({ provider_id: idBySlug[p.slug], weekday, open_time, close_time });
  const { error: hErr } = await db.from("provider_hours").insert(hourRows);
  console.log(hErr ? "hours fout: " + hErr.message : `✓ ${hourRows.length} openingstijd-regels`);

  // 4) Diensten
  const svcRows = [];
  for (const p of P) for (const s of SERVICES[p.services])
    svcRows.push({
      provider_id: idBySlug[p.slug], species: s[2], name: s[3], description: s[4],
      base_price_cents: s[0], base_duration_min: s[1], is_from_price: s[5],
      per_night: s[6], per_hour: s[7], status: "published",
    });
  const { error: sErr } = await db.from("services").insert(svcRows);
  console.log(sErr ? "services fout: " + sErr.message : `✓ ${svcRows.length} diensten`);

  console.log("\nKlaar. Marktplaats /zoeken is gevuld met 10 aanbieders.");
}
main();
