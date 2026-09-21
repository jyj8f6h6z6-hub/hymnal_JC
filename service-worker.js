/* 詩歌數字轉盤｜離線版 Service Worker
   核心原則：
   1. 首次連網後預先保存首頁、CSS、JS、全部 hymns.js 歌詞資料。
   2. 圖片個別快取；即使某張圖片不存在，也不影響核心離線功能安裝。
   3. 導覽請求採 network-first：有網路優先取得新版，離線時回退快取首頁。
   4. 靜態資源採 stale-while-revalidate：立即使用快取，同時背景更新。
*/

const CACHE_VERSION = "hymnal-offline-v1-20260921";
const CORE_CACHE = `${CACHE_VERSION}-core`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./hymns.js",
  "./app.js",
  "./enhancements.js",
  "./manifest.webmanifest"
];

const OPTIONAL_ASSETS = [
  "./images/desktop-icon-32.png",
  "./images/desktop-icon-180.png",
  "./images/詩歌本.webp",
  "./images/詩歌補充本.webp",
  "./images/新歌頌詠.webp",
  "./images/兒童詩歌.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CORE_CACHE);
    // 核心檔案必須成功，確保歌詞與操作程式真的可離線使用。
    await cache.addAll(CORE_ASSETS);

    // 圖片採逐一嘗試，避免單一缺圖造成整個 Service Worker 安裝失敗。
    await Promise.allSettled(
      OPTIONAL_ASSETS.map(async (url) => {
        const response = await fetch(url, { cache: "reload" });
        if (response.ok) await cache.put(url, response);
      })
    );

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("hymnal-offline-") && key !== CORE_CACHE && key !== RUNTIME_CACHE)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 頁面導覽：有網路就更新首頁；斷網時使用已保存的首頁。
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch (_) {
        return (await caches.match(request)) ||
               (await caches.match("./index.html")) ||
               (await caches.match("./"));
      }
    })());
    return;
  }

  // CSS / JS / 圖片 / manifest：快取優先，連網時順便更新。
  event.respondWith((async () => {
    const cached = await caches.match(request);
    const networkPromise = fetch(request).then(async (response) => {
      if (response && response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    }).catch(() => null);

    if (cached) {
      event.waitUntil(networkPromise);
      return cached;
    }

    const network = await networkPromise;
    if (network) return network;

    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  })());
});
