const CACHE_NAME = "format-perfection-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/add.html",
  "/fight.html",
  "/fight.js",
  "/fight.css",
  "/imageconverter.js",
  "/imageconverter.css",
  "/imageconverter.html",
  "/manifest.json",
  "/paddle.css",
  "/paddle.html",
  "/paddle.js",
  "/painxl.html",
  "/path.txt",
  "/pdfmerger.html",
  "/pdfmerger.css",
  "/pdfmerger.js",
  "/pdfsplitter.html",
  "/pdfsplitter.js",
  "/pdfsplitter.css",
  "/rm-background.html",
  "/runner.c",
  "/script.js",
  "/suggestions.php",
  "/typewriter.js",
  "/assets/utif/UTIF.js",
  "/assets/gif.min.js",
  "/assets/gif-worker.js",
  "/assets/utif/UTIF.js",
  "/assets/jspdf.umd.min.js",
  "/assets/pdf-lib.js",
  "/assets/pdf.min.mjs",
  "/assets/Font.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
