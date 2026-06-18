"use client"

import { cn } from "@/lib/utils"
import {
  resolveTeamLabel,
  toUtcIso,
  formatMatchDate,
  getFeedsInto,
} from "./lib"
import type { BracketMatch, BracketRound } from "./types"
import { useState, useRef } from "react"

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT = 88 // px per R32 match slot
const R32_COUNT = 8
const TOTAL_H = R32_COUNT * SLOT // 704px total bracket height

// Returns absolute top + height for a match in its column
function slotPos(index: number, round: number) {
  const slotsPerMatch = Math.pow(2, round) // 1, 2, 4, 8
  return {
    top: index * slotsPerMatch * SLOT,
    height: slotsPerMatch * SLOT,
  }
}

// ─── Match card (compact, for desktop tree) ───────────────────────────────────

function TreeCard({ match }: { match: BracketMatch }) {
  const utcDate = toUtcIso(match.date, match.time)
  const dateStr = formatMatchDate(utcDate)
  const isSpecial =
    match.round === "Final" || match.round === "Match for third place"

  return (
    <div
      className={cn(
        "w-[118px] rounded border bg-card p-1.5 text-[9px] leading-tight shadow-sm",
        isSpecial && "border-yellow-500/60 bg-yellow-500/5"
      )}
    >
      <div className="mb-0.5 truncate font-mono text-muted-foreground">
        {isSpecial
          ? match.round === "Final"
            ? "Final"
            : "3er puesto"
          : `P${match.num}`}{" "}
        · {dateStr}
      </div>
      <div className="truncate font-medium">
        {resolveTeamLabel(match.team1)}
      </div>
      <div className="mt-0.5 truncate border-t border-dashed pt-0.5 font-medium">
        {resolveTeamLabel(match.team2)}
      </div>
    </div>
  )
}

// ─── Bracket column ───────────────────────────────────────────────────────────

function BracketCol({
  matches,
  round,
}: {
  matches: BracketMatch[]
  round: number
}) {
  return (
    <div className="relative shrink-0" style={{ width: 118, height: TOTAL_H }}>
      {matches.map((m, i) => {
        const { top, height } = slotPos(i, round)
        return (
          <div
            key={m.num}
            className="absolute flex items-center"
            style={{ top, height, left: 0, right: 0 }}
          >
            <TreeCard match={m} />
          </div>
        )
      })}
    </div>
  )
}

// ─── Connector between two adjacent columns ────────────────────────────────────
// `leftCount` = matches in left column, `leftRound` = that column's round level.
// Setting `mirrored=true` flips the connector for the right side of the bracket.

function Connector({
  leftCount,
  leftRound,
  mirrored = false,
}: {
  leftCount: number
  leftRound: number
  mirrored?: boolean
}) {
  const pairs = leftCount / 2

  return (
    <div className="relative shrink-0" style={{ width: 20, height: TOTAL_H }}>
      {Array.from({ length: pairs }).map((_, i) => {
        const slotsPerLeft = Math.pow(2, leftRound)
        const topSlot = i * 2 * slotsPerLeft
        const botSlot = topSlot + slotsPerLeft
        const y1 = topSlot * SLOT + (slotsPerLeft * SLOT) / 2
        const y2 = botSlot * SLOT + (slotsPerLeft * SLOT) / 2
        const mid = (y1 + y2) / 2
        const x1 = mirrored ? 20 : 0
        const x2 = mirrored ? 10 : 10
        const x3 = mirrored ? 0 : 20

        return (
          <svg
            key={i}
            className="pointer-events-none absolute top-0 left-0 overflow-visible"
            width={20}
            height={TOTAL_H}
            style={{ top: 0 }}
          >
            {/* top arm */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y1}
              className="stroke-border"
              strokeWidth="1"
            />
            {/* vertical */}
            <line
              x1={x2}
              y1={y1}
              x2={x2}
              y2={y2}
              className="stroke-border"
              strokeWidth="1"
            />
            {/* bottom arm */}
            <line
              x1={x1}
              y1={y2}
              x2={x2}
              y2={y2}
              className="stroke-border"
              strokeWidth="1"
            />
            {/* center line to next column */}
            <line
              x1={x2}
              y1={mid}
              x2={x3}
              y2={mid}
              className="stroke-border"
              strokeWidth="1"
            />
          </svg>
        )
      })}
    </div>
  )
}

// ─── Center column (Final + 3rd place) ────────────────────────────────────────

