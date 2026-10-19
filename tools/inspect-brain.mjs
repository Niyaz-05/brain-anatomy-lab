#!/usr/bin/env node
/**
 * List the nodes of the official HRA brain GLB: name, triangles, bounds, centroid and whether the
 * mesh is closed (every edge shared by exactly two triangles), which slicing needs.
 *
 *   node tools/inspect-brain.mjs <3d-allen-f-brain.glb> [--json out.json]
 */
import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';

const [file, flag, out] = process.argv.slice(2);
if (!file) {
  console.error('Usage: node tools/inspect-brain.mjs <brain GLB> [--json out.json]');
  process.exit(2);
}
const doc = await new NodeIO().readBinary(new Uint8Array(fs.readFileSync(file)));
const rows = [];
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const w = node.getWorldMatrix();
  let tris = 0, verts = 0;
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity], c = [0, 0, 0];
  let open = 0;
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION').getArray();
    const idx = prim.getIndices()?.getArray() ?? Uint32Array.from({ length: pos.length / 3 }, (_, i) => i);
    // Weld by position so split normals/UV seams do not count as open edges.
    const key = new Map(), id = new Uint32Array(pos.length / 3);
    for (let i = 0; i < pos.length / 3; i++) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      const wx = w[0] * x + w[4] * y + w[8] * z + w[12], wy = w[1] * x + w[5] * y + w[9] * z + w[13], wz = w[2] * x + w[6] * y + w[10] * z + w[14];
      const k = `${Math.round(wx * 1e6)},${Math.round(wy * 1e6)},${Math.round(wz * 1e6)}`;
      if (!key.has(k)) {
        key.set(k, key.size);
        lo[0] = Math.min(lo[0], wx); lo[1] = Math.min(lo[1], wy); lo[2] = Math.min(lo[2], wz);
        hi[0] = Math.max(hi[0], wx); hi[1] = Math.max(hi[1], wy); hi[2] = Math.max(hi[2], wz);
        c[0] += wx; c[1] += wy; c[2] += wz;
      }
      id[i] = key.get(k);
    }
    verts += key.size;
    tris += idx.length / 3;
    const edges = new Map();
    for (let t = 0; t < idx.length; t += 3) {
      for (const [a, b] of [[idx[t], idx[t + 1]], [idx[t + 1], idx[t + 2]], [idx[t + 2], idx[t]]]) {
        const p = id[a], q = id[b];
        const e = p < q ? `${p}_${q}` : `${q}_${p}`;
        edges.set(e, (edges.get(e) ?? 0) + 1);
      }
    }
    for (const n of edges.values()) if (n !== 2) open++;
  }
  rows.push({
    name: node.getName(),
    triangles: tris,
    vertices: verts,
    centroid: c.map((v) => +(v / verts).toFixed(4)),
    size: hi.map((h, a) => +(h - lo[a]).toFixed(4)),
    closed: open === 0,
    openEdges: open,
  });
}
rows.sort((a, b) => a.name.localeCompare(b.name));
for (const r of rows) {
  console.log(`${r.closed ? 'closed' : `OPEN(${r.openEdges})`.padEnd(6)}\t${String(r.triangles).padStart(6)}\t${r.centroid.join(',')}\t${r.size.join('x')}\t${r.name}`);
}
console.log(`\n${rows.length} mesh nodes, ${rows.reduce((n, r) => n + r.triangles, 0)} triangles, ${rows.filter((r) => r.closed).length} closed`);
if (flag === '--json' && out) fs.writeFileSync(out, JSON.stringify(rows, null, 2) + '\n');
