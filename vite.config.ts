import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Fix: Import the default process object to resolve the issue where 'cwd' is not found as a named export
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Charge les variables .env en local + les variables d'environnement Vercel
  // Fix: Use process.cwd() instead of named export cwd() to reliably get the current working directory
  const env = loadEnv(mode, process.cwd(), '');
  
  // On priorise la variable de l'environnement de build
  // Fix: Access API_KEY from the loaded environment or the process.env object directly
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
