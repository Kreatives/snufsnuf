"use client";

// Chat-widget rechtsonder. Zelfde look als de WhatsApp-animatie in de hero, maar
// echt interactief: je typt (of tikt) wat je dier nodig heeft en waar je woont, en
// Snuf Snuf zoekt echte aanbieders uit Supabase via de searchProviders-actie.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { searchProviders, getChatFacets, type ChatResult } from "@/lib/chat-actions";
import type { ProviderCategory, Species } from "@/lib/types";

const GREEN = "#1F3A2E";
const MINT = "#D6FDEC";
const TERRA = "#C84E38";
const CHAT_BG = "#ECE5DD";

/* ── Vocabulaire: intentie → aanbiedercategorieën ──────────────────────────── */

type IntentKey = "trim" | "opvang" | "pension" | "oppas" | "uitlaat";

const INTENTS: { key: IntentKey; label: string; emoji: string; cats: ProviderCategory[] }[] = [
  { key: "trim", label: "Trimsalon", emoji: "✂️", cats: ["trimsalon", "kattentrimsalon", "mobiele_trimmer"] },
  { key: "opvang", label: "Dagopvang", emoji: "🏡", cats: ["dagopvang"] },
  { key: "pension", label: "Pension", emoji: "🛏️", cats: ["pension"] },
  { key: "oppas", label: "Oppas aan huis", emoji: "🏠", cats: ["oppas"] },
  { key: "uitlaat", label: "Uitlaatservice", emoji: "🦮", cats: ["uitlaatservice"] },
];

const intentLabel = (k: IntentKey) => INTENTS.find((i) => i.key === k)!.label;
const intentCats = (k: IntentKey) => INTENTS.find((i) => i.key === k)!.cats;

const CAT_KEYWORDS: [RegExp, IntentKey][] = [
  [/trim|knip|vacht|scheren|plukken|wassen|hondenkapper|kattenkapper|kapper/, "trim"],
  [/pension|logeer|logeren|logee|nachtje|overnacht|vakantie|weekendje/, "pension"],
  [/dagopvang|opvang|cr[eè]che|dagverblijf/, "opvang"],
  [/oppas|oppassen|aan huis|verzorg/, "oppas"],
  [/uitlaat|uitlaten|wandel|uitje|uitgelaten/, "uitlaat"],
];

const SPECIES_KEYWORDS: [RegExp, Species][] = [
  [/\b(kat|poes|kater|kitten|katje|katten)\b/, "kat"],
  [/\b(hond|hondje|pup|puppy|puppies|reu|teef|doggo)\b/, "hond"],
];

const CITY_LIST = [
  "Amsterdam", "Utrecht", "Rotterdam", "Den Haag", "Eindhoven", "Groningen", "Tilburg",
  "Almere", "Breda", "Nijmegen", "Arnhem", "Haarlem", "Amersfoort", "Apeldoorn", "Enschede",
  "Zwolle", "Leiden", "Maastricht", "Delft", "Den Bosch", "Dordrecht", "Alkmaar",
  "Leeuwarden", "Hilversum", "Amstelveen", "Zaandam",
];

function detectCity(text: string): string | undefined {
  const t = text.toLowerCase();
  return CITY_LIST.find((c) => t.includes(c.toLowerCase()));
}

