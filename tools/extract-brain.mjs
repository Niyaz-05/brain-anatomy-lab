#!/usr/bin/env node
/**
 * Build public/models/brain.glb from the HRA brain and BodyParts3D cerebral arteries.
 *
 *   node tools/extract-brain.mjs <official brain GLB> <Human Atlas models dir>
 *
 *   <official brain GLB>  3d-allen-f-brain.glb, HRA "3D Reference Organ for Brain, Female" v1.4
 *   <models dir>          repo4-human-atlas/public/models (atlas.json + *.bin): BodyParts3D 4.0,
 *                         metres, Y-up, +x = patient's left. Only the cerebral arteries are used.
 *
 * Per mesh: weld coincident vertices, simplify with meshoptimizer within a 0.2 % relative error
 * bound, merge into one node per structure (structures.source.json), recompute smooth normals.
 * The arteries are registered onto the HRA brain by an affine transform fitted by least squares
 * on the centroids of structures both sources share.
 * Writes public/models/brain.glb, src/brain/generated/geometry.json and provenance.json.
 * Fails loudly on a missing node, non-finite data, or a structure on the wrong side.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Document, NodeIO } from '@gltf-transform/core';
import { MeshoptSimplifier } from 'meshoptimizer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [brainPath, modelsDir] = process.argv.slice(2);
if (!brainPath || !modelsDir) {
  console.error('Usage: node tools/extract-brain.mjs <3d-allen-f-brain.glb> <human-atlas public/models dir>');
  process.exit(2);
}
await MeshoptSimplifier.ready;

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const r6 = (v) => Math.round(v * 1e6) / 1e6;
const spec = JSON.parse(fs.readFileSync(path.join(root, 'src/brain/source/structures.source.json'), 'utf8'));
const RIGHT = spec.allenRightSuffix; // the source suffix that lies on the patient's right
const LEFT = RIGHT === '_L' ? '_R' : '_L';
const MAX_ERROR = 0.004;

// ── Sources ────────────────────────────────────────────────────────────────
const brainBytes = fs.readFileSync(brainPath);
const brainDoc = await new NodeIO().readBinary(new Uint8Array(brainBytes));
const brainNodes = new Map(brainDoc.getRoot().listNodes().map((n) => [n.getName(), n]));

const atlasBytes = fs.readFileSync(path.join(modelsDir, 'atlas.json'));
const atlas = JSON.parse(atlasBytes.toString('utf8'));
const chunkCache = new Map();
const chunkHashes = {};
function chunk(i) {
  if (!chunkCache.has(i)) {
    const file = path.join(modelsDir, atlas.chunks[i].url.split('/').pop());
    const buf = fs.readFileSync(file);
    chunkCache.set(i, buf);
    chunkHashes[path.basename(file)] = sha256(buf);
  }
  return chunkCache.get(i);
}

/** Raw world-space positions and indices of one HRA brain node. */
function readHra(name) {
  const node = brainNodes.get(name);
  const mesh = node?.getMesh();
  if (!mesh) throw new Error(`brain GLB: node "${name}" missing or has no mesh`);
  const w = node.getWorldMatrix();
  const positions = [], indices = [];
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION').getArray();
    const idx = prim.getIndices()?.getArray() ?? Uint32Array.from({ length: pos.length / 3 }, (_, i) => i);
    const base = positions.length / 3;
    for (let i = 0; i < pos.length; i += 3) {
      const [x, y, z] = [pos[i], pos[i + 1], pos[i + 2]];
      positions.push(w[0] * x + w[4] * y + w[8] * z + w[12], w[1] * x + w[5] * y + w[9] * z + w[13], w[2] * x + w[6] * y + w[10] * z + w[14]);
    }
    for (const i of idx) indices.push(i + base);
  }
  return { positions: Float32Array.from(positions), indices: Uint32Array.from(indices) };
}

