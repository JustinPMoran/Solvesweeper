import { UNKNOWN, MINE, EPS, cellLabel } from './constants.js';

/**
 * Exact Minesweeper probabilities.
 *
 * Every covered square gets the true fraction of valid mine arrangements that
 * put a mine on it — not a heuristic score. The work is:
 *
 *   1. Turn each opened number into a constraint over its covered neighbours.
 *   2. Split those covered squares into independent components (union-find over
 *      squares that share a constraint).
 *   3. Enumerate each component exhaustively with constraint pruning, bucketed
 *      by how many mines the arrangement uses.
 *   4. Convolve the components and weigh each total against C(free, left − k),
 *      the ways the remaining mines can sit on squares no number touches.
 */

const combCache = new Map();
function comb(n, k) {
  if (k < 0 || k > n || n < 0) return 0;
  const key = `${n}/${k}`;
  const hit = combCache.get(key);
  if (hit !== undefined) return hit;
  const kk = Math.min(k, n - k);
  let v = 1;
  for (let i = 1; i <= kk; i++) v = (v * (n - kk + i)) / i;
  combCache.set(key, v);
  return v;
}

function densify(counts) {
  let max = 0;
  for (const k of counts.keys()) if (k > max) max = k;
  const out = new Array(max + 1).fill(0);
  for (const [k, v] of counts) out[k] = v;
  return out;
}

function convolve(a, b) {
  const out = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    if (!a[i]) continue;
    for (let j = 0; j < b.length; j++) {
      if (!b[j]) continue;
      out[i + j] += a[i] * b[j];
    }
  }
  return out;
}

export function neighbors(i, rows, cols) {
  const r = Math.floor(i / cols);
  const c = i % cols;
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push(nr * cols + nc);
    }
  }
  return out;
}

const ARRANGEMENT_LIMIT = 4_000_000;

/** Exhaustively enumerate one component, pruned against its own constraints. */
function enumerateComponent(group, minesLeft) {
  // Order squares so constraint-mates are adjacent: pruning bites much earlier.
  const order = [];
  const seen = new Set();
  for (const con of group.cons) {
    for (const cell of con.cells) {
      if (!seen.has(cell)) { seen.add(cell); order.push(cell); }
    }
  }
  const n = order.length;
  const local = new Map(order.map((g, i) => [g, i]));
  const cons = group.cons.map((c) => ({ need: c.need, cells: c.cells.map((g) => local.get(g)) }));

  const cellCons = Array.from({ length: n }, () => []);
  cons.forEach((c, ci) => c.cells.forEach((li) => cellCons[li].push(ci)));

  const sum = new Array(cons.length).fill(0);
  const cnt = new Array(cons.length).fill(0);
  const val = new Array(n).fill(0);
  const dist = new Map();
  const cellMine = Array.from({ length: n }, () => new Map());
  let solutions = 0;
  let overflow = false;

  const bump = (map, k) => map.set(k, (map.get(k) || 0) + 1);

  (function rec(pos, k) {
    if (overflow || k > minesLeft) return;
    if (pos === n) {
      bump(dist, k);
      for (let j = 0; j < n; j++) if (val[j]) bump(cellMine[j], k);
      if (++solutions > ARRANGEMENT_LIMIT) overflow = true;
      return;
    }
    for (let v = 0; v < 2; v++) {
      val[pos] = v;
      let ok = true;
      for (const ci of cellCons[pos]) {
        sum[ci] += v;
        cnt[ci] += 1;
        if (sum[ci] > cons[ci].need || cons[ci].need - sum[ci] > cons[ci].cells.length - cnt[ci]) ok = false;
      }
      if (ok) rec(pos + 1, k + v);
      for (const ci of cellCons[pos]) { sum[ci] -= v; cnt[ci] -= 1; }
    }
    val[pos] = 0;
  })(0, 0);

  return {
    cells: order,
    dist: densify(dist),
    cellMine: cellMine.map(densify),
    overflow,
  };
}

/**
 * @param {{grid:number[], rows:number, cols:number, mines:number}} board
 * @returns {{error?:string, prob?:Object, unknown?:number[], groups?:Object, noInfo?:boolean, overflow?:boolean, solved?:boolean}}
 */
