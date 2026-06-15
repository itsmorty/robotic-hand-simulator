import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer } from "@react-three/drei";
import { Hand } from "./Hand";

interface SceneProps {
  onModelLoaded: (bones: Record<string, THREE.Object3D>) => void;
}

export function Scene({ onModelLoaded }: SceneProps) {
  return (
    <div className="canvas-wrap">
      <Canvas camera={{ position: [3, 2, 5], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 7]} intensity={1.5} />
        <Environment background={false} resolution={256}>
          <Lightformer
            form="rect"
            intensity={5}
            position={[0, 5, 0]}
            scale={[5, 5, 1]}
          />
          <Lightformer
            form="rect"
            intensity={2}
            position={[-5, 2, 5]}
            scale={[3, 3, 1]}
          />
          <Lightformer
            form="rect"
            intensity={2}
            position={[5, 2, -5]}
            scale={[3, 3, 1]}
          />
        </Environment>
        <Hand onModelLoaded={onModelLoaded} />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
