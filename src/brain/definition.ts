import type { AnatomicalStructure, SimulationDefinition } from '../contract/schema';

/**
 * The brain lab as data. Every function statement is drawn from the cited OpenStax sections;
 * where the sources give only a location, the text says so instead of guessing. Positions
 * ("on the medial surface", "below the lateral sulcus") describe what the model itself shows.
 */

type Side = 'right' | 'left';
type LobeKey = 'frontal' | 'parietal' | 'temporal' | 'occipital' | 'insula' | 'limbic';
type AreaKey = 'motor' | 'somatosensory' | 'visual' | 'auditory' | 'broca' | 'wernicke';

const SIDES: Side[] = ['right', 'left'];
const CNS = ['openstax-cns', 'hra-brain'] as const;

export const LOBES: Record<LobeKey, { label: string; synonyms: string[]; summary: string; fn: string; note?: string }> = {
  frontal: {
    label: 'Frontal lobe', synonyms: ['frontal cortex'],
    summary: 'The front part of each cerebral hemisphere, in front of the central sulcus and above the lateral sulcus.',
    fn: 'Mainly concerned with movement: the precentral gyrus holds the primary motor cortex. The frontal lobe also supports planning and other cognitive functions; its prefrontal cortex contributes to personality, short-term memory and consciousness.',
  },
  parietal: {
    label: 'Parietal lobe', synonyms: ['parietal cortex'],
    summary: 'The part of each hemisphere behind the central sulcus and above the occipital and temporal lobes.',
    fn: 'Processes general body sensation (somatosensation): touch, pressure, pain, itch, vibration, and the position and movement of the body. The postcentral gyrus holds the primary somatosensory cortex.',
  },
  temporal: {
    label: 'Temporal lobe', synonyms: ['temporal cortex'],
    summary: 'The lower side part of each hemisphere, below the lateral sulcus.',
    fn: 'Holds the primary auditory cortex, so hearing is processed here first. The temporal lobe also contributes to memory, closely tied to the sensory processing of the region.',
  },
  occipital: {
    label: 'Occipital lobe', synonyms: ['occipital cortex', 'visual lobe'],
    summary: 'The back part of each hemisphere, behind the parietal and temporal lobes.',
    fn: 'Primary visual perception: the primary visual cortex lies in the occipital lobe. More complex visual processing involves the temporal and parietal lobes as well.',
  },
  insula: {
    label: 'Insula', synonyms: ['insular cortex', 'island of Reil'],
    summary: 'Cortex folded deep inside the lateral sulcus, hidden under the frontal, parietal and temporal lobes. Pull the temporal lobe away in your mind, or cut the brain, to see it.',
    fn: 'The sources used in this lab do not describe the insula’s functions; it is shown so you can see where this hidden part of the cortex lies.',
  },
  limbic: {
    label: 'Limbic cortex', synonyms: ['limbic lobe'],
    summary: 'Cortex on the inner (medial) surface of each hemisphere, curving around the corpus callosum and down to the hippocampus: the cingulate and parahippocampal gyri and nearby areas.',
    fn: 'The limbic cortex is the part of the cerebral cortex belonging to the limbic system, which with the hippocampus and amygdala is involved in forming long-term memories and in emotional responses.',
    note: 'Some textbooks describe four lobes and count this cortex as parts of them; it is grouped separately here, as in many atlases.',
  },
};

export const AREAS: Record<AreaKey, { label: string; synonyms: string[]; only?: Side; summary: string; fn: string; note: string; sources: string[] }> = {
  motor: {
    label: 'Primary motor cortex', synonyms: ['motor cortex', 'M1', 'motor area'],
    summary: 'The strip of cortex on the precentral gyrus, just in front of the central sulcus.',
    fn: 'Its upper motor neurons direct the movement of skeletal muscles. The premotor area just in front of it plans movements.',
    note: 'The model marks the whole precentral gyrus.',
    sources: ['openstax-cns', 'hra-brain'],
  },
  somatosensory: {
    label: 'Primary somatosensory cortex', synonyms: ['somatosensory cortex', 'sensory cortex', 'S1', 'Brodmann areas 1-3'],
    summary: 'The strip of cortex on the postcentral gyrus, just behind the central sulcus (Brodmann areas 1–3).',
    fn: 'Processes touch, pressure, pain, itch and vibration, and the position and movement of the body (proprioception and kinesthesia).',
    note: 'The model marks the whole postcentral gyrus.',
    sources: ['openstax-cns', 'hra-brain'],
  },
  visual: {
    label: 'Primary visual cortex', synonyms: ['visual cortex', 'V1', 'Brodmann area 17', 'striate cortex'],
    summary: 'Cortex at the back of the occipital lobe, mostly on its inner (medial) surface (Brodmann area 17, with area 18 beside it).',
    fn: 'The first stage of visual perception in the cortex.',
    note: 'Approximate: the model has no separate area 17, which lines the calcarine sulcus between the cuneus and the lingual gyrus. It marks the whole cuneus, lingual gyrus and occipital pole.',
    sources: ['openstax-cns', 'allen-atlas'],
  },
  auditory: {
    label: 'Primary auditory cortex', synonyms: ['auditory cortex', 'A1', 'Brodmann areas 41 and 42', "Heschl's gyrus"],
    summary: 'Cortex on the upper surface of the temporal lobe, inside the lateral sulcus (Brodmann areas 41 and 42).',
    fn: 'The first stage of hearing in the cortex.',
    note: "The model marks the transverse temporal (Heschl's) gyrus, where these areas lie.",
    sources: ['openstax-cns', 'allen-atlas'],
  },
  broca: {
    label: "Broca's area", synonyms: ['Broca', 'speech area', 'motor speech area'], only: 'left',
    summary: 'Part of the lateral frontal lobe, close to the motor cortex for the head and neck. In most people it is on the left side.',
    fn: "Controls the production of speech. Damage to it causes expressive aphasia: speech becomes halting and hard to produce, though understanding is kept.",
    note: 'The model marks the opercular and triangular parts of the left inferior frontal gyrus, the classical location of Broca’s area; its exact extent varies between people.',
    sources: ['openstax-cns', 'openstax-mental-status', 'allen-atlas'],
  },
  wernicke: {
    label: "Wernicke's area", synonyms: ['Wernicke', 'language comprehension area'], only: 'left',
    summary: 'Part of the temporal lobe next to the auditory association cortex, usually on the left side.',
    fn: 'Involved in understanding language. Damage to it causes receptive aphasia: the person can still speak, but understanding of language is lost.',
    note: 'Approximate: the model marks the left planum temporale, on the upper surface of the posterior temporal lobe; the area’s exact extent varies between people.',
    sources: ['openstax-mental-status', 'allen-atlas'],
  },
};

