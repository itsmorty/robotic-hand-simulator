# AGENTS.md

## Commands
- **Dev server**: `pnpm dev`
- **Build**: `pnpm build`
- **Preview build**: `pnpm preview`
- No test, lint, or typecheck scripts exist — don't try to run them.

## Architecture
- Entry: `index.html` → `src/main.jsx` → `src/App.jsx`
- 3D scene via React Three Fiber (`@react-three/fiber` + `@react-three/drei`)
- Debug GUI via `leva` (`<Leva />` in App, `useControls` in HandControls)

## 3D Model
- Single model: `models/robotic-hand-draco.glb` (Draco-compressed GLB)
- Imported via `?url` suffix: `import modelUrl from '../models/robotic-hand-draco.glb?url'`
- Vite config includes `.fbx`, `.glb`, `.gltf` in `assetsInclude`

## Bone Names
- Hardcoded in both `src/Hand.jsx` (scene lookup) and `src/HandControls.jsx` (slider controls)
- If the model changes, both arrays must stay in sync.
