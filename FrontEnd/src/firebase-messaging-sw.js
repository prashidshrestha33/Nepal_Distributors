importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyADrjo-2F2rKT6myT4BH9aLNRcipPUagc0",
  authDomain: "nepaldist-3c2b5.firebaseapp.com",
  projectId: "nepaldist-3c2b5",
  storageBucket: "nepaldist-3c2b5.firebasestorage.app",
  messagingSenderId: "698076186328",
  appId: "1:698076186328:web:b9fedc20c67d8c14b8b9ad"
});

const messaging = firebase.messaging();

mmessaging.onBackgroundMessage(function (payload) {
  console.log('[SW] Background message received:', payload);

  const title = payload.notification?.title || "New Notification";

  const options = {
    body: payload.notification?.body || "",
    data: {
      url: payload.data?.url || '/'
    },
    requireInteraction: true   // keeps popup visible until click
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (let client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(urlToOpen);
      })
  );
});
