/**
 * The simulation contract (brain edition). A SimulationDefinition is plain, serialisable data: it
 * names approved assets by id, lists the structures and layers a learner can work with, and
 * declares the learning content (CSF route, tour, objectives). The runtime renders any definition
 * that passes these schemas and the cross-reference checks in validate.ts. Nothing in here may
 * carry a URL (except https source links), a file path or code.
 */
import { z } from 'zod';

/** Lower-case kebab-case ids keep definitions portable and safe to use as DOM/URL keys. */
export const Id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'ids are lower-case kebab-case').max(64);
const Text = (max: number) => z.string().trim().min(1).max(max);
const Vec3 = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);

export const Source = z.object({
  id: Id,
  citation: Text(400),
  url: z.url({ protocol: /^https$/ }).optional(),
  license: Text(80).optional(),
});
export type Source = z.infer<typeof Source>;

export const AssetRef = z.object({
  /** Key into the approved asset registry (assets.ts); never a path or URL. */
  id: Id,
  role: z.enum(['anatomy-model']),
});

export const Layer = z.object({
  id: Id,
  label: Text(60),
  description: Text(300),
  visibleByDefault: z.boolean(),
});
export type Layer = z.infer<typeof Layer>;

/** Groups: a lobe or hemisphere (anatomy), or a functional area of the cortex. */
export const GroupRole = z.enum(['hemisphere', 'lobe', 'area']);

export const AnatomicalStructure = z.object({
  id: Id,
  label: Text(80),
  synonyms: z.array(Text(80)).max(12),
  layer: Id,
  /** mesh: a node of the same id exists in the model. group: no geometry; stands for `members`. */
  kind: z.enum(['mesh', 'group']),
  members: z.array(Id).min(1).max(30).optional(),
  role: GroupRole.optional(),
  side: z.enum(['right', 'left', 'midline']),
  /** Lobe group this structure belongs to, if any. */
  lobe: Id.optional(),
  /** Functional-area groups this structure is part of. */
  areas: z.array(Id).max(4).optional(),
  summary: Text(400),
  function: Text(600),
  related: z.array(Id).max(12),
  /** What the 3D model does and does not show for this structure. */
  modelNote: Text(400).optional(),
  sources: z.array(Id).min(1).max(6),
});
export type AnatomicalStructure = z.infer<typeof AnatomicalStructure>;

export const CameraPreset = z.object({
  id: Id,
  label: Text(40),
  /** Unit-ish vector from the model centre towards the camera, in model axes. */
  direction: Vec3,
  up: Vec3.optional(),
});
export type CameraPreset = z.infer<typeof CameraPreset>;

/** One stage of the route cerebrospinal fluid takes; off-model stages are drawn schematically. */
export const CsfStep = z.object({
  structure: Id.optional(),
  offModel: z.enum(['interventricular-foramen', 'apertures', 'subarachnoid-space']).optional(),
  label: Text(80),
  note: Text(300).optional(),
}).refine((s) => (s.structure === undefined) !== (s.offModel === undefined), {
  message: 'a CSF step names exactly one of structure or offModel',
});
export type CsfStep = z.infer<typeof CsfStep>;

export const CsfRoute = z.object({
  id: Id,
  label: Text(80),
  description: Text(500),
  steps: z.array(CsfStep).min(2).max(20),
  /** Facts shown beside the animation; each cited in `sources`. */
  facts: z.array(Text(300)).max(8),
  assumptions: z.array(Text(300)).min(1).max(8),
  sources: z.array(Id).min(1).max(6),
});
export type CsfRoute = z.infer<typeof CsfRoute>;

export const SliceAxis = z.enum(['off', 'sagittal', 'coronal', 'axial']);
export type SliceAxis = z.infer<typeof SliceAxis>;

export const TourStep = z.object({
  id: Id,
  title: Text(80),
  body: Text(700),
  focus: z.array(Id).max(16),
  camera: Id.optional(),
  /** Show the inside view (cortex faded) and the CSF flow. */
  inside: z.boolean().optional(),
  /** Cut the brain for this step: axis and position (-1 … 1 across the brain). */
  slice: z.object({ axis: SliceAxis, at: z.number().min(-1).max(1) }).optional(),
  /** Colour mode for this step. */
  colourBy: z.enum(['real', 'lobe', 'area']).optional(),
});
export type TourStep = z.infer<typeof TourStep>;

export const LearningObjective = z.object({ id: Id, text: Text(200) });

export const SimulationDefinition = z.object({
  schemaVersion: z.literal(1),
  id: Id,
  title: Text(100),
  domain: z.enum(['biology']),
  simulationType: z.enum(['3d-anatomy']),
  audience: Text(120),
  summary: Text(500),
  learningObjectives: z.array(LearningObjective).min(1).max(12),
  assets: z.array(AssetRef).min(1).max(4),
  layers: z.array(Layer).min(1).max(16),
  structures: z.array(AnatomicalStructure).min(1).max(260),
  cameraPresets: z.array(CameraPreset).min(1).max(12),
  defaultCamera: Id,
  csfRoute: CsfRoute,
  tour: z.array(TourStep).max(40),
  sources: z.array(Source).min(1).max(40),
  disclaimers: z.array(Text(400)).min(1).max(6),
});
export type SimulationDefinition = z.infer<typeof SimulationDefinition>;
