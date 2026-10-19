import type { AnatomicalStructure } from '../contract/schema';
import type { ColourBy } from '../app/state';
import type { TissueLook } from './tissue';

/**
 * Real-tissue looks for a fresh brain: pinkish-beige grey matter, creamy white matter, darker
 * grey-brown deep nuclei, glistening red arteries, and clear, faintly blue fluid in the ventricles.
 */
const REAL: Record<string, TissueLook> = {
  cortex: { color: '#c4948a', roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.28, sheen: 0.35, sheenColor: '#ffd8cc', rim: 0.3, rimColor: '#ff7f6a', ao: 1, mottle: 0.35, mottleTint: '#9a675e' },
  'white-matter': { color: '#efe5d6', roughness: 0.6, clearcoat: 0.3, sheen: 0.3, sheenColor: '#fff7ec', rim: 0.12, rimColor: '#ffd6c0', ao: 0.6, mottle: 0.1, mottleTint: '#d8c9b4' },
  deep: { color: '#b98f84', roughness: 0.58, clearcoat: 0.35, sheen: 0.35, rim: 0.2, ao: 0.55, mottle: 0.18, mottleTint: '#a07368' },
  brainstem: { color: '#dcc0ae', roughness: 0.55, clearcoat: 0.4, sheen: 0.35, rim: 0.2, ao: 0.8, mottle: 0.15, mottleTint: '#bb9a88' },
  cerebellum: { color: '#c99a8d', roughness: 0.55, clearcoat: 0.45, sheen: 0.4, rim: 0.26, ao: 0.95, mottle: 0.2, mottleTint: '#a8786c' },
  ventricle: { color: '#9cc4dc', roughness: 0.15, clearcoat: 0.9, clearcoatRoughness: 0.1, sheen: 0, rim: 0.3, rimColor: '#cfeaff', ao: 0, mottle: 0 },
  nerve: { color: '#efe2cc', roughness: 0.5, clearcoat: 0.4, sheen: 0.3, rim: 0.12, ao: 0.7, mottle: 0.1 },
  artery: { color: '#b4342e', roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.15, sheen: 0.2, sheenColor: '#ffb3a6', rim: 0.3, rimColor: '#ff6a55', ao: 0.6, mottle: 0.12, mottleTint: '#8e2424' },
};

/** Cut-surface colours: what a slice through each tissue shows. */
export const CUT: Record<string, string> = {
  cortex: '#b88e86',
  'white-matter': '#f1e9dc',
  deep: '#a88579',
  brainstem: '#e2d3c4',
  cerebellum: '#b38479',
  ventricle: '#a9cde2',
  nerve: '#efe4d2',
  artery: '#9a2a26',
};

/** One hue per lobe (Colour by: Lobes). */
export const LOBE_COLOUR: Record<string, string> = {
  frontal: '#e07f5f',
  parietal: '#e3b448',
  temporal: '#5fa68f',
  occipital: '#6c8fd0',
  insula: '#d1606f',
  limbic: '#b07bc2',
};

/** One hue per functional area (Colour by: Functional areas). */
export const AREA_COLOUR: Record<string, string> = {
  motor: '#e0533f',
  somatosensory: '#e9a23b',
  visual: '#4b84d6',
  auditory: '#3aa58a',
  broca: '#9b59c6',
  wernicke: '#d04f9b',
};

/** The key (frontal, motor, …) of a lobe or area group id such as "left-frontal-lobe". */
export function lobeKey(lobeId: string): string {
  const k = lobeId.replace(/^(right|left)-/, '');
  if (k === 'limbic-cortex') return 'limbic';
  if (k === 'insular-lobe') return 'insula';
  return k.replace(/-lobe$/, '');
}
export function areaKey(areaId: string): string {
  const k = areaId.replace(/^(right|left)-/, '');
  if (k === 'broca-area') return 'broca';
  if (k === 'wernicke-area') return 'wernicke';
  return k.replace(/^primary-/, '').replace(/-cortex$/, '');
}

export function realLook(s: AnatomicalStructure): TissueLook {
  return REAL[s.layer] ?? REAL.cortex!;
}

/**
 * The colour a structure shows in the current colour mode. In "real" mode this is its tissue
 * colour; lobe and area modes paint the cortex and leave everything else in its real colour.
 */
export function baseColour(s: AnatomicalStructure, colourBy: ColourBy): string {
  if (s.kind === 'group') {
    if (s.role === 'lobe') return LOBE_COLOUR[lobeKey(s.id)] ?? '#bbbbbb';
    if (s.role === 'area') return AREA_COLOUR[areaKey(s.id)] ?? '#bbbbbb';
  }
  if (s.layer === 'cortex' && colourBy === 'lobe' && s.lobe) return LOBE_COLOUR[lobeKey(s.lobe)] ?? realLook(s).color;
  if (s.layer === 'cortex' && colourBy === 'area') {
    const a = s.areas?.[0];
    return a ? (AREA_COLOUR[areaKey(a)] ?? realLook(s).color) : '#cdbcb4';
  }
  return realLook(s).color;
}

/** CSF particles. */
export const CSF = '#3fa9e0';

export const HIGHLIGHT = '#ffc94d';
export const HOVER = '#ffe7a8';
