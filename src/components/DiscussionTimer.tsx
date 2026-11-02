"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Plus } from "lucide-react";

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.25, 0.5].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.2);
    });
  } catch {}
}

function format(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function DiscussionTimer({
  endsAt,
  pausedMs,
  totalMs,
  onPause,
  onResume,
  onAdd,
}: {
  endsAt: number | null;
  pausedMs: number | null;
  totalMs: number;
  onPause: () => void;
  onResume: () => void;
  onAdd: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const alerted = useRef(false);

  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endsAt]);

  const remaining = pausedMs ?? (endsAt ? Math.max(0, endsAt - now) : 0);
  const done = remaining <= 0;

  useEffect(() => {
    if (done && !alerted.current) {
      alerted.current = true;
      navigator.vibrate?.([300, 100, 300]);
      beep();
    }
    if (!done) alerted.current = false;
  }, [done]);

  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, remaining / Math.max(totalMs, remaining, 1));

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative h-64 w-64">
        <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90">
          <circle cx="120" cy="120" r={radius} className="fill-none stroke-white/10" strokeWidth="14" />
          <circle
            cx="120"
            cy="120"
            r={radius}
            className={`fill-none transition-[stroke-dashoffset] duration-300 ${done ? "stroke-rose-500" : remaining < 15000 ? "stroke-amber-400" : "stroke-white"}`}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-6xl font-black tabular-nums ${done ? "text-rose-400" : ""}`}>{format(remaining)}</span>
          <span className="text-sm text-white/50">{done ? "Time's up!" : pausedMs !== null ? "Paused" : "Discuss"}</span>
        </div>
      </div>
      <div className="flex gap-3">
        {!done &&
          (pausedMs !== null ? (
            <button onClick={onResume} className="flex h-12 items-center gap-2 rounded-full bg-white/10 px-5 font-semibold">
              <Play className="h-4 w-4" /> Resume
            </button>
          ) : (
            <button onClick={onPause} className="flex h-12 items-center gap-2 rounded-full bg-white/10 px-5 font-semibold">
              <Pause className="h-4 w-4" /> Pause
            </button>
          ))}
        <button onClick={onAdd} className="flex h-12 items-center gap-2 rounded-full bg-white/10 px-5 font-semibold">
          <Plus className="h-4 w-4" /> 30s
        </button>
      </div>
    </div>
  );
}
