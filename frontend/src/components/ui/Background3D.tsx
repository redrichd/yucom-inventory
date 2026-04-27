import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
// @ts-expect-error - maath subpath missing types
import * as random from 'maath/random/dist/maath-random.esm';

function ParticleField() {
  const ref = useRef<any>(null);
  const sphere = random.inSphere(new Float32Array(3000), { radius: 10 });

  useFrame((_state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 20;
      ref.current.rotation.y -= delta / 25;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#3b82f6"
          size={0.03}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.3}
        />
      </Points>
    </group>
  );
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none opacity-40">
      <Canvas camera={{ position: [0, 0, 8] }}>
        <ParticleField />
      </Canvas>
    </div>
  );
}
