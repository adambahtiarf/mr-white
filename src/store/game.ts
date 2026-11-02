"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  assignRoles,
  checkWinner,
  drawWords,
  isCorrectGuess,
  mrWhiteRange,
  resizeNames,
  speakingOrder,
  undercoverRange,
  type Player,
  type SetupConfig,
  type Winner,
} from "@/lib/game";

export type Phase = "reveal" | "clues" | "discuss" | "vote" | "eliminated" | "mrWhiteGuess" | "result";

export interface GameState {
  players: Player[];
  topicLabel: string;
  civilianWord: string;
  undercoverWord: string;
  phase: Phase;
  revealIndex: number;
  round: number;
  order: string[];
  clueIndex: number;
  eliminatedId: string | null;
  mrWhiteGuess: string | null;
  winner: Winner | null;
  timerEndsAt: number | null;
  timerPausedMs: number | null;
}

interface Store {
  setup: SetupConfig;
  game: GameState | null;
  updateSetup: (patch: Partial<SetupConfig>) => void;
  startGame: () => void;
  nextReveal: () => void;
  nextClue: () => void;
  startDiscussion: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  addTime: (ms: number) => void;
  goToVote: () => void;
  eliminate: (id: string) => void;
  afterElimination: () => void;
  submitGuess: (guess: string) => void;
  quitGame: () => void;
}

const DEFAULT_SETUP: SetupConfig = {
  playerCount: 5,
  undercoverCount: 1,
  mrWhiteCount: 1,
  topics: [],
  names: resizeNames([], 5),
  timerSeconds: 120,
};

function clampSetup(s: SetupConfig): SetupConfig {
  const [, uMax] = undercoverRange(s.playerCount);
  const undercoverCount = Math.min(s.undercoverCount, uMax);
  const [mMin, mMax] = mrWhiteRange(s.playerCount, undercoverCount);
  const mrWhiteCount = Math.min(Math.max(s.mrWhiteCount, mMin), mMax);
  return { ...s, undercoverCount, mrWhiteCount, names: resizeNames(s.names, s.playerCount) };
}

function newClueRound(game: GameState): GameState {
  return {
    ...game,
    phase: "clues",
    round: game.round + 1,
    order: speakingOrder(game.players),
    clueIndex: 0,
    eliminatedId: null,
    timerEndsAt: null,
    timerPausedMs: null,
  };
}

function resolveRound(game: GameState): GameState {
  const winner = checkWinner(game.players);
  if (winner) return { ...game, winner, phase: "result" };
  return newClueRound(game);
}

export const useGameStore = create<Store>()(
  persist(
    (set, get) => {
      const patchGame = (fn: (g: GameState) => GameState) => {
        const g = get().game;
        if (g) set({ game: fn(g) });
      };

      return {
        setup: DEFAULT_SETUP,
        game: null,

        updateSetup: (patch) => set({ setup: clampSetup({ ...get().setup, ...patch }) }),

        startGame: () => {
          const setup = get().setup;
          const words = drawWords(setup.topics);
          set({
            game: {
              players: assignRoles(setup, words),
              topicLabel: words.topic.label,
              civilianWord: words.civilianWord,
              undercoverWord: words.undercoverWord,
              phase: "reveal",
              revealIndex: 0,
              round: 0,
              order: [],
              clueIndex: 0,
              eliminatedId: null,
              mrWhiteGuess: null,
              winner: null,
              timerEndsAt: null,
              timerPausedMs: null,
            },
          });
        },

        nextReveal: () =>
          patchGame((g) => {
            const revealIndex = g.revealIndex + 1;
            return revealIndex >= g.players.length ? newClueRound({ ...g, revealIndex }) : { ...g, revealIndex };
          }),

        nextClue: () => patchGame((g) => ({ ...g, clueIndex: Math.min(g.clueIndex + 1, g.order.length) })),

        startDiscussion: () => {
          const secs = get().setup.timerSeconds;
          patchGame((g) => ({
            ...g,
            phase: "discuss",
            timerEndsAt: secs > 0 ? Date.now() + secs * 1000 : null,
            timerPausedMs: null,
          }));
        },

        pauseTimer: () =>
          patchGame((g) =>
            g.timerEndsAt
              ? { ...g, timerPausedMs: Math.max(0, g.timerEndsAt - Date.now()), timerEndsAt: null }
              : g,
          ),

        resumeTimer: () =>
          patchGame((g) =>
            g.timerPausedMs !== null ? { ...g, timerEndsAt: Date.now() + g.timerPausedMs, timerPausedMs: null } : g,
          ),

        addTime: (ms) =>
          patchGame((g) => {
            if (g.timerPausedMs !== null) return { ...g, timerPausedMs: g.timerPausedMs + ms };
            const base = Math.max(Date.now(), g.timerEndsAt ?? Date.now());
            return { ...g, timerEndsAt: base + ms };
          }),

        goToVote: () => patchGame((g) => ({ ...g, phase: "vote", timerEndsAt: null, timerPausedMs: null })),

        eliminate: (id) =>
          patchGame((g) => ({
            ...g,
            phase: "eliminated",
            eliminatedId: id,
            players: g.players.map((p) => (p.id === id ? { ...p, alive: false } : p)),
          })),

        afterElimination: () =>
          patchGame((g) => {
            const out = g.players.find((p) => p.id === g.eliminatedId);
            if (out?.role === "mrwhite") return { ...g, phase: "mrWhiteGuess" };
            return resolveRound(g);
          }),

        submitGuess: (guess) =>
          patchGame((g) => {
            const next = { ...g, mrWhiteGuess: guess.trim() };
            if (isCorrectGuess(guess, g.civilianWord)) return { ...next, winner: "mrwhite", phase: "result" };
            return resolveRound(next);
          }),

        quitGame: () => set({ game: null }),
      };
    },
    { name: "mr-white-game", version: 1 },
  ),
);
