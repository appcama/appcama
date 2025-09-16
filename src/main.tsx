import { createRoot } from 'react-dom/client'
import * as React from 'react'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './lib/sw-registration'
import { PWAOptimizations } from './lib/pwa-config'

// Ensure React is properly loaded
if (!React) {
  console.error('React is not properly loaded');
}

// Initialize PWA optimizations
PWAOptimizations.setupViewport();
PWAOptimizations.preloadCriticalResources();

// Register service worker for offline functionality
registerServiceWorker();

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error('Root element not found');
}
