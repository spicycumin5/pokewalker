# PokéWalker

A phone take on the HeartGold/SoulSilver Pokéwalker: walk to earn watts, spend
them to search, and the wild Pokémon you meet depend on the real terrain around
you (OpenStreetMap). Catch them in a Pokéwalker-style minigame and build a team
of six. Personal hobby project. Pokémon data and sprites come from PokéAPI, so
it can't be published.

## Run it

```bash
npm install
npx expo start        # scan the QR code with Expo Go on your phone
```

- **Steps:** on iOS, steps walked while the app is closed are counted on next
  open (Core Motion, last 7 days). On Android, only steps walked while the app is
  open count, until Health Connect is added (needs a development build).
- **Testing without walking:** use the TOOLS screen. It has +100W and preset
  locations (lake, beach, cemetery…), and PEEK shows the detected biome and
  today's local species.
- **Browser preview** (`npx expo start --web`): there is no step sensor, and
  terrain lookups usually fall back to "Town" because browsers can't send the
  User-Agent that Overpass requires.

## How it works

| Piece | File |
| --- | --- |
| Steps → watts (20 steps = 1W, daily cap) | `src/game/watts.ts`, `src/services/pedometer.ts` |
| Location → biome (Overpass, cached per ~150 m geohash for 7 days) | `src/services/terrain.ts`, `src/game/classify-biome.ts` |
| Biome → type weights, OSM tag mapping | `src/data/biomes.ts` |
| Encounter roll (same spot + same day = same locals) | `src/game/encounter.ts` |
| Attack / Evade / Catch minigame (pure reducer) | `src/game/battle.ts` |
| Saved state: watts, team of 6, box, dex | `src/store/use-game.ts` |
| LCD shell, 3-button device | `src/ui/` |

## Commands

```bash
npm test                 # jest: game logic
npx tsc --noEmit         # typecheck
npm run build:pokedex    # re-fetch PokéAPI data + regenerate LCD sprites
```
