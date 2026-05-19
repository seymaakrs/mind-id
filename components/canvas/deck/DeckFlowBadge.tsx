"use client"

/** Komut akışı düğümünde adım rozeti */
export function DeckFlowBadge({ step }: { step: number }) {
  return (
    <span className="absolute -top-2 -left-2 flex h-6 min-w-6 items-center justify-center rounded border border-amber-400/60 bg-[#1a1408] px-1 text-xs font-bold text-amber-300">
      {step}
    </span>
  )
}
