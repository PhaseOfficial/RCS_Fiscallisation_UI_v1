import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    proxy: {
      // This forwards requests from localhost to ZIMRA
      '/zimra-proxy': {
        target: 'https://fdmsapitest.zimra.co.zw', // Use https://fdmsapi.zimra.co.zw for Live
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/zimra-proxy/, '')
      }
    }
  }
  
});
