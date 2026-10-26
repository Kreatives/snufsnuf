import type {
  Provider,
  Service,
  Animal,
  Appointment,
  Slot,
  CoatType,
  SizeClass,
} from "./types";

/** Rasbibliotheek: ras → maatklasse + vacht (B-03/B-05) */
export const BREED_LIBRARY: Record<
  string,
  { sizeClass: SizeClass; coatType: CoatType }
> = {
  Labradoodle: { sizeClass: "l", coatType: "krul" },
  "Cavapoo": { sizeClass: "s", coatType: "krul" },
  Mechelaar: { sizeClass: "l", coatType: "glad" },
  Spaniël: { sizeClass: "m", coatType: "lang" },
  Border: { sizeClass: "m", coatType: "dubbel" },
  Maine: { sizeClass: "m", coatType: "lang" },
};

export const providers: Provider[] = [
  {
    id: "p-sanne",
    slug: "trimsalon-sanne",
    name: "Trimsalon Sanne",
    category: "trimsalon",
    owner: "Sanne",
    city: "Amsterdam",
    distanceKm: 2.4,
    rating: 4.9,
    reviewCount: 128,
    blurb:
      "Kleine salon die rustig werkt en veel ervaring heeft met herplaatsers en onbekende kruisingen. Elke hond krijgt de tijd die de vacht vraagt.",
    species: ["hond"],
    skills: ["angsthond", "handstrippen", "senior"],
    prikkelarm: true,
    mobiel: false,
  },
  {
    id: "p-mark",
    slug: "salon-mark-team",
    name: "Salon Mark & team",
    category: "trimsalon",
    owner: "Mark",
    city: "Amsterdam",
    distanceKm: 3.1,
    rating: 4.7,
    reviewCount: 243,
    blurb:
      "Salon met drie trimmers en twee tafels. Van puppywenbeurt tot volledige knipbeurt, en genoeg capaciteit om snel terecht te kunnen.",
    species: ["hond"],
    skills: ["puppy", "senior", "handstrippen"],
    prikkelarm: false,
    mobiel: false,
  },
  {
    id: "p-iris",
    slug: "kattentrim-iris",
    name: "Kattentrim Iris",
    category: "kattentrimsalon",
    owner: "Iris",
    city: "Amsterdam",
    distanceKm: 5.8,
    rating: 5.0,
    reviewCount: 61,
    blurb:
      "Werkt uitsluitend met katten, in een prikkelarme kamer, één op één. Geen honden in de agenda, dus geen onrust in de wachtruimte.",
    species: ["kat"],
    skills: ["kat"],
    prikkelarm: true,
    mobiel: false,
  },
  {
    id: "p-youssef",
    slug: "mobiel-youssef",
    name: "Youssef mobiel trimmen",
    category: "mobiele_trimmer",
    owner: "Youssef",
    city: "Amsterdam",
    distanceKm: 1.2,
    rating: 4.8,
    reviewCount: 94,
    blurb:
      "Komt met een volledig ingerichte bus naar je adres. Geen reisstress voor de hond, en jij hoeft de deur niet uit.",
    species: ["hond"],
    skills: ["senior"],
    prikkelarm: false,
    mobiel: true,
  },
];

const base = (providerId: string): Pick<Service, "providerId" | "bufferMin" | "indicative"> => ({
  providerId,
  bufferMin: 15,
  indicative: true,
});

