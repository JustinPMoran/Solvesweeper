import { UNKNOWN, MINE, cellLabel } from '../constants.js';

const pct = (p) => `${Math.round(p * 100)}%`;

function ChipList({ cells, cols, kind, prob }) {
  return (
    <div className="chips">
      {cells.map((i) => (
        <span className={`chip ${kind}`} key={i}>
          {cellLabel(i, cols)}
          {prob ? ` ${pct(prob[i])}` : ''}
        </span>
      ))}
    </div>
  );
}

function Verdict({ result, cols }) {
  if (result.error) {
    return (
      <div className="verdict risk">
        <strong>That board can&apos;t happen</strong>
        <p>{result.error}</p>
      </div>
    );
  }
  if (result.solved) {
    return (
      <div className="verdict good">
        <strong>Board cleared</strong>
        <p>Nothing left covered.</p>
      </div>
    );
  }

  const { safe, best, riskiest, minP, maxP } = result.groups;

  if (safe.length) {
    return (
      <div className="verdict good">
        <strong>Open {cellLabel(safe[0], cols)}</strong>
        <p>
          {safe.length} square{safe.length > 1 ? 's are' : ' is'} safe in every arrangement
          {riskiest.length ? `, and ${cellLabel(riskiest[0], cols)} is the likeliest mine at ${pct(maxP)}.` : '.'}
        </p>
      </div>
    );
  }
  if (best.length) {
    return (
      <div className="verdict warn">
        <strong>Best guess: {cellLabel(best[0], cols)}</strong>
        <p>
          {result.noInfo
            ? `No numbers on the board yet — every covered square carries the same ${pct(minP)} chance of a mine.`
            : `${pct(minP)} chance of a mine, the lowest on the board. Squares highlighted amber are the likeliest mines at ${pct(maxP)}.`}
        </p>
      </div>
    );
  }
  return (
    <div className="verdict risk">
      <strong>Every covered square is a mine</strong>
      <p>Flag them all.</p>
    </div>
  );
}

export default function Readout({ grid, cols, mines, result }) {
  const flagged = grid.filter((v) => v === MINE).length;
  const covered = grid.filter((v) => v === UNKNOWN).length;

  return (
    <section className="panel readout">
      <h2>Solver</h2>
      <div className="counters">
        <div className="counter">
          <b>{Math.max(mines - flagged, 0)}</b>
          <span>Mines left</span>
        </div>
        <div className="counter">
          <b>{covered}</b>
          <span>Covered</span>
        </div>
      </div>

      {!result ? (
        <p className="empty">
          Paint the numbers you can see, flag the mines you know, then hit <strong>Find Safe Moves</strong>.
        </p>
      ) : (
        <>
          <Verdict result={result} cols={cols} />

          {!result.error && !result.solved && (
            <>
              <div className="group">
                <h3><i className="dot safe" />Safe to open ({result.groups.safe.length})</h3>
                {result.groups.safe.length
                  ? <ChipList cells={result.groups.safe} cols={cols} kind="safe" />
                  : <p className="empty">None certain — you have to guess.</p>}
              </div>

              <div className="group">
                <h3><i className="dot warn" />Highest mine chance ({result.groups.riskiest.length})</h3>
                {result.groups.riskiest.length
                  ? <ChipList cells={result.groups.riskiest} cols={cols} kind="warn" prob={result.prob} />
                  : <p className="empty">Nothing stands out — no square is likelier than the rest.</p>}
              </div>

              <div className="group">
                <h3><i className="dot mine" />Certain mines ({result.groups.mines.length})</h3>
                {result.groups.mines.length
                  ? <ChipList cells={result.groups.mines} cols={cols} kind="mine" />
                  : <p className="empty">None yet.</p>}
              </div>

              {result.overflow && (
                <p className="empty">
                  This board is very large — enumeration is capped at 4M arrangements per region, so a few
                  percentages may be approximate.
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
