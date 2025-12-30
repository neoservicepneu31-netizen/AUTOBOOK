import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Import specific functions from node:process to avoid conflict with the global 'Process' type
import { cwd, env as nodeEnv } from 'node:process';

export default defineConfig(({ mode }) => {
  // Charge les variables .env en local + les variables d'environnement Vercel
  // Fix: Use the imported cwd function to get the current working directory safely
  const env = loadEnv(mode, cwd(), '');
  
  // On priorise la variable de l'environnement de build
  // Fix: Access API_KEY from the loaded environment or the nodeEnv object
  const apiKey = env.API_KEY || nodeEnv.API_KEY;

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
