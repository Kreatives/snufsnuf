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
interface PackageRow {
  nights: string;
  price: string;
}

const OPPAS_TYPES = [
  "Hondenoppas",
  "Kattenoppas",
  "Hondenopvang",
  "Kattenopvang",
  "Hondenpension",
  "Kattenpension",
  "Konijnenoppas",
  "Knaagdieropvang",
];

export function ServiceEditor({ initial }: { initial?: Service }) {
  const action = initial ? updateServiceAction : createServiceAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  const [isOppas, setIsOppas] = useState((initial?.perNight || initial?.perHour) ?? false);
  const [oppasUnit, setOppasUnit] = useState<"nacht" | "uur">(initial?.perHour ? "uur" : "nacht");
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
  const [packages, setPackages] = useState<PackageRow[]>(
    initial?.packages.length
      ? initial.packages.map((p) => ({ nights: String(p.nights), price: eur(p.priceCents) }))
      : [],
  );

  // Live melding: een pakket met meer nachten mag niet goedkoper zijn.
  const packageWarning = (() => {
    const rows = packages
      .map((p) => ({ n: Number(p.nights), c: Number(p.price.replace(",", ".")) }))
      .filter((r) => r.n > 0 && r.c > 0)
      .sort((a, b) => a.n - b.n);
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].c <= rows[i - 1].c) {
        return `Een pakket van ${rows[i].n} nachten (€${rows[i].c}) mag niet goedkoper zijn dan ${rows[i - 1].n} nachten (€${rows[i - 1].c}).`;
      }
    }
    return null;
  })();

  return (
    <form action={formAction} className="card p-6 flex flex-col gap-6">
      <h2 className="text-h3">{initial ? "Product bewerken" : "Nieuw product"}</h2>
      {initial && <input type="hidden" name="service_id" value={initial.id} />}
      <input type="hidden" name="species" value="hond" />
      <input type="hidden" name="variant_count" value={!isOppas && hasVariants ? variants.length : 0} />
      <input type="hidden" name="addon_count" value={hasAddons ? addons.length : 0} />
      <input type="hidden" name="oppas_unit" value={oppasUnit} />
      <input type="hidden" name="pkg_count" value={isOppas && oppasUnit === "nacht" ? packages.length : 0} />

      {/* Basis */}
      <div className="flex flex-col gap-4">
        <p className="text-eyebrow">Basis</p>
        {isOppas ? (
          <div>
            <label className="field-label" htmlFor="name">
              Soort oppasdienst
            </label>
            <select
              id="name"
              name="name"
              className="field-input"
              defaultValue={initial && OPPAS_TYPES.includes(initial.name) ? initial.name : OPPAS_TYPES[0]}
            >
              {OPPAS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="field-label" htmlFor="name">
              Naam
            </label>
            <input id="name" name="name" className="field-input" defaultValue={initial?.name} required />
          </div>
        )}
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

        <label className="flex items-center gap-2.5 text-[0.9375rem] cursor-pointer font-medium">
          <input
            type="checkbox"
            name="is_oppas"
            className="size-4 accent-ink"
            checked={isOppas}
            onChange={(e) => setIsOppas(e.target.checked)}
          />
          Dit is een oppasdienst (verblijf)
        </label>

        {isOppas ? (
          <div className="flex flex-col gap-4 rounded-md border border-line p-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOppasUnit("nacht")}
                className={`chip ${oppasUnit === "nacht" ? "chip-solid" : "hover:border-ink hover:text-ink"}`}
              >
                Per nacht
              </button>
              <button
                type="button"
                onClick={() => setOppasUnit("uur")}
                className={`chip ${oppasUnit === "uur" ? "chip-solid" : "hover:border-ink hover:text-ink"}`}
              >
                Per uur
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label" htmlFor="base_price">
                  {oppasUnit === "nacht" ? "Tarief per nacht (€)" : "Tarief per uur (€)"}
                </label>
                <input
                  id="base_price"
                  name="base_price"
                  className="field-input"
                  inputMode="decimal"
                  defaultValue={initial && (initial.perNight || initial.perHour) ? eur(initial.basePriceCents) : ""}
                  required
                />
              </div>
              {oppasUnit === "nacht" && (
                <div>
                  <label className="field-label" htmlFor="min_nights">
                    Min. nachten
                  </label>
                  <input
                    id="min_nights"
                    name="min_nights"
                    className="field-input"
                    inputMode="numeric"
                    defaultValue={initial?.minNights ?? 1}
                  />
                </div>
              )}
            </div>

            {oppasUnit === "nacht" && (
              <div className="flex flex-col gap-2 border-t border-line pt-3">
                <p className="field-label">Pakketten (optioneel)</p>
                <p className="text-[0.8125rem] text-muted">
                  Een vaste totaalprijs voor een aantal nachten, bijvoorbeeld 2 nachten voor €90.
                  Voor andere aantallen geldt het tarief per nacht.
                </p>
                {packages.map((p, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
                    <input
                      className="field-input h-10"
                      inputMode="numeric"
                      placeholder="Aantal nachten"
                      name={`pkg_nights_${i}`}
                      value={p.nights}
                      onChange={(e) =>
                        setPackages((rows) => rows.map((r, j) => (j === i ? { ...r, nights: e.target.value } : r)))
                      }
                    />
                    <input
                      className="field-input h-10"
                      inputMode="decimal"
                      placeholder="Totaalprijs (€)"
                      name={`pkg_price_${i}`}
                      value={p.price}
                      onChange={(e) =>
                        setPackages((rows) => rows.map((r, j) => (j === i ? { ...r, price: e.target.value } : r)))
                      }
                    />
                    <RemoveBtn onClick={() => setPackages((r) => r.filter((_, j) => j !== i))} />
                  </div>
                ))}
                {packageWarning && <p className="chip chip-alert w-fit">{packageWarning}</p>}
                <AddBtn
                  label="Pakket toevoegen"
                  onClick={() => setPackages((r) => [...r, { nights: "", price: "" }])}
                />
              </div>
            )}

            <p className="text-[0.8125rem] text-muted">
              De klant kiest straks gewoon het huisdier en een afhaal- en ophaalmoment.
            </p>
          </div>
        ) : hasVariants ? (
          <p className="text-[0.875rem] text-muted">
            Deze dienst heeft varianten, dus prijs en duur komen uit de gekozen variant.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="base_price">
                Prijs (€)
              </label>
              <input
                id="base_price"
                name="base_price"
                className="field-input"
                inputMode="decimal"
                defaultValue={initial && !initial.variants.length && !initial.perNight && !initial.perHour ? eur(initial.basePriceCents) : ""}
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
        )}

        <label className="flex items-center gap-2 text-[0.9375rem] cursor-pointer">
          <input
            type="checkbox"
            name="is_from_price"
            className="size-4 accent-ink"
            defaultChecked={initial?.isFromPrice}
          />
          Als vanaf-prijs tonen
        </label>
      </div>

      {/* Varianten (alleen normale producten) */}
      {!isOppas && (
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
      )}

      {/* Extra's */}
      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <label className="flex items-center gap-2.5 text-[0.9375rem] cursor-pointer font-medium">
          <input
            type="checkbox"
            className="size-4 accent-ink"
            checked={hasAddons}
            onChange={(e) => setHasAddons(e.target.checked)}
          />
          Dit product heeft extra&apos;s
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
      {state.success && <p className="chip w-fit">{initial ? "Opgeslagen." : "Product toegevoegd."}</p>}

      <button type="submit" className="btn btn-primary w-fit" disabled={pending || !!packageWarning}>
        {pending ? "Bezig…" : initial ? "Wijzigingen opslaan" : "Product opslaan"}
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
