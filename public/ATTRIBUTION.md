# Attribution and asset provenance

## 3D brain model — `models/brain.glb`

### Sources

1. **3D Reference Organ for Brain, Female, v1.4**, HuBMAP Human Reference Atlas (HRA), by **Kristen Browne and Heidi Schlehlein**. DOI https://doi.org/10.48539/HBM674.NTLM.353. Licensed **CC BY 4.0** (https://creativecommons.org/licenses/by/4.0/).
   - File: `3d-allen-f-brain.glb` from `https://cdn.humanatlas.io/digital-objects/ref-organ/brain-female/v1.4/assets/3d-allen-f-brain.glb`
   - 11,983,380 bytes, sha256 `f20d87a347f8d5c6467439cba7db18f19307d29b2c3e0c2b6ddb7e9d49e1c1fc`
   - According to its dataset page, it was created from the **Allen** human brain reference atlas (Ding et al. 2016, *J Comp Neurol* 524:3127–3481, https://doi.org/10.1002/cne.24080): 141 structures mirrored to a whole brain and sized to the Visible Human bodies. It also contains the optic chiasm of the HRA female body.
   - Provides all brain tissue, the ventricles, the optic chiasm and tracts, and the olfactory bulbs and tracts.
2. **BodyParts3D 4.0**, © The **Database Center for Life Science** (DBCLS), licensed **CC BY 4.0**. https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
   - 147 cerebral artery parts, taken as converted by *Human Atlas* (github.com/Niyaz-05/human-atlas, commit `76f069640f2c3dd40a58d1556896ac25008f592e`).
   - Provides the internal carotid, vertebral, basilar, anterior, middle and posterior cerebral, communicating and cerebellar arteries.

Neither HuBMAP, the Allen Institute nor DBCLS has reviewed or endorsed this lab.

### Changes made (as CC BY 4.0 requires)

`tools/extract-brain.mjs`:

- selected and merged the source meshes listed in `src/brain/source/structures.source.json` into 149 structures (for example, the thalamic nuclei into one thalamus, and the artery branches into the named arteries);
- welded coincident vertices; simplified each mesh with meshoptimizer within a 0.4 % relative error bound (728,108 → 324,316 triangles); recomputed smooth normals;
- **registered the BodyParts3D arteries onto the HRA brain** with an affine transform fitted by least squares on the centroids of 23 structures present in both models (RMS misfit 5.4 mm; the arteries lie a median 1.6–3 mm from the brain surface);
- translated the model so the centre of the brain is the origin.

`tools/bake-shading.mjs` then added a per-vertex attribute (`_TISSUE`: ambient occlusion and colour variation) used by the real-tissue rendering. The unbaked model has sha256 `c5f6a7b025502100ea1a2b17d62022922b74050b269f4fd9bcf778ef9905cf99`.

**Corrections to the source labels**, each decided by position:

- **Side swap.** Source nodes ending `_L` lie on the patient's **right** (the same side as the right lung and BodyParts3D's "Right" parts), so they are labelled right here, and `_R` is labelled left.
- **"Posteroventral putamen"** lies on the medial surface of the upper frontal lobe. It is named "Medial upper frontal cortex".
- **"Frontomarginal gyrus"** lies low on the temporal lobe. It is named "Lower temporal cortex".
- **"Frontal pole"** is a thin sheet deep in the posterior white matter. It is merged into the cerebral white matter.
- **"Atrium of lateral ventricle"** lies in front of the anterior horn. It is kept as part of the lateral ventricle but not used as a CSF route point.

Output `brain.glb` has sha256 `fa4443f16203d4c71fcacbcffa1fff95f1a45eafff8621897a50c3aa34637a5f`. The full record is in `src/brain/generated/provenance.json`.

## Explanatory text

Written for this project and checked against the sources cited in the lab (OpenStax *Anatomy and Physiology 2e*, CC BY 4.0). No source text is reproduced.

## Software

React, three.js, three-mesh-bvh, @react-three/fiber, @react-three/drei and zod (all MIT), each under its own licence.
