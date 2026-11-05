"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker } from "leaflet";

export type MapItem = {
  slug: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  price: string;
};

export function SearchMap({ items }: { items: MapItem[] }) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef<Marker[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !holder.current) return;

      if (!map.current) {
        map.current = L.map(holder.current, {
          scrollWheelZoom: false,
          zoomControl: true,
          attributionControl: true,
        });
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          subdomains: "abcd",
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }).addTo(map.current);
      }

      // Oude pins weg
      markers.current.forEach((m) => m.remove());
      markers.current = [];

      const latlngs: [number, number][] = [];
      for (const it of items) {
        const icon = L.divIcon({
          className: "price-pin",
          html: `<span class="price-pin__label">${it.price}</span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        const marker = L.marker([it.lat, it.lng], { icon, riseOnHover: true })
          .addTo(map.current!)
          .bindTooltip(it.name, { direction: "top", offset: [0, -14] })
          .on("click", () => {
            window.location.href = `/aanbieder/${it.slug}`;
          });
        markers.current.push(marker);
        latlngs.push([it.lat, it.lng]);
      }

      if (latlngs.length > 1) {
        map.current.fitBounds(L.latLngBounds(latlngs), { padding: [56, 56], maxZoom: 13 });
      } else if (latlngs.length === 1) {
        map.current.setView(latlngs[0], 12);
      } else {
        map.current.setView([52.1326, 5.2913], 7);
      }
      setTimeout(() => map.current?.invalidateSize(), 120);
    })();

    return () => {
      cancelled = true;
    };
  }, [items]);

  return (
    <div
      ref={holder}
      className="w-full h-full rounded-2xl overflow-hidden border border-line"
      style={{ minHeight: 400, background: "#eef0ec" }}
    />
  );
}
