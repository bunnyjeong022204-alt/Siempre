import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // 페이지: 회원가입·로그인(React, index.html), 권희수 님 화면(siempre-figma-prototype.html),
    // 소개 랜딩 웹 버전(landing.html)과 휴대폰용 앱 버전(landing-app.html)
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        prototype: resolve(__dirname, 'siempre-figma-prototype.html'),
        landing: resolve(__dirname, 'landing.html'),
        landingApp: resolve(__dirname, 'landing-app.html'),
      },
    },
  },
  server: {
    port: 5173,
    // 화면은 backend/의 API만 부른다. 같은 주소로 보이게 넘겨서 로그인 토큰 요청이 그대로 간다.
    proxy: { '/api': { target: process.env.BACKEND_URL || 'http://localhost:8787' } },
  },
});
