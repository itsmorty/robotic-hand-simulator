# AGENTS.md

## Commands
- Package manager: `pnpm` (lockfile is `pnpm-lock.yaml`).
- **Dev server**: `pnpm dev`
- **Build**: `pnpm build`
- **Preview build**: `pnpm preview`
- No `test`, `lint`, or `typecheck` scripts exist. To manually type-check, run `pnpm tsc --noEmit` (tsconfig already sets `noEmit: true`).

## Architecture
- Entry: `index.html` → `src/main.tsx` → `src/App.tsx`. All source files are `.tsx`, not `.jsx`.
- 3D scene via React Three Fiber (`@react-three/fiber` + `@react-three/drei`).
- Debug GUI via `leva` (`<Leva />` in `App.tsx`, `useControls` in `HandControls.tsx`).

## 3D model
- Single model: `models/robotic-hand-draco.glb` (Draco-compressed GLB).
- Imported with the `?url` suffix: `import modelUrl from '../models/robotic-hand-draco.glb?url'`.
- `vite.config.ts` includes `.fbx`, `.glb`, `.gltf` in `assetsInclude`, and sets `server.fs.allow: ['..']`.

## Hand controls & bones
- Driveable bone names are hardcoded in both `src/Hand.tsx` (scene lookup) and `src/HandControls.tsx` (sliders + landmarks mapping). If the model changes, keep these two lists in sync.
- Rotations are applied relative to each bone's captured rest quaternion, around the X axis.

## Hand imitation mode
- The `Imitation` toggle in the `Hand Controls` leva panel enables webcam hand tracking.
- It lazy-loads `@tensorflow-models/hand-pose-detection` and `@tensorflow/tfjs-backend-webgl`, then runs MediaPipe Hands from `https://cdn.jsdelivr.net/npm/@mediapipe/hands`.
- Requires camera permission; works on `localhost` or HTTPS. No camera = the feature simply errors and shows the error in the overlay.
