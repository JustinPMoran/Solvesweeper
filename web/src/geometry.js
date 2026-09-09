/**
 * Isometric layout maths. Tiles are flat diamonds on a 2:1 plane:
 * a step right moves down-right, a step down moves down-left.
 */

const PAD = 26;
const PLATE_OUTSET = 9;

/** Tiles grow on small boards and shrink on big ones so the plane fills its card. */
export function tileWidth(rows, cols) {
  return Math.max(44, Math.min(96, Math.round(1520 / (rows + cols))));
}

export function layout(rows, cols) {
  const tw = tileWidth(rows, cols);
  const th = tw / 2;
  const minX = -((rows - 1) * tw) / 2 - tw / 2;
  const maxX = ((cols - 1) * tw) / 2 + tw / 2;
  const minY = -th / 2;
  const maxY = ((rows + cols - 2) * th) / 2 + th / 2;
  const width = maxX - minX + PAD * 2;
  const height = maxY - minY + PAD * 2;

  return {
    tw,
    th,
    width,
    height,
    viewBox: `${minX - PAD} ${minY - PAD} ${width} ${height}`,
    numberSize: Math.round(tw * 0.24),
    percentSize: Math.max(8, Math.round(tw * 0.125)),
    // The plate under the tiles, grounding the isometric plane.
    plate: [
      [-((rows - 1) * tw) / 2 - tw / 2 - PLATE_OUTSET, ((rows - 1) * th) / 2],
      [0, -th / 2 - PLATE_OUTSET],
      [((cols - 1) * tw) / 2 + tw / 2 + PLATE_OUTSET, ((cols - 1) * th) / 2],
      [((cols - 1) * tw) / 2 - ((rows - 1) * tw) / 2, ((rows + cols - 2) * th) / 2 + th / 2 + PLATE_OUTSET],
    ].map((p) => p.join(',')).join(' '),
  };
}

export function tileCenter(i, rows, cols, tw, th) {
  const r = Math.floor(i / cols);
  const c = i % cols;
  return { x: ((c - r) * tw) / 2, y: ((c + r) * th) / 2 };
}

export function diamondPoints(cx, cy, tw, th, scale = 0.94) {
  const hw = (tw / 2) * scale;
  const hh = (th / 2) * scale;
  return `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
}