/** Raw positions and indices of one BodyParts3D part (Human Atlas frame). */
function readBp3d(part) {
  const b = chunk(part.chunk);
  const positions = new Float32Array(b.buffer.slice(b.byteOffset + part.positions, b.byteOffset + part.positions + part.vertexCount * 12));
  const indices = new Uint32Array(b.buffer.slice(b.byteOffset + part.indices, b.byteOffset + part.indices + part.indexCount * 4));
  return { positions, indices };
}

// ── Mesh clean-up ───────────────────────────────────────────────────────────
function weld(positions, indices) {
  const map = new Map(), remap = new Uint32Array(positions.length / 3), out = [];
  for (let i = 0; i < positions.length / 3; i++) {
    const key = `${Math.round(positions[i * 3] * 1e6)},${Math.round(positions[i * 3 + 1] * 1e6)},${Math.round(positions[i * 3 + 2] * 1e6)}`;
    let k = map.get(key);
    if (k === undefined) { k = out.length / 3; map.set(key, k); out.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]); }
    remap[i] = k;
  }
  const idx = [];
  for (let t = 0; t < indices.length; t += 3) {
    const a = remap[indices[t]], b = remap[indices[t + 1]], c = remap[indices[t + 2]];
    if (a !== b && b !== c && a !== c) idx.push(a, b, c); // drop degenerate triangles
  }
  return { positions: Float32Array.from(out), indices: Uint32Array.from(idx) };
}

function smoothNormals(positions, indices) {
  const n = new Float32Array(positions.length);
  for (let t = 0; t < indices.length; t += 3) {
    const [a, b, c] = [indices[t] * 3, indices[t + 1] * 3, indices[t + 2] * 3];
    const e1 = [positions[b] - positions[a], positions[b + 1] - positions[a + 1], positions[b + 2] - positions[a + 2]];
    const e2 = [positions[c] - positions[a], positions[c + 1] - positions[a + 1], positions[c + 2] - positions[a + 2]];
    const f = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; // area-weighted
    for (const v of [a, b, c]) { n[v] += f[0]; n[v + 1] += f[1]; n[v + 2] += f[2]; }
  }
  for (let i = 0; i < n.length; i += 3) {
    const len = Math.hypot(n[i], n[i + 1], n[i + 2]);
    if (len > 0) { n[i] /= len; n[i + 1] /= len; n[i + 2] /= len; } else { n[i + 1] = 1; }
  }
  return n;
}

function simplify(positions, indices) {
  const target = Math.min(indices.length, Math.max(96, Math.floor((indices.length * 0.25) / 3) * 3));
  const [simplified, error] = MeshoptSimplifier.simplify(indices, positions, 3, target, MAX_ERROR);
  const used = new Map(), pos = [];
  const idx = new Uint32Array(simplified.length);
  for (let i = 0; i < simplified.length; i++) {
    const v = simplified[i];
    let k = used.get(v);
    if (k === undefined) { k = pos.length / 3; used.set(v, k); pos.push(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]); }
    idx[i] = k;
  }
  return { positions: Float32Array.from(pos), indices: idx, error };
}

function mergePieces(pieces) {
  const vCount = pieces.reduce((n, p) => n + p.positions.length / 3, 0);
  const positions = new Float32Array(vCount * 3), indices = new Uint32Array(pieces.reduce((n, p) => n + p.indices.length, 0));
  let vo = 0, io = 0;
  for (const p of pieces) {
    positions.set(p.positions, vo * 3);
    for (let k = 0; k < p.indices.length; k++) indices[io + k] = p.indices[k] + vo;
    vo += p.positions.length / 3; io += p.indices.length;
  }
  return { positions, indices };
}

const bboxOf = (pos) => {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], pos[i + a]); hi[a] = Math.max(hi[a], pos[i + a]); }
  return [lo, hi];
};
function centroid(pos) {
  const c = [0, 0, 0], n = pos.length / 3;
  for (let i = 0; i < pos.length; i += 3) for (let a = 0; a < 3; a++) c[a] += pos[i + a] / n;
  return c;
}

