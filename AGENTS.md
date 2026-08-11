# AGENTS.md

## Project

AoE4 Calculator: production/timing calculator for Age of Empires IV (Astro + React + Zustand + Tailwind v4). Unit/tech data is fetched **live** from `https://data.aoe4world.com` in the browser — never hardcode game stats.

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build (must pass before finishing)
- `npm test` — vitest suite (must pass before finishing)

## Architecture

- `src/data/api.ts` — types + fetchers (`UnitData`, `TechData`)
- `src/hooks/useAoE4Data.ts` — fetch units + technologies on mount
- `src/store/useCalculatorStore.ts` — Zustand state, synced with URL searchParams
- `src/utils/calculator.ts` — all math (gather rates, drain, required villagers)
- `src/utils/calculator.*.test.ts` — vitest tests, one file per civ mechanics (e.g. `calculator.mongols.test.ts`)
- `src/components/` — UI (selectors, dashboard), styled with Tailwind + `--civ-*` CSS vars
- `src/constants/civs.ts` — civ registry (id, slug, theme colors); slug matches aoe4world flag assets

## Conventions

- **New civs:** add to `src/constants/civs.ts` (use the API's civ id). Units/techs work automatically via live data; only civ-specific *mechanics* need code.
- **Civ-specific mechanics** follow existing patterns in `calculator.ts`:
  - gather bonuses in `getEffectiveRates()` + `calculateRPM()` (see `en` farms, `od` 1.28x)
  - passive generation in `calculateRPM()` + `calculateRequiredVillagers()` (see `mo`/`gol` Ovoo)
  - state + `setX` action in the store, URL param in `Calculator.tsx` + `loadFromUrl`
  - UI block in the matching selector component, gated by `civ === '...'` (see Ovoo block in `PassiveGenerationSelector.tsx`)
- **Keep it simple:** prefer the smallest change that matches an existing pattern. No new libs, no abstraction layers, no premature generalization.
- **Game accuracy matters:** verify values/mechanics against the real game or the aoe4world API before hardcoding numbers. Use named constants for balance values.
- **Tests:** every new civ mechanic gets a `calculator.<civ>.test.ts` mirroring `calculator.mongols.test.ts`, including a regression case asserting other civs are unaffected.
- UI text is English; component/type names are English.
