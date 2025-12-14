import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const apiBase = process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || 'https://pattern-discovery-agent-665374072631.us-central1.run.app';

  return {
    base: './',
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // Proxy API requests to the backend during local development/preview to avoid CORS
        '/a2a': {
          target: apiBase,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
        },
        '/health': {
          target: apiBase,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
