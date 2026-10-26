"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/lib/auth-actions";

export function RegisterForm() {
  const [role, setRole] = useState<"baasje" | "aanbieder">("baasje");
  const [state, action, pending] = useActionState<ActionState, FormData>(
    registerAction,
    {},
  );

  return (
    <form action={action} className="card p-6 flex flex-col gap-5">
      <input type="hidden" name="role" value={role} />

      <div>
        <span className="field-label">Ik maak een account als</span>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            type="button"
            onClick={() => setRole("baasje")}
            className={`p-4 rounded-md border text-left transition-colors ${
              role === "baasje" ? "border-ink bg-bg" : "border-line-strong"
            }`}
          >
            <span className="font-medium block">Baasje</span>
            <span className="text-[0.8125rem] text-muted">Ik heb een huisdier</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("aanbieder")}
            className={`p-4 rounded-md border text-left transition-colors ${
              role === "aanbieder" ? "border-ink bg-bg" : "border-line-strong"
            }`}
          >
            <span className="font-medium block">Bedrijf</span>
            <span className="text-[0.8125rem] text-muted">Ik bied dierenzorg aan</span>
          </button>
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="name">
          {role === "aanbieder" ? "Handelsnaam" : "Je naam"}
        </label>
        <input id="name" name="name" className="field-input" autoComplete="name" />
      </div>

      <div>
        <label className="field-label" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="field-input"
          autoComplete="email"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="password">
          Wachtwoord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="field-input"
          autoComplete="new-password"
        />
      </div>

      {state.error && <p className="chip chip-alert w-fit">{state.error}</p>}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Bezig…" : "Account aanmaken"}
      </button>

      <p className="text-[0.875rem] text-muted text-center">
        Al een account?{" "}
        <Link href="/inloggen" className="text-ink underline underline-offset-2">
          Inloggen
        </Link>
      </p>
    </form>
  );
}
