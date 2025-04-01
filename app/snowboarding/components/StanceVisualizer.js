'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function Board({ length = 156, width = 25, stance = 'regular', stanceWidth = 50, frontAngle = 18, backAngle = -6 }) {
  const boardRef = useRef();
  const frontBindingRef = useRef();
  const backBindingRef = useRef();

  useFrame(() => {
    if (boardRef.current) {
      boardRef.current.rotation.y += 0.002;
    }
  });

  const boardScale = [width / 100, 0.1, length / 100];
  const bindingScale = [0.2, 0.05, 0.4];
  const stanceOffset = stanceWidth / 200;

  return (
    <group>
      {/* Snowboard */}
      <mesh ref={boardRef} position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#3B82F6" />
      </mesh>

      {/* Front Binding */}
      <mesh
        ref={frontBindingRef}
        position={[stance === 'regular' ? -stanceOffset : stanceOffset, 0.1, 0]}
        rotation={[0, THREE.MathUtils.degToRad(stance === 'regular' ? frontAngle : backAngle), 0]}
        scale={bindingScale}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1E3A8A" />
      </mesh>

      {/* Back Binding */}
      <mesh
        ref={backBindingRef}
        position={[stance === 'regular' ? stanceOffset : -stanceOffset, 0.1, 0]}
        rotation={[0, THREE.MathUtils.degToRad(stance === 'regular' ? backAngle : frontAngle), 0]}
        scale={bindingScale}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1E3A8A" />
      </mesh>
    </group>
  );
}

export default function StanceVisualizer({ stance, stanceWidth, frontAngle, backAngle, boardLength }) {
  return (
    <div className="w-full h-64 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 2, 3], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Board
          stance={stance}
          stanceWidth={stanceWidth}
          frontAngle={frontAngle}
          backAngle={backAngle}
          length={boardLength}
        />
        <OrbitControls enableZoom={false} />
      </Canvas>
      <div className="absolute bottom-2 left-2 text-xs text-gray-600 dark:text-gray-400">
        Drag to rotate • {stance} stance • {stanceWidth}cm width • {frontAngle}° / {backAngle}°
      </div>
    </div>
  );
} 