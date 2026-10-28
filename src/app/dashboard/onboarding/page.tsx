import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getOwnedProviders } from "@/lib/data";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/inloggen");
  if (user.role !== "aanbieder") redirect("/mijn-dieren");

  // Heeft de aanbieder al een salon? Dan is dit een extra salon toevoegen.
  const existing = await getOwnedProviders();
  const isAdding = existing.length > 0;

  return (
    <main className={`max-w-[680px] mx-auto ${isAdding ? "" : "px-6 py-14"}`}>
      {isAdding && (
        <Link
          href="/dashboard"
          className="text-[0.9375rem] text-muted hover:text-ink transition-colors mb-5 inline-block"
        >
          ← Terug naar dashboard
        </Link>
      )}
      <h1 className="text-h2 mb-1">{isAdding ? "Nieuwe salon toevoegen" : "Richt je salon in"}</h1>
      <p className="text-muted mb-7">
        Vertel hoe je salon heet en waar die zit. Dit is wat baasjes op de marktplaats zien, en je
        kunt het later altijd aanpassen.
      </p>
      <OnboardingForm defaultName={isAdding ? undefined : user.name ?? undefined} />
    </main>
  );
}
