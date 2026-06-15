import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useControls } from "leva";

const BONE_NAMES = [
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
] as const;

const AXIS = new THREE.Vector3(1, 0, 0);
const tmpQuat = new THREE.Quaternion();

const controlConfig = Object.fromEntries(
  BONE_NAMES.map((name) => [
    name,
    { value: 0, min: 0, max: Math.PI / 2, step: 0.01 },
  ]),
);

interface HandControlsProps {
  bones: Record<string, THREE.Object3D> | null;
}

export function HandControls({ bones }: HandControlsProps) {
  const values = useControls("Hand Controls", controlConfig) as Record<
    string,
    number
  >;
  const restQuats = useRef<Record<string, THREE.Quaternion>>({});

  useEffect(() => {
    if (!bones) return;
    if (Object.keys(restQuats.current).length === 0) {
      BONE_NAMES.forEach((name) => {
        const bone = bones[name];
        if (bone) {
          restQuats.current[name] = bone.quaternion.clone();
        }
      });
    }
  }, [bones]);

  useEffect(() => {
    if (!bones) return;
    BONE_NAMES.forEach((name) => {
      const bone = bones[name];
      const restQuat = restQuats.current[name];
      if (bone && restQuat) {
        tmpQuat.setFromAxisAngle(AXIS, values[name]);
        bone.quaternion.copy(restQuat).multiply(tmpQuat);
      }
    });
  }, [bones, values]);

  return null;
}
