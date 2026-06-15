import { useEffect, useRef, useState } from "react";
import type {
  Keypoint,
  Hand,
  HandDetector,
  MediaPipeHandsMediaPipeModelConfig,
} from "@tensorflow-models/hand-pose-detection";

export interface UseHandPoseOptions {
  enabled: boolean;
}

export interface UseHandPoseResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isReady: boolean;
  error: string | null;
  landmarksRef: React.MutableRefObject<Keypoint[] | null>;
}

export function useHandPose({ enabled }: UseHandPoseOptions): UseHandPoseResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<HandDetector | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const landmarksRef = useRef<Keypoint[] | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsReady(false);
      setError(null);
      landmarksRef.current = null;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
      }
      return;
    }

    let cancelled = false;

    async function setup() {
      try {
        // Load the detector and WebGL backend on demand to keep the initial
        // bundle small.
        const [handPoseDetection] = await Promise.all([
          import("@tensorflow-models/hand-pose-detection"),
          import("@tensorflow/tfjs-backend-webgl"),
        ]);

        const detector = await handPoseDetection.createDetector(
          handPoseDetection.SupportedModels.MediaPipeHands,
          {
            runtime: "mediapipe",
            solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
            modelType: "full",
            maxHands: 1,
          } as MediaPipeHandsMediaPipeModelConfig,
        );

        if (cancelled) {
          detector.dispose();
          return;
        }
        detectorRef.current = detector;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          detector.dispose();
          return;
        }
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;

        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject(new Error("Failed to load video"));
        });

        if (cancelled) return;
        await video.play();
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        setIsReady(true);
        detectFrame();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setIsReady(false);
      }
    }

    async function detectFrame() {
      if (cancelled) return;
      const video = videoRef.current;
      const detector = detectorRef.current;
      const canvas = canvasRef.current;
      if (!video || !detector || video.paused || video.ended) return;

      let hands: Hand[] = [];
      try {
        hands = await detector.estimateHands(video, {
          flipHorizontal: false,
          staticImageMode: false,
        });
      } catch {
        hands = [];
      }

      const hand = hands[0];
      landmarksRef.current = hand?.keypoints ?? null;

      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (hand?.keypoints) {
            drawHand(ctx, hand.keypoints);
          }
        }
      }

      rafRef.current = requestAnimationFrame(detectFrame);
    }

    setup();

    return () => {
      cancelled = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
      }
      setIsReady(false);
      setError(null);
      landmarksRef.current = null;
    };
  }, [enabled]);

  return { videoRef, canvasRef, isReady, error, landmarksRef };
}

const CONNECTED_PAIRS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
];

function drawHand(ctx: CanvasRenderingContext2D, keypoints: Keypoint[]) {
  ctx.fillStyle = "#00ff88";
  ctx.strokeStyle = "#00ff88";
  ctx.lineWidth = 2;

  for (const kp of keypoints) {
    ctx.beginPath();
    ctx.arc(kp.x, kp.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const [start, end] of CONNECTED_PAIRS) {
    const a = keypoints[start];
    const b = keypoints[end];
    if (!a || !b) continue;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}
