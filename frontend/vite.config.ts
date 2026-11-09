import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 화면은 backend/의 API만 부른다. 같은 주소로 보이게 넘겨서 세션 쿠키가 그대로 맞는다.
    proxy: { '/api': { target: process.env.BACKEND_URL || 'http://localhost:8787' } },
  },
});
