# Mr White

The social deduction party game for friends — pass one phone around and let the bluffing begin. Mobile-first web app built with Next.js. No backend, no signup: game state lives in `localStorage`.

## How to play

1. **Roles** — Civilians share a word, the Undercover gets a similar one, Mr White gets no word.
2. **Reveal** — Pass the phone. Each player holds the big card to see their role and word, then hides it.
3. **Clues** — Each player says one short clue. Mr White never goes first.
4. **Vote** — Debate (optional timer), then eliminate one player. Their role is revealed.
5. **Win** — Civilians win when every infiltrator is out. Infiltrators win at parity with Civilians. A caught Mr White gets one guess at the Civilian word to steal the round.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # Vitest unit tests for game logic
npm run lint
npm run build
```

## Structure

- `src/app/page.tsx` — Get started / rules
- `src/app/setup/[step]/page.tsx` — onboarding wizard (players → undercover → Mr White → topics → names → timer)
- `src/app/game/page.tsx` — game phases: reveal → clues → discuss → vote → eliminated → Mr White guess → result
- `src/lib/game.ts` — pure game rules (role limits, assignment, speaking order, win check, guess matching)
- `src/lib/words.ts` — topics and word pairs
- `src/store/game.ts` — Zustand store persisted to `localStorage`
