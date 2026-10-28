"use client";

import { useState } from "react";

export function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard niet beschikbaar */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="group w-full text-left rounded-xl border px-4 py-3 flex items-center justify-between gap-3 transition-colors"
      style={{ borderColor: "#E7E6E0", background: "#fff" }}
    >
      <span className="text-[0.95rem]" style={{ color: "#15271E" }}>
        &ldquo;{text}&rdquo;
      </span>
      <span
        className="shrink-0 text-[0.8rem] font-medium px-2.5 py-1 rounded-lg"
        style={{ background: copied ? "#D6FDEC" : "#F1F0EB", color: "#1F3A2E" }}
      >
        {copied ? "Gekopieerd" : "Kopieer"}
      </span>
    </button>
  );
}
