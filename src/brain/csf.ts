import { csfLandmarks, geometry, vec, type Vec3 } from './anchors';

/**
 * Schematic paths for cerebrospinal fluid, built from the model's own geometry: points inside
 * each part of the lateral ventricles, then a point standing in for the interventricular foramen,
 * the centrelines of the third ventricle and cerebral aqueduct, a point inside the fourth
 * ventricle, and an exit point outside the model (the apertures into the subarachnoid space).
 */
export interface CsfStream {
  id: string;
  side: 'right' | 'left';
  /** Ventricle part the stream starts in. */
  origin: 'anterior-horn' | 'body' | 'posterior-horn' | 'inferior-horn';
  points: Vec3[];
  /** Structures the stream passes through, in order. */
  through: string[];
  /** Index range [from, to] of the last leg, which leaves the model. */
  offModel: { from: number; to: number };
}

const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Centreline of a structure, ordered so it starts at the end nearest `from`. */
function centrelineFrom(id: string, from: Vec3): Vec3[] {
  const pts = (geometry[id]?.centreline ?? []).map(vec);
  if (pts.length < 2) throw new Error(`no centreline for ${id}`);
  const d = (p: Vec3) => Math.hypot(p[0] - from[0], p[1] - from[1], p[2] - from[2]);
  return d(pts[0]!) <= d(pts[pts.length - 1]!) ? pts : pts.reverse();
}

export function buildCsfStreams(): CsfStream[] {
  const third = vec(csfLandmarks['third-ventricle']);
  const fourth = vec(csfLandmarks['fourth-ventricle']);
  const thirdBox = geometry['third-ventricle']!.bounds;
  // Top front of the third ventricle: where the interventricular foramina open into it.
  const thirdTopFront: Vec3 = [third[0], thirdBox[1]![1]! - 0.004, thirdBox[1]![2]! - 0.006];
  const out: CsfStream[] = [];
  for (const side of ['right', 'left'] as const) {
    const L = csfLandmarks[side];
    const anterior = vec(L['anterior-horn']!), body = vec(L.body!), posterior = vec(L['posterior-horn']!), inferior = vec(L['inferior-horn']!);
    // The foramen lies between the front of the body of the lateral ventricle and the third ventricle.
    const foramen = lerp(lerp(anterior, body, 0.5), thirdTopFront, 0.6);
    const thirdPath = centrelineFrom('third-ventricle', foramen);
    const aqueduct = centrelineFrom('cerebral-aqueduct', thirdPath[thirdPath.length - 1]!);
    const exit: Vec3 = [fourth[0], fourth[1] - 0.014, fourth[2] - 0.016];
    const tail: Vec3[] = [foramen, ...thirdPath, ...aqueduct, fourth, exit];
    const junction = lerp(body, posterior, 0.5);
    const starts: Record<CsfStream['origin'], Vec3[]> = {
      'anterior-horn': [anterior],
      body: [body],
      'posterior-horn': [posterior, junction, body],
      'inferior-horn': [inferior, junction, body],
    };
    for (const [origin, head] of Object.entries(starts) as [CsfStream['origin'], Vec3[]][]) {
      const points = [...head, ...tail];
      out.push({
        id: `${side}-${origin}`, side, origin, points,
        through: [`${side}-lateral-ventricle`, 'third-ventricle', 'cerebral-aqueduct', 'fourth-ventricle'],
        offModel: { from: points.length - 2, to: points.length - 1 },
      });
    }
  }
  return out;
}
