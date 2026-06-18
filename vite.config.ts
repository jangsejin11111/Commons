import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 빌드(배포)에서는 GitHub Pages 프로젝트 경로(https://<user>.github.io/Commons/)에 맞춰
// base를 '/Commons/'로, 로컬 dev에서는 '/'로 둔다.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Commons/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
}));