function CenterCol({ centerRound }: { centerRound: BracketRound }) {
  const final = centerRound.matches.find((m) => m.round === "Final")
  const third = centerRound.matches.find(
    (m) => m.round === "Match for third place"
  )
  const sfCenter = TOTAL_H / 2 // center of the full bracket

  return (
    <div className="relative shrink-0" style={{ width: 130, height: TOTAL_H }}>
      {/* Horizontal line from left SF connector to Final card */}
      <svg
        className="pointer-events-none absolute top-0 left-0"
        width={130}
        height={TOTAL_H}
      >
        <line
          x1={0}
          y1={sfCenter}
          x2={6}
          y2={sfCenter}
          className="stroke-border"
          strokeWidth="1"
        />
        <line
          x1={124}
          y1={sfCenter}
          x2={130}
          y2={sfCenter}
          className="stroke-border"
          strokeWidth="1"
        />
      </svg>

      {/* Final */}
      {final && (
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: sfCenter - 28 }}
        >
          <TreeCard match={final} />
        </div>
      )}

      {/* 3rd place */}
      {third && (
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: sfCenter + 44 }}
        >
          <div className="mb-0.5 text-center text-[8px] text-muted-foreground">
            3er puesto
          </div>
          <TreeCard match={third} />
        </div>
      )}
    </div>
  )
}

// ─── Desktop horizontal bracket ───────────────────────────────────────────────

const ROUND_LABELS_LEFT = ["Dieciseisavos", "Octavos", "Cuartos", "Semifinal"]
const ROUND_LABELS_RIGHT = ["Semifinal", "Cuartos", "Octavos", "Dieciseisavos"]

