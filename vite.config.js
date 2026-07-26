import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    process.env.ANALYZE === 'true' && visualizer({ open: false, filename: 'stats.html' }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            // Authenticated Supabase responses must never enter Cache Storage.
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\//i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-public-storage',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
      },
    }),
  ],
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    sourcemap: mode === 'development' ? true : 'hidden',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom')) return 'vendor-router';
            if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('@stripe') || id.includes('/stripe/')) return 'vendor-stripe';
            if (id.includes('@emailjs')) return 'vendor-email';
            if (id.includes('date-fns')) return 'vendor-date';
            if (id.includes('dompurify')) return 'vendor-sanitize';
            if (id.includes('@headlessui') || id.includes('@radix-ui')) return 'vendor-ui-primitives';
            if (id.includes('lucide-react')) return 'vendor-ui-icons';
            if (id.includes('framer-motion')) return 'vendor-animation';
            if (id.includes('recharts')) return 'vendor-charts';
            return 'vendor';
          }
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }

}))
