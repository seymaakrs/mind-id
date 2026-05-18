"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { MindIDCanvas } from "@/components/mind-id-canvas/MindIDCanvas"
import { Button } from "@/components/ui/button"

const NAV_TABS = [
  { n: 1, label: "AGENTS", active: true },
  { n: 2, label: "DECK" },
  { n: 3, label: "ACTIVITY" },
  { n: 4, label: "CODE INTEL" },
  { n: 5, label: "MONITOR" },
] as const

export default function KomutaMerkeziV2Page() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-black">
        <nav className="flex shrink-0 items-center gap-4 bg-[#5c1018] px-3 py-1.5 font-mono text-[11px]">
          {NAV_TABS.map((tab) => (
            <span
              key={tab.n}
              className={
                tab.active
                  ? "text-amber-300"
                  : "cursor-default text-amber-100/50 hover:text-amber-200/80"
              }
            >
              [{tab.n}] {tab.label}
            </span>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 font-mono text-[10px] text-amber-100/80 hover:bg-white/10"
            >
              <Link href="/canvas.html" target="_blank">
                canvas.html
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 font-mono text-[10px] text-amber-100/80 hover:bg-white/10"
            >
              <Link href="/">
                <ArrowLeft className="mr-1 h-3 w-3" />
                Panel
              </Link>
            </Button>
          </div>
        </nav>
        <main className="min-h-0 flex-1 overflow-hidden">
          <MindIDCanvas />
        </main>
      </div>
    </ProtectedRoute>
  )
}
