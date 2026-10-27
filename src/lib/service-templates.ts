// Voorgevulde diensten per categorie (onboarding). Aanbieder kan alles aanpassen of wissen.
// Vorm = insert-rijen voor de services-tabel (zonder provider_id, die wordt bij insert gezet).

const uid = () => crypto.randomUUID();

interface TemplateService {
  species: string;
  name: string;
  description: string;
  base_price_cents: number;
  base_duration_min: number;
  is_from_price: boolean;
  variants: unknown[];
  addons: unknown[];
  price_rules: unknown[];
  per_night: boolean;
  min_nights: number;
  buffer_min: number;
  required_skills: string[];
  status: string;
}

function svc(p: Partial<TemplateService> & { name: string; base_price_cents: number }): TemplateService {
  return {
    species: "hond",
    description: "",
    base_duration_min: 60,
    is_from_price: false,
    variants: [],
    addons: [],
    price_rules: [],
    per_night: false,
    min_nights: 1,
    buffer_min: 15,
    required_skills: [],
    status: "published",
    ...p,
  };
}

function sizeRule() {
  return {
    id: uid(),
    attribute: "size",
    enabled: true,
    rows: [
      { value: "xs", deltaPriceCents: 0, deltaDurationMin: 0 },
      { value: "s", deltaPriceCents: 1000, deltaDurationMin: 15 },
      { value: "m", deltaPriceCents: 2000, deltaDurationMin: 30 },
      { value: "l", deltaPriceCents: 3000, deltaDurationMin: 45 },
      { value: "xl", deltaPriceCents: 4000, deltaDurationMin: 75 },
    ],
  };
}

function coatRule() {
  return {
    id: uid(),
    attribute: "coat",
    enabled: true,
    rows: [
      { value: "glad", deltaPriceCents: 0, deltaDurationMin: 0 },
      { value: "lang", deltaPriceCents: 1000, deltaDurationMin: 20 },
      { value: "krul", deltaPriceCents: 1500, deltaDurationMin: 30 },
      { value: "ruw", deltaPriceCents: 800, deltaDurationMin: 15 },
      { value: "dubbel", deltaPriceCents: 1200, deltaDurationMin: 25 },
    ],
  };
}

export function templatesFor(category: string): TemplateService[] {
  switch (category) {
    case "trimsalon":
    case "kattentrimsalon":
    case "mobiele_trimmer":
      return [
        svc({
          name: "Volledige knipbeurt",
          description: "Wassen, drogen, knippen, nagels en oren.",
          base_price_cents: 3500,
          base_duration_min: 45,
          is_from_price: true,
          variants: [
            { id: uid(), name: "Alleen knippen", priceCents: 3500, durationMin: 45 },
            { id: uid(), name: "Knippen + wassen en föhnen", priceCents: 4500, durationMin: 75 },
          ],
          addons: [
            { id: uid(), name: "Nagels knippen", priceCents: 750, durationMin: 10, isPerUnit: false },
            {
              id: uid(),
              name: "Ontklitten per 15 min",
              priceCents: 750,
              durationMin: 15,
              isPerUnit: true,
              unitLabel: "15 min",
            },
          ],
          price_rules: [sizeRule(), coatRule()],
        }),
        svc({
          name: "Wassen en föhnen",
          description: "Wassen, drogen en borstelen zonder knippen.",
          base_price_cents: 2500,
          base_duration_min: 30,
          is_from_price: true,
          price_rules: [sizeRule()],
        }),
        svc({
          name: "Puppy kennismaking",
          description: "Korte, positieve eerste kennismaking met trimmen.",
          base_price_cents: 1500,
          base_duration_min: 20,
        }),
      ];

    case "dagopvang":
      return [
        svc({ name: "Hele dag", base_price_cents: 2500, base_duration_min: 480 }),
        svc({ name: "Halve dag", base_price_cents: 1500, base_duration_min: 240 }),
        svc({
          name: "Strippenkaart 10 dagen",
          description: "Tien hele dagen opvang, vooraf af te nemen.",
          base_price_cents: 22500,
          base_duration_min: 480,
          addons: [
            { id: uid(), name: "Tweede hond (korting)", priceCents: -500, durationMin: 0, isPerUnit: false },
          ],
        }),
      ];

    case "pension":
      return [
        svc({
          name: "Overnachting",
          description: "Verblijf per nacht, inclusief voer en uitlaten.",
          base_price_cents: 2500,
          base_duration_min: 0,
          per_night: true,
          min_nights: 1,
          addons: [
            { id: uid(), name: "Feestdagtoeslag", priceCents: 1000, durationMin: 0, isPerUnit: false },
          ],
        }),
      ];

    case "oppas":
    case "uitlaatservice":
      return [
        svc({
          name: "Wandeling 30 min",
          base_price_cents: 1500,
          base_duration_min: 30,
          variants: [
            { id: uid(), name: "Solo", priceCents: 1500, durationMin: 30 },
            { id: uid(), name: "Groep", priceCents: 1200, durationMin: 30 },
          ],
        }),
        svc({
          name: "Wandeling 60 min",
          base_price_cents: 2500,
          base_duration_min: 60,
          variants: [
            { id: uid(), name: "Solo", priceCents: 2500, durationMin: 60 },
            { id: uid(), name: "Groep", priceCents: 2000, durationMin: 60 },
          ],
        }),
        svc({ name: "Huisbezoek 30 min", base_price_cents: 1750, base_duration_min: 30 }),
      ];

    default:
      return [];
  }
}
