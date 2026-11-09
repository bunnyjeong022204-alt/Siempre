import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 회원가입 API(server/)로 넘긴다. 같은 주소로 보이므로 간편가입 state 쿠키가 그대로 맞는다.
    proxy: { '/api': { target: 'http://localhost:8787' } },
  },
});
