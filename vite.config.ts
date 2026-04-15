import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Fix: Import process as a default export from node:process to avoid issues with named exports in some environments
import process from 'process';

export default defineConfig(({ mode }) => {
  // Charge les variables .env en local + les variables d'environnement Vercel
  // Fix: Use process.cwd() to reliably obtain the current working directory for loadEnv
  const env = loadEnv(mode, process.cwd(), '');
  
  // On priorise la variable de l'environnement de build
  // Fix: Access API_KEY from the loaded environment or the process.env object directly
  const apiKey = env.API_KEY || process.env.API_KEY;

  return {
    plugins: [react()],
    server: {
      hmr: false,
    },
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
