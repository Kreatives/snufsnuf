"use client";

import { useActionState, useState } from "react";
import { createServiceAction, updateServiceAction } from "@/lib/provider-actions";
import type { ActionState } from "@/lib/auth-actions";
import type { Service } from "@/lib/types";

const eur = (cents: number) => (cents / 100).toString();

interface VariantRow {
  name: string;
  price: string;
  dur: string;
}
interface AddonRow {
  name: string;
  price: string;
  dur: string;
  perUnit: boolean;
}

export function ServiceEditor({ initial }: { initial?: Service }) {
  const action = initial ? updateServiceAction : createServiceAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  const [perNight, setPerNight] = useState(initial?.perNight ?? false);
  const [hasVariants, setHasVariants] = useState((initial?.variants.length ?? 0) > 0);
  const [hasAddons, setHasAddons] = useState((initial?.addons.length ?? 0) > 0);

  const [variants, setVariants] = useState<VariantRow[]>(
    initial?.variants.length
      ? initial.variants.map((v) => ({ name: v.name, price: eur(v.priceCents), dur: String(v.durationMin) }))
      : [{ name: "", price: "", dur: "" }],
  );
  const [addons, setAddons] = useState<AddonRow[]>(
    initial?.addons.length
      ? initial.addons.map((a) => ({
          name: a.name,
          price: eur(a.priceCents),
          dur: String(a.durationMin),
          perUnit: a.isPerUnit,
        }))
      : [{ name: "", price: "", dur: "", perUnit: false }],
  );

  return (
    <form action={formAction} className="card p-6 flex flex-col gap-6">
      <h2 className="text-h3">{initial ? "Dienst bewerken" : "Nieuwe dienst"}</h2>
      {initial && <input type="hidden" name="service_id" value={initial.id} />}
      <input type="hidden" name="variant_count" value={hasVariants ? variants.length : 0} />
      <input type="hidden" name="addon_count" value={hasAddons ? addons.length : 0} />

      {/* Basis */}
      <div className="flex flex-col gap-4">
        <p className="text-eyebrow">Basis</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label" htmlFor="name">
              Naam
            </label>
            <input id="name" name="name" className="field-input" defaultValue={initial?.name} required />
          </div>
          <div>
            <label className="field-label" htmlFor="species">
              Soort
            </label>
            <select id="species" name="species" className="field-input" defaultValue={initial?.species ?? "hond"}>
              <option value="hond">Hond</option>
              <option value="kat">Kat</option>
            </select>
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="description">
            Omschrijving
          </label>
          <textarea
            id="description"
            name="description"
            className="field-input h-20 py-2 resize-none"
            defaultValue={initial?.description}
          />
        </div>

        {hasVariants ? (
          <p className="text-[0.875rem] text-muted">
            Deze dienst heeft varianten, dus de prijs en duur komen uit de gekozen variant. De
            vanaf-prijs is automatisch de goedkoopste variant.
          </p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label" htmlFor="base_price">
                  {perNight ? "Prijs per nacht (€)" : "Prijs (€)"}
                </label>
                <input
                  id="base_price"
                  name="base_price"
                  className="field-input"
                  inputMode="decimal"
                  defaultValue={initial && !initial.variants.length ? eur(initial.basePriceCents) : ""}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="base_duration">
                  Duur (min)
                </label>
                <input
                  id="base_duration"
                  name="base_duration"
                  className="field-input"
                  inputMode="numeric"
                  defaultValue={initial?.baseDurationMin ?? 60}
                />
              </div>
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-[0.9375rem] cursor-pointer">
            <input
              type="checkbox"
              name="is_from_price"
              className="size-4 accent-ink"
              defaultChecked={initial?.isFromPrice}
            />
            Als vanaf-prijs tonen
          </label>
          <label className="flex items-center gap-2 text-[0.9375rem] cursor-pointer">
            <input
              type="checkbox"
              name="per_night"
              className="size-4 accent-ink"
              checked={perNight}
              onChange={(e) => setPerNight(e.target.checked)}
            />
            Prijs per nacht (verblijf)
          </label>
          {perNight && (
            <label className="flex items-center gap-2 text-[0.9375rem]">
              Min. nachten
              <input
                name="min_nights"
                className="field-input h-9 w-16"
                inputMode="numeric"
                defaultValue={initial?.minNights ?? 1}
              />
            </label>
          )}
        </div>
      </div>

      {/* Varianten */}
      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <label className="flex items-center gap-2.5 text-[0.9375rem] cursor-pointer font-medium">
          <input
            type="checkbox"
            className="size-4 accent-ink"
            checked={hasVariants}
            onChange={(e) => setHasVariants(e.target.checked)}
          />
          Deze dienst heeft meerdere varianten
        </label>
        {hasVariants && (
          <div className="flex flex-col gap-2">
            <p className="text-[0.8125rem] text-muted">
              Elke variant heeft een eigen prijs en duur. De klant kiest er één.
            </p>
            {variants.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_6rem_6rem_auto] gap-3 items-center">
                <input
                  className="field-input h-10"
                  placeholder="Naam (bijv. 30 cm)"
                  name={`variant_name_${i}`}
                  value={v.name}
                  onChange={(e) =>
                    setVariants((rows) => rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))
                  }
                />
                <input
                  className="field-input h-10"
                  placeholder="€"
                  name={`variant_price_${i}`}
                  value={v.price}
                  onChange={(e) =>
                    setVariants((rows) => rows.map((r, j) => (j === i ? { ...r, price: e.target.value } : r)))
                  }
                />
                <input
                  className="field-input h-10"
                  placeholder="min"
                  name={`variant_dur_${i}`}
                  value={v.dur}
                  onChange={(e) =>
                    setVariants((rows) => rows.map((r, j) => (j === i ? { ...r, dur: e.target.value } : r)))
                  }
                />
                <RemoveBtn onClick={() => setVariants((r) => r.filter((_, j) => j !== i))} />
              </div>
            ))}
            <AddBtn
              label="Variant toevoegen"
              onClick={() => setVariants((r) => [...r, { name: "", price: "", dur: "" }])}
            />
          </div>
        )}
      </div>

      {/* Extra's */}
      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <label className="flex items-center gap-2.5 text-[0.9375rem] cursor-pointer font-medium">
          <input
            type="checkbox"
            className="size-4 accent-ink"
            checked={hasAddons}
            onChange={(e) => setHasAddons(e.target.checked)}
          />
          Deze dienst heeft extra&apos;s
        </label>
        {hasAddons && (
          <div className="flex flex-col gap-2">
            {addons.map((a, i) => (
              <div key={i} className="grid grid-cols-[1fr_5rem_5rem_auto_auto] gap-3 items-center">
                <input
                  className="field-input h-10"
                  placeholder="Naam"
                  name={`addon_name_${i}`}
                  value={a.name}
                  onChange={(e) =>
                    setAddons((rows) => rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))
                  }
                />
                <input
                  className="field-input h-10"
                  placeholder="€"
                  name={`addon_price_${i}`}
                  value={a.price}
                  onChange={(e) =>
                    setAddons((rows) => rows.map((r, j) => (j === i ? { ...r, price: e.target.value } : r)))
                  }
                />
                <input
                  className="field-input h-10"
                  placeholder="min"
                  name={`addon_dur_${i}`}
                  value={a.dur}
                  onChange={(e) =>
                    setAddons((rows) => rows.map((r, j) => (j === i ? { ...r, dur: e.target.value } : r)))
                  }
                />
                <label className="flex items-center gap-1.5 text-[0.8125rem] whitespace-nowrap">
                  <input
                    type="checkbox"
                    name={`addon_perunit_${i}`}
                    className="size-4 accent-ink"
                    checked={a.perUnit}
                    onChange={(e) =>
                      setAddons((rows) => rows.map((r, j) => (j === i ? { ...r, perUnit: e.target.checked } : r)))
                    }
                  />
                  per stuk
                </label>
                <RemoveBtn onClick={() => setAddons((r) => r.filter((_, j) => j !== i))} />
              </div>
            ))}
            <AddBtn
              label="Extra toevoegen"
              onClick={() => setAddons((r) => [...r, { name: "", price: "", dur: "", perUnit: false }])}
            />
          </div>
        )}
      </div>

      {state.error && <p className="chip chip-alert w-fit">{state.error}</p>}
      {state.success && <p className="chip w-fit">{initial ? "Opgeslagen." : "Dienst toegevoegd."}</p>}

      <button type="submit" className="btn btn-primary w-fit" disabled={pending}>
        {pending ? "Bezig…" : initial ? "Wijzigingen opslaan" : "Dienst opslaan"}
      </button>
    </form>
  );
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn btn-ghost h-9 w-fit px-4 text-[0.875rem]">
      + {label}
    </button>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-ghost h-10 w-10 px-0 shrink-0"
      aria-label="Rij verwijderen"
    >
      ✕
    </button>
  );
}
