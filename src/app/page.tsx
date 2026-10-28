import Link from "next/link";
import type { Metadata } from "next";
import { WhatsappDemo } from "@/components/whatsapp-demo";
import { CopyLine } from "@/components/copy-line";

export const metadata: Metadata = {
  title: "Snuf Snuf — trimsalon, opvang of oppas, geregeld in één appje",
  description:
    "Stuur een bericht, zeg waar je woont en wat je dier nodig heeft. Snuf Snuf zoekt de beschikbare plekken met prijs, en je bevestigt en betaalt in hetzelfde gesprek.",
};

const GREEN = "#1F3A2E";
const TERRA = "#C84E38";
const MINT = "#D6FDEC";
const PINK = "#FFE4E0";
const MUTED = "#5B6B61";
const LINE = "#E7E6E0";

const EXAMPLE = "Hoi Snuf Snuf, ik zoek een trimsalon in Utrecht voor mijn cavapoo.";
const WA = `https://wa.me/31612345678?text=${encodeURIComponent(EXAMPLE)}`;

function Cta({
  children,
  href,
  tone = "terra",
  className = "",
}: {
  children: React.ReactNode;
  href: string;
  tone?: "terra" | "green" | "white";
  className?: string;
}) {
  const styles =
    tone === "terra"
      ? { background: TERRA, color: "#fff" }
      : tone === "green"
        ? { background: GREEN, color: "#fff" }
        : { background: "#fff", color: GREEN };
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-semibold text-[1rem] transition-transform hover:-translate-y-0.5 ${className}`}
      style={styles}
    >
      {children}
    </Link>
  );
}

function Eyebrow({ children, color = TERRA }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[0.8125rem] font-semibold uppercase tracking-wide mb-3" style={{ color }}>
      {children}
    </p>
  );
}

export default function HomePage() {
  return (
    <main style={{ background: "#fff", color: GREEN }}>
      {/* 1 — HERO */}
      <section className="mx-auto max-w-[1160px] px-6 pt-14 pb-20 md:pt-20 md:pb-28 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span
            className="inline-flex items-center gap-2 h-7 px-3 rounded-full text-[0.8rem] font-medium mb-6"
            style={{ background: MINT, color: GREEN }}
          >
            🐾 Dierenzorg boeken via WhatsApp
          </span>
          <h1
            className="font-display text-[2.6rem] md:text-[3.4rem] leading-[1.05] tracking-tight"
            style={{ color: GREEN }}
          >
            Trimsalon, opvang of oppas voor je hond of kat, geregeld in één appje.
          </h1>
          <p className="mt-5 text-[1.125rem] leading-relaxed max-w-[52ch]" style={{ color: MUTED }}>
            Stuur een bericht, zeg waar je woont en wat je dier nodig heeft. Snuf Snuf zoekt de
            beschikbare plekken met prijs, en je bevestigt en betaalt in hetzelfde gesprek.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Cta href={WA}>Begin op WhatsApp</Cta>
            <Link
              href="/zoeken"
              className="inline-flex items-center h-12 px-5 rounded-xl font-medium border transition-colors"
              style={{ borderColor: LINE, color: GREEN }}
            >
              Of blader zelf rond
            </Link>
          </div>
          <p className="mt-4 text-[0.85rem]" style={{ color: MUTED }}>
            Geen app installeren · geen account aanmaken · vooraf de prijs
          </p>
        </div>

        <div className="rounded-[2rem] p-6 sm:p-10" style={{ background: MINT }}>
          <WhatsappDemo />
        </div>
      </section>

      {/* 2 — HOE HET WERKT */}
      <section className="mx-auto max-w-[1160px] px-6 py-16 md:py-24">
        <div className="text-center max-w-[640px] mx-auto">
          <Eyebrow>Hoe het werkt</Eyebrow>
          <h2 className="font-display text-[2rem] md:text-[2.5rem] tracking-tight" style={{ color: GREEN }}>
            Vraag, kies, betaal
          </h2>
          <p className="mt-3 text-[1.0625rem]" style={{ color: MUTED }}>
            Gemiddeld geregeld in <strong style={{ color: GREEN }}>1 min 40</strong>, zonder bellen
            of wachten op een terugbelverzoek.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-12">
          {[
            {
              n: "1",
              title: "Vraag",
              body: "Je stuurt één bericht met je plaats en wat je dier nodig heeft.",
              chat: "Trimsalon in Utrecht voor mijn cavapoo, deze week?",
              side: "user" as const,
            },
            {
              n: "2",
              title: "Kies",
              body: "Snuf Snuf komt terug met vrije plekken, mét vanaf-prijs.",
              chat: "3 plekken vrij: Lola €40, Puppy & Co €35, De Vachtzaak €45",
              side: "bot" as const,
            },
            {
              n: "3",
              title: "Betaal",
              body: "Je bevestigt en rekent af in hetzelfde gesprek. Klaar.",
              chat: "Betaal €40,00 · iDEAL → ✅ Bevestigd",
              side: "bot" as const,
            },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border p-6" style={{ borderColor: LINE }}>
              <div
                className="size-9 rounded-full flex items-center justify-center font-semibold mb-5"
                style={{ background: MINT, color: GREEN }}
              >
                {s.n}
              </div>
              <h3 className="font-display text-[1.4rem]" style={{ color: GREEN }}>
                {s.title}
              </h3>
              <p className="mt-1.5 text-[0.95rem]" style={{ color: MUTED }}>
                {s.body}
              </p>
              <div
                className={`mt-5 rounded-xl px-3.5 py-2.5 text-[0.85rem] ${
                  s.side === "user" ? "ml-6" : "mr-6"
                }`}
                style={{
                  background: s.side === "user" ? MINT : "#F6F5F1",
                  color: "#15271E",
                }}
              >
                {s.chat}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3 — DE OUDE MANIER */}
      <section style={{ background: "#FAFAF8" }}>
        <div className="mx-auto max-w-[1160px] px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-5 items-stretch">
            {/* oud */}
            <div className="rounded-2xl border p-7" style={{ borderColor: LINE, background: "#fff" }}>
              <Eyebrow color={TERRA}>De oude manier</Eyebrow>
              <div className="flex flex-col gap-2.5 mt-2">
                {[
                  "7 trimsalons googelen en tabbladen openhouden",
                  "Bellen tijdens openingstijd — in gesprek",
                  "Voicemail inspreken en maar afwachten",
                  "Geen idee wat het kost tot je er bent",
                ].map((t) => (
                  <div
                    key={t}
                    className="flex items-center gap-2.5 text-[0.95rem]"
                    style={{ color: "#6b4a3a" }}
                  >
                    <span
                      className="size-5 rounded-full flex items-center justify-center text-[0.7rem]"
                      style={{ background: PINK, color: "#8A2F1E" }}
                    >
                      ✕
                    </span>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* nieuw */}
            <div className="rounded-2xl p-7" style={{ background: GREEN }}>
              <Eyebrow color={MINT}>Met Snuf Snuf</Eyebrow>
              <p className="font-display text-[1.6rem] leading-snug text-white mt-2">
                Eén appje, en het is geregeld — met de prijs er al bij.
              </p>
              <div
                className="mt-6 rounded-xl px-4 py-3 text-[0.95rem]"
                style={{ background: MINT, color: GREEN }}
              >
                ✅ Donderdag 14:00 bij Trimsalon Lola, Utrecht — €40 betaald
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 — VERTROUWEN */}
      <section className="mx-auto max-w-[1160px] px-6 py-16 md:py-24">
        <div className="max-w-[640px]">
          <Eyebrow>Vertrouwen &amp; veiligheid</Eyebrow>
          <h2 className="font-display text-[2rem] md:text-[2.5rem] tracking-tight" style={{ color: GREEN }}>
            Wij dragen het risico, niet jij
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-5 mt-10">
          {[
            {
              t: "Gecontroleerde aanbieders",
              b: "Elke trimmer, oppas en pension is gecheckt op KvK en identiteit voordat ze op Snuf Snuf staan.",
            },
            {
              t: "Vooraf betalen, volledige teruggave",
              b: "Je betaalt vooraf en krijgt alles terug als de afspraak niet doorgaat. Zo simpel is het.",
            },
            {
              t: "Alleen echte reviews",
              b: "Beoordelingen komen uitsluitend van baasjes die hier daadwerkelijk geboekt hebben.",
            },
            {
              t: "Nederlandse klantenservice",
              b: "Een vraag? Je krijgt antwoord van een mens, in hetzelfde chatgesprek.",
            },
          ].map((g) => (
            <div key={g.t} className="rounded-2xl border p-6" style={{ borderColor: LINE }}>
              <div
                className="size-10 rounded-xl flex items-center justify-center mb-4 text-[1.1rem]"
                style={{ background: MINT, color: GREEN }}
              >
                ✓
              </div>
              <h3 className="font-semibold text-[1.0625rem]" style={{ color: GREEN }}>
                {g.t}
              </h3>
              <p className="mt-1.5 text-[0.95rem]" style={{ color: MUTED }}>
                {g.b}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5 — AANBOD */}
      <section style={{ background: PINK }}>
        <div className="mx-auto max-w-[1160px] px-6 py-16 md:py-24">
          <div className="max-w-[640px]">
            <Eyebrow color={TERRA}>Aanbod bij jou in de buurt</Eyebrow>
            <h2
              className="font-display text-[2rem] md:text-[2.5rem] tracking-tight"
              style={{ color: GREEN }}
            >
              Voor elk dier, in elke stad
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {[
              { t: "Trimsalon", c: "Amsterdam · Utrecht · Rotterdam", p: "vanaf €30" },
              { t: "Dagopvang", c: "Den Haag · Eindhoven · Arnhem", p: "vanaf €22 /dag" },
              { t: "Pension", c: "Utrecht · Groningen · Tilburg", p: "vanaf €28 /nacht" },
              { t: "Oppas aan huis", c: "Amsterdam · Haarlem · Breda", p: "vanaf €15 /uur" },
              { t: "Uitlaatservice", c: "Rotterdam · Utrecht · Almere", p: "vanaf €12" },
              { t: "Kattenoppas", c: "Overal in Nederland", p: "vanaf €14 /bezoek" },
            ].map((cat) => (
              <Link
                key={cat.t}
                href="/zoeken"
                className="rounded-2xl p-6 bg-white transition-transform hover:-translate-y-1"
                style={{ border: `1px solid ${LINE}` }}
              >
                <h3 className="font-display text-[1.35rem]" style={{ color: GREEN }}>
                  {cat.t}
                </h3>
                <p className="mt-1 text-[0.9rem]" style={{ color: MUTED }}>
                  {cat.c}
                </p>
                <p className="mt-4 text-[0.9rem] font-semibold" style={{ color: TERRA }}>
                  {cat.p}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — BEWIJS */}
      <section className="mx-auto max-w-[1160px] px-6 py-16 md:py-24">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 items-center">
          <div>
            <p className="font-display text-[4rem] leading-none" style={{ color: TERRA }}>
              12.400+
            </p>
            <p className="mt-2 text-[1.0625rem]" style={{ color: MUTED }}>
              afspraken geregeld via één appje — van puppyknipbeurt tot twee weken pension.
            </p>
            <div className="mt-8 flex flex-col gap-4">
              {[
                {
                  q: "Eindelijk een volle agenda zonder de hele dag de telefoon aan te nemen.",
                  a: "Trimsalon Lola, Utrecht",
                },
                {
                  q: "Nieuwe klanten komen binnen terwijl ik gewoon aan het werk ben.",
                  a: "Dierenpension De Weide, Groningen",
                },
              ].map((x) => (
                <div key={x.a} className="rounded-xl border p-4" style={{ borderColor: LINE }}>
                  <p className="text-[0.95rem]" style={{ color: GREEN }}>
                    &ldquo;{x.q}&rdquo;
                  </p>
                  <p className="mt-1.5 text-[0.8rem] font-medium" style={{ color: MUTED }}>
                    {x.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                q: "Binnen twee minuten een trimsalon geboekt die écht met angsthonden kan. Scheelt me zoveel stress.",
                n: "Sanne",
                m: "Utrecht · met Pip, een cavapoo",
              },
              {
                q: "We gingen op vakantie en hadden last-minute opvang nodig. Geregeld voor we de koffers in hadden.",
                n: "Mehmet",
                m: "Rotterdam · met Loki, een husky",
              },
              {
                q: "Ik vergeet altijd te bellen tijdens openingstijden. Nu app ik gewoon 's avonds en het staat.",
                n: "Fleur",
                m: "Haarlem · met Saar, een maine coon",
              },
            ].map((r, i) => (
              <div
                key={r.n}
                className={`rounded-2xl p-6 ${i === 2 ? "sm:col-span-2" : ""}`}
                style={{ background: i === 2 ? MINT : "#F6F5F1" }}
              >
                <p className="text-[1rem] leading-relaxed" style={{ color: GREEN }}>
                  &ldquo;{r.q}&rdquo;
                </p>
                <p className="mt-4 font-semibold text-[0.9rem]" style={{ color: GREEN }}>
                  {r.n}
                </p>
                <p className="text-[0.8rem]" style={{ color: MUTED }}>
                  {r.m}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7 — VOOR AANBIEDERS */}
      <section className="mx-auto max-w-[1160px] px-6 pb-16 md:pb-24">
        <div
          className="rounded-[2rem] p-8 md:p-14 grid md:grid-cols-[1.3fr_1fr] gap-10 items-center"
          style={{ background: GREEN }}
        >
          <div>
            <Eyebrow color={MINT}>Voor aanbieders</Eyebrow>
            <h2 className="font-display text-[2rem] md:text-[2.6rem] leading-tight text-white">
              Heb je een trimsalon, opvang of oppasdienst?
            </h2>
            <p className="mt-4 text-[1.0625rem]" style={{ color: "#C9E6D7" }}>
              Snuf Snuf vult je agenda met baasjes die vooraf betalen. Je bepaalt zelf je prijzen en
              tijden, en betaalt alleen commissie op nieuwe klanten.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Cta href="/registreren" tone="white">
                Word aanbieder
              </Cta>
              <Link
                href="/inloggen"
                className="inline-flex items-center h-12 px-5 rounded-xl font-medium border transition-colors"
                style={{ borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}
              >
                Ik heb al een account
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {[
              ["Volle agenda", "Baasjes vinden jou, niet andersom."],
              ["Altijd vooraf betaald", "Geen no-shows, geen openstaande rekeningen."],
              ["Commissie alleen op nieuw", "Je vaste klanten blijven gratis."],
            ].map(([t, b]) => (
              <div
                key={t}
                className="rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <p className="font-semibold text-white text-[0.95rem]">{t}</p>
                <p className="text-[0.85rem]" style={{ color: "#AFC7B8" }}>
                  {b}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 — FAQ */}
      <section className="mx-auto max-w-[760px] px-6 py-16 md:py-20">
        <div className="text-center mb-10">
          <Eyebrow>Veelgestelde vragen</Eyebrow>
          <h2 className="font-display text-[2rem] md:text-[2.5rem] tracking-tight" style={{ color: GREEN }}>
            Nog even dit
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {[
            {
              q: "Is dit een echt persoon of een AI?",
              a: "Beide. Snuf Snuf begrijpt je vraag automatisch en zoekt razendsnel plekken, maar er zit altijd een Nederlands team achter dat kan bijspringen. We doen daar niet geheimzinnig over.",
            },
            {
              q: "Werkt het ook voor katten?",
              a: "Zeker. Kattentrimmers, kattenoppas aan huis en pensions die katten nemen staan er allemaal op. Vertel gewoon dat het om een kat gaat.",
            },
            {
              q: "Moet ik een app installeren of een account maken?",
              a: "Nee. Je begint gewoon in WhatsApp. Geen download, geen wachtwoord.",
            },
            {
              q: "Wat als de afspraak niet doorgaat?",
              a: "Je betaalt vooraf en krijgt alles terug als de afspraak wordt geannuleerd. Het risico ligt bij ons, niet bij jou.",
            },
            {
              q: "Hoe weet ik dat een aanbieder te vertrouwen is?",
              a: "Elke aanbieder is gecontroleerd op KvK en identiteit, en de reviews komen alleen van echte boekingen.",
            },
            {
              q: "Wat kost het mij als baasje?",
              a: "Niets extra's. Je betaalt de prijs van de aanbieder die je vooraf in de chat ziet — zonder verrassingen achteraf.",
            },
          ].map((f) => (
            <details
              key={f.q}
              className="rounded-xl border px-5 py-4 group"
              style={{ borderColor: LINE, background: "#fff" }}
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-[1rem]" style={{ color: GREEN }}>
                {f.q}
                <span className="shrink-0 transition-transform group-open:rotate-45" style={{ color: TERRA }}>
                  +
                </span>
              </summary>
              <p className="mt-3 text-[0.95rem] leading-relaxed" style={{ color: MUTED }}>
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 9 — LAATSTE CTA */}
      <section style={{ background: MINT }}>
        <div className="mx-auto max-w-[1160px] px-6 py-16 md:py-24 grid md:grid-cols-[1.3fr_1fr] gap-10 items-center">
          <div>
            <h2
              className="font-display text-[2.2rem] md:text-[3rem] leading-[1.08] tracking-tight"
              style={{ color: GREEN }}
            >
              Klaar om het je dier makkelijk te maken?
            </h2>
            <p className="mt-4 text-[1.0625rem] max-w-[46ch]" style={{ color: "#3f5248" }}>
              Stuur je eerste berichtje. Zeg waar je woont en wat je dier nodig heeft, dan snuffelen
              wij rond en komen we terug met plekken die vandaag nog vrij zijn.
            </p>
            <div className="mt-7">
              <Cta href={WA} className="h-14 px-8 text-[1.05rem]">
                Begin op WhatsApp
              </Cta>
            </div>
            <p className="mt-6 text-[0.85rem] font-medium" style={{ color: GREEN }}>
              Of kopieer deze openingszin:
            </p>
            <div className="mt-2 max-w-[460px]">
              <CopyLine text={EXAMPLE} />
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="rounded-2xl bg-white p-6 text-center" style={{ border: `1px solid ${LINE}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=190x190&margin=0&data=${encodeURIComponent(
                  WA,
                )}`}
                alt="Scan om Snuf Snuf te appen"
                width={190}
                height={190}
                className="rounded-lg"
              />
              <p className="mt-3 text-[0.85rem] font-medium" style={{ color: GREEN }}>
                Scan en app direct
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer-strip */}
      <footer className="border-t" style={{ borderColor: LINE }}>
        <div
          className="mx-auto max-w-[1160px] px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-[0.875rem]"
          style={{ color: MUTED }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/horizontal-green.svg" alt="Snuf Snuf" className="h-6 w-auto" />
          <div className="flex flex-wrap gap-5">
            <Link href="/zoeken" className="hover:underline">
              Zoeken
            </Link>
            <Link href="/registreren" className="hover:underline">
              Voor aanbieders
            </Link>
            <Link href="/inloggen" className="hover:underline">
              Inloggen
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
