// Название кэша (при изменении файлов увеличивайте версию)
const CACHE_NAME = 'notes-cache-v2';

// Список ресурсов, которые будут закэшированы при установке
const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/icons/favicon.ico',
    '/icons/favicon-16x16.png',
    '/icons/favicon-32x32.png',
    '/icons/favicon-48x48.png',
    '/icons/favicon-64x64.png',
    '/icons/favicon-128x128.png',
    '/icons/favicon-256x256.png',
    '/icons/favicon-512x512.png'
];

// Установка: кэшируем все статические файлы
self.addEventListener('install', event => {
    console.log('[SW] Установка');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Кэширование ресурсов');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting()) // активируем нового воркера сразу
    );
});

// Активация: удаляем старые кэши
self.addEventListener('activate', event => {
    console.log('[SW] Активация');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('[SW] Удаляем старый кэш:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => self.clients.claim()) // начинаем управлять страницами
    );
});

// Перехват запросов: сначала ищем в кэше, потом идём в сеть (cache-first)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
            .catch(() => {
                // В крайнем случае можно вернуть fallback, но у нас все критичные файлы закэшированы
                console.warn('[SW] Нет сети и кэша для:', event.request.url);
            })
    );
});