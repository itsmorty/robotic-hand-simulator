import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useControls } from "leva";
import { useHandPose } from "./useHandPose";
import { HandPoseOverlay } from "./HandPoseOverlay";
import type { Keypoint } from "@tensorflow-models/hand-pose-detection";

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

type BoneName = (typeof BONE_NAMES)[number];

const AXIS = new THREE.Vector3(1, 0, 0);
const tmpQuat = new THREE.Quaternion();

const SMOOTHING = 0.15;
const MAX_CURL = Math.PI / 2;

const controlConfig = {
  Imitation: false,
  ...Object.fromEntries(
    BONE_NAMES.map((name) => [
      name,
      { value: 0, min: 0, max: MAX_CURL, step: 0.01 },
    ]),
  ),
};

interface HandControlsProps {
  bones: Record<string, THREE.Object3D> | null;
}

interface FingerDef {
  base: number;
  mid: number;
  tip: number;
}

const FINGERS: Record<string, FingerDef[]> = {
  Index: [
    { base: 0, mid: 5, tip: 6 },
    { base: 5, mid: 6, tip: 7 },
    { base: 6, mid: 7, tip: 8 },
  ],
  Middle: [
    { base: 0, mid: 9, tip: 10 },
    { base: 9, mid: 10, tip: 11 },
    { base: 10, mid: 11, tip: 12 },
  ],
  Ring: [
    { base: 0, mid: 13, tip: 14 },
    { base: 13, mid: 14, tip: 15 },
    { base: 14, mid: 15, tip: 16 },
  ],
  Little: [
    { base: 0, mid: 17, tip: 18 },
    { base: 17, mid: 18, tip: 19 },
    { base: 18, mid: 19, tip: 20 },
  ],
  Thumb: [
    { base: 0, mid: 1, tip: 2 },
    { base: 1, mid: 2, tip: 3 },
    { base: 2, mid: 3, tip: 4 },
  ],
};

export function HandControls({ bones }: HandControlsProps) {
  const values = useControls("Hand Controls", controlConfig) as Record<
    string,
    number | boolean
  >;
  const valuesRef = useRef(values);
  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  const imitationEnabled = Boolean(values.Imitation);

  const { videoRef, canvasRef, isReady, error, landmarksRef } = useHandPose({
    enabled: imitationEnabled,
  });

  const restQuats = useRef<Record<string, THREE.Quaternion>>({});
  const smoothed = useRef<Record<BoneName, number>>({} as Record<BoneName, number>);

  // Capture rest rotations once when bones become available.
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

  // Continuously apply rotations, either from hand detection or from sliders.
  useEffect(() => {
    if (!bones) return;
    const currentBones = bones;

    let raf = 0;
    const targets: Record<BoneName, number> = {} as Record<BoneName, number>;

    function frame() {
      const currentValues = valuesRef.current;
      const useImitation = Boolean(currentValues.Imitation);
      const landmarks = landmarksRef.current;

      if (useImitation && landmarks) {
        computeTargetsFromLandmarks(landmarks, targets);
      }

      BONE_NAMES.forEach((name) => {
        const bone = currentBones[name];
        const restQuat = restQuats.current[name];
        if (!bone || !restQuat) return;

        let target: number;
        if (useImitation) {
          // Bones that are not driven by landmarks (e.g. Wrist) fall back to
          // their manual slider value.
          target = clamp(
            targets[name] ?? Number(currentValues[name] ?? 0),
            0,
            MAX_CURL,
          );
        } else {
          target = Number(currentValues[name] ?? 0);
        }

        const prev = smoothed.current[name] ?? target;
        const next = prev + (target - prev) * SMOOTHING;
        smoothed.current[name] = next;

        tmpQuat.setFromAxisAngle(AXIS, next);
        bone.quaternion.copy(restQuat).multiply(tmpQuat);
      });

      raf = requestAnimationFrame(frame);
    }

    frame();
    return () => cancelAnimationFrame(raf);
  }, [bones, landmarksRef]);

  return (
    <HandPoseOverlay
      videoRef={videoRef}
      canvasRef={canvasRef}
      enabled={imitationEnabled}
      isReady={isReady}
      error={error}
      landmarksRef={landmarksRef}
    />
  );
}

function computeTargetsFromLandmarks(
  landmarks: Keypoint[],
  out: Record<BoneName, number>,
) {
  for (const [fingerName, joints] of Object.entries(FINGERS)) {
    joints.forEach((joint, index) => {
      const base = landmarks[joint.base];
      const mid = landmarks[joint.mid];
      const tip = landmarks[joint.tip];
      if (!base || !mid || !tip) return;

      const curl = curlAt(base, mid, tip);
      const boneName = `Phalanx_${fingerName}_${index + 1}` as BoneName;
      out[boneName] = curl;
    });
  }
}

function curlAt(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const v1 = vector(b, a);
  const v2 = vector(b, c);
  const angle = angleBetween(v1, v2);
  // A straight finger has a joint angle of ~PI, so curl = PI - angle.
  return clamp(Math.PI - angle, 0, MAX_CURL);
}

function vector(from: Keypoint, to: Keypoint) {
  return {
    x: to.x - from.x,
    y: to.y - from.y,
    z: (to.z ?? 0) - (from.z ?? 0),
  };
}

function angleBetween(
  v1: { x: number; y: number; z: number },
  v2: { x: number; y: number; z: number },
): number {
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
  if (len1 === 0 || len2 === 0) return 0;
  const cos = clamp(dot / (len1 * len2), -1, 1);
  return Math.acos(cos);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