export function solveBoard({ grid, rows, cols, mines }) {
  const label = (i) => cellLabel(i, cols);
  const unknown = [];
  let flagged = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === UNKNOWN) unknown.push(i);
    else if (grid[i] === MINE) flagged++;
  }

  const minesLeft = mines - flagged;
  if (minesLeft < 0) {
    return { error: `You've flagged ${flagged} mines but the board only has ${mines}. Raise the mine count or unflag a square.` };
  }
  if (minesLeft > unknown.length) {
    return { error: `There are ${minesLeft} mines left but only ${unknown.length} covered squares to hide them in.` };
  }
  if (!unknown.length) return { solved: true, prob: {}, unknown: [], groups: emptyGroups() };

  // One constraint per opened number: mines among its covered neighbours.
  const cons = [];
  const boundary = new Set();
  for (let i = 0; i < grid.length; i++) {
    const v = grid[i];
    if (v < 0 || v > 8) continue;
    const cells = [];
    let flags = 0;
    for (const nb of neighbors(i, rows, cols)) {
      if (grid[nb] === UNKNOWN) cells.push(nb);
      else if (grid[nb] === MINE) flags++;
    }
    const need = v - flags;
    if (need < 0) return { error: `The ${v} at ${label(i)} already has ${flags} flags around it.` };
    if (need > cells.length) {
      return { error: `The ${v} at ${label(i)} needs ${need} more mine${need > 1 ? 's' : ''} but has only ${cells.length} covered neighbour${cells.length === 1 ? '' : 's'}.` };
    }
    if (cells.length) {
      cons.push({ cells, need });
      cells.forEach((c) => boundary.add(c));
    }
  }

  const free = unknown.filter((i) => !boundary.has(i));
  const prob = {};

  if (!cons.length) {
    const flat = free.length ? minesLeft / free.length : 0;
    unknown.forEach((i) => { prob[i] = flat; });
    return { prob, unknown, noInfo: true, groups: classify(prob, unknown, true) };
  }

  // Union-find: covered squares linked by a shared constraint solve together.
  const parent = new Map();
  const find = (x) => {
    while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); }
    return x;
  };
  const union = (a, b) => { a = find(a); b = find(b); if (a !== b) parent.set(a, b); };
  boundary.forEach((c) => parent.set(c, c));
  cons.forEach((c) => c.cells.slice(1).forEach((cell) => union(c.cells[0], cell)));

  const groupsByRoot = new Map();
  boundary.forEach((c) => {
    const root = find(c);
    if (!groupsByRoot.has(root)) groupsByRoot.set(root, { cells: [], cons: [] });
    groupsByRoot.get(root).cells.push(c);
  });
  cons.forEach((c) => groupsByRoot.get(find(c.cells[0])).cons.push(c));

  const comps = [];
  let overflow = false;
  for (const group of groupsByRoot.values()) {
    const comp = enumerateComponent(group, minesLeft);
    if (comp.overflow) overflow = true;
    if (!comp.dist.some(Boolean)) {
      return { error: 'No mine arrangement fits these numbers. Something on the board contradicts itself.' };
    }
    comps.push(comp);
  }

  let total = [1];
  for (const comp of comps) total = convolve(total, comp.dist);

  const nFree = free.length;
  let weightTotal = 0;
  for (let k = 0; k < total.length; k++) if (total[k]) weightTotal += total[k] * comb(nFree, minesLeft - k);
  if (!(weightTotal > 0)) {
    return { error: `No mine arrangement fits these numbers and a total of ${mines} mines.` };
  }

  comps.forEach((comp, idx) => {
    let others = [1];
    comps.forEach((other, j) => { if (j !== idx) others = convolve(others, other.dist); });
    comp.cells.forEach((cell, ci) => {
      const mineDist = comp.cellMine[ci];
      let num = 0;
      for (let ka = 0; ka < mineDist.length; ka++) {
        if (!mineDist[ka]) continue;
        for (let kb = 0; kb < others.length; kb++) {
          if (!others[kb]) continue;
          const w = comb(nFree, minesLeft - ka - kb);
          if (w) num += mineDist[ka] * others[kb] * w;
        }
      }
      prob[cell] = num / weightTotal;
    });
  });

  if (nFree) {
    let num = 0;
    for (let k = 0; k < total.length; k++) {
      if (total[k]) num += total[k] * comb(nFree, minesLeft - k) * (minesLeft - k) / nFree;
    }
    const p = num / weightTotal;
    free.forEach((i) => { prob[i] = p; });
  }

  return { prob, unknown, overflow, groups: classify(prob, unknown, false) };
}

function emptyGroups() {
  return { safe: [], mines: [], riskiest: [], best: [], maxP: 0, minP: 0 };
}

/**
 * Buckets covered squares for the UI: certain safe, certain mine, the riskiest
 * uncertain squares (highlighted), and the lowest-risk uncertain squares.
 */
function classify(prob, unknown, noInfo) {
  const groups = emptyGroups();
  const uncertain = [];
  for (const i of unknown) {
    const p = prob[i];
    if (p < EPS) groups.safe.push(i);
    else if (p > 1 - EPS) groups.mines.push(i);
    else uncertain.push(i);
  }
  if (!uncertain.length) return groups;

  let maxP = -1;
  let minP = 2;
  for (const i of uncertain) {
    if (prob[i] > maxP) maxP = prob[i];
    if (prob[i] < minP) minP = prob[i];
  }
  groups.maxP = maxP;
  groups.minP = minP;
  groups.best = uncertain.filter((i) => prob[i] <= minP + EPS);
  // A flat board (every square equally likely) has no "riskiest" worth marking.
  if (!noInfo && maxP > minP + EPS) {
    groups.riskiest = uncertain.filter((i) => prob[i] >= maxP - EPS);
  }
  return groups;
}
