# AoE4 Dynamic Production & Timing Calculator

This is a responsive web application that acts as a comprehensive production and timing calculator for Age of Empires IV, providing detailed economic and military planning.

## Features
- **Live Patch Data:** Automatically fetches the latest patch data dynamically from [AoE4 World's API](https://data.aoe4world.com/). You do not need to manually update unit stats or costs when a new patch drops!
- **Shareable Builds:** Your current civilization, age, villager distribution, and technology choices are synchronized in the URL parameters. Copy the link and share your build order with others.
- **Dynamic Theming:** The application changes its entire color scheme dynamically based on the civilization you select, reflecting their in-game banner colors.
- **Ovoo Double Production:** Special support for the Mongols Ovoo mechanics, accurately calculating stone generation and unit double-production.

## Architecture
- **Framework:** Astro + React.
- **Styling:** Tailwind CSS v4 + CSS Variables for dynamic theming.
- **State Management:** Zustand, synchronized with URL `searchParams`.

## Updating Data Sources
Because the application fetches `units/all.json` and `technologies/all.json` live from `data.aoe4world.com` directly in the user's browser, **no manual intervention is needed for minor or major balance patches**. 

However, if a new civilization is added to the game or the AoE4 World API URL structure changes, you will need to:
1. Add the new civilization identifier and color theme to `src/constants/civs.ts`.
2. Push your changes to trigger a new build on your hosting platform.

## Development Setup
1. `npm install`
2. `npm run dev` (Starts local server on `localhost:4321`)
3. `npm run build` (Creates an optimized production build in `dist/`)
