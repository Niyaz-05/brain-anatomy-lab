import { useEffect, useRef } from 'react';
import { useLab } from '../app/LabContext';
import { AREA_COLOUR, LOBE_COLOUR } from '../viewer/palette';
import { AREAS, LOBES } from '../brain/definition';

const LOBE_NAMES: Record<string, string> = Object.fromEntries(Object.entries(LOBES).map(([k, v]) => [k, v.label]));
const AREA_NAMES: Record<string, string> = Object.fromEntries(Object.entries(AREAS).map(([k, v]) => [k, v.label]));

/**
 * Source, scope and credits, kept off the main screen. The HuBMAP and BodyParts3D attribution
 * required by CC BY 4.0 lives here and is reachable from the ⓘ button and the "Source & credits" link.
 */
export function AboutSheet({ onClose }: { onClose: () => void }) {
  const { def } = useLab();
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    title.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section
        className="about-sheet glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="ghost sheet-close" onClick={onClose} aria-label="Close">✕</button>
        <p className="eyebrow">Source &amp; scope</p>
        <h2 id="about-title" className="sheet-title" tabIndex={-1} ref={title}>About this lab</h2>
        <p>{def.summary}</p>

        <h3 className="group-title">You will learn to</h3>
        <ul className="objectives">
          {def.learningObjectives.map((o) => <li key={o.id}>{o.text}</li>)}
        </ul>

        <h3 className="group-title">Colours</h3>
        <p className="small muted">
          “Real” shows the colours of a fresh brain: pinkish-grey cortex, creamy white matter, darker deep grey matter and
          red arteries. “Lobes” and “Areas” paint the cortex to teach its divisions.
        </p>
        <p className="legend-row">
          {Object.entries(LOBE_COLOUR).map(([k, c]) => (
            <span key={k}><span className="dot" style={{ background: c }} aria-hidden="true" /> {LOBE_NAMES[k]}</span>
          ))}
        </p>
        <p className="legend-row">
          {Object.entries(AREA_COLOUR).map(([k, c]) => (
            <span key={k}><span className="dot" style={{ background: c }} aria-hidden="true" /> {AREA_NAMES[k]}</span>
          ))}
        </p>

        <h3 className="group-title">Cerebrospinal fluid animation</h3>
        <ul className="small disclaimers">
          {def.csfRoute.assumptions.map((a) => <li key={a}>{a}</li>)}
        </ul>

        <h3 className="group-title">Please note</h3>
        <ul className="small disclaimers">
          {def.disclaimers.map((d) => <li key={d}>{d}</li>)}
        </ul>

        <h3 className="group-title">Source</h3>
        <p className="small">
          Brain model: HuBMAP Human Reference Atlas, 3D Reference Organ for Brain, Female v1.4, by Kristen Browne and Heidi
          Schlehlein, built from the Allen Institute human brain atlas (Ding et al. 2016). Arteries: BodyParts3D, © The
          Database Center for Life Science. Both licensed under CC Attribution 4.0 International. Neither HuBMAP, the Allen
          Institute nor DBCLS has reviewed or endorsed this lab.
        </p>
        <div className="link-list small">
          <a href={`${import.meta.env.BASE_URL}ATTRIBUTION.md`} target="_blank" rel="noopener">Attribution and changes made ↗</a>
          <a href="https://doi.org/10.48539/HBM674.NTLM.353" target="_blank" rel="noopener noreferrer">HRA brain, female v1.4 ↗</a>
          <a href="https://doi.org/10.1002/cne.24080" target="_blank" rel="noopener noreferrer">Allen human brain atlas (Ding et al. 2016) ↗</a>
          <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noopener noreferrer">BodyParts3D ↗</a>
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0 licence ↗</a>
        </div>
      </section>
    </div>
  );
}
