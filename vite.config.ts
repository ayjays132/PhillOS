import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';

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
            additionalManifestEntries: [{ url: '/src/index.tsx', revision: null }],
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
              },
              {
                urlPattern: /\/phonebridge\/.*$/,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'phonebridge-cache',
                  networkTimeoutSeconds: 5,
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 24 * 60 * 60
                  }
                }
              }
            ]
          }
        }),
        viteStaticCopy({
          targets: [
            {
              src: path.resolve(__dirname, 'src/wasm/*'),
              dest: 'wasm'
            }
          ]
        })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
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
