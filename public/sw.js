const CACHE = "nilesignal-v3";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add("/icon.svg")).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((key) => key.startsWith("nilesignal-") && key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate" || event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).pathname === "/") {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put("/", copy)).catch(() => {});
    }
    return response;
  }).catch(() => caches.match("/").then((page) => page || Response.error())));
});
