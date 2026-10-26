import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getSavedAnimals } from "@/lib/data";
import { AddPetForm } from "@/components/add-pet-form";
import { SIZE_LABELS, COAT_LABELS } from "@/lib/pricing";

export default async function MijnDierenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/inloggen");
  if (user.role === "aanbieder") redirect("/dashboard");

  const animals = await getSavedAnimals();

  return (
    <main className="mx-auto max-w-[760px] px-6 py-14">
      <h1 className="text-h2 mb-1">
        {user.name ? `Welkom, ${user.name}` : "Mijn dieren"}
      </h1>
      <p className="text-muted mb-8">
        Sla je dier één keer op. Bij het boeken hergebruik je het profiel en rekenen we prijs
        en duur uit maat en vacht.
      </p>

      {animals.length > 0 && (
        <div className="flex flex-col gap-3 mb-10">
          {animals.map((a) => (
            <article key={a.id} className="card p-4 flex items-center gap-4">
              <span className="media-ph size-12 rounded-full shrink-0" aria-hidden />
              <div className="flex-1">
                <p className="font-medium">{a.name}</p>
                <p className="text-[0.875rem] text-muted">
                  {a.breed ?? "onbekend ras"} · maat {SIZE_LABELS[a.sizeClass]} ·{" "}
                  {COAT_LABELS[a.coatType]}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {a.muzzleRequired && <span className="chip chip-alert">Muilkorf</span>}
                {a.behavior
                  .filter((b) => b !== "sociaal")
                  .map((b) => (
                    <span key={b} className="chip">
                      {b}
                    </span>
                  ))}
              </div>
            </article>
          ))}
        </div>
      )}

      <AddPetForm />
    </main>
  );
}
