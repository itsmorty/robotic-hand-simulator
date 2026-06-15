import type { Keypoint } from "@tensorflow-models/hand-pose-detection";

interface HandPoseOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  enabled: boolean;
  isReady: boolean;
  error: string | null;
  landmarksRef: React.MutableRefObject<Keypoint[] | null>;
}

export function HandPoseOverlay({
  videoRef,
  canvasRef,
  enabled,
  isReady,
  error,
}: HandPoseOverlayProps) {
  if (!enabled) return null;

  return (
    <div className="hand-pose-overlay">
      <video ref={videoRef} className="hand-pose-video" playsInline muted />
      <canvas ref={canvasRef} className="hand-pose-canvas" />
      {!isReady && !error && (
        <div className="hand-pose-status">Starting camera…</div>
      )}
      {error && <div className="hand-pose-status error">{error}</div>}
    </div>
  );
}
