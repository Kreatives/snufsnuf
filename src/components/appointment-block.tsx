"use client";

import { useEffect } from "react";
import { useState } from "react";
import type { AgendaItem } from "@/lib/data";
import { SIZE_LABELS, COAT_LABELS, euro, formatDuration } from "@/lib/pricing";
import type { AppointmentStatus } from "@/lib/types";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  aanvraag: "Aanvraag",
  bevestigd: "Bevestigd",
  verwacht: "Verwacht",
  aanwezig: "Aanwezig",
  in_behandeling: "In behandeling",
  klaar: "Klaar",
  opgehaald: "Opgehaald",
  no_show: "No-show",
  geannuleerd: "Geannuleerd",
};

function waLink(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^00/, "");
  const intl = digits.startsWith("0") ? "31" + digits.slice(1) : digits;
  return `https://wa.me/${intl}`;
}

export function AppointmentBlock({
  item,
  top,
  height,
}: {
  item: AgendaItem;
  top: number;
  height: number;
}) {
  const [open, setOpen] = useState(false);
  const alert = item.muzzle || item.biteRisk >= 2;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ top, height }}
        className="absolute left-1 right-1 text-left rounded-md border border-line-strong bg-surface px-2 py-1 overflow-hidden hover:border-ink transition-colors"
      >
        <p className="text-[0.6875rem] text-muted leading-none">{item.time}</p>
        <p className="text-[0.8125rem] font-medium leading-tight truncate mt-0.5">
          {item.animalName}
        </p>
        <p className="text-[0.75rem] text-muted truncate">{item.title}</p>
        {alert && <span className="chip chip-alert mt-1 h-5 text-[0.6875rem]">Muilkorf</span>}
      </button>
      {open && <AppointmentModal item={item} onClose={() => setOpen(false)} />}
    </>
  );
}

function AppointmentModal({ item, onClose }: { item: AgendaItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Afspraak ${item.animalName}`}
    >
      <div
        className="card w-full max-w-md max-h-[88vh] overflow-y-auto rounded-b-none sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-h3">{item.animalName}</h2>
              <p className="text-[0.9375rem] text-muted capitalize">
                {item.dayLabel} · {item.time} · {formatDuration(item.durationMin)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost h-9 w-9 px-0 shrink-0"
              aria-label="Sluiten"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="chip chip-solid">{STATUS_LABEL[item.status]}</span>
            {item.muzzle && <span className="chip chip-alert">Muilkorf verplicht</span>}
            {item.biteRisk >= 2 && <span className="chip chip-alert">Bijtrisico hoog</span>}
          </div>

          {item.topNote && (
            <p className="text-[0.9375rem] rounded-md border border-line-strong bg-bg px-3 py-2">
              ⤷ {item.topNote}
            </p>
          )}

          <Section title="Hond">
            <Row label="Ras" value={item.breed ?? "onbekend"} />
            <Row label="Maat" value={SIZE_LABELS[item.sizeClass]} />
            <Row label="Vacht" value={COAT_LABELS[item.coatType]} />
            <Row
              label="Gedrag"
              value={item.behavior.length ? item.behavior.join(", ") : "—"}
            />
            {item.medicalNote && <Row label="Medisch" value={item.medicalNote} />}
          </Section>

          <Section title="Boeking">
            <Row label="Dienst" value={item.title} />
            <Row label="Prijs" value={euro(item.priceCents)} />
            {item.lastGroom && <Row label="Laatst getrimd" value={item.lastGroom} />}
          </Section>

          <Section title="Geboekt door">
            <Row label="Naam" value={item.owner} />
            {item.email && (
              <Row
                label="E-mail"
                value={
                  <a className="underline underline-offset-2" href={`mailto:${item.email}`}>
                    {item.email}
                  </a>
                }
              />
            )}
            {item.phone && (
              <Row
                label="Telefoon"
                value={
                  <a className="underline underline-offset-2" href={`tel:${item.phone}`}>
                    {item.phone}
                  </a>
                }
              />
            )}
          </Section>

          {(item.phone || item.email) && (
            <div className="flex gap-2">
              {item.phone && (
                <a
                  href={waLink(item.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary flex-1"
                >
                  WhatsApp
                </a>
              )}
              {item.email && (
                <a href={`mailto:${item.email}`} className="btn btn-ghost flex-1">
                  Mail
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-4">
      <p className="text-eyebrow mb-2">{title}</p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-[0.9375rem]">
      <span className="text-muted shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
