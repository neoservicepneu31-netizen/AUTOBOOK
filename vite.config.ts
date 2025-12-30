
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Charge les variables .env en local + les variables d'environnement Vercel
  // Use process.cwd() to correctly obtain the current working directory in a Node environment.
  const env = loadEnv(mode, process.cwd(), '');
  
  // On priorise la variable de l'environnement de build
  // Use process.env to ensure consistent access to build-time environment variables.
  const apiKey = env.API_KEY || process.env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Remplace toutes les occurrences de process.env.API_KEY par la valeur réelle pour le frontend
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
    build: {
      chunkSizeWarningLimit: 2500,
      rollupOptions: {
        output: {
          manualChunks: {
            'gemini-vendor': ['@google/genai'],
            'react-vendor': ['react', 'react-dom'],
            'icons-vendor': ['lucide-react'],
          },
        },
      },
    },
  };
});
