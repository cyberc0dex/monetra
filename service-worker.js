importScripts("./js/config.js");
const CACHE = `monetra-shell-v${globalThis.MONETRA_CONFIG.release}`;
const SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/config.js",
  "./js/app.js",
  "./manifest.json",
  "./assets/icons/app-icon.svg",
  "./assets/icons/app-icon-512.png",
  "./assets/icons/lucide.svg",
  "./assets/wallet-balance.png",
  "./assets/vehicles/Vehicle_Coupe_Black.png",
  "./assets/vehicles/Vehicle_Coupe_Blue.png",
  "./assets/vehicles/Vehicle_Coupe_Grey.png",
  "./assets/vehicles/Vehicle_Coupe_Red.png",
  "./assets/vehicles/Vehicle_Coupe_Silver.png",
  "./assets/vehicles/Vehicle_Coupe_White.png",
  "./assets/vehicles/Vehicle_Hatchback_Black.png",
  "./assets/vehicles/Vehicle_Hatchback_Blue.png",
  "./assets/vehicles/Vehicle_Hatchback_Grey.png",
  "./assets/vehicles/Vehicle_Hatchback_Red.png",
  "./assets/vehicles/Vehicle_Hatchback_Silver.png",
  "./assets/vehicles/Vehicle_Hatchback_White.png",
  "./assets/vehicles/Vehicle_Sedan_Black.png",
  "./assets/vehicles/Vehicle_Sedan_Blue.png",
  "./assets/vehicles/Vehicle_Sedan_Grey.png",
  "./assets/vehicles/Vehicle_Sedan_Red.png",
  "./assets/vehicles/Vehicle_Sedan_Silver.png",
  "./assets/vehicles/Vehicle_Sedan_White.png",
  "./assets/vehicles/Vehicle_SUV_Black.png",
  "./assets/vehicles/Vehicle_SUV_Blue.png",
  "./assets/vehicles/Vehicle_SUV_Grey.png",
  "./assets/vehicles/Vehicle_SUV_Red.png",
  "./assets/vehicles/Vehicle_SUV_Silver.png",
  "./assets/vehicles/Vehicle_SUV_White.png",
  "./assets/vehicles/Vehicle_Van_Black.png",
  "./assets/vehicles/Vehicle_Van_Blue.png",
  "./assets/vehicles/Vehicle_Van_Grey.png",
  "./assets/vehicles/Vehicle_Van_Red.png",
  "./assets/vehicles/Vehicle_Van_Silver.png",
  "./assets/vehicles/Vehicle_Van_White.png"
];

// Activation is allowed only after every offline asset has downloaded.
self.addEventListener("install", event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll(
    SHELL.map(path => new Request(new URL(path, self.registration.scope), { cache: "reload" }))
  )).then(() => self.skipWaiting())
));
self.addEventListener("activate", event => event.waitUntil(
  caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith("monetra-shell-") && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim())
));
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin ||
      !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      return await fetch(request);
    } catch (error) {
      // Never return HTML for missing scripts, styles, or images.
      if (request.mode === "navigate") {
        const page = await cache.match(new URL("./index.html", self.registration.scope).href);
        if (page) return page;
      }
      return Response.error();
    }
  })());
});
