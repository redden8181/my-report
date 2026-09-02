import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";

/* ---------- Service Worker: офлайн и автообновление ---------- */

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    const hadController = !!navigator.serviceWorker.controller;

    // Если пришла новая версия приложения — мягко перезагружаемся.
    // Локальные данные лежат в localStorage и от кэша не зависят.
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController || refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        reg.update().catch(() => undefined);
        // Проверка обновлений каждые 30 минут.
        window.setInterval(() => {
          reg.update().catch(() => undefined);
        }, 30 * 60 * 1000);
      })
      .catch(() => undefined);
  });
}

registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
