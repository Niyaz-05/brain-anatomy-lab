import { useId } from 'react';
import { useLab } from '../app/LabContext';
import { CSF } from '../viewer/palette';

/** Inside view: the route of cerebrospinal fluid, play/pause, facts and model assumptions. */
export function CsfPanel() {
  const { def, state, dispatch } = useLab();
  const id = useId();
  const route = def.csfRoute;
  return (
    <section className="sheet csf-panel" aria-labelledby={`${id}-title`}>
      <div className="detail-head">
        <h2 id={`${id}-title`} className="panel-title">Inside the brain</h2>
        <button type="button" className="secondary" onClick={() => dispatch({ type: 'set-playing', value: !state.playing })} aria-pressed={!state.playing}>
          {state.playing ? 'Pause' : 'Play'}
        </button>
      </div>
      <p className="lead">The cortex is faded so you can see the deep grey matter, the brainstem and the ventricles. {route.description}</p>

      <h3 className="group-title">{route.label}</h3>
      <ol className="flow-steps">
        {route.steps.map((st, i) => (
          <li key={i}>
            <span className="dot" aria-hidden="true" style={{ background: CSF }} />
            {st.structure ? (
              <button type="button" className="link" aria-pressed={state.selected === st.structure} onClick={() => dispatch({ type: 'select', id: st.structure! })}>{st.label}</button>
            ) : (
              <span className="offmodel">{st.label} <span className="tag">not on model</span></span>
            )}
            {st.note && <span className="muted small block">{st.note}</span>}
          </li>
        ))}
      </ol>

      <ul className="small facts">
        {route.facts.map((f) => <li key={f}>{f}</li>)}
      </ul>
      <div className="legend small" aria-label="Colour key">
        <span><span className="dot" style={{ background: CSF }} aria-hidden="true" /> Cerebrospinal fluid</span>
      </div>
      <details className="more">
        <summary>Model assumptions</summary>
        <ul className="small disclaimers">
          {route.assumptions.map((a) => <li key={a}>{a}</li>)}
        </ul>
      </details>
    </section>
  );
}
