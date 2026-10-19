import { describe, expect, it } from 'vitest';
import { brainDefinition as def } from '../../src/brain/definition';
import { validateDefinition } from '../../src/contract/validate';
import { buildCsfStreams } from '../../src/brain/csf';
import { geometry } from '../../src/brain/anchors';

const meshes = def.structures.filter((s) => s.kind === 'mesh');
const groups = (role: string) => def.structures.filter((s) => s.kind === 'group' && s.role === role);
const byId = (id: string) => def.structures.find((s) => s.id === id)!;

describe('brain definition', () => {
  it('passes the validation gate with no warnings', () => {
    const r = validateDefinition(def);
    expect(r.issues).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('has exactly one mesh structure per model node, and no node left out', () => {
    expect(new Set(meshes.map((s) => s.id))).toEqual(new Set(Object.keys(geometry)));
  });

  it('puts every gyrus in exactly one lobe of its own hemisphere', () => {
    const cortex = meshes.filter((s) => s.layer === 'cortex');
    expect(cortex.length).toBe(78);
    for (const g of cortex) {
      const lobes = groups('lobe').filter((l) => l.members?.includes(g.id));
      expect(lobes.map((l) => l.id), g.id).toEqual([g.lobe]);
      expect(lobes[0]!.side).toBe(g.side);
    }
  });

  it('has six lobe groups per hemisphere', () => {
    expect(groups('lobe').filter((l) => l.side === 'left').length).toBe(6);
    expect(groups('lobe').filter((l) => l.side === 'right').length).toBe(6);
  });

  it('builds functional areas from gyri, with the language areas on the left only', () => {
    for (const a of groups('area')) {
      for (const m of a.members!) {
        expect(byId(m).layer, `${a.id} → ${m}`).toBe('cortex');
        expect(byId(m).side).toBe(a.side);
      }
    }
    expect(byId('left-broca-area').members).toEqual(['left-inferior-frontal-gyrus-opercular', 'left-inferior-frontal-gyrus-triangular']);
    expect(byId('left-primary-motor-cortex').members).toEqual(['left-precentral-gyrus']);
    expect(byId('left-primary-somatosensory-cortex').members).toEqual(['left-postcentral-gyrus']);
    expect(def.structures.some((s) => s.id === 'right-broca-area' || s.id === 'right-wernicke-area')).toBe(false);
  });

  it('places every left or right structure on its own side of the model (+x is the patient’s left)', () => {
    for (const s of meshes) {
      const x = geometry[s.id]!.centroid[0]!;
      if (s.side === 'left') expect(x, s.id).toBeGreaterThan(0);
      if (s.side === 'right') expect(x, s.id).toBeLessThan(0);
      if (s.side === 'midline') expect(Math.abs(x), s.id).toBeLessThan(0.006);
    }
  });

  it('is oriented anatomically: frontal in front, cerebellum low and behind, motor strip in front of sensory', () => {
    const c = (id: string) => geometry[id]!.centroid;
    expect(c('left-superior-frontal-gyrus')[2]).toBeGreaterThan(c('left-cuneus')[2]!);
    expect(c('vermis')[1]).toBeLessThan(c('corpus-callosum')[1]!);
    expect(c('vermis')[2]).toBeLessThan(c('pons')[2]!);
    expect(c('left-precentral-gyrus')[2]).toBeGreaterThan(c('left-postcentral-gyrus')[2]!);
    expect(c('pons')[1]).toBeGreaterThan(c('medulla-oblongata')[1]!);
  });

  it('has a tour whose steps all focus on real structures and stay within limits', () => {
    expect(def.tour.length).toBeGreaterThanOrEqual(10);
    for (const t of def.tour) for (const f of t.focus) expect(def.structures.some((s) => s.id === f), `${t.id}: ${f}`).toBe(true);
    expect(def.tour.some((t) => t.slice)).toBe(true);
    expect(def.tour.some((t) => t.inside)).toBe(true);
  });

  it('cites every structure, and only https sources', () => {
    for (const s of def.structures) expect(s.sources.length, s.id).toBeGreaterThan(0);
    for (const src of def.sources) if (src.url) expect(src.url.startsWith('https://')).toBe(true);
  });
});

describe('validation gate', () => {
  it('rejects a gyrus whose lobe group does not list it', () => {
    const broken = structuredClone(def);
    const g = broken.structures.find((s) => s.id === 'left-precentral-gyrus')!;
    g.lobe = 'left-parietal-lobe';
    const r = validateDefinition(broken);
    expect(r.ok).toBe(false);
    expect(r.issues.map((i) => i.code)).toContain('group.lobe-mismatch');
  });

  it('rejects an unknown functional area and an unapproved asset', () => {
    const broken = structuredClone(def);
    broken.structures.find((s) => s.id === 'left-postcentral-gyrus')!.areas = ['left-made-up-area'];
    broken.assets = [{ id: 'some-other-model', role: 'anatomy-model' }];
    const codes = validateDefinition(broken).issues.map((i) => i.code);
    expect(codes).toContain('ref.area');
    expect(codes).toContain('asset.not-approved');
  });

  it('rejects code-like or http content through the schema', () => {
    const broken = structuredClone(def) as unknown as { sources: { url: string }[] };
    broken.sources[0]!.url = 'http://example.com/insecure';
    expect(validateDefinition(broken).ok).toBe(false);
  });
});

describe('cerebrospinal fluid streams', () => {
  const streams = buildCsfStreams();
  const inside = (p: number[], id: string, pad = 0.004) => {
    const [lo, hi] = geometry[id]!.bounds;
    return [0, 1, 2].every((a) => p[a]! >= lo![a]! - pad && p[a]! <= hi![a]! + pad);
  };

  it('has four streams per side, from each part of the lateral ventricle', () => {
    expect(streams.length).toBe(8);
    expect(new Set(streams.map((s) => s.origin))).toEqual(new Set(['anterior-horn', 'body', 'posterior-horn', 'inferior-horn']));
  });

  it('starts inside its own lateral ventricle, on its own side', () => {
    for (const s of streams) {
      const p = s.points[0]!;
      expect(inside(p, `${s.side}-lateral-ventricle`), s.id).toBe(true);
      expect(Math.sign(p[0]), s.id).toBe(s.side === 'left' ? 1 : -1);
    }
  });

  it('passes through the third ventricle, the aqueduct and the fourth ventricle in order, then leaves the model', () => {
    for (const s of streams) {
      expect(s.through).toEqual([`${s.side}-lateral-ventricle`, 'third-ventricle', 'cerebral-aqueduct', 'fourth-ventricle']);
      const idx = (id: string) => s.points.findIndex((p) => inside(p, id, 0.0015));
      const t = idx('third-ventricle'), a = idx('cerebral-aqueduct'), f = idx('fourth-ventricle');
      expect(t, s.id).toBeGreaterThan(0);
      expect(a, s.id).toBeGreaterThan(t);
      expect(f, s.id).toBeGreaterThan(a);
      expect(s.offModel.to).toBe(s.points.length - 1);
      const exit = s.points[s.points.length - 1]!;
      expect(inside(exit, 'fourth-ventricle', 0)).toBe(false);
    }
  });
});
