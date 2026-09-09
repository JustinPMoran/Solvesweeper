import { PRESETS, LIMITS } from '../constants.js';

export default function Toolbar({ settings, preset, onSettings, onPreset, onCreate, onReset }) {
  const field = (key, label) => (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={LIMITS[key][0]}
        max={LIMITS[key][1]}
        value={settings[key]}
        onChange={(e) => onSettings(key, e.target.value)}
      />
    </label>
  );

  return (
    <section className="panel toolbar">
      <label className="field">
        <span>Preset</span>
        <select value={preset} onChange={(e) => onPreset(e.target.value)}>
          <option value="custom">Custom</option>
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </label>
      {field('rows', 'Rows')}
      {field('cols', 'Cols')}
      {field('mines', 'Mines')}
      <button className="btn btn-primary" onClick={onCreate}>Create Grid</button>
      <button className="btn btn-ghost" onClick={onReset}>Reset</button>
    </section>
  );
}
