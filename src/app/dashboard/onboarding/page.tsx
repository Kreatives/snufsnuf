import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getOwnedProvider } from "@/lib/data";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/inloggen");
  if (user.role !== "aanbieder") redirect("/mijn-dieren");

  const existing = await getOwnedProvider();
  if (existing) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-[680px] px-6 py-14">
      <h1 className="text-h2 mb-1">Richt je salon in</h1>
      <p className="text-muted mb-7">
        Dit is wat baasjes op de marktplaats zien. Je kunt het later altijd aanpassen.
      </p>
      <OnboardingForm defaultName={user.name ?? undefined} />
    </main>
  );
}
