import { diamondPoints } from '../geometry.js';

/** The spiked ball used for flagged mines, scaled to the tile it sits on. */
export function MineGlyph({ cx = 0, cy = 0, tw, color = 'var(--tile-open)' }) {
  const r = tw * 0.078;
  const a = tw * 0.125;
  const w = Math.max(1.6, tw * 0.032);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <path
        d={`M${cx - a} ${cy}H${cx + a}M${cx} ${cy - a * 0.86}V${cy + a * 0.86}`}
        stroke={color}
        strokeWidth={w}
        strokeLinecap="round"
      />
    </g>
  );
}

export function Diamond({ cx = 0, cy = 0, tw, th, scale = 0.94, fill, stroke }) {
  return <polygon points={diamondPoints(cx, cy, tw, th, scale)} fill={fill} stroke={stroke} />;
}
