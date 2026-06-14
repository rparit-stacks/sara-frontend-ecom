import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef } from 'react';
import { Group } from 'three';
import { THEME_3D } from '../theme3d';

export interface GlobeMarker {
  /** 0..1 share, used to size the marker. */
  weight: number;
  /** stable index used to spread markers around the globe. */
  index: number;
}

function latLonToVec3(lat: number, lon: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

function Globe({ markers }: { markers: GlobeMarker[] }) {
  const group = useRef<Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.15;
  });

  return (
    <group ref={group}>
      {/* Wireframe globe in theme teal */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial color={THEME_3D.primary} wireframe opacity={0.55} transparent />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.48, 32, 32]} />
        <meshStandardMaterial color={THEME_3D.primaryDark} opacity={0.25} transparent />
      </mesh>
      {/* Markers spread deterministically so top locations cluster on the visible face */}
      {markers.map((m) => {
        const lat = 60 - (m.index * 47) % 120;
        const lon = (m.index * 97) % 360 - 180;
        const pos = latLonToVec3(lat, lon, 1.55);
        const size = 0.05 + m.weight * 0.18;
        return (
          <mesh key={m.index} position={pos}>
            <sphereGeometry args={[size, 12, 12]} />
            <meshStandardMaterial color={THEME_3D.primaryLight} emissive={THEME_3D.primary} emissiveIntensity={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Rotating wireframe globe with markers for Active Users by country. */
export function Globe3D({ markers }: { markers: GlobeMarker[] }) {
  return (
    <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }} style={{ width: '100%', height: '100%' }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 4, 5]} intensity={1} />
      <Globe markers={markers} />
      <OrbitControls enablePan={false} enableZoom={false} />
    </Canvas>
  );
}
