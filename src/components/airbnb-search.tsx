const TERRA = "#C84E38";

const CATS: [string, string][] = [
  ["", "Alle zorg"],
  ["trimsalon", "Trimsalon"],
  ["kattentrimsalon", "Kattentrimsalon"],
  ["mobiele_trimmer", "Mobiel, aan huis"],
  ["dagopvang", "Dagopvang"],
  ["pension", "Pension"],
  ["uitlaatservice", "Uitlaatservice"],
  ["oppas", "Oppas aan huis"],
];

/** Airbnb-achtige zoekbalk: Waar / Wanneer / Wat + ronde zoekknop. Plain GET-form. */
export function AirbnbSearch({ loc, date, cat }: { loc: string; date: string; cat: string }) {
  return (
    <div className="mx-auto max-w-[860px] px-6 pt-8 pb-6">
      <form
        method="get"
        action="/zoeken"
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 bg-white rounded-3xl sm:rounded-full border border-line-strong shadow-[0_2px_16px_rgba(20,20,19,0.06)] sm:pl-2 sm:pr-2"
      >
        <label className="group flex-1 rounded-full px-5 py-2.5 cursor-text hover:bg-bg transition-colors">
          <span className="block text-[0.75rem] font-semibold text-ink">Waar</span>
          <input
            name="loc"
            defaultValue={loc}
            placeholder="Plaats of stad"
            className="w-full bg-transparent text-[0.9375rem] text-muted placeholder:text-muted outline-none"
          />
        </label>

        <span className="hidden sm:block w-px h-9 bg-line shrink-0" />

        <label className="group flex-1 rounded-full px-5 py-2.5 cursor-text hover:bg-bg transition-colors">
          <span className="block text-[0.75rem] font-semibold text-ink">Wanneer</span>
          <input
            name="date"
            type="date"
            defaultValue={date}
            className="w-full bg-transparent text-[0.9375rem] text-muted outline-none"
          />
        </label>

        <span className="hidden sm:block w-px h-9 bg-line shrink-0" />

        <label className="group flex-1 rounded-full px-5 py-2.5 cursor-pointer hover:bg-bg transition-colors">
          <span className="block text-[0.75rem] font-semibold text-ink">Wat</span>
          <select
            name="cat"
            defaultValue={cat}
            className="w-full bg-transparent text-[0.9375rem] text-muted outline-none cursor-pointer"
          >
            {CATS.map(([value, label]) => (
              <option key={value || "all"} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="p-1.5 flex sm:block">
          <button
            type="submit"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-12 sm:size-12 rounded-full text-white transition-transform hover:-translate-y-0.5"
            style={{ background: TERRA }}
            aria-label="Zoeken"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="sm:hidden font-semibold">Zoeken</span>
          </button>
        </div>
      </form>
    </div>
  );
}
