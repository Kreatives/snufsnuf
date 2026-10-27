"use client";

import { useActionState } from "react";
import { updateProfileAction, type ActionState } from "@/lib/auth-actions";

export function AccountForm({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfileAction, {});

  return (
    <form action={action} className="card p-6 flex flex-col gap-4">
      <div>
        <label className="field-label" htmlFor="name">
          Naam
        </label>
        <input id="name" name="name" className="field-input" defaultValue={name} />
      </div>
      <div>
        <label className="field-label" htmlFor="email">
          E-mail
        </label>
        <input id="email" className="field-input" defaultValue={email} disabled />
        <p className="text-[0.8125rem] text-muted mt-1">
          Je e-mailadres wijzig je via de inloginstellingen.
        </p>
      </div>
      <div>
        <label className="field-label" htmlFor="phone">
          Telefoon
        </label>
        <input
          id="phone"
          name="phone"
          className="field-input"
          defaultValue={phone}
          inputMode="tel"
          placeholder="06 12345678"
        />
      </div>

      {state.error && <p className="chip chip-alert w-fit">{state.error}</p>}
      {state.success && <p className="chip w-fit">Opgeslagen.</p>}

      <button type="submit" className="btn btn-primary w-fit" disabled={pending}>
        {pending ? "Bezig…" : "Opslaan"}
      </button>
    </form>
  );
}
