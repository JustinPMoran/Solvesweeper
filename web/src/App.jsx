import { useCallback, useEffect, useMemo, useState } from 'react';
import { UNKNOWN, MINE, DEFAULTS, LIMITS, seedBoard } from './constants.js';
import { solveBoard } from './solver.js';
import Toolbar from './components/Toolbar.jsx';
import TilePalette from './components/TilePalette.jsx';
import Board from './components/Board.jsx';
import Readout from './components/Readout.jsx';

const clamp = (v, [lo, hi]) => Math.max(lo, Math.min(hi, v));

function normalize(settings) {
  const rows = clamp(Number(settings.rows) || 1, LIMITS.rows);
  const cols = clamp(Number(settings.cols) || 1, LIMITS.cols);
  const mines = clamp(Number(settings.mines) || 0, [0, rows * cols - 1]);
  return { rows, cols, mines };
}

export default function App() {
  const [settings, setSettings] = useState({ ...DEFAULTS });
  const [preset, setPreset] = useState(`${DEFAULTS.rows},${DEFAULTS.cols},${DEFAULTS.mines}`);
  const [board, setBoard] = useState(() => ({
    rows: DEFAULTS.rows,
    cols: DEFAULTS.cols,
    mines: DEFAULTS.mines,
    grid: seedBoard(DEFAULTS.rows, DEFAULTS.cols),
  }));
  const [tool, setTool] = useState(1);
  // Solved once on load so the app opens in a working state, then on demand.
  const [result, setResult] = useState(() => {
    const start = { rows: DEFAULTS.rows, cols: DEFAULTS.cols, mines: DEFAULTS.mines, grid: seedBoard(DEFAULTS.rows, DEFAULTS.cols) };
    return solveBoard(start);
  });

  const solve = useCallback(() => {
    const { rows, cols, mines } = normalize(settings);
    setSettings({ rows, cols, mines });
    setResult(solveBoard({ ...board, mines }));
    setBoard((b) => ({ ...b, mines }));
  }, [board, settings]);

  const paint = useCallback((i, button) => {
    setBoard((b) => {
      const grid = b.grid.slice();
      grid[i] = button === 2 ? (grid[i] === MINE ? UNKNOWN : MINE) : tool;
      if (grid[i] === b.grid[i]) return b;
      return { ...b, grid };
    });
    setResult(null);
  }, [tool]);

  const createGrid = useCallback((seed = false) => {
    const { rows, cols, mines } = normalize(settings);
    setSettings({ rows, cols, mines });
    setBoard({ rows, cols, mines, grid: seed ? seedBoard(rows, cols) : new Array(rows * cols).fill(UNKNOWN) });
    setResult(null);
  }, [settings]);

  const reset = useCallback(() => {
    setSettings({ ...DEFAULTS });
    setPreset(`${DEFAULTS.rows},${DEFAULTS.cols},${DEFAULTS.mines}`);
    const start = { ...DEFAULTS, grid: seedBoard(DEFAULTS.rows, DEFAULTS.cols) };
    setBoard(start);
    setResult(solveBoard(start));
  }, []);

  const applyPreset = useCallback((id) => {
    setPreset(id);
    if (id === 'custom') return;
    const [rows, cols, mines] = id.split(',').map(Number);
    setSettings({ rows, cols, mines });
    setBoard({ rows, cols, mines, grid: new Array(rows * cols).fill(UNKNOWN) });
    setResult(null);
  }, []);

  const changeSetting = useCallback((key, value) => {
    setPreset('custom');
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);
      if (e.key === 'Enter') { e.preventDefault(); solve(); return; }
      if (typing) return;
      if (e.key >= '0' && e.key <= '8') setTool(Number(e.key));
      else if (e.key === 'u' || e.key === 'U') setTool(UNKNOWN);
      else if (e.key === 'm' || e.key === 'M') setTool(MINE);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [solve]);

  const minesShown = useMemo(() => normalize(settings).mines, [settings]);

  return (
    <div className="wrap">
      <header className="masthead">
        <h1>Isosweeper</h1>
        <p>Paint the board you&apos;re stuck on, then get the exact mine probability for every covered square.</p>
      </header>

      <Toolbar
        settings={settings}
        preset={preset}
        onSettings={changeSetting}
        onPreset={applyPreset}
        onCreate={() => createGrid(false)}
        onReset={reset}
      />

      <TilePalette tool={tool} onTool={setTool} />

      <div className="stage">
        <section className="panel board-card">
          <Board grid={board.grid} rows={board.rows} cols={board.cols} result={result} onPaint={paint} />
          <button className="btn-solve" onClick={solve}>
            Find Safe Moves <span className="kbd">ENTER</span>
          </button>
        </section>

        <Readout grid={board.grid} cols={board.cols} mines={minesShown} result={result} />
      </div>

      <footer>
        Probabilities are exact, not heuristic: covered squares touching a number are split into independent
        components, every valid mine arrangement in each is enumerated under constraint pruning, and the components
        are recombined against the remaining mine count — so a square shown at <code>0%</code> is safe in every
        arrangement your board admits, and an amber square is a mine in more of them than any other.
      </footer>
    </div>
  );
}
