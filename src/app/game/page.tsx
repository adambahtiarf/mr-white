"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Ghost, Mic, PartyPopper, RotateCcw, Skull, Smartphone, Trophy, Users, VenetianMask, X } from "lucide-react";
import { Button, Screen } from "@/components/ui";
import { HoldToReveal } from "@/components/HoldToReveal";
import { DiscussionTimer } from "@/components/DiscussionTimer";
import { RoleBadge } from "@/components/RoleBadge";
import { ROLE_LABEL, type Player } from "@/lib/game";
import { useHydrated } from "@/lib/useHydrated";
import { useGameStore, type GameState } from "@/store/game";

export default function GamePage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const game = useGameStore((s) => s.game);
  const quitGame = useGameStore((s) => s.quitGame);

  useEffect(() => {
    if (hydrated && !game) router.replace("/");
  }, [hydrated, game, router]);

  if (!hydrated || !game) return null;

  const alive = game.players.filter((p) => p.alive);
  const header =
    game.phase === "result" ? null : (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Users className="h-4 w-4" />
          {alive.length} alive
          {game.round > 0 && <span className="text-white/30">· Round {game.round}</span>}
        </div>
        <button
          onClick={() => {
            if (confirm("Quit this game? Progress will be lost.")) {
              quitGame();
              router.replace("/");
            }
          }}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-white/60 hover:bg-white/10"
        >
          <X className="h-4 w-4" /> Quit
        </button>
      </div>
    );

  switch (game.phase) {
    case "reveal":
      return <RevealPhase key={game.revealIndex} game={game} header={header} />;
    case "clues":
      return <CluesPhase game={game} header={header} />;
    case "discuss":
      return <DiscussPhase game={game} header={header} />;
    case "vote":
      return <VotePhase game={game} header={header} />;
    case "eliminated":
      return <EliminatedPhase game={game} header={header} />;
    case "mrWhiteGuess":
      return <MrWhiteGuessPhase game={game} header={header} />;
    case "result":
      return <ResultPhase game={game} />;
  }
}

type PhaseProps = { game: GameState; header: React.ReactNode };

function PhaseTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-white/60">{subtitle}</p>}
    </div>
  );
}

function RevealPhase({ game, header }: PhaseProps) {
  const nextReveal = useGameStore((s) => s.nextReveal);
  const player = game.players[game.revealIndex];
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState(false);
  const last = game.revealIndex === game.players.length - 1;

  if (!ready) {
    return (
      <Screen header={header} footer={<Button onClick={() => setReady(true)}>I&apos;m {player.name}</Button>}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
            <Smartphone className="h-12 w-12" />
          </div>
          <PhaseTitle
            eyebrow={`Card ${game.revealIndex + 1} of ${game.players.length}`}
            title={`Pass the phone to ${player.name}`}
            subtitle="Only they should look at the screen."
          />
        </div>
      </Screen>
    );
  }

  return (
    <Screen
      header={header}
      footer={
        <Button onClick={nextReveal} disabled={!seen}>
          <EyeOff className="h-5 w-5" />
          {last ? "Hide & start the game" : "Hide & pass the phone"}
        </Button>
      }
    >
      <div className="flex flex-1 flex-col gap-6">
        <PhaseTitle eyebrow={player.name} title="Your secret card" subtitle="Hold the card. Let go to hide it." />
        <HoldToReveal player={player} onRevealed={() => setSeen(true)} />
      </div>
    </Screen>
  );
}

