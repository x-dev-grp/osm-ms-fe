/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js');

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

let messagingReady = null;

function ensureMessaging() {
  if (messagingReady) {
    return messagingReady;
  }
  messagingReady = fetch('/assets/firebase-config.json')
    .then((res) => res.json())
    .then((cfg) => {
      if (!cfg?.projectId || !cfg?.apiKey || !cfg?.messagingSenderId || !cfg?.appId) {
        throw new Error('FCM web config missing in /assets/firebase-config.json');
      }
      firebase.initializeApp({
        apiKey: cfg.apiKey,
        authDomain: cfg.authDomain,
        projectId: cfg.projectId,
        storageBucket: cfg.storageBucket,
        messagingSenderId: cfg.messagingSenderId,
        appId: cfg.appId
      });
      const messaging = firebase.messaging();
      messaging.onBackgroundMessage((payload) => {
        const title = payload?.notification?.title || payload?.data?.title || 'ZitFlow';
        const body = payload?.notification?.body || payload?.data?.body || '';
        return self.registration.showNotification(title, {
          body,
          icon: '/assets/pwa/manifest-icon-192.maskable.png',
          badge: '/assets/pwa/manifest-icon-192.maskable.png',
          data: payload?.data || {}
        });
      });
      return messaging;
    })
    .catch((err) => {
      console.warn('[FCM SW] init failed', err);
      messagingReady = null;
      throw err;
    });
  return messagingReady;
}

self.addEventListener('push', (event) => {
  event.waitUntil(ensureMessaging().catch(() => undefined));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const route = event.notification?.data?.webRoute;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (route && 'navigate' in client) {
            client.navigate(route);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(route || '/');
      }
      return undefined;
    })
  );
});

ensureMessaging().catch(() => undefined);
