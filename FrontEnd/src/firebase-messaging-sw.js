importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyADrjo-2F2rKT6myT4BH9aLNRcipPUagc0",
  authDomain: "nepaldist-3c2b5.firebaseapp.com",
  projectId: "nepaldist-3c2b5",
  storageBucket: "nepaldist-3c2b5.firebasestorage.app",
  messagingSenderId: "698076186328",
  appId: "1:698076186328:web: b9fedc20c67d8c14b8b9ad"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('📩 Received background message:', payload);
  
  const notificationTitle = payload.notification?. title || 'New Notification';
  const notificationOptions = {
    body: payload. notification?.body || '',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    data: payload.data,
    requireInteraction: false
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  event.notification.close();
  
  const urlToOpen = event.notification. data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});