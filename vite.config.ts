import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Fix: Use named exports from node:process to avoid typing issues with the default export
import { cwd, env as processEnv } from 'node:process';

export default defineConfig(({ mode }) => {
  // Charge les variables .env en local + les variables d'environnement Vercel
  // Use the imported cwd() function to correctly obtain the current working directory in a Node environment.
  const env = loadEnv(mode, cwd(), '');
  
  // On priorise la variable de l'environnement de build
  // Use the imported processEnv to ensure consistent access to build-time environment variables.
  const apiKey = env.API_KEY || processEnv.API_KEY;

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
