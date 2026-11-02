/* 詩歌數字轉盤｜離線版 Service Worker
   核心原則：
   1. 首次連網後預先保存首頁、CSS、JS、全部 hymns.js 歌詞資料。
   2. 圖片個別快取；即使某張圖片不存在，也不影響核心離線功能安裝。
   3. 導覽與核心程式採同版本 cache-first，避免跨版混用。
   4. 新版完整安裝後立即啟用，但不強制刷新畫面（v2.3.1）。
*/

const CACHE_VERSION = "hymnal-offline-v2-20261102-v2.3.1";
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
    // cache: "reload" 繞過瀏覽器 HTTP 快取，確保抓到最新的 hymns.js 等檔案。
    await Promise.all(CORE_ASSETS.map(async (url) => {
      const response = await fetch(url, { cache: "reload" });
      if (!response.ok) throw new Error(`核心檔案下載失敗：${url}`);
      await cache.put(url, response);
    }));

    // 圖片採逐一嘗試，避免單一缺圖造成整個 Service Worker 安裝失敗。
    await Promise.allSettled(
      OPTIONAL_ASSETS.map(async (url) => {
        const response = await fetch(url, { cache: "reload" });
        if (response.ok) await cache.put(url, response);
      })
    );

    // v2.3.1：核心檔案已完整存入同版快取，可安全啟用。
    // 手機 PWA 通常只會被切到背景、不會真正關閉，若不 skipWaiting，新版會一直等待而無法更新。
    // 目前畫面不會被強制刷新，頁面端會在使用者回到 App 時再重新載入。
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
    // v2.3.1：接管現有頁面，讓之後的請求都走新版快取。
    await self.clients.claim();
  })());
});

// 所有版本化核心資源均從已完成安裝的同版快取供應。
// 不再對 app.js / hymns.js 等獨立採 network-first，以免讀到混合版本。
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CORE_CACHE);
      return (await cache.match("./index.html")) ||
             (await cache.match("./")) ||
             fetch(request);
    })());
    return;
  }

  const corePaths = ["/style.css", "/hymns.js", "/app.js", "/enhancements.js", "/manifest.webmanifest"];
  if (corePaths.some(path => url.pathname.endsWith(path))) {
    event.respondWith((async () => {
      const cache = await caches.open(CORE_CACHE);
      return (await cache.match(request)) || fetch(request);
    })());
    return;
  }

  // 圖片採快取優先，背景更新；單張圖片失效不影響歌詞離線使用。
  event.respondWith((async () => {
    const cached = await caches.match(request);
    const networkPromise = fetch(request).then(async response => {
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
    return (await networkPromise) || new Response("Offline", { status: 503 });
  })());
});
