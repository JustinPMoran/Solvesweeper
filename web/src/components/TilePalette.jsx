import { UNKNOWN, MINE, NUM_COLORS } from '../constants.js';
import { Diamond, MineGlyph } from './TileShape.jsx';

const ORDER = [UNKNOWN, 0, 1, 2, 3, 4, 5, 6, 7, 8, MINE];
const SW = 48;

function swatchTitle(v) {
  if (v === UNKNOWN) return 'Covered square';
  if (v === MINE) return 'Mine';
  return `${v} adjacent mine${v === 1 ? '' : 's'}`;
}

function Swatch({ v }) {
  let fill = 'var(--tile-open)';
  let stroke = 'var(--tile-open-line)';
  let inner = null;

  if (v === UNKNOWN) {
    fill = 'var(--tile-cover)';
    stroke = 'var(--tile-cover-line)';
  } else if (v === MINE) {
    fill = 'var(--tile-mine)';
    stroke = 'var(--tile-mine-line)';
    inner = <MineGlyph cx={0} cy={1} tw={52} />;
  } else if (v > 0) {
    inner = (
      <text className="num" style={{ fontSize: 14 }} x="0" y="5" fill={NUM_COLORS[v]}>{v}</text>
    );
  }

  return (
    <svg width="46" height="28" viewBox="-25 -14 50 28" aria-hidden="true">
      <g strokeWidth="2" strokeLinejoin="round">
        <Diamond tw={SW} th={SW / 2} scale={0.98} fill={fill} stroke={stroke} />
      </g>
      {inner}
    </svg>
  );
}

export default function TilePalette({ tool, onTool }) {
  return (
    <section className="panel palette">
      <span className="palette-label">Tile</span>
      <div className="swatches">
        {ORDER.map((v) => (
          <button
            key={v}
            className="sw"
            aria-pressed={v === tool}
            title={swatchTitle(v)}
            onClick={() => onTool(v)}
          >
            <Swatch v={v} />
            <span className="cap">{v === UNKNOWN ? '?' : v === MINE ? 'mine' : v}</span>
          </button>
        ))}
      </div>
      <p className="hint">
        Pick a tile, then click or drag across the board to paint it. Right-click a square to flag a mine.
        Number keys <code>0</code>–<code>8</code> switch tiles, <code>u</code> covers, <code>m</code> flags.
      </p>
    </section>
  );
}
