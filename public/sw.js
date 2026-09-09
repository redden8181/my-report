/* Отчёт — Service Worker.
   При изменении логики кэша ОБЯЗАТЕЛЬНО менять CACHE_NAME. */
const CACHE_NAME = "otchet-cache-v3";

/* Ключ, под которым всегда лежит оболочка приложения. */
const SHELL = "./index.html";

/* Всё, что полезно иметь офлайн. Иконки не критичны для запуска,
   поэтому кэшируются «мягко» — их провал не ломает установку. */
const CORE = [SHELL, "./", "./manifest.json"];
const EXTRA = ["./apple-touch-icon.png", "./icon-512.png"];

/** Кладёт список в кэш по одному: провал одного URL не отменяет остальные. */
async function cacheEach(cache, urls) {
  await Promise.allSettled(
    urls.map(async (url) => {
      try {
        // cache: "reload" — тянем из сети, а не из HTTP-кэша браузера
        const res = await fetch(new Request(url, { cache: "reload" }));
        if (res && (res.ok || res.type === "opaque")) {
          await cache.put(url, res.clone());
        }
      } catch {
        /* этот URL просто не попадёт в кэш */
      }
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // КРИТИЧНО: сначала оболочка. addAll() здесь нельзя — он атомарный
      // и один неудачный файл оставил бы приложение без офлайна.
      await cacheEach(cache, CORE);
      await cacheEach(cache, EXTRA);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key.startsWith("otchet-"))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

/** Ищет оболочку в кэше по всем разумным ключам. */
async function matchShell() {
  const cache = await caches.open(CACHE_NAME);
  return (
    (await cache.match(SHELL)) ||
    (await cache.match("./")) ||
    (await cache.match(new URL("./", self.location.href).href, {
      ignoreSearch: true,
    })) ||
    (await caches.match(SHELL))
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  /* HTML — network-first: свежая версия при наличии сети,
     кэш — когда сети нет. Оболочка всегда переписывается в кэш. */
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (res && res.ok) {
            const copy = res.clone();
            const cache = await caches.open(CACHE_NAME);
            await cache.put(SHELL, copy);
            return res;
          }
          // сервер ответил ошибкой — пробуем кэш
          const cached = await matchShell();
          return cached || res;
        } catch {
          // сети нет — отдаём сохранённую оболочку
          const cached = await matchShell();
          if (cached) return cached;
          return new Response(
            "<!doctype html><meta charset='utf-8'><title>Офлайн</title>" +
              "<body style='font-family:-apple-system,sans-serif;padding:40px;text-align:center'>" +
              "<h2>Нет соединения</h2><p>Откройте приложение один раз при интернете, " +
              "чтобы оно заработало офлайн.</p></body>",
            { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
          );
        }
      })()
    );
    return;
  }

  /* Остальное — cache-first с дозаписью. */
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.ok) {
          const copy = res.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put(req, copy);
        }
        return res;
      } catch {
        // для картинок/иконок офлайн — пустой ответ вместо падения
        return new Response("", { status: 504, statusText: "offline" });
      }
    })()
  );
});
