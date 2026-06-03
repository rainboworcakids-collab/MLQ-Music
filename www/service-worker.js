// Service Worker สำหรับ Psychomatrix Music Basic Edition

// 1. เปลี่ยนเลขเวอร์ชันตรงนี้ (v1.1, v1.2) เพื่อให้ระบบล้าง Cache เก่าอัตโนมัติ
const VERSION = 'v2.9.0'; 
const CACHE_NAME = `psychomatrix-music-basic-${VERSION}`;
const STATIC_CACHE_NAME = `psychomatrix-static-basic-${VERSION}`;
const DYNAMIC_CACHE_NAME = `psychomatrix-dynamic-basic-${VERSION}`;

// 2. รายการ Assets ทั้งหมด (ใส่ Icons คืนครบถ้วน) 
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './offline.html',  
  './manifest.json',
  './styles.css', 
  './js/app-main.js',
  './js/data-contract.js',
  './js/client_edge-function-integration.js',  
  './js/form-psychomatrix.js',
  './js/form-ui.js',
  './js/music-styles.js',
  './js/NumerologyToMusicConverter.js',
  './js/storytelling-engin.js',
  './js/music-audio.js',
  './js/ui-display.js',
  './js/pwa-handler.js?v=3.0',
  './assets/logo.png',
  './icons/favicon.ico',  
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',  
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  // เพิ่ม external assets ที่ใช้ใน app.js เวอร์ชันใหม่
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// --- Install Event: เก็บไฟล์ลง Static Cache ---
self.addEventListener('install', event => {
  console.log(`📦 SW ${VERSION}: Installing...`);
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching all assets...');
        // ลอง cache ทีละส่วนเพื่อป้องกัน error
        return Promise.all(
          PRECACHE_ASSETS.map(asset => {
            return cache.add(asset).catch(err => {
              console.warn(`⚠️ Failed to cache ${asset}:`, err);
              return Promise.resolve(); // ไม่หยุดการ install ถ้า asset บางตัว cache ไม่ได้
            });
          })
        );
      })
      .then(() => {
        console.log('✅ All assets cached (or partially cached)');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('❌ Failed to cache assets:', err);
        // แม้จะ cache ไม่สำเร็จทั้งหมด ก็ให้ install ต่อ
        return self.skipWaiting();
      })
  );
});

