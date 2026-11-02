"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-white text-slate-950 hover:bg-slate-200 disabled:bg-white/20 disabled:text-white/40",
  secondary: "bg-white/10 text-white hover:bg-white/15 disabled:opacity-40",
  ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-40",
  danger: "bg-rose-500 text-white hover:bg-rose-400 disabled:opacity-40",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-6 text-base font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

export function Screen({ children, footer, header }: { children: ReactNode; footer?: ReactNode; header?: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(env(safe-area-inset-top),1rem)]">
      {header}
      <main className="flex flex-1 flex-col py-6">{children}</main>
      {footer && (
        <footer className="sticky bottom-0 -mx-5 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent px-5 pt-6 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
          {footer}
        </footer>
      )}
    </div>
  );
}

export function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-white/10"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
    >
      <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <button
        aria-label={`Decrease ${label}`}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl font-bold transition active:scale-95 disabled:opacity-30"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <div className="flex flex-col items-center">
        <span className="text-7xl font-black tabular-nums" aria-live="polite">
          {value}
        </span>
        <span className="text-sm text-white/50">{label}</span>
      </div>
      <button
        aria-label={`Increase ${label}`}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl font-bold transition active:scale-95 disabled:opacity-30"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}
