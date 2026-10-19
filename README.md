# Human Brain — Interactive 3D Learning Lab

A realistic, interactive 3D human brain for secondary-school and first-year biology:

- **Real look.** Fresh-tissue colours, a moist sheen, and baked shading that darkens every sulcus. "Colour" switches to **Lobes** or functional **Areas** to teach the divisions.
- **Anatomy.** Select, search and isolate 78 gyri in 6 lobes per hemisphere, the motor, sensory, visual, auditory and language areas, the basal nuclei, thalamus, hypothalamus, hippocampus and amygdala, the brainstem, cerebellum, ventricles, optic and olfactory structures, and the arteries including the circle of Willis.
- **Cut.** Slice the brain side-to-side, front-to-back or top-to-bottom and move the cut. The cut faces are filled like a real specimen: grey cortex around white matter, with grey islands of deep nuclei.
- **Inside.** Fade the cortex to see the deep structures, and watch cerebrospinal fluid flow from the lateral ventricles through the third ventricle and cerebral aqueduct to the fourth ventricle and out.
- **Guided tour.** 11 steps from the lobes to the circle of Willis.

**Educational only.** This is not a clinical tool, and the text has not been reviewed by a physician. The brain model is the HuBMAP Human Reference Atlas female brain (Browne & Schlehlein, from the Allen human brain atlas) and the arteries are BodyParts3D (DBCLS), both CC BY 4.0; see [public/ATTRIBUTION.md](public/ATTRIBUTION.md).

## Run

Requires Node.js ≥ 22.12.

```sh
npm install
npm run dev            # http://localhost:5184
npm run build          # type-check + production build → dist/
npm run preview        # http://localhost:5185
```

Add `?quality=high` or `?quality=low` to the URL to force a rendering quality. By default the lab drops the costly wet coat and sheen on software renderers and when frames stay slow.

## Check

```sh
npm run typecheck
npm test                         # unit tests (Vitest)
npm run validate:assets          # model hash, nodes, geometry sanity, baked shading, attribution
npx playwright install chromium  # once
npm run build && npm run e2e     # browser tests (Playwright)
```

See [docs/TESTING.md](docs/TESTING.md) for results and what is not verified.

## Rebuild the brain model

`public/models/brain.glb` is generated:

1. Download the official HRA brain (12.0 MB) to `source/hra-brain-female-v1.4/3d-allen-f-brain.glb` from
   `https://cdn.humanatlas.io/digital-objects/ref-organ/brain-female/v1.4/assets/3d-allen-f-brain.glb`
   (sha256 `f20d87a347f8d5c6467439cba7db18f19307d29b2c3e0c2b6ddb7e9d49e1c1fc`).
2. Have a checkout of the Human Atlas (`github.com/Niyaz-05/human-atlas`). It supplies the BodyParts3D cerebral arteries.
3. Run:

```sh
node tools/extract-brain.mjs source/hra-brain-female-v1.4/3d-allen-f-brain.glb "<human-atlas>/public/models"
node tools/bake-shading.mjs
node tools/validate-assets.mjs
```

Both steps are deterministic, and the inputs and output are hashed in `src/brain/generated/provenance.json`. `tools/inspect-brain.mjs` lists every node of the source file.

## Layout

| Path | What |
|---|---|
| `src/contract/` | Simulation schema (zod), approved-asset registry, validation gate |
| `src/brain/` | Definition (structures, lobes, functional areas, CSF route, tour, sources), CSF streams, anchors, generated geometry and provenance |
| `src/app/` | Pure state reducer (modes, colour, cut), search, React context |
| `src/viewer/` | three.js / react-three-fiber scene: tissue material and lighting, brain model with cut caps, CSF particles, camera rig, labels |
| `src/ui/` | Panels: structures (with colour and cut controls), details, inside view, tour, About |
| `tools/` | Model inspection, extraction, shading bake and asset validation |
| `tests/unit`, `tests/e2e` | Vitest and Playwright suites |
