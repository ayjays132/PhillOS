import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {},
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
