import { describe, expect, it } from 'vitest';
import { brainDefinition as def } from '../../src/brain/definition';
import { effectiveColourBy, effectiveSlice, highlightedIds, initialState, insideActive, isVisible, keptHalf, makeReducer } from '../../src/app/state';
import { searchStructures } from '../../src/app/search';

const reduce = makeReducer(def);

describe('lab state', () => {
  it('starts in anatomy mode, real colours, no cut, every layer visible', () => {
    const s = initialState(def);
    expect(s.mode).toBe('explore');
    expect(s.colourBy).toBe('real');
    expect(s.slice).toEqual({ axis: 'off', at: 0, flip: false });
    expect(s.visibleLayers.size).toBe(def.layers.length);
  });

  it('selecting a lobe highlights its gyri; selecting again clears it', () => {
    let s = reduce(initialState(def), { type: 'select', id: 'left-frontal-lobe' });
    const lit = highlightedIds(def, [s.selected!]);
    expect(lit.has('left-precentral-gyrus')).toBe(true);
    expect(lit.has('right-precentral-gyrus')).toBe(false);
    s = reduce(s, { type: 'select', id: 'left-frontal-lobe' });
    expect(s.selected).toBeNull();
  });

  it('isolate shows only the highlighted structures', () => {
    let s = reduce(initialState(def), { type: 'select', id: 'left-broca-area' });
    s = reduce(s, { type: 'set-isolate', value: true });
    expect(isVisible(def, s, 'left-inferior-frontal-gyrus-triangular')).toBe(true);
    expect(isVisible(def, s, 'pons')).toBe(false);
  });

  it('a hidden layer hides its structures unless one is selected', () => {
    let s = reduce(initialState(def), { type: 'toggle-layer', layer: 'artery' });
    expect(isVisible(def, s, 'basilar-artery')).toBe(false);
    s = reduce(s, { type: 'select', id: 'basilar-artery' });
    expect(isVisible(def, s, 'basilar-artery')).toBe(true);
  });

  it('the cut clamps its position, starts a new axis in the middle, and can flip', () => {
    let s = reduce(initialState(def), { type: 'set-slice', axis: 'coronal' });
    expect(s.slice).toEqual({ axis: 'coronal', at: 0, flip: false });
    s = reduce(s, { type: 'set-slice', at: 4 });
    expect(s.slice.at).toBe(1);
    s = reduce(s, { type: 'set-slice', at: Number.NaN });
    expect(s.slice.at).toBe(1);
    s = reduce(s, { type: 'set-slice', flip: true });
    expect(s.slice.flip).toBe(true);
    s = reduce(s, { type: 'set-slice', axis: 'axial' });
    expect(s.slice.at).toBe(0);
  });

  it('tour steps set their own cut, colours and inside view; anatomy mode keeps the learner’s', () => {
    let s = reduce(initialState(def), { type: 'set-colour-by', value: 'area' });
    expect(effectiveColourBy(def, s)).toBe('area');
    s = reduce(s, { type: 'set-mode', mode: 'tour' });
    expect(effectiveColourBy(def, s)).toBe(def.tour[0]!.colourBy);
    const cut = def.tour.findIndex((t) => t.slice);
    s = reduce(s, { type: 'tour-go', index: cut });
    expect(effectiveSlice(def, s).axis).toBe(def.tour[cut]!.slice!.axis);
    const inside = def.tour.findIndex((t) => t.inside);
    s = reduce(s, { type: 'tour-go', index: inside });
    expect(insideActive(def, s)).toBe(true);
    s = reduce(s, { type: 'set-mode', mode: 'explore' });
    expect(insideActive(def, s)).toBe(false);
    expect(effectiveSlice(def, s).axis).toBe('off');
  });

  it('tour navigation stays within the steps', () => {
    let s = reduce(initialState(def), { type: 'tour-go', index: 99 });
    expect(s.tourIndex).toBe(def.tour.length - 1);
    s = reduce(s, { type: 'tour-go', index: -5 });
    expect(s.tourIndex).toBe(0);
  });

  it('reset restores the start state but keeps the camera request fresh', () => {
    let s = reduce(initialState(def), { type: 'set-slice', axis: 'sagittal' });
    s = reduce(s, { type: 'reset' });
    expect(s.slice.axis).toBe('off');
    expect(s.camera.nonce).toBeGreaterThan(0);
  });

  it('choosing a cut or flipping it turns the camera to face the cut face', () => {
    let s = initialState(def);
    const turns = (action: Parameters<typeof reduce>[1], preset: string) => {
      const nonce = s.camera.nonce;
      s = reduce(s, action);
      expect(s.camera.preset).toBe(preset);
      expect(s.camera.nonce).toBe(nonce + 1);
    };
    turns({ type: 'set-slice', axis: 'sagittal' }, 'left');
    expect(keptHalf(s.slice)).toMatch(/right half/);
    turns({ type: 'set-slice', flip: true }, 'right');
    expect(keptHalf(s.slice)).toMatch(/left half/);
    turns({ type: 'set-slice', axis: 'coronal' }, 'posterior');
    turns({ type: 'set-slice', flip: false }, 'anterior');
    expect(keptHalf(s.slice)).toBe('the back half');
    turns({ type: 'set-slice', axis: 'axial' }, 'superior');
    turns({ type: 'set-slice', flip: true }, 'inferior');
    // Moving the cut, or turning it off, leaves the camera alone.
    const nonce = s.camera.nonce;
    s = reduce(s, { type: 'set-slice', at: 0.4 });
    s = reduce(s, { type: 'set-slice', axis: 'off' });
    expect(s.camera.nonce).toBe(nonce);
    expect(def.cameraPresets.map((c) => c.id)).toEqual(expect.arrayContaining(['left', 'right', 'anterior', 'posterior', 'superior', 'inferior']));
  });
});

describe('search', () => {
  it('finds Broca, the thalamus, the medulla, the circle of Willis and Heschl’s gyrus', () => {
    expect(searchStructures(def.structures, 'broca')[0]!.structure.id).toBe('left-broca-area');
    expect(searchStructures(def.structures, 'thalamus').map((h) => h.structure.id)).toEqual(expect.arrayContaining(['left-thalamus', 'right-thalamus']));
    expect(searchStructures(def.structures, 'circle of willis').map((h) => h.structure.id)).toContain('anterior-communicating-artery');
    expect(searchStructures(def.structures, 'medulla')[0]!.structure.id).toBe('medulla-oblongata');
    expect(searchStructures(def.structures, "heschl").map((h) => h.structure.id)).toContain('left-transverse-temporal-gyrus');
  });
});
