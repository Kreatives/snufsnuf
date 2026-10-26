"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/lib/auth-actions";

export function LoginForm({ info }: { info?: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(loginAction, {});

  return (
    <form action={action} className="card p-6 flex flex-col gap-5">
      {info && (
        <p className="text-[0.9375rem] text-muted">
          We hebben je een bevestigingsmail gestuurd. Bevestig je account en log daarna in.
        </p>
      )}

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
          className="field-input"
          autoComplete="current-password"
        />
      </div>

      {state.error && <p className="chip chip-alert w-fit">{state.error}</p>}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Bezig…" : "Inloggen"}
      </button>

      <p className="text-[0.875rem] text-muted text-center">
        Nog geen account?{" "}
        <Link href="/registreren" className="text-ink underline underline-offset-2">
          Registreren
        </Link>
      </p>
    </form>
  );
}
