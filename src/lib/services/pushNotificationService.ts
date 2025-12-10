import webPush from 'web-push'

// Initialize web-push with VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:support@bioelectric-tracker.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export class PushNotificationService {
  static async sendPushNotification(
    subscription: PushSubscription,
    title: string,
    message: string,
    options: {
      icon?: string
      badge?: string
      image?: string
      data?: any
      actions?: Array<{ action: string; title: string }>
    } = {}
  ) {
    try {
      const payload = JSON.stringify({
        title,
        message,
        icon: options.icon || '/icons/logo-192x192.png',
        badge: options.badge || '/icons/badge-72x72.png',
        image: options.image,
        data: {
          url: options.data?.url || '/dashboard/notifications',
          ...options.data
        },
        actions: options.actions || [
          {
            action: 'view',
            title: 'View Details'
          }
        ],
        timestamp: Date.now()
      })

      await webPush.sendNotification(subscription, payload)
      return true
    } catch (error) {
      console.error('Error sending push notification:', error)
      return false
    }
  }

  static generateVAPIDKeys() {
    return webPush.generateVAPIDKeys()
  }
}
