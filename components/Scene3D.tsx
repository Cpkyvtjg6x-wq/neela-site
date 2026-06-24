"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, ContactShadows } from "@react-three/drei";
import type { Group } from "three";

/**
 * Scène 3D temps réel (WebGL via react-three-fiber) : des panneaux « données /
 * créatives » flottent dans l'espace, le groupe pivote doucement et réagit au
 * curseur. Chargée en lazy (ssr:false) et gatée par useCanRenderHeavy côté parent.
 */

type Panel = {
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
  emissive?: string;
  e?: number;
};

const PANELS: Panel[] = [
  { pos: [0, 0, 0], size: [1.7, 1.05, 0.12], color: "#2563EB", emissive: "#2563EB", e: 0.5 },
  { pos: [-1.9, 0.7, -0.6], size: [1.05, 0.72, 0.1], color: "#ffffff" },
  { pos: [1.8, -0.5, -0.5], size: [1.15, 0.8, 0.1], color: "#ffffff" },
  { pos: [-1.3, -0.95, 0.6], size: [0.85, 0.58, 0.1], color: "#dbe6ff" },
  { pos: [1.35, 0.95, 0.5], size: [0.95, 0.62, 0.1], color: "#dbe6ff" },
  { pos: [0.25, 1.45, -0.9], size: [0.72, 0.5, 0.1], color: "#ffffff" },
  { pos: [-0.45, -1.5, -0.5], size: [0.78, 0.52, 0.1], color: "#2563EB", emissive: "#2563EB", e: 0.35 },
];

function Panels() {
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    // rotation lente + parallaxe au curseur
    group.current.rotation.y = Math.sin(t * 0.14) * 0.28 + state.pointer.x * 0.35;
    group.current.rotation.x = -state.pointer.y * 0.18 + Math.sin(t * 0.1) * 0.04;
  });
  return (
    <group ref={group}>
      {PANELS.map((p, i) => (
        <Float key={i} speed={1.1 + i * 0.12} rotationIntensity={0.35} floatIntensity={0.9}>
          <RoundedBox args={p.size} radius={0.06} smoothness={4} position={p.pos}>
            <meshStandardMaterial
              color={p.color}
              emissive={p.emissive ?? "#000000"}
              emissiveIntensity={p.e ?? 0}
              roughness={0.32}
              metalness={0.15}
            />
          </RoundedBox>
        </Float>
      ))}
    </group>
  );
}

export default function Scene3D() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 0, 6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} />
      <pointLight position={[-5, -2, 3]} intensity={60} color="#2563EB" distance={25} />
      <Panels />
      <ContactShadows position={[0, -2.4, 0]} opacity={0.35} scale={12} blur={2.6} far={4} color="#0a1430" />
    </Canvas>
  );
}
