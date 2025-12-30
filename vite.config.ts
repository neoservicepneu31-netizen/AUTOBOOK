
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { cwd, env as nodeEnv } from 'node:process';

export default defineConfig(({ mode }) => {
  // Charge les variables .env en local + les variables d'environnement Vercel
  // Use cwd() from 'node:process' directly to avoid the 'cwd does not exist on type Process' error.
  const env = loadEnv(mode, cwd(), '');
  
  // On priorise la variable de l'environnement de build
  // Use nodeEnv from 'node:process' to ensure consistent access to build-time environment variables.
  const apiKey = env.API_KEY || nodeEnv.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Remplace toutes les occurrences de process.env.API_KEY par la valeur réelle
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
