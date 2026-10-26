"use client";

import { useActionState, useState } from "react";
import { addAnimalAction, type ActionState } from "@/lib/auth-actions";
import { BREED_LIBRARY } from "@/lib/breeds";
import { SIZE_LABELS, COAT_LABELS } from "@/lib/pricing";
import type { SizeClass, CoatType } from "@/lib/types";

export function AddPetForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(addAnimalAction, {});
  const [sizeClass, setSizeClass] = useState<SizeClass>("m");
  const [coatType, setCoatType] = useState<CoatType>("glad");
  const [biteRisk, setBiteRisk] = useState(0);

  function selectBreed(breed: string) {
    const lib = BREED_LIBRARY[breed];
    if (lib) {
      setSizeClass(lib.sizeClass);
      setCoatType(lib.coatType);
    }
  }

  return (
    <form action={action} className="card p-6 flex flex-col gap-5">
      <h2 className="text-h3">Dier toevoegen</h2>

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
        <label className="field-label" htmlFor="breed">
          Ras
        </label>
        <select
          id="breed"
          name="breed"
          className="field-input"
          defaultValue=""
          onChange={(e) => selectBreed(e.target.value)}
        >
          <option value="">Kies een ras of laat leeg</option>
          {Object.keys(BREED_LIBRARY).map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <p className="text-[0.8125rem] text-muted mt-1">
          Bij een bekend ras vullen we maat en vacht automatisch in.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="field-label" htmlFor="size_class">
            Maat
          </label>
          <select
            id="size_class"
            name="size_class"
            className="field-input"
            value={sizeClass}
            onChange={(e) => setSizeClass(e.target.value as SizeClass)}
          >
            {(Object.keys(SIZE_LABELS) as SizeClass[]).map((s) => (
              <option key={s} value={s}>
                {SIZE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="coat_type">
            Vacht
          </label>
          <select
            id="coat_type"
            name="coat_type"
            className="field-input"
            value={coatType}
            onChange={(e) => setCoatType(e.target.value as CoatType)}
          >
            {(Object.keys(COAT_LABELS) as CoatType[]).map((c) => (
              <option key={c} value={c}>
                {COAT_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="weight_kg">
            Gewicht (kg)
          </label>
          <input id="weight_kg" name="weight_kg" className="field-input" inputMode="decimal" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="behavior">
            Gedrag
          </label>
          <select id="behavior" name="behavior" className="field-input" defaultValue="sociaal">
            <option value="sociaal">Sociaal</option>
            <option value="onzeker">Onzeker</option>
            <option value="angstig">Angstig</option>
            <option value="reactief">Reactief</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="bite_risk">
            Bijtrisico
          </label>
          <select
            id="bite_risk"
            name="bite_risk"
            className="field-input"
            value={biteRisk}
            onChange={(e) => setBiteRisk(Number(e.target.value))}
          >
            <option value={0}>Geen</option>
            <option value={1}>Laag</option>
            <option value={2}>Matig</option>
            <option value={3}>Hoog</option>
          </select>
        </div>
      </div>

      {biteRisk >= 2 && (
        <p className="chip chip-alert w-fit">Bij dit bijtrisico geldt een muilkorfvereiste</p>
      )}

      <div>
        <label className="field-label" htmlFor="medical_note">
          Medische notitie
        </label>
        <input
          id="medical_note"
          name="medical_note"
          className="field-input"
          placeholder="Allergie, medicatie, leeftijd…"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="top_note">
          Belangrijkste aandachtspunt
        </label>
        <input
          id="top_note"
          name="top_note"
          className="field-input"
          maxLength={140}
          placeholder="Verschijnt bovenaan bij de trimmer"
        />
      </div>

      {state.error && <p className="chip chip-alert w-fit">{state.error}</p>}
      {state.success && <p className="chip w-fit">Dier toegevoegd aan je profiel.</p>}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Bezig…" : "Dier opslaan"}
      </button>
    </form>
  );
}