interface Gyrus { base: string; label: string; lobe: LobeKey; areas?: AreaKey[]; synonyms?: string[]; summary: string; note?: string }

/** Cortex meshes (one per hemisphere). Order sets the list order inside each lobe. */
const GYRI: Gyrus[] = [
  { base: 'precentral-gyrus', label: 'Precentral gyrus', lobe: 'frontal', areas: ['motor'], synonyms: ['primary motor gyrus'], summary: 'The ridge of cortex running down the side of the brain just in front of the central sulcus.' },
  { base: 'superior-frontal-gyrus', label: 'Superior frontal gyrus', lobe: 'frontal', summary: 'The uppermost ridge of the frontal lobe, running front to back beside the longitudinal fissure.' },
  { base: 'middle-frontal-gyrus', label: 'Middle frontal gyrus', lobe: 'frontal', summary: 'The ridge of the frontal lobe between the superior and inferior frontal gyri.' },
  { base: 'inferior-frontal-gyrus-opercular', label: 'Inferior frontal gyrus, opercular part', lobe: 'frontal', areas: ['broca'], synonyms: ['pars opercularis', 'Brodmann area 44'], summary: 'The back part of the inferior frontal gyrus, just in front of the lower precentral gyrus.' },
  { base: 'inferior-frontal-gyrus-triangular', label: 'Inferior frontal gyrus, triangular part', lobe: 'frontal', areas: ['broca'], synonyms: ['pars triangularis', 'Brodmann area 45'], summary: 'The triangular middle part of the inferior frontal gyrus.' },
  { base: 'frontal-operculum', label: 'Frontal operculum', lobe: 'frontal', summary: 'The part of the frontal lobe that folds over the insula like a lid.' },
  { base: 'orbital-gyri', label: 'Orbital gyri', lobe: 'frontal', synonyms: ['orbitofrontal cortex'], summary: 'The gyri on the underside of the frontal lobe, resting above the eye sockets (orbits).' },
  { base: 'gyrus-rectus', label: 'Gyrus rectus', lobe: 'frontal', synonyms: ['straight gyrus'], summary: 'A straight, narrow gyrus on the underside of the frontal lobe, next to the midline.' },
  { base: 'medial-frontal-gyri', label: 'Medial frontal gyri', lobe: 'frontal', synonyms: ['rostral gyrus', 'paracingulate gyrus'], summary: 'Cortex at the front of the inner (medial) surface of the frontal lobe, in front of and above the cingulate gyrus.' },
  {
    base: 'medial-superior-frontal-region', label: 'Medial upper frontal cortex', lobe: 'frontal', summary: 'Cortex on the inner (medial) surface of the upper frontal lobe, above the cingulate gyrus.',
    note: 'The source file names this part “posteroventral putamen”, which does not match its position on the medial frontal surface; it is named here by position.',
  },
  { base: 'paracentral-lobule-anterior', label: 'Paracentral lobule, front part', lobe: 'frontal', synonyms: ['paracentral lobule'], summary: 'The front half of the paracentral lobule on the medial surface, where the precentral gyrus continues over the top of the hemisphere.' },
  { base: 'paracentral-lobule-posterior', label: 'Paracentral lobule, back part', lobe: 'parietal', synonyms: ['paracentral lobule'], summary: 'The back half of the paracentral lobule on the medial surface, where the postcentral gyrus continues over the top of the hemisphere.' },
  { base: 'postcentral-gyrus', label: 'Postcentral gyrus', lobe: 'parietal', areas: ['somatosensory'], summary: 'The ridge of cortex just behind the central sulcus, parallel to the precentral gyrus.' },
  { base: 'superior-parietal-lobule', label: 'Superior parietal lobule', lobe: 'parietal', summary: 'The upper part of the parietal lobe, behind the postcentral gyrus.' },
  { base: 'supramarginal-gyrus', label: 'Supramarginal gyrus', lobe: 'parietal', summary: 'Part of the lower parietal lobe, curving around the upper end of the lateral sulcus.' },
  { base: 'angular-gyrus', label: 'Angular gyrus', lobe: 'parietal', summary: 'Part of the lower parietal lobe, behind the supramarginal gyrus, near where the parietal, temporal and occipital lobes meet.' },
  { base: 'precuneus', label: 'Precuneus', lobe: 'parietal', summary: 'Cortex on the inner (medial) surface of the parietal lobe, in front of the cuneus.' },
  { base: 'parietal-operculum', label: 'Parietal operculum', lobe: 'parietal', summary: 'The part of the parietal lobe that folds over the insula from above.' },
  { base: 'superior-temporal-gyrus', label: 'Superior temporal gyrus', lobe: 'temporal', synonyms: ['STG'], summary: 'The top ridge of the temporal lobe, just below the lateral sulcus.' },
  { base: 'middle-temporal-gyrus', label: 'Middle temporal gyrus', lobe: 'temporal', synonyms: ['MTG'], summary: 'The middle ridge on the side of the temporal lobe.' },
  { base: 'inferior-temporal-gyrus', label: 'Inferior temporal gyrus', lobe: 'temporal', synonyms: ['ITG'], summary: 'The lowest ridge on the side of the temporal lobe, curving onto its underside.' },
  { base: 'transverse-temporal-gyrus', label: "Transverse temporal gyrus (Heschl's)", lobe: 'temporal', areas: ['auditory'], synonyms: ["Heschl's gyrus", 'Heschl'], summary: 'A short gyrus running across the upper surface of the temporal lobe, hidden inside the lateral sulcus.' },
  { base: 'planum-temporale', label: 'Planum temporale', lobe: 'temporal', areas: ['wernicke'], summary: 'The flat upper surface of the temporal lobe behind the transverse temporal gyrus, inside the lateral sulcus.' },
  { base: 'planum-polare', label: 'Planum polare', lobe: 'temporal', summary: 'The flat upper surface of the temporal lobe in front of the transverse temporal gyrus.' },
  { base: 'temporal-pole', label: 'Temporal pole', lobe: 'temporal', summary: 'The rounded front tip of the temporal lobe.' },
  { base: 'fusiform-gyrus', label: 'Fusiform gyrus', lobe: 'temporal', synonyms: ['occipitotemporal gyrus'], summary: 'A long gyrus on the underside of the temporal lobe, continuing back into the occipital lobe.' },
  {
    base: 'inferior-temporal-region', label: 'Lower temporal cortex', lobe: 'temporal', summary: 'Cortex low on the temporal lobe, near its underside.',
    note: 'The source file names this part “frontomarginal gyrus”, which does not match its position on the temporal lobe; it is named here by position.',
  },
  { base: 'cuneus', label: 'Cuneus', lobe: 'occipital', areas: ['visual'], summary: 'A wedge of cortex on the inner (medial) surface of the occipital lobe, above the calcarine sulcus.' },
  { base: 'lingual-gyrus', label: 'Lingual gyrus', lobe: 'occipital', areas: ['visual'], summary: 'Cortex on the inner (medial) surface of the occipital lobe, below the calcarine sulcus.' },
  { base: 'superior-occipital-gyrus', label: 'Superior occipital gyrus', lobe: 'occipital', summary: 'The upper ridge on the outer surface of the occipital lobe.' },
  { base: 'inferior-occipital-gyrus', label: 'Inferior occipital gyrus', lobe: 'occipital', summary: 'The lower ridge on the outer surface of the occipital lobe.' },
  { base: 'occipital-pole', label: 'Occipital pole', lobe: 'occipital', areas: ['visual'], summary: 'The back tip of the occipital lobe and of the hemisphere.' },
  { base: 'occipital-fusiform-gyrus', label: 'Occipital fusiform gyrus', lobe: 'occipital', summary: 'The back part of the fusiform gyrus, on the underside of the occipital lobe.' },
  { base: 'insula', label: 'Insula', lobe: 'insula', synonyms: ['insular cortex', 'island of Reil'], summary: 'Cortex hidden deep in the lateral sulcus, covered by the opercula of the frontal, parietal and temporal lobes.' },
  { base: 'cingulate-gyrus-anterior', label: 'Cingulate gyrus, front part', lobe: 'limbic', synonyms: ['anterior cingulate', 'cingulate gyrus'], summary: 'The front half of the gyrus that arches over the corpus callosum on the medial surface.' },
  { base: 'cingulate-gyrus-posterior', label: 'Cingulate gyrus, back part', lobe: 'limbic', synonyms: ['posterior cingulate', 'cingulate gyrus'], summary: 'The back half of the cingulate gyrus, curving down behind the corpus callosum toward the parahippocampal gyrus.' },
  { base: 'parahippocampal-gyrus', label: 'Parahippocampal gyrus', lobe: 'limbic', synonyms: ['entorhinal region'], summary: 'Cortex on the inner underside of the temporal lobe, beside the hippocampus.' },
  { base: 'subcallosal-gyrus', label: 'Subcallosal gyrus', lobe: 'limbic', summary: 'A small area of cortex on the medial surface below the front end of the corpus callosum.' },
  { base: 'olfactory-cortex', label: 'Olfactory cortex', lobe: 'limbic', synonyms: ['piriform cortex', 'smell cortex'], summary: 'Cortex on the underside of the brain, where the olfactory tract ends.' },
];

