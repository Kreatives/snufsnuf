import { getProviders } from "@/lib/data";
import { ProviderCard } from "@/components/provider-card";

const GREEN = "#1F3A2E";
const TERRA = "#C84E38";
const MINT = "#D6FDEC";
const MUTED = "#5B6B61";
const LINE = "#E7E6E0";

export default async function ZoekenPage() {
  const providers = await getProviders();
  return (
    <main style={{ background: "#fff", color: GREEN }}>
      <div className="mx-auto max-w-[1160px] px-6">
        {/* Hero + zoekformulier */}
        <section className="py-14 md:py-20 grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7">
            <span
              className="inline-flex items-center gap-2 h-7 px-3 rounded-full text-[0.8rem] font-medium mb-5"
              style={{ background: MINT, color: GREEN }}
            >
              🐾 Dierenzorg in Amsterdam
            </span>
            <h1
              className="font-display text-[2.4rem] md:text-[3rem] leading-[1.06] tracking-tight max-w-[15ch]"
              style={{ color: GREEN }}
            >
              Boek zorg op wat je dier nodig heeft
            </h1>
            <p className="mt-5 text-[1.0625rem] leading-relaxed max-w-[52ch]" style={{ color: MUTED }}>
              We matchen baasje en aanbieder op ras, vacht, maat en gedrag, en niet op wie toevallig
              bovenaan staat. De prijs en de duur komen uit het profiel van je dier, dus je weet
              vooraf waar je aan toe bent.
            </p>
          </div>

          <form
            className="lg:col-span-5 rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: "#fff", border: `1px solid ${LINE}` }}
            action="#"
          >
            <div>
              <label className="block text-[0.875rem] font-medium mb-1.5" htmlFor="q" style={{ color: GREEN }}>
                Wat zoek je?
              </label>
              <input
                id="q"
                className="w-full h-11 px-3.5 rounded-xl border text-[0.9375rem] bg-white outline-none focus:border-[#1F3A2E]"
                style={{ borderColor: "#d4d1c8" }}
                placeholder="Trimbeurt, kattentrimmer, aan huis…"
                defaultValue="Trimbeurt"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.875rem] font-medium mb-1.5" htmlFor="loc" style={{ color: GREEN }}>
                  Locatie
                </label>
                <input
                  id="loc"
                  className="w-full h-11 px-3.5 rounded-xl border text-[0.9375rem] bg-white outline-none focus:border-[#1F3A2E]"
                  style={{ borderColor: "#d4d1c8" }}
                  defaultValue="Amsterdam"
                />
              </div>
              <div>
                <label className="block text-[0.875rem] font-medium mb-1.5" htmlFor="straal" style={{ color: GREEN }}>
                  Straal
                </label>
                <select
                  id="straal"
                  className="w-full h-11 px-3.5 rounded-xl border text-[0.9375rem] bg-white outline-none focus:border-[#1F3A2E]"
                  style={{ borderColor: "#d4d1c8" }}
                  defaultValue="5"
                >
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="25">25 km</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="h-12 rounded-xl font-semibold text-[1rem] text-white transition-transform hover:-translate-y-0.5"
              style={{ background: TERRA }}
            >
              Zoek aanbieders
            </button>
            <p className="text-[0.8125rem]" style={{ color: MUTED }}>
              Prototype met voorbeelddata. In de echte versie komt hier de gespreksbot als eerste
              ingang.
            </p>
          </form>
        </section>

        {/* Resultaten */}
        <section className="pb-24">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <h2 className="font-display text-[1.75rem] md:text-[2rem] tracking-tight" style={{ color: GREEN }}>
              {providers.length} aanbieders in de buurt
            </h2>
            <div className="flex gap-2">
              <span
                className="inline-flex items-center h-8 px-3.5 rounded-full text-[0.8125rem] font-medium text-white"
                style={{ background: GREEN }}
              >
                Eerst vrij
              </span>
              {["Dichtbij", "Best beoordeeld"].map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center h-8 px-3.5 rounded-full text-[0.8125rem] font-medium border bg-white"
                  style={{ borderColor: "#d4d1c8", color: MUTED }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
