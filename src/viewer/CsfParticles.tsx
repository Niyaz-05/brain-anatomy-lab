import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { buildCsfStreams, type CsfStream } from '../brain/csf';
import { CSF } from './palette';

/** Particles per metre of path; keeps density even across short and long streams. */
const DENSITY = 260;
/** Particle speed along the path, metres per second at the model's scale (schematic). */
const SPEED = 0.008;

interface Track { stream: CsfStream; curve: THREE.CatmullRomCurve3; length: number; count: number; offset: number }

/**
 * Schematic cerebrospinal-fluid flow: particles drift from the lateral ventricles through the
 * third ventricle and cerebral aqueduct to the fourth ventricle and out of the model. With reduced
 * motion the particles are drawn still along the paths.
 */
export function CsfParticles({ playing, reducedMotion }: { playing: boolean; reducedMotion: boolean }) {
  const streams = useMemo(() => buildCsfStreams(), []);
  const tracks = useMemo<Track[]>(() => {
    let offset = 0;
    return streams.map((stream) => {
      const curve = new THREE.CatmullRomCurve3(stream.points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
      const length = curve.getLength();
      const count = Math.max(8, Math.round(length * DENSITY));
      const t = { stream, curve, length, count, offset };
      offset += count;
      return t;
    });
  }, [streams]);
  const total = tracks.reduce((n, t) => n + t.count, 0);

  const mesh = useRef<THREE.InstancedMesh>(null);
  const travelled = useRef(0);
  const invalidate = useThree((s) => s.invalidate);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.0007, 8, 6), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: CSF, toneMapped: false, transparent: true, opacity: 0.95, depthTest: false }), []);
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const point = useMemo(() => new THREE.Vector3(), []);

  function place(distance: number) {
    const m = mesh.current;
    if (!m) return;
    for (const t of tracks) {
      const shift = distance / t.length;
      for (let i = 0; i < t.count; i++) {
        const u = (((i / t.count + shift) % 1) + 1) % 1;
        t.curve.getPointAt(u, point);
        tmp.position.copy(point);
        // Particles shrink as they leave the model, so the off-model leg reads as "going away".
        const lastLeg = t.stream.offModel.from / (t.stream.points.length - 1);
        tmp.scale.setScalar(u > lastLeg ? Math.max(0.2, 1 - (u - lastLeg) / (1 - lastLeg)) : 1);
        tmp.updateMatrix();
        m.setMatrixAt(t.offset + i, tmp.matrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
  }

  useEffect(() => {
    place(travelled.current);
    invalidate();
    // place only reads refs and tracks.
  }, [tracks]);

  useFrame((_, dt) => {
    if (!playing || reducedMotion) return;
    travelled.current += SPEED * Math.min(dt, 0.05);
    place(travelled.current);
  });

  const first = tracks[0];
  const a = first?.stream.points[first.stream.offModel.from];
  const b = first?.stream.points[first.stream.offModel.to];
  return (
    <group>
      {/* Drawn over the tissue so the flow stays visible through the faded brain. */}
      <instancedMesh ref={mesh} args={[geometry, material, total]} frustumCulled={false} renderOrder={5} />
      {a && b && (
        <>
          <Line points={[a, b]} color={CSF} lineWidth={1.5} dashed dashSize={0.002} gapSize={0.0015} />
          <Html position={b} center zIndexRange={[5, 0]} className="offmodel-tag">To the subarachnoid space</Html>
        </>
      )}
    </group>
  );
}
