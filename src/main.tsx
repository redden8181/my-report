import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Clear corrupted localStorage on startup
try {
  const saved = localStorage.getItem('otchet_app_data');
  if (saved) {
    const data = JSON.parse(saved);
    if (!data || typeof data !== 'object' || !Array.isArray(data.transactions)) {
      localStorage.removeItem('otchet_app_data');
    }
  }
} catch {
  localStorage.removeItem('otchet_app_data');
}

// Register Service Worker — auto-update on new version
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      // Check for updates every 30 minutes
      setInterval(() => reg.update(), 30 * 60 * 1000);

      // When a new SW is waiting, reload to apply update
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'activated') {
            // New version activated — reload page silently
            window.location.reload();
          }
        });
      });
    }).catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
