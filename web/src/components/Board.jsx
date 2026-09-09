import { useRef } from 'react';
import { UNKNOWN, MINE, NUM_COLORS, EPS, cellLabel } from '../constants.js';
import { layout, tileCenter } from '../geometry.js';
import { Diamond, MineGlyph } from './TileShape.jsx';

/** Fill + stroke + overlay for one covered square, given its probability and role. */
function coveredLook(p, role) {
  if (p === null) return { fill: 'var(--tile-cover)', stroke: 'var(--tile-cover-line)', text: null, cls: 'pct' };
  if (p < EPS) {
    return { fill: 'color-mix(in srgb,var(--safe) 42%,var(--tile-cover))', stroke: 'var(--safe)', text: 'SAFE', cls: 'pct cool' };
  }
  if (p > 1 - EPS) {
    return { fill: 'color-mix(in srgb,var(--danger) 46%,var(--tile-cover))', stroke: 'var(--danger)', text: 'MINE', cls: 'pct hot' };
  }
  const text = `${Math.round(p * 100)}%`;
  if (role === 'riskiest') {
    return { fill: 'var(--warn-fill)', stroke: 'var(--warn)', text, cls: 'pct warn' };
  }
  return { fill: 'var(--tile-cover)', stroke: 'var(--tile-cover-line)', text, cls: 'pct' };
}

export default function Board({ grid, rows, cols, result, onPaint }) {
  const painting = useRef(false);
  const geo = layout(rows, cols);
  const prob = result && result.prob ? result.prob : null;
  const riskiest = new Set(result && result.groups ? result.groups.riskiest : []);

  const cellFrom = (event) => {
    const g = event.target.closest('.tile');
    return g ? Number(g.dataset.i) : -1;
  };

  const handleDown = (event) => {
    const i = cellFrom(event);
    if (i < 0) return;
    event.preventDefault();
    painting.current = event.button === 0;
    onPaint(i, event.button);
  };

  const handleOver = (event) => {
    if (!painting.current) return;
    const i = cellFrom(event);
    if (i >= 0) onPaint(i, 0);
  };

  return (
    <div className="board-wrap">
      <svg
        className="board"
        viewBox={geo.viewBox}
        width={Math.min(geo.width, 820)}
        style={{ maxHeight: `min(62vh, ${geo.height}px)` }}
        role="grid"
        aria-label={`${rows} by ${cols} isometric minesweeper board`}
        onMouseDown={handleDown}
        onMouseOver={handleOver}
        onMouseUp={() => { painting.current = false; }}
        onMouseLeave={() => { painting.current = false; }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          <filter id="plate-shadow" x="-20%" y="-40%" width="140%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="var(--shadow)" />
          </filter>
        </defs>

        <polygon
          points={geo.plate}
          fill="var(--edge)"
          stroke="var(--edge-strong)"
          strokeWidth="2"
          filter="url(#plate-shadow)"
        />

        {grid.map((v, i) => {
          const { x, y } = tileCenter(i, rows, cols, geo.tw, geo.th);
          const p = prob && prob[i] !== undefined ? prob[i] : null;
          let fill;
          let stroke;
          let overlay = null;

          if (v === MINE) {
            fill = 'var(--tile-mine)';
            stroke = 'var(--tile-mine-line)';
            overlay = <MineGlyph cx={x} cy={y + 1} tw={geo.tw} />;
          } else if (v === UNKNOWN) {
            const look = coveredLook(p, riskiest.has(i) ? 'riskiest' : null);
            fill = look.fill;
            stroke = look.stroke;
            if (look.text) {
              overlay = (
                <text className={look.cls} style={{ fontSize: geo.percentSize }} x={x} y={y + geo.percentSize * 0.38}>
                  {look.text}
                </text>
              );
            }
          } else {
            fill = 'var(--tile-open)';
            stroke = 'var(--tile-open-line)';
            if (v > 0) {
              overlay = (
                <text
                  className="num"
                  style={{ fontSize: geo.numberSize }}
                  x={x}
                  y={y + geo.numberSize * 0.38}
                  fill={NUM_COLORS[v]}
                >
                  {v}
                </text>
              );
            }
          }

          return (
            <g className="tile" key={i} data-i={i}>
              <title>{cellLabel(i, cols)}</title>
              <Diamond cx={x} cy={y} tw={geo.tw} th={geo.th} fill={fill} stroke={stroke} />
              {overlay}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
