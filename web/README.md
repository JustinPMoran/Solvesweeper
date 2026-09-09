# Isosweeper — web solver

React + Vite front end for the solver. Paint the board you're stuck on, hit **Find Safe Moves**, and every
covered square gets its exact mine probability.

```bash
cd web
npm install
npm run dev      # http://localhost:5173
npm run build    # -> web/dist/index.html (single self-contained file)
```

`npm run build` inlines the JS and CSS into one file. Copy it to the repo root to update the double-clickable
build:

```bash
cp dist/index.html ../index.html
```

## Layout

| Path | What it does |
| --- | --- |
| `src/solver.js` | The whole algorithm. Pure functions, no React — importable on its own. |
| `src/geometry.js` | Isometric layout maths: tile size, diamond points, board plate, view box. |
| `src/constants.js` | Tile codes, presets, digit colours, the seeded example board. |
| `src/components/Board.jsx` | The isometric SVG board, painting and right-click flagging. |
| `src/components/Readout.jsx` | Verdict, safe list, highest-mine-chance list, certain mines. |
| `src/components/Toolbar.jsx` | Preset, rows, cols, mines, Create Grid, Reset. |
| `src/components/TilePalette.jsx` | The tile picker. |

## Board colours

- **Green** — safe in every valid arrangement. Open it.
- **Amber** — the highest mine chance on the board (below 100%). These are the squares to leave alone.
- **Red** — a mine in every valid arrangement. Flag it.
- **Plain** — covered, with its mine probability printed on the tile.

The readout's "Best guess" line names the *lowest*-probability square, which is the one to click when nothing
is certain.

## Solver

Exact probabilities, not heuristics:

1. Each opened number becomes a constraint over its covered neighbours
   (`mines = number − adjacent flags`).
2. Union-find splits those covered squares into independent components.
3. Each component is enumerated exhaustively by backtracking, pruned on every assignment
   (partial sum ≤ need, and need − sum ≤ unassigned neighbours), bucketed by mines used.
4. Component distributions are convolved, and each total `k` is weighted by `C(free, minesLeft − k)` — the ways
   the remaining mines can sit on squares no number touches.
5. A square's probability is its weighted arrangement count over the total.

Contradictory boards (a number with too many flags, more flags than mines) are reported in plain language
instead of failing silently. Enumeration is capped at 4M arrangements per component; past that the app says so.

Defaults: 5 × 6 with 8 mines. Presets cover Beginner, Intermediate and Expert.
