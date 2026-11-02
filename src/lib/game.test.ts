import { describe, expect, it } from "vitest";
import {
  assignRoles,
  checkWinner,
  isCorrectGuess,
  isRoleSetupValid,
  mrWhiteRange,
  nameErrors,
  speakingOrder,
  undercoverRange,
  type Player,
  type SetupConfig,
} from "./game";

const p = (id: string, role: Player["role"], alive = true): Player => ({
  id,
  name: id,
  role,
  word: null,
  alive,
});

describe("role setup", () => {
  it("limits infiltrators to fewer than civilians", () => {
    expect(undercoverRange(3)).toEqual([0, 1]);
    expect(undercoverRange(6)).toEqual([0, 2]);
    expect(undercoverRange(7)).toEqual([0, 3]);
  });

  it("requires at least one Mr White when there is no undercover", () => {
    expect(mrWhiteRange(5, 0)).toEqual([1, 2]);
    expect(mrWhiteRange(5, 1)).toEqual([0, 1]);
    expect(mrWhiteRange(5, 2)).toEqual([0, 0]);
  });

  it("validates role counts", () => {
    expect(isRoleSetupValid({ playerCount: 3, undercoverCount: 1, mrWhiteCount: 0 })).toBe(true);
    expect(isRoleSetupValid({ playerCount: 4, undercoverCount: 1, mrWhiteCount: 1 })).toBe(false);
    expect(isRoleSetupValid({ playerCount: 5, undercoverCount: 0, mrWhiteCount: 0 })).toBe(false);
    expect(isRoleSetupValid({ playerCount: 2, undercoverCount: 0, mrWhiteCount: 1 })).toBe(false);
  });
});

describe("assignRoles", () => {
  const config: SetupConfig = {
    playerCount: 7,
    undercoverCount: 2,
    mrWhiteCount: 1,
    topics: ["food"],
    names: ["A", "B", "C", "D", "E", "F", "G"],
    timerSeconds: 60,
  };

  it("assigns the configured number of each role and correct words", () => {
    const players = assignRoles(config, { civilianWord: "Pizza", undercoverWord: "Burger" });
    expect(players).toHaveLength(7);
    expect(players.filter((x) => x.role === "undercover")).toHaveLength(2);
    expect(players.filter((x) => x.role === "mrwhite")).toHaveLength(1);
    for (const x of players) {
      if (x.role === "civilian") expect(x.word).toBe("Pizza");
      if (x.role === "undercover") expect(x.word).toBe("Burger");
      if (x.role === "mrwhite") expect(x.word).toBeNull();
    }
  });
});

describe("speakingOrder", () => {
  it("never puts Mr White first and only includes alive players", () => {
    const players = [p("a", "mrwhite"), p("b", "civilian"), p("c", "civilian", false), p("d", "undercover")];
    for (let i = 0; i < 200; i++) {
      const order = speakingOrder(players);
      expect(order[0]).not.toBe("a");
      expect(order).toHaveLength(3);
      expect(order).not.toContain("c");
    }
  });
});

describe("checkWinner", () => {
  it("civilians win when all infiltrators are out", () => {
    expect(checkWinner([p("a", "civilian"), p("b", "civilian"), p("c", "undercover", false)])).toBe("civilians");
  });
  it("infiltrators win at parity", () => {
    expect(checkWinner([p("a", "civilian"), p("b", "mrwhite"), p("c", "civilian", false)])).toBe("infiltrators");
  });
  it("game continues otherwise", () => {
    expect(checkWinner([p("a", "civilian"), p("b", "civilian"), p("c", "undercover")])).toBeNull();
  });
});

describe("isCorrectGuess", () => {
  it("ignores case, spaces, punctuation and accents", () => {
    expect(isCorrectGuess("  ice-cream ", "Ice Cream")).toBe(true);
    expect(isCorrectGuess("Café", "cafe")).toBe(true);
    expect(isCorrectGuess("burger", "Pizza")).toBe(false);
    expect(isCorrectGuess("", "Pizza")).toBe(false);
  });
});

describe("nameErrors", () => {
  it("flags blank and duplicate names", () => {
    expect(nameErrors(["Adam", " adam", "", "Bo"])).toEqual(["Duplicate name", "Duplicate name", "Name required", null]);
  });
});