// ── Expand the structure list ───────────────────────────────────────────────
const expanded = [];
for (const s of spec.structures) {
  const base = { layer: s.layer, provisional: s.provisional };
  if (s.paired) {
    for (const side of ['right', 'left']) {
      const suffix = side === 'right' ? RIGHT : LEFT;
      expanded.push({ ...base, id: `${side}-${s.id}`, base: s.id, side, allen: s.allen?.map((n) => `Allen_${n}${suffix}`), bp3d: s.bp3d });
    }
  } else {
    const nodes = s.allen?.flatMap((n) => [`Allen_${n}_L`, `Allen_${n}_R`]) ?? s.hra;
    expanded.push({ ...base, id: s.id, base: s.id, side: 'midline', allen: nodes, bp3d: s.bp3d });
  }
}

// BodyParts3D cerebral arteries: match names, take the side from the id ("M" = mirrored = left).
const bp3dCandidates = atlas.parts.filter((p) => p.system === 'arterial' && p.bounds[0][1] > 1.5 && !/ophthalmic|ciliary|retinal/i.test(p.name));
const bp3dUsed = new Set();
for (const s of expanded) {
  if (!s.bp3d) continue;
  const res = s.bp3d.map((r) => new RegExp(r, 'i'));
  s.parts = bp3dCandidates.filter((p) => {
    if (bp3dUsed.has(p.id) || !res.some((re) => re.test(p.name))) return false;
    if (s.side === 'midline') return true;
    return (s.side === 'left') === p.id.endsWith('M');
  });
  if (!s.parts.length) throw new Error(`${s.id}: no BodyParts3D part matches ${s.bp3d.join(' | ')}`);
  s.parts.forEach((p) => bp3dUsed.add(p.id));
}
const unmatched = bp3dCandidates.filter((p) => !bp3dUsed.has(p.id) && /cerebr|cerebell|communicating|basilar|vertebral|carotid|callos|occipital artery|temporal|parietal|frontobasal|sulcus|choroidal|thalam|splenial|pontine|spinal|prefrontal|vermian/i.test(p.name));
if (unmatched.length) console.warn(`Unassigned cerebral arteries (left out): ${unmatched.map((p) => `${p.id} ${p.name}`).join('; ')}`);

// ── Build HRA structures ────────────────────────────────────────────────────
let sourceTriangles = 0, maxError = 0;
const nodeUse = new Map();
const rawCache = new Map();
function rawHra(name) {
  if (!rawCache.has(name)) {
    const raw = readHra(name);
    for (const v of raw.positions) if (!Number.isFinite(v)) throw new Error(`${name}: non-finite position`);
    for (const i of raw.indices) if (i >= raw.positions.length / 3) throw new Error(`${name}: index out of range`);
    rawCache.set(name, raw);
  }
  return rawCache.get(name);
}
function build(raws) {
  const pieces = raws.map((raw) => {
    sourceTriangles += raw.indices.length / 3;
    const welded = weld(raw.positions, raw.indices);
    const simple = simplify(welded.positions, welded.indices);
    maxError = Math.max(maxError, simple.error);
    return simple;
  });
  return mergePieces(pieces);
}
const meshes = [];
for (const s of expanded.filter((x) => x.allen)) {
  for (const n of s.allen) {
    if (nodeUse.has(n)) throw new Error(`${n} used by both ${nodeUse.get(n)} and ${s.id}`);
    nodeUse.set(n, s.id);
  }
  meshes.push({ structure: s, ...build(s.allen.map(rawHra)) });
}
const unusedNodes = [...brainNodes.keys()].filter((n) => brainNodes.get(n).getMesh() && !nodeUse.has(n));
if (unusedNodes.length) throw new Error(`Brain nodes not mapped to any structure: ${unusedNodes.join(', ')}`);

