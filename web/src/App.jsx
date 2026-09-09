import { useCallback, useEffect, useMemo, useState } from 'react';
import { UNKNOWN, MINE, DEFAULTS, LIMITS, PRESETS, emptyBoard } from './constants.js';
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
  // The app opens on a blank board, ready to be painted.
  const [board, setBoard] = useState(() => ({ ...DEFAULTS, grid: emptyBoard(DEFAULTS.rows, DEFAULTS.cols) }));
  const [tool, setTool] = useState(UNKNOWN);
  const [result, setResult] = useState(null);

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

  const createGrid = useCallback(() => {
    const { rows, cols, mines } = normalize(settings);
    setSettings({ rows, cols, mines });
    setBoard({ rows, cols, mines, grid: emptyBoard(rows, cols) });
    setResult(null);
  }, [settings]);

  // Clears the board without touching its size or mine count — those only
  // change through Create Grid or a preset.
  const reset = useCallback(() => {
    const { rows, cols, mines } = board;
    setBoard((b) => ({ ...b, grid: emptyBoard(b.rows, b.cols) }));
    setSettings({ rows, cols, mines });
    const id = `${rows},${cols},${mines}`;
    setPreset(PRESETS.some((p) => p.id === id) ? id : 'custom');
    setTool(UNKNOWN);
    setResult(null);
  }, [board]);

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
        onCreate={createGrid}
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
