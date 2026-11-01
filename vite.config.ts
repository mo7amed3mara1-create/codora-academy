import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    host: true,
  },
  esbuild: {
    // Strip all console and debugger traces in production builds
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none', // Strip all comment blocks
  },
  build: {
    sourcemap: false, // Do not expose TypeScript source maps
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react'],
        },
      },
    },
  },
}));
