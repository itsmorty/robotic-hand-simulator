import { Suspense, useRef, useEffect } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import modelUrl from "../models/robotic-hand-draco.glb?url";

interface HandProps {
  onModelLoaded: (bones: Record<string, THREE.Object3D>) => void;
}

export function Hand({ onModelLoaded }: HandProps) {
  const { scene } = useGLTF(modelUrl) as { scene: THREE.Group };
  const modelRef = useRef<THREE.Group | null>(null);
  const bonesRef = useRef<Record<string, THREE.Object3D>>({});

  useEffect(() => {
    if (scene) {
      const bones: Record<string, THREE.Object3D> = {};
      const phalanxNames = [
        "Phalanx_Index_1",
        "Phalanx_Index_2",
        "Phalanx_Index_3",
        "Phalanx_Middle_1",
        "Phalanx_Middle_2",
        "Phalanx_Middle_3",
        "Phalanx_Ring_1",
        "Phalanx_Ring_2",
        "Phalanx_Ring_3",
        "Phalanx_Little_1",
        "Phalanx_Little_2",
        "Phalanx_Little_3",
        "Phalanx_Thumb_1",
        "Phalanx_Thumb_2",
        "Phalanx_Thumb_3",
        "Wrist",
      ];

      phalanxNames.forEach((name) => {
        const bone = scene.getObjectByName(name);
        if (bone) {
          bones[name] = bone;
        }
      });

      bonesRef.current = bones;

      if (onModelLoaded) {
        onModelLoaded(bones);
      }
    }
  }, [scene, onModelLoaded]);

  return (
    <Suspense fallback={null}>
      <primitive ref={modelRef} object={scene} />
    </Suspense>
  );
}