// ── Register the BodyParts3D arteries onto the HRA brain ────────────────────
const byId = new Map(meshes.map((m) => [m.structure.id, m]));
const reg = spec.registration.pairs.map(([bpName, target]) => {
  const parts = atlas.parts.filter((p) => p.name === bpName);
  if (!parts.length) throw new Error(`registration: BodyParts3D "${bpName}" not found`);
  const src = centroid(mergePieces(parts.map(readBp3d)).positions);
  const ids = Array.isArray(target) ? target : [target];
  const tgtMeshes = ids.map((id) => byId.get(id) ?? (() => { throw new Error(`registration: no structure ${id}`); })());
  const dst = centroid(mergePieces(tgtMeshes).positions);
  return { bpName, target: ids, src, dst };
});
// Affine least squares: dst = A · [x, y, z, 1] (scale, rotation and shear; the two heads differ
// slightly in size and pitch). Solved per output axis from the 4×4 normal equations.
function solve4(M, b) {
  const a = M.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < 4; c++) {
    let p = c;
    for (let r = c + 1; r < 4; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
    [a[c], a[p]] = [a[p], a[c]];
    for (let r = 0; r < 4; r++) {
      if (r === c) continue;
      const f = a[r][c] / a[c][c];
      for (let k = c; k < 5; k++) a[r][k] -= f * a[c][k];
    }
  }
  return a.map((row, i) => row[4] / row[i]);
}
const hom = reg.map((r) => [...r.src, 1]);
const AtA = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => hom.reduce((q, h) => q + h[i] * h[j], 0)));
const affine = [0, 1, 2].map((a) => solve4(AtA, [0, 1, 2, 3].map((i) => hom.reduce((q, h, k) => q + h[i] * reg[k].dst[a], 0))));
const applyAffine = (x, y, z) => affine.map((w) => w[0] * x + w[1] * y + w[2] * z + w[3]);
const residuals = reg.map((r) => ({ landmark: r.bpName, mm: r6(Math.hypot(...applyAffine(...r.src).map((v, a) => v - r.dst[a])) * 1000) }));
const rms = Math.sqrt(residuals.reduce((q, r) => q + r.mm ** 2, 0) / residuals.length);
if (rms > 6) throw new Error(`Artery registration too poor: RMS ${rms.toFixed(2)} mm\n${JSON.stringify(residuals)}`);

for (const s of expanded.filter((x) => x.parts)) {
  const raws = s.parts.map((p) => {
    const raw = readBp3d(p);
    const pos = new Float32Array(raw.positions.length);
    for (let i = 0; i < pos.length; i += 3) pos.set(applyAffine(raw.positions[i], raw.positions[i + 1], raw.positions[i + 2]), i);
    for (const v of pos) if (!Number.isFinite(v)) throw new Error(`${p.id}: non-finite position`);
    return { positions: pos, indices: raw.indices };
  });
  meshes.push({ structure: s, ...build(raws) });
}

// Centre on the brain itself (not the arteries), so the vertebral arteries do not move the pivot.
const tissue = meshes.filter((m) => m.structure.layer !== 'artery').map((m) => bboxOf(m.positions));
const centre = [0, 1, 2].map((a) => (Math.min(...tissue.map((b) => b[0][a])) + Math.max(...tissue.map((b) => b[1][a]))) / 2);
for (const m of meshes) {
  for (let i = 0; i < m.positions.length; i += 3) for (let a = 0; a < 3; a++) m.positions[i + a] -= centre[a];
  m.normals = smoothNormals(m.positions, m.indices);
}