const lobeId = (side: Side, lobe: LobeKey) => `${side}-${lobe === 'limbic' ? 'limbic-cortex' : lobe === 'insula' ? 'insular-lobe' : `${lobe}-lobe`}`;
const areaId = (side: Side, area: AreaKey) => `${side}-${area === 'broca' ? 'broca-area' : area === 'wernicke' ? 'wernicke-area' : `primary-${area}-cortex`}`;
const hasArea = (side: Side, area: AreaKey) => !AREAS[area].only || AREAS[area].only === side;

const gyri: AnatomicalStructure[] = SIDES.flatMap((side) =>
  GYRI.map((g): AnatomicalStructure => {
    const areas = (g.areas ?? []).filter((a) => hasArea(side, a)).map((a) => areaId(side, a));
    return {
      id: `${side}-${g.base}`, label: `${g.label} (${side})`, synonyms: [g.label, ...(g.synonyms ?? [])],
      layer: 'cortex', kind: 'mesh', side, lobe: lobeId(side, g.lobe), ...(areas.length ? { areas } : {}),
      summary: g.summary,
      function: `Part of the ${LOBES[g.lobe].label.toLowerCase()}. ${LOBES[g.lobe].fn}`,
      related: [lobeId(side, g.lobe), ...areas].slice(0, 12),
      ...(g.note ? { modelNote: g.note } : {}),
      sources: [...CNS],
    };
  }),
);

const lobes: AnatomicalStructure[] = SIDES.flatMap((side) =>
  (Object.keys(LOBES) as LobeKey[]).map((key): AnatomicalStructure => {
    const l = LOBES[key];
    return {
      id: lobeId(side, key), label: `${l.label} (${side})`, synonyms: [l.label, ...l.synonyms],
      layer: 'cortex', kind: 'group', role: 'lobe', side,
      members: GYRI.filter((g) => g.lobe === key).map((g) => `${side}-${g.base}`),
      summary: l.summary, function: l.fn, related: [], ...(l.note ? { modelNote: l.note } : {}), sources: [...CNS],
    };
  }),
);

const areas: AnatomicalStructure[] = SIDES.flatMap((side) =>
  (Object.keys(AREAS) as AreaKey[]).filter((a) => hasArea(side, a)).map((key): AnatomicalStructure => {
    const a = AREAS[key];
    return {
      id: areaId(side, key), label: AREAS[key].only ? a.label : `${a.label} (${side})`, synonyms: [a.label, ...a.synonyms],
      layer: 'cortex', kind: 'group', role: 'area', side,
      members: GYRI.filter((g) => g.areas?.includes(key)).map((g) => `${side}-${g.base}`),
      summary: a.summary, function: a.fn, related: [], modelNote: a.note, sources: a.sources,
    };
  }),
);

/** A structure present on both sides, or once in the midline. */
function both(base: string, label: string, s: Omit<AnatomicalStructure, 'id' | 'label' | 'side' | 'kind' | 'related' | 'synonyms'> & { synonyms?: string[]; related?: string[] }): AnatomicalStructure[] {
  return SIDES.map((side) => ({
    ...s, id: `${side}-${base}`, label: `${label} (${side})`, synonyms: [label, ...(s.synonyms ?? [])], kind: 'mesh' as const, side,
    related: (s.related ?? []).map((r) => (r.startsWith('$') ? `${side}-${r.slice(1)}` : r)),
  }));
}
function one(id: string, label: string, s: Omit<AnatomicalStructure, 'id' | 'label' | 'side' | 'kind' | 'related' | 'synonyms'> & { synonyms?: string[]; related?: string[] }): AnatomicalStructure {
  return { ...s, id, label, synonyms: s.synonyms ?? [], kind: 'mesh', side: 'midline', related: s.related ?? [] };
}

const BASAL_FN = 'The basal nuclei compare activity in the cortex with the general state of the body and help decide whether a movement happens: for example, they keep a seated student from acting on an urge to jump up.';
const ARTERY = ['openstax-pathways', 'bodyparts3d'] as const;
const ARTERY_NOTE = 'BodyParts3D artery fitted onto this brain (an affine fit to structures both models share; typical misfit a few millimetres). Smaller branches are merged into the named artery.';

