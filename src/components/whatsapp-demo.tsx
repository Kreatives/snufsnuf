"use client";

import { useEffect, useRef, useState } from "react";

type Msg =
  | { from: "user" | "bot"; type: "text"; text: string }
  | { from: "bot"; type: "options" }
  | { from: "bot"; type: "pay" }
  | { from: "user"; type: "paid" }
  | { from: "bot"; type: "confirm" };

const SCRIPT: Msg[] = [
  { from: "user", type: "text", text: "Hoi! Ik zoek een trimsalon in Utrecht voor mijn cavapoo 🐶" },
  { from: "bot", type: "text", text: "Leuk! Wat is de maat van je cavapoo en wanneer komt het je uit?" },
  { from: "user", type: "text", text: "Middel, zo'n 8 kilo. Deze week als het kan" },
  { from: "bot", type: "text", text: "Top. Ik heb 3 plekken vrij deze week in Utrecht 👇" },
  { from: "bot", type: "options" },
  { from: "user", type: "text", text: "Doe Trimsalon Lola, donderdag 👍" },
  { from: "bot", type: "pay" },
  { from: "user", type: "paid" },
  { from: "bot", type: "confirm" },
];

const OPTIONS = [
  { name: "Trimsalon Lola", when: "do 14:00", price: "vanaf €40" },
  { name: "Puppy & Co", when: "vr 10:30", price: "vanaf €35" },
  { name: "De Vachtzaak", when: "za 09:00", price: "vanaf €45" },
];

function Bubble({ side, children }: { side: "user" | "bot"; children: React.ReactNode }) {
  const isUser = side === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="ss-pop max-w-[82%] rounded-2xl px-3.5 py-2 text-[0.9rem] leading-snug shadow-sm"
        style={{
          background: isUser ? "#D6FDEC" : "#ffffff",
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

export function WhatsappDemo() {
  const [count, setCount] = useState(1);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (count >= SCRIPT.length) {
      const t = setTimeout(() => setCount(1), 4200);
      return () => clearTimeout(t);
    }
    const next = SCRIPT[count];
    if (next.from === "bot") {
      setTyping(true);
      const t = setTimeout(() => {
        setTyping(false);
        setCount((c) => c + 1);
      }, 1200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount((c) => c + 1), 900);
    return () => clearTimeout(t);
  }, [count]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count, typing]);

  const shown = SCRIPT.slice(0, count);

  return (
    <div
      className="w-full max-w-[380px] mx-auto rounded-[2.2rem] p-2.5 shadow-xl"
      style={{ background: "#0e1512" }}
    >
      <div className="rounded-[1.8rem] overflow-hidden" style={{ background: "#ECE5DD" }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#1F3A2E" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/icon-green.svg" alt="" className="size-9 rounded-[0.55rem]" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-[0.9rem] font-semibold leading-tight">Snuf Snuf</p>
            <p className="text-[0.72rem] leading-tight" style={{ color: "#AFE7CD" }}>
              online · reageert meteen
            </p>
          </div>
          <span className="text-white/70 text-lg" aria-hidden>
            ⋮
          </span>
        </div>

        {/* Berichten */}
        <div
          ref={scrollRef}
          className="px-3 py-4 flex flex-col gap-2 h-[460px] overflow-hidden"
          style={{ scrollBehavior: "smooth" }}
        >
          {shown.map((m, i) => {
            if (m.type === "text") {
              return (
                <Bubble key={i} side={m.from}>
                  {m.text}
                </Bubble>
              );
            }
            if (m.type === "options") {
              return (
                <Bubble key={i} side="bot">
                  <div className="flex flex-col gap-2 -mx-0.5">
                    {OPTIONS.map((o) => (
                      <div
                        key={o.name}
                        className="rounded-xl border px-3 py-2 flex items-center justify-between gap-3"
                        style={{ borderColor: "#E4E2DB", background: "#FBFBF9" }}
                      >
                        <div>
                          <p className="font-semibold text-[0.85rem]" style={{ color: "#1F3A2E" }}>
                            {o.name}
                          </p>
                          <p className="text-[0.72rem]" style={{ color: "#6f7a71" }}>
                            {o.when} · {o.price}
                          </p>
                        </div>
                        <span
                          className="text-[0.72rem] font-medium px-2 py-1 rounded-lg"
                          style={{ background: "#D6FDEC", color: "#1F3A2E" }}
                        >
                          Kies
                        </span>
                      </div>
                    ))}
                  </div>
                </Bubble>
              );
            }
            if (m.type === "pay") {
              return (
                <Bubble key={i} side="bot">
                  <p className="mb-2">Geregeld! Reken even af, dan is de plek van jou 🔒</p>
                  <div
                    className="rounded-xl px-3 py-2.5 flex items-center justify-between"
                    style={{ background: "#C84E38" }}
                  >
                    <span className="text-white font-semibold text-[0.85rem]">Betaal €40,00</span>
                    <span className="text-white/90 text-[0.8rem]">iDEAL →</span>
                  </div>
                </Bubble>
              );
            }
            if (m.type === "paid") {
              return (
                <Bubble key={i} side="user">
                  <span className="inline-flex items-center gap-1.5">
                    Betaald <span style={{ color: "#1F3A2E" }}>✓✓</span>
                  </span>
                </Bubble>
              );
            }
            // confirm
            return (
              <Bubble key={i} side="bot">
                <p className="font-semibold mb-0.5" style={{ color: "#1F3A2E" }}>
                  ✅ Bevestigd
                </p>
                <p>Donderdag 14:00 bij Trimsalon Lola, Utrecht. Je krijgt een reminder. Tot dan! 🐶</p>
              </Bubble>
            );
          })}

          {typing && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-3.5 py-3 bg-white shadow-sm flex items-center gap-1">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="size-1.5 rounded-full"
                    style={{
                      background: "#1F3A2E",
                      animation: "ss-blink 1.2s infinite",
                      animationDelay: `${d * 0.18}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Invoerbalk (statisch) */}
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "#ECE5DD" }}>
          <div
            className="flex-1 h-9 rounded-full px-4 flex items-center text-[0.85rem]"
            style={{ background: "#fff", color: "#9aa39b" }}
          >
            Typ een bericht…
          </div>
          <div
            className="size-9 rounded-full flex items-center justify-center text-white"
            style={{ background: "#1F3A2E" }}
          >
            ➤
          </div>
        </div>
      </div>
    </div>
  );
}