// ── Geometry facts ──────────────────────────────────────────────────────────
function covariance(pos, c) {
  const m = new Array(9).fill(0), n = pos.length / 3;
  for (let i = 0; i < pos.length; i += 3) {
    const d = [pos[i] - c[0], pos[i + 1] - c[1], pos[i + 2] - c[2]];
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) m[r * 3 + k] += (d[r] * d[k]) / n;
  }
  return m;
}
function principalAxis(m) {
  let v = [1, 0.5, 0.25];
  for (let it = 0; it < 100; it++) {
    const w = [0, 1, 2].map((r) => m[r * 3] * v[0] + m[r * 3 + 1] * v[1] + m[r * 3 + 2] * v[2]);
    const len = Math.hypot(...w); v = w.map((x) => x / len);
  }
  return v;
}
function crossings(pos, idx, o, d) {
  let n = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const e1 = [pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]];
    const e2 = [pos[c] - pos[a], pos[c + 1] - pos[a + 1], pos[c + 2] - pos[a + 2]];
    const p = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]];
    const det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
    if (Math.abs(det) < 1e-14) continue;
    const s = [o[0] - pos[a], o[1] - pos[a + 1], o[2] - pos[a + 2]];
    const u = (s[0] * p[0] + s[1] * p[1] + s[2] * p[2]) / det;
    if (u < 0 || u > 1) continue;
    const q = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
    const v = (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]) / det;
    if (v < 0 || u + v > 1) continue;
    if ((e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) / det > 0) n++;
  }
  return n;
}
const DIRS = [[1, 0.0013, 0.0007], [0.0011, 1, 0.0017], [0.0009, 0.0015, 1]];
const inside = (pos, idx, p) => DIRS.filter((d) => crossings(pos, idx, p, d) % 2 === 1).length >= 2;
function interiorPoint(pos, idx, N = 11) {
  const [lo, hi] = bboxOf(pos);
  let best = null, bestDist = -1;
  for (let i = 1; i < N; i++) for (let j = 1; j < N; j++) for (let k = 1; k < N; k++) {
    const p = [lo[0] + ((hi[0] - lo[0]) * i) / N, lo[1] + ((hi[1] - lo[1]) * j) / N, lo[2] + ((hi[2] - lo[2]) * k) / N];
    let dmin = Infinity;
    for (let v = 0; v < pos.length; v += 3) dmin = Math.min(dmin, Math.hypot(pos[v] - p[0], pos[v + 1] - p[1], pos[v + 2] - p[2]));
    if (dmin <= bestDist || !inside(pos, idx, p)) continue;
    best = p; bestDist = dmin;
  }
  return best ? { point: best, clearance: bestDist } : null;
}
function centreline(pos, c, axis, slices = 6) {
  const proj = [];
  for (let v = 0; v < pos.length; v += 3) proj.push((pos[v] - c[0]) * axis[0] + (pos[v + 1] - c[1]) * axis[1] + (pos[v + 2] - c[2]) * axis[2]);
  let min = Infinity, max = -Infinity;
  for (const t of proj) { if (t < min) min = t; if (t > max) max = t; }
  const pts = [];
  for (let s = 0; s < slices; s++) {
    const a = min + ((max - min) * s) / slices, b = min + ((max - min) * (s + 1)) / slices;
    const acc = [0, 0, 0]; let n = 0;
    proj.forEach((t, i) => { if (t >= a && t <= b) { acc[0] += pos[i * 3]; acc[1] += pos[i * 3 + 1]; acc[2] += pos[i * 3 + 2]; n++; } });
    if (n) pts.push(acc.map((x) => x / n));
  }
  return pts;
}

const geometry = {};
const sideErrors = [];
const MIDLINE_X = 0; // the model is centred on the brain's bounding box
for (const m of meshes) {
  const s = m.structure;
  const [lo, hi] = bboxOf(m.positions);
  const c = centroid(m.positions);
  const axis = principalAxis(covariance(m.positions, c));
  // Side check: +x is the patient's left (the same frame as the HRA lungs and BodyParts3D).
  if (s.side === 'right' && !(c[0] < MIDLINE_X)) sideErrors.push(`${s.id} claims right but centroid x = ${c[0].toFixed(4)}`);
  if (s.side === 'left' && !(c[0] > MIDLINE_X)) sideErrors.push(`${s.id} claims left but centroid x = ${c[0].toFixed(4)}`);
  if (s.side === 'midline' && Math.abs(c[0]) > 0.006) sideErrors.push(`${s.id} claims midline but centroid x = ${c[0].toFixed(4)}`);
  let nearest = 0, nearestD = Infinity;
  for (let i = 0; i < m.positions.length; i += 3) {
    const d = Math.hypot(m.positions[i] - c[0], m.positions[i + 1] - c[1], m.positions[i + 2] - c[2]);
    if (d < nearestD) { nearestD = d; nearest = i; }
  }
  const entry = {
    layer: s.layer,
    side: s.side,
    bounds: [lo.map(r6), hi.map(r6)],
    centroid: c.map(r6),
    principalAxis: axis.map(r6),
    surfaceAnchor: [m.positions[nearest], m.positions[nearest + 1], m.positions[nearest + 2]].map(r6),
    vertexCount: m.positions.length / 3,
    triangleCount: m.indices.length / 3,
  };
  if (s.layer === 'artery' || s.id === 'cerebral-aqueduct' || s.id === 'third-ventricle') entry.centreline = centreline(m.positions, c, axis).map((p) => p.map(r6));
  geometry[s.id] = entry;
}
if (sideErrors.length) throw new Error(`Side checks failed:\n${sideErrors.join('\n')}`);

