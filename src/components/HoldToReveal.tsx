"use client";

import { useState } from "react";
import { Eye, Fingerprint } from "lucide-react";
import type { Player } from "@/lib/game";
import { RoleBadge } from "./RoleBadge";

export function HoldToReveal({ player, onRevealed }: { player: Player; onRevealed: () => void }) {
  const [holding, setHolding] = useState(false);

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setHolding(true);
    onRevealed();
  };
  const stop = () => setHolding(false);

  return (
    <button
      type="button"
      aria-label="Hold to reveal your card"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setHolding(true);
          onRevealed();
        }
      }}
      onKeyUp={stop}
      onBlur={stop}
      className="no-callout relative flex aspect-[3/4] w-full touch-none select-none flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 p-6 shadow-2xl shadow-violet-900/40 transition active:scale-[0.98]"
    >
      {holding ? (
        <div className="flex flex-col items-center gap-6 text-center">
          <RoleBadge role={player.role} size="lg" />
          {player.word ? (
            <>
              <span className="text-sm uppercase tracking-[0.3em] text-white/70">Your word</span>
              <span className="text-5xl font-black break-words">{player.word}</span>
            </>
          ) : (
            <>
              <span className="text-4xl font-black">No word!</span>
              <span className="text-white/80">You are Mr White. Listen carefully and bluff your way through.</span>
            </>
          )}
          {player.role === "undercover" && (
            <span className="text-sm text-white/70">Blend in — your word is slightly different.</span>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/15 ring-8 ring-white/10 animate-pulse">
            <Fingerprint className="h-14 w-14" />
          </div>
          <span className="text-2xl font-bold">Hold to reveal</span>
          <span className="flex items-center gap-2 text-sm text-white/70">
            <Eye className="h-4 w-4" /> Make sure nobody is looking
          </span>
        </div>
      )}
    </button>
  );
}