function CluesPhase({ game, header }: PhaseProps) {
  const nextClue = useGameStore((s) => s.nextClue);
  const startDiscussion = useGameStore((s) => s.startDiscussion);
  const byId = new Map(game.players.map((p) => [p.id, p]));
  const done = game.clueIndex >= game.order.length;
  const current = byId.get(game.order[game.clueIndex]);

  return (
    <Screen
      header={header}
      footer={
        done ? (
          <Button onClick={startDiscussion}>Start discussion</Button>
        ) : (
          <Button onClick={nextClue}>{current?.name} gave a clue</Button>
        )
      }
    >
      <PhaseTitle
        eyebrow={`Round ${game.round} · Clues`}
        title={done ? "All clues are in" : `${current?.name}'s turn`}
        subtitle={done ? "Time to debate who's lying." : "Say one short clue about your word. No saying the word!"}
      />
      <ol className="mt-8 flex flex-col gap-2">
        {game.order.map((id, i) => {
          const p = byId.get(id)!;
          const state = i < game.clueIndex ? "done" : i === game.clueIndex ? "current" : "todo";
          return (
            <li
              key={id}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 transition ${
                state === "current"
                  ? "bg-white text-slate-950 ring-white"
                  : state === "done"
                    ? "bg-white/5 text-white/40 ring-white/5"
                    : "bg-white/5 ring-white/10"
              }`}
            >
              <span className="w-6 font-mono text-sm opacity-60">{i + 1}</span>
              <span className="flex-1 font-semibold">{p.name}</span>
              {state === "current" && <Mic className="h-5 w-5" />}
              {state === "done" && <span className="text-xs">✓</span>}
            </li>
          );
        })}
      </ol>
    </Screen>
  );
}

function DiscussPhase({ game, header }: PhaseProps) {
  const timerSeconds = useGameStore((s) => s.setup.timerSeconds);
  const { pauseTimer, resumeTimer, addTime, goToVote } = useGameStore.getState();
  const hasTimer = game.timerEndsAt !== null || game.timerPausedMs !== null;

  return (
    <Screen header={header} footer={<Button onClick={goToVote}>Go to vote</Button>}>
      <PhaseTitle eyebrow={`Round ${game.round} · Discussion`} title="Debate & accuse" subtitle="Who gave a suspicious clue?" />
      <div className="flex flex-1 items-center justify-center py-8">
        {hasTimer ? (
          <DiscussionTimer
            endsAt={game.timerEndsAt}
            pausedMs={game.timerPausedMs}
            totalMs={timerSeconds * 1000}
            onPause={pauseTimer}
            onResume={resumeTimer}
            onAdd={() => addTime(30000)}
          />
        ) : (
          <p className="text-center text-white/50">No timer — vote when you&apos;re ready.</p>
        )}
      </div>
    </Screen>
  );
}

function VotePhase({ game, header }: PhaseProps) {
  const eliminate = useGameStore((s) => s.eliminate);
  const [selected, setSelected] = useState<string | null>(null);
  const target = game.players.find((p) => p.id === selected);

  return (
    <Screen
      header={header}
      footer={
        <Button variant="danger" disabled={!target} onClick={() => target && eliminate(target.id)}>
          <Skull className="h-5 w-5" />
          {target ? `Eliminate ${target.name}` : "Select a player"}
        </Button>
      }
    >
      <PhaseTitle eyebrow={`Round ${game.round} · Vote`} title="Who's out?" subtitle="Agree on one player to eliminate." />
      <div className="mt-8 grid grid-cols-2 gap-3">
        {game.players.map((p) => (
          <button
            key={p.id}
            disabled={!p.alive}
            onClick={() => setSelected(p.id)}
            aria-pressed={selected === p.id}
            className={`flex h-20 flex-col items-center justify-center rounded-2xl px-2 font-semibold ring-1 transition active:scale-95 ${
              !p.alive
                ? "bg-transparent text-white/25 ring-white/5"
                : selected === p.id
                  ? "bg-rose-500 text-white ring-rose-300"
                  : "bg-white/5 ring-white/15"
            }`}
          >
            <span className={`max-w-full truncate ${p.alive ? "" : "line-through"}`}>{p.name}</span>
            {!p.alive && <span className="text-xs">{ROLE_LABEL[p.role]}</span>}
          </button>
        ))}
      </div>
    </Screen>
  );
}

function EliminatedPhase({ game, header }: PhaseProps) {
  const afterElimination = useGameStore((s) => s.afterElimination);
  const out = game.players.find((p) => p.id === game.eliminatedId)!;
  const isMrWhite = out.role === "mrwhite";

  return (
    <Screen
      header={header}
      footer={<Button onClick={afterElimination}>{isMrWhite ? "Mr White's final guess" : "Continue"}</Button>}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-300">Eliminated</p>
        <h1 className="text-5xl font-black">{out.name}</h1>
        <p className="text-white/60">was…</p>
        <RoleBadge role={out.role} size="lg" />
        {out.word && (
          <p className="text-white/60">
            Their word: <span className="font-bold text-white">{out.word}</span>
          </p>
        )}
        {isMrWhite && <p className="text-white/60">Caught! But Mr White gets one last chance to steal the round.</p>}
      </div>
    </Screen>
  );
}

function MrWhiteGuessPhase({ game, header }: PhaseProps) {
  const submitGuess = useGameStore((s) => s.submitGuess);
  const [guess, setGuess] = useState("");
  const out = game.players.find((p) => p.id === game.eliminatedId)!;

  return (
    <Screen
      header={header}
      footer={
        <Button disabled={!guess.trim()} onClick={() => submitGuess(guess)}>
          Lock in guess
        </Button>
      }
    >
      <PhaseTitle
        eyebrow="Final guess"
        title={`${out.name}, what's the word?`}
        subtitle="Guess the Civilians' word. Get it right and Mr White steals the win."
      />
      <form
        className="mt-10"
        onSubmit={(e) => {
          e.preventDefault();
          if (guess.trim()) submitGuess(guess);
        }}
      >
        <input
          autoFocus
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Type your guess"
          autoComplete="off"
          autoCapitalize="off"
          className="h-16 w-full rounded-2xl bg-white/5 px-5 text-center text-2xl font-bold ring-1 ring-white/15 outline-none focus:ring-white/50"
          aria-label="Mr White's guess"
        />
      </form>
    </Screen>
  );
}

const WIN_COPY = {
  civilians: { Icon: PartyPopper, title: "Civilians win!", subtitle: "Every infiltrator was voted out." },
  infiltrators: { Icon: VenetianMask, title: "Infiltrators win!", subtitle: "They reached equal numbers with the Civilians." },
  mrwhite: { Icon: Ghost, title: "Mr White steals it!", subtitle: "The final guess was spot on." },
} as const;

function ResultPhase({ game }: { game: GameState }) {
  const router = useRouter();
  const startGame = useGameStore((s) => s.startGame);
  const quitGame = useGameStore((s) => s.quitGame);
  const copy = WIN_COPY[game.winner ?? "civilians"];
  const isWinner = (p: Player) =>
    game.winner === "civilians" ? p.role === "civilian" : game.winner === "mrwhite" ? p.role === "mrwhite" : p.role !== "civilian";

  return (
    <Screen
      footer={
        <div className="flex flex-col gap-3">
          <Button onClick={startGame}>
            <RotateCcw className="h-5 w-5" /> Play again
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              quitGame();
              router.push("/setup/players");
            }}
          >
            New setup
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-2 pt-4 text-center">
        <copy.Icon className="h-16 w-16 text-violet-300" />
        <h1 className="text-4xl font-black">{copy.title}</h1>
        <p className="text-white/60">{copy.subtitle}</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-2xl bg-sky-500/10 p-4 ring-1 ring-sky-400/30">
          <p className="text-xs text-sky-300">Civilian word</p>
          <p className="text-xl font-bold">{game.civilianWord}</p>
        </div>
        <div className="rounded-2xl bg-amber-500/10 p-4 ring-1 ring-amber-400/30">
          <p className="text-xs text-amber-300">Undercover word</p>
          <p className="text-xl font-bold">{game.undercoverWord}</p>
        </div>
      </div>
      {game.mrWhiteGuess && (
        <p className="mt-3 text-center text-sm text-white/50">
          Mr White guessed <span className="font-semibold text-white">&ldquo;{game.mrWhiteGuess}&rdquo;</span>
        </p>
      )}
      <ul className="mt-6 flex flex-col gap-2">
        {game.players.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
            <span className={`flex-1 font-semibold ${p.alive ? "" : "text-white/40 line-through"}`}>{p.name}</span>
            {isWinner(p) && <Trophy aria-label="Winner" className="h-4 w-4 text-amber-300" />}
            <RoleBadge role={p.role} />
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center text-xs text-white/40">Topic: {game.topicLabel}</p>
    </Screen>
  );
}
