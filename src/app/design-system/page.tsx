import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Snufsnuf — Design system (verkenning)",
};

/*
  Losse verkenningspagina. Past NIETS toe op de rest van de app.
  Palet: deep green #1F3A2E (accent/secundair), terracotta #C84E38 (CTA),
  lichte achtergrond. Kleuren staan hier bewust als arbitrary Tailwind-waarden
  zodat de globale tokens ongemoeid blijven.
*/

const GREEN = "#1F3A2E";
const GREEN_HOVER = "#16281F";
const TERRA = "#C84E38";
const TERRA_HOVER = "#B5442F";
const SAND = "#F4F2EC";
const LINE = "#E4E2DB";

function Swatch({
  name,
  hex,
  on,
  note,
}: {
  name: string;
  hex: string;
  on: string;
  note: string;
}) {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: LINE }}>
      <div className="h-24 flex items-end p-3" style={{ background: hex, color: on }}>
        <span className="text-sm font-medium">{on === "#ffffff" ? "Aa wit" : "Aa donker"}</span>
      </div>
      <div className="p-3 bg-white">
        <p className="font-medium text-[0.9375rem]" style={{ color: GREEN }}>
          {name}
        </p>
        <p className="text-[0.8125rem] font-mono" style={{ color: "#6f6e69" }}>
          {hex.toUpperCase()}
        </p>
        <p className="text-[0.75rem] mt-1" style={{ color: "#6f6e69" }}>
          {note}
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-10 border-t" style={{ borderColor: LINE }}>
      <h2 className="text-[0.8125rem] font-semibold tracking-wide uppercase mb-6" style={{ color: TERRA }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main style={{ background: SAND, minHeight: "100vh" }}>
      <div className="mx-auto max-w-[960px] px-6 py-14">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex items-center h-6 px-2 rounded-full text-[0.75rem] font-medium"
            style={{ background: TERRA, color: "#fff" }}
          >
            Verkenning
          </span>
          <span className="text-[0.8125rem]" style={{ color: "#6f6e69" }}>
            nog niet toegepast op de app
          </span>
        </div>
        <h1 className="text-[2.5rem] font-semibold tracking-tight" style={{ color: GREEN }}>
          Snufsnuf design system
        </h1>
        <p className="mt-3 text-[1.0625rem] max-w-[60ch]" style={{ color: "#4a4944" }}>
          Lichte, rustige basis met <strong style={{ color: GREEN }}>deep green</strong> als accent en{" "}
          <strong style={{ color: TERRA }}>terracotta</strong> als call-to-action. Alle combinaties
          hieronder zijn op WCAG-contrast gecontroleerd.
        </p>

        {/* Palet */}
        <Section title="Palet">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Swatch name="Deep green" hex={GREEN} on="#ffffff" note="Accent, tekst, nav. Wit erop ≈ 11:1 — AAA." />
            <Swatch name="Terracotta" hex={TERRA} on="#ffffff" note="CTA. Wit erop ≈ 4.5:1 — AA (normaal)." />
            <Swatch name="Zand (bg)" hex={SAND} on={GREEN} note="Achtergrond. Green erop ≈ 10:1." />
            <Swatch name="Wit (surface)" hex="#ffffff" on={GREEN} note="Kaarten. Green erop ≈ 11:1." />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <Swatch name="Ink" hex="#141413" on="#ffffff" note="Hoofdtekst op licht." />
            <Swatch name="Muted" hex="#6F6E69" on="#ffffff" note="Secundaire tekst ≈ 5.1:1 — AA." />
            <Swatch name="Line" hex={LINE} on={GREEN} note="Hairline borders." />
            <Swatch name="Green tint" hex="#E7ECE8" on={GREEN} note="Zachte green-achtergrond voor badges." />
          </div>
        </Section>

        {/* Typografie */}
        <Section title="Typografie — Inter Tight">
          <div className="bg-white rounded-xl border p-6 flex flex-col gap-4" style={{ borderColor: LINE }}>
            <p className="text-[2.5rem] font-semibold tracking-tight leading-none" style={{ color: GREEN }}>
              Display · 40/600
            </p>
            <p className="text-[1.875rem] font-semibold tracking-tight" style={{ color: GREEN }}>
              Heading 2 · 30/600
            </p>
            <p className="text-[1.375rem] font-semibold" style={{ color: "#141413" }}>
              Heading 3 · 22/600
            </p>
            <p className="text-[1.0625rem]" style={{ color: "#141413" }}>
              Body · 17/400 — rustige leesregel voor profielteksten en uitleg in de boekingsflow.
            </p>
            <p className="text-[0.8125rem] font-medium uppercase tracking-wide" style={{ color: "#6f6e69" }}>
              Eyebrow · 13/500
            </p>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Knoppen">
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="h-11 px-5 rounded-xl font-medium text-[0.9375rem] text-white transition-colors"
              style={{ background: TERRA }}
            >
              Boek deze dienst
            </button>
            <button
              className="h-11 px-5 rounded-xl font-medium text-[0.9375rem] text-white transition-colors"
              style={{ background: GREEN }}
            >
              Opslaan
            </button>
            <button
              className="h-11 px-5 rounded-xl font-medium text-[0.9375rem] bg-transparent transition-colors border"
              style={{ borderColor: "#d4d1c8", color: GREEN }}
            >
              Annuleren
            </button>
            <button
              className="h-11 px-5 rounded-xl font-medium text-[0.9375rem] text-white opacity-40 cursor-not-allowed"
              style={{ background: TERRA }}
              disabled
            >
              Bezig…
            </button>
          </div>
          <p className="text-[0.8125rem] mt-3" style={{ color: "#6f6e69" }}>
            Terracotta = de primaire actie op een scherm (boeken, bevestigen). Green = beheer-acties.
            Ghost = secundair.
          </p>
        </Section>

        {/* Chips / badges */}
        <Section title="Chips & badges">
          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex items-center h-7 px-2.5 rounded-full text-[0.8125rem] font-medium border bg-white"
              style={{ borderColor: "#d4d1c8", color: "#6f6e69" }}
            >
              Prikkelarm
            </span>
            <span
              className="inline-flex items-center h-7 px-2.5 rounded-full text-[0.8125rem] font-medium"
              style={{ background: "#E7ECE8", color: GREEN }}
            >
              Angsthond
            </span>
            <span
              className="inline-flex items-center h-7 px-2.5 rounded-full text-[0.8125rem] font-medium text-white"
              style={{ background: GREEN }}
            >
              Geselecteerd
            </span>
            <span
              className="inline-flex items-center h-7 px-2.5 rounded-full text-[0.8125rem] font-medium"
              style={{ background: "#F7E9E5", color: "#8A2F1E" }}
            >
              Nog 1 plek
            </span>
          </div>
        </Section>

        {/* Kaarten in context */}
        <Section title="In context — zoekresultaat">
          <div className="grid sm:grid-cols-2 gap-4">
            <article className="rounded-2xl overflow-hidden border bg-white flex flex-col" style={{ borderColor: LINE }}>
              <div className="h-40" style={{ background: "linear-gradient(135deg,#ecebe5,#e2e0d8)" }} />
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[1.375rem] font-semibold" style={{ color: GREEN }}>
                      Hondensalon Arnhem
                    </h3>
                    <p className="text-[0.8125rem] mt-0.5" style={{ color: "#6f6e69" }}>
                      Trimsalon · Arnhem · 1,2 km
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center h-7 px-2.5 rounded-full text-[0.8125rem] font-medium"
                    style={{ background: "#E7ECE8", color: GREEN }}
                  >
                    4,9 · 212
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Prikkelarm", "Angsthond", "Katten"].map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center h-7 px-2.5 rounded-full text-[0.8125rem] font-medium border bg-white"
                      style={{ borderColor: "#d4d1c8", color: "#6f6e69" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="pt-3 border-t flex items-end justify-between" style={{ borderColor: LINE }}>
                  <div>
                    <p className="text-[0.8125rem]" style={{ color: "#6f6e69" }}>
                      Vanaf
                    </p>
                    <p className="text-[1.375rem] font-semibold" style={{ color: "#141413" }}>
                      €35,00
                    </p>
                  </div>
                  <button
                    className="h-11 px-5 rounded-xl font-medium text-[0.9375rem] text-white"
                    style={{ background: TERRA }}
                  >
                    Bekijk en boek
                  </button>
                </div>
              </div>
            </article>

            {/* Form preview */}
            <div className="rounded-2xl border bg-white p-6 flex flex-col gap-4" style={{ borderColor: LINE }}>
              <div>
                <label className="block text-[0.875rem] font-medium mb-1.5" style={{ color: "#141413" }}>
                  Naam van je hond
                </label>
                <input
                  className="w-full h-11 px-3.5 rounded-xl border text-[0.9375rem] bg-white"
                  style={{ borderColor: "#d4d1c8" }}
                  placeholder="Bijv. Nala"
                />
              </div>
              <div>
                <label className="block text-[0.875rem] font-medium mb-1.5" style={{ color: "#141413" }}>
                  Dienst
                </label>
                <select
                  className="w-full h-11 px-3.5 rounded-xl border text-[0.9375rem] bg-white"
                  style={{ borderColor: "#d4d1c8" }}
                >
                  <option>Volledige knipbeurt — €35</option>
                  <option>Wassen en föhnen — €25</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-[0.9375rem] cursor-pointer" style={{ color: "#141413" }}>
                <input type="checkbox" className="size-4" style={{ accentColor: GREEN }} defaultChecked /> Mijn
                hond is prikkelgevoelig
              </label>
              <button
                className="h-11 px-5 rounded-xl font-medium text-[0.9375rem] text-white w-full"
                style={{ background: TERRA }}
              >
                Doorgaan naar bevestigen
              </button>
            </div>
          </div>
        </Section>

        {/* Feedback */}
        <Section title="Meldingen">
          <div className="flex flex-col gap-3">
            <div
              className="rounded-xl border px-4 py-3 text-[0.9375rem] flex items-center gap-3"
              style={{ borderColor: "#CDE0D5", background: "#EEF4F0", color: GREEN }}
            >
              <span className="font-medium">Gelukt</span> — je afspraak is bevestigd.
            </div>
            <div
              className="rounded-xl border px-4 py-3 text-[0.9375rem] flex items-center gap-3"
              style={{ borderColor: "#E7C7BF", background: "#F7E9E5", color: "#8A2F1E" }}
            >
              <span className="font-medium">Let op</span> — je afspraak is verplaatst naar do 30 okt.
            </div>
          </div>
        </Section>

        <p className="pt-10 text-[0.8125rem]" style={{ color: "#6f6e69" }}>
          Alleen zichtbaar op <span className="font-mono">/design-system</span>. De rest van de app
          blijft ongewijzigd tot we dit samen vastzetten.
        </p>
      </div>
    </main>
  );
}
