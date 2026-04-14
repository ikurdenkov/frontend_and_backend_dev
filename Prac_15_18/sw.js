const CACHE_NAME = 'notes-app-v5';
const DYNAMIC_CACHE = 'notes-dynamic-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/content/home.html',
    '/content/about.html',
    '/icons/favicon.ico',
    '/icons/favicon-16x16.png',
    '/icons/favicon-32x32.png',
    '/icons/favicon-48x48.png',
    '/icons/favicon-64x64.png',
    '/icons/favicon-128x128.png',
    '/icons/favicon-256x256.png',
    '/icons/favicon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Стратегия: для статики cache-first, для динамического контента network-first
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    // Для запросов к content/ используем network-first
    if (url.pathname.startsWith('/content/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request).then(cached => cached))
        );
        return;
    }
    // Для всего остального cache-first
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

// Обработка push-уведомлений
self.addEventListener('push', event => {
    let data = { title: 'Новое уведомление', body: '', reminderId: null };
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }
    const options = {
        body: data.body,
        icon: '/icons/favicon-128x128.png',
        badge: '/icons/favicon-48x48.png',
        data: { reminderId: data.reminderId },
        actions: []
    };
    // Если есть reminderId, добавляем кнопку "Отложить"
    if (data.reminderId) {
        options.actions = [{ action: 'snooze', title: '⏰ Отложить на 5 минут' }];
    }
    event.waitUntil(self.registration.showNotification(data.title, options));
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', event => {
    event.notification.close();
    const action = event.action;
    const reminderId = event.notification.data.reminderId;
    if (action === 'snooze' && reminderId) {
        // Отправляем запрос на сервер для откладывания
        event.waitUntil(
            fetch(`/snooze?reminderId=${reminderId}`, { method: 'POST' })
                .then(response => {
                    if (response.ok) console.log('Напоминание отложено');
                })
                .catch(err => console.error('Ошибка откладывания:', err))
        );
    } else {
        // Обычный клик – открываем приложение
        event.waitUntil(clients.openWindow('/'));
    }
});