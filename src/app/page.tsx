"use client";

import Link from "next/link";
import { Ghost } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, Screen } from "@/components/ui";
import { useGameStore } from "@/store/game";
import { useHydrated } from "@/lib/useHydrated";

const RULES = [
  { title: "Roles", body: "Civilians share a secret word. The Undercover gets a similar one. Mr White gets no word at all — just a bluff to keep up." },
  { title: "Reveal", body: "Pass the phone around. Each player holds the big button to see their role and word, then hides it and hands it on." },
  { title: "Clues", body: "Go round the table. Each player says one short clue about their word. Mr White bluffs." },
  { title: "Vote", body: "Debate, accuse, then agree on one player to eliminate. Their role is revealed to the table." },
  { title: "Win", body: "Civilians win by voting out every infiltrator. Infiltrators win by reaching equal numbers. A caught Mr White gets one final guess at the Civilian word." },
];

export default function Home() {
  const router = useRouter();
  const hydrated = useHydrated();
  const hasGame = useGameStore((s) => !!s.game && s.game.phase !== "result");

  return (
    <Screen
      footer={
        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push("/setup/players")}>Get started</Button>
          {hydrated && hasGame && (
            <Link href="/game" className="text-center text-sm font-semibold text-white/70 underline-offset-4 hover:underline">
              Resume current game
            </Link>
          )}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-3 pt-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-950 shadow-lg shadow-violet-900/50">
          <Ghost className="h-11 w-11" />
        </div>
        <h1 className="text-5xl font-black tracking-tight">Mr White</h1>
        <p className="text-white/60">Five lines. One phone. No app, no signup.</p>
      </div>
      <ol className="mt-10 flex flex-col gap-3">
        {RULES.map((r, i) => (
          <li key={r.title} className="flex gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <span className="font-mono text-sm text-violet-300">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h2 className="font-bold">{r.title}</h2>
              <p className="text-sm text-white/60">{r.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Screen>
  );
}