const deep: AnatomicalStructure[] = [
  ...both('cerebral-white-matter', 'Cerebral white matter', {
    synonyms: ['white matter'], layer: 'white-matter',
    summary: 'The pale core of each hemisphere under the cortex, made of nerve fibres (axons) that connect areas of cortex with each other and with deeper parts of the brain.',
    function: 'Carries signals between areas of grey matter. Cut the brain to see the white matter inside the grey cortex.',
    modelNote: 'Shown as one block per hemisphere; it is only visible in a cut or with the cortex hidden. It includes a thin sheet deep in the back of the hemisphere that the source file mislabels “frontal pole”.', sources: [...CNS],
  }),
  one('corpus-callosum', 'Corpus callosum', {
    layer: 'white-matter',
    summary: 'A thick, arched band of white matter deep in the longitudinal fissure, joining the two hemispheres.',
    function: 'The main connection between the left and right cerebral hemispheres.', related: ['fornix'], sources: [...CNS],
  }),
  one('anterior-commissure', 'Anterior commissure', {
    layer: 'white-matter', summary: 'A small bundle of white matter crossing the midline in front of the third ventricle.',
    function: 'The sources used in this lab do not describe it; it is shown for its location, as a second, smaller crossing between the hemispheres.', sources: ['hra-brain', 'allen-atlas'],
  }),
  one('fornix', 'Fornix', {
    layer: 'white-matter', summary: 'An arched band of white matter under the corpus callosum, curving from the hippocampus toward the front of the third ventricle.',
    function: 'The sources used in this lab do not describe it; it is shown because it links the hippocampus with the rest of the limbic system.', related: ['corpus-callosum'], sources: ['hra-brain', 'allen-atlas'],
  }),
  ...both('caudate-nucleus', 'Caudate nucleus', {
    synonyms: ['caudate', 'striatum'], layer: 'deep', related: ['$putamen', '$globus-pallidus'],
    summary: 'A curved, tadpole-shaped mass of grey matter beside the lateral ventricle: head, body and tail.',
    function: `Part of the basal nuclei; with the putamen it forms the striatum. ${BASAL_FN}`, sources: [...CNS],
  }),
  ...both('putamen', 'Putamen', {
    synonyms: ['striatum', 'lentiform nucleus'], layer: 'deep', related: ['$caudate-nucleus', '$globus-pallidus'],
    summary: 'A rounded mass of grey matter deep in each hemisphere, beneath the insula.',
    function: `Part of the basal nuclei; with the caudate it forms the striatum. ${BASAL_FN}`, sources: [...CNS],
  }),
  ...both('globus-pallidus', 'Globus pallidus', {
    synonyms: ['pallidum', 'lentiform nucleus'], layer: 'deep', related: ['$putamen', '$thalamus'],
    summary: 'Grey matter just medial to the putamen, with an external and an internal segment.',
    function: `Part of the basal nuclei. ${BASAL_FN} Their direct pathway promotes movement by releasing the thalamus from inhibition; the indirect pathway reinforces the inhibition.`, sources: [...CNS],
  }),
  ...both('nucleus-accumbens', 'Nucleus accumbens', {
    layer: 'deep', summary: 'A small mass of grey matter where the head of the caudate and the putamen meet, at the front.',
    function: 'The sources used in this lab do not describe it; it is shown for its location next to the basal nuclei.', sources: ['hra-brain', 'allen-atlas'],
  }),
  ...both('claustrum', 'Claustrum', {
    layer: 'deep', summary: 'A thin sheet of grey matter between the putamen and the insula.',
    function: 'The sources used in this lab do not describe it; it is shown for its location.', sources: ['hra-brain', 'allen-atlas'],
  }),
  ...both('amygdala', 'Amygdala', {
    synonyms: ['amygdaloid body'], layer: 'deep', related: ['$hippocampus'],
    summary: 'An almond-shaped group of nuclei deep in the front of the temporal lobe, just in front of the hippocampus.',
    function: 'Part of the limbic system: with the hippocampus and nearby cortex it is involved in emotional responses and in forming long-term memories.',
    modelNote: 'Its nuclei are merged into one structure.', sources: [...CNS],
  }),
  ...both('hippocampus', 'Hippocampus', {
    layer: 'deep', related: ['$amygdala', 'fornix', '$parahippocampal-gyrus'],
    summary: 'A curved ridge of grey matter in the floor of the lateral ventricle’s inferior horn, inside the temporal lobe.',
    function: 'Part of the limbic system: with the amygdala and nearby cortex it is involved in forming long-term memories and in emotional responses.',
    modelNote: 'Head, body and tail are merged into one structure.', sources: [...CNS],
  }),
  ...both('thalamus', 'Thalamus', {
    layer: 'deep', related: ['third-ventricle', 'hypothalamus'],
    summary: 'An egg-shaped mass of grey matter on each side of the third ventricle, the largest part of the diencephalon.',
    function: 'Relays almost all sensory information (except smell) to the cerebral cortex and processes it on the way. It also relays motor signals and the output of the basal nuclei.',
    modelNote: 'Its separate nuclei (including the lateral and medial geniculate nuclei) are merged into one structure.', sources: [...CNS],
  }),
  ...both('subthalamic-nucleus', 'Subthalamic nucleus', {
    layer: 'deep', summary: 'A small lens of grey matter just below the thalamus.',
    function: 'The sources used in this lab do not describe it; it is shown for its location.', modelNote: 'Merged with the neighbouring zona incerta.', sources: ['hra-brain', 'allen-atlas'],
  }),
  ...both('septal-area', 'Septal area and basal forebrain', {
    layer: 'deep', summary: 'Grey matter near the midline below the front of the corpus callosum and in front of the hypothalamus.',
    function: 'The sources used in this lab do not describe it; it is shown for its location.', modelNote: 'Septal nuclei, bed nucleus of the stria terminalis and basal forebrain are merged.', sources: ['hra-brain', 'allen-atlas'],
  }),
  one('hypothalamus', 'Hypothalamus', {
    layer: 'deep', related: ['third-ventricle', 'optic-chiasm'],
    summary: 'Grey matter below the thalamus, forming the floor and lower walls of the third ventricle, just behind the optic chiasm.',
    function: 'Largely regulates homeostasis. It controls the autonomic nervous system and, through the pituitary gland, the endocrine system, and it contributes to memory and emotion.',
    modelNote: 'Its regions (including the mammillary bodies) are merged into one structure. The pituitary gland is not part of this model.', sources: [...CNS],
  }),
  one('pineal-gland', 'Pineal gland', {
    synonyms: ['pineal body', 'epiphysis'], layer: 'deep',
    summary: 'A small, pine-cone-shaped endocrine gland at the back of the third ventricle, above the midbrain.',
    function: 'Its cells make the hormone melatonin, more of it as light fades in the evening, which helps regulate the sleep–wake cycle.', sources: ['openstax-pineal', 'hra-brain'],
  }),
  one('midbrain', 'Midbrain', {
    synonyms: ['mesencephalon', 'tegmentum'], layer: 'brainstem', related: ['tectum', 'pons', 'cerebral-aqueduct'],
    summary: 'The top part of the brainstem, between the diencephalon and the pons; the cerebral aqueduct runs through it.',
    function: 'Its tegmentum contains nuclei of cranial nerves. The midbrain is part of the brainstem, through which the reticular formation runs, which is related to sleep and wakefulness.',
    modelNote: 'Tegmentum and red nucleus.', sources: [...CNS],
  }),
  one('tectum', 'Tectum (superior and inferior colliculi)', {
    synonyms: ['colliculi', 'superior colliculus', 'inferior colliculus'], layer: 'brainstem', related: ['midbrain'],
    summary: 'The roof of the midbrain: four small bumps, the superior and inferior colliculi, behind the cerebral aqueduct.',
    function: 'The inferior colliculi are part of the hearing pathway. The superior colliculi combine visual, hearing and touch information to turn the eyes toward something.', sources: [...CNS],
  }),
  ...both('cerebral-peduncle', 'Cerebral peduncle', {
    synonyms: ['crus cerebri'], layer: 'brainstem', related: ['midbrain'],
    summary: 'A thick stalk of white matter on the front of the midbrain, one on each side.',
    function: 'The sources used in this lab do not describe it; it is shown because it carries fibres from the cerebrum down into the brainstem.', sources: ['hra-brain', 'allen-atlas'],
  }),
  ...both('substantia-nigra', 'Substantia nigra', {
    layer: 'brainstem', related: ['$globus-pallidus'],
    summary: 'A band of grey matter in the midbrain, behind the cerebral peduncle.',
    function: 'Its dopamine-releasing part (pars compacta) acts on the basal nuclei, promoting movement through their direct pathway and damping the indirect pathway.', sources: [...CNS],
  }),
  one('pons', 'Pons', {
    layer: 'brainstem', related: ['midbrain', 'medulla-oblongata', 'fourth-ventricle'],
    summary: 'The bulging middle part of the brainstem, in front of the cerebellum.',
    function: 'The main connection between the cerebellum and the brainstem.', sources: [...CNS],
  }),
  one('medulla-oblongata', 'Medulla oblongata', {
    synonyms: ['medulla'], layer: 'brainstem', related: ['pons'],
    summary: 'The lowest part of the brainstem, continuous with the spinal cord.',
    function: 'Regulates cardiovascular and respiratory functions: the heart, blood vessels and breathing.', sources: [...CNS],
  }),
  ...both('cerebellar-hemisphere', 'Cerebellar hemisphere', {
    synonyms: ['cerebellum'], layer: 'cerebellum', related: ['vermis', '$cerebellar-white-matter'],
    summary: 'One half of the cerebellum, behind the brainstem and under the occipital lobes. Its surface is folded into thin parallel folia.',
    function: 'The cerebellum (about 10 % of brain mass) compares the motor commands from the cerebrum with sensory feedback and sends corrections, coordinating movement, for example when walking on uneven ground.', sources: [...CNS],
  }),
  one('vermis', 'Vermis', {
    synonyms: ['cerebellar vermis', 'cerebellum'], layer: 'cerebellum',
    summary: 'The narrow, worm-like middle part of the cerebellum joining its two hemispheres.',
    function: 'Part of the cerebellum, which compares motor commands with sensory feedback to coordinate movement.', sources: [...CNS],
  }),
  ...both('cerebellar-white-matter', 'Cerebellar white matter', {
    synonyms: ['arbor vitae'], layer: 'cerebellum',
    summary: 'The white matter inside the cerebellum, branching like a tree in a cut (the “arbor vitae”).',
    function: 'Carries signals into and out of the cerebellar cortex.', modelNote: 'The source calls it “white matter of hindbrain”.', sources: ['hra-brain', 'allen-atlas'],
  }),
  ...both('deep-cerebellar-nuclei', 'Deep cerebellar nuclei', {
    layer: 'cerebellum', summary: 'Grey matter buried in the cerebellar white matter.',
    function: 'The sources used in this lab do not describe them; they are shown for their location.', sources: ['hra-brain', 'allen-atlas'],
  }),
  ...both('cerebellar-peduncles', 'Cerebellar peduncles', {
    layer: 'cerebellum', related: ['pons'],
    summary: 'Three stalks of white matter (superior, middle, inferior) joining the cerebellum to the brainstem.',
    function: 'Carry the connections between the cerebellum and the brainstem, whose pons is the main link to the cerebellum.', sources: [...CNS],
  }),
  ...both('lateral-ventricle', 'Lateral ventricle', {
    layer: 'ventricle', related: ['third-ventricle'],
    summary: 'A C-shaped cavity filled with cerebrospinal fluid deep in each cerebral hemisphere, with anterior, posterior and inferior horns.',
    function: 'Holds cerebrospinal fluid (CSF), made by the choroid plexus. CSF flows from here through the interventricular foramen into the third ventricle.',
    modelNote: 'Its horns are merged into one structure. One source part, named “atrium”, lies in front of the anterior horn instead of at the back; it is kept as part of the ventricle.', sources: ['openstax-circulation', 'hra-brain'],
  }),
  one('third-ventricle', 'Third ventricle', {
    layer: 'ventricle', related: ['cerebral-aqueduct'],
    summary: 'A narrow, slit-like cavity in the midline between the two halves of the diencephalon (thalamus and hypothalamus).',
    function: 'Receives CSF from both lateral ventricles and passes it into the cerebral aqueduct.', sources: ['openstax-circulation', 'hra-brain'],
  }),
  one('cerebral-aqueduct', 'Cerebral aqueduct', {
    synonyms: ['aqueduct of Sylvius'], layer: 'ventricle', related: ['third-ventricle', 'fourth-ventricle', 'midbrain'],
    summary: 'A narrow channel through the midbrain joining the third and fourth ventricles.',
    function: 'Carries CSF from the third ventricle to the fourth.', sources: ['openstax-circulation', 'hra-brain'],
  }),
  one('fourth-ventricle', 'Fourth ventricle', {
    layer: 'ventricle', related: ['cerebral-aqueduct', 'pons', 'vermis'],
    summary: 'A tent-shaped cavity between the cerebellum behind and the pons and upper medulla in front.',
    function: 'CSF leaves it through one median and two lateral apertures into the subarachnoid space around the brain and spinal cord. Below, it narrows into the central canal.', sources: ['openstax-circulation', 'hra-brain'],
  }),
  one('central-canal', 'Central canal', {
    layer: 'ventricle', related: ['fourth-ventricle'],
    summary: 'The narrow canal continuing down from the fourth ventricle through the medulla into the spinal cord.',
    function: 'Essentially a dead end: little CSF flows down it.', sources: ['openstax-circulation', 'hra-brain'],
  }),
  one('optic-chiasm', 'Optic chiasm', {
    layer: 'nerve', related: ['hypothalamus'],
    summary: 'The X-shaped crossing of the optic nerves on the underside of the brain, just in front of the hypothalamus.',
    function: 'Where the two optic nerves from the eyes meet beneath the brain; visual signals continue from here along the optic tracts.', modelNote: 'From the HuBMAP female body; the optic nerves in front of it are not part of this model.', sources: ['hra-brain', 'hra-united'],
  }),
  ...both('optic-tract', 'Optic tract', {
    layer: 'nerve', related: ['optic-chiasm'],
    summary: 'The band of fibres running back from the optic chiasm around the cerebral peduncle toward the thalamus.',
    function: 'Carries visual information from the optic chiasm toward the thalamus, which relays it to the visual cortex.', sources: [...CNS],
  }),
  ...both('olfactory-bulb', 'Olfactory bulb and tract', {
    synonyms: ['olfactory nerve'], layer: 'nerve',
    summary: 'A slender stalk on the underside of the frontal lobe, ending in front in the olfactory bulb.',
    function: 'Carries the sense of smell back to the olfactory cortex. Smell is the one sense not relayed through the thalamus.', sources: [...CNS],
  }),
  ...both('internal-carotid-artery', 'Internal carotid artery', {
    synonyms: ['ICA', 'carotid'], layer: 'artery', related: ['$middle-cerebral-artery', '$anterior-cerebral-artery', '$posterior-communicating-artery'],
    summary: 'One of the two main pairs of arteries bringing blood to the brain; it enters the skull through the carotid canal.',
    function: 'With the vertebral arteries, the main blood supply of the brain. Its branches include the anterior and middle cerebral arteries.',
    modelNote: ARTERY_NOTE, sources: [...ARTERY, 'openstax-circulation'],
  }),
  ...both('vertebral-artery', 'Vertebral artery', {
    layer: 'artery', related: ['basilar-artery'],
    summary: 'An artery that arises from the subclavian artery and enters the skull through the foramen magnum.',
    function: 'Supplies the brain and spinal cord. The two vertebral arteries join to form the basilar artery; their branches also form the anterior spinal artery.',
    modelNote: ARTERY_NOTE, sources: [...ARTERY, 'openstax-circulation'],
  }),
  one('basilar-artery', 'Basilar artery', {
    layer: 'artery', related: ['pons'],
    summary: 'The single artery formed where the two vertebral arteries join, running up the front of the pons.',
    function: 'The main blood supply of the brainstem; it also sends branches to the cerebellum and feeds the posterior cerebral arteries.',
    modelNote: ARTERY_NOTE, sources: [...ARTERY],
  }),
  ...both('anterior-cerebral-artery', 'Anterior cerebral artery', {
    synonyms: ['ACA'], layer: 'artery', related: ['anterior-communicating-artery', '$internal-carotid-artery'],
    summary: 'A branch of the internal carotid artery that runs forward and up along the inner surface of the hemisphere, over the corpus callosum.',
    function: 'Supplies blood to the frontal lobe of the cerebrum.', modelNote: ARTERY_NOTE, sources: [...ARTERY],
  }),
  one('anterior-communicating-artery', 'Anterior communicating artery', {
    synonyms: ['circle of Willis', 'cerebral arterial circle'], layer: 'artery', related: ['right-anterior-cerebral-artery', 'left-anterior-cerebral-artery'],
    summary: 'A short artery joining the two anterior cerebral arteries at the front of the circle of Willis.',
    function: 'Joins the left and right anterior cerebral arteries, forming the front of the arterial circle (circle of Willis), which keeps blood reaching the brain even if one supply narrows.', modelNote: ARTERY_NOTE, sources: [...ARTERY, 'openstax-circulation'],
  }),
  ...both('middle-cerebral-artery', 'Middle cerebral artery', {
    synonyms: ['MCA'], layer: 'artery', related: ['$internal-carotid-artery'],
    summary: 'A branch of the internal carotid artery that runs out to the side of the hemisphere and spreads over it.',
    function: 'Supplies blood to the temporal and parietal lobes, the most common sites of strokes (CVAs).', modelNote: ARTERY_NOTE, sources: [...ARTERY],
  }),
  ...both('posterior-communicating-artery', 'Posterior communicating artery', {
    synonyms: ['circle of Willis', 'cerebral arterial circle'], layer: 'artery', related: ['$posterior-cerebral-artery', '$internal-carotid-artery'],
    summary: 'A short artery on each side joining the posterior cerebral artery to the internal carotid artery.',
    function: 'Forms the back part of the arterial circle (circle of Willis).', modelNote: ARTERY_NOTE, sources: [...ARTERY],
  }),
  ...both('posterior-cerebral-artery', 'Posterior cerebral artery', {
    synonyms: ['PCA'], layer: 'artery', related: ['basilar-artery', '$posterior-communicating-artery'],
    summary: 'A branch of the basilar artery curving back around the midbrain to the underside and inner surface of the occipital lobe.',
    function: 'Supplies the back part of the cerebrum and the brainstem.', modelNote: ARTERY_NOTE, sources: [...ARTERY],
  }),
  ...both('cerebellar-arteries', 'Cerebellar arteries', {
    layer: 'artery', related: ['basilar-artery', '$vertebral-artery'],
    summary: 'The superior, anterior inferior and posterior inferior cerebellar arteries, branching from the basilar and vertebral arteries.',
    function: 'Supply the cerebellum (the sources describe this as branches of the basilar artery reaching the cerebellum).', modelNote: `${ARTERY_NOTE} The three cerebellar arteries are merged.`, sources: [...ARTERY],
  }),
];