export const services: Service[] = [
  {
    ...base("p-sanne"),
    id: "s-sanne-knip",
    species: "hond",
    name: "Volledige knipbeurt",
    description:
      "Wassen, drogen, knippen, nagels en oren. De duur rekenen we uit de maat en de vacht, dus een krulvacht met klitten kost meer tijd dan een gladde vacht.",
    pricing: [
      { sizeClass: "xs", priceCents: 3500, durationMin: 45 },
      { sizeClass: "s", priceCents: 4500, durationMin: 60 },
      { sizeClass: "m", priceCents: 5500, durationMin: 75 },
      { sizeClass: "l", priceCents: 6500, durationMin: 90 },
      { sizeClass: "xl", priceCents: 7500, durationMin: 120 },
    ],
    coatSurcharge: {
      krul: { extraMin: 30, extraCents: 1500 },
      lang: { extraMin: 20, extraCents: 1000 },
      dubbel: { extraMin: 25, extraCents: 1200 },
    },
    breedExceptions: [{ breed: "Labradoodle", priceCents: 8000, durationMin: 120 }],
    requiredSkills: [],
    bufferMin: 15,
    indicative: true,
  },
  {
    ...base("p-sanne"),
    id: "s-sanne-kennismaking",
    species: "hond",
    name: "Kennismaking",
    description:
      "Korte afspraak om de hond rustig te laten wennen aan de salon, zonder volledige beurt. Aangeraden bij een eerste hond of een onzekere hond.",
    pricing: [
      { sizeClass: "xs", priceCents: 1500, durationMin: 20 },
      { sizeClass: "s", priceCents: 1500, durationMin: 20 },
      { sizeClass: "m", priceCents: 1500, durationMin: 20 },
      { sizeClass: "l", priceCents: 1500, durationMin: 20 },
      { sizeClass: "xl", priceCents: 1500, durationMin: 20 },
    ],
    coatSurcharge: {},
    breedExceptions: [],
    requiredSkills: ["angsthond"],
    bufferMin: 10,
    indicative: false,
  },
  {
    ...base("p-mark"),
    id: "s-mark-knip",
    species: "hond",
    name: "Knip- en wasbeurt",
    description:
      "Complete beurt door een van onze trimmers. Grotere en dikkere vachten plannen we bij een senior trimmer in.",
    pricing: [
      { sizeClass: "xs", priceCents: 3200, durationMin: 45 },
      { sizeClass: "s", priceCents: 4200, durationMin: 55 },
      { sizeClass: "m", priceCents: 5200, durationMin: 70 },
      { sizeClass: "l", priceCents: 6200, durationMin: 85 },
      { sizeClass: "xl", priceCents: 7200, durationMin: 110 },
    ],
    coatSurcharge: {
      krul: { extraMin: 25, extraCents: 1200 },
      dubbel: { extraMin: 25, extraCents: 1200 },
    },
    breedExceptions: [],
    requiredSkills: [],
    bufferMin: 15,
    indicative: true,
  },
  {
    ...base("p-mark"),
    id: "s-mark-puppy",
    species: "hond",
    name: "Puppy wenbeurt",
    description:
      "Korte, positieve eerste kennismaking met trimmen voor pups onder zes maanden. Geen volledige knipbeurt.",
    pricing: [
      { sizeClass: "xs", priceCents: 2000, durationMin: 30 },
      { sizeClass: "s", priceCents: 2000, durationMin: 30 },
      { sizeClass: "m", priceCents: 2000, durationMin: 30 },
      { sizeClass: "l", priceCents: 2000, durationMin: 30 },
      { sizeClass: "xl", priceCents: 2000, durationMin: 30 },
    ],
    coatSurcharge: {},
    breedExceptions: [],
    requiredSkills: ["puppy"],
    bufferMin: 10,
    indicative: false,
  },
  {
    ...base("p-iris"),
    id: "s-iris-kat",
    species: "kat",
    name: "Kattentrimbeurt",
    description:
      "Rustige beurt in een prikkelarme kamer, één op één. We volgen het tempo van de kat en stoppen als het te veel wordt.",
    pricing: [
      { sizeClass: "s", priceCents: 5000, durationMin: 60 },
      { sizeClass: "m", priceCents: 5500, durationMin: 70 },
      { sizeClass: "l", priceCents: 6000, durationMin: 80 },
    ],
    coatSurcharge: {
      lang: { extraMin: 20, extraCents: 1500 },
    },
    breedExceptions: [],
    requiredSkills: ["kat"],
    bufferMin: 20,
    indicative: true,
  },
  {
    ...base("p-youssef"),
    id: "s-youssef-knip",
    species: "hond",
    name: "Knipbeurt aan huis",
    description:
      "Volledige beurt in de bus voor de deur. Voorrijden binnen het werkgebied is inbegrepen.",
    pricing: [
      { sizeClass: "s", priceCents: 5500, durationMin: 60 },
      { sizeClass: "m", priceCents: 6500, durationMin: 75 },
      { sizeClass: "l", priceCents: 7500, durationMin: 90 },
    ],
    coatSurcharge: {
      krul: { extraMin: 30, extraCents: 1500 },
      lang: { extraMin: 20, extraCents: 1000 },
    },
    breedExceptions: [],
    requiredSkills: [],
    bufferMin: 30,
    indicative: true,
  },
];

