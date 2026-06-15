import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.fbx', '**/*.glb', '**/*.gltf'],
  server: {
    fs: {
      allow: ['..'],
    },
  },
});