export const brainDefinition: SimulationDefinition = {
  schemaVersion: 1,
  id: 'human-brain-anatomy',
  title: 'Human Brain',
  domain: 'biology',
  simulationType: '3d-anatomy',
  audience: 'Secondary school (Classes 10–12) and first-year undergraduate biology',
  summary:
    'Explore a realistic 3D human brain built from the HuBMAP / Allen reference brain: the lobes and gyri of the cortex, the areas for movement, sensation, vision, hearing and language, the deep grey matter, the brainstem and cerebellum, the ventricles with flowing cerebrospinal fluid, and the arteries at its base. Cut it like a real specimen to see grey and white matter.',
  learningObjectives: [
    { id: 'lobes', text: 'Name the lobes of the cerebrum and state what each mainly does.' },
    { id: 'areas', text: 'Locate the primary motor, somatosensory, visual and auditory cortex and the language areas.' },
    { id: 'grey-white', text: 'Tell grey matter from white matter in a cut brain.' },
    { id: 'deep', text: 'Identify the basal nuclei, thalamus, hypothalamus, hippocampus and amygdala and state their roles.' },
    { id: 'csf', text: 'Trace cerebrospinal fluid through the ventricles and out into the subarachnoid space.' },
    { id: 'stem', text: 'Describe the roles of the midbrain, pons, medulla and cerebellum.' },
    { id: 'blood', text: 'Name the arteries that supply the brain and explain the circle of Willis.' },
  ],
  assets: [{ id: 'hra-brain-v1', role: 'anatomy-model' }],
  layers: [
    { id: 'cortex', label: 'Cerebral cortex (gyri)', description: 'The folded grey matter on the surface of the cerebrum.', visibleByDefault: true },
    { id: 'white-matter', label: 'White matter', description: 'Nerve-fibre tracts: the core of each hemisphere, corpus callosum, fornix.', visibleByDefault: true },
    { id: 'deep', label: 'Deep grey matter', description: 'Basal nuclei, thalamus, hypothalamus, hippocampus, amygdala.', visibleByDefault: true },
    { id: 'ventricle', label: 'Ventricles (CSF)', description: 'The fluid-filled cavities inside the brain.', visibleByDefault: true },
    { id: 'brainstem', label: 'Brainstem', description: 'Midbrain, pons and medulla oblongata.', visibleByDefault: true },
    { id: 'cerebellum', label: 'Cerebellum', description: 'Hemispheres, vermis, white matter, nuclei and peduncles.', visibleByDefault: true },
    { id: 'nerve', label: 'Optic and olfactory', description: 'Optic chiasm and tracts; olfactory bulbs and tracts.', visibleByDefault: true },
    { id: 'artery', label: 'Arteries', description: 'Arteries at the base and sides of the brain, including the circle of Willis.', visibleByDefault: true },
  ],
  structures: [...lobes, ...areas, ...gyri, ...deep],
  cameraPresets: [
    { id: 'left', label: 'Left side', direction: [1, 0.12, 0.08] },
    { id: 'right', label: 'Right side', direction: [-1, 0.12, 0.08] },
    { id: 'anterior', label: 'Front', direction: [0, 0.12, 1] },
    { id: 'posterior', label: 'Back', direction: [0, 0.12, -1] },
    { id: 'superior', label: 'Top', direction: [0, 1, 0.0001], up: [0, 0, 1] },
    { id: 'inferior', label: 'Bottom', direction: [0, -1, 0.0001], up: [0, 0, 1] },
  ],
  defaultCamera: 'left',
  csfRoute: {
    id: 'csf-route',
    label: 'The route of cerebrospinal fluid',
    description: 'Cerebrospinal fluid (CSF) is made by the choroid plexus in the ventricles and flows one way: through the ventricles, then out around the brain and spinal cord.',
    steps: [
      { structure: 'left-lateral-ventricle', label: 'Lateral ventricles', note: 'Made by the choroid plexus (also present in the other ventricles).' },
      { offModel: 'interventricular-foramen', label: 'Interventricular foramina', note: 'One opening from each lateral ventricle into the third ventricle.' },
      { structure: 'third-ventricle', label: 'Third ventricle' },
      { structure: 'cerebral-aqueduct', label: 'Cerebral aqueduct', note: 'Through the midbrain.' },
      { structure: 'fourth-ventricle', label: 'Fourth ventricle' },
      { offModel: 'apertures', label: 'Median and lateral apertures', note: 'One median and two lateral openings.' },
      { offModel: 'subarachnoid-space', label: 'Subarachnoid space', note: 'Around the brain and spinal cord; reabsorbed into the blood at the arachnoid granulations.' },
    ],
    facts: [
      'About 500 mL of CSF is made each day.',
      'CSF carries metabolic waste away from nervous tissue and cushions the brain and spinal cord.',
      'Its production is tied to the pulse, which keeps the fluid moving.',
    ],
    assumptions: [
      'The particles move at a steady, schematic speed; real CSF flow pulses with each heartbeat.',
      'The path between ventricles is drawn through approximate points; the interventricular foramina and the apertures are not separate parts of the model.',
      'The choroid plexus and the subarachnoid space are not modelled; the particles leave the model after the fourth ventricle.',
    ],
    sources: ['openstax-circulation'],
  },
  tour: [
    {
      id: 'lobes', title: 'The lobes of the cerebrum', camera: 'left', colourBy: 'lobe',
      focus: ['left-frontal-lobe', 'left-parietal-lobe', 'left-temporal-lobe', 'left-occipital-lobe'],
      body: 'The cerebrum is the largest part of the brain, split by the longitudinal fissure into two hemispheres. Each is divided into lobes: frontal (movement, planning), parietal (body sensation), temporal (hearing, memory) and occipital (vision).',
    },
    {
      id: 'gyri', title: 'Gyri and sulci', camera: 'left', colourBy: 'real', focus: [],
      body: 'The outer layer of the cerebrum, the cerebral cortex, is grey matter folded into ridges (gyri) and grooves (sulci). Folding packs a large area of cortex inside the skull. This is how a real brain looks: notice the deep shadows in the sulci.',
    },
    {
      id: 'motor-sensory', title: 'Movement and body sensation', camera: 'left', colourBy: 'area',
      focus: ['left-primary-motor-cortex', 'left-primary-somatosensory-cortex'],
      body: 'Either side of the central sulcus lie two strips of cortex. In front, the precentral gyrus holds the primary motor cortex, which directs skeletal muscles. Behind, the postcentral gyrus holds the primary somatosensory cortex, which receives touch, pressure, pain and body-position signals.',
    },
    {
      id: 'vision-hearing', title: 'Seeing and hearing', camera: 'posterior', colourBy: 'area',
      focus: ['left-primary-visual-cortex', 'right-primary-visual-cortex', 'left-primary-auditory-cortex'],
      body: 'Vision is first processed at the back of the occipital lobe, mostly on its inner surface. Hearing is first processed on the upper surface of the temporal lobe, tucked inside the lateral sulcus.',
    },
    {
      id: 'language', title: 'The language areas', camera: 'left', colourBy: 'area',
      focus: ['left-broca-area', 'left-wernicke-area'],
      body: 'In most people, language depends on the left hemisphere. Broca’s area in the frontal lobe is needed to produce speech; Wernicke’s area in the temporal lobe to understand it. Damage to them causes different kinds of aphasia.',
    },
    {
      id: 'corpus-callosum', title: 'Two hemispheres, one bridge', camera: 'left', colourBy: 'real',
      slice: { axis: 'sagittal', at: 0.02 },
      focus: ['corpus-callosum'],
      body: 'Cut down the middle and you see the inner surface of the right hemisphere. The arched white band is the corpus callosum, the main connection between the two hemispheres. Notice the grey cortex and the pale white matter in the cut.',
    },
    {
      id: 'basal-nuclei', title: 'Deep grey matter', camera: 'anterior', colourBy: 'real',
      slice: { axis: 'coronal', at: 0.12 },
      focus: ['left-caudate-nucleus', 'left-putamen', 'left-globus-pallidus', 'left-thalamus', 'right-caudate-nucleus', 'right-putamen', 'right-globus-pallidus', 'right-thalamus'],
      body: 'A cut from ear to ear shows islands of grey matter deep inside the white matter. The caudate, putamen and globus pallidus are the basal nuclei, which help decide whether a movement happens. The thalamus relays almost all sensory signals to the cortex.',
    },
    {
      id: 'limbic', title: 'Memory and emotion', camera: 'left', inside: true,
      focus: ['left-hippocampus', 'left-amygdala', 'fornix', 'left-limbic-cortex', 'hypothalamus'],
      body: 'With the cortex faded you can see the limbic system: the hippocampus and amygdala in the temporal lobe, the fornix arching over to the hypothalamus, and the limbic cortex around them. Together they are involved in forming long-term memories and in emotions.',
    },
    {
      id: 'csf', title: 'Ventricles and cerebrospinal fluid', camera: 'left', inside: true,
      focus: ['left-lateral-ventricle', 'right-lateral-ventricle', 'third-ventricle', 'cerebral-aqueduct', 'fourth-ventricle'],
      body: 'Four connected cavities, the ventricles, are filled with cerebrospinal fluid made by the choroid plexus. Watch it flow from the lateral ventricles into the third ventricle, down the cerebral aqueduct to the fourth ventricle, and out around the brain and spinal cord.',
    },
    {
      id: 'brainstem', title: 'Brainstem and cerebellum', camera: 'left', colourBy: 'real',
      slice: { axis: 'sagittal', at: 0.02 },
      focus: ['midbrain', 'pons', 'medulla-oblongata', 'vermis'],
      body: 'The brainstem (midbrain, pons and medulla) joins the brain to the spinal cord; the medulla regulates the heart, blood vessels and breathing. Behind it, the cerebellum compares motor commands with feedback from the body to keep movements smooth. In the cut, its white matter branches like a tree.',
    },
    {
      id: 'arteries', title: 'Blood supply: the circle of Willis', camera: 'inferior', colourBy: 'real',
      focus: ['right-internal-carotid-artery', 'left-internal-carotid-artery', 'basilar-artery', 'anterior-communicating-artery', 'right-posterior-communicating-artery', 'left-posterior-communicating-artery', 'right-middle-cerebral-artery', 'left-middle-cerebral-artery', 'right-anterior-cerebral-artery', 'left-anterior-cerebral-artery', 'right-posterior-cerebral-artery', 'left-posterior-cerebral-artery'],
      body: 'Seen from below, the internal carotid arteries and the basilar artery (formed by the two vertebral arteries) are joined by communicating arteries into a ring, the circle of Willis. If one part narrows, blood can still reach the brain around the circle. The anterior, middle and posterior cerebral arteries branch from it.',
    },
  ],
  sources: [
    {
      id: 'openstax-cns',
      citation: 'Betts JG, Young KA, Wise JA, et al. Anatomy and Physiology 2e, section 13.2 "The Central Nervous System". Houston: OpenStax; 2022.',
      url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system',
    },
    {
      id: 'openstax-circulation',
      citation: 'Betts JG, Young KA, Wise JA, et al. Anatomy and Physiology 2e, section 13.3 "Circulation and the Central Nervous System". Houston: OpenStax; 2022.',
      url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/13-3-circulation-and-the-central-nervous-system',
    },
    {
      id: 'openstax-mental-status',
      citation: 'Betts JG, Young KA, Wise JA, et al. Anatomy and Physiology 2e, section 16.2 "The Mental Status Exam". Houston: OpenStax; 2022.',
      url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/16-2-the-mental-status-exam',
    },
    {
      id: 'openstax-pineal',
      citation: 'Betts JG, Young KA, Wise JA, et al. Anatomy and Physiology 2e, section 17.7 "The Pineal Gland". Houston: OpenStax; 2022.',
      url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/17-7-the-pineal-gland',
    },
    {
      id: 'openstax-pathways',
      citation: 'Betts JG, Young KA, Wise JA, et al. Anatomy and Physiology 2e, section 20.5 "Circulatory Pathways". Houston: OpenStax; 2022.',
      url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/20-5-circulatory-pathways',
    },
    {
      id: 'hra-brain',
      citation: 'Browne K, Schlehlein H. 3D Reference Organ for Brain, Female, v1.4. HuBMAP Human Reference Atlas; 2024. doi:10.48539/HBM674.NTLM.353',
      url: 'https://doi.org/10.48539/HBM674.NTLM.353',
      license: 'CC BY 4.0',
    },
    {
      id: 'hra-united',
      citation: 'Browne K, Schlehlein H, et al. 3D Reference Organ Set for Female, v1.5. HuBMAP Human Reference Atlas. doi:10.48539/HBM352.BTSQ.586',
      url: 'https://doi.org/10.48539/HBM352.BTSQ.586',
      license: 'CC BY 4.0',
    },
    {
      id: 'allen-atlas',
      citation: 'Ding SL, Royall JJ, Sunkin SM, et al. Comprehensive cellular-resolution atlas of the adult human brain. J Comp Neurol. 2016;524(16):3127-3481. doi:10.1002/cne.24080',
      url: 'https://doi.org/10.1002/cne.24080',
    },
    {
      id: 'bodyparts3d',
      citation: 'Mitsuhashi N, Fujieda K, Tamura T, Kawamoto S, Takagi T, Okubo K. BodyParts3D: 3D structure database for anatomical concepts. Nucleic Acids Res. 2009;37(Database issue):D782-5. doi:10.1093/nar/gkn613',
      url: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html',
      license: 'CC BY 4.0',
    },
  ],
  disclaimers: [
    'For learning only. This is not a clinical or diagnostic tool, and the explanations have not been reviewed by a physician or neuroscientist.',
    'The model is the HuBMAP female reference brain, built from the Allen human brain atlas by mirroring one hemisphere; real brains are not perfectly symmetrical and vary in shape and folding.',
    'Functional areas are drawn on whole gyri and are approximate; their exact borders vary between people.',
    'The arteries come from a different reference body (BodyParts3D) fitted onto this brain, so they can be a few millimetres off.',
  ],
};
