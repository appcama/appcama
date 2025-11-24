import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './lib/sw-registration'
import { PWAOptimizations } from './lib/pwa-config'

// Initialize PWA optimizations
PWAOptimizations.setupViewport();
PWAOptimizations.preloadCriticalResources();

// Register service worker for offline functionality
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
