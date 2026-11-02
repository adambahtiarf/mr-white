"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Timer } from "lucide-react";
import { Button, ProgressBar, Screen, Stepper } from "@/components/ui";
import { ROLE_ICON, TOPIC_ICONS } from "@/components/icons";
import {
  MAX_NAME_LENGTH,
  MAX_PLAYERS,
  MIN_PLAYERS,
  isRoleSetupValid,
  mrWhiteRange,
  nameErrors,
  undercoverRange,
} from "@/lib/game";
import { TOPICS } from "@/lib/words";
import { useHydrated } from "@/lib/useHydrated";
import { useGameStore } from "@/store/game";

const STEPS = ["players", "undercover", "mrwhite", "topics", "names", "timer"] as const;
type Step = (typeof STEPS)[number];

const TIMER_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "30 sec", value: 30 },
  { label: "1 min", value: 60 },
  { label: "2 min", value: 120 },
  { label: "3 min", value: 180 },
  { label: "5 min", value: 300 },
];

export default function SetupStepPage() {
  const { step } = useParams<{ step: string }>();
  const router = useRouter();
  const hydrated = useHydrated();
  const setup = useGameStore((s) => s.setup);
  const updateSetup = useGameStore((s) => s.updateSetup);
  const startGame = useGameStore((s) => s.startGame);

  const index = STEPS.indexOf(step as Step);
  if (index === -1) notFound();
  if (!hydrated) return null;

  const civilians = setup.playerCount - setup.undercoverCount - setup.mrWhiteCount;
  const errors = nameErrors(setup.names);

  const valid: Record<Step, boolean> = {
    players: setup.playerCount >= MIN_PLAYERS && setup.playerCount <= MAX_PLAYERS,
    undercover: true,
    mrwhite: isRoleSetupValid(setup),
    topics: setup.topics.length > 0,
    names: errors.every((e) => e === null),
    timer: true,
  };

  const back = () => router.push(index === 0 ? "/" : `/setup/${STEPS[index - 1]}`);
  const next = () => {
    if (index === STEPS.length - 1) {
      startGame();
      router.push("/game");
    } else {
      router.push(`/setup/${STEPS[index + 1]}`);
    }
  };

  const roleSummary = (
    <div className="mt-8 grid grid-cols-3 gap-2 text-center text-sm">
      {[
        { label: "Civilians", value: civilians, Icon: ROLE_ICON.civilian },
        { label: "Undercover", value: setup.undercoverCount, Icon: ROLE_ICON.undercover },
        { label: "Mr White", value: setup.mrWhiteCount, Icon: ROLE_ICON.mrwhite },
      ].map((r) => (
        <div key={r.label} className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <r.Icon className="mx-auto h-5 w-5 text-white/70" />
          <div className="text-2xl font-bold tabular-nums">{r.value}</div>
          <div className="text-white/50">{r.label}</div>
        </div>
      ))}
    </div>
  );

  let title = "";
  let subtitle = "";
  let body: React.ReactNode = null;

  switch (step as Step) {
    case "players":
      title = "How many players?";
      subtitle = `Between ${MIN_PLAYERS} and ${MAX_PLAYERS} people sharing one phone.`;
      body = (
        <Stepper
          label="players"
          value={setup.playerCount}
          min={MIN_PLAYERS}
          max={MAX_PLAYERS}
          onChange={(playerCount) => updateSetup({ playerCount })}
        />
      );
      break;
    case "undercover": {
      const [min, max] = undercoverRange(setup.playerCount);
      title = "How many Undercovers?";
      subtitle = "Undercovers get a word that's similar — but not the same — as the Civilians.";
      body = (
        <>
          <Stepper
            label="undercover"
            value={setup.undercoverCount}
            min={min}
            max={max}
            onChange={(undercoverCount) => updateSetup({ undercoverCount })}
          />
          {roleSummary}
        </>
      );
      break;
    }
    case "mrwhite": {
      const [min, max] = mrWhiteRange(setup.playerCount, setup.undercoverCount);
      title = "How many Mr Whites?";
      subtitle = "Mr White gets no word at all — just a bluff to keep up.";
      body = (
        <>
          <Stepper
            label="Mr White"
            value={setup.mrWhiteCount}
            min={min}
            max={max}
            onChange={(mrWhiteCount) => updateSetup({ mrWhiteCount })}
          />
          {roleSummary}
          <p className="mt-4 text-center text-xs text-white/40">
            You need at least one infiltrator, and fewer infiltrators than Civilians.
          </p>
        </>
      );
      break;
    }
    case "topics": {
      const allSelected = setup.topics.length === TOPICS.length;
      title = "Pick your topics";
      subtitle = "Words are drawn from the topics you choose. Pick as many as you like.";
      body = (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => {
              const selected = setup.topics.includes(t.id);
              const Icon = TOPIC_ICONS[t.id];
              return (
                <button
                  key={t.id}
                  aria-pressed={selected}
                  onClick={() =>
                    updateSetup({
                      topics: selected ? setup.topics.filter((id) => id !== t.id) : [...setup.topics, t.id],
                    })
                  }
                  className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ring-1 transition active:scale-95 ${
                    selected ? "bg-white text-slate-950 ring-white" : "bg-white/5 text-white ring-white/15"
                  }`}
                >
                  {Icon && <Icon aria-hidden className="h-4 w-4" />}
                  {t.label}
                  {selected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => updateSetup({ topics: allSelected ? [] : TOPICS.map((t) => t.id) })}
            className="self-start text-sm font-semibold text-violet-300"
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        </div>
      );
      break;
    }
    case "names":
      title = "Who's playing?";
      subtitle = "Enter everyone's name. The order here is the order the phone gets passed.";
      body = (
        <div className="flex flex-col gap-3">
          {setup.names.map((name, i) => (
            <div key={i}>
              <label className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 ring-1 ring-white/10 focus-within:ring-white/40">
                <span className="w-6 font-mono text-sm text-white/40">{i + 1}</span>
                <input
                  value={name}
                  maxLength={MAX_NAME_LENGTH}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => {
                    const names = [...setup.names];
                    names[i] = e.target.value;
                    updateSetup({ names });
                  }}
                  className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-white/30"
                  placeholder={`Player ${i + 1}`}
                  aria-label={`Player ${i + 1} name`}
                  aria-invalid={!!errors[i]}
                />
              </label>
              {errors[i] && <p className="mt-1 px-2 text-xs text-rose-400">{errors[i]}</p>}
            </div>
          ))}
        </div>
      );
      break;
    case "timer":
      title = "Discussion timer";
      subtitle = "How long should the table debate before voting each round?";
      body = (
        <div className="grid grid-cols-2 gap-3">
          {TIMER_OPTIONS.map((o) => {
            const selected = setup.timerSeconds === o.value;
            return (
              <button
                key={o.value}
                aria-pressed={selected}
                onClick={() => updateSetup({ timerSeconds: o.value })}
                className={`flex h-20 flex-col items-center justify-center rounded-2xl text-lg font-bold ring-1 transition active:scale-95 ${
                  selected ? "bg-white text-slate-950 ring-white" : "bg-white/5 ring-white/15"
                }`}
              >
                {o.value > 0 && <Timer className="mb-1 h-4 w-4 opacity-60" />}
                {o.label}
              </button>
            );
          })}
        </div>
      );
      break;
  }

  return (
    <Screen
      header={
        <div className="flex items-center gap-3">
          <button onClick={back} aria-label="Back" className="-ml-2 rounded-full p-2 text-white/70 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <ProgressBar value={index + 1} total={STEPS.length} />
          <span className="w-10 text-right font-mono text-xs text-white/50">
            {index + 1}/{STEPS.length}
          </span>
        </div>
      }
      footer={
        <Button onClick={next} disabled={!valid[step as Step]}>
          {index === STEPS.length - 1 ? "Start game" : "Continue"}
        </Button>
      }
    >
      <h1 className="text-3xl font-black tracking-tight">{title}</h1>
      <p className="mt-2 text-white/60">{subtitle}</p>
      <div className="mt-10 flex-1">{body}</div>
    </Screen>
  );
}
