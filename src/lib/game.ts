import { TOPICS, type Topic } from "./words";

export type Role = "civilian" | "undercover" | "mrwhite";
export type Winner = "civilians" | "infiltrators" | "mrwhite";

export interface Player {
  id: string;
  name: string;
  role: Role;
  word: string | null;
  alive: boolean;
}

export interface SetupConfig {
  playerCount: number;
  undercoverCount: number;
  mrWhiteCount: number;
  topics: string[];
  names: string[];
  timerSeconds: number;
}

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 20;
export const MAX_NAME_LENGTH = 16;

export const ROLE_LABEL: Record<Role, string> = {
  civilian: "Civilian",
  undercover: "Undercover",
  mrwhite: "Mr White",
};

/** Infiltrators must always be fewer than civilians at the start. */
export function maxInfiltrators(playerCount: number): number {
  return Math.floor((playerCount - 1) / 2);
}

export function undercoverRange(playerCount: number): [number, number] {
  return [0, maxInfiltrators(playerCount)];
}

export function mrWhiteRange(playerCount: number, undercoverCount: number): [number, number] {
  const max = Math.max(0, maxInfiltrators(playerCount) - undercoverCount);
  const min = undercoverCount === 0 ? 1 : 0;
  return [Math.min(min, max), max];
}

export function isRoleSetupValid(c: Pick<SetupConfig, "playerCount" | "undercoverCount" | "mrWhiteCount">): boolean {
  const infiltrators = c.undercoverCount + c.mrWhiteCount;
  const civilians = c.playerCount - infiltrators;
  return (
    c.playerCount >= MIN_PLAYERS &&
    c.playerCount <= MAX_PLAYERS &&
    c.undercoverCount >= 0 &&
    c.mrWhiteCount >= 0 &&
    infiltrators >= 1 &&
    civilians > infiltrators
  );
}

export function defaultName(index: number): string {
  return `Player ${index + 1}`;
}

export function resizeNames(names: string[], count: number): string[] {
  return Array.from({ length: count }, (_, i) => names[i] ?? defaultName(i));
}

export function nameErrors(names: string[]): (string | null)[] {
  const seen = new Map<string, number>();
  names.forEach((n) => {
    const key = n.trim().toLowerCase();
    seen.set(key, (seen.get(key) ?? 0) + 1);
  });
  return names.map((n) => {
    const trimmed = n.trim();
    if (!trimmed) return "Name required";
    if (trimmed.length > MAX_NAME_LENGTH) return `Max ${MAX_NAME_LENGTH} characters`;
    if ((seen.get(trimmed.toLowerCase()) ?? 0) > 1) return "Duplicate name";
    return null;
  });
}

export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface WordDraw {
  topic: Topic;
  civilianWord: string;
  undercoverWord: string;
}

export function drawWords(topicIds: string[], rand: () => number = Math.random): WordDraw {
  const pool = TOPICS.filter((t) => topicIds.includes(t.id));
  const topics = pool.length ? pool : TOPICS;
  const topic = topics[Math.floor(rand() * topics.length)];
  const pair = topic.pairs[Math.floor(rand() * topic.pairs.length)];
  const flip = rand() < 0.5;
  return {
    topic,
    civilianWord: flip ? pair[1] : pair[0],
    undercoverWord: flip ? pair[0] : pair[1],
  };
}

export function assignRoles(
  config: SetupConfig,
  words: { civilianWord: string; undercoverWord: string },
  rand: () => number = Math.random,
): Player[] {
  const roles: Role[] = [
    ...Array<Role>(config.undercoverCount).fill("undercover"),
    ...Array<Role>(config.mrWhiteCount).fill("mrwhite"),
  ];
  while (roles.length < config.playerCount) roles.push("civilian");
  const shuffled = shuffle(roles, rand);
  return resizeNames(config.names, config.playerCount).map((name, i) => {
    const role = shuffled[i];
    return {
      id: `p${i}`,
      name: name.trim(),
      role,
      word: role === "civilian" ? words.civilianWord : role === "undercover" ? words.undercoverWord : null,
      alive: true,
    };
  });
}

/** Random speaking order of alive players; Mr White never speaks first. */
export function speakingOrder(players: Player[], rand: () => number = Math.random): string[] {
  const order = shuffle(
    players.filter((p) => p.alive),
    rand,
  );
  if (order.length > 1 && order[0].role === "mrwhite") {
    const swapIdx = order.findIndex((p) => p.role !== "mrwhite");
    if (swapIdx > 0) [order[0], order[swapIdx]] = [order[swapIdx], order[0]];
  }
  return order.map((p) => p.id);
}

export function checkWinner(players: Player[]): Winner | null {
  const alive = players.filter((p) => p.alive);
  const civilians = alive.filter((p) => p.role === "civilian").length;
  const infiltrators = alive.length - civilians;
  if (infiltrators === 0) return "civilians";
  if (infiltrators >= civilians) return "infiltrators";
  return null;
}

export function normalizeWord(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function isCorrectGuess(guess: string, word: string): boolean {
  const g = normalizeWord(guess);
  return g.length > 0 && g === normalizeWord(word);
}
