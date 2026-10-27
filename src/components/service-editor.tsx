"use client";

import { useActionState, useState } from "react";
import { createServiceAction } from "@/lib/provider-actions";
import type { ActionState } from "@/lib/auth-actions";
import { SIZE_LABELS, COAT_LABELS } from "@/lib/pricing";
import type { SizeClass, CoatType } from "@/lib/types";

const SIZES: SizeClass[] = ["xs", "s", "m", "l", "xl"];
const COATS: CoatType[] = ["glad", "lang", "krul", "ruw", "dubbel"];
const ROWS = [0, 1, 2];

export function ServiceEditor() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createServiceAction, {});
  const [perNight, setPerNight] = useState(false);
  const [rules, setRules] = useState({ size: false, coat: false, weight: false });

  return (
    <form action={action} className="card p-6 flex flex-col gap-6">
      <h2 className="text-h3">Nieuwe dienst</h2>

      {/* Basis */}
      <div className="flex flex-col gap-4">
        <p className="text-eyebrow">Basis</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label" htmlFor="name">
              Naam
            </label>
            <input id="name" name="name" className="field-input" required />
          </div>
          <div>
            <label className="field-label" htmlFor="species">
              Soort
            </label>
            <select id="species" name="species" className="field-input" defaultValue="hond">
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
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label" htmlFor="base_price">
              Basisprijs (€)
            </label>
            <input
              id="base_price"
              name="base_price"
              className="field-input"
              inputMode="decimal"
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="base_duration">
              Basisduur (min)
            </label>
            <input
              id="base_duration"
              name="base_duration"
              className="field-input"
              inputMode="numeric"
              defaultValue={60}
              required
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-[0.9375rem] cursor-pointer">
            <input type="checkbox" name="is_from_price" className="size-4 accent-ink" /> Vanaf-prijs
            tonen
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
                defaultValue={1}
              />
            </label>
          )}
        </div>
      </div>

      {/* Varianten */}
      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <p className="text-eyebrow">Varianten (optioneel)</p>
        <p className="text-[0.8125rem] text-muted">
          Een gekozen variant vervangt de basisprijs en -duur.
        </p>
        {ROWS.map((i) => (
          <div key={i} className="grid grid-cols-[1fr_7rem_7rem] gap-3">
            <input name={`variant_name_${i}`} className="field-input h-10" placeholder="Naam" />
            <input
              name={`variant_price_${i}`}
              className="field-input h-10"
              inputMode="decimal"
              placeholder="Prijs (€)"
            />
            <input
              name={`variant_dur_${i}`}
              className="field-input h-10"
              inputMode="numeric"
              placeholder="Duur (min)"
            />
          </div>
        ))}
      </div>

      {/* Extra's */}
      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <p className="text-eyebrow">Extra&apos;s (optioneel)</p>
        {ROWS.map((i) => (
          <div key={i} className="grid grid-cols-[1fr_6rem_6rem_auto] gap-3 items-center">
            <input name={`addon_name_${i}`} className="field-input h-10" placeholder="Naam" />
            <input
              name={`addon_price_${i}`}
              className="field-input h-10"
              inputMode="decimal"
              placeholder="€"
            />
            <input
              name={`addon_dur_${i}`}
              className="field-input h-10"
              inputMode="numeric"
              placeholder="min"
            />
            <label className="flex items-center gap-2 text-[0.8125rem] whitespace-nowrap">
              <input type="checkbox" name={`addon_perunit_${i}`} className="size-4 accent-ink" />
              per stuk
            </label>
          </div>
        ))}
      </div>

      {/* Prijsregels */}
      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <p className="text-eyebrow">Prijsregels (optioneel)</p>
        <p className="text-[0.8125rem] text-muted">
          Pas de basisprijs aan op de kenmerken van het dier. Vul +/- euro en +/- minuten in.
        </p>

        <RuleToggle
          label="Prijs hangt af van maat"
          name="rule_size"
          enabled={rules.size}
          onToggle={(v) => setRules((r) => ({ ...r, size: v }))}
        />
        {rules.size && (
          <DeltaTable
            values={SIZES.map((s) => ({ key: s, label: SIZE_LABELS[s] }))}
            prefix="size"
          />
        )}

        <RuleToggle
          label="Prijs hangt af van vachttype"
          name="rule_coat"
          enabled={rules.coat}
          onToggle={(v) => setRules((r) => ({ ...r, coat: v }))}
        />
        {rules.coat && (
          <DeltaTable
            values={COATS.map((c) => ({ key: c, label: COAT_LABELS[c] }))}
            prefix="coat"
          />
        )}

        <RuleToggle
          label="Prijs hangt af van gewicht"
          name="rule_weight"
          enabled={rules.weight}
          onToggle={(v) => setRules((r) => ({ ...r, weight: v }))}
        />
        {rules.weight && (
          <div className="flex flex-col gap-2 pl-1">
            {ROWS.map((i) => (
              <div key={i} className="grid grid-cols-[1fr_6rem_6rem] gap-3">
                <input
                  name={`weight_val_${i}`}
                  className="field-input h-10"
                  placeholder="Bucket (bijv. >20)"
                />
                <input name={`weight_price_${i}`} className="field-input h-10" placeholder="± €" />
                <input name={`weight_dur_${i}`} className="field-input h-10" placeholder="± min" />
              </div>
            ))}
          </div>
        )}
      </div>

      {state.error && <p className="chip chip-alert w-fit">{state.error}</p>}
      {state.success && <p className="chip w-fit">Dienst toegevoegd.</p>}

      <button type="submit" className="btn btn-primary w-fit" disabled={pending}>
        {pending ? "Bezig…" : "Dienst opslaan"}
      </button>
    </form>
  );
}

function RuleToggle({
  label,
  name,
  enabled,
  onToggle,
}: {
  label: string;
  name: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 text-[0.9375rem] cursor-pointer font-medium">
      <input
        type="checkbox"
        name={name}
        className="size-4 accent-ink"
        checked={enabled}
        onChange={(e) => onToggle(e.target.checked)}
      />
      {label}
    </label>
  );
}

function DeltaTable({
  values,
  prefix,
}: {
  values: { key: string; label: string }[];
  prefix: string;
}) {
  return (
    <div className="flex flex-col gap-2 pl-1">
      {values.map((v) => (
        <div key={v.key} className="grid grid-cols-[1fr_6rem_6rem] gap-3 items-center">
          <span className="text-[0.9375rem]">{v.label}</span>
          <input
            name={`${prefix}_price_${v.key}`}
            className="field-input h-10"
            inputMode="decimal"
            placeholder="± €"
          />
          <input
            name={`${prefix}_dur_${v.key}`}
            className="field-input h-10"
            inputMode="numeric"
            placeholder="± min"
          />
        </div>
      ))}
    </div>
  );
}