// CSF landmarks: interior points of the ventricle parts, before merging, in the centred frame.
const csfParts = {
  'anterior-horn': 'anterior_horn_of_lateral_ventricle',
  body: 'body_of_lateral_ventricle',
  // 'atrium_of_lateral_ventricle' is left out: in the source it lies in front of the anterior horn.
  'posterior-horn': 'posterior_horn_of_lateral_ventricle',
  'inferior-horn': 'inferior_horn_of_lateral_ventricle',
};
const shifted = (raw) => {
  const w = weld(raw.positions, raw.indices);
  const pos = new Float32Array(w.positions.length);
  for (let i = 0; i < pos.length; i += 3) for (let a = 0; a < 3; a++) pos[i + a] = w.positions[i + a] - centre[a];
  return { positions: pos, indices: w.indices };
};
const csf = {};
for (const side of ['right', 'left']) {
  csf[side] = {};
  for (const [key, stem] of Object.entries(csfParts)) {
    const raw = shifted(rawHra(`Allen_${stem}${side === 'right' ? RIGHT : LEFT}`));
    const ip = interiorPoint(raw.positions, raw.indices);
    if (!ip) throw new Error(`CSF: no interior point in ${side} ${key}`);
    csf[side][key] = ip.point.map(r6);
  }
}
for (const id of ['third-ventricle', 'fourth-ventricle']) {
  const m = byId.get(id);
  const ip = interiorPoint(m.positions, m.indices, 15);
  if (!ip) throw new Error(`CSF: no interior point in ${id}`);
  csf[id] = ip.point.map(r6);
}
geometry.$csf = csf;

const g = (id) => geometry[id];
const checks = {
  frontalInFrontOfOccipital: g('left-superior-frontal-gyrus').centroid[2] > g('left-cuneus').centroid[2],
  cerebellumBelowCerebrum: g('vermis').centroid[1] < g('corpus-callosum').centroid[1],
  cerebellumBehindBrainstem: g('vermis').centroid[2] < g('pons').centroid[2],
  ponsAboveMedulla: g('pons').centroid[1] > g('medulla-oblongata').centroid[1],
  precentralInFrontOfPostcentral: g('left-precentral-gyrus').centroid[2] > g('left-postcentral-gyrus').centroid[2],
  temporalBelowParietal: g('left-middle-temporal-gyrus').centroid[1] < g('left-supramarginal-gyrus').centroid[1],
  basilarInFrontOfPons: g('basilar-artery').centroid[2] > g('pons').centroid[2] - 0.004,
};
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
if (failed.length) throw new Error(`Orientation checks failed: ${failed.join(', ')}`);

// ── Write ───────────────────────────────────────────────────────────────────
const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene('brain');
for (const m of meshes) {
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(m.positions).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(m.normals).setBuffer(buffer))
    // 16-bit indices where they fit: a third smaller download.
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(m.positions.length / 3 < 65536 ? Uint16Array.from(m.indices) : m.indices).setBuffer(buffer));
  const s = m.structure;
  const node = doc.createNode(s.id).setMesh(doc.createMesh(s.id).addPrimitive(prim))
    .setExtras({ layer: s.layer, source: s.parts ? 'bodyparts3d' : 'hra-brain', nodes: s.allen ?? s.parts.map((p) => p.id) });
  scene.addChild(node);
}
doc.getRoot().getAsset().generator = 'brain-anatomy-lab tools/extract-brain.mjs';
doc.getRoot().getAsset().copyright = 'HuBMAP HRA 3D Reference Organ for Brain (Browne, Schlehlein; Allen Institute data), CC BY 4.0; BodyParts3D (DBCLS), CC BY 4.0';
const outGlb = path.join(root, 'public/models/brain.glb');
fs.mkdirSync(path.dirname(outGlb), { recursive: true });
const glb = await new NodeIO().writeBinary(doc);
fs.writeFileSync(outGlb, glb);

