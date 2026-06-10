importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyD_Oxy7Hx8ray5bH-pg7xApsBXdxA08oEo",
  authDomain: "pushnotification-e8fcf.firebaseapp.com",
  projectId: "pushnotification-e8fcf",
  storageBucket: "pushnotification-e8fcf.firebasestorage.app",
  messagingSenderId: "792555782680",
  appId: "1:792555782680:web:c088c78d5a5adfa649b96d",
  measurementId: "G-2E1YFY5QFQ"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {

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
