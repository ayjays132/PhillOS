import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
   return {
      base: './',
      define: {},
      plugins: [
        VitePWA({
          registerType: 'autoUpdate',
          strategies: 'generateSW',
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
            additionalManifestEntries: [{ url: '/index.tsx', revision: null }],
            runtimeCaching: [
              {
                urlPattern: /\/api\/.*$/,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-cache',
                  networkTimeoutSeconds: 5,
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 24 * 60 * 60
                  }
                }
              }
            ]
          }
        })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('openai') || id.includes('@google/genai') || id.includes('ollama')) {
                  return 'ai-vendors';
                }
                if (id.includes('lucide-react')) {
                  return 'lucide';
                }
                if (id.includes('react')) {
                  return 'react';
                }
              }
            }
          }
        }
      }
    };
});
