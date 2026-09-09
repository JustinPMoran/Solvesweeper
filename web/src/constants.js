export const UNKNOWN = -1;
export const MINE = 9;

// Classic Minesweeper digit colours, as CSS custom properties so both themes work.
export const NUM_COLORS = [
  '',
  'var(--n1)', 'var(--n2)', 'var(--n3)', 'var(--n4)',
  'var(--n5)', 'var(--n6)', 'var(--n7)', 'var(--n8)',
];

export const PRESETS = [
  { id: '5,6,8', label: 'Pocket · 5×6 · 8' },
  { id: '9,9,10', label: 'Beginner · 9×9 · 10' },
  { id: '16,16,40', label: 'Intermediate · 16×16 · 40' },
  { id: '16,30,99', label: 'Expert · 16×30 · 99' },
];

export const DEFAULTS = { rows: 5, cols: 6, mines: 8 };

export const LIMITS = { rows: [1, 30], cols: [1, 40], mines: [0, 999] };

export const EPS = 1e-9;

/** Human label for a cell index, 1-based like the board reads on screen. */
export const cellLabel = (i, cols) => `r${Math.floor(i / cols) + 1}c${(i % cols) + 1}`;

/** A realistic mid-game 5×6 position, so the app opens showing what it does. */
export function seedBoard(rows, cols) {
  const grid = new Array(rows * cols).fill(UNKNOWN);
  if (rows !== 5 || cols !== 6) return grid;
  const pattern = [
    [1, 1, 1, 0, 1, -1],
    [-1, -1, 1, 0, 1, -1],
    [-1, -1, 2, 1, 2, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
  ];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) grid[r * cols + c] = pattern[r][c];
  return grid;
}
