/**
 * Approved asset registry. Definitions reference assets only by these ids; the runtime resolves
 * the file, and the validators check that every mesh structure has a node in the asset. Adding an
 * asset here requires a provenance and licence entry in public/ATTRIBUTION.md.
 */
import geometry from '../brain/generated/geometry.json';

export interface ApprovedAsset {
  id: string;
  /** Path relative to the app's base URL. */
  file: string;
  format: 'glb';
  license: string;
  attribution: string;
  /** Node names present in the file; generated with the model. */
  nodes: readonly string[];
}

export const APPROVED_ASSETS: Readonly<Record<string, ApprovedAsset>> = {
  'hra-brain-v1': {
    id: 'hra-brain-v1',
    file: 'models/brain.glb',
    format: 'glb',
    license: 'CC-BY-4.0',
    attribution: 'HuBMAP HRA 3D Reference Organ for Brain (Browne, Schlehlein; Allen Institute data), CC BY 4.0; BodyParts3D (DBCLS), CC BY 4.0',
    nodes: Object.keys(geometry.structures).filter((k) => !k.startsWith('$')),
  },
};