export const savedAnimals: Animal[] = [
  {
    id: "a-bella",
    name: "Bella",
    species: "hond",
    breed: "Labradoodle",
    sizeClass: "l",
    coatType: "krul",
    weightKg: 24,
    behavior: ["sociaal"],
    biteRisk: 0,
    muzzleRequired: false,
    medicalNote: null,
    topNote: "Houdt niet van de föhn op haar kop",
  },
  {
    id: "a-moos",
    name: "Moos",
    species: "hond",
    breed: "Labradoodle",
    sizeClass: "l",
    coatType: "krul",
    weightKg: 26,
    behavior: ["sociaal"],
    biteRisk: 0,
    muzzleRequired: false,
    medicalNote: null,
    topNote: null,
  },
];

export function getProvider(slug: string): Provider | undefined {
  return providers.find((p) => p.slug === slug);
}

export function servicesFor(providerId: string): Service[] {
  return services.filter((s) => s.providerId === providerId);
}

export function getService(id: string): Service | undefined {
  return services.find((s) => s.id === id);
}

/** Deterministische slots voor de komende dagen (prototype, geen echte agenda) */
export function getSlots(providerId: string, days = 5): Slot[] {
  const patterns: Record<string, string[]> = {
    "p-sanne": ["09:00", "10:30", "13:30", "15:00"],
    "p-mark": ["09:00", "09:30", "11:00", "13:00", "14:30", "16:00"],
    "p-iris": ["10:00", "13:00"],
    "p-youssef": ["08:30", "10:00", "11:30", "14:00"],
  };
  const times = patterns[providerId] ?? ["10:00", "14:00"];
  const staffName: Record<string, string> = {
    "p-sanne": "Sanne",
    "p-mark": "Noa",
    "p-iris": "Iris",
    "p-youssef": "Youssef",
  };
  const slots: Slot[] = [];
  const today = new Date();
  for (let d = 1; d <= days; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    if (date.getDay() === 0) continue; // zondag dicht
    const iso = date.toISOString().slice(0, 10);
    // laat de eerste dag wat voller lijken, latere dagen met gaten
    const available = d === 1 ? times.slice(0, 2) : times;
    for (const time of available) {
      slots.push({ date: iso, time, staff: staffName[providerId] ?? "Team" });
    }
  }
  return slots;
}

/** Daglijst voor het aanbieder-dashboard (C-13) */
export const todayAppointments: Appointment[] = [
  {
    id: "ap-1",
    time: "09:00",
    durationMin: 120,
    owner: "Ahmed",
    serviceName: "Volledige knipbeurt",
    staff: "Sanne",
    status: "aanwezig",
    animal: {
      id: "a-bella",
      name: "Bella",
      species: "hond",
      breed: "Labradoodle",
      sizeClass: "l",
      coatType: "krul",
      weightKg: 24,
      behavior: ["sociaal"],
      biteRisk: 0,
      muzzleRequired: false,
      medicalNote: null,
      topNote: "Houdt niet van de föhn op haar kop",
    },
  },
  {
    id: "ap-2",
    time: "11:00",
    durationMin: 90,
    owner: "Marieke",
    serviceName: "Volledige knipbeurt",
    staff: "Sanne",
    status: "verwacht",
    animal: {
      id: "a-rex",
      name: "Rex",
      species: "hond",
      breed: "Mechelaar",
      sizeClass: "l",
      coatType: "glad",
      weightKg: 30,
      behavior: ["reactief", "niet met andere honden"],
      biteRisk: 3,
      muzzleRequired: true,
      medicalNote: "Bijt bij nagels knippen",
      topNote: "Eén op één, niet naast andere honden laten wachten",
    },
  },
  {
    id: "ap-3",
    time: "14:00",
    durationMin: 60,
    owner: "Wilma",
    serviceName: "Senior- en zorgbeurt",
    staff: "Sanne",
    status: "bevestigd",
    animal: {
      id: "a-sjors",
      name: "Sjors",
      species: "hond",
      breed: "Spaniël",
      sizeClass: "m",
      coatType: "lang",
      weightKg: 14,
      behavior: ["sociaal"],
      biteRisk: 0,
      muzzleRequired: false,
      medicalNote: "14 jaar, hartconditie, korte sessie met pauze",
      topNote: "Kan niet lang staan, pauze halverwege",
    },
  },
];
