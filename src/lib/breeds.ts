import type { SizeClass, CoatType } from "./types";

/** Rasbibliotheek: ras → maatklasse + vacht (B-03/B-05). Platform-brede referentiedata. */
export const BREED_LIBRARY: Record<
  string,
  { sizeClass: SizeClass; coatType: CoatType }
> = {
  Labradoodle: { sizeClass: "l", coatType: "krul" },
  Cavapoo: { sizeClass: "s", coatType: "krul" },
  Mechelaar: { sizeClass: "l", coatType: "glad" },
  Spaniël: { sizeClass: "m", coatType: "lang" },
  Border: { sizeClass: "m", coatType: "dubbel" },
  Maine: { sizeClass: "m", coatType: "lang" },
};