let atlasCommit = null;
try { atlasCommit = execFileSync('git', ['-C', path.resolve(modelsDir, '../..'), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* not a git checkout */ }

const genDir = path.join(root, 'src/brain/generated');
fs.mkdirSync(genDir, { recursive: true });
fs.writeFileSync(path.join(genDir, 'geometry.json'), JSON.stringify({ units: 'metres', axes: { x: "patient's left", y: 'superior', z: 'anterior' }, structures: geometry }, null, 2) + '\n');
const triangles = meshes.reduce((n, m) => n + m.indices.length / 3, 0);
fs.writeFileSync(path.join(genDir, 'provenance.json'), JSON.stringify({
  output: { file: 'public/models/brain.glb', bytes: glb.byteLength, sha256: sha256(glb), triangles, sourceTriangles },
  sources: {
    brain: {
      name: '3D Reference Organ for Brain, Female, v1.4 (HuBMAP Human Reference Atlas)',
      creators: 'Kristen Browne, Heidi Schlehlein',
      doi: 'https://doi.org/10.48539/HBM674.NTLM.353',
      license: 'CC-BY-4.0',
      url: 'https://cdn.humanatlas.io/digital-objects/ref-organ/brain-female/v1.4/assets/3d-allen-f-brain.glb',
      bytes: brainBytes.byteLength,
      sha256: sha256(brainBytes),
      basedOn: 'Allen Human Reference Atlas – 3D (Ding et al. 2016, J Comp Neurol 524:3127–3481), mirrored to a whole brain and sized to the Visible Human Female',
      sideNote: `Source nodes ending ${RIGHT} lie on the patient's right (negative x), so they are labelled right here; every side is checked by position.`,
    },
    arteries: {
      name: 'BodyParts3D 4.0 cerebral arteries (Database Center for Life Science), via the Human Atlas build',
      license: 'CC-BY-4.0',
      intermediate: 'github.com/Niyaz-05/human-atlas, commit ' + atlasCommit,
      atlasJsonSha256: sha256(atlasBytes),
      chunkSha256: chunkHashes,
      parts: Object.fromEntries(expanded.filter((s) => s.parts).map((s) => [s.id, s.parts.map((p) => `${p.id} ${p.name}`)])),
      registration: {
        method: 'affine (3x4) least squares on the centroids of structures present in both sources',
        affineRows: affine.map((row) => row.map(r6)),
        rmsResidualMm: r6(rms),
        residuals,
      },
    },
  },
  changesHere: `Selected and merged the nodes in src/brain/source/structures.source.json (one node per structure); welded coincident vertices; simplified each source mesh with meshoptimizer within a ${MAX_ERROR * 100} % relative error bound (largest error used: ${(maxError * 100).toFixed(3)} %); recomputed smooth normals; registered the BodyParts3D arteries onto the HRA brain; translated so the centre of the brain's bounding box is the origin.`,
  centreOffsetMetres: centre.map(r6),
  orientationChecks: checks,
  provisionalNames: Object.fromEntries(spec.structures.filter((s) => s.provisional).map((s) => [s.id, s.provisional])),
  structures: expanded.map((s) => ({ id: s.id, nodes: s.allen ?? s.parts.map((p) => p.id) })),
}, null, 2) + '\n');

console.log(JSON.stringify({ structures: meshes.length, sourceTriangles, triangles, bytes: glb.byteLength, maxErrorPct: r6(maxError * 100), registrationRmsMm: r6(rms), residuals, checks }, null, 2));
