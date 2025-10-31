if (/MSIE|Trident/.test(window.navigator.userAgent)) {
  alert(
    "This site doesn't support Internet Explorer. Please use a modern browser."
  );
}
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("ServiceWorker registered with scope:", registration.scope);
      })
      .catch((err) => {
        console.log("ServiceWorker registration failed:", err);
      });
  });
}
