import { useLab } from '../app/LabContext';

const shortLabel = (label: string) => label.replace(/ \((right|left)\)$/, '');

/** Context-sensitive explanation of the selected structure, with its sources and model notes. */
export function DetailPanel() {
  const { def, state, dispatch } = useLab();
  const s = state.selected ? def.structures.find((x) => x.id === state.selected) : null;

  if (!s) return null; // details appear only after something is selected

  const sources = s.sources.map((id) => def.sources.find((x) => x.id === id)).filter((x) => x !== undefined);
  const layer = def.layers.find((l) => l.id === s.layer);
  const lobe = s.lobe ? def.structures.find((x) => x.id === s.lobe) : undefined;
  const areas = (s.areas ?? []).map((a) => def.structures.find((x) => x.id === a)).filter((x) => x !== undefined);
  const roleLabel = s.role === 'lobe' ? 'Lobe' : s.role === 'area' ? 'Functional area' : layer?.label;

  return (
    <section className="sheet detail-panel" aria-live="polite" aria-labelledby="detail-title">
      <div className="detail-head">
        <div>
          <p className="eyebrow">{roleLabel}</p>
          <h2 id="detail-title" className="panel-title">{s.label}</h2>
        </div>
        <button type="button" className="ghost" onClick={() => dispatch({ type: 'select', id: null })} aria-label="Clear selection">✕</button>
      </div>
      <p className="chip-row">
        {lobe && <button type="button" className="chip-static" onClick={() => dispatch({ type: 'select', id: lobe.id })}>{shortLabel(lobe.label)}</button>}
        {areas.map((a) => (
          <button key={a.id} type="button" className="chip-static" onClick={() => dispatch({ type: 'select', id: a.id })}>{shortLabel(a.label)}</button>
        ))}
        {s.side !== 'midline' && <span className="chip-static">{s.side === 'left' ? 'Left' : 'Right'} side</span>}
      </p>
      <p className="lead">{s.summary}</p>
      <h3 className="group-title">Function</h3>
      <p>{s.function}</p>
      {s.kind === 'group' && s.members && (
        <>
          <h3 className="group-title">{s.members.length === 1 ? 'Shown on' : `${s.members.length} parts`}</h3>
          <ul className="chips">
            {s.members.map((m) => {
              const ms = def.structures.find((x) => x.id === m);
              return ms ? <li key={m}><button type="button" onClick={() => dispatch({ type: 'select', id: m })}>{shortLabel(ms.label)}</button></li> : null;
            })}
          </ul>
        </>
      )}
      {s.related.length > 0 && (
        <>
          <h3 className="group-title">Related</h3>
          <ul className="chips">
            {s.related.map((r) => {
              const rs = def.structures.find((x) => x.id === r);
              return rs ? (
                <li key={r}><button type="button" onClick={() => dispatch({ type: 'select', id: r })}>{rs.label}</button></li>
              ) : null;
            })}
          </ul>
        </>
      )}
      <div className="row">
        <label className="check">
          <input type="checkbox" checked={state.isolate} onChange={(e) => dispatch({ type: 'set-isolate', value: e.target.checked })} />
          Isolate
        </label>
        <button type="button" className="secondary" onClick={() => dispatch({ type: 'camera', preset: state.camera.preset, focus: [s.id] })}>Zoom to</button>
      </div>
      <details className="more">
        <summary>Model note &amp; sources</summary>
        {s.modelNote && <p className="model-note">{s.modelNote}</p>}
        <ol className="sources small">
          {sources.map((src) => (
            <li key={src.id}>{src.url ? <a href={src.url} target="_blank" rel="noopener noreferrer">{src.citation}</a> : src.citation}</li>
          ))}
        </ol>
      </details>
    </section>
  );
}
