
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker pour PWA capabilities avec protection d'origine
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', () => {
    // On construit l'URL absolue du SW pour vérifier son origine
    const swUrl = new URL('./sw.js', window.location.href);
    
    // On n'enregistre que si l'origine correspond pour éviter les erreurs de sécurité CORS/Origin
    if (swUrl.origin === window.location.origin) {
      navigator.serviceWorker.register(swUrl.pathname)
        .then(registration => {
          console.log('SW registered successfully');
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Mise à jour automatique sans confirm pour éviter les blocages iframe
                  console.log('New update available, reloading...');
                  window.location.reload();
                }
              };
            }
          };
        })
        .catch(err => {
          console.warn('SW registration skipped or failed:', err.message);
        });
    } else {
      console.log('SW registration skipped: Origin mismatch (Preview mode)');
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