/** Laatste redmiddel als we om een plaats vroegen: maak er een nette stadsnaam van. */
function guessCity(text: string): string | undefined {
  const cleaned = text
    .toLowerCase()
    .replace(/\b(in|te|bij|rond|omgeving van|de stad|plaats)\b/g, " ")
    .replace(/[^a-zà-ÿ'\s-]/gi, " ")
    .trim();
  if (!cleaned || cleaned.length < 2) return undefined;
  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ── Berichten ─────────────────────────────────────────────────────────────── */

type Chip =
  | { label: string; type: "intent"; value: IntentKey }
  | { label: string; type: "city"; value: string }
  | { label: string; type: "restart" }
  | { label: string; type: "newcity" }
  | { label: string; type: "link"; href: string };

type Msg =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "bot"; text: string; chips?: Chip[]; results?: ChatResult[] };

type Slots = { intent: IntentKey | null; city: string; cityKnown: boolean; species: Species | null };

const emptySlots: Slots = { intent: null, city: "", cityKnown: false, species: null };

const INTENT_CHIPS: Chip[] = INTENTS.map((i) => ({
  label: `${i.emoji} ${i.label}`,
  type: "intent",
  value: i.key,
}));

const OVERAL_CHIP: Chip = { label: "Overal in NL", type: "city", value: "" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ── Component ─────────────────────────────────────────────────────────────── */

export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");

  const slots = useRef<Slots>({ ...emptySlots });
  const pending = useRef<"intent" | "city" | null>(null);
  // Snelknoppen die écht iemand opleveren (uit de data). Standaard alles tot de facets binnen zijn.
  const intentChips = useRef<Chip[]>(INTENT_CHIPS);
  const cityChips = useRef<Chip[]>([OVERAL_CHIP]);
  const facetsLoaded = useRef(false);
  const seq = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const nextId = () => ++seq.current;

  // Aandachts-pill één keer tonen zolang de chat dicht is.
  useEffect(() => {
    const t = setTimeout(() => setNudge(true), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, open]);

  // Niet tonen in het aanbieders-dashboard of op de design-systeempagina.
  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/design-system")) return null;

  function pushUser(text: string) {
    setMessages((m) => [...m, { id: nextId(), role: "user", text }]);
  }

  async function botSay(text: string, extra?: { chips?: Chip[]; results?: ChatResult[] }, delay = 650) {
    setTyping(true);
    await sleep(delay);
    setTyping(false);
    setMessages((m) => [...m, { id: nextId(), role: "bot", text, chips: extra?.chips, results: extra?.results }]);
  }

  async function loadFacets() {
    if (facetsLoaded.current) return;
    try {
      const { categories, cities } = await getChatFacets();
      const avail = INTENT_CHIPS.filter(
        (c) => c.type === "intent" && intentCats(c.value).some((cat) => categories.includes(cat)),
      );
      if (avail.length) intentChips.current = avail;
      if (cities.length) {
        cityChips.current = [
          ...cities.map((c) => ({ label: c, type: "city", value: c }) as Chip),
          OVERAL_CHIP,
        ];
      }
      facetsLoaded.current = true;
    } catch {
      // Val stil terug op de volledige set.
    }
  }

  async function greet() {
    slots.current = { ...emptySlots };
    pending.current = "intent";
    await loadFacets();
    await botSay(
      "Hoi! 🐾 Ik ben Snuf Snuf. Zeg me wat je dier nodig heeft en waar je woont, dan zoek ik meteen plekken bij jou in de buurt. Je kunt gewoon typen, of kies hieronder:",
      { chips: intentChips.current },
      400,
    );
  }

  function openChat() {
    setOpen(true);
    setNudge(false);
    if (messages.length === 0) void greet();
    setTimeout(() => inputRef.current?.focus(), 250);
  }

  async function runSearch() {
    const s = slots.current;
    pending.current = null;
    setTyping(true);
    let results: ChatResult[] = [];
    try {
      results = await searchProviders({
        categories: s.intent ? intentCats(s.intent) : [],
        city: s.cityKnown ? s.city : "",
        species: s.species,
      });
    } catch {
      results = [];
    }
    await sleep(300);
    setTyping(false);

    const waar = s.cityKnown && s.city ? ` in ${s.city}` : "";
    if (results.length > 0) {
      const n = results.length;
      await botSay(
        `Gevonden! ${n} ${n === 1 ? "plek" : "plekken"}${waar} die bij je passen 👇 Tik op een plek om te boeken.`,
        { results, chips: [{ label: "🔄 Opnieuw zoeken", type: "restart" }] },
        300,
      );
    } else {
      await botSay(
        `Hmm, ik vond nog niets${waar} voor ${s.intent ? intentLabel(s.intent).toLowerCase() : "deze zorg"}. Probeer een andere plaats, of blader zelf door alles.`,
        {
          chips: [
            { label: "📍 Andere plaats", type: "newcity" },
            { label: "Bekijk alle aanbieders", type: "link", href: "/zoeken" },
          ],
        },
        300,
      );
    }
  }

  /** Bepaal de volgende botstap op basis van wat we al weten. */
  async function advance() {
    const s = slots.current;
    if (!s.intent) {
      pending.current = "intent";
      await botSay("Waar kan ik je mee helpen? Kies een soort zorg of typ het gewoon:", { chips: intentChips.current });
      return;
    }
    if (!s.cityKnown) {
      pending.current = "city";
      await botSay(`Top — ${intentLabel(s.intent).toLowerCase()}. In welke plaats zoek ik voor je?`, { chips: cityChips.current });
      return;
    }
    await runSearch();
  }

  /** Vul slots bij op basis van vrije tekst (overschrijft met nieuwe info). */
  function parse(text: string) {
    const t = ` ${text.toLowerCase()} `;
    const s = slots.current;

    for (const [re, key] of CAT_KEYWORDS) {
      if (re.test(t)) { s.intent = key; break; }
    }
    for (const [re, sp] of SPECIES_KEYWORDS) {
      if (re.test(t)) { s.species = sp; break; }
    }
    const city = detectCity(text);
    if (city) { s.city = city; s.cityKnown = true; }
    else if (pending.current === "city") {
      const guess = guessCity(text);
      if (guess) { s.city = guess; s.cityKnown = true; }
    }
  }

  async function handleText(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    setBusy(true);
    setInput("");
    pushUser(text);
    parse(text);
    await advance();
    setBusy(false);
    inputRef.current?.focus();
  }

  async function handleChip(chip: Chip) {
    if (busy || chip.type === "link") return;
    setBusy(true);
    if (chip.type === "intent") {
      pushUser(intentLabel(chip.value));
      slots.current.intent = chip.value;
      await advance();
    } else if (chip.type === "city") {
      pushUser(chip.value || "Overal in Nederland");
      slots.current.city = chip.value;
      slots.current.cityKnown = true;
      await advance();
    } else if (chip.type === "newcity") {
      pushUser("Andere plaats");
      slots.current.city = "";
      slots.current.cityKnown = false;
      await advance();
    } else if (chip.type === "restart") {
      pushUser("Opnieuw zoeken");
      await greet();
    }
    setBusy(false);
    inputRef.current?.focus();
  }

  return (
    <>
      {/* Paneel */}
      {open && (
        <div
          role="dialog"
          aria-label="Chat met Snuf Snuf"
          className="ss-pop fixed z-[60] flex flex-col overflow-hidden shadow-2xl
                     left-3 right-3 bottom-[5.5rem]
                     sm:left-auto sm:right-6 sm:bottom-24 sm:w-[380px]"
          style={{ background: CHAT_BG, borderRadius: "1.6rem", maxHeight: "min(72vh, 620px)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ background: GREEN }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/icon-green.svg" alt="" className="size-9 rounded-[0.55rem] bg-white/90 p-1" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-[0.9rem] font-semibold leading-tight">Snuf Snuf</p>
              <p className="text-[0.72rem] leading-tight flex items-center gap-1.5" style={{ color: "#AFE7CD" }}>
                <span className="size-1.5 rounded-full bg-emerald-400 inline-block" />
                online · reageert meteen
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Chat sluiten"
              className="text-white/70 hover:text-white transition-colors text-xl leading-none px-1"
            >
              ✕
            </button>
          </div>

          {/* Berichten */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-2" style={{ scrollBehavior: "smooth" }}>
            {messages.map((m) =>
              m.role === "user" ? (
                <Bubble key={m.id} side="user">
                  {m.text}
                </Bubble>
              ) : (
                <div key={m.id} className="flex flex-col gap-2">
                  <Bubble side="bot">{m.text}</Bubble>
                  {m.results && m.results.length > 0 && (
                    <div className="flex flex-col gap-2 pr-6">
                      {m.results.map((r) => (
                        <ResultCard key={r.slug} r={r} />
                      ))}
                    </div>
                  )}
                  {m.chips && m.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pr-6">
                      {m.chips.map((c, i) =>
                        c.type === "link" ? (
                          <Link
                            key={i}
                            href={c.href}
                            onClick={() => setOpen(false)}
                            className="rounded-full px-3 py-1.5 text-[0.8rem] font-medium border transition-colors hover:bg-white"
                            style={{ borderColor: "#cdd7cf", color: GREEN, background: "#fff" }}
                          >
                            {c.label}
                          </Link>
                        ) : (
                          <button
                            key={i}
                            onClick={() => handleChip(c)}
                            disabled={busy}
                            className="rounded-full px-3 py-1.5 text-[0.8rem] font-medium border transition-colors disabled:opacity-50 hover:-translate-y-px"
                            style={{ borderColor: "#bfe6d3", color: GREEN, background: "#fff" }}
                          >
                            {c.label}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>
              ),
            )}

            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-3.5 py-3 bg-white shadow-sm flex items-center gap-1" style={{ borderTopLeftRadius: 4 }}>
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="size-1.5 rounded-full"
                      style={{ background: GREEN, animation: "ss-blink 1.2s infinite", animationDelay: `${d * 0.18}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Invoerbalk */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleText(input);
            }}
            className="flex items-center gap-2 px-3 py-2.5 shrink-0"
            style={{ background: CHAT_BG }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Typ een bericht…"
              aria-label="Jouw bericht"
              className="flex-1 h-10 rounded-full px-4 text-[0.9rem] outline-none"
              style={{ background: "#fff", color: GREEN }}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Verstuur"
              className="size-10 rounded-full flex items-center justify-center text-white transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0"
              style={{ background: GREEN }}
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Aandachts-pill */}
      {!open && nudge && (
        <button
          onClick={openChat}
          className="ss-pop fixed z-[59] right-[5.5rem] bottom-8 max-w-[220px] text-left rounded-2xl px-3.5 py-2.5 shadow-lg text-[0.85rem] leading-snug hidden sm:block"
          style={{ background: "#fff", color: GREEN, borderTopRightRadius: 6 }}
        >
          Zoek je dierenzorg? Chat met me 🐾
        </button>
      )}

      {/* Launcher */}
      <button
        onClick={() => (open ? setOpen(false) : openChat())}
        aria-label={open ? "Chat sluiten" : "Open de chat"}
        className="fixed z-[60] right-5 bottom-6 size-14 rounded-full flex items-center justify-center shadow-xl transition-transform hover:-translate-y-0.5 active:scale-95"
        style={{ background: GREEN }}
      >
        {open ? (
          <span className="text-white text-2xl leading-none">✕</span>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-4 3.5V16H6.5A2.5 2.5 0 0 1 4 13.5v-8Z"
              fill="#D6FDEC"
            />
            <circle cx="9" cy="9.5" r="1.3" fill={GREEN} />
            <circle cx="13" cy="9.5" r="1.3" fill={GREEN} />
            <path d="M9 12.4c.9.8 4.1.8 5 0" stroke={GREEN} strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </>
  );
}

/* ── Subcomponenten ────────────────────────────────────────────────────────── */

function Bubble({ side, children }: { side: "user" | "bot"; children: React.ReactNode }) {
  const isUser = side === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="ss-pop max-w-[85%] rounded-2xl px-3.5 py-2 text-[0.9rem] leading-snug shadow-sm"
        style={{
          background: isUser ? MINT : "#ffffff",
          color: "#15271E",
          borderTopRightRadius: isUser ? 4 : undefined,
          borderTopLeftRadius: isUser ? undefined : 4,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ResultCard({ r }: { r: ChatResult }) {
  return (
    <Link
      href={`/aanbieder/${r.slug}`}
      className="ss-pop flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5 shadow-sm transition-transform hover:-translate-y-px"
      style={{ borderColor: "#E4E2DB" }}
    >
      {r.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.logoUrl} alt="" className="size-11 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="size-11 rounded-lg shrink-0 flex items-center justify-center text-lg" style={{ background: MINT }}>
          🐾
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[0.85rem] truncate" style={{ color: GREEN }}>
          {r.name}
        </p>
        <p className="text-[0.72rem] truncate" style={{ color: "#6f7a71" }}>
          {r.categoryLabel} · {r.city} · ★ {r.rating.toFixed(1)}
        </p>
        <p className="text-[0.72rem] font-semibold mt-0.5" style={{ color: TERRA }}>
          {r.priceLabel}
        </p>
      </div>
      <span className="text-[0.72rem] font-medium px-2.5 py-1 rounded-lg shrink-0" style={{ background: MINT, color: GREEN }}>
        Bekijk
      </span>
    </Link>
  );
}
