import { getProviders } from "@/lib/data";
import { ProviderCard } from "@/components/provider-card";

export default async function ZoekenPage() {
  const providers = await getProviders();
  return (
    <main className="mx-auto max-w-[1200px] px-6">
      <section className="py-20 md:py-28 grid md:grid-cols-12 gap-8 items-end">
        <div className="md:col-span-7">
          <p className="text-eyebrow mb-4">Dierenzorg in Amsterdam</p>
          <h1 className="text-display max-w-[14ch]">
            Boek zorg op wat je dier nodig heeft
          </h1>
          <p className="mt-5 text-[1.0625rem] text-muted max-w-[52ch]">
            We matchen baasje en aanbieder op ras, vacht, maat en gedrag, en niet op wie
            toevallig bovenaan staat. De prijs en de duur komen uit het profiel van je dier,
            dus je weet vooraf waar je aan toe bent.
          </p>
        </div>

        <form className="md:col-span-5 card p-5 flex flex-col gap-4" action="#">
          <div>
            <label className="field-label" htmlFor="q">
              Wat zoek je?
            </label>
            <input
              id="q"
              className="field-input"
              placeholder="Trimbeurt, kattentrimmer, aan huis…"
              defaultValue="Trimbeurt"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="loc">
                Locatie
              </label>
              <input id="loc" className="field-input" defaultValue="Amsterdam" />
            </div>
            <div>
              <label className="field-label" htmlFor="straal">
                Straal
              </label>
              <select id="straal" className="field-input" defaultValue="5">
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Zoek aanbieders
          </button>
          <p className="text-[0.8125rem] text-muted">
            Prototype met voorbeelddata. In de echte versie komt hier de gespreksbot als
            eerste ingang.
          </p>
        </form>
      </section>

      <section className="pb-24">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h2 className="text-h2">{providers.length} aanbieders in de buurt</h2>
          <div className="flex gap-2">
            <span className="chip chip-solid">Eerst vrij</span>
            <span className="chip">Dichtbij</span>
            <span className="chip">Best beoordeeld</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      </section>
    </main>
  );
}
