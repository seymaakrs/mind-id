"use client"

import { useEffect, useRef } from "react"

interface TerminalPanelProps {
  lines: string[]
}

export function TerminalPanel({ lines }: TerminalPanelProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [lines])

  return (
    <div className="flex h-[160px] shrink-0 flex-col border-t border-green-500/25 bg-black font-mono">
      <div className="flex items-center gap-2 border-b border-green-500/15 px-3 py-1 text-[10px] text-green-500/70">
        <span>TERMINAL</span>
        <span className="text-white/30">canlı · Firestore & agent</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 text-[11px] leading-relaxed text-green-400">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap">
            <span className="text-green-600/80">{"> "}</span>
            {line}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  )
}
