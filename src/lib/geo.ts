// Benaderende stadscoördinaten (lat, lng) voor de kaart. De aanbieders hebben nog
// geen eigen lat/lng; we plaatsen ze op het stadscentrum met een kleine, vaste spreiding.
export const CITY_COORDS: Record<string, [number, number]> = {
  amsterdam: [52.3676, 4.9041],
  utrecht: [52.0907, 5.1214],
  rotterdam: [51.9244, 4.4777],
  "den haag": [52.0705, 4.3007],
  arnhem: [51.9851, 5.8987],
  nijmegen: [51.8126, 5.8372],
  eindhoven: [51.4416, 5.4697],
  groningen: [53.2194, 6.5665],
  haarlem: [52.3874, 4.6462],
  amersfoort: [52.1561, 5.3878],
  tilburg: [51.5555, 5.0913],
  almere: [52.3508, 5.2647],
  breda: [51.5719, 4.7683],
};

export const NL_CENTER: [number, number] = [52.1326, 5.2913];

/** Coördinaat voor een stad, met kleine deterministische spreiding (op slug) zodat
 *  meerdere aanbieders in dezelfde stad niet exact op elkaar vallen. */
export function cityCoords(city: string, seed = ""): [number, number] {
  const base = CITY_COORDS[city.trim().toLowerCase()] ?? NL_CENTER;
  let h = 7;
  for (const ch of city + seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const jLat = ((h % 1000) / 1000 - 0.5) * 0.028;
  const jLng = (((h >> 10) % 1000) / 1000 - 0.5) * 0.042;
  return [base[0] + jLat, base[1] + jLng];
}