function DesktopBracket({ rounds }: { rounds: BracketRound[] }) {
  const leftRounds = rounds.filter((r) => r.side === "left")
  // Right side rendered from center → edge (SF first, R32 last)
  const rightRounds = rounds.filter((r) => r.side === "right")
  const centerRound = rounds.find((r) => r.side === "center")

  if (!centerRound) return null

  return (
    <div className="overflow-x-auto pb-4">
      {/* Column labels */}
      <div className="mb-2 flex text-[9px] font-medium text-muted-foreground">
        {leftRounds.map((_, i) => (
          <div
            key={`ll-${i}`}
            className="shrink-0 text-center"
            style={{ width: i < leftRounds.length - 1 ? 118 + 20 : 118 }}
          >
            {ROUND_LABELS_LEFT[i]}
          </div>
        ))}
        <div className="shrink-0 text-center" style={{ width: 20 + 130 + 20 }}>
          Final
        </div>
        {rightRounds.map((_, i) => (
          <div
            key={`rl-${i}`}
            className="shrink-0 text-center"
            style={{ width: i > 0 ? 118 + 20 : 118 }}
          >
            {ROUND_LABELS_RIGHT[i]}
          </div>
        ))}
      </div>

      {/* Bracket row */}
      <div className="flex">
        {/* Left side: R32 → SF */}
        {leftRounds.map((round, i) => (
          <div key={`left-${i}`} className="flex">
            <BracketCol matches={round.matches} round={i} />
            {i < leftRounds.length - 1 && (
              <Connector leftCount={round.matches.length} leftRound={i} />
            )}
          </div>
        ))}

        {/* Left SF → center gap */}
        <div
          className="relative shrink-0"
          style={{ width: 20, height: TOTAL_H }}
        >
          <svg
            className="pointer-events-none absolute top-0 left-0"
            width={20}
            height={TOTAL_H}
          >
            <line
              x1={0}
              y1={TOTAL_H / 2}
              x2={20}
              y2={TOTAL_H / 2}
              className="stroke-border"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Center */}
        <CenterCol centerRound={centerRound} />

        {/* Right SF → center gap */}
        <div
          className="relative shrink-0"
          style={{ width: 20, height: TOTAL_H }}
        >
          <svg
            className="pointer-events-none absolute top-0 left-0"
            width={20}
            height={TOTAL_H}
          >
            <line
              x1={0}
              y1={TOTAL_H / 2}
              x2={20}
              y2={TOTAL_H / 2}
              className="stroke-border"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Right side: SF → R32 (center to edge) */}
        {rightRounds.map((round, i) => {
          const colRound = rightRounds.length - 1 - i // SF=3, QF=2, R16=1, R32=0
          return (
            <div key={`right-${i}`} className="flex">
              {/* Connector BEFORE this column (between previous and current) */}
              {i > 0 && (
                <Connector
                  leftCount={rightRounds[i].matches.length}
                  leftRound={colRound}
                  mirrored={true}
                />
              )}
              <BracketCol matches={round.matches} round={colRound} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Mobile swipeable carousel ────────────────────────────────────────────────

const SLIDE_LABELS = [
  "16avos Izq.",
  "8vos Izq.",
  "Cuartos Izq.",
  "Semi Izq.",
  "Final",
  "Semi Der.",
  "Cuartos Der.",
  "8vos Der.",
  "16avos Der.",
]

function MobileMatchCard({ match }: { match: BracketMatch }) {
  const utcDate = toUtcIso(match.date, match.time)
  const dateStr = formatMatchDate(utcDate)
  const feedsInto = getFeedsInto(match.num)
  const isSpecial =
    match.round === "Final" || match.round === "Match for third place"

  return (
    <div
      className={cn(
        "rounded-lg border bg-card px-3 py-2",
        isSpecial && "border-yellow-500/50 bg-yellow-500/5"
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground">
          {isSpecial ? match.round : `Partido ${match.num}`}
        </span>
        <span className="text-[10px] text-muted-foreground">{dateStr}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="flex-1 truncate font-medium">
          {resolveTeamLabel(match.team1)}
        </span>
        <span className="shrink-0 text-[10px] text-muted-foreground">vs</span>
        <span className="flex-1 truncate text-right font-medium">
          {resolveTeamLabel(match.team2)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="truncate text-[10px] text-muted-foreground">
          {match.ground}
        </span>
        {feedsInto && (
          <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
            → P{feedsInto}
          </span>
        )}
      </div>
    </div>
  )
}

function MobileBracket({ rounds }: { rounds: BracketRound[] }) {
  const [active, setActive] = useState(4) // default to Final
  const pillsRef = useRef<HTMLDivElement>(null)
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([])

  function goTo(i: number) {
    const clamped = Math.max(0, Math.min(rounds.length - 1, i))
    setActive(clamped)

    // Center the active pill in the scroll container
    const container = pillsRef.current
    const pill = pillRefs.current[clamped]
    if (container && pill) {
      const containerCenter = container.offsetWidth / 2
      const pillCenter = pill.offsetLeft + pill.offsetWidth / 2
      container.scrollTo({
        left: pillCenter - containerCenter,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="space-y-3">
      {/* Round pills */}
      <div
        ref={pillsRef}
        className="flex gap-2 overflow-x-auto scroll-smooth py-1"
      >
        {rounds.map((_, i) => (
          <button
            key={i}
            ref={(el) => {
              pillRefs.current[i] = el
            }}
            onClick={() => goTo(i)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
              active === i
                ? "border-primary bg-primary text-primary-foreground"
                : "border-transparent bg-muted text-muted-foreground"
            )}
          >
            {SLIDE_LABELS[i]}
          </button>
        ))}
      </div>

      {/* Active slide */}
      {rounds.map((round, i) => (
        <div key={i} className={active === i ? "block" : "hidden"}>
          <h3 className="mb-3 text-sm font-semibold">
            {round.name}
            {round.side !== "center" && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                — {round.side === "left" ? "izquierda" : "derecha"}
              </span>
            )}
          </h3>
          <div className="space-y-2">
            {round.matches.map((m) => (
              <MobileMatchCard key={m.num} match={m} />
            ))}
          </div>
        </div>
      ))}

      {/* Navigation arrows */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => goTo(active - 1)}
          disabled={active === 0}
          className="flex items-center gap-1.5 rounded-lg border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-opacity disabled:opacity-30"
        >
          ← {active > 0 ? SLIDE_LABELS[active - 1] : ""}
        </button>
        <span className="text-[10px] text-muted-foreground">
          {active + 1} / {rounds.length}
        </span>
        <button
          onClick={() => goTo(active + 1)}
          disabled={active === rounds.length - 1}
          className="flex items-center gap-1.5 rounded-lg border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-opacity disabled:opacity-30"
        >
          {active < rounds.length - 1 ? SLIDE_LABELS[active + 1] : ""} →
        </button>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function KnockoutBracket({ rounds }: { rounds: BracketRound[] }) {
  return (
    <>
      <div className="hidden md:block">
        <DesktopBracket rounds={rounds} />
      </div>
      <div className="md:hidden">
        <MobileBracket rounds={rounds} />
      </div>
    </>
  )
}
