// Service Worker for INT Smart Triage AI 2.0 PWA
const CACHE_NAME = 'int-triage-v1.0.0';
const RUNTIME_CACHE = 'int-triage-runtime';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/public/theme.css',
    '/public/theme.js',
    '/public/shortcuts.js',
    '/public/onboarding.js',
    '/public/notifications.js',
    '/public/triage.js',
    '/public/analytics.html',
    '/public/client-history.html',
    '/public/kb-search.html',
    '/public/report-detail.html',
    '/public/advanced-analytics.html',
    '/public/modules/HistoryStats.js',
    '/public/data/kb.json',
    '/public/data/personas.json',
    '/src/supabaseClient.js',
    '/src/realtimeService.js',
    '/src/analyticsService.js',
    '/src/knowledgeBaseService.js',
    '/src/sentimentAnalysis.js',
    '/src/assignmentEngine.js',
    '/src/emailService.js'
];

self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch((error) => {
                console.error('Service Worker: Cache installation failed:', error);
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                        .map((name) => {
                            console.log('Service Worker: Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') {
        return;
    }

    if (url.origin === location.origin) {
        event.respondWith(cacheFirst(request));
    } else {
        event.respondWith(networkFirst(request));
    }
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.error('Service Worker: Fetch failed:', error);
        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
        });
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        throw error;
    }
}

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((name) => caches.delete(name))
                );
            })
        );
    }
});

self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');

    const data = event.data ? event.data.json() : {};
    const title = data.title || 'INT Smart Triage AI';
    const options = {
        body: data.body || 'New notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        data: data.url || '/',
        tag: data.tag || 'notification',
        requireInteraction: data.priority === 'high',
        actions: [
            {
                action: 'view',
                title: 'View'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow(event.notification.data)
        );
    }
});

self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered');

    if (event.tag === 'sync-reports') {
        event.waitUntil(syncReports());
    }
});

async function syncReports() {
    try {
        const cache = await caches.open(RUNTIME_CACHE);
        const requests = await cache.keys();

        const reportRequests = requests.filter(req =>
            req.url.includes('/api/triage-report')
        );

        const syncPromises = reportRequests.map(async (req) => {
            try {
                await fetch(req.clone());
                await cache.delete(req);
            } catch (error) {
                console.error('Service Worker: Sync failed for request:', error);
            }
        });

        await Promise.all(syncPromises);
        console.log('Service Worker: Background sync completed');
    } catch (error) {
        console.error('Service Worker: Background sync error:', error);
    }
}

console.log('Service Worker: Loaded');
