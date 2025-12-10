self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.message,
    icon: data.icon,
    badge: data.badge,
    image: data.image,
    data: data.data,
    actions: data.actions,
    tag: 'bioelectric-notification',
    renotify: true,
    requireInteraction: true,
    silent: false,
    timestamp: data.timestamp,
    vibrate: [100, 50, 100]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  // Analytics could be added here
});
