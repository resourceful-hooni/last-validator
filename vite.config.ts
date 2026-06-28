import { defineConfig } from 'vite';

// base: './' (상대경로) → GitHub Pages 프로젝트 페이지(user.github.io/<repo>/)에서
// 레포명을 몰라도 에셋 경로가 깨지지 않도록 한다. (TECH_SPEC §7, 배포 결정)
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 4096,
  },
  server: {
    host: true,
    port: 5173,
  },
});
