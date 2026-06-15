import { useState } from "react";
import * as THREE from "three";
import { Scene } from "./Scene";
import { HandControls } from "./HandControls";
import { Leva } from "leva";

export default function App() {
  const [bones, setBones] = useState<Record<string, THREE.Object3D> | null>(
    null,
  );

  return (
    <div className="app">
      <Leva />
      <Scene onModelLoaded={setBones} />
      <HandControls bones={bones} />
    </div>
  );
}
