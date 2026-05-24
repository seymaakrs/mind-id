"use client"

import { cn } from "@/lib/utils"

interface PixelGhostProps {
  color: string
  size?: "lg" | "md" | "sm"
  className?: string
}

const SIZES = {
  lg: { w: 72, h: 82 },
  md: { w: 58, h: 66 },
  sm: { w: 44, h: 50 },
}

/** 8-bit Pac-Man tarzı hayalet (referans görsel) */
export function PixelGhost({ color, size = "md", className }: PixelGhostProps) {
  const dim = SIZES[size]

  return (
    <svg
      width={dim.w}
      height={dim.h}
      viewBox="0 0 11 13"
      className={cn("shrink-0", className)}
      style={{ imageRendering: "pixelated" }}
      aria-hidden
    >
      {/* gövde */}
      <rect x="2" y="0" width="7" height="1" fill={color} />
      <rect x="1" y="1" width="9" height="1" fill={color} />
      <rect x="0" y="2" width="11" height="5" fill={color} />
      <rect x="0" y="7" width="11" height="2" fill={color} />
      {/* dalgalı alt */}
      <rect x="0" y="9" width="2" height="2" fill={color} />
      <rect x="3" y="9" width="2" height="2" fill={color} />
      <rect x="6" y="9" width="2" height="2" fill={color} />
      <rect x="9" y="9" width="2" height="2" fill={color} />
      <rect x="1" y="11" width="2" height="2" fill={color} />
      <rect x="4" y="11" width="2" height="2" fill={color} />
      <rect x="7" y="11" width="2" height="2" fill={color} />
      {/* gözler */}
      <rect x="3" y="4" width="1.5" height="2" fill="#0a0a0f" />
      <rect x="7" y="4" width="1.5" height="2" fill="#0a0a0f" />
    </svg>
  )
}