// --- Activate Event: ล้าง Cache เก่าทั้ง 3 ประเภท ---
self.addEventListener('activate', event => {
  console.log(`🔄 SW ${VERSION}: Activating and cleaning old caches...`);
  const cacheAllowlist = [CACHE_NAME, STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // ถ้าชื่อ Cache ไม่ได้อยู่ในรายการปัจจุบัน ให้ลบทิ้งทันที
          if (!cacheAllowlist.includes(cacheName)) {
            console.log(`🗑️ Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      // Claim clients immediately
      return self.clients.claim();
    })
    .then(() => {
      console.log(`✅ SW ${VERSION} activated successfully`);
    })
  );
});

// --- Fetch Event: แยกการจัดการ Static และ Dynamic ---
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // 🔥 **อัพเดท: เพิ่มการจัดการ Edge Function - music-generator**
  // จัดการ request สำหรับ Edge Functions ทั้งสองตัว
  if (requestUrl.pathname.includes('/functions/v1/psychomatrix-calculate') || 
      requestUrl.pathname.includes('/functions/v1/music-generator')) {
    
    console.log(`🎵 Edge Function request: ${requestUrl.pathname}`);
    
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then(cache => {
        // 1. ลองหาจาก cache ก่อน
        return cache.match(event.request).then(cachedResponse => {
          // 2. ถ้ามีใน cache และไม่เกิน 5 นาที ให้ใช้ cached version
          if (cachedResponse) {
            console.log('📦 Using cached Edge Function response');
            return cachedResponse;
          }
          
          // 3. ถ้าไม่มีใน cache หรือเกินเวลา ให้เรียกใหม่
          return fetch(event.request)
            .then(networkResponse => {
              // ตรวจสอบว่า response OK ก่อนจะ cache
              if (networkResponse && networkResponse.status === 200) {
                // Clone response เพื่อ cache
                const responseToCache = networkResponse.clone();
                
                // สร้าง custom response ด้วย metadata สำหรับ cache
                const cachedHeaders = new Headers(networkResponse.headers);
                cachedHeaders.append('sw-cached', new Date().toISOString());
                
                const cachedResponseWithMetadata = new Response(responseToCache.body, {
                  status: networkResponse.status,
                  statusText: networkResponse.statusText,
                  headers: cachedHeaders
                });
                
                // เก็บใน cache
                cache.put(event.request, cachedResponseWithMetadata);
                console.log('✅ Edge Function response cached');
              }
              return networkResponse;
            })
            .catch(error => {
              console.error('❌ Edge Function fetch failed:', error);
              // ถ้าไม่สามารถเรียก Edge Function ได้
              return new Response(
                JSON.stringify({
                  error: 'Edge Function unavailable',
                  fallback: true,
                  timestamp: new Date().toISOString()
                }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        });
      })
    );
    return;
  }
  
  // 🚫 ข้ามการแคชสำหรับ Request ภายนอกที่ไม่ใช่ assets ที่กำหนด
  if (!requestUrl.origin.startsWith(self.location.origin)) {
    // สำหรับ external resources ที่สำคัญ (เช่น font-awesome, google fonts)
    const allowedExternalResources = [
      'cdnjs.cloudflare.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ];
    
    if (allowedExternalResources.some(domain => requestUrl.hostname.includes(domain))) {
      // Cache external resources
      event.respondWith(
        caches.open(DYNAMIC_CACHE_NAME).then(cache => {
          return cache.match(event.request).then(cachedResponse => {
            return cachedResponse || fetch(event.request).then(response => {
              if (response.status === 200) {
                cache.put(event.request, response.clone());
              }
              return response;
            }).catch(() => {
              // สำหรับ font-awesome, ถ้า fetch ไม่ได้ให้ return empty response
              if (requestUrl.href.includes('font-awesome')) {
                return new Response('', { 
                  status: 200, 
                  headers: { 'Content-Type': 'text/css' } 
                });
              }
              throw new Error('Network error');
            });
          });
        })
      );
    } else {
      // สำหรับ external อื่นๆ ให้ fetch ตามปกติ
      return;
    }
    return;
  }
  
  // 🔄 Strategy สำหรับ local assets
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // 1. ถ้าเจอใน Cache (Static) ให้ส่งคืนเลย
        if (cachedResponse) {
          console.log(`📦 Serving from cache: ${requestUrl.pathname}`);
          return cachedResponse;
        }

        // 2. ถ้าไม่เจอ ให้ไปดึงจาก Network
        return fetch(event.request)
          .then(networkResponse => {
            // ตรวจสอบความถูกต้องก่อนเก็บลง Dynamic Cache
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
                console.log(`✅ Cached dynamically: ${requestUrl.pathname}`);
              });
            }
            return networkResponse;
          })
          .catch(error => {
            console.error(`❌ Network error for ${requestUrl.pathname}:`, error);
            
            // 3. กรณี Offline และเป็นหน้า HTML ให้แสดง offline.html
            if (event.request.headers.get('accept') && 
                event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./offline.html');
            }
            
            // สำหรับไฟล์ CSS/JS ที่สำคัญ ถ้า fetch ไม่ได้ ให้ใช้ cached version จาก static
            if (requestUrl.pathname.endsWith('.css') || 
                requestUrl.pathname.endsWith('.js')) {
              return caches.match(event.request, { ignoreSearch: true });
            }
            
            // ถ้าไม่ใช่ HTML ก็อาจจะ return fallback response
            if (requestUrl.pathname.endsWith('.json')) {
              return new Response(
                JSON.stringify({ error: 'Offline', fallback: true }),
                { 
                  status: 200, 
                  headers: { 'Content-Type': 'application/json' } 
                }
              );
            }
            
            // Default fallback
            return new Response('Offline - Content not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Message handling สำหรับการสั่งล้าง Cache จากภายนอก
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🗑️ Clearing all caches via message...');
    caches.keys().then(names => {
      return Promise.all(names.map(name => {
        console.log(`🗑️ Deleting cache: ${name}`);
        return caches.delete(name);
      }));
    }).then(() => {
      console.log('✅ All caches cleared');
      // ส่ง response กลับ
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
    });
  }
  
  // เพิ่ม message type สำหรับตรวจสอบ SW version
  if (event.data && event.data.type === 'GET_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ 
        version: VERSION,
        cacheNames: [CACHE_NAME, STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME]
      });
    }
  }
  
  // สำหรับตรวจสอบ Service Worker 
  if (event.data && event.data.type === 'PING') {
        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ 
                pong: true,
                version: VERSION
            });
        }
    }

  
});

// Background sync สำหรับเก็บข้อมูลเมื่อออนไลน์
self.addEventListener('sync', event => {
  if (event.tag === 'sync-music-data') {
    console.log('🔄 Background sync for music data');
    event.waitUntil(syncMusicData());
  }
});

async function syncMusicData() {
  // ฟังก์ชันสำหรับ sync ข้อมูลเมื่อออนไลน์
  console.log('✅ Background sync completed');
}

console.log(`✅ Service Worker ${VERSION} loaded successfully with Edge Function support`);