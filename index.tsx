import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './components/App.tsx';

// DEBUG: Print all environment variables
console.log("[DEBUG] All available environment variables:", import.meta.env);

// Global Error Handler
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global Error:", message, source, lineno, colno, error);
  if (error && error.message && error.message.includes("circular")) {
    console.error("Circular Structure Detected! Check the stack trace above.");
  }
};

// Register Service Worker for Offline & Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('CampusAI: Offline Shield Active ✅'))
      .catch(err => {
        console.warn('CampusAI: SW registration skipped.');
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);