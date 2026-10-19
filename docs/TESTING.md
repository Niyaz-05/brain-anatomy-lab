# Testing

Results recorded on 2026-10-19 on Windows 11, Node 22.14.0, headless Chromium (Playwright 1.64, software WebGL via SwiftShader, which uses the automatic low-quality mode).

## Commands

| Check | Command | What it covers |
|---|---|---|
| Types | `npm run typecheck` | TypeScript strict, `noUncheckedIndexedAccess` |
| Unit | `npm test` | Definition validity and validation-gate rejections (lobe mismatch, unknown area, unapproved asset, insecure link); every node ↔ structure; 78 gyri each in exactly one lobe of its own hemisphere; 6 lobes per hemisphere; functional areas built from gyri, language areas left only; every left/right structure on its side; anatomical orientation; tour focus ids; CSF streams (8, from each part of the lateral ventricle, through third ventricle → aqueduct → fourth ventricle, leaving the model); reducer (lobe highlight, isolate, layers, cut clamping and flip, tour overrides, reset); search (Broca, thalamus, medulla, circle of Willis, Heschl) |
| Assets | `npm run validate:assets` | GLB sha256 = provenance, node set = geometry record, finite positions, unit normals, indices in range, triangle counts, baked `_TISSUE` on every mesh, attribution names HuBMAP, the authors, the DOI, Allen, BodyParts3D, DBCLS, CC BY 4.0 and the source and output hashes |
| Determinism | re-run `tools/extract-brain.mjs` then `tools/bake-shading.mjs` | Byte-identical `brain.glb` |
| Build | `npm run build` | Type check + production bundle |
| E2E | `npm run build && npm run e2e` | 17 scenarios below; screenshots in `docs/screenshots/` |

## E2E scenarios (`tests/e2e/lab.spec.ts`)

1. Loads with no console errors; real colours by default; no details sheet on the main screen.
2. Clicking the model selects the structure under the pointer.
3. Search: "Broca" + Enter selects Broca's area; "heschl" and "circle of willis" find their structures; no-match message; Escape restores the list.
4. A lobe lists its gyri; a gyrus links to its functional area.
5. Colour by Lobes and by Areas changes the rendered colours.
6. Layer toggles hide and show arteries and cortex.
7. Isolate, Zoom to and Reset.
8. Camera presets change the view (base view with the circle of Willis).
9. Labels mode: at least 3 labels, none overlapping, none from the far hemisphere.
10. Cut: coronal and axial cuts change the view, Flip keeps the other half, Off removes the slider; no console errors.
11. Inside view: the CSF panel with its 7-step route, Pause/Play, a route step selects its structure; no console errors.
12. Guided tour: 11 steps, Next/Back through the cut steps, jump to a step, Finish (marked slow: 8 camera flights and 2 cuts under software WebGL).
13. Phone 390×844: no horizontal overflow; Structures opens from the dock; picking closes it and shows the details.
14. About (ⓘ): HuBMAP, Allen and BodyParts3D credits, CC BY 4.0; Escape closes.
15. `?nowebgl`: fallback message; the list and details still work.
16. Missing model (HTTP 404): error alert; Try again refetches and loads.
17. Reduced motion: the inside view without errors.

## Results

| Check | Result |
|---|---|
| `npm run typecheck` | **Pass** |
| `npm test` | **Pass**: 24/24 in 2 files |
| `npm run validate:assets` | **Pass**: 149 nodes, 324,316 triangles, sha256 `fa4443f16203…` |
| Determinism | **Pass**: re-extraction gives the recorded unbaked sha256 (`c5f6a7b0…`) and re-baking the recorded final sha256 (`fa4443f1…`) |
| `npm run build` | **Pass**. JS bundle about 1.49 MB (about 414 kB gzip); Vite warns about chunk size |
| `npm run e2e` | **Pass**: 17/17. The full run (23.5 min) had 16/17; the tour test timed out at 4 min under software WebGL, was marked slow, and passed on re-run (6.5 min) |
| Live site (2026-10-19) | **Pass**: https://brain-anatomy-lab.vercel.app returns the page; `models/brain.glb` is served with the recorded sha256 `fa4443f1…`; the model renders in headless Chromium with no console errors |

## Defects found and fixed during QA

- **Mislabelled source parts.**
  - The `_L`/`_R` suffixes are on the opposite sides from the patient's. Sides are now assigned by position.
  - Three cortex parts are named for places they are not, and the "atrium" lies at the front. All are handled as recorded in `ATTRIBUTION.md`.
  - One of them, "frontal pole", rendered nothing when isolated; it turned out to be a thin sheet deep in the white matter.
- **Turning on a cut froze the page for ~45 s under software WebGL.**
  - The cap faces were 0.5 m squares covering the whole screen. They are now sized to each part's footprint.
  - The clipping plane stays attached so the tissue shaders never recompile.
- **The far hemisphere's labels showed through gaps.** They are hidden when the camera looks at one side.
- **The tour and inside-view tests were slow under software WebGL.** This led to the automatic low-quality mode, which drops the clear coat and sheen on software renderers and on sustained slow frames.

## Not verified

- **Physical devices and GPUs.** All browser tests used software WebGL. High quality was reviewed in headless screenshots with `?quality=high`; frame rate on a real laptop or phone is not measured.
- **Other browsers.** Firefox and Safari were not run.
- **Automated accessibility audit.** axe-core is not installed. Keyboard paths and ARIA labels were checked by hand and by E2E only.
- **Anatomical review.** Structure names follow the HuBMAP / Allen source, corrected by position where the source mislabels. The text was checked against OpenStax A&P 2e §13.2, 13.3, 16.2, 17.7 and 20.5. No anatomist or neuroscientist has reviewed it.
- **Functional areas are approximate.** They are drawn on whole gyri.
- **The artery fit is approximate.** BodyParts3D arteries are fitted with an RMS landmark misfit of 5.4 mm.
- **The CSF flow is schematic.** Steady speed, approximate foramen points, and no choroid plexus or subarachnoid space.
