# Architecture

The brain lab shares the heart and lungs labs' design: a validated, data-only **`SimulationDefinition`** rendered by a generic viewer. The code is a deliberate copy, not a shared package, so each lab deploys independently.

## Differences from the lungs lab

| Area | Brain |
|---|---|
| Contract | Groups have a `role`: `lobe` (6 per hemisphere) or `area` (functional areas). Meshes name their `lobe` and `areas`. A `csfRoute` (steps, facts, assumptions) replaces the air route and breathing model. Tour steps can set `inside`, a `slice` and a `colourBy` |
| Validation | A mesh's `lobe` and `areas` must agree with the groups that list it, groups need a role, and the CSF route and its sources must exist, on top of the shared checks |
| State | Modes `explore` / `inside` / `tour`; `colourBy` (real / lobe / area); `slice` (axis, position −1…1, flip). `effectiveColourBy`, `effectiveSlice` and `insideActive` let a tour step override the learner's settings without changing them |
| Cut | One `THREE.Plane` is attached to every tissue material at all times; with no cut it is parked outside the model, so turning a cut on never recompiles the tissue shaders. Each part also has stencil-capping helpers (three.js' clipping-stencil technique): back faces behind the cut add 1, front faces subtract 1, and a face drawn where the count is non-zero fills the cut in that tissue's colour. Caps are sized to each part's footprint and shown only where the plane crosses a solid, visible part. Picking and labels ignore hits on the removed side |
| Inside view | Cortex, white matter and the cerebellar hemispheres fade to 7 %; arteries and nerves to 15 %; the ventricles take a slightly stronger fluid tint |
| CSF | `src/brain/csf.ts` builds 8 streams (4 per side, one from each part of the lateral ventricle) from measured geometry: interior points of the ventricle parts, an approximate interventricular-foramen point, the third-ventricle and aqueduct centrelines, the fourth ventricle, and an off-model exit. Particles move at a steady schematic speed |
| Labels | Labels mode labels lobes and the non-cortical structures. Labels of the far hemisphere are hidden when the camera looks at one side |

## The real-tissue look (shared with the heart and lungs labs)

`src/viewer/tissue.ts` and `src/viewer/Lighting.tsx` are the same files in all three labs.

- **Material.** `MeshPhysicalMaterial` with a clear coat (moist surface) and sheen (velvety tissue), plus a shader hook that:
  - reads the baked `_TISSUE` attribute;
  - darkens folds by ambient occlusion, including their reflections;
  - varies the colour with noise;
  - tints fat where the bake marked it;
  - adds a soft warm rim where the surface turns away, a cheap stand-in for light scattering under living tissue.
- **Lighting.** Image-based light from three's built-in `RoomEnvironment` (no download), a warm key, a soft back light and a fill. Neutral tone mapping keeps reds true.
- **Quality.**
  - **High:** draws the coat and sheen.
  - **Low:** leaves them out, so three.js compiles a much cheaper shader.
  - **Choosing:** low is picked on software renderers and when animation frames stay above 50 ms. `?quality=high|low` overrides it.
- **Bake.** `tools/bake-shading.mjs` writes `_TISSUE` (normalised RGBA bytes) into the GLB:
  - **r:** ambient occlusion. 48 fixed rays per vertex through a `three-mesh-bvh` tree, against the layers `tools/bake.config.json` lists for that layer, so inner structures are not darkened by the cortex around them.
  - **g:** value noise.
  - **b:** a fat mask, near the listed vessels and in concave grooves.

  It is deterministic, and it updates the output hash in `provenance.json`.

## Asset pipeline

```
HRA brain-female v1.4 GLB (official, 12 MB, 283 meshes) ─────┐
                                                               ├─ tools/extract-brain.mjs ─▶ brain.glb (149 nodes, 324k triangles)
BodyParts3D 4.0 cerebral arteries (via Human Atlas, 147 parts) ┘     affine fit of the arteries onto the brain (23 shared landmarks)
                                                                        │
                                              tools/bake-shading.mjs ◀──┘ ─▶ public/models/brain.glb (6.6 MB) · geometry.json · provenance.json
```

**Source labelling defects, and how they are handled** (every one decided by position, and recorded in `provenance.json` and `ATTRIBUTION.md`):

- **The `_L`/`_R` suffixes are swapped relative to the patient.** `_L` lies on the patient's right, the same side as the right lung and BodyParts3D's "Right" parts. Sides are assigned by position and checked; a mismatch fails the extraction.
- **Three cortex parts are named for places they are not:**
  - "posteroventral putamen" is the medial upper frontal cortex;
  - "frontomarginal gyrus" is the lower temporal cortex;
  - "frontal pole" is a thin sheet deep in the posterior white matter, merged into the white matter.
- **The "atrium of lateral ventricle" lies in front of the anterior horn.** It is kept in the ventricle but not used for the CSF route.

**Artery fit.** The landmark misfit is 5.4 mm RMS. Part of that is because the two models outline the landmark structures differently, for example the insula. The arteries lie a median 1.6–3 mm from the brain surface, which is about one vessel radius.
